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

-- Create internship table
CREATE TABLE internship (
    internship_id SERIAL PRIMARY KEY,
    description_id INT NOT NULL REFERENCES document (document_id) ON UPDATE CASCADE ON DELETE SET NULL,
    company_id INT NOT NULL REFERENCES company (company_id) ON UPDATE CASCADE ON DELETE CASCADE,
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
