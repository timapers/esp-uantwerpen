SET TIMEZONE = 'Europe/Brussels';
-------------------------------------------------------------------------------------------------------------------
CREATE DOMAIN EmployeeTitle VARCHAR(255) CHECK (VALUE IN ('PhD', 'Professor'));
CREATE DOMAIN GuidanceType VARCHAR(255) NOT NULL CHECK (VALUE IN ('Promotor', 'Co-Promotor', 'Mentor'));
CREATE DOMAIN RegistrationStatus VARCHAR(255) NOT NULL CHECK (VALUE IN ('Pending', 'Acknowledged', 'Denied', 'Accepted'));
-------------------------------------------------------------------------------------------------------------------

CREATE TABLE document
(
  document_id      SERIAL PRIMARY KEY,
  html_content_eng VARCHAR,
  html_content_nl  VARCHAR
);

CREATE TABLE attachment
(
  name          VARCHAR(255),
  file_location VARCHAR UNIQUE NOT NULL,
  document_id   INT            NOT NULL REFERENCES Document (document_id) ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY (document_id, name)
);

-------------------------------------------------------------------------------------------------------------------

CREATE TABLE research_group
(
  name             VARCHAR(255) PRIMARY KEY,
  abbreviation     VARCHAR(255),
  logo_location    VARCHAR(255), --ONLY THE FILENAME, NOT FOLDER
  description_id   INT          REFERENCES Document (document_id) ON UPDATE CASCADE ON DELETE SET NULL,
  address          VARCHAR(255),
  telephone_number VARCHAR(20),
  is_active        BOOLEAN      NOT NULL
);

CREATE TABLE employee
(
  id               VARCHAR(255) PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  email            VARCHAR(255),
  office           VARCHAR(255),
  extra_info       VARCHAR(255),
  picture_location VARCHAR(255), --ONLY THE FILENAME, NOT FOLDER
  research_group   VARCHAR(255) REFERENCES Research_Group (name) ON UPDATE CASCADE ON DELETE SET NULL,
  title            EmployeeTitle,
  is_external      BOOLEAN      NOT NULL,
  is_admin         BOOLEAN      DEFAULT FALSE,
  is_active        BOOLEAN      NOT NULL,
  is_promotor      BOOLEAN      NOT NULL DEFAULT FALSE
);

--Separate table for contact person to avoid a circular reference in Employee and research_group
CREATE TABLE contact_person
(
  contact_person VARCHAR(255)          REFERENCES Employee (id) ON UPDATE CASCADE ON DELETE SET NULL,
  research_group VARCHAR(255) REFERENCES Research_Group (name) ON UPDATE CASCADE ON DELETE SET NULL UNIQUE
);

-------------------------------------------------------------------------------------------------------------------

