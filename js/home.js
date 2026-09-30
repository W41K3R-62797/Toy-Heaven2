/* Home page — auto-rotating banners + product of the day + featured grid */

document.addEventListener("DOMContentLoaded", function () {
  initHeroSlider();
  loadProducts()
    .then(function (products) {
      renderProductOfTheDay(products);
      renderFeatured(products);
    })
    .catch(function () {
      showToast("Could not load the catalogue.", "error");
    });
});

function initHeroSlider() {
  const slider = document.querySelector(".hero-slider");
  if (!slider) {
    return;
  }
  const slides = Array.prototype.slice.call(slider.querySelectorAll(".slide"));
  const dots = Array.prototype.slice.call(slider.querySelectorAll(".dot"));
  let index = 0;
  let timer;

  function show(next) {
    slides[index].classList.remove("is-active");
    dots[index].classList.remove("is-active");
    dots[index].setAttribute("aria-selected", "false");
    index = (next + slides.length) % slides.length;
    slides[index].classList.add("is-active");
    dots[index].classList.add("is-active");
    dots[index].setAttribute("aria-selected", "true");
  }

  function play() {
    stop();
    timer = window.setInterval(function () {
      show(index + 1);
    }, 5500);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
    }
  }

  slider.querySelector("[data-next]").addEventListener("click", function () {
    show(index + 1);
    play();
  });
  slider.querySelector("[data-prev]").addEventListener("click", function () {
    show(index - 1);
    play();
  });
  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      show(i);
      play();
    });
  });

  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", play);
  slider.addEventListener("focusin", stop);
  slider.addEventListener("focusout", play);
  play();
}

function renderProductOfTheDay(products) {
  const potd = getProductOfTheDay(products);
  const root = document.querySelector("[data-potd]");
  if (!potd || !root) {
    return;
  }
  root.innerHTML =
    '<img src="' +
    IMAGE_PATH +
    potd.image +
    '" alt="' +
    potd.name +
    '">' +
    '<div class="potd-copy">' +
    '<p class="eyebrow">Product of the day</p>' +
    "<h2>" +
    potd.name +
    "</h2>" +
    '<p class="category-label">' +
    potd.category +
    " · " +
    potd.details +
    "</p>" +
    "<p>" +
    potd.description +
    "</p>" +
    '<p class="price">' +
    formatPrice(potd.price) +
    "</p>" +
    '<div class="card-actions">' +
    '<button type="button" class="btn btn-primary" data-add-cart="' +
    potd.id +
    '">Add to cart</button>' +
    '<a class="btn btn-ghost" href="products.html">Browse the shop</a>' +
    "</div></div>";
  bindCardActions(root, products);
}

function renderFeatured(products) {
  const grid = document.querySelector("[data-featured-grid]");
  if (!grid) {
    return;
  }
  const featured = products.filter(function (item) {
    return item.featured;
  });
  grid.innerHTML = featured
    .map(function (item) {
      return productCardHTML(item);
    })
    .join("");
  bindCardActions(grid, products);
}
