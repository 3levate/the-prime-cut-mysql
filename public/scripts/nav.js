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

function loginDropdownListeners() {
  const profile = document.getElementById("profile");
  const dropdown = document.getElementById("dropdown");
  profile.addEventListener("mouseenter", () => {
    dropdown.classList.toggle("shown");
  });
  profile.addEventListener("mouseleave", () => {
    dropdown.classList.toggle("shown");
  });
}
