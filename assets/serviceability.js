document.addEventListener("DOMContentLoaded", function () {

  const pinInput = document.getElementById("svcPin");
  const locateBtn = document.getElementById("svcLocateBtn");
  const msgBox = document.getElementById("svcMsg");
  const div_id = "1f2bc20c510d78bccfd3ae614e69eee8";


  // allow only digits
  pinInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "").slice(0, 6);
  });
pinInput.addEventListener("keyup", function (e) {
    if (e.key === "Enter") {
        locateBtn.click();
    }
});
  locateBtn.addEventListener("click", function () {
    const pin = pinInput.value;

    if (pin.length !== 6) {
      msgBox.textContent = "Please enter a valid 6-digit pincode.";
      msgBox.className = "svc-msg error";
      return;
    }

    msgBox.textContent = "Checking…";
    msgBox.className = "svc-msg";

    fetch('/apps/serviceability/checkServiceability', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: div_id,
        pin_code: pin
      })
    })
    .then(r => r.text())
    .then(t => {
      let data;
      try { data = JSON.parse(t); } catch(e) { msgBox.textContent = t; return; }

const shippingBlock = document.querySelector(".section-estimated_delivery");

if (data.status == 'true' || data.status === true) {
    msgBox.textContent = "Delivery to this pincode is serviceable";
    msgBox.className = "svc-msg success";

    if (shippingBlock) {
        shippingBlock.style.display = "block";
    }

} else {
    msgBox.textContent = "Delivery is currently unavailable for this area";
    msgBox.className = "svc-msg error";

    if (shippingBlock) {
        shippingBlock.style.display = "none";
    }
}

    })
    .catch(err => {
      msgBox.textContent = "Error: " + err.message;
      msgBox.className = "svc-msg error";
    });
  });

});