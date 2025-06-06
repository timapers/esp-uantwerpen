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