/* Shopping cart page — quantities, totals, clear, checkout */

document.addEventListener("DOMContentLoaded", function () {
  loadProducts()
    .then(renderCart)
    .catch(function () {
      showToast("Could not load the catalogue.", "error");
    });

  document.getElementById("clear-cart").addEventListener("click", function () {
    showConfirm("Clear cart?", "This removes every piece from your cart.").then(function (ok) {
      if (!ok) {
        return;
      }
      loadProducts().then(function (products) {
        clearCart();
        renderCart(products);
        showToast("Cart cleared");
      });
    });
  });
});

function renderCart(products) {
  const cart = getCart();
  const list = document.querySelector("[data-cart-list]");
  const empty = document.querySelector("[data-cart-empty]");
  const summary = document.querySelector("[data-cart-summary]");

  if (!cart.length) {
    empty.hidden = false;
    list.innerHTML = "";
    summary.hidden = true;
    return;
  }

  empty.hidden = true;
  summary.hidden = false;

  list.innerHTML = cart
    .map(function (line) {
      const product = findProduct(products, line.id);
      if (!product) {
        return "";
      }
      const subtotal = product.price * line.qty;
      return (
        '<article class="cart-item">' +
        '<img src="' +
        IMAGE_PATH +
        product.image +
        '" alt="' +
        product.name +
        '">' +
        "<div>" +
        "<h2>" +
        product.name +
        "</h2>" +
        '<p class="category-label">' +
        product.category +
        "</p>" +
        '<p class="price">Price ' +
        formatPrice(product.price) +
        "</p>" +
        '<div class="qty">' +
        '<button type="button" aria-label="Decrease quantity" data-qty="' +
        product.id +
        '" data-delta="-1">−</button>' +
        '<input type="number" min="1" value="' +
        line.qty +
        '" aria-label="Quantity for ' +
        product.name +
        '" data-qty-input="' +
        product.id +
        '">' +
        '<button type="button" aria-label="Increase quantity" data-qty="' +
        product.id +
        '" data-delta="1">+</button>' +
        "</div></div>" +
        "<p><strong>Subtotal " +
        formatPrice(subtotal) +
        "</strong></p>" +
        '<button type="button" class="btn btn-ghost" data-remove="' +
        product.id +
        '">Remove</button>' +
        "</article>"
      );
    })
    .join("");

  const total = cartTotal(products);
  document.querySelector("[data-cart-total]").textContent = formatPrice(total);
  document.querySelector("[data-cart-count-label]").textContent =
    cartCount() + " item" + (cartCount() === 1 ? "" : "s");

  list.querySelectorAll("[data-qty]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const id = btn.getAttribute("data-qty");
      const delta = Number(btn.getAttribute("data-delta"));
      const line = getCart().find(function (item) {
        return item.id === id;
      });
      const next = (line ? line.qty : 1) + delta;
      setCartQty(id, next);
      renderCart(products);
    });
  });

  list.querySelectorAll("[data-qty-input]").forEach(function (input) {
    input.addEventListener("change", function () {
      const qty = Math.max(1, Number(input.value) || 1);
      setCartQty(input.getAttribute("data-qty-input"), qty);
      renderCart(products);
    });
  });

  list.querySelectorAll("[data-remove]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setCartQty(btn.getAttribute("data-remove"), 0);
      renderCart(products);
      showToast("Removed from cart");
    });
  });
}
