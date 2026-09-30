/* Toy Haven — shared JavaScript */

const STORAGE = {
  CART: "toyHaven_cart",
  WISHLIST: "toyHaven_wishlist",
  ORDERS: "toyHaven_orders",
  FEEDBACK: "toyHaven_feedback"
};

const IMAGE_PATH = "../images/";

/* ---------- small utilities (reused on every page) ---------- */

const CURRENCY = "LKR";

function formatPrice(value) {
  return (
    CURRENCY +
    " " +
    Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function todayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

/* Featured Product of the Day — same product for a full calendar day. */
function getProductOfTheDay(products) {
  if (!products.length) {
    return null;
  }
  return products[todayIndex() % products.length];
}

async function loadProducts() {
  try {
    const response = await fetch("../json/products.json");
    if (!response.ok) {
      throw new Error("Catalogue could not be loaded.");
    }
    return await response.json();
  } catch (err) {
    if (typeof PRODUCTS !== "undefined") {
      return PRODUCTS;
    }
    throw err;
  }
}

function findProduct(products, id) {
  return products.find(function (item) {
    return item.id === id;
  });
}

/* ---------- cart ---------- */

function getCart() {
  return readStore(STORAGE.CART, []);
}

function saveCart(cart) {
  writeStore(STORAGE.CART, cart);
  updateCartBadge();
}

function cartCount() {
  return getCart().reduce(function (sum, line) {
    return sum + line.qty;
  }, 0);
}

function addToCart(productId, qty) {
  const amount = qty || 1;
  const cart = getCart();
  const existing = cart.find(function (line) {
    return line.id === productId;
  });
  if (existing) {
    existing.qty += amount;
  } else {
    cart.push({ id: productId, qty: amount });
  }
  saveCart(cart);
  showToast("Added to cart", "success");
}

function setCartQty(productId, qty) {
  let cart = getCart();
  if (qty <= 0) {
    cart = cart.filter(function (line) {
      return line.id !== productId;
    });
  } else {
    cart.forEach(function (line) {
      if (line.id === productId) {
        line.qty = qty;
      }
    });
  }
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

function cartTotal(products) {
  return getCart().reduce(function (sum, line) {
    const product = findProduct(products, line.id);
    return product ? sum + product.price * line.qty : sum;
  }, 0);
}

function updateCartBadge() {
  const count = cartCount();
  document.querySelectorAll("[data-cart-count]").forEach(function (el) {
    el.textContent = String(count);
  });
}

/* ---------- wishlist / collection ---------- */

function getWishlist() {
  return readStore(STORAGE.WISHLIST, {});
}

function saveWishlist(map) {
  writeStore(STORAGE.WISHLIST, map);
}

function setWishlistStatus(productId, status) {
  const map = getWishlist();
  if (status === "remove") {
    delete map[productId];
  } else {
    map[productId] = { status: status, addedAt: new Date().toISOString() };
  }
  saveWishlist(map);
}

function isOnWishlist(productId) {
  return Boolean(getWishlist()[productId]);
}

function addToWishlist(productId) {
  if (!isOnWishlist(productId)) {
    setWishlistStatus(productId, "interested");
  }
  showToast("Saved to your collection", "success");
}

/* ---------- UI: toast, dialog, nav, reveal ---------- */

function showToast(message, type) {
  let stack = document.querySelector(".toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    stack.setAttribute("aria-live", "polite");
    document.body.appendChild(stack);
  }
  const toast = document.createElement("div");
  toast.className = "toast" + (type ? " " + type : "");
  toast.textContent = message;
  stack.appendChild(toast);
  window.setTimeout(function () {
    toast.remove();
  }, 2600);
}

function ensureDialog() {
  let dialog = document.getElementById("th-dialog");
  if (dialog) {
    return dialog;
  }
  dialog = document.createElement("div");
  dialog.id = "th-dialog";
  dialog.className = "th-dialog";
  dialog.hidden = true;
  dialog.innerHTML =
    '<div class="th-dialog-card" role="alertdialog" aria-modal="true" aria-labelledby="th-dialog-title">' +
    '<h2 id="th-dialog-title"></h2>' +
    '<p id="th-dialog-msg"></p>' +
    '<div class="th-dialog-actions">' +
    '<button type="button" class="btn btn-ghost" data-dialog-cancel>Cancel</button>' +
    '<button type="button" class="btn btn-primary" data-dialog-ok>OK</button>' +
    "</div></div>";
  document.body.appendChild(dialog);
  return dialog;
}

function showAlert(title, message) {
  const dialog = ensureDialog();
  dialog.querySelector("#th-dialog-title").textContent = title;
  dialog.querySelector("#th-dialog-msg").textContent = message;
  dialog.querySelector("[data-dialog-cancel]").hidden = true;
  dialog.hidden = false;
  return new Promise(function (resolve) {
    function finish() {
      dialog.hidden = true;
      dialog.querySelector("[data-dialog-ok]").removeEventListener("click", onOk);
      resolve();
    }
    function onOk() {
      finish();
    }
    dialog.querySelector("[data-dialog-ok]").addEventListener("click", onOk);
  });
}

function showConfirm(title, message) {
  const dialog = ensureDialog();
  dialog.querySelector("#th-dialog-title").textContent = title;
  dialog.querySelector("#th-dialog-msg").textContent = message;
  dialog.querySelector("[data-dialog-cancel]").hidden = false;
  dialog.hidden = false;
  return new Promise(function (resolve) {
    const okBtn = dialog.querySelector("[data-dialog-ok]");
    const cancelBtn = dialog.querySelector("[data-dialog-cancel]");
    function cleanup(result) {
      dialog.hidden = true;
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
      resolve(result);
    }
    function onOk() {
      cleanup(true);
    }
    function onCancel() {
      cleanup(false);
    }
    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
  });
}

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      nav.classList.toggle("is-open", !open);
    });
  }

  const page = document.body.getAttribute("data-page");
  document.querySelectorAll(".site-nav a[data-nav]").forEach(function (link) {
    if (link.getAttribute("data-nav") === page) {
      link.setAttribute("aria-current", "page");
    }
  });

  updateCartBadge();
}

