/* Product listing — search, category filter, and product modal */

let allProducts = [];
let activeCategory = "All";
let searchTerm = "";

document.addEventListener("DOMContentLoaded", function () {
  loadProducts()
    .then(function (products) {
      allProducts = products;
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      if (cat) {
        activeCategory = cat;
      }
      bindFilters();
      bindSearch();
      renderList();
      maybeOpenFromQuery();
    })
    .catch(function () {
      document.querySelector("[data-product-grid]").innerHTML =
        '<p class="empty-state">The catalogue could not be loaded. Please refresh.</p>';
    });
});

function bindFilters() {
  document.querySelectorAll("[data-filter]").forEach(function (btn) {
    const isActive = btn.getAttribute("data-filter") === activeCategory;
    btn.setAttribute("aria-pressed", String(isActive));
    btn.addEventListener("click", function () {
      activeCategory = btn.getAttribute("data-filter");
      document.querySelectorAll("[data-filter]").forEach(function (other) {
        other.setAttribute("aria-pressed", String(other === btn));
      });
      renderList();
    });
  });
}

function bindSearch() {
  const input = document.getElementById("product-search");
  input.addEventListener("input", function () {
    searchTerm = input.value.trim().toLowerCase();
    renderList();
  });
}

function filteredProducts() {
  return allProducts.filter(function (item) {
    const catOk = activeCategory === "All" || item.category === activeCategory;
    const qOk = !searchTerm || item.name.toLowerCase().indexOf(searchTerm) !== -1;
    return catOk && qOk;
  });
}

function renderList() {
  const list = filteredProducts();
  const grid = document.querySelector("[data-product-grid]");
  const count = document.querySelector("[data-result-count]");
  count.textContent = list.length + " piece" + (list.length === 1 ? "" : "s") + " in view";
  if (!list.length) {
    grid.innerHTML =
      '<p class="empty-state">No pieces match that search. Try another name or category.</p>';
    return;
  }
  grid.innerHTML = list
    .map(function (item) {
      return productCardHTML(item);
    })
    .join("");
  bindCardActions(grid, allProducts);
}

window.openProductModal = function (product) {
  const modal = document.getElementById("product-modal");
  document.getElementById("modal-image").src = IMAGE_PATH + product.image;
  document.getElementById("modal-image").alt = product.name;
  document.getElementById("modal-title").textContent = product.name;
  document.getElementById("modal-category").textContent = product.category;
  document.getElementById("modal-price").textContent = formatPrice(product.price);
  document.getElementById("modal-desc").textContent = product.description;
  document.getElementById("modal-details").textContent = product.details + " · SKU " + product.sku;
  const addBtn = document.getElementById("modal-add");
  const wishBtn = document.getElementById("modal-wish");
  addBtn.setAttribute("data-id", product.id);
  wishBtn.setAttribute("data-id", product.id);
  wishBtn.textContent = isOnWishlist(product.id) ? "In collection" : "Add to wishlist";
  modal.hidden = false;
  document.getElementById("modal-close").focus();
};

function closeModal() {
  document.getElementById("product-modal").hidden = true;
}

document.addEventListener("click", function (event) {
  if (event.target.id === "modal-add") {
    addToCart(event.target.getAttribute("data-id"));
  }
  if (event.target.id === "modal-wish") {
    addToWishlist(event.target.getAttribute("data-id"));
    event.target.textContent = "In collection";
  }
  if (event.target.id === "modal-close" || event.target.id === "product-modal") {
    closeModal();
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeModal();
  }
});

function maybeOpenFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    return;
  }
  const product = findProduct(allProducts, id);
  if (product) {
    window.openProductModal(product);
  }
}
