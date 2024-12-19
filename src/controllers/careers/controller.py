"""@package
This package processes all routing requests.
"""


from flask import render_template, Blueprint, request
from src.controllers.projects.manage_projects import manage


bp = Blueprint('careers', __name__)


@bp.route('/careers', methods=["GET", "POST"])
def careers(my_internships=False):
    if request.method == "GET":
        return render_template('career.html')
