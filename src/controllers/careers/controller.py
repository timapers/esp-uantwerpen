"""@package
This package processes all routing requests.
"""


from flask import Blueprint, request, jsonify, render_template, current_app, send_from_directory, session
from flask_login import current_user
from src.models.internship import InternshipDataAccess
from src.models.company import CompanyDataAccess
from src.models.tag import TagDataAccess
from src.models.type import TypeDataAccess
from src.models.db import get_db
from werkzeug.utils import secure_filename
import os
bp = Blueprint('careers', __name__)


@bp.route('/careers', methods=["GET", "POST"])
def careers(my_internships=False):
    if request.method == "GET":
        return render_template('career.html', internships=my_internships)



@bp.route('/get-all-events-data', methods=['GET'])
def get_all_internships_data():
    """
    Handles the GET request to fetch all internships data.
    :return: JSON containing all internship data.
    """
    connection = get_db()
    active_only = True  # Fetch only active internships
    if not current_user.is_authenticated or current_user.role != "admin":
        internships = InternshipDataAccess(connection).get_internships(active_only, reviewed_only=True)
    else:
        internships = InternshipDataAccess(connection).get_internships(active_only, reviewed_only=False)
    return jsonify([internship.to_dict() for internship in internships])

@bp.route('/like-internship', methods=['POST'])
def like_internship():
    """
    Handles the POST request to like an internship.
    :return: JSON with success/failure status.
    """
    if not current_user.is_authenticated:
        return jsonify({'success': False, 'message': 'Authentication required.'}), 401

    data = request.json
    internship_id = data.get('internship_id')

    if not internship_id:
        return jsonify({'success': False, 'message': 'Internship ID is required.'}), 400

    connection = get_db()
    InternshipDataAccess(connection).like_internship(current_user.user_id, internship_id)
    return jsonify({'success': True})

@bp.route('/unlike-internship', methods=['POST'])
def unlike_internship():
    """
    Handles the POST request to unlike an internship.
    :return: JSON with success/failure status.
    """
    if not current_user.is_authenticated:
        return jsonify({'success': False, 'message': 'Authentication required.'}), 401

    data = request.json
    internship_id = data.get('internship_id')

    if not internship_id:
        return jsonify({'success': False, 'message': 'Internship ID is required.'}), 400

    connection = get_db()
    InternshipDataAccess(connection).unlike_internship(current_user.user_id, internship_id)
    return jsonify({'success': True})

# @bp.route('/get-event/<int:event_id>', methods=['GET'])
# def get_internship_data(event_id):
#     """
#     Fetches data for a specific internship.
#     :param internship_id: ID of the internship.
#     :return: JSON containing internship details.
#     """
#     connection = get_db()
#     internship = InternshipDataAccess(connection).get_internship(event_id)
#
#     if not internship:
#         return jsonify({'success': False, 'message': 'Internship not found.'}), 404
#
#     return jsonify(internship.to_dict())

@bp.route('/events-page-additional', methods=['GET'])
def get_events_page_additional_data():
    """
    Provides additional metadata for the internships page, such as companies, tags, and types.
    :return: JSON containing metadata.
    """
    connection = get_db()
    active_only = True

    companies = CompanyDataAccess(connection).get_all_company_names()

    tags = TagDataAccess(connection).get_tags()
    types = TypeDataAccess(connection).get_types(active_only)

    # contact_person = Contact_person_companyDataAccess(connection).get_contact_person_companies()

    result = {
        "companies": [company for company in companies],
        # "tags": [tag for tag in tags],
        "types": [type.type_name for type in types],
        # "contact_person": [contact_person for contact_person in contact_person]
    }
    return jsonify(result)

@bp.route('/add-view-internship/<int:internship_id>', methods=['POST'])
def add_view_to_internship(internship_id):
    """
    Increments the view count for an internship.
    :param internship_id: ID of the internship.
    :return: JSON with success/failure status.
    """
    try:
        InternshipDataAccess(get_db()).add_view_count(internship_id, 1)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@bp.route('/event-page')
