
/**
 * This function provides sets group selector html content.
 */
function setModalGroupSelector() {
    $("#edit-group-selector").html(
        `<option value="Don't change">Don't change</option>` +
        GROUPS.map(function (group) {
            return `<option value=${group}>${group}</option>`
        }).join("")
    ).selectpicker("refresh");
}

/**
 * Sets the on click functions for the modal, so that edit entries can be added
 */
function setupModal() {
    // Have to make my own function, the standard JQuery one does not work for dropdowns in a modal
    function toggleDropdown(dropdown) {
        if (dropdown.is(":visible")) {
            dropdown.hide();
        } else {
            dropdown.show();
        }
    }

    // ADD SECTION
    let addMenu = $("#add-selector-menu");
    $("#add-selector").click(() => toggleDropdown(addMenu));

    addMenu.children().click(function () {
        addMenu.hide();
        let entries = $("#add-entries");
        let selectedValue = $(this).text();
        if (selectedValue === "Employee" || selectedValue === "Werknemer") {
            entries.append(createEditEntry(ENTRY_TYPE.ADD_EMPLOYEE));
        } else if (selectedValue === "Type") {
            entries.append(createEditEntry(ENTRY_TYPE.TYPE));
        } else if (selectedValue === "Tag") {
            entries.append(createEditEntry(ENTRY_TYPE.TAG));
        }
    });

    // REMOVE SECTION
    let removeMenu = $("#remove-selector-menu");
    $("#remove-selector").click(() => toggleDropdown(removeMenu));

    removeMenu.children().click(function () {
        removeMenu.hide();
        let entries = $("#remove-entries");
        let selectedValue = $(this).text();
        if (selectedValue === "Employee" || selectedValue === "Werknemer") {
            entries.append(createEditEntry(ENTRY_TYPE.REMOVE_EMPLOYEE));
        } else if (selectedValue === "Type") {
            entries.append(createEditEntry(ENTRY_TYPE.TYPE));
        } else if (selectedValue === "Tag") {
            entries.append(createEditEntry(ENTRY_TYPE.TAG));
        }
    });

    // Close the dropdowns when clicking anywhere
    $(document).click(function () {
        addMenu.hide();
        removeMenu.hide();
    });
}

/**
 * Creates an element to be added in the editing modal
 * @param {ENTRY_TYPE} type the type of the element
 * @returns {*|jQuery|HTMLElement}
 */
function createEditEntry(type) {
    if (type === ENTRY_TYPE.TYPE) {
        return createTypeEditEntry();
    }

    let className;
    let middleColumn;
    let placeholder;

    if (type === ENTRY_TYPE.ADD_EMPLOYEE) {
        className = "employee-entry";
        middleColumn = `
            <select id="employee-type" class="form-control">
                <option value="Co-Promotor">Co-Promotor</option>
                <option value="Mentor">Mentor</option>
            </select>`;
        placeholder = "Name";
    } else if (type === ENTRY_TYPE.REMOVE_EMPLOYEE) {
        className = "employee-entry";
        middleColumn = `<span>Employee</span>`;
        placeholder = "Name";
    } else if (type === ENTRY_TYPE.TAG) {
        className = "tag-entry";
        middleColumn = `<span style="color: var(--placeholdercolor)">Tag</span>`;
        placeholder = "Tag";
    }

    let element = `
        <div class="form-row ${className} align-items-center">
            <div class="col-md-6">
                <input type="text" class="form-control" placeholder="${placeholder}">
            </div>
            
            <div class="col-md-4 text-center">
                ${middleColumn}
            </div>
            
            <div class="col-md-2">
                <button class="btn bg-light btn-sm" type="button" onclick="removeEntry(this);">
                    <span style="color: var(--placeholdercolor); font-size: 20px !important;">
                        <b>×</b>
                    </span>
                </button>
            </div>
        </div>`;

    let dom = $(element);

    // Add autocomplete for employees
    if (type === ENTRY_TYPE.ADD_EMPLOYEE || type === ENTRY_TYPE.REMOVE_EMPLOYEE) {
        autocomplete(dom.find("input")[0], EMPLOYEES);
    }

    return dom;
}

