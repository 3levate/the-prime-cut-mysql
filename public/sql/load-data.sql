LOAD DATA INFILE 'C:/Users/jacec/Documents/COMP1537/The Prime Cut MySQL/app/data/guests.csv'
INTO TABLE guests
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES;

LOAD DATA INFILE 'C:/Users/jacec/Documents/COMP1537/The Prime Cut MySQL/app/data/reservations.csv'
INTO TABLE reservations
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES;
