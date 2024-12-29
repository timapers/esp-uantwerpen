"""@package
This package processes all routing requests.
"""


from flask import Blueprint, request, jsonify, render_template
from flask_login import current_user
from src.models.internship import InternshipDataAccess
from src.models.company import CompanyDataAccess
from src.models.tag import TagDataAccess
from src.models.type import TypeDataAccess
from src.models.db import get_db
bp = Blueprint('careers', __name__)


@bp.route('/careers', methods=["GET", "POST"])
def careers(my_internships=False):
    if request.method == "GET":
        return render_template('career.html', internships=my_internships)



@bp.route('/get-all-internships-data', methods=['GET'])
def get_all_internships_data():
    """
    Handles the GET request to fetch all internships data.
    :return: JSON containing all internship data.
    """
    connection = get_db()
    active_only = True  # Fetch only active internships
    internships = InternshipDataAccess(connection).get_internships(active_only)
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

@bp.route('/get-internship/<int:internship_id>', methods=['GET'])
def get_internship_data(internship_id):
    """
    Fetches data for a specific internship.
    :param internship_id: ID of the internship.
    :return: JSON containing internship details.
    """
    connection = get_db()
    internship = InternshipDataAccess(connection).get_internship(internship_id)

    if not internship:
        return jsonify({'success': False, 'message': 'Internship not found.'}), 404

    return jsonify(internship.to_dict())

@bp.route('/internships-page-additional', methods=['GET'])
def get_internships_page_additional_data():
    """
    Provides additional metadata for the internships page, such as companies, tags, and types.
    :return: JSON containing metadata.
    """
    connection = get_db()
    active_only = True

    companies = CompanyDataAccess(connection).get_companies()
    tags = TagDataAccess(connection).get_tags()
    types = TypeDataAccess(connection).get_types(active_only)

    result = {
        "companies": [company.to_dict() for company in companies],
        # "tags": [tag for tag in tags],
        "types": [type.type_name for type in types],
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