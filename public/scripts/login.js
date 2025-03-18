const urlParams = new URLSearchParams(window.location.search);
const requestFormType = urlParams.get("form-type");
const redirectPath = urlParams.get("redirect");
const RESPONSE_STATUSES = {
  200: () => {
    window.location.href = redirectPath.includes("null")
      ? "/html/reserve-table.html"
      : redirectPath;
  },
  401: showIncorrectPasswordErrorMessage,
  404: convertToSignupForm,
};

async function authenticateGuest(event) {
  event.preventDefault();

  const {
    "form-type": formType,
    "first-name": firstName,
    "last-name": lastName,
    email,
    "phone-number": phoneNumber,
    password,
  } = Object.fromEntries(new FormData(event.target).entries());
  let response;
  // set to null if phoneNumber is undefined for mysql insertion
  let nullPhoneNumber = phoneNumber || null;

  if (formType == "login") {
    response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } else if (formType == "signup") {
    response = await fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, nullPhoneNumber, password }),
    });
  }
  console.log("response", response);
  console.log("response", response.status);
  RESPONSE_STATUSES[response.status]();
  return false;
}

function showIncorrectPasswordErrorMessage() {
  document.getElementById("password").value = "";
  alert("Incorrect password. Please try again.");
}

function convertToSignupForm() {
  // TODO show small guest doesn't exist message?
  const firstName = document.getElementById("first-name");
  firstName.classList.remove("hidden");
  firstName.setAttribute("required", "");

  const lastName = document.getElementById("last-name");
  lastName.classList.remove("hidden");
  lastName.setAttribute("required", "");

  document.getElementById("phone-number").classList.remove("hidden");
  document.getElementById("reservation-status").textContent = "Sign Up";
  document.getElementById("form-type").value = "signup";
}

function convertToLogoutForm() {
  document.getElementById("reservation-form").classList.add("inactive");
  document.getElementById("reservation-status").textContent = "Logout";
  document.getElementById("message-container").classList.add("active");
  document.getElementById("message").textContent = "We're sorry to see you go!";
  document.getElementById("form-type").value = "logout";
}

if (requestFormType == "signup") {
  convertToSignupForm();
} else if (requestFormType == "logout") {
  convertToLogoutForm();
}
