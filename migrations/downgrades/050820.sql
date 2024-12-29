alter table project_registration
add column type varchar(255) references Type(type_name) ON update cascade on delete cascade ;

alter table project_registration
add column date date NOT NULL DEFAULT CURRENT_DATE;

alter table project
add column creation_date date NOT NULL DEFAULT CURRENT_DATE ;

drop table if exists project_has_year ;
drop table if exists academic_year ;