function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) {
    return;
  }
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  items.forEach(function (el) {
    observer.observe(el);
  });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function productCardHTML(product, options) {
  const opts = options || {};
  const badge = product.badge
    ? '<span class="chip media-badge">' + product.badge + "</span>"
    : "";
  const wishLabel = isOnWishlist(product.id) ? "In collection" : "Add to wishlist";
  const extra = opts.extra || "";
  return (
    '<article class="product-card" data-id="' +
    product.id +
    '">' +
    '<div class="media">' +
    badge +
    '<img src="' +
    IMAGE_PATH +
    product.image +
    '" alt="' +
    product.name +
    '">' +
    "</div>" +
    '<div class="body">' +
    "<h3>" +
    product.name +
    "</h3>" +
    '<p class="category-label">' +
    product.category +
    "</p>" +
    '<p class="price">' +
    formatPrice(product.price) +
    "</p>" +
    extra +
    '<div class="card-actions">' +
    '<button type="button" class="btn btn-primary" data-add-cart="' +
    product.id +
    '">Add to cart</button>' +
    '<button type="button" class="btn btn-ghost" data-add-wish="' +
    product.id +
    '">' +
    wishLabel +
    "</button>" +
    "</div></div></article>"
  );
}

function bindCardActions(root, products) {
  const scope = root || document;
  scope.querySelectorAll("[data-add-cart]").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      addToCart(btn.getAttribute("data-add-cart"));
    });
  });
  scope.querySelectorAll("[data-add-wish]").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      const id = btn.getAttribute("data-add-wish");
      addToWishlist(id);
      btn.textContent = "In collection";
    });
  });
  scope.querySelectorAll(".product-card").forEach(function (card) {
    card.addEventListener("click", function (event) {
      if (event.target.closest("button")) {
        return;
      }
      const id = card.getAttribute("data-id");
      const product = findProduct(products, id);
      if (product && typeof window.openProductModal === "function") {
        window.openProductModal(product);
      }
    });
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  navigator.serviceWorker.register("../sw.js").catch(function () {
    /* Offline cache is optional if hosting path differs. */
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initNav();
  initReveal();
  registerServiceWorker();
});
