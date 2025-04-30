ALTER TABLE internship
ALTER COLUMN start_date TYPE DATE USING start_date::DATE,
ALTER COLUMN end_date TYPE DATE USING end_date::DATE;