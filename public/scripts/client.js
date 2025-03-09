const TOTAL_HOURS_RESTAURANT_OPEN_DAILY = 7;
const today = new Date();
const todayDateFormatted = new Date().toISOString().split("T")[0];
let reservations;
const DAY_OF_WEEK_NAME_ID_MAPPING = [6, 0, 1, 2, 3, 4, 5];
const ALL_RESTAURANT_OPEN_HOURS = [3, 4, 5, 6, 7, 8, 9];
const TABLE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
let GLOBAL_STATE_CURRENT_MONTH = new Date();
let GLOBAL_STATE_SELECTED_TABLE = null;
let GLOBAL_STATE_SELECTED_TIMESLOT = null;

async function getReservations(date) {
  try {
    const response = await fetch(`/reservations?date=${date}`);
    return await response.json();
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function highlightReservedTables(date) {
  reservations = await getReservations(date);
  console.log("highlightReservedTables reservations", reservations);
  console.log("highlightReservedTables called with date", date);

  for (const tableNumber of TABLE_NUMBERS) {
    const reservedHours = await getReservedHoursByTableNumber(tableNumber);
    const table = document.querySelector(`.table[data-table-id="${tableNumber}"]`);

    if (reservedHours) {
      if (reservedHours.length == TOTAL_HOURS_RESTAURANT_OPEN_DAILY) {
        table.classList.remove("some-availability");
        table.classList.add("reserved");
        table.classList.add("locked");
      } else if (reservedHours.length < TOTAL_HOURS_RESTAURANT_OPEN_DAILY) {
        table.classList.remove("reserved");
        table.classList.remove("locked");
        table.classList.add("some-availability");
      }
    } else {
      // colour tables green or just leave as outline?
      table.classList.remove("locked");
      table.classList.remove("reserved");
      table.classList.remove("some-availability");
    }
  }
}

async function addAvailableTableTimeslots(selectedTable) {
  if (GLOBAL_STATE_SELECTED_TABLE) return;

  const timeslotsContainer = document.getElementById("timeslots-container");
  const reservedHours = await getReservedHoursByTableNumber(selectedTable);

  deleteAllTimeslots();

  if (!reservedHours || !reservedHours.length) {
    //add all timeslots
    for (let i = 3; i <= 9; i++) {
      createTimeslot(i, timeslotsContainer);
    }
  } else {
    const availableHours = ALL_RESTAURANT_OPEN_HOURS.filter(
      (hour) => !reservedHours.includes(hour)
    );
    for (const hour of availableHours.sort()) {
      createTimeslot(hour, timeslotsContainer);
    }
  }
}

function updateTableNumberText(tableNumber) {
  console.log("updateTableNumberText", tableNumber);
  document.getElementById("table-number-heading").textContent = tableNumber;
}

async function getReservedHoursByTableNumber(tableNum) {
  return await reservations
    .find((tableReservation) => tableReservation.table_number == tableNum)
    ?.hours.split(", ")
    .map((hour) => Number(hour));
}

function createTimeslot(hour, timeslotsContainer) {
  const timeslot = document.createElement("button");
  timeslot.classList.add("timeslot", "hide");
  timeslot.setAttribute("data-hour-id", hour);
  timeslot.textContent = `${hour}:00 PM`;
  timeslot.onclick = (event) => {
    if (!GLOBAL_STATE_SELECTED_TABLE) {
      alert("Please select a table first.");
      return;
    }

    GLOBAL_STATE_SELECTED_TIMESLOT = event.target.dataset.hourId;
    openConfirmationWindow();
  };
  timeslotsContainer.appendChild(timeslot);

  void timeslot.offsetWidth;
  timeslot.classList.remove("hide");
}

function deleteAllTimeslots() {
  const allTimeslots = document.querySelectorAll(".timeslot");

  //FIXME event listener doesn't fire
  // allTimeslots.forEach((timeslot) => {
  //   timeslot.addEventListener("transitionend", (event) => {
  //     console.log("triggered transitionend");
  //     event.target.remove();
  //   });
  // });

  allTimeslots.forEach((timeslot) => {
    timeslot.remove();
  });
}

function openConfirmationWindow() {
  const overlay = document.getElementById("overlay");
  const confirmReservation = document.getElementById("confirm-reservation");
  overlay.classList.add("active");
  confirmReservation.classList.add("active");

  document.querySelector("#date .info").textContent = GLOBAL_STATE_CURRENT_MONTH.toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
    }
  );
  document.querySelector("#time .info").textContent = `${GLOBAL_STATE_SELECTED_TIMESLOT}:00 PM`;
  document.querySelector("#table-number .info").textContent = `No. ${GLOBAL_STATE_SELECTED_TABLE}`;
}

