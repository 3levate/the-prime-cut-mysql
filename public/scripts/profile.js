async function loadGuestReservations() {
  try {
    const response = await fetch("/guest-reservations");
    return (await response.json()).data;
  } catch (error) {
    console.log(`${error.name} in loading guest reservations`, error);
  }
}

async function updateReservationsTable() {
  const reservations = await loadGuestReservations();
  const fragment = document.createDocumentFragment();

  for (const reservation of reservations) {
    const row = document.createElement("tr");
    const date = document.createElement("td");
    const time = document.createElement("td");
    const table = document.createElement("td");

    date.textContent = new Date(reservation.date).toLocaleDateString("en-us", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    time.textContent = `${reservation.hour}:00 PM`;
    table.textContent = reservation.table_number;

    row.appendChild(date);
    row.appendChild(time);
    row.appendChild(table);
    fragment.appendChild(row);
  }
  document.querySelector("#guest-reservations-table tbody").appendChild(fragment);
}

updateReservationsTable();