/**
 * This function provides html content to change/modify types.
 * @return jQuery element for static html
 */
function createTypeEditEntry() {
    let options = "";
    for (let type of TYPES) {
        options += `<option value="${type}">${type}</option>`;
    }

    let element = `
        <div class="form-row type-entry align-items-center">
            <div class="col-md-6">
                <select class="form-control">
                    ${options}
                </select>
            </div>
            
            <div class="col-md-4 text-center">
                <span style="color: var(--placeholdercolor)">Type</span>
            </div>
            
            <div class="col-md-2">
                <button class="btn bg-light btn-sm" type="button" onclick="removeEntry(this);">
                    <span style="color: var(--placeholdercolor); font-size: 20px !important;">
                        <b>×</b>
                    </span>
                </button>
            </div>
        </div>`;

    return $(element);
}

/**
 * Only used in entries for the editing function (see createEditEntry())
 * @param element the 'remove button'
 */
function removeEntry(element) {
    $(element).parent().parent().remove();
}


/**
 * Only used in entries for the editing function (see createEditEntry())
 * @param {array} projects to be be edited
 */
function sendEditingChanges(projects) {
    let json = {
        projects: projects,
        entries: []
    };


    let addEntries = $("#add-entries").children();
    for (let entry of addEntries) {
        // Convert to JQuery object
        entry = $(entry);

        if (entry.hasClass("employee-entry")) {
            let employee = entry.find("input").val();
            if (!EMPLOYEES.includes(employee)) {
                $("#modal-info").text("Employee " + employee + " does not exist");
                return;
            }
            let guidance = entry.find("select").val();

            json.entries.push({
                entry_type: "add-employee",
                name: employee,
                guidance: guidance
            });
        } else if (entry.hasClass("tag-entry")) {
            let tag = entry.find("input").val();
            json.entries.push({
                entry_type: "add-tag",
                tag: tag
            });
        } else if (entry.hasClass("type-entry")) {
            let type = entry.find("select").val();
            json.entries.push({
                entry_type: "add-type",
                type: type
            });
        }
    }

    let removeEntries = $("#remove-entries").children();
    for (let entry of removeEntries) {
        // Convert to JQuery object
        entry = $(entry);

        if (entry.hasClass("employee-entry")) {
            let employee = entry.find("input").val();
            if (!EMPLOYEES.includes(employee)) {
                $("#modal-info").text("Employee " + employee + " does not exist");
                return;
            }

            json.entries.push({
                entry_type: "remove-employee",
                name: employee,
            });
        } else if (entry.hasClass("tag-entry")) {
            let tag = entry.find("input").val();
            json.entries.push({
                entry_type: "remove-tag",
                tag: tag
            });
        } else if (entry.hasClass("type-entry")) {
            let type = entry.find("select").val();
            json.entries.push({
                entry_type: "remove-type",
                type: type
            });
        }
    }

    let replaceResearchGroup = $("#edit-group-selector").val();
    if (replaceResearchGroup !== "Don't change") {
        json.entries.push({
            entry_type: "replace-group",
            group: replaceResearchGroup
        });
    }

    /*
    let activeStatus = $("#active-status-selector").val();
    if (activeStatus !== "Don't change" && activeStatus !== "Verander niet") {
        json.entries.push({
            entry_type: "replace-active",
            active: activeStatus === "Active" || activeStatus === "Actief"
        });
    }
    */

    // Send the data
    $.ajax({
        url: "projects",
        type: "POST",
        data: JSON.stringify(json),
        contentType: 'application/json',
        success: function () {
            $("#modal-info").text("Successfully saved!");
            setLoading(true);
            refreshProjectsData();
        },
        error: function (message) {
            $("#modal-info").text("Error occurred: " + message["responseJSON"]["message"])
        }
    });
}

