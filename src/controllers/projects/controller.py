"""@package
This package processes all routing requests.
"""

from flask_login import current_user
from flask import render_template, Blueprint, request, jsonify, session, current_app, \
    send_from_directory, send_file
from src.controllers.projects.manage_projects import manage
from src.models import TypeDataAccess, ProjectDataAccess, EmployeeDataAccess, ResearchGroupDataAccess, \
    GuideDataAccess, Like, Registration, RegistrationDataAccess, LikeDataAccess, \
    LinkDataAccess, ClickDataAccess, DocumentDataAccess
from src.models.db import get_db
from datetime import datetime
import os
import src.controllers.projects.tools
from src.controllers.projects.recommendations import get_projects_with_recommendations
from werkzeug.utils import secure_filename
from src.utils.mail import send_mail
from src.config import config_data
import xlsxwriter

bp = Blueprint('projects', __name__)


@bp.route('/projects', methods=["GET", "POST"])
def projects(my_projects=False):
    """
    Handles the GET & POST request to '/projects'.
    GET: requests to render page
    POST: request to edit project with sent data
    :return: render projects page / Json containing authorisation error / manage(data) function call
    """
    if request.method == "GET":
        return render_template('projects.html', my_projects=my_projects)
    else:
        if not current_user.is_authenticated or (current_user.role != "admin" and current_user.role != "employee"):
            return jsonify(
                {'success': False, "message": "You are not authorized to edit the selected projects"}), 400, {

                       'ContentType': 'application/json'}
        data = request.json

        for project in data["projects"]:
            if current_user.role != "admin" and not employee_authorized_for_project(current_user.name, project):
                return jsonify(
                    {'success': False, "message": "You are not authorized to edit the selected projects"}), 400, {
                           'ContentType': 'application/json'}

        return manage(data)


@bp.route('/my-projects', methods=["GET", "POST"])
def my_projects():
    return projects(True)


@bp.route('/copy-projects', methods=["POST"])
def copy_projects():
    """
    Handles the POST request to copy projects
    """
    data = request.json

    if not current_user.is_authenticated or (current_user.role != "admin" and current_user.role != "employee"):
        return jsonify(
            {'success': False, "message": "You are not authorized to edit the selected projects"}), 400, {
                   'ContentType': 'application/json'}

    document_access = DocumentDataAccess(get_db())
    project_access = ProjectDataAccess(get_db())
    guide_access = GuideDataAccess(get_db())

    success = []
    errors = []

    for p_id in data["projects"]:
        project = project_access.get_project(p_id, False)

        if current_user.role != "admin" and not employee_authorized_for_project(current_user.name, p_id):
            errors.append("%s: You are not authorized to copy this project" % project.title)
            continue

        # Copy description
        doc_id = document_access.copy_document(project.description_id)

        # Copy project info
        new_id = project_access.copy_project(p_id, doc_id)

        # Copy employee info
        guides = guide_access.get_guides_for_project(p_id)
        for guide in guides:
            guide.project = new_id
            guide_access.add_guide(guide)

        # Copy type info
        for p_type in project.types:
            project_access.add_type(new_id, p_type)

        # Copy tag info
        for p_tag in project.tags:
            project_access.add_project_tag(new_id, p_tag)

        success.append("%s: Successfully copied" % project.title)

    if len(errors) == 0:
        return jsonify({'success': True, "message": "<br>".join(success)}), 200, {'ContentType': 'application/json'}
    else:
        return jsonify(
            {'success': False, "message": "<br>".join(errors) + "<br><br>" + "<br>".join(success)}), 400, {
                   'ContentType': 'application/json'}


