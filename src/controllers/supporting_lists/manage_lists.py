from src.models import ResearchGroupDataAccess, EmployeeDataAccess, ResearchGroup, Employee, \
    Type, TypeDataAccess, TagDataAccess, DocumentDataAccess, Document
from src.models.db import get_db
from src.controllers.profile import get_random_picture_location
from flask import jsonify
from flask_login import current_user


def manage(data):
    """
    Handles multiple types of data managing functions.
    :param data: data object containing an instruction
    :return: correct function call / Json with failure boolean and error message
    """
    manage_type = data.get("type")
    if manage_type == "add":
        return add_item(data)

    elif manage_type == "edit":
        return update_item(data)

    elif manage_type == "edit multiple":
        return update_multiple_employees(data)

    elif manage_type == "activation":
        return activation(data)

    else:
        return jsonify({'success': False, "message": "Incorrect type attribute"}), 400, {
            'ContentType': 'application/json'}


def add_item(data):
    """
    Handles addition functions.
    :param data: data object to be added
    :return: correct addition function call / Json with failure boolean and error message
    """
    obj_type = data.get("object")

    if obj_type == "research_group":
        return add_research_group(data)

    elif obj_type == "employee":
        return add_employee(data)

    elif obj_type == "type":
        return add_type(data)

    elif obj_type == "tag":
        return add_tag(data)

    elif obj_type == "promotor":
        return add_promotor(data)

    else:
        return jsonify({'success': False, "message": "Object type incorrect"}), 400, {'ContentType': 'application/json'}


def add_research_group(data):
    """
    Handles addition of research group.
    :param data: data object to be added
    :return: Json with success/failure status and error message
    """
    try:
        doc = Document(None, data["description"], data["description"])
        doc = DocumentDataAccess(get_db()).add_document(doc)
        dao = ResearchGroupDataAccess(get_db())
        group = ResearchGroup(data["name"], data["abbreviation"], None, doc.document_id,
                              data["address"], data["telephone_number"], True)
        dao.add_research_group(group)
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}

    except Exception as e:
        return jsonify({'success': False, "message": str(e)}), 400, {'ContentType': 'application/json'}


def add_employee(data):
    """
    Handles addition of employee.
    :param data: data object to be added
    :return: Json with success/failure status and error message
    """

    try:
        if not data['research_group']:
            data['research_group'] = None

        dao = EmployeeDataAccess(get_db())
        picture = get_random_picture_location()
        employee = Employee(data["name"], data["name"], data["email"], data["office"], data.get("extra_info"), picture,
                            data["research_group"], data["title"] if data.get("title") else None, data["is_external"], False, True)
        dao.add_employee(employee)
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}

    except Exception as e:
        return jsonify({'success': False, "message": str(e)}), 400, {'ContentType': 'application/json'}


def add_promotor(data):
    """
    Handles addition of promotor.
    :param data: data object to be added
    :return: Json with success/failure status and error message
    """
    try:
        dao = EmployeeDataAccess(get_db())
        employee = dao.get_employee_by_name(data["name"])
        employee.is_promotor = True
        dao.update_employee(employee)
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}

    except Exception as e:
        return jsonify({'success': False, "message": str(e)}), 400, {'ContentType': 'application/json'}


def add_type(data):
    """
    Handles addition of type.
    :param data: data object to be added
    :return: Json with success/failure status and error message
    """
    try:
        dao = TypeDataAccess(get_db())
        new_type = Type(data["string"], True)
        dao.add_type(new_type)
        from src.models.translation import TranslationDataAccess, Translation
        translationAccess = TranslationDataAccess(get_db())
        translationAccess.add_translation(Translation(data["string"], data["english"], data["dutch"]))
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}

    except Exception as e:
        return jsonify({'success': False, "message": str(e)}), 400, {'ContentType': 'application/json'}


def add_tag(data):
    """
    Handles addition of tag.
    :param data: data object to be added
    :return: Json with success/failure status and error message
    """
    try:
        dao = TagDataAccess(get_db())
        dao.add_tag(data["string"])
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}

    except Exception as e:
        return jsonify({'success': False, "message": str(e)}), 400, {'ContentType': 'application/json'}


def update_item(data):
    """
    Handles update functions.
    :param data: data object to be updated
    :return: correct update function call / Json with failure boolean and error message
    """

    obj_type = data.get("object")

    if obj_type == "research_group":
        return update_research_group(data)

    elif obj_type == "employee":
        return update_employee(data)

    elif obj_type == "type":
        return update_type(data)

    elif obj_type == "tag":
        return update_tag(data)

    else:
        return jsonify({'success': False, "message": "Object type incorrect"}), 400, {'ContentType': 'application/json'}


