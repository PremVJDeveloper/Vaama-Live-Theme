const toggleBtn = document.getElementById('toggle-image-drawer');
const closeBtn = document.getElementById('close-image-drawer');
const drawer = document.getElementById('image-drawer');

toggleBtn.addEventListener('click', () => {
drawer.classList.add('open');
});

closeBtn.addEventListener('click', () => {
drawer.classList.remove('open');
});

document.addEventListener('click', (e) => {
if (!drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
    drawer.classList.remove('open');
}
});


const offers = [
"Free 24kt gold coin gift",
"Flat ₹30,000/carat on solitaire above 1 carat."
];

let currentIndex = 0;
const offerText = document.getElementById("offer-text");
const offerCount = document.getElementById("offer-count");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const offerBox = document.querySelector(".offer-box");

function updateOfferDisplay() {
offerText.classList.remove("offer-text"); // reset animation
void offerText.offsetWidth; // force reflow
offerText.textContent = offers[currentIndex];
offerCount.textContent = `OFFERS : ${currentIndex + 1}/${offers.length}`;
offerText.classList.add("offer-text"); // re-trigger animation

prevBtn.classList.toggle("disabled", currentIndex === 0);
nextBtn.classList.toggle("disabled", currentIndex === offers.length - 1);
}

prevBtn.addEventListener("click", () => {
if (currentIndex > 0) {
    currentIndex--;
    updateOfferDisplay();
}
});

nextBtn.addEventListener("click", () => {
if (currentIndex < offers.length - 1) {
    currentIndex++;
    updateOfferDisplay();
}
});

// Auto-scroll every 5 seconds
let autoScroll = setInterval(() => {
currentIndex = (currentIndex + 1) % offers.length;
updateOfferDisplay();
}, 5000);

// Pause auto-scroll on hover
offerBox.addEventListener("mouseenter", () => clearInterval(autoScroll));
offerBox.addEventListener("mouseleave", () => {
autoScroll = setInterval(() => {
    currentIndex = (currentIndex + 1) % offers.length;
    updateOfferDisplay();
}, 5000);
});

// --- Mobile swipe support ---
let touchStartX = 0;
let touchEndX = 0;
const swipeThreshold = 50; // Minimum distance in px to qualify as swipe

offerBox.addEventListener("touchstart", (e) => {
touchStartX = e.changedTouches[0].screenX;
});

offerBox.addEventListener("touchend", (e) => {
touchEndX = e.changedTouches[0].screenX;
handleSwipeGesture();
});

function handleSwipeGesture() {
const distance = touchEndX - touchStartX;
if (Math.abs(distance) > swipeThreshold) {
    if (distance < 0 && currentIndex < offers.length - 1) {
    currentIndex++;
    updateOfferDisplay();
    } else if (distance > 0 && currentIndex > 0) {
    currentIndex--;
    updateOfferDisplay();
    }
}
}
updateOfferDisplay();
                        
const toggle = document.getElementById("gift-toggle");
const messageSection = document.getElementById("gift-message-section");
const addToCartBtn = document.getElementById("add-to-cart-btn");
const textarea = document.getElementById("gift-message-text");
const hiddenInput = document.getElementById("gift-message-hidden");
const saveBtn = document.getElementById("save-message-btn");
const savedDisplay = document.getElementById("saved-message-display");
const savedText = document.getElementById("saved-message-text");
const editLink = document.getElementById("edit-message-link");

toggle.addEventListener("change", function () {
    if (this.checked) {
    messageSection.style.display = "block";
    addToCartBtn.style.display = "none"; // Wait for save
    } else {
    messageSection.style.display = "none";
    addToCartBtn.style.display = "none";
    textarea.value = "";
    hiddenInput.value = "";
    savedDisplay.style.display = "none";
    }
});

saveBtn.addEventListener("click", function () {
    const msg = textarea.value.trim();
    if (msg) {
    hiddenInput.value = msg;
    savedText.textContent = msg;
    savedDisplay.style.display = "block";
    textarea.style.display = "none";
    saveBtn.style.display = "none";
    addToCartBtn.style.display = "inline-block";
    }
});

editLink.addEventListener("click", function (e) {
    e.preventDefault();
    textarea.style.display = "block";
    saveBtn.style.display = "inline-block";
    savedDisplay.style.display = "none";
});