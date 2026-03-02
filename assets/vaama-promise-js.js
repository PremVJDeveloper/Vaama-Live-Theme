document.addEventListener("DOMContentLoaded", () => {
  const marqueeInner = document.querySelector(".marquee__inner");
  if (!marqueeInner) return;

  // Clone children once for smooth infinite loop
  marqueeInner.innerHTML += marqueeInner.innerHTML;
});
