class Translation:
    def __init__(self, key, eng, dutch):
        self.key = key
        self.english = eng
        self.dutch = dutch

    def to_dict(self):
        dictionary = {}
        dictionary["key"] = {"en": self.english, "nl": self.dutch}
        return dictionary


class TranslationDataAccess:
    def __init__(self, dbconnect):
        self.dbconnect = dbconnect

    def get_translation(self, key):
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT key, english, dutch FROM translation WHERE key = %s', (key,))
        row = cursor.fetchone()
        if row:
            return Translation(row[0], row[1], row[2])
        else:
            return None

    def get_all_translations(self):
        cursor = self.dbconnect.get_cursor()
        cursor.execute('SELECT key, english, dutch FROM translation')
        translations = []
        for row in cursor:
            translations.append(Translation(row[0], row[1], row[2]))
        return translations

    def add_translation(self, translation):
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('INSERT INTO translation (key, english, dutch) VALUES (%s, %s, %s)',
                           (translation.key, translation.english, translation.dutch))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise

    def get_all_translations_dict(self):

        translations = self.get_all_translations()
        translation_dict = {}
        for translation in translations:
            translation_dict[translation.key] = {"en": translation.english, "nl": translation.dutch}
        return translation_dict

    def update_translation(self, string, translation):
        cursor = self.dbconnect.get_cursor()
        try:
            cursor.execute('UPDATE translation SET english = %s, dutch = %s, key = %s WHERE key = %s',
                           (translation.english, translation.dutch, translation.key, string))
            self.dbconnect.commit()
        except:
            self.dbconnect.rollback()
            raise