function closeConfirmationWindow() {
  const overlay = document.getElementById("overlay");
  const confirmReservation = document.getElementById("confirm-reservation");
  overlay.classList.remove("active");
  confirmReservation.classList.remove("active");
}

function setDatePickerMonth() {
  const datepickerCalendar = document.querySelector(".datepicker-calendar");
  const firstDayOfCurrentMonth_NameID = new Date(
    GLOBAL_STATE_CURRENT_MONTH.getFullYear(),
    GLOBAL_STATE_CURRENT_MONTH.getMonth(),
    1
  ).getDay();
  const lastDayOfPreviousMonth = new Date(
    GLOBAL_STATE_CURRENT_MONTH.getFullYear(),
    GLOBAL_STATE_CURRENT_MONTH.getMonth() + 1,
    0
  ).getDate();
  const daysInCurrentMonth = new Date(
    GLOBAL_STATE_CURRENT_MONTH.getFullYear(),
    GLOBAL_STATE_CURRENT_MONTH.getMonth() + 1,
    0
  ).getDate();
  const numOfPrevMonthDaysToCreate = DAY_OF_WEEK_NAME_ID_MAPPING[firstDayOfCurrentMonth_NameID];
  const totalDisplayedDays = 35 - daysInCurrentMonth - numOfPrevMonthDaysToCreate < 0 ? 42 : 35;

  //delete any days from previous month
  document.querySelectorAll(".day-number").forEach((day) => {
    day.remove();
  });

  //set month name displayed on calendar to current global variable month
  document.querySelector(".month-name").textContent = GLOBAL_STATE_CURRENT_MONTH.toLocaleString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );

  //add faded days from the previous month (e.g. 29, 30, 31)
  for (
    let i = lastDayOfPreviousMonth - numOfPrevMonthDaysToCreate;
    i < lastDayOfPreviousMonth;
    i++
  ) {
    const dayNumber = createDayNumber(i);
    dayNumber.classList.add("faded");
    datepickerCalendar.appendChild(dayNumber);
  }
  //add normal days from current month
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    datepickerCalendar.appendChild(createDayNumber(i));
  }
  //add faded days from the next month (e.g. 1, 2, 3)
  for (let i = 1; i <= totalDisplayedDays - daysInCurrentMonth - numOfPrevMonthDaysToCreate; i++) {
    const dayNumber = createDayNumber(i);
    dayNumber.classList.add("faded");
    datepickerCalendar.appendChild(dayNumber);
  }
}

function createDayNumber(dataDayNummber) {
  const dayNumber = document.createElement("button");
  dayNumber.classList.add("day-number");
  dayNumber.textContent = dataDayNummber;
  dayNumber.setAttribute("data-day-number", dataDayNummber);
  dayNumber.onclick = (event) => {
    if (GLOBAL_STATE_SELECTED_TABLE) return;

    GLOBAL_STATE_CURRENT_MONTH.setDate(event.target.textContent);
    highlightReservedTables(GLOBAL_STATE_CURRENT_MONTH.toISOString().split("T")[0]);

    const clickedDay = document.querySelector(".clicked");
    clickedDay ? clickedDay.classList.remove("clicked") : console.log("no clicked day");
    event.target.classList.add("clicked");
  };
  return dayNumber;
}

function nextMonth() {
  GLOBAL_STATE_CURRENT_MONTH.setMonth(GLOBAL_STATE_CURRENT_MONTH.getMonth() + 1);
  setDatePickerMonth();
}

function previousMonth() {
  GLOBAL_STATE_CURRENT_MONTH.setMonth(GLOBAL_STATE_CURRENT_MONTH.getMonth() - 1);
  setDatePickerMonth();
}

function tomorrowFocus() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  updateDate(tomorrow);
}

function weekendFocus() {
  const weekend = new Date();
  while (weekend.getDay() != 6) {
    weekend.setDate(weekend.getDate() + 1);
  }

  updateDate(weekend);
}

function updateDate(date) {
  if (GLOBAL_STATE_SELECTED_TABLE) {
    alert(
      "You have already selected a table. Please reload the page if you wish to view another day."
    );
    return;
  }

  GLOBAL_STATE_CURRENT_MONTH = date;
  setDatePickerMonth();
  document
    .querySelector(`.day-number[data-day-number="${date.getDate()}"]`)
    .classList.add("clicked");
  highlightReservedTables(GLOBAL_STATE_CURRENT_MONTH.toISOString().split("T")[0]);
}