@bp.route('/delete-projects', methods=["POST"])
def remove_project():
    """
    Handles the POST request to remove projects without student registrations
    """
    data = request.json

    if not current_user.is_authenticated or (current_user.role != "admin" and current_user.role != "employee"):
        return jsonify(
            {'success': False, "message": "You are not authorized to remove the selected projects"}), 400, {
                   'ContentType': 'application/json'}

    document_access = DocumentDataAccess(get_db())
    project_access = ProjectDataAccess(get_db())
    guide_access = GuideDataAccess(get_db())

    success = []
    errors = []

    for p_id in data["projects"]:
        project = project_access.get_project(p_id, False)

        if current_user.role != "admin" and not employee_authorized_for_project(current_user.name, p_id):
            errors.append("%s: You are not authorized to remove this project" % project.title)
            continue

        # Only remove projects without student registrations
        registration_present = False
        if len(project.registrations) > 0:
            for reg in project.registrations:
                if reg['status'] == "Pending" or reg['status'] == "Accepted":
                    registration_present = True
                    break

        if not registration_present:
            # Delete project
            project_access.remove_project(p_id)

            # Delete description
            document_access.remove_document(project.description_id)

            # Delete guides info
            guide_access.remove_project_guides(p_id)
            success.append("%s: Successfully removed" % project.title)
        else:
            errors.append("%s: Cannot remove (student registrations are not empty)" % project.title)

    if len(errors) == 0:
        return jsonify({'success': True, "message": "<br>".join(success)}), 200, {'ContentType': 'application/json'}
    else:
        return jsonify(
            {'success': False, "message": "<br>".join(errors) + "<br><br>" + "<br>".join(success)}), 400, {
                   'ContentType': 'application/json'}


@bp.route('/get-all-projects-data', methods=['GET'])
def get_all_projects_data():
    """
    Handles the GET request to '/get-all-projects-data'.
    :return: Json containing all project data with their recommendation index.
    """
    return jsonify(get_projects_with_recommendations())


@bp.route('/projects-page-additional', methods=['GET'])
def get_projects_page_additional_data():
    """
    Handles the GET request to '/projects-page-additional'.
    :return: Json containing active types, employees and groups.
    """
    connection = get_db()
    active_only = not session.get("archive")

    all_types = TypeDataAccess(connection).get_types(active_only)
    employees = EmployeeDataAccess(connection).get_employees(active_only)
    promotors = EmployeeDataAccess(connection).get_promotors(active_only)
    groups = ResearchGroupDataAccess(connection).get_group_names(active_only)

    result = {
        "types": [obj.type_name for obj in all_types],
        "employees": [obj.name for obj in employees],
        "groups": groups,
        "promotors": [obj.name for obj in promotors]
    }
    return jsonify(result)


@bp.route('/project-editor', methods=['POST'])
def update_project():
    """
    Handles the POST request to '/project-editor'.
    :return: project_editor(data) function call
    """
    return src.controllers.projects.tools.project_editor(request.json)


@bp.route('/add-registration', methods=['POST'])
def add_registration():
    """
    Handles the POST request to '/project-editor'.
    :return: Json with success/failure status.
    """
    if current_user.is_authenticated and current_user.role == "student":
        try:
            project_id = request.form['data']
            type = request.form['type']
            registration = Registration(current_user.user_id, project_id, type, "Pending")
            RegistrationDataAccess(get_db()).add_registration(registration)

            project = ProjectDataAccess(get_db()).get_project(project_id, False)
            if not project.is_active:
                raise Exception()

            msg = f"You registered for project {project.title}!\n" \
                f"You'll be notified when one of the supervisors changes your registration status.\n" \
                f"Best of luck!"

            send_mail(current_user.user_id + "@ad.ua.ac.be", "ESP Registration", msg)

            msg_employees = f"Student {current_user.name} ({current_user.user_id}) has registered for your project {project.title}.\n" \
                f"To change the registration status please visit the ESP site." \

            guides = GuideDataAccess(get_db()).get_guides_for_project(project_id)
            employee_access = EmployeeDataAccess(get_db())
            guides_with_info = [employee_access.get_employee(x.employee) for x in guides]

            for guide in guides_with_info:
                if guide.email:
                    send_mail(guide.email, "ESP Registration", msg_employees)

            return jsonify({'success': True}), 200, {'ContentType': 'application/json'}
        except Exception as e:
            return jsonify({'success': False, "message": "Failed to add a new registration!"}), 400, {
                'ContentType': 'application/json'}


