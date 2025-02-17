CREATE TABLE guests (
    ID INT NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone_number VARCHAR(10),
    PRIMARY KEY (ID)
);

CREATE TABLE reservations (
    ID INT NOT NULL AUTO_INCREMENT,
    guest_id INT,
    table_number TINYINT UNSIGNED NOT NULL CHECK (table_number BETWEEN 1 AND 14),
    date DATE NOT NULL,
    hour TINYINT UNSIGNED NOT NULL CHECK (hour BETWEEN 3 AND 9),
    PRIMARY KEY (ID),
    FOREIGN KEY (guest_id) REFERENCES guests(ID)
);