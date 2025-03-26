/**
 * This function provides sets group selector html content.
 */
function setModalGroupSelector() {
    $("#edit-group-selector").html(
        `<option value="Don't change">Don't change</option>` +
        COMPANIES.map(function (group) {
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



function sendEditingChanges(internships) {
    let json = {
        internships: internships,
        entries: []
    };

    // Add logic to collect and send editing changes as required for internships.
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
    // Example AJAX call (update URL to match backend):
    $.ajax({
        url: "edit-internships",
        type: "POST",
        data: JSON.stringify(json),
        contentType: 'application/json',
        success: function () {
            $("#modal-info").text("Successfully saved!");
            setLoading(true);
            refreshInternshipsData();
        },
        error: function (message) {
            $("#modal-info").text("Error occurred: " + message.responseJSON.message);
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
 * Retrieves the internships with a checked checkbox
 * @returns {Array} of internship ID's
 */
function getCheckedInternships() {
    let i = 0;
    let currentCheckbox = $("#checkbox0");
    let checkedInternships = [];

    // Checks if current checkbox exists
    while (currentCheckbox.length) {

        if (currentCheckbox.is(":checked")) {
            checkedInternships.push(getInternshipAtCard(i)['internship_id']);
        }

        // Go to the next one
        i++;
        currentCheckbox = $(`#checkbox${i}`);
    }

    return checkedInternships;
}
/**
 * This function resets the search value and refreshes internships data.
 */
function resetSearch() {
    setSearch("");
    $("#search_text").val("");
    $("#reset-search").hide();
    refreshInternshipsData();
}

function onChangeReviewedEventFilter(element) {
    setParam('reviewed-filter', element.checked);
    filterInternships();
}

function onChangeLikedFilter(element) {
    setParam('liked', element.checked);
    filterInternships();
}

function onClickFilterCompany() {
    setParam('company', $("#search_company").val());
    filterInternships();
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
 * This function filters all internships.
 */
function filterInternships() {
    let filtered_internships = ALL_INTERNSHIPS;

    filtered_internships = filter_liked_internships(filtered_internships);
    filtered_internships = filter_companies(filtered_internships);
    filtered_internships = filter_types(filtered_internships);
    filtered_internships = filter_reviewed_internships(filtered_internships);
    filtered_internships = filter_full(filtered_internships);

    const order_by = $("#orderBy").val();
    if (order_by === "AZ") {
        filtered_internships.sort(sort_on("title"));
    } else if (order_by === "ZA") {
        filtered_internships.sort(sort_on("title", true));
    } else if (order_by === "newest") {
        filtered_internships.sort(sort_on_date(true));
    } else if (order_by === "oldest") {
        filtered_internships.sort(sort_on_date());
    } else if (order_by === "popular") {
        filtered_internships.sort(sort_on_numbers("view_count", true));
    }

    swapInternships(filtered_internships);
}

/**
 * This function filters internships based on companies.
 * @param {array} event_filter_prev array with internships to be filtered
 * @return {array} filtered internships array
 */
function filter_companies(event_filter_prev) {
    const companies = $("#company-filter").selectpicker("val");
    if (companies.length === 0) return event_filter_prev;

    let filtered_events = [];
    console.log(event_filter_prev);
    for (const event of event_filter_prev) {
        if (event['company_name'].includes(companies)) {
            filtered_events.push(event);
        }
    }
    return filtered_events;



}
function isReviewed(event) {
    return event['is_reviewed'];
}

function filter_reviewed_internships(event_filter_prev) {
    const reviewed = $("#reviewed-filter").is(":checked");
    if (!reviewed) return event_filter_prev;

    let filtered_events = [];
    for (const event of event_filter_prev) {
        if (!event['is_reviewed']) {
            filtered_events.push(event);
        }
    }

    return filtered_events;
}

/**
 * This function filters internships based on types.
 * @param {array} current_events array with internships to be filtered
 * @return {array} filtered internships array
 */
function filter_types(current_events) {
    const types = $("#type-filter").selectpicker("val");
    if (types.length === 0) {
        return current_events;
    }

    let filtered_events = [];

    for (const event of current_events) {
        // Checks if one of the types picked is present in the project
        const intersect = types.some(function (type) {
            return event['types'].includes(type);
        });

        if (intersect) {
            filtered_events.push(event);
        }
    }

    return filtered_events;
}

/**
 * This function filters internships based on likes.
 * @param {array} internships_arr array with internships to be filtered
 * @return {array} filtered internships array
 */
function filter_liked_internships(internships_arr) {
    if (getCookie("sessionAction") !== "active" || !$("#liked-filter").is(":checked")) {
        return internships_arr;
    }

    return internships_arr.filter(internship => internship["liked"]);
}

/**
 * This function filters internships based on the availability of the internship.
 * @param {array} current_internships array with internships to be filtered
 * @return {array} filtered internships array
 */
function filter_full(current_internships) {
    if (!$("#full-filter").is(":checked")) {
        return current_internships;
    }

    return current_internships.filter(internship => !is_occupied(internship));
}

function is_occupied(internship) {
    let students = 0;
    for (let registration of internship['registrations']) {
        if (registration['status'] === "Accepted") {
            students += 1;
        }
    }
    return internship['max_students'] <= students
}

// /**
//  * This function initializes the company filter with values.
//  */
// function init_company_filter() {
//     const list = document.getElementById('companies-list');
//
//     COMPANIES.forEach(function (item) {
//         const option = document.createElement('option');
//         option.value = item;
//         list.appendChild(option);
//     });
// }

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
        filterInternships();
    })
        .selectpicker('refresh');
}

function init_company_select() {
    let elem = $("#company-filter");
    elem.html(
        COMPANIES.map(function (company) {
            return `<option value='${company}'>${company}</option>`
        }).join(""));

    let param = getURLParams().get('company');
    if (param) {
        let comps = param.split(',');
        elem.selectpicker('val', comps);
    }

    elem.on('changed.bs.select', function () {
        setParam('company', $(this).val());
        filterInternships();
    })
    .selectpicker('refresh');
}
let ALL_INTERNSHIPS = null;
let INTERNSHIPS = null;
let TYPES = [];
let EMPLOYEES = [];
let COMPANIES = [];
let CONTACT_PERSONS = [];

// Enum used in the function addEditEntry
const ENTRY_TYPE = {ADD_CONACT_PERSON: 1, REMOVE_CONTACT_PERSON: 2, TAG: 3, TYPE: 4};

$(function () {

    // Reset modal info span when closing
    $('#editModal').on('hidden.bs.modal', function (e) {
        $("#modal-info").text("");
    });

    setupButtons();
    setupModal();
    saveScrollingPosition();

    // Set the value of the selector to the value in the URL parameters
    $("#amount-selector").val(getInternshipsPerPage() === 1000 ? "All" : getInternshipsPerPage());

    restoreFilters();

    if ($.urlParam("search")) {
        $("#search_text").val($.urlParam("search"));
        search();
    } else {
        refreshInternshipsData(restoreScrollingPosition);
    }

    $("#success").hide();
    $("#error").hide();

    $.ajax({
        url: "events-page-additional",
        success: function (result) {
            // = result["employees"];
            TYPES = result["types"];
            COMPANIES = result["companies"];
            init_type_select();
            init_company_select();
            setModalGroupSelector();
        }
    });
});

/**
 * Refreshes the internships and navigation when the back button is pressed
 */
window.addEventListener('popstate', function (event) {
    refreshInternships();
    refreshNavigation();
    setActiveNavElement(getPage());
    $("#amount-selector").val(getInternshipsPerPage() === 1000 ? "All" : getInternshipsPerPage());
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
        let checkedInternships = getCheckedInternships();

        $("#modal-title").text(checkedInternships.length + (checkedInternships.length === 1 ? " internship" : " internships") + " selected");

        let saveChangesButton = $("#saveChangesButton");
        saveChangesButton.off("click");
        saveChangesButton.click(function () {
            saveChanges(checkedInternships);
        });
    });

    copyButton.click(function () {
        let checkedInternships = getCheckedInternships();

        if (checkedInternships.length > 0) {
            if (confirm("Are you sure you want to copy " + checkedInternships.length + " internships?")) {
                sendCopy(checkedInternships);
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
        setInternshipsPerPage(1000);
    } else {
        selectAllButton.hide();
        editModalButton.hide();
        copyButton.hide();
        deleteButton.hide();
    }
}
function restoreFilters() {
    let params = getURLParams();
    if (params.get('available')) {
        $("#full-filter").prop('checked', params.get('available') === 'true');
    }
    if (params.get('liked')) {
        $("#liked-filter").prop('checked', params.get('liked') === 'true');
    }
    // if (params.get('employee')) {
    //     $("#search_promotor").val(params.get('employee'));
    // }
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
    let internshipsPerPage = getInternshipsPerPage();
    if (internshipsPerPage === 1000) {
        internshipsPerPage = "All";
    }
    setParam('page', number);
    setParam('amount', internshipsPerPage);
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

}

/**
 * @returns {number} projects per page, default value 50
 */
function getInternshipsPerPage() {
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
function setInternshipsPerPage(number) {
    if (number === 1000) {
        number = "All";
    }
    setParam('amount', number);
}

/**
 * This function retrieves the amount of pages.
 * @return {number} page count
 */
function getPages() {
    return Math.ceil(INTERNSHIPS.length / getInternshipsPerPage());
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
 * This function retrieves the correct internship based on the current page, amount of internships per page, and an index.
 * @param {number} number index on the current page
 * @return {internship} correct internship
 */
function getInternshipAtCard(number) {
    return INTERNSHIPS[getPage() * getInternshipsPerPage() + number];
}

/**
 * This function refreshes all internship data and applies filters.
 */
function refreshInternshipsData(callback = null) {
    // Get all the internships, show them when arrived
    $.ajax({
        url: "get-all-events-data",
        success: function (result) {
            ALL_INTERNSHIPS = result;
            filterInternships();
            if (callback) {
                callback();
            }
        }
    });
}

/**
 * Displays the given list of internships in the accordion
 * @param list array of internships
 */
function swapInternships(list) {
    INTERNSHIPS = list;
    setLoading(false);
    if (getPage() >= getPages()) {
        setPage(0);
    }
    refreshInternships();
    refreshNavigation();
    setActiveNavElement(getPage());
}

/**
 * Fills the accordion with the global internships variable
 */
function refreshInternships() {
    let page = getPage();
    let number = getInternshipsPerPage();

    let start = page * number;
    let internshipsToShow = null;

    if (INTERNSHIPS.length > start + number) {
        internshipsToShow = INTERNSHIPS.slice(start, start + number);
    } else {
        internshipsToShow = INTERNSHIPS.slice(start);
    }

    provideCards(internshipsToShow.length);
    for (let i = 0; i < internshipsToShow.length; i++) {
        fillCard(i, internshipsToShow[i]);
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
 * Fills a card with an internship
 * @param {number} number the unique ID of the card
 * @param internship the internship that will be shown
 */
function fillCard(number, internship) {
    // Set title and link
    let title = internship["title"];
    $("#card-title" + number).html(title).attr("href", 'event-page?event_id=' + internship["internship_id"]);

    // Set the content preview
    let content = internship["html_content_eng"] || "No description available.";
    $("#card-text" + number).html(content);
    $("#link" + number).click(function () {
        window.location.href = '/event-page?event_id=' + internship["internship_id"];
    });

    $(`#card-collapse${number}`).collapse('hide');

    // Add badges
    let badges = $("#card-badges" + number);
    badges.children().remove();

    if (is_occupied(internship)) {
            badges.append($(`
                <span class="badge badge-danger" style="margin-right: 10px">
                    ${language === 'en' ? 'Occupied' : 'Volzet'}
                </span>
            `))
        }

    if (!isReviewed(internship)){
        badges.append($(`
            <span class="badge badge-danger" style="margin-right: 10px">
                ${language === 'en' ? 'Not Reviewed' : 'Niet Beoordeeld'}
            </span>
        `))
    }
    if (internship["is_active"] !== undefined && !internship["is_active"]) {
        let inactive_badge = document.createElement("span");
        inactive_badge.setAttribute("class", "badge badge-info");
        inactive_badge.innerHTML = "Inactive";
        inactive_badge.style = "margin-right: 10px";
        badges.append(inactive_badge);
    }

    if (internship["company_name"]) {
        let company_badge = document.createElement("span");
        company_badge.setAttribute("class", "badge badge-success");
        company_badge.innerHTML = internship["company_name"];
        company_badge.style = "margin-right: 10px";
        badges.append(company_badge);
    }

    if (internship['tags'] !== undefined) {
        for (let i = 0; i < internship['tags'].length; i++) {
            let tag_badge = document.createElement("span");
            tag_badge.setAttribute("class", "badge tag-bg-color");
            tag_badge.innerHTML = internship['tags'][i];
            tag_badge.style = "margin-right: 10px";
            badges.append(tag_badge);
        }
    }

    let date_badge = document.createElement("span");
    // console.log(internship);
    date_badge.innerHTML = "Created on: " + internship["creation_date"];
    date_badge.style = "color : #B5B7BA; white-space: nowrap;";
    badges.append(date_badge);
}

/**
 * Ensures that there is the right amount of cards in the accordion.
 * Done by either adding or removing cards.
 * @param number amount of cards wanted
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
            accordion.append(createCard(length()));
        }
    }
}

/**
 * Creates a JQuery DOM element of a card, meant to be placed in the accordion
 * @param {number} number the unique ID of the card
 * @returns {*|jQuery|HTMLElement} DOM Card element
 */
function createCard(number) {
    let cardClasses;
    let titleClass;

    if (theme === "dark") {
        titleClass = "text-white";
        cardClasses = "text-white bg-dark border-secondary";
    } else {
        titleClass = "";
        cardClasses = "";
    }

    // Element is the actual html code
    let element = `
    <div class="card ${cardClasses}">
      <div class="card-body">
        <div class="row">
            <div class="col">
                <h5 class="card-title">
                    <a id="card-title${number}"></a> 
                    <button type="button" class="btn btn-sm ${titleClass}" style="font-size: 10px" onclick="$('#card-collapse${number}').collapse('toggle');">. . .</button>
                </h5>
                <h6 class="card-subtitle mb-2" id="card-badges${number}"></h6>
                <div class="collapse card-text" id="card-collapse${number}">
                        <p id="card-text${number}"></p>
                </div>
            </div>
        </div>
      </div>
    </div>`;

    return $(element);
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
            refreshInternships();
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
            refreshInternships();
        }
        return false;
    };
    list.appendChild(next);

    return nav;
}