@bp.route('/handle-registration', methods=['POST'])
def handle_registration():
    """
    Handles the POST request to '/handle-registration'.
    :return: Json with success/failure status. / redirects to login
    """
    if current_user.is_authenticated and current_user.role != "student":
        try:
            data = request.json

            RegistrationDataAccess(get_db()).update_registration(student_id=data['student_id'],
                                                                 project_id=data['project_id'],
                                                                 new_status=data['status'],
                                                                 new_type=data['type'])

            project_title = ProjectDataAccess(get_db()).get_project(data['project_id'], False).title
            if data['status']:
                msg = f"Your registration for project {project_title} has changed to {data['status']}.\n" \
                    f"For questions or remarks please contact the supervisors of the project."
                send_mail(data['student_id'] + "@ad.ua.ac.be", "ESP Registration Update", msg)
        except:
            return jsonify({'success': False, "message": "Failed to update registration!"}), 400, {
                'ContentType': 'application/json'}
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}

    else:
        return jsonify({'success': False, "message": "Failed to update registration!"}), 400, {
            'ContentType': 'application/json'}


@bp.route('/get-employee/<string:name>')
def get_employee_data(name):
    """
    Fetches all data of a certain employee.
    :param name: employee name
    :return: Json containing employee data
    """
    employee = EmployeeDataAccess(get_db()).get_employee_by_name(name)
    return jsonify(employee.to_dict())


@bp.route('/cancel_project_extension/<int:p_id>', methods=['POST'])
def cancel_project_extension(p_id):
    """
    Handles the POST request to '/extend_project/<int:p_id>'.
    Attempts to cancel project extension with sent project id.
    :param p_id: project id
    :return: Json with success/failure status.
    """
    try:
        ProjectDataAccess(get_db()).delete_project_extension(p_id)
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}
    except:
        return jsonify({'success': False, "message": "Failed to cancel project extension with id: " + str(p_id) + " !"}) \
            , 400, {'ContentType': 'application/json'}


def employee_authorized_for_project(employee_name, project_id):
    """
    Checks if an employee has authorisation over a certain project.
    :param employee_name: employee name
    :param project_id: project id
    :return: Boolean
    """
    employee = EmployeeDataAccess(get_db()).get_employee_by_name(employee_name)
    guides = GuideDataAccess(get_db()).get_guides_for_project(project_id)
    for guide in guides:
        if guide.employee == employee.e_id:
            return True

    return False


@bp.route('/project-page')
def project_page():
    """
    Increases link strength upon a click.
    :return: render project page
    """
    print(request.args, flush=True)
    if "from" in request.args and "project_id" in request.args:
        LinkDataAccess(get_db()).update_match_percent(request.args["from"], request.args["project_id"], 0.05)

    return render_template('project.html')


@bp.route('/can-modify/<p_id>')
def can_modify(p_id):
    """
    Checks if a project is modifiable.
    :param p_id: project id
    :return: Json with Boolean
    """
    modifiable = (current_user.is_authenticated and
                  (current_user.role == "admin" or
                   (current_user.role == "employee" and employee_authorized_for_project(current_user.name, p_id)))
                  )
    return jsonify({"modify": modifiable})


@bp.route('/like-project', methods=['POST'])
def like_project():
    """
    Handles the POST request to '/like-project'.
    Attempts to add a like for a certain project for the current user.
    :return: Json with success/failure status.
    """
    if not current_user.is_authenticated:
        return jsonify({'success': False}), 400, {'ContentType': 'application/json'}
    else:
        data = request.form['data']
        obj = Like(student_id=current_user.user_id, project=data)
        LikeDataAccess(get_db()).add_like(obj)
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}


@bp.route('/unlike-project', methods=['POST'])
def unlike_project():
    """
    Handles the POST request to '/unlike-project'.
    Attempts to remove a like for a certain project for the current user.
    :return: Json with success/failure status.
    """
    if not current_user.is_authenticated:
        return jsonify({'success': False}), 400, {'ContentType': 'application/json'}
    else:
        data = request.form['data']
        LikeDataAccess(get_db()).remove_like(current_user.user_id, data)
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}


