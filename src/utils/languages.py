languages = [
    "en",
    "nl"
]

from src.models.translation import TranslationDataAccess, Translation
from src.models.db import get_db

connection = get_db()
language_dict = TranslationDataAccess(connection).get_all_translations_dict()


def get_text(key, language):
    if language not in languages \
            or not language_dict.get(key) \
            or not language_dict.get(key).get(language):
        return "None"

    return language_dict[key][language]



def add_to_dict(text, nl_text, en_text):
    TranslationDataAccess(connection).add_translation(Translation(text, en_text, nl_text))
    language_dict = TranslationDataAccess(connection).get_all_translations_dict()

