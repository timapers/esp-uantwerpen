from platform import mac_ver


class Internship:
    """
    Internship model class
    """
    def __init__(self, in_id, title, max_students, description_id, company_id, view_count, creation_date, address, contact_person, is_active):

        self.internship_id = in_id
        self.title = title
        self.max_students = max_students
        self.description_id = description_id
        self.company_id = company_id
        self.view_count = view_count
        self.creation_date = creation_date
        self.address = address
        self.contact_person = contact_person
        self.is_active = is_active
        """
        Other tables
        """
        self.types = None
        self.tags = None

    def to_dict(self):
        return {
            'internship_id': self.internship_id,
            'title': self.title,
            'max_students': self.max_students,
            'description_id': self.description_id,
            'company_id': self.company_id,
            'view_count': self.view_count,
            'creation_date': self.creation_date,
            'address': self.address,
            'contact_person': self.contact_person,
            'is_active': self.is_active,
        }


class InternshipDataAccess:
    """
    This class interacts with the Internship component of the database.
    """
    def __init__(self, dbconnect):
        """
        Initialises the InternshipDataAccess object.
        :param dbconnect: The database connection.
        """
        self.dbconnect = dbconnect

    def get_internship_ids(self, active_only=False):
        """
        Fetches all the internship IDs from the database.
        :param active_only: Whether to fetch only active internships.
        :return: A list with the IDs of the internships.
        """
        cursor = self.dbconnect.get_cursor()
        if active_only:
            cursor.execute('SELECT internship_id FROM internship WHERE is_active = TRUE')
        else:
            cursor.execute('SELECT internship_id FROM internship')
        return [row[0] for row in cursor]

    def get_internships(self, active_only, details=False):
        """
        Fetches all the internships from the database.
        :param active_only: Fetch only active internships.
        :param details: Fetch all details of the internships.
        :return: A list with all the internship objects.
        """
        internships = list()
        for internship_id in self.get_internship_ids(active_only):
            internships.append(self.get_internship(internship_id, active_only))
        return internships


    def get_internship(self, internship_id, active_only):
        """
        Fetches an internship from the database.
        :param internship_id: The ID of the internship.
        :return: The internship object.
        """
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT internship_id, title, max_students, description_id, company_id, view_count, creation_date, address, contact_person, is_active FROM internship WHERE internship_id = %s', (internship_id,))
        row = cursor.fetchone()
        return Internship(*row)

    def get_internships_by_company(self, company_id):
        """
        Fetches all the internships from the database by company.
        :param company_id: The ID of
        :return: A list with all the internship objects.
        """
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT internship_id, title, max_students, description_id, company_id, view_count, creation_date, address, contact_person, is_active FROM internship WHERE company_id = %s', (company_id,))
        internships = list()
        for row in cursor:
            internships.append(Internship(*row))
        return internships

    def add_internship(self, obj):
        """
        Adds an internship to the database.
        :param obj: The new internship object.
        :raise: Exception if the database has to roll back.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('INSERT INTO internship(title, max_students, description_id, company_id, view_count, creation_date, address, contact_person, is_active) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s)',
                           (obj.title, obj.max_students, obj.description_id, obj.company_id, obj.view_count, obj.creation_date, obj.address, obj.contact_person, obj.is_active))
            cursor.execute('SELECT LASTVAL()')
            iden = cursor.fetchone()[0]
            obj.internship_id = iden
            self.dbconnect.commit()
            return obj
        except:
            self.dbconnect.rollback()
            raise

    def add_type(self, internship_id, internship_type):
        """
        Adds a type to the internship.
        :param internship_id: The ID of the internship.
        :param internship_type: The type to add.
        :raise: Exception if the database has to roll back.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('INSERT INTO internship_has_type(internship, internship_type) VALUES(%s,%s)', (internship_id, internship_type))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise

    def add_internship_tag(self, internship_id, tag):
        """
        Adds a tag to the internship.
        :param internship_id: The ID of the internship.
        :param tag: The tag to add.
        :raise: Exception if the database has to roll back.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('INSERT INTO internship_has_tag(internship, tag) VALUES(%s,%s)', (internship_id, tag))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise

    def set_internship_active(self, internship_id, active):
        """
        Sets the active status of an internship.
        :param internship_id: The ID of the internship.
        :param active: The new active status.
        :raise: Exception if the database has to roll back.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('UPDATE internship SET is_active = %s WHERE internship_id = %s', (active, internship_id))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise

    def remove_internship(self, internship_id):
        """
        Removes an internship from the database.
        :param internship_id: The ID of the internship.
        :raise: Exception if the database has to roll back.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('DELETE FROM internship WHERE internship_id = %s', (internship_id,))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise

    def remove_internship_tags(self, internship_id):
        """
        Removes all tags from an internship.
        :param internship_id: The ID of the internship.
        :raise: Exception if the database has to roll back.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('DELETE FROM internship_has_tag WHERE internship = %s', (internship_id,))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise

    def remove_internship_types(self, internship_id):
        """
        Removes all types from an internship.
        :param internship_id: The ID of the internship.
        :raise: Exception if the database has to roll back.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('DELETE FROM internship_has_type WHERE internship = %s', (internship_id,))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise

    def remove_internship_tag(self, internship_id, tag):
        """
        Removes a tag from an internship.
        :param internship_id: The ID of the internship.
        :param tag: The tag to remove.
        :raise: Exception if the database has to roll back.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('DELETE FROM internship_has_tag WHERE internship = %s AND tag = %s', (internship_id, tag))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise

    def remove_internship_type(self, internship_id, internship_type):
        """
        Removes a type from an internship.
        :param internship_id: The ID of the internship.
        :param internship_type: The type to remove.
        :raise: Exception if the database has to roll back.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('DELETE FROM internship_has_type WHERE internship = %s AND internship_type = %s', (internship_id, internship_type))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise

    def add_view_count(self, internship_id, amount):
        """
        Adds a view count to an internship.
        :param internship_id: The ID of the internship.
        :param amount: The amount to add.
        :raise: Exception if the database has to roll back.
        """
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT view_count FROM internship WHERE internship_id = %s', (internship_id,))
        view_count = cursor.fetchone()[0] + amount
        try:
            cursor.execute('UPDATE internship SET view_count = view_count + %s WHERE internship_id = %s', (view_count, internship_id))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise