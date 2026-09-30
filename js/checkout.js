/* Checkout — custom validation, order summary, success, localStorage */

document.addEventListener("DOMContentLoaded", function () {
  loadProducts()
    .then(function (products) {
      renderSummary(products);
      bindCheckout(products);
    })
    .catch(function () {
      showToast("Could not load the catalogue.", "error");
    });
});

function renderSummary(products) {
  const cart = getCart();
  const body = document.querySelector("[data-summary-body]");
  const checkoutForm = document.getElementById("checkout-form");
  if (!cart.length) {
    body.innerHTML = '<p>Your cart is empty. <a href="products.html">Return to the shop</a>.</p>';
    checkoutForm.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  let rows = "";
  cart.forEach(function (line) {
    const product = findProduct(products, line.id);
    if (!product) {
      return;
    }
    rows +=
      "<tr><th scope=\"row\">" +
      product.name +
      " × " +
      line.qty +
      "</th><td>" +
      formatPrice(product.price * line.qty) +
      "</td></tr>";
  });
  const total = cartTotal(products);
  body.innerHTML =
    "<table class=\"data-table\"><caption class=\"sr-only\">Order summary</caption>" +
    "<thead><tr><th scope=\"col\">Item</th><th scope=\"col\">Subtotal</th></tr></thead><tbody>" +
    rows +
    '</tbody><tfoot><tr><th scope="row">Total</th><td class="total">' +
    formatPrice(total) +
    "</td></tr></tfoot></table>";
  document.getElementById("final-total").value = formatPrice(total);
}

function bindCheckout(products) {
  const form = document.getElementById("checkout-form");
  const cardFields = document.getElementById("card-fields");

  form.querySelectorAll('input[name="payment"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      cardFields.hidden = radio.value !== "Card";
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors(form);

    const name = document.getElementById("full-name").value.trim();
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();
    const payment = form.querySelector('input[name="payment"]:checked');
    let valid = true;

    if (name.split(/\s+/).length < 2) {
      setError("full-name", "Please enter your first and last name.");
      valid = false;
    }
    if (!isValidEmail(email)) {
      setError("email", "Please enter a valid email address.");
      valid = false;
    }
    if (address.length < 10) {
      setError("address", "Please enter a full delivery address.");
      valid = false;
    }
    if (!payment) {
      showAlert("Payment method", "Please choose Card or Cash on Delivery.");
      valid = false;
    }
    if (payment && payment.value === "Card") {
      const number = document.getElementById("card-number").value.replace(/\s+/g, "");
      const expiry = document.getElementById("expiry").value.trim();
      const cvv = document.getElementById("cvv").value.trim();
      if (!/^\d{16}$/.test(number)) {
        setError("card-number", "Enter a 16-digit card number (simulation only).");
        valid = false;
      }
      if (!isValidExpiry(expiry)) {
        setError("expiry", "Use a future date in MM/YY format.");
        valid = false;
      }
      if (!/^\d{3,4}$/.test(cvv)) {
        setError("cvv", "Enter a 3 or 4 digit CVV.");
        valid = false;
      }
    }
    if (!getCart().length) {
      showAlert("Empty cart", "Add a piece before checking out.");
      valid = false;
    }
    if (!valid) {
      showAlert("Please check the form", "Some fields need a little more detail before we can place the order.");
      return;
    }

    const order = {
      id: "TH-" + Date.now().toString().slice(-8),
      date: new Date().toISOString(),
      name: name,
      email: email,
      address: address,
      payment: payment.value,
      items: getCart(),
      total: cartTotal(products)
    };
    const orders = readStore(STORAGE.ORDERS, []);
    orders.push(order);
    writeStore(STORAGE.ORDERS, orders);
    clearCart();
    form.reset();
    document.getElementById("success-id").textContent = order.id;
    document.getElementById("success-total").textContent = formatPrice(order.total);
    document.getElementById("success-overlay").hidden = false;
  });
}

function setError(id, message) {
  const field = document.getElementById(id).closest(".field");
  field.classList.add("has-error");
  field.querySelector(".field-error").textContent = message;
}

function clearErrors(form) {
  form.querySelectorAll(".field").forEach(function (field) {
    field.classList.remove("has-error");
    const err = field.querySelector(".field-error");
    if (err) {
      err.textContent = "";
    }
  });
}

function isValidExpiry(value) {
  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) {
    return false;
  }
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) {
    return false;
  }
  const end = new Date(year, month, 0);
  return end >= new Date();
}
