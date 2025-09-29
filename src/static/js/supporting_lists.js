'use strict';

// Enum to indicate current tab
const tab = {TAGS: 1, TYPES: 2, GROUPS: 3, EMPLOYEES: 5, PROMOTORS: 6};

// Global variables
let tags = [];
let types = [];
let researchGroups = [];
let studyFields = [];
let employees = [];
let employeeNames = [];
let promotors = [];
let promotorNames = [];

let currentElements = [];
let currentTab = tab.GROUPS;

/**
 * MAIN FUNCTION
 */
$(document).ready(function () {

    refreshData();

    $("#selectAllButton").click(function () {
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

        setupButtons();
    });

    $("#addButton").click(addModal);
    $("#activationButton").click(activationModal);
    $("#editButton").click(editMultipleModal);
});

/**
 * This function refreshes all data lists.
 */
function refreshData() {
    $.ajax({
        url: "get-all-list-data",
        success: function (result) {
            // Storing everything in the global variables
            tags = result["tags"];
            types = result["types"];
            researchGroups = result["research groups"];
            employees = result["employees"];
            promotors = result["promotors"];
            employeeNames = [];
            for (let emp of employees) {
                employeeNames.push(emp["name"]);
            }

            promotorNames = [];
            for (let prom of promotors) {
                promotorNames.push(prom["name"]);
            }

            function getSort(fieldName) {
                return function (a, b) {
                    if (a[fieldName].toLowerCase() < b[fieldName].toLowerCase()) {
                        return -1;
                    }
                    if (a[fieldName].toLowerCase() > b[fieldName].toLowerCase()) {
                        return 1;
                    }
                    return 0;
                }
            }

            // Sorting the lists
            tags.sort();
            employees.sort(getSort("name"));
            researchGroups.sort(getSort("name"));
            types.sort(getSort("type_name"));
            promotors.sort(getSort("name"));

            initGroupSelector();
            refreshContent();
        }
    });
}

/**
 * This function adds one to its input.
 * @param {list} list of objects to be filtered
 * @returns filtered list
 */
function groupFilter(list) {
    let selectorValue = $("#research-group-selector").val();
    if (currentTab !== tab.EMPLOYEES || selectorValue === "All") {
        return list;
    }

    let result = [];
    for (let elem of list) {
        if (elem["research_group"] === selectorValue) {
            result.push(elem);
        }
    }
    return result;
}

/**
 * This function refreshes the page content.
 * @param {type} current tab type
 */
function refreshContent(type = currentTab) {
    // If it's a different type, reset search bar
    if (type !== currentTab) {
        $("#search").val("");
        currentTab = type;
    }

    if (type === tab.EMPLOYEES || type == tab.PROMOTORS) {
        $("#research-group-selector").show();
    } else {
        $("#research-group-selector").hide();
    }

    let content = $("#content");
    content.children().remove();

    let list = getListForTab(type);
    list = searchFilter(list, type);
    list = groupFilter(list);

    setupButtons();

    if (list.length === 0) {
        setEmpty(true);
        return;
    }

    setEmpty(false);
    for (let i = 0; i < list.length; i++) {
        let active;
        if (list[i]["is_active"] !== undefined) {
            active = list[i]["is_active"];
        } else {
            active = true;
        }

        if (type === tab.EMPLOYEES) {
            let tags = [];
            if (list[i]["is_admin"]) tags.push("admin");
            if (list[i]["is_promotor"]) tags.push("promotor");
            let listItem = createListItem(i, list[i]["name"], active, tags);
            make_popover(listItem.find("a")[0]);
            populate_popover(listItem.find("a")[0], list[i]);
            content.append(listItem);
        }
        else if (type === tab.PROMOTORS) {
            let listItem = createListItem(i, list[i]["name"], active, null,false);
            make_popover(listItem.find("a")[0]);
            populate_popover(listItem.find("a")[0], list[i]);
            content.append(listItem);
        }
        else if (type === tab.GROUPS) {
            content.append(createListItem(i, list[i]["name"], active));
        }
        else if (type === tab.TYPES) {
            content.append(createListItem(i, list[i]["type_name"], active));
        }
        else {
            content.append(createListItem(i, list[i], active));
        }
    }

    currentElements = list;

    if (type === tab.EMPLOYEES || type == tab.PROMOTORS) {
        // Makes the popovers work
        $('[data-toggle="popover"]').popover({
            html: true,
            placement: "top",
            trigger: "focus"
        });
    }
    refreshTranslationDict();
}

/**
 * This function converts the tab type in to a string.
 * @param {tab} obj tab to be converted
 * @returns {string} converted string.
 */
function tabToString(obj) {
    switch (obj) {
        case tab.EMPLOYEES: return "employees";
        case tab.GROUPS: return "groups";
        case tab.TAGS: return "tags";
        case tab.TYPES: return "types";
        case tab.PROMOTORS: return "promotors";
    }
}

/**
 * This function generates a modal to activate/deactivate selected items and sends ajax call .
 */
function activationModal() {
    $("#modal-info").text("");
    let checkedElements = getCheckedItems();
    let length = checkedElements.length;
    let activate = nonActiveInList(checkedElements);

    $("#modal-title").text(`You have selected ${length} ${length === 1 ? "item": "items"}`);
    $("#modal-body").text(`Are you sure you want to ${ activate ? "activate": "deactivate"}?`);

    let elementKeys = [];
    if (currentTab === tab.GROUPS) {
        for (let elem of checkedElements) {
            elementKeys.push(elem["name"]);
        }
    } else if (currentTab === tab.EMPLOYEES) {
        for (let elem of checkedElements) {
            elementKeys.push(elem["e_id"]);
        }
    } else if (currentTab === tab.TYPES) {
        for (let elem of checkedElements) {
            elementKeys.push(elem["type_name"]);
        }
    } else if (currentTab === tab.PROMOTORS) {
        for (let elem of checkedElements) {
            elementKeys.push(elem["name"]);
        }
    } else {
        for (let elem of checkedElements) {
            elementKeys.push(elem);
        }
    }

    let saveChanges = $("#saveChangesButton");
    saveChanges.off("click");
    saveChanges.click(function () {
        $("#modal-info").text("Saving...");

        $.ajax({
            url: "modify-lists",
            method: "POST",
            data: JSON.stringify({
                "type": "activation",
                "items": elementKeys,
                "activate": activate,
                "object": tabToString(currentTab)
            }),
            contentType: 'application/json',
            success: function (message) {
                $("#modal-info").text("Successfully saved!");
                refreshData();
                refreshTranslationDict();
            },
            error: function (message) {
                $("#modal-info").text("Error occurred: " + message["responseJSON"]["message"])
            }
        })
    });
    $("#modal").modal("toggle");
}

/**
 * This function adds research groups to the research group selector
 */
function initGroupSelector() {
    // Add the research groups to the select
    let options = `<option value="All">All research groups</option>`;
    for (let group of researchGroups) {
        options += `<option value="${group.name}">${group.name}</option>`
    }
    $("#research-group-selector").html(options);
}

/**
 * This function provides functionality to modify multiple research
 * @param {number} input any number
 * @returns {number} that number, plus one.
 */
function editMultipleModal() {
    $("#modal-info").text("");
    let checkedElements = getCheckedItems();
    let length = checkedElements.length;
    $("#modal-title").text(`You have selected ${length} ${length === 1 ? "item": "items"}`);

    // Add the research groups to the select
    let options = `<option value="Don't change">Don't change</option>`;
    for (let group of researchGroups) {
        options += `<option value="${group.name}">${group.name}</option>`
    }

    let html = `
        <div class="row">
            <div class="col">
                Research Group                
            </div>
            <div class="col">
                <select style='width: 100%; max-width: 150px;' id="research-group-input">
                    ${options}
                </select>
            </div>
        </div>
        
    `;
    $("#modal-body").html(html);

    let elementKeys = [];
    for (let elem of checkedElements) {
        elementKeys.push(elem["e_id"]);
    }

    let saveChanges = $("#saveChangesButton");
    saveChanges.off("click");
    saveChanges.click(function () {
        let newResearchGroup = $("#research-group-input").val();
        if (newResearchGroup === "Don't change") {
            return;
        }
        $("#modal-info").text("Saving...");
        $.ajax({
            url: "modify-lists",
            method: "POST",
            data: JSON.stringify({
                "type": "edit multiple",
                "items": elementKeys,
                "research-group": newResearchGroup
            }),
            contentType: 'application/json',
            success: function (message) {
                $("#modal-info").text("Successfully saved!");
                refreshData();
            },
            error: function (message) {
                $("#modal-info").text("Error occurred: " + message["responseJSON"]["message"])
            }
        })
    });

    $("#modal").modal("toggle");
}

/**
 * This function creates a modal to change an item.
 * @param item item with values to be changed
 */
function editModal(item) {
    $("#modal-info").text("");
    $("#modal-title").text("Edit");
    $("#modal-body").html(getEditHTML());

    if (currentTab === tab.GROUPS) {
        autocomplete($('#contact-person-input')[0], employeeNames);
    }

    if (currentTab === tab.GROUPS) {
        $("#name-input").val(item["name"]);
        $("#abbreviation-input").val(item["abbreviation"]);
        $("#address-input").val(item["address"]);
        $("#telephone-input").val(item["telephone_number"]);
        $("#description-input").val(item["description_eng"]);
        if (item["contact_person"]) {
            $("#contact-person-input").val(item["contact_person"]);
        }
    }
    else if (currentTab === tab.EMPLOYEES) {
        $("#name-input").val(item["name"]);
        $("#email-input").val(item["email"]);
        $("#office-input").val(item["office"]);
        $("#research-group-input").val(item["research_group"]);
        $("#intern-input").val(item["is_external"] ? "TRUE": "FALSE");
        $("#admin-input").val(item["is_admin"] ? "TRUE": "FALSE");
        $("#extra-info-input").val(item["extra_info"]);
        if (item["title"]) {
            $("#title-input").val(item["title"]);
        }
    }
    else if (currentTab === tab.STUDY_FIELDS) {
        $("#modal-input").val(item["field_name"]);
    }
    else if (currentTab === tab.TYPES) {
        $("#modal-input").val(item["type_name"]);
        $("#dutch-input").val(item["translation_nl"]);
        $("#english-input").val(item["translation_eng"]);
    }
    else {
        $("#modal-input").val(item);
    }

    let saveChanges = $("#saveChangesButton");
    saveChanges.off("click");
    saveChanges.click(function () {
        $("#modal-info").text("Saving...");

        let json = getEditData();
        json["type"] = "edit";
        json["is_active"] = item["is_active"];
        if (currentTab === tab.GROUPS) {
            json["key"] = item["name"];
        } else if (currentTab === tab.EMPLOYEES) {
            json["key"] = item["e_id"];
            json["picture_location"] = item["picture_location"];
            json["is_active"] = item["is_active"]
        } else if (currentTab === tab.TYPES) {
            json["key"] = item["type_name"];
        } else {
            json["key"] = item;
        }
        $.ajax({
            url: "modify-lists",
            method: "POST",
            data: JSON.stringify(json),
            contentType: 'application/json',
            success: function (message) {
                $("#modal-info").text("Successfully saved!");
                refreshData();
            },
            error: function (message) {
                $("#modal-info").text("Error occurred: " + message["responseJSON"]["message"])
            }
        });
    });
    $("#modal").modal("toggle");
}

/**
 * This function fetches all new values from the edit modal into an array.
 * @return {array} data all new values
 */
function getEditData() {
    let data = {};
    if (currentTab === tab.GROUPS) {
        data["object"] = "research_group";
        data["name"] = $("#name-input").val();
        data["abbreviation"] = $("#abbreviation-input").val();
        data["address"] = $("#address-input").val();
        data["telephone_number"] = $("#telephone-input").val();
        data["contact_person"] = $("#contact-person-input").val();
        data["description"] = $("#description-input").val();
    } else if (currentTab === tab.EMPLOYEES) {
        data["object"] = "employee";
        data["name"] = $("#name-input").val();
        data["email"] = $("#email-input").val();
        data["office"] = $("#office-input").val();
        data["research_group"] = $("#research-group-input").val();
        data["is_external"] = $("#intern-input").val();
        data["is_admin"] = $("#admin-input").val();
        data["title"] = $("#title-input").val();
        data["extra_info"] = $("#extra-info-input").val();
    } else if (currentTab === tab.TYPES) {
        data["object"] = "type";
        data["string"] = $("#modal-input").val();
        data["dutch"] = $("#dutch-input").val();
        data["english"] = $("#english-input").val();
    } else if (currentTab === tab.TAGS) {
        data["object"] = "tag";
        data["string"] = $("#modal-input").val();
    } else if (currentTab == tab.PROMOTORS) {
        data["object"] = "promotor";
        data["name"] = $("#employee-input").val();
    }
    return data;
}

/**
 * This function handles all events when a checkbox is checked.
 */
function onClickCheckbox() {
    setupButtons();
}

/**
 * This function toggles a modal to add a new item.
 */
function addModal() {
    $("#modal-info").text("");

    if (currentTab === tab.TAGS) {
        $("#modal-title").text("Add new tag");
    } else if (currentTab === tab.TYPES) {
        $("#modal-title").text("Add new type");
    } else if (currentTab === tab.GROUPS) {
        $("#modal-title").text("Add new research group");
    } else if (currentTab === tab.EMPLOYEES) {
        $("#modal-title").text("Add new employee");
    } else if (currentTab == tab.PROMOTORS) {
        $("#modal-title").text("Add new promotor");
    }

    $("#modal-body").html(getEditHTML());

    let saveChanges = $("#saveChangesButton");
    saveChanges.off("click");
    saveChanges.click(function () {
        $("#modal-info").text("Saving...");
        let json = getEditData();
        json["type"] = "add";
        $.ajax({
            url: "modify-lists",
            method: "POST",
            data: JSON.stringify(json),
            contentType: 'application/json',
            success: function (message) {
                $("#modal-info").text("Successfully saved!");
                refreshData();
            },
            error: function (message) {
                $("#modal-info").text("Error occurred: " + message["responseJSON"]["message"])
            }
        });
    });

    $("#modal").modal("toggle");
}

/**
 * This function handles all events when an edit button pressed.
 * @param {number} integer index in the currentElements array for the correct item.
 */
function onClickEditButton(integer) {
    editModal(currentElements[integer]);
}

/**
 * This function returns the correct body for the modal which is used to add data.
 * @return {string} html string for the body
 */
function getEditHTML() {
    if (currentTab === tab.GROUPS) {
        return `
            <div class="row">
                <div class="col">
                    Name
                </div>
                <div class="col">
                    <input id="name-input" class="form-control-sm">
                </div>
            </div>
            <div class="row">
                <div class="col">
                    Abbreviation
                </div>
                <div class="col">
                    <input id="abbreviation-input" class="form-control-sm">
                </div>
            </div>
            <div class="row">
                <div class="col">
                    Address
                </div>
                <div class="col">
                    <input id="address-input" class="form-control-sm">
                </div>
            </div>
            <div class="row">
                <div class="col">
                    Telephone
                </div>
                <div class="col">
                    <input id="telephone-input" class="form-control-sm">
                </div>
            </div>
            <div class="row">
                <div class="col">
                    Contact Person
                </div>
                <div class="col">
                    <input id="contact-person-input" type="text" class="form-control-sm">
                </div>
            </div>
            <div class="row">
                <div class="col">
                    Description
                </div>
                <div class="col">
                    <textarea id="description-input" class="form-control-sm"/>
                </div>
            </div>
        `;
    } else if (currentTab === tab.EMPLOYEES) {
        let item = `
            <div class="row">
                <div class="col">
                    Name
                </div>
                <div class="col">
                    <input id="name-input" class="form-control-sm">
                </div>
            </div>
            <div class="row">
                <div class="col">
                    Email
                </div>
                <div class="col">
                    <input id="email-input" class="form-control-sm">
                </div>
            </div>
            <div class="row">
                <div class="col">
                    Office
                </div>
                <div class="col">
                    <input id="office-input" class="form-control-sm">
                </div>
            </div>
            <div class="row">
                <div class="col">
                    Extra Info
                </div>
                <div class="col">
                    <input id="extra-info-input" class="form-control-sm">         
               </div>
            </div>
            <div class="row">
                <div class="col">
                    Research Group
                </div>
                <div class="col">
                    <select style='width: 100%; max-width: 150px;' id="research-group-input">`;

        // Add the research groups to the select
        if (currentTab === tab.EMPLOYEES) {
            let options = `<option value="">None</option>`;
            for (let group of researchGroups) {
                options += `<option value="${group.name}">${group.name}</option>`
            }
            item += options;
        }

        item += `                    
       
                    </select>                
                </div>
            </div>
            <div class="row">
                <div class="col">
                    External
                </div>
                <div class="col">
                    <select id="intern-input">
                        <option value="FALSE">No</option>
                        <option value="TRUE">Yes</option>
                    </select>            
               </div>
            </div>
            <div class="row">
                <div class="col">
                    Admin
                </div>
                <div class="col">
                    <select id="admin-input">
                        <option value="FALSE">No</option>
                        <option value="TRUE">Yes</option>
                    </select>            
               </div>
            </div>
            <div class="row">
                <div class="col">
                    Title
                </div>
                <div class="col">
                    <select id="title-input">
                        <option value="">None</option>
                        <option value="PhD">PhD</option>
                        <option value="Professor">Professor</option>
                    </select>            
               </div>
            </div>
        `;
        return item;
    }  else if (currentTab === tab.PROMOTORS) {
        let output = `<select style='width: 100%; max-width: 150px;' id="employee-input">`;

        let options = `<option value="">None</option>`;
        for (let emp of employees) {
            if (!promotorNames.includes(emp.name)) {
                options += `<option value="${emp.name}">${emp.name}</option>`;
            }
        }
        output += options;
        output += `</select>`;
        return output;
    } else if (currentTab === tab.TYPES){
      return `
    <input id="modal-input" class="form-control">
    <input id="dutch-input" class="form-control" placeholder="Dutch translation">
    <input id="english-input" class="form-control" placeholder="English translation">
`;
    }
    else {
        return `<input id="modal-input" class="form-control">`;
    }
}

/**
 * This function configures the buttons to be shown.
 */
function setupButtons() {
    let editSelected = $("#editButton");
    let selectAll = $("#selectAllButton");
    let activation = $("#activationButton");
    let add = $("#addButton");

    if (currentTab === tab.EMPLOYEES) {
        selectAll.show();
        editSelected.show();
        add.hide();
    } else if (currentTab == tab.PROMOTORS) {
        selectAll.show();
        editSelected.hide();
        add.show();
    } else {
        selectAll.hide();
        editSelected.hide();
        add.show();
    }

    // Corresponding items from the checked checkboxes
    let items = getCheckedItems();
    if (!items.length) {
        activation.hide();
        editSelected.hide();
        return;
    }

    if (nonActiveInList(items)) {
        activation.attr("class", "btn search-button-color");
        activation.text("Activate selected");
    } else {
        activation.attr("class", "btn danger-color");
        activation.text("Deactivate selected");
    }

    activation.show();
}

/**
 * This function checks if there is a nonactive item in a list.
 * @param {array} list list of items
 * @return {boolean} nonActiveItemPresent true if there is a nonactive item present in the array
 */
function nonActiveInList(list) {
    let nonActiveItemPresent = false;
    for (let elem of list) {
        let active = elem["is_active"];
        if (active !== undefined && !active) {
            nonActiveItemPresent = true;
            break;
        }
    }
    return nonActiveItemPresent;
}

/**
 * This function filters a list based on a type and a search value.
 * @param {array} list list of items to be filtered
 * @param {tab} type to be filtered by
 * @return {array} result all filtered results
 */
function searchFilter(list, type) {
    let searchQuery = $("#search").val().trim().toLowerCase();

    let result = [];
    for (let element of list) {
        if (type === tab.EMPLOYEES || type === tab.GROUPS || type == tab.PROMOTORS) {
            if (element["name"].toLowerCase().indexOf(searchQuery) !== -1) {
                result.push(element);
            }
        }
        else if (type === tab.TYPES) {
            if (element["type_name"].toLowerCase().indexOf(searchQuery) !== -1) {
                result.push(element);
            }
        }
        else if (element.toLowerCase().indexOf(searchQuery) !== -1) {
            result.push(element);
        }
    }

    return result;
}

/**
 * This function returns the correct list for a given input type.
 * @param {tab} type to be filtered by
 * @return {array} correct list to be returned
 */
function getListForTab(type) {
    if (type === tab.TAGS) {
        return tags;
    } else if (type === tab.TYPES) {
        return types;
    } else if (type === tab.GROUPS) {
        return researchGroups;
    } else if (type === tab.EMPLOYEES) {
        return employees;
    } else if (type == tab.PROMOTORS) {
        return promotors;
    }
}

/**
 * This function turns an empty content text on/off.
 * @param {boolean} bool selector
 */
function setEmpty(bool) {
    let emptyContentText = $("#empty-content");
    if (bool) {
        emptyContentText.show();
    } else {
        emptyContentText.hide();
    }
}


/**
 * Makes a bootstrap popover for a given object.
 * @param element
 */
