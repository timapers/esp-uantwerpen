import ssl
from ldap3 import Server, Connection, Tls, ALL, ObjectDef, Reader
from src.controllers.auth.user import User
from src.controllers.auth.config import config_data
from flask import g
from src.models import StudentDataAccess, Student, EmployeeDataAccess, Employee
from src.models.db import get_db
from src.controllers.profile import get_random_picture_location


def _make_tls():
    """
    Create a ldap3.Tls object according to config.
    By default, certificate validation is enabled. In dev mode (config_data['dev'] == True)
    we disable validation to avoid certificate issues.
    """
    validate_mode = ssl.CERT_REQUIRED
    if config_data.get('dev', False):
        validate_mode = ssl.CERT_NONE
    return Tls(validate=validate_mode)


def get_server():
    """
    :return: ldap3 Server object (cached on flask.g)
    Supports both LDAPS (use_ssl=True) and StartTLS (use_ssl=False + tls) for servers like ldaptls.uantwerpen.be.
    """
    srv_name = config_data['server']

    # Cache key so different server types don't clash
    cache_key = f"ldap_server:{srv_name}"

    if cache_key in g:
        return g[cache_key]

    # Decide whether to use StartTLS:
    # - If server hostname contains 'ldaptls' (specific to uantwerpen StartTLS),
    # - or if config_data explicitly asks for start_tls = True
    use_start_tls = ('ldaptls' in srv_name.lower()) or config_data.get('start_tls', False)

    if use_start_tls:
        # StartTLS: server with use_ssl=False but with a Tls object
        server = Server(srv_name, use_ssl=False, get_info=ALL, tls=_make_tls())
    else:
        # LDAPS (implicit SSL) — old behaviour
        server = Server(srv_name, use_ssl=True, get_info=ALL)

    # store in g under cache_key
    g[cache_key] = server
    return server


def bind_connection(user_id: str, password: str):
    """
    Create and bind an ldap3 Connection for the given credentials.
    Handles StartTLS if the server is configured for it.
    Returns a bound Connection on success, or raises the exception on failure.
    Caller should unbind() the connection when finished.
    """
    server = get_server()
    user_dn = user_id + config_data.get('suffix', '')

    # create connection without auto_bind, so we can control start_tls if needed
    conn = Connection(server, user=user_dn, password=password, auto_bind=False)

    try:
        # Open the transport (socket)
        conn.open()

        # If the Server has a tls object and use_ssl is False, assume StartTLS is required
        # (this covers the ldaptls.uantwerpen.be case).
        server_has_starttls = getattr(server, 'tls', None) is not None and not getattr(server, 'ssl', False)
        if server_has_starttls:
            # perform StartTLS before binding
            conn.start_tls()

        # Now bind (authenticate)
        if not conn.bind():
            # bind failed, raise to let caller handle it
            raise Exception(f"LDAP bind failed: {conn.last_error}")

        return conn

    except Exception:
        # ensure socket is closed on failure
        try:
            conn.unbind()
        except Exception:
            pass
        raise


def check_credentials(user_id, password):
    """
    :param user_id: student number or employee identification
    :param password: the user password
    :return: Boolean indicating if the credentials are correct
    """
    if config_data.get('dev', False):
        return True

    try:
        conn = bind_connection(user_id, password)
        # if bind succeeded, unbind and return True
        conn.unbind()
        return True
    except Exception:
        return False


def get_user(user_id: str, password: str = None):
    """
    Returns the User with the given user_id
    First it's checked in the DB (doesn't check the password)
    If not found there, a query to the ldap is used to gather the information.
    If the password is correct, the data will be retrieved and added to the DB.
    :param user_id: student number or employee identification
    :param password: the user password
    :return: User object
    """

    # Check if it's an employee
    employee_access = EmployeeDataAccess(get_db())
    try:
        employee = employee_access.get_employee(user_id)
        return User(user_id, employee.name, 'admin' if employee.is_admin else 'employee', False)
    except Exception:
        pass

    # Check if it's a student
    student_access = StudentDataAccess(get_db())
    try:
        student = student_access.get_student(user_id)
        return User(user_id, student.name, 'student', False)
    except Exception:
        pass

    if password is None:
        return None

    return new_person(user_id, password)


def new_person(user_id, password):
    """
    Person is added to the DB with the data retrieved from LDAP
    :param user_id: student number or employee identification
    :param password: the user password
    :return: None if nothing found, else the new User
    """
    # Make a search request to LDAP
    person = search_person(user_id, password)

    if person is None:
        return None

    # determine type from distinguishedName
    dn_value = ''
    try:
        dn_value = person['distinguishedName'].value or ''
    except Exception:
        dn_value = ''

    if 'student' in dn_value.lower():
        # Make new student
        name = person['displayName'].value
        student = Student(name, user_id)
        StudentDataAccess(get_db()).add_student(student)
        return User(user_id, name, 'student', False)

    else:
        # Make new employee
        name = person['displayName'].value
        email = person['mail'].value if 'mail' in person else None
        office = person['physicalDeliveryOfficeName'].value if 'physicalDeliveryOfficeName' in person else None
        picture = get_random_picture_location()

        employee = Employee(user_id, name, email, office, None, picture, None, None, False, False, True, False)
        EmployeeDataAccess(get_db()).add_employee(employee)
        return User(user_id, name, 'employee', True)


def search_person(user_id, password):
    """
    Searches a person in LDAP
    :param user_id: student number or employee identification
    :param password: the user password
    :return: ldap3 Entry (from Reader) of the person, None if not found
    """
    conn = None
    try:
        # Bind with provided credentials (this will perform StartTLS if needed)
        conn = bind_connection(user_id, password)

        # Search (with Reader so injection attack cannot happen)
        definition = ObjectDef(['organizationalPerson', 'person'], conn)
        reader = Reader(
            conn,
            object_def=definition,
            base='ou=UA-Users,dc=ad,dc=ua,dc=ac,dc=be',
            query=f'(sAMAccountName={user_id})'
        )
        entries = reader.search()

        if len(entries) == 0:
            return None

        return entries[0]

    finally:
        if conn is not None:
            try:
                conn.unbind()
            except Exception:
                pass


if __name__ == '__main__':
    pass
