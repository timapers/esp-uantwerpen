class Contact_person_company:
    def __init__(self, contact_person_id, name, email):
        self.contact_person_id = contact_person_id
        self.name = name
        self.email = email


class Contact_person_companyDataAccess:
    def __init__(self, dbconnect):
        self.dbconnect = dbconnect

    def get_contact_person_companies(self):
        """
        Fetches all contact persons from the database.
        """
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT contact_person_id, name, email FROM contact_person_company')
        contact_person_companies = list()
        for row in cursor:
            contact_person_company = Contact_person_company(row[0], row[1], row[2])
            contact_person_companies.append(contact_person_company)
        return contact_person_companies

    def get_contact_person_company(self, contact_person_id):
        """
        Fetches a contact person from the database.
        """
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT contact_person_id, name, email FROM contact_person_company WHERE contact_person_id = %s', (contact_person_id,))
        row = cursor.fetchone()
        return Contact_person_company(row[0], row[1], row[2])

    def add_contact_person_company(self, obj):
        """
        Adds a contact person to the database.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('INSERT INTO contact_person_company(name, email) VALUES(%s,%s)',
                           (obj.name, obj.email))

            # get id and return updated object
            cursor.execute('SELECT LASTVAL()')
            iden = cursor.fetchone()[0]
            obj.contact_person_id = iden

            self.dbconnect.commit()
            return obj
        except:
            self.dbconnect.rollback()
            raise

    def update_contact_person_company(self, obj):
        """
        Updates a contact person in the database.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('UPDATE contact_person_company SET name = %s, email = %s WHERE contact_person_id = %s',
                           (obj.name, obj.email, obj.contact_person_id))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise

    def delete_contact_person_company(self, contact_person_id):
        """
        Deletes a contact person from the database.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('DELETE FROM contact_person_company WHERE contact_person_id = %s', (contact_person_id,))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise

    def get_contact_person_companies_by_company(self, company_id):
        """
        Fetches all contact persons from the database by company.
        """
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT contact_person_id FROM company_has_contact_person WHERE company_id = %s', (company_id,))
        contact_person_companies = list()
        for row in cursor:
            contact_person_companies.append(self.get_contact_person_company(row[0]))
        return contact_person_companies

    def add_contact_person_company_to_company(self, contact_person_id, company_id):
        """
        Adds a contact person to a company.
        """
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('INSERT INTO company_has_contact_person(company_id, contact_person_id) VALUES(%s,%s)',
                           (company_id, contact_person_id))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise

    def get_contact_person_by_email(self, email):
        """
        Fetchs the contact person by email.
        """
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT contact_person_id, name, email FROM contact_person_company WHERE email = %s', (email,))
        row = cursor.fetchone()
        if row is None:
            return None
        return Contact_person_company(row[0], row[1], row[2])

    def link_comp_to_person(self, comp_id, person_id):
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('INSERT INTO company_has_contact_person(company_id, contact_person) VALUES(%s,%s)',
                           (comp_id, person_id))
            self.dbconnect.commit()
        except Exception as e:
            self.dbconnect.rollback()
            print(e)
            raise

    def if_exsists(self, comp_id, cp_id):
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT * FROM company_has_contact_person WHERE company_id = %s AND contact_person = %s',
                       (comp_id, cp_id))
        if cursor.fetchone() is None:
            return False
        return True