function sendCopy(projects) {
    let json = {
        projects: projects,
        entries: []
    };

    // Send the data
    $.ajax({
        url: "copy-projects",
        type: "POST",
        data: JSON.stringify(json),
        contentType: 'application/json',
        success: function (message) {
            $("#success").html(message["message"])
            $("#success").show();
            $("#error").hide();
            setLoading(true);
            refreshProjectsData();

            let allCheckBoxes = $(".custom-control-input");
            allCheckBoxes.prop('checked', false)
        },
        error: function(message) {
            $("#error").html(message["responseJSON"]["message"]);
            $("#error").show();
            $("#success").hide();
            setLoading(true);
            refreshProjectsData();

            let allCheckBoxes = $(".custom-control-input");
            allCheckBoxes.prop('checked', false)
        }
    });
}

function sendDelete(projects) {
    let json = {
        projects: projects,
        entries: []
    };

    // Send the data
    $.ajax({
        url: "delete-projects",
        type: "POST",
        data: JSON.stringify(json),
        contentType: 'application/json',
        success: function (message) {
            $("#success").html(message["message"])
            $("#success").show();
            $("#error").hide();
            setLoading(true);
            refreshProjectsData();

            let allCheckBoxes = $(".custom-control-input");
            allCheckBoxes.prop('checked', false)
        },
        error: function(message) {
            $("#error").html(message["responseJSON"]["message"]);
            $("#error").show();
            $("#success").hide();
            setLoading(true);
            refreshProjectsData();

            let allCheckBoxes = $(".custom-control-input");
            allCheckBoxes.prop('checked', false)
        }
    });
}


/**
 * This function checks if the page is being viewed in edit mode.
 * @return {boolean}
 */
function inEditMode() {
    if (role === 'admin') {
        return true;
    }
    let urlParam = parseURLParams(window.location.href)['edit'];
    if (urlParam) {
        return urlParam[0] === "true";
    } else {
        return false;
    }
}



/**
 * Retrieves the projects with a checked checkbox
 * @returns {Array} of project ID's
 */
function getCheckedProjects() {
    let i = 0;
    let currentCheckbox = $("#checkbox0");
    let checkedProjects = [];

    // Checks if current checkbox exists
    while (currentCheckbox.length) {

        if (currentCheckbox.is(":checked")) {
            checkedProjects.push(getProjectAtCard(i)['project_id']);
        }

        // Go to the next one
        i++;
        currentCheckbox = $(`#checkbox${i}`)
    }

    return checkedProjects;
}


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

let ALL_PROJECTS = null;
let PROJECTS = null;
let TYPES = [];
let EMPLOYEES = [];
let GROUPS = [];
let PROMOTORS = [];

// Enum used in the function addEditEntry
const ENTRY_TYPE = {ADD_EMPLOYEE: 1, REMOVE_EMPLOYEE: 2, TAG: 3, TYPE: 4};


$(function () {

    // Reset modal info span when closing
    $('#editModal').on('hidden.bs.modal', function (e) {
        $("#modal-info").text("");
    });

    setupButtons();
    setupModal();
    saveScrollingPosition();

    // Set the value of the selector to the value in the URL parameters
    $("#amount-selector").val(getProjectsPerPage() === 1000 ? "All" : getProjectsPerPage());

    restoreFilters();

    if ($.urlParam("search")) {
        $("#search_text").val($.urlParam("search"));
        search();
    } else {
        refreshProjectsData(restoreScrollingPosition);
    }

    $("#success").hide();
    $("#error").hide();

    $.ajax({
        url: "projects-page-additional",
        success: function (result) {
            EMPLOYEES = result["employees"];
            TYPES = result["types"];
            GROUPS = result["groups"];
            PROMOTORS = result["promotors"];
            init_type_select();
            init_research_select();
            init_employee_filter();
            setModalGroupSelector();
        }
    });

});


/**
 * Refreshes the projects and navigation when the back button is pressed
 */
