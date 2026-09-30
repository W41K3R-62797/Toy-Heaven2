/* Feedback form validation + FAQ accordion */

document.addEventListener("DOMContentLoaded", function () {
  bindAccordion();
  bindFeedback();
});

function bindAccordion() {
  document.querySelectorAll(".acc-item button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const item = btn.closest(".acc-item");
      const open = btn.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".acc-item").forEach(function (other) {
        other.classList.remove("is-open");
        other.querySelector("button").setAttribute("aria-expanded", "false");
      });
      if (!open) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
}

function bindFeedback() {
  const form = document.getElementById("feedback-form");
  const banner = document.getElementById("feedback-confirm");
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    form.querySelectorAll(".field").forEach(function (field) {
      field.classList.remove("has-error");
      const err = field.querySelector(".field-error");
      if (err) {
        err.textContent = "";
      }
    });

    const name = document.getElementById("fb-name").value.trim();
    const email = document.getElementById("fb-email").value.trim();
    const message = document.getElementById("fb-message").value.trim();
    let valid = true;

    if (name.length < 2) {
      setFieldError("fb-name", "Please enter your name.");
      valid = false;
    }
    if (!isValidEmail(email)) {
      setFieldError("fb-email", "Please enter a valid email address.");
      valid = false;
    }
    if (message.length < 12) {
      setFieldError("fb-message", "Tell us a little more (at least 12 characters).");
      valid = false;
    }
    if (!valid) {
      showAlert("Please check the form", "Name, email and a short message are all required.");
      return;
    }

    const entries = readStore(STORAGE.FEEDBACK, []);
    entries.push({
      name: name,
      email: email,
      message: message,
      date: new Date().toISOString()
    });
    writeStore(STORAGE.FEEDBACK, entries);
    form.reset();
    banner.hidden = false;
    showToast("Thanks — message saved", "success");
  });
}

function setFieldError(id, message) {
  const field = document.getElementById(id).closest(".field");
  field.classList.add("has-error");
  field.querySelector(".field-error").textContent = message;
}