CREATE TABLE project
(
  project_id       SERIAL PRIMARY KEY,
  title            VARCHAR(255),
  max_students     INT     NOT NULL,
  description_id   INT     NOT NULL REFERENCES Document (document_id) ON UPDATE CASCADE ON DELETE SET NULL,
  research_group   VARCHAR(255) REFERENCES Research_Group (name) ON UPDATE CASCADE ON DELETE CASCADE,
  is_active        BOOLEAN NOT NULL,
  last_updated     TIMESTAMP DEFAULT NOW(),
  view_count       INT       DEFAULT 0,
  extension_needed BOOLEAN   DEFAULT FALSE,
  creation_date    date      NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE guide
(
  employee      VARCHAR(255) REFERENCES Employee (id) ON UPDATE CASCADE ON DELETE CASCADE,
  project       INT REFERENCES Project (project_id) ON UPDATE CASCADE ON DELETE CASCADE,
  guidance_type GuidanceType,
  PRIMARY KEY (employee, project, guidance_type)
);

-------------------------------------------------------------------------------------------------------------------

CREATE TABLE student
(
  name       VARCHAR(255) NOT NULL,
  student_id VARCHAR(8) PRIMARY KEY
);

CREATE TABLE "like"
(
  student VARCHAR(8) REFERENCES Student (student_id) ON UPDATE CASCADE ON DELETE CASCADE,
  project INT REFERENCES Project (project_id) ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY (student, project)
);

-------------------------------------------------------------------------------------------------------------------

CREATE TABLE session
(
  session_id       SERIAL PRIMARY KEY,
  student          VARCHAR(8) REFERENCES Student (student_id) ON UPDATE CASCADE ON DELETE CASCADE NOT NULL,
  start_of_session TIMESTAMP                                                                      NOT NULL
);

CREATE TABLE project_click
(
  session       INT REFERENCES Session (session_id) ON UPDATE CASCADE ON DELETE CASCADE,
  project       INT REFERENCES Project (project_id) ON UPDATE CASCADE ON DELETE CASCADE,
  time_of_click TIME NOT NULL,
  PRIMARY KEY (session, project)
);

CREATE TABLE query
(
  session       INT REFERENCES Session (session_id) ON UPDATE CASCADE ON DELETE CASCADE,
  time_of_query TIME,
  search_terms  VARCHAR(255) NOT NULL,
  PRIMARY KEY (session, time_of_query)
);

-------------------------------------------------------------------------------------------------------------------

CREATE TABLE type
(
  type_name VARCHAR(255) PRIMARY KEY,
  is_active BOOLEAN NOT NULL
);

CREATE TABLE project_has_type
(
  project INT REFERENCES Project (project_id) ON UPDATE CASCADE ON DELETE CASCADE,
  type    VARCHAR(255) REFERENCES Type (type_name) ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY (project, type)
);

CREATE TABLE project_registration
(
  student       VARCHAR(8)          REFERENCES Student (student_id) ON UPDATE CASCADE ON DELETE CASCADE,
  project       INT                 REFERENCES Project (project_id) ON UPDATE CASCADE ON DELETE CASCADE,
  type          VARCHAR(255)        REFERENCES Type (type_name) ON UPDATE CASCADE ON DELETE CASCADE,
  status        RegistrationStatus  DEFAULT 'Pending',
  date          date                NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (student, project)
);

CREATE TABLE link
(
  project_1     INT REFERENCES Project (project_id) ON UPDATE CASCADE ON DELETE CASCADE,
  project_2     INT REFERENCES Project (project_id) ON UPDATE CASCADE ON DELETE CASCADE,
  match_percent FLOAT NOT NULL CHECK ( match_percent <= 1 ),
  PRIMARY KEY (project_1, project_2)
);

CREATE TABLE tag
(
  tag VARCHAR(255) PRIMARY KEY
);

CREATE TABLE project_has_tag
(
  project INT REFERENCES Project (project_id) ON UPDATE CASCADE ON DELETE CASCADE,
  tag     VARCHAR(255) REFERENCES Tag (tag) ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY (project, tag)
);
-------------------------------------------------------------------------------------------------------------------
CREATE TABLE company
(
    company_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255)
);

CREATE TABLE contact_person_company
(
    contact_person_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255)
);

CREATE TABLE company_has_contact_person
(
    company_id INT REFERENCES Company (company_id) ON UPDATE CASCADE ON DELETE CASCADE,
    contact_person INT REFERENCES contact_person_company (contact_person_id) ON UPDATE CASCADE ON DELETE SET NULL,
    PRIMARY KEY (company_id, contact_person)
);

-------------------------------------------------------------------------------------------------------------------
CREATE TABLE internship
(
    internship_id SERIAL PRIMARY KEY,
    max_students INT NOT NULL,
    description_id INT NOT NULL REFERENCES Document (document_id) ON UPDATE CASCADE ON DELETE SET NULL,
    company_id INT NOT NULL REFERENCES Company (company_id) ON UPDATE CASCADE ON DELETE CASCADE,
    view_count INT DEFAULT 0,
    creation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    address VARCHAR(255),
    contact_person INT REFERENCES contact_person_company (contact_person_id) ON UPDATE CASCADE ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL
);

CREATE TABLE internship_has_tag
(
    internship INT REFERENCES Internship (internship_id) ON UPDATE CASCADE ON DELETE CASCADE,
    tag VARCHAR(255) REFERENCES Tag (tag) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (internship, tag)
);

CREATE TABLE internship_has_type
(
    internship INT REFERENCES Internship (internship_id) ON UPDATE CASCADE ON DELETE CASCADE,
    type VARCHAR(255) REFERENCES Type (type_name) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (internship, type)
);
-----------------------------------------------------------------------------------------------------------------

CREATE MATERIALIZED VIEW search_index
AS
SELECT project.project_id,
       project.is_active,
       setweight(to_tsvector(project.title), 'A') ||
       setweight(to_tsvector(coalesce(document.html_content_eng, '')), 'B') ||
       setweight(to_tsvector(coalesce(document.html_content_nl, '')), 'B') ||
       setweight(to_tsvector(coalesce(string_agg(distinct employee.name, ' '), '')), 'C') ||
       setweight(to_tsvector(coalesce(string_agg(distinct project_has_tag.tag, ' '), '')), 'A') AS document
FROM project
       LEFT JOIN project_has_tag ON project.project_id = project_has_tag.project
       JOIN Document ON Project.description_id = Document.document_id
       JOIN guide ON Project.project_id = Guide.project
       JOIN Employee ON employee.id = Guide.employee
GROUP BY project.project_id, document_id;


CREATE INDEX idx_fts_search ON search_index USING gin (document);

REFRESH MATERIALIZED VIEW search_index;
