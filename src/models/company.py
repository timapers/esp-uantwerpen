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

    def get_company_by_name(self, name):
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT company_id, name, website FROM company WHERE name = %s', (name,))
        row = cursor.fetchone()
        if row is None:
            return None
        return Company(*row)

    def create_company(self, obj):
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('INSERT INTO company(name, website) VALUES(%s, %s)', (obj.name, obj.website))
            self.dbconnect.commit()
            cursor.execute('SELECT LASTVAL()')
            iden = cursor.fetchone()[0]
            obj.company_id = iden
            return obj
        except:
            self.dbconnect.rollback()
            raise