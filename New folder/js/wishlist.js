/* Collection / wishlist — Interested, Owned, Not Interested */

let allProducts = [];
let statusFilter = "all";

document.addEventListener("DOMContentLoaded", function () {
  loadProducts()
    .then(function (products) {
      allProducts = products;
      bindStatusFilters();
      renderWishlist();
    })
    .catch(function () {
      showToast("Could not load the catalogue.", "error");
    });
});

function bindStatusFilters() {
  document.querySelectorAll("[data-status-filter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      statusFilter = btn.getAttribute("data-status-filter");
      document.querySelectorAll("[data-status-filter]").forEach(function (other) {
        other.setAttribute("aria-pressed", String(other === btn));
      });
      renderWishlist();
    });
  });
}

function renderWishlist() {
  const map = getWishlist();
  const ids = Object.keys(map);
  const grid = document.querySelector("[data-wish-grid]");
  const empty = document.querySelector("[data-wish-empty]");

  let items = ids
    .map(function (id) {
      const product = findProduct(allProducts, id);
      if (!product) {
        return null;
      }
      return { product: product, status: map[id].status };
    })
    .filter(Boolean);

  if (statusFilter !== "all") {
    items = items.filter(function (entry) {
      return entry.status === statusFilter;
    });
  }

  if (!items.length) {
    empty.hidden = false;
    grid.innerHTML = "";
    return;
  }

  empty.hidden = true;
  grid.innerHTML = items
    .map(function (entry) {
      const extra =
        '<p class="status-tag">' +
        labelFor(entry.status) +
        "</p>" +
        '<div class="status-actions">' +
        statusButton(entry.product.id, "interested", entry.status) +
        statusButton(entry.product.id, "owned", entry.status) +
        statusButton(entry.product.id, "not-interested", entry.status) +
        '<button type="button" data-remove-wish="' +
        entry.product.id +
        '">Remove</button>' +
        "</div>";
      return productCardHTML(entry.product, { extra: extra });
    })
    .join("");

  bindCardActions(grid, allProducts);

  grid.querySelectorAll("[data-status]").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      setWishlistStatus(btn.getAttribute("data-id"), btn.getAttribute("data-status"));
      renderWishlist();
    });
  });

  grid.querySelectorAll("[data-remove-wish]").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      setWishlistStatus(btn.getAttribute("data-remove-wish"), "remove");
      renderWishlist();
      showToast("Removed from collection");
    });
  });
}

function statusButton(id, status, current) {
  return (
    '<button type="button" data-status="' +
    status +
    '" data-id="' +
    id +
    '" aria-pressed="' +
    String(status === current) +
    '">' +
    labelFor(status) +
    "</button>"
  );
}

function labelFor(status) {
  if (status === "owned") {
    return "Owned";
  }
  if (status === "not-interested") {
    return "Not interested";
  }
  return "Interested";
}
