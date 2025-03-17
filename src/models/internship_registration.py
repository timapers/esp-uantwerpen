from datetime import date




class InternshipRegistration:
    def __init__(self, student, internship, type, status, date=None):
        self.student = student
        self.internship = internship
        self.type = type
        self.status = status
        if date:
            self.date = date
        else:
            self.date = date.today().strftime("%Y-%m-%d")


    def to_dict(self):
        return {
            'student': self.student,
            'internship': self.internship,
            'type': self.type,
            'status': self.status,
            'date': self.date
        }

class InternshipRegistrationsDataAccess:
    def __init__(self, dbconnect):
        self.dbconnect = dbconnect

    def add_internship_registration(self, internship_registration):
        cursor = self.dbconnect.get_cursor()
        cursor.execute(
            'INSERT INTO internship_registration (student, internship, type, status) VALUES (%s, %s, %s, %s)',
            (internship_registration.student, internship_registration.internship, internship_registration.type, internship_registration.status)
        )
        self.dbconnect.commit()
        cursor.close()

    def get_internship_registration(self, student, internship):
        cursor = self.dbconnect.get_cursor()
        cursor.execute(
            'SELECT * FROM internship_registration WHERE student = %s AND internship = %s',
            (student, internship)
        )
        result = cursor.fetchone()
        cursor.close()
        if result is None:
            return None
        return InternshipRegistration(result[0], result[1], result[2], result[3], result[4])

    def update_status(self, student, internship, status):
        cursor = self.dbconnect.get_cursor()
        cursor.execute(
            'UPDATE internship_registration SET status = %s WHERE student = %s AND internship = %s',
            (status, student, internship)
        )
        self.dbconnect.commit()
        cursor.close()

    def get_accepted_registrations(self, internship):
        cursor = self.dbconnect.get_cursor()
        cursor.execute(
            'SELECT student, internship, type, status, date FROM internship_registration WHERE internship = %s AND status = %s',
            (internship, 'accepted'))
        result = cursor.fetchall()
        cursor.close()
        return [InternshipRegistration(row[0], row[1], row[2], row[3], row[4]) for row in result]

    def get_all_registrations(self):
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT student, internship, type, status, date FROM internship_registration')
        result = cursor.fetchall()
        cursor.close()
        return [InternshipRegistration(row[0], row[1], row[2], row[3], row[4]) for row in result]

    def get_all_registrations_for_internship(self, internship):
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT student, internship, type, status, date FROM internship_registration WHERE internship = %s', (internship,))
        result = cursor.fetchall()
        cursor.close()
        return [InternshipRegistration(row[0], row[1], row[2], row[3], row[4]) for row in result]



