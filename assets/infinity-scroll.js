document.addEventListener("DOMContentLoaded", () => {
  const infinityWrapper = document.querySelector(".js-collection-infinity");
  const infinityLink = infinityWrapper?.querySelector("a");
  if (!infinityLink) return;

  infinityLink.style.display = "none";

  const productGrid = document.querySelector("#ProductGridContainer .products__row");
  if (!productGrid) return;

  let loading = false;
  let hasMorePages = true;
  let lastHeight = document.documentElement.scrollHeight;
  let lastLoadedPage = infinityLink.href;

  const loadedProducts = new Set();

  const sentinel = document.createElement("div");
  sentinel.className = "scroll-sentinel";
  productGrid.appendChild(sentinel);

  const messageEl = document.createElement("div");
  messageEl.className = "infinity-message";
  messageEl.style.textAlign = "center";
  messageEl.style.padding = "10px";
  messageEl.style.fontSize = "14px";
  messageEl.style.fontWeight = "600";
  messageEl.style.display = "none";
  infinityWrapper.appendChild(messageEl);

  const setMessage = (msg) => {
    messageEl.textContent = msg;
    messageEl.style.display = "block";
  };

  const hideMessage = () => {
    messageEl.textContent = "";
    messageEl.style.display = "none";
  };

  const getProductId = (productEl) => {
    const link = productEl.querySelector('a[href*="/products/"]');
    const match = link?.href.match(/\/products\/([^/?]+)/);
    return match ? match[1] : null;
  };

  const loadNextPage = async () => {
    if (loading || !hasMorePages) return;

    const nextUrl = infinityLink.getAttribute("href");
    if (!nextUrl || nextUrl === lastLoadedPage) return;

    loading = true;
    observer.unobserve(sentinel);
    
    setMessage("Please wait...");

    try {
      const res = await fetch(nextUrl);
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, "text/html");

      const newProducts = doc.querySelectorAll("#ProductGridContainer .products__col");

      let added = 0;
      newProducts.forEach(p => {
        const id = getProductId(p);
        if (!id || loadedProducts.has(id)) return;

        loadedProducts.add(id);
        productGrid.insertBefore(p, sentinel);
        added++;
      });

      const newLink = doc.querySelector(".js-collection-infinity a");

      if (added > 0 && newLink) {
        lastLoadedPage = nextUrl;
        infinityLink.href = newLink.getAttribute("href");
        lastHeight = document.documentElement.scrollHeight;
      } else {
        console.log("No more new products.");
        hasMorePages = false;

        
        infinityWrapper.classList.remove("loading");
        infinityLink.remove();
        observer.disconnect();
    }
} catch (err) {
    console.error("Infinite scroll failed:", err);
    setMessage("Something went wrong...");
}

    loading = false;
    setMessage("Thank You"); 
    if (hasMorePages) observer.observe(sentinel);
  };

  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) loadNextPage();
  }, {
    rootMargin: "800px 0px",
    threshold: 0.01
  });

  productGrid.querySelectorAll(".products__col").forEach(p => {
    const id = getProductId(p);
    if (id) loadedProducts.add(id);
  });

  observer.observe(sentinel);
});
