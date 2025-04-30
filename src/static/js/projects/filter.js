/**
 * This function resets the search value and refreshes projects data.
 */
function resetSearch() {
    setSearch("");
    $("#search_text").val("");
    $("#reset-search").hide();
    refreshProjectsData();
}


function onChangeAvailableProjectsFilter(element) {
    setParam('available', element.checked);
    filterProjects();
}


function onChangeLikedFilter(element) {
    setParam('liked', element.checked);
    filterProjects();
}


function onClickFilterPromotor() {
    setParam('employee', $("#search_promotor").val());
    filterProjects();
}


/**
 * This function toggles the filter extension
 */
function filterExtend() {
    $("#filter").slideToggle();
}

/**
 * This function sorts two strings based on a given property.
 * @param property - property of project that is sorted on
 * @param reverse - checks if the sorting should be reversed
 * @returns {Function} - order that project have to each other, function should be used in combination with sort()
 */
function sort_on(property, reverse = false) {
    if (!reverse) {
        return function (a, b) {
            if (a[property].toUpperCase() < b[property].toUpperCase()) {
                return -1;
            } else if (a[property].toUpperCase() > b[property].toUpperCase()) {
                return 1;
            } else {
                return 0;
            }
        }
    } else {
        return function (a, b) {
            if (a[property].toUpperCase() < b[property].toUpperCase()) {
                return 1;
            } else if (a[property].toUpperCase() > b[property].toUpperCase()) {
                return -1;
            } else {
                return 0;
            }
        }
    }
}

/**
 * This function sorts two numbers based on a given property.
 * @param property - property of project that is sorted on
 * @param reverse - checks if the sorting should be reversed
 * @returns {Function} - order that project have to each other, function should be used in combination with sort()
 */
function sort_on_numbers(property, reverse = false) {
    if (!reverse) {
        return function (a, b) {
            if (a[property] < b[property]) {
                return -1;
            } else if (a[property] > b[property]) {
                return 1;
            } else {
                return 0;
            }
        }
    } else {
        return function (a, b) {
            if (a[property] < b[property]) {
                return 1;
            } else if (a[property] > b[property]) {
                return -1;
            } else {
                return 0;
            }
        }
    }
}

/**
 * This function sorts two dates.
 * @param reverse - checks if the sorting should be reversed
 * @returns {Function} - order that project have to each other, function should be used in combination with sort()
 */
function sort_on_date(reverse = false) {
    if (!reverse) {
        return function (a, b) {
            var a2 = new Date(a["last_updated"]).getTime()/1000;
            var b2 = new Date(b["last_updated"]).getTime()/1000;

            if (a2 < b2) {
                return -1;
            } else if (a2 > b2) {
                return 1;
            } else {
                return 0;
            }
        }
    } else {
        return function (a, b) {
            var a2 = new Date(a["last_updated"]).getTime()/1000;
            var b2 = new Date(b["last_updated"]).getTime()/1000;

            if (a2 > b2) {
                return -1;
            } else if (a2 < b2) {
                return 1;
            } else {
                return 0;
            }
        }
    }
}

/**
 * This function filters all projects.
 */
function filterProjects() {
    let filtered_projects = ALL_PROJECTS;

    filtered_projects = filter_liked_projects(filtered_projects);
    filtered_projects = filter_research_groups(filtered_projects);
    filtered_projects = filter_inactive(filtered_projects);
    filtered_projects = filter_type(filtered_projects);
    filtered_projects = filter_full(filtered_projects);
    filtered_projects = filter_employee(filtered_projects);

    const order_by = $("#orderBy").val();
    if (order_by === "AZ") {
        filtered_projects.sort(sort_on("title"));
    } else if (order_by === "ZA") {
        filtered_projects.sort(sort_on("title", true));
    } else if (order_by === "newest") {
        filtered_projects.sort(sort_on_numbers("last_updated", true));
    } else if (order_by === "oldest") {
        filtered_projects.sort(sort_on_numbers("last_updated"));
    } else if (order_by === "popular") {
        filtered_projects.sort(sort_on_numbers("view_count", true))
    } else if (order_by === "recommended") {
        filtered_projects.sort(sort_on_numbers("recommendation", true))
    }

    swapProjects(filtered_projects);
}

/**
 * This function filters projects based on employee searches.
 * @param {array} projects_filter_prev array with projects to be filtered
 * @return {array} filtered projects array
 */
function filter_employee(projects_filter_prev) {
    const promotor_text = $("#search_promotor").val();
    if (promotor_text.length === 0) return projects_filter_prev;

    var filtered_projects = [];
    var project_added;
    for (var i = 0; i < projects_filter_prev.length; i++) {
        project_added = false;
                        if (projects_filter_prev[i]["project_id"] == 244) {
                    console.log(projects_filter_prev[i]);
                }
        if (projects_filter_prev[i]["employees"]["Promotor"]) {
            for (var j = 0; j < projects_filter_prev[i]["employees"]["Promotor"].length; j++) {
                if (projects_filter_prev[i]["employees"]["Promotor"][j] === promotor_text) {
                    filtered_projects.push(projects_filter_prev[i]);
                    project_added = true;
                    break;
                }
            }
        }
        if (projects_filter_prev[i]["employees"]["Mentor"] && !project_added) {
            for (var j = 0; j < projects_filter_prev[i]["employees"]["Mentor"].length; j++) {
                if (projects_filter_prev[i]["employees"]["Mentor"][j] === promotor_text) {
                    filtered_projects.push(projects_filter_prev[i]);
                    project_added = true;
                    break;
                }
            }
        }
        if (projects_filter_prev[i]["employees"]["Co-Promotor"] && !project_added) {
            for (var j = 0; j < projects_filter_prev[i]["employees"]["Co-Promotor"].length; j++) {
                if (projects_filter_prev[i]["employees"]["Co-Promotor"][j] === promotor_text) {
                    filtered_projects.push(projects_filter_prev[i]);
                    project_added = true;
                    break;
                }
            }
        }
    }
    return filtered_projects
}

/**
 * This function filters projects based on a type filter.
 * @param {array} current_projects array with projects to be filtered
 * @return {array} filtered projects array
 */
function filter_type(current_projects) {
    const types = $("#type-filter").selectpicker("val");
    if (types.length === 0) {
        return current_projects;
    }

    let filtered_projects = [];

    for (const project of current_projects) {
        // Checks if one of the types picked is present in the project
        const intersect = types.some(function (type) {
            return project['types'].includes(type);
        });

        if (intersect) {
            filtered_projects.push(project);
        }
    }

    return filtered_projects;
}

/**
 * This function filters projects based on a language filter.
 * @param {array} projects_filter_prev array with projects to be filtered
 * @return {array} filtered projects array
 */
function filter_language(projects_filter_prev) {
    var show_dutch = document.getElementById("showDutch");
    var show_english = document.getElementById("showEnglish");

    var current_project;
    var filtered_projects = [];
    for (var i = 0; i < projects_filter_prev.length; i++) {
        current_project = projects_filter_prev[i];
        if (((show_dutch.checked && current_project["html_content_nl"] != null) ||
            (show_english.checked && current_project["html_content_eng"] != null))) {
            filtered_projects.push(current_project);

        }
    }

    return filtered_projects;
}

/**
 * This function filters projects based on likes.
 * @param {array} projects_arr array with projects to be filtered
 * @return {array} filtered projects array
 */
function filter_liked_projects(projects_arr) {
    if (getCookie("sessionAction") !== "active" || ! $("#liked-filter").is(":checked")) {
        return projects_arr;
    }

    let filtered_projects = [];
    for (let i = 0; i < projects_arr.length; i++) {
        if (projects_arr[i]["liked"]) {
            filtered_projects.push(projects_arr[i]);
        }
    }
    return filtered_projects;
}

/**
 * This function filters projects based on the availability of the project.
 * @param {array} current_projects array with projects to be filtered
 * @return {array} filtered projects array
 */
