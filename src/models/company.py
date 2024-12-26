from compileall import compile_dir
from time import clock_settime


class Company:
    def __init__(self, company_id, name, website, contact_email, contact_person):
        self.company_id = company_id
        self.name = name
        self.website = website


class CompanyDataAccess:
    def __init__(self, dbconnect):
        self.dbconnect = dbconnect

    def get_companies(self):
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT company_id, name, website, contact_email, contact_person FROM company')
        companies = list()
        for row in cursor:
            company = Company(row[0], row[1], row[2], row[3], row[4])
            companies.append(company)
        return companies

    def get_company(self, company_id):
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT company_id, name, website, contact_email, contact_person FROM company WHERE company_id = %s', (company_id,))
        row = cursor.fetchone()
        return Company(row[0], row[1], row[2], row[3], row[4])

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
        cursor.execute('SELECT contact_person_id, company_id, name, email, phone_number FROM contact_person_company')
        contact_person_companies = list()
        for row in cursor:
            contact_person_company = Contact_person_company(row[0], row[1], row[2], row[3], row[4])
            contact_person_companies.append(contact_person_company)
        return contact_person_companies

    def get_contact_person_company(self, contact_person_id):
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT contact_person_id, company_id, name, email, phone_number FROM contact_person_company WHERE contact_person_id = %s', (contact_person_id,))
        row = cursor.fetchone()
        return Contact_person_company(row[0], row[1], row[2], row[3], row[4])