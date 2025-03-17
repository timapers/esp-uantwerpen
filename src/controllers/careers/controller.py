"""@package
This package processes all routing requests.
"""


from flask import Blueprint, request, jsonify, render_template, current_app, send_from_directory, session
from flask_login import current_user
from src.models.internship import InternshipDataAccess
from src.models.company import CompanyDataAccess
from src.models.internship_registration import InternshipRegistration, InternshipRegistrationsDataAccess
from src.models.tag import TagDataAccess
from src.models.type import TypeDataAccess
from src.models.db import get_db
from werkzeug.utils import secure_filename
from datetime import date
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

@bp.route('/review-internship', methods=['POST'])
def review_internship():
    """
    Handles the POST request to review an internship.
    :return: Json with success/failure status.
    """
    if not current_user.is_authenticated or current_user.role != "admin":
        return jsonify({'success': False, 'message': 'Authentication required.'}), 401

    data = request.json
    internship_id = data.get('internship_id')
    approved = data.get('action')

    if not internship_id:
        return jsonify({'success': False, 'message': 'Internship ID is required.'}), 400

    connection = get_db()
    InternshipDataAccess(connection).review_internship(internship_id, approved)
    return jsonify({'success': True, 'message': 'Internship review updated successfully.'})

@bp.route('/add-internship-registration', methods=['POST'])
def add_registration():
    """
    Handles the POST request to '/project-editor'.
    :return: Json with success/failure status.
    """
    if current_user.is_authenticated and current_user.role == "student":
        try:
            internship_id = request.form['event']
            type = request.form['type']
            registration = InternshipRegistration(current_user.user_id, internship_id, type, "Pending", date=date.today().strftime("%Y-%m-%d"))
            InternshipRegistrationsDataAccess(get_db()).add_internship_registration(registration)

            internship = InternshipDataAccess(get_db()).get_internship(internship_id, False)
            if not internship.is_active:
                raise Exception()

            # msg = f"You registered for project {internship.title}!\n" \
            #     f"You'll be notified when one of the supervisors changes your registration status.\n" \
            #     f"Best of luck!"
            #
            # send_mail(current_user.user_id + "@ad.ua.ac.be", "ESP Registration", msg)
            #
            # msg_employees = f"Student {current_user.name} ({current_user.user_id}) has registered for your project {project.title}.\n" \
            #     f"To change the registration status please visit the ESP site." \

            # guides = GuideDataAccess(get_db()).get_guides_for_project(project_id)
            # employee_access = EmployeeDataAccess(get_db())
            # guides_with_info = [employee_access.get_employee(x.employee) for x in guides]
            #
            # for guide in guides_with_info:
            #     if guide.email:
            #         send_mail(guide.email, "ESP Registration", msg_employees)

            return jsonify({'success': True}), 200, {'ContentType': 'application/json'}
        except Exception as e:
            print(e, flush=True)
            return jsonify({'success': False, "message": "Failed to add a new registration!"}), 400, {
                'ContentType': 'application/json'}


@bp.route('/handle-internship-registration', methods=['POST'])
def handle_registration():
    """
    Handles the POST request to '/handle-registration'.
    :return: Json with success/failure status. / redirects to login
    """
    if current_user.is_authenticated and current_user.role == "admin":
        try:
            data = request.json

            InternshipRegistrationsDataAccess(get_db()).update_status(student=data['student_id'],
                                                                 internship=data['internship_id'],
                                                                 status=data['status'])

            internship_title = InternshipDataAccess(get_db()).get_internship(data['internship_id'], False).title
            # if data['status']:
            #     msg = f"Your registration for project {internship_title} has changed to {data['status']}.\n" \
            #         f"For questions or remarks please contact the supervisors of the project."
            #     send_mail(data['student_id'] + "@ad.ua.ac.be", "ESP Registration Update", msg)
        except Exception as e:
            return jsonify({'success': False, "message": "Failed to update registration!"}), 400, {
                'ContentType': 'application/json'}
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}

    else:
        return jsonify({'success': False, "message": "Failed to update registration!"}), 400, {
            'ContentType': 'application/json'}

@bp.route('/add-view/<int:e_id>', methods=['POST'])
def add_view(e_id):
    """
    Handles the POST request to '/add-view/<int:e_id>'.
    :param p_id: project id
    :return: Json with success/failure status
    """
    try:
        InternshipDataAccess(get_db()).add_view_count(e_id, 1)
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}
    except:
        print("Failed to count a view for project " + str(e_id) + ".")
        return ""