-- Migration File for the Added Schema (UPGRADE)

-- Create company table
CREATE TABLE company (
    company_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255)
);

-- Create contact_person_company table
CREATE TABLE contact_person_company (
    contact_person_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255)
);

-- Create company_has_contact_person table
CREATE TABLE company_has_contact_person (
    company_id INT REFERENCES company (company_id) ON UPDATE CASCADE ON DELETE CASCADE,
    contact_person INT REFERENCES contact_person_company (contact_person_id) ON UPDATE CASCADE ON DELETE SET NULL,
    PRIMARY KEY (company_id, contact_person)
);

CREATE TABLE internship
(
    internship_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    max_students INT NOT NULL,
    description_id INT NOT NULL REFERENCES Document (document_id) ON UPDATE CASCADE ON DELETE SET NULL,
    company_id INT NOT NULL REFERENCES Company (company_id) ON UPDATE CASCADE ON DELETE CASCADE,
    view_count INT DEFAULT 0,
    creation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    address VARCHAR(255),
    contact_person INT REFERENCES contact_person_company (contact_person_id) ON UPDATE CASCADE ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL,
    is_reviewed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create internship_has_tag table
CREATE TABLE internship_has_tag (
    internship INT REFERENCES internship (internship_id) ON UPDATE CASCADE ON DELETE CASCADE,
    tag VARCHAR(255) REFERENCES tag (tag) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (internship, tag)
);

-- Create internship_has_type table
CREATE TABLE internship_has_type (
    internship INT REFERENCES internship (internship_id) ON UPDATE CASCADE ON DELETE CASCADE,
    type VARCHAR(255) REFERENCES type (type_name) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (internship, type)
);

CREATE TABLE internship_registration
(
  student       VARCHAR(8)          REFERENCES Student (student_id) ON UPDATE CASCADE ON DELETE CASCADE,
  internship    INT                 REFERENCES internship (internship_id) ON UPDATE CASCADE ON DELETE CASCADE,
  type          VARCHAR(255)        REFERENCES Type (type_name) ON UPDATE CASCADE ON DELETE CASCADE,
  status        RegistrationStatus  DEFAULT 'Pending',
  date          date                NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (student, internship)
);