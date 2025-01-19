from compileall import compile_dir
from time import clock_settime


class Company:
    def __init__(self, company_id, name, website):
        self.company_id = company_id
        self.name = name
        self.website = website

    def to_dict(self):
        return {
            'company_id': self.company_id,
            'name': self.name,
            'website': self.website
        }

class CompanyDataAccess:
    def __init__(self, dbconnect):
        self.dbconnect = dbconnect

    def get_companies(self):
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT company_id, name, website FROM company')
        companies = list()
        for row in cursor:
            company = Company(*row)
            companies.append(company)
        return companies

    def get_company(self, company_id):
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT company_id, name, website FROM company WHERE company_id = %s', (company_id,))
        row = cursor.fetchone()
        return Company(*row)

    def get_company_name(self, company_id):
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT name FROM company WHERE company_id = %s', (company_id,))
        row = cursor.fetchone()
        return row[0]

    def get_all_company_names(self):
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT name FROM company')
        companies = list()
        for row in cursor:
            companies.append(row[0])
        return companies

class Contact_person_company:
    def __init__(self, contact_person_id, company_id, name, email):
        self.contact_person_id = contact_person_id
        self.company_id = company_id
        self.name = name
        self.email = email

class Contact_person_companyDataAccess:
    def __init__(self, dbconnect):
        self.dbconnect = dbconnect

    def get_contact_person_companies(self):
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT contact_person_id, company_id, name, email FROM contact_person_company')
        contact_person_companies = list()
        for row in cursor:
            contact_person_company = Contact_person_company(*row)
            contact_person_companies.append(contact_person_company)
        return contact_person_companies

    def get_contact_person_company(self, contact_person_id):
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT contact_person_id, company_id, name, email FROM contact_person_company WHERE contact_person_id = %s', (contact_person_id,))
        row = cursor.fetchone()
        return Contact_person_company(*row)

