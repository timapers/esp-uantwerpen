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


