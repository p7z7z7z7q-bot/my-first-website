// ==============================
// Page fade-in/out
// ==============================
document.body.classList.add("is-loading");

window.addEventListener("load", () => {
  document.body.classList.remove("is-loading");
  document.body.classList.add("loaded");
});

// ==============================
// Dropdown (Games)
// ==============================
document.querySelectorAll(".dropbtn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const dropdown = btn.closest(".dropdown");
    if (!dropdown) return;
    dropdown.classList.toggle("open");
  });
});

// close dropdown by clicking outside
document.addEventListener("click", (e) => {
  document.querySelectorAll(".dropdown.open").forEach((dd) => {
    if (!dd.contains(e.target)) dd.classList.remove("open");
  });
});

// ==============================
// Smooth page transition for internal links
// ==============================
const isRealInternalLink = (a) => {
  const hrefAttr = a.getAttribute("href");
  if (!hrefAttr) return false;
  if (hrefAttr === "#" || hrefAttr.startsWith("#")) return false;
  if (hrefAttr.startsWith("mailto:") || hrefAttr.startsWith("tel:")) return false;
  if (a.target === "_blank") return false;
  if (a.classList.contains("dropbtn")) return false;

  try {
    const url = new URL(a.href);
    if (url.origin !== window.location.origin) return false;
  } catch {
    return false;
  }
  return true;
};

document.querySelectorAll("a").forEach((link) => {
  if (!isRealInternalLink(link)) return;

  link.addEventListener("click", (e) => {
    e.preventDefault();
    const target = link.href;

    document.body.classList.remove("loaded");
    document.body.classList.add("is-loading");

    setTimeout(() => {
      window.location.href = target;
    }, 400);
  });
});

// ==============================
// SEARCH (Global - via games.json)
// HTML expected:
// .search-wrapper .search-input .search-btn .search-results
// ==============================
const searchWrap = document.querySelector(".search-wrapper");
const searchInput = document.querySelector(".search-input");
const searchBtn = document.querySelector(".search-btn");
const resultsBox = document.querySelector(".search-results");

let allGames = [];
let lastRendered = [];

// ✅ NEW: Calculate base path from script.js location (works in all pages)
const scriptEl = document.querySelector('script[src$="script.js"]');
const SITE_BASE = scriptEl
  ? new URL(".", scriptEl.src).href
  : new URL(".", document.baseURI).href;

// ✅ NEW: Resolve any relative URL safely from SITE_BASE
const resolveUrl = (u) => {
  if (!u || u === "#") return "#";
  try {
    return new URL(u, SITE_BASE).href;
  } catch {
    return u;
  }
};

// normalize helper (fa/en safe-ish)
const norm = (s) =>
  (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

// ✅ UPDATED: fetch games index from SITE_BASE (not current page path)
async function loadGamesIndex() {
  try {
    const gamesUrl = new URL("data/games.json", SITE_BASE).href;

    const res = await fetch(gamesUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("data/games.json not found");

    const data = await res.json();
    if (Array.isArray(data)) return data;
  } catch (e) {
    // fallback: only current page cards (if JSON missing)
    const cards = Array.from(document.querySelectorAll(".game-card"));
    return cards.map((c) => ({
      title: c.dataset.title || c.querySelector("h2")?.textContent || "",
      desc: c.dataset.desc || c.querySelector("p")?.textContent || "",
      url: "#",
      genre: "home",
    }));
  }
  return [];
}

function openSearchUI() {
  if (!searchWrap) return;
  searchWrap.classList.add("open");
  searchInput?.focus();
}

function closeSearchUI({ clear = false } = {}) {
  if (!searchWrap) return;

  searchWrap.classList.remove("open");
  if (resultsBox) {
    resultsBox.hidden = true;
    resultsBox.innerHTML = "";
  }
  document.body.classList.remove("searching");

  if (clear && searchInput) searchInput.value = "";
}

function setSearchingState(isOn) {
  if (isOn) document.body.classList.add("searching");
  else document.body.classList.remove("searching");
}

function renderResults(items, q) {
  if (!resultsBox) return;

  const query = norm(q);
  if (!query) {
    resultsBox.hidden = true;
    resultsBox.innerHTML = "";
    setSearchingState(false);
    lastRendered = [];
    return;
  }

  lastRendered = items.slice(0, 8);

  if (!lastRendered.length) {
    resultsBox.hidden = false;
    resultsBox.innerHTML = `<div class="hint">هیچ نتیجه‌ای پیدا نشد 😅</div>`;
    setSearchingState(true);
    return;
  }

  const html = lastRendered
    .map((g) => {
      const title = g.title || "";
      const genre = g.genre ? ` — ${g.genre}` : "";
      const url = resolveUrl(g.url || "#"); // ✅ NEW: make links work from any page
      return `<a href="${url}" class="search-item">${title}${genre}</a>`;
    })
    .join("");

  resultsBox.hidden = false;
  resultsBox.innerHTML = html;
  setSearchingState(true);
}

function searchGames(q) {
  const query = norm(q);
  if (!query) {
    renderResults([], "");
    return;
  }

  const filtered = allGames.filter((g) => {
    const t = norm(g.title);
    const d = norm(g.desc);
    const ge = norm(g.genre);
    return t.includes(query) || d.includes(query) || ge.includes(query);
  });

  renderResults(filtered, q);
}

// handle click on a result (with smooth transition)
document.addEventListener("click", (e) => {
  const a = e.target.closest(".search-results a");
  if (!a) return;

  // اگر لینک واقعی بود، انیمیشن خروج
  if (a.getAttribute("href") && a.getAttribute("href") !== "#") {
    e.preventDefault();
    const target = a.href;

    document.body.classList.remove("loaded");
    document.body.classList.add("is-loading");

    setTimeout(() => {
      window.location.href = target;
    }, 400);
  } else {
    closeSearchUI();
  }
});

(async function initSearch() {
  if (!searchWrap || !searchInput || !searchBtn || !resultsBox) return;

  allGames = await loadGamesIndex();

  // typing => live filter
  searchInput.addEventListener("input", () => {
    openSearchUI();
    searchGames(searchInput.value);
  });

  // Enter => go to first result
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const first = lastRendered?.[0];
      if (first && first.url && first.url !== "#") {
        document.body.classList.remove("loaded");
        document.body.classList.add("is-loading");
        setTimeout(() => {
          window.location.href = first.url;
        }, 400);
      } else {
        // اگر چیزی نیست، فقط سرچ رو اجرا کن که پیام "هیچ نتیجه‌ای..." بیاد
        searchGames(searchInput.value);
      }
    }

    if (e.key === "Escape") {
      e.preventDefault();
      closeSearchUI({ clear: true });
    }
  });

  // click on search button:
  // - if closed: open
  // - if open: search
  searchBtn.addEventListener("click", () => {
    if (!searchWrap.classList.contains("open")) {
      openSearchUI();
      return;
    }
    searchGames(searchInput.value);
  });

  // click outside => close
  document.addEventListener("click", (e) => {
    if (!searchWrap.contains(e.target)) {
      closeSearchUI();
    }
  });
})();