async function storeReservation(event) {
  try {
    console.log("global state selected table", GLOBAL_STATE_SELECTED_TABLE);
    const response = await fetch("http://localhost:8000/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: GLOBAL_STATE_CURRENT_MONTH.toISOString().split("T")[0],
        time: GLOBAL_STATE_SELECTED_TIMESLOT,
        table: GLOBAL_STATE_SELECTED_TABLE,
      }),
    });
    console.log("response", response);
    showSuccessScreen(response);
    return false;
  } catch (error) {
    console.log(error);
    alert("Error updating rervations, please try again.");
    return false;
  }
}

async function showSuccessScreen(response) {
  const firstName = await getFirstName();
  console.log("showSuccessScreen called", response);
  document.getElementById("reservation-form").classList.add("inactive");
  document.getElementById("message-container").classList.add("active");
  document.getElementById("reservation-status").textContent = "Reservation Confirmed";
  document.getElementById("message").textContent = `We look forward to seeing you ${firstName}!`;
}

async function getFirstName() {
  try {
    const response = await fetch("/get-guest-details");
    const { first_name: firstName } = await response.json();
    return firstName;
  } catch (error) {
    console.log(`${error.name} getting guest details`, error);
    return null;
  }
}

function handleTableSelection(selectedTable) {
  document.querySelector(".selected")?.classList.remove("selected");
  selectedTable.classList.add("selected");
  GLOBAL_STATE_SELECTED_TABLE = selectedTable.dataset.tableId;

  //signal to the user that they can no longer select another table/date
  document.querySelectorAll(".table").forEach((table) => {
    console.log("table", table);
    table.classList.add("locked");
  });
  document.querySelectorAll(".quick-date-pick").forEach((datePick) => {
    datePick.classList.add("locked");
  });
  document.querySelectorAll(".day-number:not(.faded)").forEach((day) => {
    day.classList.add("locked");
  });
  document.querySelectorAll(".day-number.faded").forEach((day) => {
    day.classList.add("locked-faded");
  });
}

function smallDatePickerClick(event) {
  if (GLOBAL_STATE_SELECTED_TABLE || !event.target.value) return;

  GLOBAL_STATE_CURRENT_MONTH = new Date(event.target.value);
  highlightReservedTables(GLOBAL_STATE_CURRENT_MONTH.toISOString().split("T")[0]);
}

function showLoginOverlay() {
  document.getElementById("login-overlay").classList.add("active");
}

async function logout() {
  try {
    const response = await fetch("/logout", {
      method: "DELETE",
    });

    if (response.ok) {
      window.location.href = "/html/login.html?form-type=logout";
    } else {
      //if server-side error
      alert("Error logging out, please try again.");
    }
  } catch (error) {
    console.error(`${error.name} while logging out`, error);
    alert("Error logging out, please try again.");
  }
}

function alignDoor() {
  const restaurantLayout = document.getElementById("restaurant-layout");
  const door = document.getElementById("door");
  const manualOffset = 60; // position to shift right

  // Set the door's position so that its right edge aligns with #restaurant-layout's right border relative to the viewport + manualOffset.
  door.style.left =
    restaurantLayout.getBoundingClientRect().right + manualOffset - door.offsetWidth + "px";
}

//default to showing today's reservations
setDatePickerMonth();
highlightReservedTables(todayDateFormatted);
document.getElementById("datepicker-small").value = todayDateFormatted;
document
  .querySelector(`.day-number[data-day-number="${today.getDate()}"]`)
  .classList.add("clicked");

document.querySelectorAll(".table").forEach((table) => {
  table.addEventListener("mouseenter", (event) => {
    const tableNumber = event.target.dataset.tableId;
    addAvailableTableTimeslots(tableNumber); //automatically converted to camel case from kebab case
    updateTableNumberText(tableNumber);
  });

  table.addEventListener("click", (event) => {
    if (GLOBAL_STATE_SELECTED_TABLE) {
      alert(
        "You have already selected a table. Please reload the page if you wish to select a different table."
      );
      return;
    } else if (table.classList.contains("reserved")) {
      alert(
        `This table has no more timeslots remaining on ${
          GLOBAL_STATE_CURRENT_MONTH.toISOString().split("T")[0]
        }. Please choose another day.`
      );
      return;
    }

    handleTableSelection(event.currentTarget);
  });
});

//prevent page from reloading after submitting the confirm reservation form
document.querySelector("form").addEventListener("submit", (event) => {
  event.preventDefault();
});

alignDoor();
window.addEventListener("resize", alignDoor);
