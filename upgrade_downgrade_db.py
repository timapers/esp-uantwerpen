from src.models.db import get_db
from sys import argv

conn = get_db()
cursor = conn.get_cursor()
connection = conn.get_connection()

"""
I want that when I run this with command python3 upgrade_downgrade_db.py upgrade <filename> it will upgrade the database
"""

if len(argv) == 1:
    exit(0)

if argv[1] == "upgrade":
    with open("migrations/upgrades/" + argv[2], 'r') as file:
        sql = file.read()
    cursor.execute(sql)
    connection.commit()
    cursor.execute("REFRESH MATERIALIZED VIEW search_index;")
    connection.commit()

elif argv[1] == "downgrade":
    with open("migrations/upgrades" + argv[2], 'r') as file:
        sql = file.read()
    cursor.execute(sql)
    connection.commit()
    cursor.execute("REFRESH MATERIALIZED VIEW search_index;")
    connection.commit()