def event_page():
    """
    Increases link strength upon a click.
    :return: render project page
    """
    return render_template('event.html')


@bp.route('/save-attachment', methods=['POST'])
def save_attachment():
    """
    Handles the POST request to '/save-attachment'.
    :return: Json with success/failure status, file name and file location.
    """
    if 'file' not in request.files:
        return jsonify({'success': False}), 400, {'ContentType': 'application/json'}

    file = request.files['file']

    if file.filename == '':
        return jsonify({'success': False}), 400, {'ContentType': 'application/json'}

    filename = secure_filename(file.filename)
    upload_dir = os.path.join(current_app.config['file-storage'], 'attachments')

    if not os.path.isdir(upload_dir):
        os.mkdir(upload_dir)

    # Make sure no files get overwritten
    while filename in os.listdir(upload_dir):
        filename = "1" + filename

    file.save(os.path.join(upload_dir, filename))

    return jsonify({'success': True, 'name': file.filename, 'file_location': filename}), 200, {
        'ContentType': 'application/json'}

@bp.route('/get-attachment/<path:filename>')
def get_attachment(filename):
    """
    Fetches attachment from given filename.
    :param filename: file name
    :return: Json with success/failure status / attachment
    """
    if secure_filename(filename):
        return send_from_directory(os.path.join(current_app.config['file-storage'], 'attachments'), filename)
    return jsonify({'success': False}), 400, {'ContentType': 'application/json'}

@bp.route('/get-all-event-data/<int:e_id>', methods=['GET'])
def get_all_event_data(e_id):
    """
    Handles the GET request to '/get-all-event-data/<int:p_id>'.
    :param e_id: event id
    :return: Json with all project data, the research group and links.
    """
    active_only = not session["archive"]
    event_access = InternshipDataAccess(get_db())
    e_data = event_access.get_internship(e_id, active_only)

    # if current_user.is_authenticated:
    #     is_company = event_access.is_company(e_id, current_user.user_id)
    # else:
    #     is_company = False

    # if current_user.is_authenticated and current_user.role == "student":
    #     e_data.liked = LikeDataAccess(get_db()).is_liked(e_data.project_id, current_user.user_id)

    # Add linked projects
    # linked_projects = LinkDataAccess(get_db()).get_links_for_project(p_id)
    # linked_projects_data = set()
    # for link in linked_projects:
    #     linked_project = event_access.get_project(link.project_2, active_only)
    #     if len(linked_projects_data) >= 4:
    #         break
    #     if not linked_project.is_active:
    #         continue
    #     linked_projects_data.add(linked_project)

    # Fill linked projects list with most viewed projects
    # if len(linked_projects_data) < 4:
    #     projects_most_views = event_access.get_most_viewed_projects(8, active_only)
    #     if len(projects_most_views) >= 4:
    #         i = 0
    #         while len(linked_projects_data) < 4:
    #             if not projects_most_views[i].project_id == p_id:
    #                 linked_projects_data.add(projects_most_views[i])
    #             i += 1

    # try:
    #     research_group = ResearchGroupDataAccess(get_db()).get_research_group(e_data.research_group).to_dict()
    # except:
    #     research_group = None

    print(e_data.to_dict(), flush=True)
    return jsonify({"event_data": e_data.to_dict()})


@bp.route('/create_event', methods=['GET', 'POST'])
def create_event():
    """
    Handles the GET and POST requests to '/create_event'.
    :return: Json with success/failure status.
    """
    if request.method == 'GET':
        return render_template('create_event.html')

    data = request.json
    connection = get_db()
    event_access = InternshipDataAccess(connection)

    try:
        event_access.create_event(data)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@bp.route('/create_internship', methods=['GET', 'POST'])
def create_internship():
    if request.method == 'GET':
        return render_template('create_internship.html')

    data = request.form
    connection = get_db()
    event_access = InternshipDataAccess(connection)

    try:
        event_access.create_internship(data)
        return render_template('create_internship.html', success=True)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400