function make_popover(element) {
    element.href = "#popover";
    element.setAttribute("data-toggle", "popover");
}


/**
 * Fills the popover with the data of the employee.
 * @param popover
 * @param employee
 */
function populate_popover(popover, employee) {
    popover.href = "#employee-popover";
    popover.setAttribute("data-toggle", "popover");
    //Title
    let status;
    if(employee["is_external"]){
        status = "External"
    }
    else{
        status = "Internal"
    }
    let title = "";
    if(employee['title'] !== null ){
        title = employee['title'];
    }
    popover.setAttribute("data-original-title", title + " " + employee['name'] + " (" + status + ")");
    //Make left side of popover (profile picture)
    let html_content = "<div class='row'><div class='col-sm-4' id='employee_image'>";
    if(employee['picture_location'] !== null){
        html_content += "<img src='" + employee['picture_location'] + "' alt='static/images/default_avatar.svg'  width='100px' height='100px'>";
    }
    else{
        html_content += "<img src='static/images/default_avatar.svg' width='100px' height='100px'>";
    }
    //Make right side of popover (info)
    html_content += "</div><div class='col-sm-8' id='employee_info'>";
    if(employee['email'] !== null){
        let mail = employee['email'];
        html_content += "<p>Email: <a href='mailto:" + mail + "'>" + mail + "</a></p>";
    }
    if(employee['office'] !== null){
        html_content += "<p>Office:" + employee['office'] + "</p>";
    }
    if(employee['extra_info'] !== null){
        html_content += "<p>Extra Info: " + employee['extra_info'] + "</p>"
    }
    if(employee['research_group'] !== null){
        html_content += "<p>Research Group: " + employee['research_group'] + "</p>";
    }
    if(employee['title'] !== null){
        html_content += "<p>Title: " + employee['title'] +"</p>"
    }
    html_content += "</div></div>";
    popover.setAttribute("data-content", html_content);
}

/**
 * This function creates a list item.
 * @param {number} integer id for checkboxes and their respective labels
 * @param {string} text basic text for the list item
 * @return {boolean} active toggles the list items' activity status
 */
function createListItem(integer, text, active, tags=null, editable=true) {
    if (! active) {
        text += "<span class=\"badge badge-info\" style='margin-left: 10px'>Non Active</span>"
    }

    let darkClasses = "";
    if (theme === "dark") {
        darkClasses += "bg-dark border-secondary text-white"
    }

    let item = `
    <li class="list-group-item d-flex justify-content-between align-items-center ${darkClasses}">
        <div class="col">
            <a>${text}</a>`

    if (tags) {
        for (let i = 0; i < tags.length; i++) {
            item += '<span class="badge badge-info" style="margin-left: 10px">' + tags[i] + '</span>'
        }
    }

    item += `
        </div>
        <div style="display: inline-block;">
            <div class="row">                
    `;
    if (editable) {
        item += `<button class="btn bg-light btn-sm" type="button" id="edit-button${integer}"><span style="font-size: 20px;" onclick="onClickEditButton(${integer})"><b>&#9998;</b></span></button>`
    }

    item += `
                <div class="custom-control form-control-lg custom-checkbox" style="display: inline-block; margin-left: 10px">
                        <input type="checkbox" class="custom-control-input" id="checkbox${integer}" onclick="onClickCheckbox()">
                        <label class="custom-control-label" for="checkbox${integer}"></label>
                </div>
            </div>
        </div>
    </li>`;


    return $(item);
}


/**
 * Retrieves the projects with a checked checkbox
 * @returns {Array} of project ID's
 */
function getCheckedItems() {
    let i = 0;
    let currentCheckbox = $("#checkbox0");
    let checkedItems = [];

    // Checks if current checkbox exists
    while (currentCheckbox.length) {

        if (currentCheckbox.is(":checked")) {
            checkedItems.push(currentElements[i]);
        }

        // Go to the next one
        i++;
        currentCheckbox = $(`#checkbox${i}`)
    }

    return checkedItems;
}

/**
 * This function refreshes content when receiving an enter input.
 * @param {event} e
 * @returns {boolean} true when succeeded
 */
function filterOnEnter(e) {
    var keynum = e.keyCode || e.which;  //for compatibility with IE < 9
    if (keynum === 13) { //13 is the enter char code
        e.preventDefault();
        refreshContent();
    }
    return true;
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