window.addEventListener('popstate', function (event) {
    refreshProjects();
    refreshNavigation();
    setActiveNavElement(getPage());
    $("#amount-selector").val(getProjectsPerPage() === 1000 ? "All" : getProjectsPerPage());
}, false);


/**
 * This function initializes all buttons, checkboxes and selectors and gives them the correct starting values.
 */
function setupButtons() {
    let editModalButton = $("#editModalButton");
    let copyButton = $("#copyProjects");
    let deleteButton = $("#deleteProjects");
    let selectAllButton = $("#selectAllButton");
    let showDescriptionsButton = $("#showDescriptionsButton");

    editModalButton.click(function () {
        let checkedProjects = getCheckedProjects();

        $("#modal-title").text(checkedProjects.length + (checkedProjects.length === 1 ? " project" : " projects") + " selected");

        let saveChangesButton = $("#saveChangesButton");
        saveChangesButton.off("click");
        saveChangesButton.click(function () {
            sendEditingChanges(checkedProjects);
        });
    });

    copyButton.click(function() {
        let checkedProjects = getCheckedProjects();

        if (checkedProjects.length > 0) {
            if (confirm("Are you sure you want to copy " + checkedProjects.length + " projects?")) {
                sendCopy(checkedProjects);
            }
        }
    })

    deleteButton.click(function() {
        let checkedProjects = getCheckedProjects();

        if (checkedProjects.length > 0) {
            if (confirm("Are you sure you want to delete " + checkedProjects.length + " projects?")) {
                sendDelete(checkedProjects);
            }
        }
    })

    selectAllButton.click(function () {
        let allCheckBoxes = $(".custom-control-input");

        // Check if all checkboxes are checked
        let allChecked = true;
        allCheckBoxes.each(function () {
            if (!$(this).is(":checked")) {
                allChecked = false;
            }
        });

        if (allChecked) {
            allCheckBoxes.prop('checked', false);
        } else {
            allCheckBoxes.prop('checked', true);
        }
    });
    showDescriptionsButton.click(function () {
        let allCards = $('[id^="card-collapse"]');
        let allExpanded = true;
        allCards.each(function () {
            if (!$(this).hasClass('show')) {
                allExpanded = false;
            }
        });

        if (allExpanded) {
            allCards.collapse('hide');
        } else {
            allCards.collapse('show');
        }
    });


    if (inEditMode()) {
        editModalButton.show();
        copyButton.show();
        deleteButton.show();
        selectAllButton.show();
        setProjectsPerPage(1000);
    } else {
        selectAllButton.hide();
        editModalButton.hide();
        copyButton.hide();
        deleteButton.hide();
    }
}




/**
 * Hides or shows the loading spinner on the page
 * @param bool
 */
function setLoading(bool) {
    let spinner = $("#loading-spinner");
    if (bool) {
        spinner.show();
    } else {
        spinner.hide();
    }
}

/**
 * This function retrieves the correct project based on the current page, amount of projects per page and an index.
 * @param {number} number index on the current page
 * @return {project} correct project
 */
function getProjectAtCard(number) {
    return PROJECTS[getPage() * getProjectsPerPage() + number]
}


/**
 * This function refreshes all project data and applies filters.
 */
function refreshProjectsData(callback=null) {
    // Get all the projects, show them when arrived
    $.ajax({
        url: "get-all-projects-data",
        success: function (result) {
            ALL_PROJECTS = result;
            filterProjects();
            if (callback) {
                callback()
            }
        }
    });
}

/**
 * Displays the given list of projects in the accordion
 * @param list array of projects
 */
function swapProjects(list) {
    PROJECTS = list;
    setLoading(false);
    if (getPage() >= getPages()) {
        setPage(0);
    }
    refreshProjects();
    refreshNavigation();
    setActiveNavElement(getPage());
}



/**
 * Fills the accordion with the global projects variable
 */
