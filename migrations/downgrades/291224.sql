-- Downgrade File for the Added Schema

-- Drop internship_has_type table
DROP TABLE IF EXISTS internship_has_type;

-- Drop internship_has_tag table
DROP TABLE IF EXISTS internship_has_tag;

-- Drop internship table
DROP TABLE IF EXISTS internship;

-- Drop company_has_contact_person table
DROP TABLE IF EXISTS company_has_contact_person;

-- Drop contact_person_company table
DROP TABLE IF EXISTS contact_person_company;

-- Drop company table
DROP TABLE IF EXISTS company;
