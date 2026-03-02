document.addEventListener('DOMContentLoaded', function () {
  const countdownTimers = document.querySelectorAll('[data-end-time]');
  
  countdownTimers.forEach(timer => {
    const endTime = new Date(timer.dataset.endTime).getTime();
    const daysEl = timer.querySelector('[data-days]');
    const hoursEl = timer.querySelector('[data-hours]');
    const minutesEl = timer.querySelector('[data-minutes]');
    const secondsEl = timer.querySelector('[data-seconds]');

    function updateCountdown() {
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance < 0) {
        timer.innerHTML = '<div class="countdown-expired">Offer Expired</div>';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
      if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  });
});