function refreshProjects() {
    let page = getPage();
    let number = getProjectsPerPage();

    let start = page * number;
    let projectsToShow = null;

    if (PROJECTS.length > start + number) {
        projectsToShow = PROJECTS.slice(start, start + number);
    } else {
        projectsToShow = PROJECTS.slice(start);
    }

    provideCards(projectsToShow.length);
    for (let i = 0; i < projectsToShow.length; i++) {
        fillCard(i, projectsToShow[i]);
    }
}

/**
 * Constructs two new nav bars and sets them at the top and bottom of the accordion
 */
function refreshNavigation() {
    // Remove the top nav if necessary
    let navTop = document.getElementById("nav-top");
    if (navTop !== null) {
        document.getElementById("navigatorcol").removeChild(navTop);
    }

    // Remove the bottom nav if necessary
    let navBottom = document.getElementById("nav-bottom");
    if (navBottom !== null) {
        document.getElementById("container").removeChild(navBottom);
    }

    // Insert the top nav above the accordion
    let topNav = createNav(false);
    document.getElementById("navigatorcol").appendChild(topNav);

    // Insert the bottom nav below the accordion
    let bottomNav = createNav(true);
    document.getElementById("container").appendChild(bottomNav);
}

/**
 * Sets the right element in the navigation/pagination to active
 * @param number the element that should be active
 */
function setActiveNavElement(number) {
    let darkThemeClasses = "";
    if (theme === "dark") {
        darkThemeClasses = "bg-dark border-secondary text-white";
    }

    // Set previous classname of both top and bottom nav
    if (number !== 0) {
        document.getElementById("nav-bottom-previous").className = "page-item";
        document.getElementById("nav-top-previous").className = "page-item";
    } else {
        document.getElementById("nav-bottom-previous").className = "page-item disabled";
        document.getElementById("nav-top-previous").className = "page-item disabled";
    }

    // Reset each item
    for (let i = 0; i < getPages(); i++) {
        let navBottomElem = document.getElementById("nav-bottom-" + i);
        let navTopElem = document.getElementById("nav-top-" + i);
        navBottomElem.className = "page-item";
        navBottomElem.firstChild.innerHTML = i.toString();
        navBottomElem.firstChild.className = "page-link " + darkThemeClasses;
        navTopElem.className = "page-item";
        navTopElem.firstChild.innerHTML = i.toString();
        navTopElem.firstChild.className = "page-link " + darkThemeClasses;
    }

    // Set next classname of both top and bottom nav
    if (number < getPages() - 1) {
        document.getElementById("nav-bottom-next").className = "page-item";
        document.getElementById("nav-top-next").className = "page-item";
    } else {
        document.getElementById("nav-bottom-next").className = "page-item disabled";
        document.getElementById("nav-top-next").className = "page-item disabled";
    }


    // Highlight selected
    let navBottomElem = document.getElementById("nav-bottom-" + number);
    let navTopElem = document.getElementById("nav-top-" + number);

    if (! navBottomElem) {
        return;
    }

    navBottomElem.className = "page-item active";
    navBottomElem.firstChild.innerHTML = number.toString() + "<span class=\"sr-only\">(current)</span>";
    navBottomElem.firstChild.className = "page-link";
    navTopElem.className = "page-item active";
    navTopElem.firstChild.innerHTML = number.toString() + "<span class=\"sr-only\">(current)</span>";
    navTopElem.firstChild.className = "page-link";

}

/**
 * Creates a JS DOM element for the navigation/pagination bar
 * @param bottom boolean indicating if it's the bottom nav, changes the id accordingly
 * @returns {HTMLElement} bootstrap pagination element
 */
