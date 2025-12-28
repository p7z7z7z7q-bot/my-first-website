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
// SEARCH (Global - via data/games.json)
// HTML expected:
// .search-wrapper .search-input .search-btn .search-results
// ==============================
const searchWrap = document.querySelector(".search-wrapper");
const searchInput = document.querySelector(".search-input");
const searchBtn = document.querySelector(".search-btn");
const resultsBox = document.querySelector(".search-results");

let allGames = [];
let lastRendered = [];

// base from script.js location (works even if script is included from deep folders)
const scriptEl = document.querySelector('script[src$="script.js"]');
const SITE_BASE = scriptEl
  ? new URL(".", scriptEl.src).href
  : new URL(".", document.baseURI).href;

const resolveUrl = (u) => {
  if (!u || u === "#") return "#";
  try {
    return new URL(u, SITE_BASE).href;
  } catch {
    return u;
  }
};

// normalize helper
const norm = (s) =>
  (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

async function loadGamesIndex() {
  try {
    const gamesUrl = new URL("data/games.json", SITE_BASE).href;
    const res = await fetch(gamesUrl, { cache: "no-store" });

    if (!res.ok) throw new Error("data/games.json not found / fetch failed");

    const data = await res.json();
    if (Array.isArray(data)) return data;

    throw new Error("games.json is not an array");
  } catch (e) {
    console.warn("[SEARCH] games.json load failed. Fallback to current page cards.", e);

    // fallback: only current page cards
    const cards = Array.from(document.querySelectorAll(".game-card"));
    return cards.map((c) => ({
      title: c.dataset.title || c.querySelector("h2")?.textContent || "",
      desc: c.dataset.desc || c.querySelector("p")?.textContent || "",
      url: c.querySelector("a")?.getAttribute("href") || "#",
      genre: "page",
    }));
  }
}

function setSearchingState(isOn) {
  if (isOn) document.body.classList.add("searching");
  else document.body.classList.remove("searching");
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
  setSearchingState(false);
  lastRendered = [];

  if (clear && searchInput) searchInput.value = "";
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

    const base = resolveUrl(g.url || "#");

    // ✅ لینک با q برای اسکرول/هایلایت در صفحه مقصد
    const url =
      base === "#"
        ? "#"
        : `${base}${base.includes("?") ? "&" : "?"}q=${encodeURIComponent(title)}`;

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

// Click on a result (smooth transition)
document.addEventListener("click", (e) => {
  const a = e.target.closest(".search-results a");
  if (!a) return;

  const href = a.getAttribute("href");
  if (href && href !== "#") {
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
  if (!searchWrap || !searchInput || !searchBtn || !resultsBox) {
    return; // اگر یک صفحه سرچ UI ندارد، کل سایت error نمی‌دهد
  }

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
        const target = resolveUrl(first.url); // ✅ مهم
        document.body.classList.remove("loaded");
        document.body.classList.add("is-loading");
        setTimeout(() => {
          window.location.href = resolveUrl(first.url);
       }, 400);
     } else {
       searchGames(searchInput.value);
     }
  }

    if (e.key === "Escape") {
      e.preventDefault();
      closeSearchUI({ clear: true });
    }
  });

  // click button:
  // - if closed: open
  // - if open: search
  searchBtn.addEventListener("click", () => {
    if (!searchWrap.classList.contains("open")) {
      openSearchUI();
      return;
    }
    searchGames(searchInput.value);
  });

  // focus => open
  searchInput.addEventListener("focus", () => {
    openSearchUI();
    searchGames(searchInput.value);
  });

  // click outside => close
  document.addEventListener("click", (e) => {
    if (!searchWrap.contains(e.target)) {
      closeSearchUI();
    }
  });
})();

// ==============================
// Jump to searched game on destination page (?q=...)
// ==============================
function findBestCardMatch(query) {
  const q = norm(query);
  if (!q) return null;

  const cards = Array.from(document.querySelectorAll(".game-card"));
  if (!cards.length) return null;

  // اولویت: data-title دقیق
  let exact = cards.find((c) => norm(c.dataset.title) === q);
  if (exact) return exact;

  // بعد: h2 دقیق
  exact = cards.find((c) => norm(c.querySelector("h2")?.textContent) === q);
  if (exact) return exact;

  // بعد: شامل شدن
  return (
    cards.find((c) => norm(c.dataset.title).includes(q)) ||
    cards.find((c) => norm(c.querySelector("h2")?.textContent).includes(q)) ||
    null
  );
}

function highlightAndScrollToCard(card) {
  if (!card) return;

  card.classList.add("match-highlight");
  card.scrollIntoView({ behavior: "smooth", block: "center" });

  // بعد چند ثانیه هایلایت برداشته شود
  setTimeout(() => card.classList.remove("match-highlight"), 2500);
}

// وقتی صفحه لود شد، اگر q داریم برو همون کارت
window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  if (!q) return;

  const card = findBestCardMatch(q);
  highlightAndScrollToCard(card);
});


