/**
 * This function resets the search value and refreshes internships data.
 */
function resetSearch() {
    setSearch("");
    $("#search_text").val("");
    $("#reset-search").hide();
    refreshInternshipsData();
}

function onChangeLiveEventFilter(element) {
    setParam('available', element.checked);
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
    const students = internship['registrations'].filter(registration => registration['status'] === "Accepted").length;
    return internship['max_students'] <= students;
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