def update_research_group(data):
    """
    Handles update of research group.
    :param data: data object with new data
    :return: Json with success/failure status and error message
    """
    try:
        dao = ResearchGroupDataAccess(get_db())
        document_access = DocumentDataAccess(get_db())

        original = dao.get_research_group(data["key"])
        if original.description_id is None:
            doc = Document(None, data["description"], data["description"])
            doc = document_access.add_document(doc)
        else:
            doc = Document(original.description_id, data["description"], data["description"])
            DocumentDataAccess(get_db()).update_document(doc)

        group = ResearchGroup(data["name"], data["abbreviation"], None, doc.document_id,
                              data["address"], data["telephone_number"], data["is_active"])
        dao.update_research_group(data["key"], group)

        if data["contact_person"]:
            dao.set_contact_person(data["name"], data["contact_person"])

        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}

    except Exception as e:
        return jsonify({'success': False, "message": str(e)}), 400, {'ContentType': 'application/json'}


def update_employee(data):
    """
    Handles update of employee.
    :param data: data object with new data
    :return: Json with success/failure status and error message
    """
    try:
        if "is_admin" not in data:
            data["is_admin"] = "TRUE" if current_user.role == "admin" else "FALSE"

        if not data['research_group']:
            data['research_group'] = None

        dao = EmployeeDataAccess(get_db())
        employee = Employee(data["key"], data["name"], data["email"], data["office"], data["extra_info"], data["picture_location"],
                            data["research_group"], data["title"] if data["title"] else None, data["is_external"], data['is_admin'], data['is_active'])
        dao.update_employee(employee)
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}

    except Exception as e:
        return jsonify({'success': False, "message": str(e)}), 400, {'ContentType': 'application/json'}


def update_type(data):
    """
    Handles update of type.
    :param data: data object with new data
    :return: Json with success/failure status and error message
    """
    try:
        dao = TypeDataAccess(get_db())
        updated_type = Type(data["string"], True)
        dao.update_type(data["key"], updated_type)
        from src.models.translation import TranslationDataAccess, Translation
        translationAccess = TranslationDataAccess(get_db())
        translationAccess.update_translation(data["key"], Translation(data["string"], data["english"], data["dutch"]))
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}

    except Exception as e:
        return jsonify({'success': False, "message": str(e)}), 400, {'ContentType': 'application/json'}


def update_tag(data):
    """
    Handles update of tag.
    :param data: data object with new data
    :return: Json with success/failure status and error message
    """
    try:
        dao = TagDataAccess(get_db())
        dao.update_tag(data["key"], data["string"])
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}

    except Exception as e:
        return jsonify({'success': False, "message": str(e)}), 400, {'ContentType': 'application/json'}


def update_multiple_employees(data):
    """
    Handles update of multiple employees' data.
    :param data: data object with new data
    :return: Json with success/failure status and error message
    """
    try:
        dao = EmployeeDataAccess(get_db())

        for employee in data["items"]:
            dao.update_research_group(employee, data["research-group"])

        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}

    except Exception as e:
        return jsonify({'success': False, "message": str(e)}), 400, {'ContentType': 'application/json'}


def activation(data):
    """
    Handles activation of objects.
    :param data: data object with to be activated data
    :return: Json with success/failure status and error message
    """
    activate = data.get("activate")
    obj_type = data.get("object")

    if obj_type == "employees":
        dao = EmployeeDataAccess(get_db())

    elif obj_type == "groups":
        dao = ResearchGroupDataAccess(get_db())

    elif obj_type == "tags":
        dao = TagDataAccess(get_db())

    elif obj_type == "types":
        dao = TypeDataAccess(get_db())

    elif obj_type == "promotors":
        dao = EmployeeDataAccess(get_db())

    else:
        return jsonify({'success': False, "message": "Object type incorrect"}), 400, {'ContentType': 'application/json'}

    try:
        for elem in data["items"]:

            if obj_type == "tags":
                dao.remove_tag(elem)
            elif obj_type == "promotors":
                emp = dao.get_employee_by_name(elem)
                dao.set_promotor(emp.e_id, False)
            else:
                dao.set_active(elem, activate)

        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}

    except Exception as e:
        return jsonify({'success': False, "message": str(e)}), 400, {'ContentType': 'application/json'}