function filter_full(current_projects) {
    if (! $("#full-filter").is(":checked")) {
        return current_projects;
    }

    let filtered_projects = [];
    for (let project of current_projects) {
        if (! is_occupied(project)) {
            filtered_projects.push(project);
        }
    }
    return filtered_projects;
}

function is_occupied(project) {
    let students = 0;
    for (let registration of project['registrations']) {
        if (registration['status'] === "Accepted") {
            students += 1;
        }
    }
    return project['max_students'] <= students
}


/**
 * This function filters projects based on year.
 * @param {array} projects_filter_prev array with projects to be filtered
 * @return {array} filtered projects array
 */
function filter_year(projects_filter_prev) {
    var e3 = document.getElementById("filter_year");
    var year_filter = e3.options[e3.selectedIndex].value;
    var filtered_projects = [];
    for (var i = 0; i < projects_filter_prev.length; i++) {
        for (var j = 0; j < projects_filter_prev[i]["active_years"].length; j++) {
            var current_year = projects_filter_prev[i]["active_years"][j];

            if (current_year == year_filter) { //== needed instead of ===, ignore inspection
                filtered_projects.push(projects_filter_prev[i]);
                break;
            }
        }
    }
    return filtered_projects;

}

/**
 * This function filters projects based on research groups.
 * @param {array} current_projects array with projects to be filtered
 * @return {array} filtered projects array
 */
function filter_research_groups(current_projects) {
    const groups = $("#research-group-filter").selectpicker("val");
    if (groups.length === 0) {
        return current_projects;
    }

    let filtered_projects = [];

    for (const project of current_projects) {
        if (groups.includes(project['research_group'])) {
            filtered_projects.push(project);
        }
    }
    return filtered_projects;
}

/**
 * This function creates a type filter.
 */
function createTypeFilter() {
    var list_type = document.getElementById('typeFilter');
    var option = document.createElement("option");
    for (var i = 0; i < TYPES.length; i++) {
        option = document.createElement("option");
        option.text = TYPES[i];
        option.value = TYPES[i];
        list_type.appendChild(option);
    }

}

/**
 * This function loads projects according to a given search query (through ajax call).
 */
function search(callback) {
    const query = $("#search_text").val();
    $.ajax({
        url: "search/" + query,
        method: "GET",
        success: function (result) {
            ALL_PROJECTS = result;
            filterProjects();
            setSearch(query);
            $("#reset-search").show();
        },
        error: function (result) {

        }
    });
}

/**
 * This function executes a search on keyboard enter input.
 * @param {event} e
 * @return {boolean} default true
 */
function searchOnEnter(e) {
    let keynum = e.keyCode || e.which;  //for compatibility with IE < 9
    if (keynum === 13) { //13 is the enter char code
        e.preventDefault();
        search();
    }
    return true;
}

/**
 * This function initializes the employee filter with values.
 */
function init_employee_filter() {
    const list = document.getElementById('employees-list');

    EMPLOYEES.forEach(function (item) {
        const option = document.createElement('option');
        option.value = item;
        list.appendChild(option);
    });
}

/**
 * This function initializes the research group filter with values.
 */
function init_research_select() {
    let elem = $("#research-group-filter");
    elem.html(
        GROUPS.map(function (group) {
            return `<option value='${group}'>${group}</option>`
        }).join(""));

    let param = getURLParams().get('groups');
    if (param) {
        let groups = param.split(',');
        elem.selectpicker('val', groups);
    }

    elem.on('changed.bs.select', function() {
            setParam('groups', $(this).val());
            filterProjects();
        })
        .selectpicker('refresh');
}

/**
 * This function initializes the type filter with values.
 */
function init_type_select() {
    let elem = $("#type-filter");
    elem.html(
        TYPES.map(function (type) {
            return `<option value='${type}'>${type}</option>`
        }).join(""));

    let param = getURLParams().get('types');
    if (param) {
        let types = param.split(',');
        elem.selectpicker('val', types);
    }

    elem.on('changed.bs.select', function () {
            setParam('types', $(this).val());
            filterProjects();
        })
        .selectpicker('refresh');
}