function createNav(bottom) {
    let id = bottom ? "bottom" : "top";

    let darkThemeClasses = "";
    if (theme === "dark") {
        darkThemeClasses = "bg-dark border-secondary text-white";
    }

    // Create the navigation
    let nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Page navigation");
    nav.id = "nav-" + id;
    nav.style = "justify-content: center;";
    if (bottom) {
        nav.style = "margin-top: 20px";
    }

    // Create the list, add to navigation
    let list = document.createElement("ul");
    list.className = "pagination";
    nav.appendChild(list);

    // Create a 'previous' nav item, add to list
    let previous = document.createElement("li");
    previous.id = "nav-" + id + "-" + "previous";
    previous.className = "page-item";
    previous.innerHTML = `<a class=\"page-link ${darkThemeClasses}\" href=\"#\" aria-label=\"Previous\"> <span aria-hidden=\"true\">&laquo;</span> <span class=\"sr-only\">Previous</span> </a>`;
    previous.onclick = function () {
        let currentPage = getPage();
        if (currentPage !== 0) {
            setPage(currentPage - 1);
            setActiveNavElement(currentPage - 1);
            refreshProjects();
        }
        return false;
    };
    list.appendChild(previous);

    // Create a list item for each of the pages
    for (let i = 0; i < getPages(); i++) {
        let listItem = document.createElement("li");
        listItem.id = "nav-" + id + "-" + i;
        listItem.className = "page-item";

        // Create link
        let link = document.createElement("a");
        link.className = "page-link " + darkThemeClasses;
        link.innerText = i.toString();
        link.href = "#";
        link.onclick = function () {
            if (i !== getPage()) {
                setPage(i);
                setActiveNavElement(i);
                refreshProjects();
            }
            return false;
        };

        listItem.appendChild(link);
        list.appendChild(listItem);
    }

    // Create a 'next' nav item, add to list
    let next = document.createElement("li");
    next.id = "nav-" + id + "-" + "next";
    next.className = "page-item";
    next.innerHTML = `<a class=\"page-link ${darkThemeClasses}\" href=\"#\" aria-label=\"Next\"> <span aria-hidden=\"true\">&raquo;</span> <span class=\"sr-only\">Next</span> </a>`;
    next.onclick = function () {
        let currentPage = getPage();
        if (currentPage !== getPages() - 1) {
            setPage(currentPage + 1);
            setActiveNavElement(currentPage + 1);
            refreshProjects();
        }
        return false;
    };
    list.appendChild(next);

    return nav;
}

/**
 * Ensures that there is the right amount of cards in the accordion.
 * Done by either adding or removing cards.
 * @param number amount of card wanted
 */
function provideCards(number) {
    if (number < 0) {
        return;
    }

    let accordion = $("#accordion");
    let length = function () {
        return accordion.children().length;
    };

    while (length() !== number) {
        if (length() > number) {
            accordion.children().last().remove();
        } else {
            accordion.append(createCard(length()))
        }
    }
}

/**
 * Called when clicking the selector.
 * Changes the page url and refreshes the projects
 * @param selector
 */
function selectorOnClick(selector) {
    setPage(0);
    setProjectsPerPage(selector.value);
    refreshProjects();
    refreshNavigation();
    setActiveNavElement(0);
}

/**
 * Called when clicking a star.
 * Sets the right kind of star and sends the value to the server
 * @param element the JS DOM element
 */
function starOnClick(element) {
    // Get the unique id from the end of the star id
    let number = parseInt(element.id.match(/(\d+)$/)[0], 10);
    let project = getProjectAtCard(number);

    if (project["liked"]) {
        element.children[0].innerHTML = "&#9734";
        project["liked"] = false;
        $.returnValues("unlike-project", project["project_id"]);
    } else {
        element.children[0].innerHTML = "&#9733";
        project["liked"] = true;
        $.returnValues("like-project", project["project_id"]);
    }
}

/**
 * This function sets the correct star icon to the element.
 * @param element
 * @param {boolean} liked
 */
function starLoad(element, liked) {
    if (liked) {
        element.children[0].innerHTML = "&#9733";
    } else {
        element.children[0].innerHTML = "&#9734";
    }
}

/**
 * Fills a card with a project
 * @param {number} number the unique ID of the card
 * @param project the project that will be shown
 */
function fillCard(number, project) {
    // Set title and link
    let title = project["title"];
    $("#card-title" + number).html(title).attr("href", 'project-page?project_id=' + project["project_id"]);

    // Set the content preview according to the current language
    let content;
    if ((language === "en" && project["html_content_eng"]) ||
        (language === "nl" && !project["html_content_nl"])) {
        content = project["html_content_eng"];
    } else {
        content = project["html_content_nl"];
    }
    $("#card-text" + number).html(content);
    $("#link" + number).click(function () {
        window.location.href = '/project-page?project_id=' + project["project_id"];
    });

    $(`#card-collapse${number}`).collapse('hide');

    // Add badges
    let badges = $("#card-badges" + number);
    badges.children().remove();

    if (is_occupied(project)) {
        badges.append($(`
            <span class="badge badge-danger" style="margin-right: 10px">
                ${language === 'en' ? 'Occupied' : 'Volzet'}
            </span>
        `))
    }

    if (project["is_active"] !== undefined && !project["is_active"]) {
        let inactive_badge = document.createElement("span");
        inactive_badge.setAttribute("class", "badge badge-info");
        inactive_badge.innerHTML = "Inactive";
        inactive_badge.style = "margin-right: 10px";
        badges.append(inactive_badge);
    }

    if (project["employees"]["Promotor"]) {
        let name_badge = document.createElement("span");
        name_badge.setAttribute("class", "badge badge-success employee-bg-color");
        name_badge.innerHTML = project["employees"]["Promotor"][0];
        name_badge.style = "margin-right: 10px";
        badges.append(name_badge);
    }

    for (let i = 0; i < project['types'].length; i++) {
        let type_badge = document.createElement("span");
        type_badge.setAttribute("class", "badge badge-primary type-bg-color");
        type_badge.innerHTML = project['types'][i];
        type_badge.style = "margin-right: 10px";
        badges.append(type_badge);
    }

    let length = 3;
    if (project['tags'].length < length) {
        length = project['tags'].length
    }
    for (let i = 0; i < length; i++) {
        let tag_badge = document.createElement("span");
        tag_badge.setAttribute("class", "badge tag-bg-color");
        tag_badge.innerHTML = project['tags'][i];
        tag_badge.style = "margin-right: 10px";
        badges.append(tag_badge);
    }

    let date_badge = document.createElement("span");
    //date_badge.setAttribute("class", "badge badge-secondary");
    date_badge.innerHTML = "Last updated " + timestampToString(project['last_updated']);
    date_badge.style = "color : #B5B7BA; white-space: nowrap;";
    badges.append(date_badge);

    let like_button = document.getElementById("fav-button-" + number);
    if (role === "student") {
        starLoad(like_button, project["liked"])
    }
}

/**
 * Creates a JQuery DOM element of a card, meant to be placed in the accordion
 * @param {number} number the unique ID of the card
 * @returns {*|jQuery|HTMLElement} DOM Card element
 */
function createCard(number) {
    let checkbox = "";
    let favoriteBtn = "";
    let buttonClass;
    let cardClasses;
    let titleClass;

    if (inEditMode()) {
        checkbox = `
            <div class="custom-control form-control-lg custom-checkbox" style="display: inline-block; margin-left: 10px">
                <input type="checkbox" class="custom-control-input" id="checkbox${number}">
                <label class="custom-control-label" for="checkbox${number}"></label>
            </div>`;
    }

    if (theme === "dark") {
        buttonClass = "bg-secondary";
        titleClass = "text-white";
        cardClasses = "text-white bg-dark border-secondary";
    } else {
        buttonClass = "bg-light";
        titleClass = "";
        cardClasses = "";
    }

    if (role === "student") {
        favoriteBtn = `<button class="btn ${buttonClass} btn-sm" type="button" id="fav-button-${number}" onclick="starOnClick(this)">
                    <span style="font-size: 20px">&#9734</span>
                </button>`;
    }

    // Element is the actual html code, checkbox is added in there
    let element = `
    <div class="card ${cardClasses}">
      <div class="card-body">
        <div class="row">
            <div class="col">
                <h5 class="card-title">
                    <a id="card-title${number}"></a> 
                    <button type="button" class="btn ${buttonClass} btn-sm ${titleClass}" style="font-size: 10px" onclick="$('#card-collapse${number}').collapse('toggle');">. . .</button>
                </h5>
                
                <h6 class="card-subtitle mb-2" id="card-badges${number}"></h6>
                
                <div class="collapse card-text" id="card-collapse${number}">
                        <p id="card-text${number}"></p>
                </div>
                
            </div>
            <div class="col-xs-auto text-center" style="padding-right: 10px">
 
                ${favoriteBtn}
                ${checkbox}
                
            </div>
        </div>
      </div>
    </div>`;

    return $(element);
}



