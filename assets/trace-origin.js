
document.addEventListener("DOMContentLoaded", function() {
    const traceIcon = document.querySelector(".trace-badge .trace-icon.new_modal");
    const drawer = document.getElementById("product-passport-drawer");
    const closeBtn = document.querySelector(".close-drawer");
    const overlay = document.getElementById("overlay");

    // Open drawer when trace icon is clicked
    if (traceIcon) {
        traceIcon.addEventListener("click", function() {
            // Push event to dataLayer
            window.dataLayer = window.dataLayer || [];
            dataLayer.push({
                event: "promoClick",
                promoClick: {
                    promo_id: 'Trace Clicked',
                    promo_name: '{{ product.title | escape }}',
                    creative_name: 'Trace Batch Clicked',
                    location_id: '46406942392538'
                }
            });
            console.log("promoClick event pushed to dataLayer");
            
            // Open drawer
            drawer.classList.add("active");
            overlay.classList.add("active");
            document.body.style.overflow = "hidden";
        });
    }

    // Close drawer when close button is clicked
    if (closeBtn) {
        closeBtn.addEventListener("click", function() {
            drawer.classList.remove("active");
            overlay.classList.remove("active");
            document.body.style.overflow = "auto";
        });
    }

    // Close drawer when overlay is clicked
    if (overlay) {
        overlay.addEventListener("click", function() {
            drawer.classList.remove("active");
            overlay.classList.remove("active");
            document.body.style.overflow = "auto";
        });
    }
});
