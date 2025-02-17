import csv
import random
from faker import Faker
from datetime import datetime, timedelta

# Initialize Faker
fake = Faker()

# Generate 300 fake guests
guests = []
for i in range(1, 301):
    first_name = fake.first_name()
    last_name = fake.last_name()
    email = fake.email()
    phone_number = fake.numerify(text='##########')  # 10-digit phone number
    guests.append({
        "ID": i,
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "phone_number": phone_number
    })

# Write guests to CSV
with open('guests.csv', mode='w', newline='') as file:
    writer = csv.DictWriter(file, fieldnames=["ID", "first_name", "last_name", "email", "phone_number"])
    writer.writeheader()
    writer.writerows(guests)

# Generate reservations
reservations = []
reservation_id = 1
start_date = datetime.now()
end_date = start_date + timedelta(days=90)  # Next 3 months

for table_number in range(1, 15):  # Tables 1-14
    for _ in range(75):  # 75 reservations per table
        # Randomly select a date within the next 3 months
        random_date = start_date + timedelta(days=random.randint(0, 89))
        date_str = random_date.strftime('%Y-%m-%d')

        # Randomly select hours
        if random.random() < 0.5:  # 50% chance to have all hours
            hours = list(range(3, 10))  # Hours 3-9
        else:
            hours = [random.randint(3, 9)]  # Random single hour

        for hour in hours:
            # Assign a random guest to the reservation
            guest = random.choice(guests)
            reservations.append({
                "ID": reservation_id,
                "guest_id": guest["ID"],
                "table_number": table_number,
                "date": date_str,
                "hour": hour
            })
            reservation_id += 1

# Write reservations to CSV
with open('reservations.csv', mode='w', newline='') as file:
    writer = csv.DictWriter(file, fieldnames=["ID", "guest_id", "table_number", "date", "hour"])
    writer.writeheader()
    writer.writerows(reservations)

print("CSV files generated successfully!")