function restoreFilters() {
    let params = getURLParams();
    if (params.get('available')) {
        $("#full-filter").prop('checked', params.get('available') === 'true');
    }
    if (params.get('liked')) {
        $("#liked-filter").prop('checked', params.get('liked') === 'true');
    }
    if (params.get('employee')) {
        $("#search_promotor").val(params.get('employee'));
    }
}

/**
 * @returns {number} the page, default value 0
 */
function getPage() {
    let urlParam = $.urlParam('page');
    if (urlParam) {
        return parseInt(urlParam[0]);
    } else {
        return 0;
    }
}

/**
 * This function pushes a new page to the browser, based on a new page index.
 * @param {number} number index for the next page
 */
function setPage(number) {
    let projectsPerPage = getProjectsPerPage();
    if (projectsPerPage === 1000) {
        projectsPerPage = "All";
    }
    setParam('page', number);
    setParam('amount', projectsPerPage);
    setParam('edit', inEditMode());
    setParam('search', getSearch());
    // window.history.pushState('Projects', "Projects - ESP", GLOBAL.root + `/projects?page=${number}&amount=${projectsPerPage}&edit=${inEditMode()}&search=${getSearch()}`);
}

/**
 * This function retrieves the search query from the url.
 * @return {string} query
 */
function getSearch() {
    const query = $.urlParam("search");
    if (query) {
        return query;
    } else {
        return "";
    }
}

/**
 * This function pushes a new page to the browser, based on a search query
 * @param {string} query
 */
function setSearch(query) {
    setParam('search', query);
    // window.history.pushState('Projects', "Projects - ESP", GLOBAL.root + `/projects?page=${getPage()}&amount=${getProjectsPerPage()}&edit=${inEditMode()}&search=${query}`);
}

/**
 * @returns {number} projects per page, default value 50
 */
function getProjectsPerPage() {
    let urlParam = parseURLParams(window.location.href)['amount'];
    if (!urlParam) {
        return 50;
    }

    let amount = urlParam[0];
    if (amount === "All") {
        return 1000;
    } else {
        return parseInt(amount);
    }
}

/**
 * This function pushes a new page to the browser, based on a new amount of projects per page
 * @param {number} number the new project count per page
 */
function setProjectsPerPage(number) {
    if (number === 1000) {
        number = "All";
    }
    setParam('amount', number);
    // window.history.pushState('Projects', "Projects - ESP", GLOBAL.root + `/projects?page=${getPage()}&amount=${number}&edit=${inEditMode()}&search=${getSearch()}`);
}

/**
 * This function retrieves the amount of pages.
 * @return {number} page count
 */
function getPages() {
    return Math.ceil(PROJECTS.length / getProjectsPerPage());
}


/**
 * Save scrolling position
 */
function saveScrollingPosition() {
    var pathName = document.location.pathname;
    window.onbeforeunload = function () {
        var scrollPosition = $(document).scrollTop();
        sessionStorage.setItem("scrollPosition_" + pathName, scrollPosition.toString());
    };
}

function restoreScrollingPosition() {
    var pathName = document.location.pathname;
    if (sessionStorage["scrollPosition_" + pathName]) {
        $(document).scrollTop(sessionStorage.getItem("scrollPosition_" + pathName));
    }
}