@bp.route('/get-all-project-data/<int:p_id>', methods=['GET'])
def get_all_project_data(p_id):
    """
    Handles the GET request to '/get-all-project-data/<int:p_id>'.
    :param p_id: project id
    :return: Json with all project data, the research group and links.
    """
    active_only = not session["archive"]
    project_access = ProjectDataAccess(get_db())
    p_data = project_access.get_project(p_id, active_only)
    if current_user.is_authenticated:
        is_promotor = project_access.is_promotor(p_id, current_user.user_id)
    else:
        is_promotor = False

    if current_user.is_authenticated and current_user.role == "student":
        p_data.liked = LikeDataAccess(get_db()).is_liked(p_data.project_id, current_user.user_id)

    # Add linked projects
    linked_projects = LinkDataAccess(get_db()).get_links_for_project(p_id)
    linked_projects_data = set()
    for link in linked_projects:
        linked_project = project_access.get_project(link.project_2, active_only)
        if len(linked_projects_data) >= 4:
            break
        if not linked_project.is_active:
            continue
        linked_projects_data.add(linked_project)

    # Fill linked projects list with most viewed projects
    if len(linked_projects_data) < 4:
        projects_most_views = project_access.get_most_viewed_projects(8, active_only)
        if len(projects_most_views) >= 4:
            i = 0
            while len(linked_projects_data) < 4:
                if not projects_most_views[i].project_id == p_id:
                    linked_projects_data.add(projects_most_views[i])
                i += 1

    try:
        research_group = ResearchGroupDataAccess(get_db()).get_research_group(p_data.research_group).to_dict()
    except:
        research_group = None

    return jsonify({"project_data": p_data.to_dict(), "research_group": research_group,
                    "links": [obj.to_dict() for obj in linked_projects_data], "promotor": is_promotor})


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


@bp.route('/add-view/<int:p_id>', methods=['POST'])
def add_view(p_id):
    """
    Handles the POST request to '/add-view/<int:p_id>'.
    :param p_id: project id
    :return: Json with success/failure status
    """
    try:
        ProjectDataAccess(get_db()).add_view_count(p_id, 1)
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}
    except:
        print("Failed to count a view for project " + str(p_id) + ".")
        return ""


@bp.route('/search/<search_query>', methods=['GET'])
def search(search_query):
    """
    Handles the GET request to '/search/<search_query>'.
    :param search_query: search query
    :return: Json with results
    """
    project_access = ProjectDataAccess(get_db())
    active_only = not session.get("archive")
    results = project_access.search(search_query, active_only)
    return jsonify(results)


@bp.route('/register-user-data/<int:p_id>', methods=['POST'])
def register_user_data(p_id):
    """
    Handles the POST request to '/register-user-data/<int:p_id>'.
    :param p_id: project id
    :return: Json with success/failure status
    """
    try:
        ProjectDataAccess(get_db()).add_view_count(p_id, 1)
        if session.get('session_id') is not None:
            ClickDataAccess(get_db()).add_project_click(p_id, session['session_id'])
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}
    except:
        return jsonify(
            {'success': True, 'message': "Failed to register user behaviour for project " + str(p_id) + "."}), 400, {
                   'ContentType': 'application/json'}


@bp.route('/update-recommendations/<int:p1_id>/<int:p2_id>/<float:amount>', methods=['POST'])
def update_recommendations(p1_id, p2_id, amount):
    """
    Handles the POST request to '/update-recommendations/<int:p1_id>/<int:p2_id>/<float:amount>'.
    :param p1_id: project 1 id
    :param p2_id: project 2 id
    :param amount: percentage match amount
    :return: Json with success/failure status
    """
    try:
        LinkDataAccess(get_db()).update_match_percent(p1_id, p2_id, amount)
        return jsonify({'success': True}), 200, {'ContentType': 'application/json'}
    except:
        print("Failed to update recommendations for project " + str(p1_id) + " and project " + str(p2_id) + ".")
        return ""


