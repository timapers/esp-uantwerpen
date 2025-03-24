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
    let content = internship["description"] || "No description available.";
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
        company_badge.style = "m<<argin-right: 10px";
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