-- Load order matters: each table can only point to tables created before it.

CREATE TABLE departments (
    name_en  VARCHAR(100) PRIMARY KEY,
    name_zh  VARCHAR(100) NOT NULL
);

CREATE TABLE courses (
    code        VARCHAR(10)   PRIMARY KEY,                
    name_en     VARCHAR(200)  NOT NULL,
    name_zh     VARCHAR(200),                             
    credits     NUMERIC(3,1)  NOT NULL CHECK (credits >= 0),  
    department  VARCHAR(100)  NOT NULL
                REFERENCES departments(name_en) ON UPDATE CASCADE
);

CREATE TABLE requirement_categories (
    major             VARCHAR(100)  NOT NULL
                      REFERENCES departments(name_en) ON UPDATE CASCADE,
    catalog_year      INTEGER       NOT NULL,
    category          VARCHAR(50)   NOT NULL,
    credits_required  NUMERIC(4,1)  NOT NULL CHECK (credits_required >= 0),
    any_course        BOOLEAN       NOT NULL,
    PRIMARY KEY (major, catalog_year, category)
);

CREATE TABLE category_courses (
    major         VARCHAR(100)  NOT NULL,
    catalog_year  INTEGER       NOT NULL,
    category      VARCHAR(50)   NOT NULL,
    course_code   VARCHAR(10)   NOT NULL
                  REFERENCES courses(code) ON UPDATE CASCADE,
    PRIMARY KEY (major, catalog_year, category, course_code),
    -- the category must exist for that major and year (catches spelling mistakes)
    FOREIGN KEY (major, catalog_year, category)
        REFERENCES requirement_categories (major, catalog_year, category)
        ON UPDATE CASCADE
);

CREATE TABLE prerequisites (
    course_code        VARCHAR(10) NOT NULL REFERENCES courses(code) ON UPDATE CASCADE,
    prerequisite_code  VARCHAR(10) NOT NULL REFERENCES courses(code) ON UPDATE CASCADE,
    PRIMARY KEY (course_code, prerequisite_code),
    CHECK (course_code <> prerequisite_code)               -- a course cannot require itself
);

-- offerings.csv  (one row per weekly time slot, like the CSV)
CREATE TABLE offerings (
    course_code   VARCHAR(10)  NOT NULL REFERENCES courses(code) ON UPDATE CASCADE,
    semester      VARCHAR(10)  NOT NULL,
    section       VARCHAR(5)   NOT NULL,                   
    teacher       VARCHAR(100),
    room          VARCHAR(20),
    capacity      INTEGER CHECK (capacity >= 0),
    day           SMALLINT     NOT NULL CHECK (day BETWEEN 1 AND 7),   -- 1 = Monday
    start_period  SMALLINT     NOT NULL,
    end_period    SMALLINT     NOT NULL,
    PRIMARY KEY (course_code, semester, section, day, start_period),
    CHECK (end_period >= start_period)
);

CREATE TABLE tags (
    label  VARCHAR(50) PRIMARY KEY,
    kind   VARCHAR(20)
);
