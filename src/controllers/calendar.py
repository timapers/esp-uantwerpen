from flask import Blueprint, render_template, request, abort, Markup, jsonify, current_app, send_from_directory
from flask_login import current_user
from bs4 import BeautifulSoup
import os
from werkzeug.utils import secure_filename
import pytz

bp = Blueprint('calendar', __name__)

@bp.route('/calendar', methods=['GET'])
def calendar():
    return render_template('calendar.html', new_user=request.args.get("new"))


from flask import Flask, Response, request, redirect, url_for
from ics import Calendar, Event
from datetime import datetime
import uuid

app = Flask(__name__)
LOCAL_TZ = pytz.timezone("Europe/Brussels")  # Set your local timezone here

def parse_ics_to_dict(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"The file at {file_path} does not exist.")

    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read().strip()
        events_dict = {}
        if content:
            calendar = Calendar(content)
            for event in calendar.events:
                events_dict[event.uid] = {
                    "uid": event.uid,
                    "name": event.name,
                    "start": event.begin,
                    "end": event.end,
                    "description": event.description,
                    "location": event.location,
                    "categories": event.categories,
                }
    return events_dict

file_path = "doc/events.ics"
# EVENTS = parse_ics_to_dict(file_path)

def update_events_from_file():
    global EVENTS
    try:
        EVENTS = parse_ics_to_dict(file_path)
    except FileNotFoundError:
        EVENTS = {}




# # Helper to generate ICS content
def generate_ics():
    c = Calendar()
    for event in EVENTS.values():
        e = Event()
        e.name = event["name"]
        e.begin = event["start"]
        e.end = event["end"]
        e.description = event.get("description", "")
        e.uid = str(event["uid"])
        e.categories = event.get("category", "").split(",") if event.get("category") else []
        e.location = event.get("location", "")
        c.events.add(e)
    return str(c)

@app.route("/calendar.ics")
def calendar_feed():
    ics_content = generate_ics()
    return Response(
        ics_content,
        mimetype="text/calendar",
        headers={
            "Content-Disposition": "attachment; filename=calendar.ics",
            "Cache-Control": "no-cache"
        }
    )


# # Endpoint to add an event
def add_calendar_event(data, id):
    uid = id

    start = LOCAL_TZ.localize(datetime.strptime(data["start_date"], "%Y-%m-%dT%H:%M"))
    end = LOCAL_TZ.localize(datetime.strptime(data["end_date"], "%Y-%m-%dT%H:%M"))
    EVENTS[uid] = {
        "uid": uid,
        "name": data["title"],
        "start": start,
        "end": end,
        "description": data['description'],
        "location": data["address"],
        "category": data["type"],
    }
    ics_content = generate_ics()
    with open(file_path, "w", encoding="utf-8") as ics_file:
        ics_file.write(ics_content)

    update_events_from_file()


@app.route("/calendar_events")
def get_events():
    """Return all events in JSON for FullCalendar"""
    return jsonify(list(EVENTS.values()))
#
# # Endpoint to delete an event
# def delete_calendar_event(uid):
#     if uid in EVENTS:
#         del EVENTS[uid]
#         return {"status": "deleted"}
#     return {"status": "not found"}, 404

if __name__ == "__main__":
    app.run(debug=True)