/**
 * This function returns the amount of projects with certain type.
 * @param {array} projects_filter_prev array with projects to be filtered
 * @param {string} type_filter type to be filtered by
 * @return {number} count
 */
function count_type(projects_filter_prev, type_filter) {
    var filtered_projects = [];
    if (type_filter === 'all'){
        return projects_filter_prev.length;
    }
    for (var i = 0; i < projects_filter_prev.length; i++) {
        var current_project = projects_filter_prev[i];
        for (var j = 0; j < current_project["types"].length; j++) {
            if (type_filter === current_project["types"][j]) {
                filtered_projects.push(current_project);
            }
        }
    }
    return filtered_projects.length
}

/**
 * This function returns the amount of projects with dutch content.
 * @param {array} projects_filter_prev array with projects to be filtered
 * @return {number} count
 */
function count_dutch(projects_filter_prev) {
    var filtered_projects = [];
    for (var i = 0; i < projects_filter_prev.length; i++) {
        if (projects_filter_prev[i]["html_content_nl"] != null) {
            filtered_projects.push(projects_filter_prev[i])
        }
    }
    return filtered_projects.length;
}

/**
 * This function returns the amount of projects with english content.
 * @param {array} projects_filter_prev array with projects to be filtered
 * @return {number} count
 */
function count_english(projects_filter_prev) {
    var filtered_projects = [];
    for (var i = 0; i < projects_filter_prev.length; i++) {
        if (projects_filter_prev[i]["html_content_eng"] != null) {
            filtered_projects.push(projects_filter_prev[i])
        }
    }
    return filtered_projects.length;
}

//////////////////////////////////////////
// AUTOCOMPLETE EMPLOYEES (from w3 site) /
//////////////////////////////////////////


/**
 * @param inp input element
 * @param arr the possible values
 */
function autocomplete(inp, arr) {
    let currentFocus;

    inp.addEventListener("input", function (e) {
        let val = this.value;

        closeAllLists();
        if (!val) {
            return false;
        }
        currentFocus = -1;

        // create a DIV element that will contain the items (values)
        let possibleValues = document.createElement("DIV");
        possibleValues.setAttribute("id", this.id + "autocomplete-list");
        possibleValues.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(possibleValues);

        let validEmployee = false;

        for (let i = 0; i < arr.length; i++) {
            // Check if the item starts with the same letters as the text field value
            if (arr[i].substr(0, val.length).toUpperCase() === val.toUpperCase()) {

                // Create a DIV element for each matching element
                let value = document.createElement("DIV");
                value.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>" + arr[i].substr(val.length);
                value.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";

                value.addEventListener("click", function (e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                    inp.className = "form-control border border-success";
                });

                possibleValues.appendChild(value);
            }
            if (arr[i] === val) {
                closeAllLists();
                validEmployee = true;
            }
        }

        if (validEmployee) {
            inp.className = "form-control border border-success";
        } else {
            inp.className = "form-control border border-danger";
        }

    });

    inp.addEventListener("keydown", function (e) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");

        // Down key
        if (e.keyCode === 40) {
            currentFocus++;
            addActive(x);
        }

        // Up key
        else if (e.keyCode === 38) {
            currentFocus--;
            addActive(x);
        }

        // Enter key
        else if (e.keyCode === 13) {
            e.preventDefault();
            if (currentFocus > -1 && x) {
                x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) {
            currentFocus = 0;
        }
        if (currentFocus < 0) {
            currentFocus = (x.length - 1);
        }
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(element) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        let x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (element !== x[i] && element !== inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

function substringMatcher(strs) {
  return function findMatches(q, cb) {
    let matches, substrRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        matches.push(str);
      }
    });

    cb(matches);
  };
}
function filter_inactive(current_projects) {
    if (! $("#full-filter").is(":checked")) {
        return current_projects;
    }

    let filtered_projects = [];
    for (let project of current_projects) {
        if (project['is_active']) {
            filtered_projects.push(project);
        }
    }
    return filtered_projects;
}