def process_registration_data(registrations):
    """
    Converts the registration data to be used in the overviews
    :param registrations: List of registrations retrieved from RegistartionDataAccess
    :return: List with records in a format to use within the overviews
    """
    project_acces = ProjectDataAccess(get_db())

    records = list()

    for reg in registrations:
        p_id = reg["project_id"]
        project = project_acces.get_project(p_id, False)
        project_acces.minimize_project(project)

        promotor = ", ".join(project.employees.get("Promotor", ["-"]))
        co_promotor = ", ".join(project.employees.get("Co-Promotor", ["-"]))
        mentor = ", ".join(project.employees.get("Mentor", ["-"]))

        record = {
            'student_name': reg['student_name'],
            'student_id': reg['student_id'],
            'status': reg['status'],
            'date': reg['date'],
            'type': reg['type'],
            'title': project.title,
            'project_id': project.project_id,
            'promotor': promotor,
            'co-promotor': co_promotor,
            'mentor': mentor
        }
        records.append(record)
    return records


@bp.route('/csv-data')
def get_csv_data():
    """
    Handles the POST request to '/csv-data', which retrieves data about all project registrations for certain years.
    :return: Json with success/failure status / data
    """
    if not current_user.is_authenticated or (current_user.role != "admin" and current_user.role != "employee"):
        return '<div class="title">Er ging iets mis bij het genereren van het rapport</div>'
    else:
        years = request.args['years']
        years = years.split()
        registrations = RegistrationDataAccess(get_db()).get_csv_data(years)
        data = process_registration_data(registrations)

        file = os.path.join(config_data['file-storage'], 'Registrations.xlsx')
        workbook = xlsxwriter.Workbook(file)
        worksheet = workbook.add_worksheet()

        # Create header
        worksheet.write(0, 0, "Student Name")
        worksheet.write(0, 1, "Student ID")
        worksheet.write(0, 2, "Status")
        worksheet.write(0, 3, "Last Change")
        worksheet.write(0, 4, "Type")
        worksheet.write(0, 5, "Project")
        worksheet.write(0, 6, "Promotor")
        worksheet.write(0, 7, "Other Promotor(s)")
        worksheet.write(0, 8, "Mentor(s)")

        row = 1
        for registration in data:
            worksheet.write(row, 0, registration['student_name'])
            worksheet.write(row, 1, registration['student_id'])
            worksheet.write(row, 2, registration['status'])
            worksheet.write(row, 3, registration['date'])
            worksheet.write(row, 4, registration['type'])
            worksheet.write(row, 5, registration['title'])
            worksheet.write(row, 6, registration['promotor'])
            worksheet.write(row, 7, registration['co-promotor'])
            worksheet.write(row, 8, registration['mentor'])
            row += 1

        workbook.close()

        filename = 'Registrations_' + datetime.today().strftime('%d-%m-%Y') + '.xlsx'
        return send_file(file, attachment_filename=filename, as_attachment=True)


@bp.route('/overview')
def get_overview():
    """
    Handles the GET request to /overview, which shows data about all project registrations for certain years
    """
    if not current_user.is_authenticated or (current_user.role != "admin" and current_user.role != "employee"):
        return '<div class="title">Er ging iets mis bij het genereren van het rapport</div>'
    else:
        records = []
        year = ""

        if 'year' in request.args and request.args['year'] != "":
            year = request.args['year']
            registrations = RegistrationDataAccess(get_db()).get_csv_data([year])

            records = process_registration_data(registrations)

        if 'sort' in request.args:
            if request.args['sort'] == "date":
                from datetime import datetime
                records = sorted(records, key=lambda l: datetime.strptime(l['date'], "%d/%m/%Y"), reverse=True)
            else:
                records = sorted(records, key=lambda l: l[request.args['sort']])

        return render_template('overview.html', registration_data=records, current_year=year)

