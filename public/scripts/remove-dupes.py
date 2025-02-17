import csv

input_file = "reservations.csv"
output_file = "reservations_deduped.csv"

# A set to keep track of seen combinations of (table_number, date, hour)
seen = set()

with open(input_file, newline='', encoding='utf-8') as infile, open(output_file, 'w', newline='', encoding='utf-8') as outfile:
    reader = csv.DictReader(infile)
    writer = csv.DictWriter(outfile, fieldnames=reader.fieldnames)
    
    # Write header to output CSV
    writer.writeheader()
    
    for row in reader:
        # Create a key from the columns that define a duplicate: table_number, date, and hour.
        key = (row['table_number'], row['date'], row['hour'])
        if key not in seen:
            writer.writerow(row)
            seen.add(key)

print(f"Deduplication complete. Output written to {output_file}.")
