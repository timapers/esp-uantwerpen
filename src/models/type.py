"""@package
This package enables the project type usage for the database.
"""


class Type:
    """
    This class defines the type of a project.
    e.g.: Master Thesis, Bachelor, Internship...
    """

    def __init__(self, type_name, active):
        """
        Type initializer.
        :param type_name: Type name
        :param active: Indicates whether type is active or not.
        """
        self.type_name = type_name
        self.is_active = active

    def to_dict(self):
        """
        Converts object to a dictionary.
        :return: Dictionary of the object data.
        """
        return vars(self)


class TypeDataAccess:
    """
    This class interacts with the Type component of the database.
    """

    def __init__(self, dbconnect):
        """
        Initiates the TypeDataAccess object.
        :param dbconnect: Connection to the database.
        """
        self.dbconnect = dbconnect

    def get_types(self, active_only):
        """
        Returns all types from the database.
        :param active_only: Only return active entities.
        :return: A list of type objects.
        """
        cursor = self.dbconnect.get_cursor()

        if active_only:
            cursor.execute('SELECT type_name, is_active FROM type WHERE is_active = TRUE')
        else:
            cursor.execute('SELECT type_name, is_active FROM type')

        return [Type(row[0], row[1]) for row in cursor]

    def get_project_types(self, active_only):
        cursor = self.dbconnect.get_cursor()
        if active_only:
            cursor.execute('SELECT DISTINCT project_has_type.type, type.is_active FROM project_has_type JOIN type ON project_has_type.type = type.type_name WHERE type.is_active = TRUE')
        else:
            cursor.execute('SELECT DISTINCT project_has_type.type, type.is_active FROM project_has_type JOIN type ON project_has_type.type = type.type_name')
        return [Type(row[0], row[1]) for row in cursor]

    def get_internship_types(self, active_only):
        cursor = self.dbconnect.get_cursor()
        if active_only:
            cursor.execute('SELECT DISTINCT internship_has_type.type, type.is_active FROM internship_has_type JOIN type ON internship_has_type.type = type.type_name WHERE type.is_active = TRUE')
        else:
            cursor.execute('SELECT DISTINCT internship_has_type.type, type.is_active FROM internship_has_type JOIN type ON internship_has_type.type = internship.type_name')
        return [Type(row[0], row[1]) for row in cursor]

    def add_type(self, obj):
        """
        Adds a type to the database.
        :param obj: The new type object.
        :raise: Exception if the database has to roll back.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('INSERT INTO type(type_name, is_active) VALUES(%s, %s)', (obj.type_name, obj.is_active))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise

    def remove_type(self, type_name):
        """
        Removes a type from the database.
        :param type_name: The type name.
        :raise: Exception if the database has to roll back.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('DELETE FROM type WHERE type_name=%s', (type_name,))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise

    def update_type(self, type_name, obj):
        """
        Updates a type in the database.
        :param type_name: Type identifier.
        :param obj: The updated type object.
        :raise: Exception if the database has to roll back.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('UPDATE type SET type_name = %s WHERE type_name = %s;', (obj.type_name, type_name))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise

    def set_active(self, type_name, active):
        """
        Sets the active status of a type in the database.
        :param type_name: Type identifier.
        :param active: The new active status of the type.
        :raise: Exception if the database has to roll back.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('UPDATE type SET is_active = %s WHERE type_name = %s;', (active, type_name))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise

    def if_exsists(self, type):
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT type_name FROM type WHERE type_name = %s', (type,))
        row = cursor.fetchone()
        if row:
            return True
        return False

    def update_internship_has_type(self, eid, type_name):
        """
        Updates the internship_has_type table with the given employee id and type name.
        :param eid: Employee ID.
        :param type_name: Type name to be associated with the employee.
        :raise: Exception if the database has to roll back.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('UPDATE internship_has_type set type = %s WHERE internship = %s;', (type_name, eid))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise
