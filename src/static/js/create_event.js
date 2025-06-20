TYPES = [];

document.addEventListener("DOMContentLoaded", function () {
    // Fetch the types via AJAX
    $.ajax({
        url: "get-types",
        success: function (result) {
            TYPES = result; // Assuming the result is an array of types
            populateEventTypeDropdown(); // Populate the dropdown after fetching types
        },
        error: function () {
            console.error("Failed to fetch event types.");
        }
    });

    // Function to populate the event type dropdown
    function populateEventTypeDropdown() {
    const eventTypeDropdown = document.getElementById("event-type");
    if (!eventTypeDropdown) {
        console.error("Event type dropdown not found!");
        return;
    }

    // Clear existing options
    eventTypeDropdown.innerHTML = "";

    // Filter and add options dynamically
    TYPES.filter(type => type.is_active && type.type_name)
        .forEach(type => {
            const option = document.createElement("option");
            console.log(type.type_name)
            option.value = type.type_name;
            option.textContent = translate(type.type_name);
            console.log(type.type_name)
            eventTypeDropdown.appendChild(option);
        });

    // Refresh the selectpicker if using Bootstrap
    if ($(eventTypeDropdown).hasClass("selectpicker")) {
        $(eventTypeDropdown).selectpicker("refresh");
    }
}
});