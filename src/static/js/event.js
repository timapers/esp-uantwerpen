"use strict"

// Global Variables
let event;
let company;
let links;
let is_contact_person;
let groups;
let types;
let contact_persons;

// Dropzone configuration
Dropzone.options.dropzone = {
    init: function () {

        this.on("success", function (file, msg) {
            event['attachments'].push({
                'name': msg["name"],
                'file_location': msg['file_location']
            });
            add_editable_attachment(msg)
        });

        this.on("complete", function (file) {
            this.removeFile(file);
        });

        this.on("error", function (file, msg) {
            this.removeFile(file);
            alert(msg);
        });
    }
};

/**
 * MAIN FUNCTION
 */
$(function () {

    // init_description_toggle();
    init_tag_generator();

    // $("#external-employee-btn").click(addModal);
    // $("#modify-btn").click(edit_event);

    $("#edit-tags").tagsinput({
        tagClass: "badge tag-bg-color"
    });

    if ($.urlParam("success")) {
        $("#success").show();
    }

        // if ($.urlParam("new")) {
        //     new_event();
        //     fetch_additional_data(edit_event);
    // }
    else {
        fetch_event();
        fetch_additional_data();
    }
});

/**
 * This function adds an editable attachment to the attachment list.
 * @param {item} attachment attachment to be added
 */
function add_editable_attachment(attachment) {
    $("#attachments").show();
    $("#attachments-list").append(
        $(`<span class="badge type-bg-color mr-1">
                <a class="type-bg-color" href="get-attachment/${attachment['file_location']}">${attachment['name']}</a> 
                &nbsp;
                <span onclick="remove_attachment(this)" style="cursor: pointer;">x</span>
            </span>`)
    );
}


/**
 * This function removes a certain attachment/
 * @param {item} elem to be removed attachment
 */
function remove_attachment(elem) {
    elem = $(elem);

    // Extract file location
    let text = elem.parent().children().first().attr("href");
    text = text.substring(text.lastIndexOf('/') + 1);

    elem.parent().remove();

    event['attachments'] = event['attachments'].filter(function (value) {
        return value['file_location'] !== text;
    });
}

/**
 * This function removes all data, so a new event can be made from scratch.
 */
function new_event() {
    // TODO: Check what needs to get here
    event = {
        tags: [],
        types: [],
        html_content_eng: "A fantastic event idea is born",
        html_content_nl: "Een fantastisch event idee is ontstaan",
        attachments: [],
        is_active: false
    };
    $("#modify-btn").show();
    $("#title").text("Event Title");
    construct_description();
}


/**
 * This function fetches additional events page data.
 * @param {boolean} callback defines if callback() should be called
 */
function fetch_additional_data(callback) {
    $.ajax({
        url: "events-page-additional",
        success: function (result) {
            types = result["types"];
            groups = result["groups"];
            contact_persons = result["contact_persons"];
            // TODO: DOuble check this
            // init_supervisors_input(true);
            // init_supervisors_input(false);
            // init_selectpickers();

            if (callback) {
                callback();
            }
        }
    });
}

/**
 * This function toggles the html content for a event (default values).
 */
function init_description_toggle() {
    $('#description-toggle').change(function () {
        const english = $(this).prop('checked');
        const editor = CKEDITOR.instances.description;

        if (!editor) {
            return;
        }

        let current_content = editor.getData();
        let new_content;

        if (english) {
            event["html_content_nl"] = current_content;
            new_content = event["html_content_eng"] ? event["html_content_eng"] : "Type here...";
        } else {
            event["html_content_eng"] = current_content;
            new_content = event["html_content_nl"] ? event["html_content_nl"] : "Typ hier...";
        }

        editor.setData(new_content);
    });
}

/**
 * This function provides functionality for the tag generator.
 */
function init_tag_generator() {
    $('#generate-tags-btn').click(function () {
        let both_descriptions = "";
        let title = event["title"]
        const english = $("#description-toggle").prop('checked');
        if (english) {
            both_descriptions += " " + event['html_content_nl'];
        } else {
            both_descriptions += " " + event['html_content_eng'];
        }

        $.ajax({
            url: "generate-tags",
            type: 'get',
            dataType: 'json',
            data: {title: title, data: both_descriptions},
            success: function (new_tags) {
                for (const new_tag of new_tags) {
                    $('#edit-tags').tagsinput('add', new_tag[0]);
                }
            }
        });
    });
}

/**
 * This function provides initializes the selectors.
 */
function init_selectpickers() {
    $("#edit-research-group").html(
        groups.map(function (elem) {
            return `<option title="${elem}">${elem}</option>`
        }).join("")
    );

    $("#edit-type").html(
        types.map(function (type) {
            return `<option title="${type}">${type}</option>`
        }).join("")
    );

    // After adding the options, refresh is necessary for the selectpicker lib
    $('.selectpicker').selectpicker('refresh');
}


/**
 * This function initializes the supervisor input.
 */
function init_supervisors_input(contact_person) {
    // TODO: MAKE HTML AND CHANGE THIS TO ONLY COMP AND CONTACT PERSON
    let supervisors_input;
    let list_source;
    if (contact_person) {
        supervisors_input = $("#contact_person input");
        list_source = contact_persons;

        supervisors_input.on('itemAdded', function (event) {
            if (name === event.item) {
                is_contact_person = true;
            } else {
                is_contact_person = false;
            }
            refresh_active_button();
        });
        supervisors_input.on('beforeItemRemove', function (event) {
            if (confirm("Removing the company will automatically set the event to inactive. Are you sure you want to continue?")) {
                event["is_active"] = false;
                is_contact_person = false;
            } else {
                event.cancel = true;
            }
            refresh_active_button();
        });
    } else {
        supervisors_input = $("#co-companys input, #contact_persons input");
        list_source = employees;
    }
    //const supervisors_input = $("#supervisors input");

    // Initialize the tagsinput with autocomplete for employees
    if (contact_person) {
        supervisors_input.tagsinput({
            delimiter: '|',
            tagClass: "badge employee-bg-color ",
            typeahead: {
                afterSelect: function (val) {
                    this.$element.val("");
                },
                minLength: 0,
                source: list_source,
                showHintOnFocus: true,
                autoSelect: false,
                items: 'all'
            },
            freeInput: false,
            maxTags: 1
        });
    } else {
        supervisors_input.tagsinput({
            delimiter: '|',
            tagClass: "badge employee-bg-color ",
            typeahead: {
                afterSelect: function (val) {
                    this.$element.val("");
                },
                source: list_source
            },
            freeInput: false
        });
    }

    // Add the employee to the event when item is added
    supervisors_input.on("itemAdded", function (event) {
        const id = $(this).attr('id');

        let guidance;
        if (id === "contact_person-input") {
            guidance = "company";
        } else if (id === "co-companys-input") {
            guidance = "Co-company";
        } else {
            guidance = "contact_person";
        }


        for (const employee of event['employees']) {
            if (employee['guidance_type'] === guidance && employee['employee']['name'] === event.item) {
                return;
            }
        }

        event['employees'].push({
            guidance_type: guidance,
            employee: {name: event.item}
        });
    });

    // After initializing tagsinput above, new divs will be added which we style and hide until editing starts
    $("#supervisors .bootstrap-tagsinput")
        .hide()
        .css("border", "none")
        .css("box-shadow", "none");
}

function construct_contact_person() {
    // let contact_person = event['contact_person_name_email'];
    // if (contact_person) {
    //     let name = contact_person['name'];
    //     let email = contact_person['email'];
    //     let contact_persons_div = $("#contact_person");
    //
    //     let badge = $(`<span class="badge employee-bg-color">${name}</span>`);
    //     contact_persons_div.append(badge);
    // } else {
    //     $("#contact_person").hide();
    // }

}


/**
 * This function fetches all event data for a certain event.
 */
function fetch_event() {
    const event_id = $.urlParam("event_id");
    $.ajax({
        url: "get-all-event-data/" + event_id,
        type: "GET",
        success: function (data) {
            event = data["event_data"];
            company = data["company"];
            links = data["links"];
            is_contact_person = data["contact_person_name_email"] // Format dict with "name" : name, "email" : email


            construct_event();
            construct_description();
            // create_recommendations();
            // construct_contact_person();

            if (role === "student") {
                // update_user_behaviour();
                // update_like_status("Like", "Unlike")
                add_view();
            }
            enablePopovers();
        }
    })
}

/**
 * This function toggles a event's activity.
 */
function refresh_active_button() {
    const active_btn = $("#active-btn");

    if (event["is_active"]) {
        active_btn.attr("class", "btn my-2 btn-success");
        active_btn.text("Active")
    } else {
        active_btn.attr("class", "btn my-2 btn-danger");
        active_btn.text("Inactive");
    }

    if (is_contact_person) {
        active_btn.prop('disabled', false);
    } else {
        active_btn.prop('disabled', true);
    }
}

/**
 * This function provides functionality to edit a event and makes sure that all editable values are set.
 */
function edit_event() {
    $("#modify-btn").text("Save").off("click").click(save_event);
    $("#success").hide();

    refresh_active_button();

    $("#active-btn").show().click(function () {
        event["is_active"] = !event["is_active"];
        refresh_active_button();
    });

    $("#title").attr("contenteditable", "true");
    init_editor("description");

    $("#badges").html("");
    $("#extra-info").hide();
    $("#edit-options").show();
    $("#dropzone").show();

    $("#description-title").show();

    if (event['company'] !== null && event['company'] !== 'No Company') {
        $("#edit-research-group").selectpicker("val", event["company"]);
    }

    $("#edit-type").selectpicker("val", event["types"]);

    const tag_editor = $("#edit-tags");
    tag_editor.tagsinput("removeAll");
    for (const tag of event["tags"]) {
        tag_editor.tagsinput("add", tag);
    }

    $("#edit-students").val(event["max_students"]);

    for (const cp of event["contact_persons"]) {

        const type = employee["guidance_type"];

        if (type === "company") {
            $("#companys-input").tagsinput("add", employee["employee"]["name"])
        } else if (type === "Co-company") {
            $("#co-companys-input").tagsinput("add", employee["employee"]["name"]);
        } else if (type === "contact_person") {
            $("#contact_persons-input").tagsinput("add", employee["employee"]["name"]);
        }
    }

    $("#attachments-list").html("");
    for (const attachment of event['attachments']) {
        add_editable_attachment(attachment);
    }

    $("#supervisors .bootstrap-tagsinput").show();
    $("#supervisors .card").show();

    $("#supervisors ul").hide();
    $("#generate-tags-btn").show();

    $("#external-employee-btn").show();
    $("#recommendations").hide();
    $("#recommendations-title").hide();
}

/**
 * This function provides functionality to save the modified content to the database.
 * @param {boolean} description_warning toggles the description warnings
 * @param {boolean} type_warning toggles the event type warning
 */
function save_event(description_warning = true, type_warning = true, active_warning = true) {
    event["title"] = $('#title').text();

    let description = CKEDITOR.instances["description"].getData();

    if (description == "") {
        event["html_content_eng"] = "No description given";
    } else {
        event["html_content_eng"] = description;
    }

    const english_too_short = !event['html_content_eng'] || event['html_content_eng'].length < 50;

    if (english_too_short && description_warning) {
        const confirm_button = $(`<button class="btn btn-outline-success ml-2">Yes</button>`)
            .click(function () {
                save_event(false)
            });

        $("#error")
            .show()
            .text(`Your description has less than 50 characters and won't be saved, are you sure you want to continue?`)
            .append(confirm_button);
        return;
    }

    event['research_group'] = $("#edit-research-group").selectpicker("val");
    event['types'] = $("#edit-type").selectpicker('val');

    event["tags"] = $("#edit-tags").tagsinput("items");
    event["max_students"] = $("#edit-students").val();

    event['companys'] = $("#companys-input").tagsinput("items");
    event['contact_persons'] = $("#contact_persons-input").tagsinput("items");

    if (!event['research_group']) {
        $("#error").show().text("Research Group cannot be empty");
        return;
    }

    if (!event['types'].length) {
        $("#error").show().text("Pick at least one type");
        return;
    }

    if (!event['companys'].length) {
        $("#error").show().text("No company selected");
        return;
    }

    let active_types = type_still_active(event['types']);
    if (active_types.length > 0 && type_warning) {
        // console.log("in ")
        let err_text;
        if (active_types.length === 1) {
            err_text = 'Type: \"' + active_types.join() + '\" is still used by a registration. The registration type for those registrations need to be changed by you. Are you sure you want to continue?'
        } else {
            err_text = 'Types: ' + active_types.join() + '  are still used by a registration. The registration types for those registrations need to be changed by you. Are you sure you want to continue?'
        }
        const confirm_button = $(`<button class="btn btn-outline-success ml-2">Yes</button>`)
            .click(function () {
                save_event(description_warning, false)
            });

        $("#error")
            .show()
            .text(err_text)
            .append(confirm_button);
        return;
    }

    if (!event['companys'].length && !event['co-companys'].length && !event['contact_persons'].length) {
        $("#error").show().text("Add at least one guide");
        return;
    }

    if (!event['is_active'] && active_warning) {
        const confirm_button = $(`<button class="btn btn-outline-success ml-2">Yes</button>`)
            .click(function () {
                save_event(description_warning, type_warning, active_warning = false)
            });

        $("#error")
            .show()
            .text(`Your event is currently inactive, only the company can change the status to active. If you are not 
            the company, the company will be notified. Are you sure you want to continue`)
            .append(confirm_button);
        return;
    }

    $("#modify-btn").prop("disabled", true).text("Saving...");

    if ($.urlParam("new")) {
        event["new"] = true;
    }

    $.ajax({
        url: 'event-editor',
        method: 'post',
        contentType: 'application/json',
        data: JSON.stringify(event),
        success: function (response) {
            window.location.href = "/event-page?event_id=" + response['event_id'] + "&success=true";
        },
        error: function (msg) {
            $("#error").show().text(JSON.stringify(msg));
        }
    })
}

/**
 * This function initializes the editor.
 * @param {number} id the editor id
 */
function init_editor(id) {
    $("#" + id).attr("contenteditable", "true");
    return CKEDITOR.inline(id);
}

/**
 * Enables the popovers and sets default values.
 */
function enablePopovers() {
    $('[data-toggle="popover"]').popover({
        html: true,
        placement: "top",
        trigger: "focus"
    })
}

/**
 * Constructs the individual event pages.
 */
function construct_event() {
    // Calculate registered students
    let registered_students = 0;
    for (let i = 0; i < event['registrations'].length; i++) {
        if (event['registrations'][i]['status'].toLowerCase() === "accepted") {
            registered_students += 1;
        }
        if (role === "student" && event['registrations'][i]['student'] === userid) {
            document.getElementById("registration-btn").disabled = true;
            document.getElementById("registration-btn").innerHTML = event['registrations'][i]['status'];
        }
    }

    // Title
    let title = document.getElementById("title");
    title.innerHTML = event['title'];

    // Badges
    let badges = document.getElementById("badges");

    // Number of students
    let nr_students_badge = document.createElement("span");
    nr_students_badge.setAttribute("class", "badge success-color");
    nr_students_badge.setAttribute("style", "margin-right: 5px;");
    nr_students_badge.setAttribute("id", "nr_students_badge");
    nr_students_badge.innerHTML = "Students: " + registered_students + "/" + event['max_students'];
    badges.appendChild(nr_students_badge);

    //Type
    if (event['types'] === null || event['types'] === undefined || event['types'].length === 0) {
        let type_badge = document.createElement("span");
        type_badge.setAttribute("class", "badge type-bg-color");
        type_badge.setAttribute("style", "margin-right: 5px;");
        type_badge.innerHTML = "No type";
        badges.appendChild(type_badge);
    } else {
        for (let i = 0; i < event['types'].length; i++) {
            let type_badge = document.createElement("span");
            type_badge.setAttribute("class", "badge type-bg-color");
            type_badge.setAttribute("style", "margin-right: 5px;");
            type_badge.innerHTML = event['types'][i];
            badges.appendChild(type_badge);
        }
    }


    // Company
    if (event['company'] !== null && event['company'] !== 'No company') {
        let group = document.createElement("a");
        badges.appendChild(group);
        group.setAttribute("class", "badge research-group-bg-color");
        group.setAttribute("id", "rg-badge");
        // console.log(event);
        group.innerHTML = event['company_name'];
        make_comp_popover(group);
    }
    badges.appendChild(document.createElement("br"));


    // Tags
    if (event['tags'] === null || event['tags'] === undefined || event['tags'].length === 0) {
        let tag_badge = document.createElement("span");
        // tag_badge.setAttribute("class", "badge tag-bg-color");
        // tag_badge.setAttribute("style", "margin-right: 5px;");
        // tag_badge.innerHTML = "No tags";
        // badges.appendChild(tag_badge);
    } else {
        for (let i = 0; i < event['tags'].length; i++) {
            let tag_badge = document.createElement("span");
            tag_badge.setAttribute("class", "badge tag-bg-color");
            tag_badge.setAttribute("style", "margin-right: 5px;");
            tag_badge.innerHTML = event['tags'][i];
            badges.appendChild(tag_badge);
        }
    }

    //Reviewed
    if (event['is_reviewed'] == false) {
        $("#not-reviewed").show();
        $("#already-reviewed").hide();
    } else {
        $("#not-reviewed").hide();
        $("#already-reviewed").show();
    }


    // Extra info
    let info_div = document.getElementById("extra-info");

    // // Last Updated
    // let last_updated = document.createElement("span");
    // info_div.appendChild(last_updated);
    // last_updated.setAttribute("class", "extra_info_element");
    // last_updated.innerHTML = "Last Updated: " + timestampToString(event['last_updated']) + "  |  ";

    // Views
    let views = document.createElement("span");
    info_div.appendChild(views);
    views.setAttribute("class", "extra_info_element");
    views.innerHTML = "x" + event['view_count'] + " times viewed";

    const attachments = $("#attachments-list");
    let attachment_present;
    if (event['attachments']) {
        for (const attachment of event['attachments']) {
            attachment_present = true;
            attachments.append($(`<a href="get-attachment/${attachment['file_location']}"><span class="badge type-bg-color mr-1">${attachment['name']}</span></a>`));
        }
    }

    if (attachment_present) {
        $("#attachments").show();
    }
    // Address
    const address = event['address'];
    const address_div = document.getElementById("address-body");
    address_div.innerHTML = address;


    let edit_permissions = role === "admin";


    const cp_name = event['contact_person_name_email']['name'];
    const cp_email = event['contact_person_name_email']['email'];
    const html = $(`<li><a><span class="badge employee-bg-color bigoverflow">${cp_name}</span></></a></li>`);

    $("#contact_persons-list").append(html);
    $("#contact_person").css("display", "block");


    fill_cp_popover(html.children().first()[0], event['contact_person_name_email']);


// Registrations
    if (edit_permissions) {
        construct_registrations();
        // document.getElementById("modify-btn").setAttribute("style", "display: true;");
    }

    if (role === 'student') {
        // fill_register_dropdown();
        let container = $('#registration-btn');
        container.off('click').on('click', function () {
            register_for_event(event['types'][0]);

        });
    }
}


function fill_register_dropdown() {
    let container = $('#registration-options');
    for (let type of event['types']) {
        container.append($(`<a class="dropdown-item" href="#" onclick="register_for_event('${type}')">${type}</a>`))
    }
}


/**
 * Adds a description to the page.
 */
function construct_description() {
    let description = document.getElementById("description");
    description.innerHTML = event['html_content_eng'];
}

/**
 * Fills the popover with the data of the employee.
 * @param popover Popover element
 * @param cp Contact Person data
 */
function fill_cp_popover(popover, cp) {
    popover.href = "#contact_person-popover";
    popover.setAttribute("data-toggle", "popover");
    let cp_email = cp['email'];
    // Popover title
    const popover_title = `Contact Information`;
    popover.setAttribute("data-original-title", popover_title);
    const email = cp["email"] ? `Email: <a href='mailto:${cp_email}'>${cp_email}</a><br>` : "";
    let html = `
        <div class='row'>
            <div class='col-sm-auto' id='cp_info'>
                ${email}
            </div>
        </div>
    `;
    popover.setAttribute("data-content", html);

    // Enable it
    $(popover).popover({
        html: true,
        placement: "top",
        trigger: "focus"
    });
}


/**
 * Makes a popover for the research group.
 * @param popover The element to add the popover to.
 */
function make_comp_popover(popover) {
    popover.href = "#rg-popover";
    popover.setAttribute("data-toggle", "popover");
    //Title
    // console.log(company);
    popover.setAttribute("data-original-title", company);
    let info_present = false;
    let html_content = "<div class='row'>";
    let column_width = 'col-sm-6';
    //Info
    html_content += "</div><div class=" + column_width + " id='rg_info'>";
    html_content += "</div></div>";
    if (!info_present) {
        if (language === 'nl') {
            html_content = "<p>Geen info aanwezig.</p>"
        } else if (language === 'en') {
            html_content = "<p>No info present.</p>"
        }
    }
    popover.setAttribute("data-content", html_content);
}


/**
 * Requests a registration to be made for the event.
 * @param type e.g. Thesis, Research Internship 1,...
 */
function register_for_event(type) {
    $.ajax({
        url: 'add-internship-registration',
        type: 'POST',
        data: {event: event['internship_id'], type: type},
        dataType: 'json',
        success: function () {
            const alert = $(`<div class="alert alert-success alert-dismissible fade show">
                                <strong>Success!</strong> Your registration is sent! You will be notified of any changes.
                                <button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span></button>
                            </div>`);
            $("#buttons").append(alert);
            $("#registration-btn").prop("disabled", true).text("Pending");
        },
        error: function () {
            const alert = $(`<div class="alert alert-danger alert-dismissible fade show">
                                Error occurred
                                <button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span></button>
                            </div>`);
            $("#buttons").append(alert);
        }
    });


}

/**
 * Constructs all the registration info for the event.
 */
function construct_registrations() {
    const registration_div = $("#registrations");
    if (event['registrations'].length === 0) {
        return;
    }
    registration_div.show();

    const registrations = $("#registrations-table");

    for (const registration of event['registrations']) {
        let row = `
            <tr>
                <td><a href="mailto:${registration['student']}@ad.ua.ac.be">${registration['name']}</a></td>
                <td class="text-center">${registration['student']}</td>
                <td class="type">
                    <select>
                        ${event['types'].map(function (type) {
            return `<option value="${type}">${type}</option>`
        }).join('')}
                    </select>
                </td>
                <td class="status" align="right">
                    <span id="status"></span>
                    <select>
                        <option value="Pending">Pending</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Denied">Denied</option>
                        <option value="Acknowledged">Acknowledged</option>
                    </select>
                </td>
            </tr>
        `;

        const elem = $(row);
        elem.find('.type select').val(registration['type']).on('change', function () {
            update_registration(registration, null, this.value)
        });
        elem.find(".status select").val(registration['status']).on("change", function () {
            update_registration(registration, this.value, null)
        });
        registrations.append(elem);
    }
}

function update_registration(registration, new_status, new_type) {
    const data = {
        student_id: registration['student'],
        internship_id: event['internship_id'],
        status: new_status,
        type: new_type
    };

    const status = $("#status");
    status.text("Saving..");

    $.ajax({
        url: "handle-internship-registration",
        method: "POST",
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function () {
            status.text("Saved!");
        },
        error: function () {
            status.text("Error occurred");
        }
    });
}

// /**
//  * Constructs the recommended events.
//  */
// function create_recommendations() {
//     for (const link of links.slice(0, 4)) {
//
//         const list = $(`<ul class="list-unstyled"></ul>`);
//
//         for (const guide of link['employees']) {
//             if (guide["guidance_type"] !== "Promotor") {
//                 continue;
//             }
//             list.append($(`<li><span class="badge employee-bg-color">${guide["employee"]["name"]}</span></li>`))
//         }
//
//         for (const type of link["types"]) {
//             list.append($(`<li><span class="badge type-bg-color">${type}</span></li>`));
//         }
//
//         for (const tag of link["tags"].slice(0, 3)) {
//             list.append($(`<li><span class="badge tag-bg-color">${tag}</span></li>`));
//         }
//
//
//         const card = `
//             <div class="card">
//                 <div class="card-header">
//                     <a class="h4" href="event-page?event_id=${link['event_id']}&from=${event["event_id"]}">${link["title"]}</a>
//                 </div>
//                 <div class="card-body">
//                     ${list.prop("outerHTML")}
//                 </div>
//             </div>
//         `;
//
//         $("#recommendations").append($(card));
//     }
// }

/**
 * Increments the view counter.
 */
function add_view() {
    $.returnValues("/add-view-internship/" + event["internship_id"]);
}

// /**
//  * This function opens a default edit modal.
//  */
// function addModal() {
//     $("#modal-info").text("");
//
//     $("#modal-title").text("Add new employee");
//
//     $("#modal-body").html(getEditHTML());
//
//     let saveChanges = $("#saveChangesButton");
//     saveChanges.off("click");
//     saveChanges.click(function () {
//         let json = getEditData();
//         json["type"] = "add";
//         $("#modal-info").text("Saving...");
//         $.ajax({
//             url: "modify-lists",
//             method: "POST",
//             data: JSON.stringify(json),
//             contentType: 'application/json',
//             success: function (message) {
//                 $("#modal").modal('toggle');
//                 employees.push(json["name"]);
//
//                 if (json["guidance"] === "Promotor") {
//                     $("#promotors-input").tagsinput("add", json["name"])
//                 } else if (json['guidance'] === "Co-Promotor") {
//                     $("#co-promotors-input").tagsinput("add", json["name"])
//                 } else if (json['guidance'] === "Mentor") {
//                     $("#mentors-input").tagsinput("add", json["name"])
//                 }
//             },
//             error: function (message) {
//                 $("#modal-info").text("Error occurred")
//             }
//         });
//     });
//
//     $("#modal").modal("toggle");
// }
//
// /**
//  * This function provides default edit html.
//  */
// function getEditHTML() {
//     return `
//             <div class="row">
//                 <div class="col">
//                     Name
//                 </div>
//                 <div class="col">
//                     <input id="name-input" class="form-control-sm">
//                 </div>
//             </div>
//             <div class="row">
//                 <div class="col">
//                     Email
//                 </div>
//                 <div class="col">
//                     <input id="email-input" class="form-control-sm">
//                 </div>
//             </div>
//             <div class="row">
//                 <div class="col">
//                     Office
//                 </div>
//                 <div class="col">
//                     <input id="office-input" class="form-control-sm">
//                 </div>
//             </div>
//             <div class="row">
//                 <div class="col">
//                     Research Group
//                 </div>
//                 <div class="col">
//                     <select style='width: 100%; max-width: 150px;' id="research-group-input">
//
//                         ${`<option value="">None</option>` +
//     groups.map(function (group) {
//         return `<option value="${group}">${group}</option>`;
//     }).join("")}
//
//                     </select>
//                 </div>
//             </div>
//             <div class="row">
//                 <div class="col">
//                     Guidance
//                 </div>
//                 <div class="col">
//                     <select style='width: 100%; max-width: 150px;' id="guidance-input">
//                         <option value="Co-Promotor">Co-Promotor</option>
//                         <option value="Mentor">Mentor</option>
//                     </select>
//                 </div>
//             </div>
//         `;
// }

// /**
//  * This function returns all input data.
//  * @return data input data
//  */
// function getEditData() {
//     let data = {};
//     data["object"] = "employee";
//     data["name"] = $("#name-input").val();
//     data["email"] = $("#email-input").val();
//     data["office"] = $("#office-input").val();
//     data["research_group"] = $("#research-group-input").val();
//     data["is_external"] = true;
//     data["extra_info"] = "";
//     data["title"] = null;
//     data["guidance"] = $("#guidance-input").val();
//     return data;
// }

function reviewInternship(action) {
    var alreadyReviewed = document.getElementById("already-reviewed");
    var notReviewed = document.getElementById("not-reviewed");
    if (alreadyReviewed && alreadyReviewed.style.display !== "none") {
        if (confirm("Are you sure you want to delete this internship?")) {
            // Proceed with deletion
            fetch('/review-internship', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({action: action, internship_id: event.internship_id}),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Internship review updated successfully.');
                        window.location.href = '/careers';
                    } else {
                        alert('Failed to update internship review: ' + data.message);
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        } else {
            // Cancel deletion

        }
    }
    if (notReviewed && notReviewed.style.display !== "none") {
        fetch('/review-internship', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({action: action, internship_id: event.internship_id}),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Internship review updated successfully.');
                    window.location.href = '/careers';
                } else {
                    alert('Failed to update internship review: ' + data.message);
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }
}