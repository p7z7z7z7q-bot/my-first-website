// ==============================
// Helpers
// ==============================
const norm = (s) =>
  (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const slugify = (s) => {
  // اجازه‌ی فارسی + انگلیسی + عدد
  return norm(s)
    .replace(/['"]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "") // نیازمند مرورگرهای جدید (Chrome/Edge ok)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

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

document.addEventListener("click", (e) => {
  document.querySelectorAll(".dropdown.open").forEach((dd) => {
    if (!dd.contains(e.target)) dd.classList.remove("open");
  });
});

// ==============================
// Smooth page transition (internal links)
// ==============================
const isRealInternalLink = (a) => {
  const hrefAttr = a.getAttribute("href");
  if (!hrefAttr) return false;
  if (hrefAttr === "#" || hrefAttr.startsWith("#")) return false;
  if (hrefAttr.startsWith("mailto:") || hrefAttr.startsWith("tel:")) return false;
  if (a.target === "_blank") return false;
  if (a.classList.contains("dropbtn")) return false;
  if (a.closest(".search-results")) return false; // سرچ خودش کنترل می‌کنه

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
// Auto add ids to cards on every page (for #jump)
// اگر کارت‌ها id ندارن، از title/h2 می‌سازه
// ==============================
function ensureCardIds() {
  const cards = Array.from(document.querySelectorAll(".game-card"));
  cards.forEach((c) => {
    if (c.id) return;
    const t = c.dataset.title || c.querySelector("h2")?.textContent || "";
    const id = slugify(t);
    if (id) c.id = id;
  });
}
ensureCardIds();

// ==============================
// SEARCH (Global - via data/games.json)
// Expected HTML:
// .search-wrapper .search-input .search-btn .search-results
// ==============================
const searchWrap = document.querySelector(".search-wrapper");
const searchInput = document.querySelector(".search-input");
const searchBtn = document.querySelector(".search-btn");
const resultsBox = document.querySelector(".search-results");

let allGames = [];
let lastRendered = []; // [{title, urlFinal}, ...]

function setSearchingState(isOn) {
  if (isOn) document.body.classList.add("searching");
  else document.body.classList.remove("searching");
}

async function loadGamesIndex() {
  const gamesUrl = new URL("data/games.json", SITE_BASE).href;
  const res = await fetch(gamesUrl, { cache: "no-store" });
  if (!res.ok) throw new Error("Fetch failed: " + gamesUrl);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("games.json is not an array");
  return data;
}

function openSearchUI() {
  if (!searchWrap) return;
  searchWrap.classList.add("open");
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

function buildFinalUrl(item) {
  // base page
  const base = resolveUrl(item.url || "#");
  if (base === "#") return "#";

  // add ?q=TITLE for highlight + add #slug for jump
  const title = item.title || "";
  const h = slugify(title);

  const urlObj = new URL(base);
  urlObj.searchParams.set("q", title);

  // اگر slug ساختیم، هم jump هم highlight داریم
  if (h) urlObj.hash = h;

  return urlObj.toString();
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

  const top = items.slice(0, 8);

  if (!top.length) {
    resultsBox.hidden = false;
    resultsBox.innerHTML = `<div class="hint">هیچ نتیجه‌ای پیدا نشد 😅</div>`;
    setSearchingState(true);
    lastRendered = [];
    return;
  }

  lastRendered = top.map((g) => ({
    title: g.title || "",
    urlFinal: buildFinalUrl(g),
  }));

  const html = top
    .map((g) => {
      const title = g.title || "";
      const meta = g.genre ? `<span class="meta">${g.genre}</span>` : `<span class="meta"></span>`;
      const urlFinal = buildFinalUrl(g);
      return `<a href="${urlFinal}" class="search-item"><span>${title}</span>${meta}</a>`;
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

// click on result (smooth transition)
document.addEventListener("click", (e) => {
  const a = e.target.closest(".search-results a");
  if (!a) return;

  const href = a.getAttribute("href");
  if (!href || href === "#") return;

  e.preventDefault();
  const target = a.href;

  document.body.classList.remove("loaded");
  document.body.classList.add("is-loading");

  setTimeout(() => {
    window.location.href = target;
  }, 400);
});

(async function initSearch() {
  if (!searchWrap || !searchInput || !searchBtn || !resultsBox) return;

  try {
    allGames = await loadGamesIndex();
  } catch (err) {
    console.warn("[SEARCH] games.json load failed:", err);
    allGames = []; // اگر json لود نشد، حداقل سایت نمی‌ریزه
  }

  // typing => live filter
  searchInput.addEventListener("input", () => {
    openSearchUI();
    searchGames(searchInput.value);
  });

  // focus => open
  searchInput.addEventListener("focus", () => {
    openSearchUI();
    searchGames(searchInput.value);
  });

  // Enter => go first result (or show hint)
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // اگر هنوز نتیجه ساخته نشده، بساز
      if (!lastRendered.length) searchGames(searchInput.value);

      const first = lastRendered?.[0];
      if (first && first.urlFinal && first.urlFinal !== "#") {
        document.body.classList.remove("loaded");
        document.body.classList.add("is-loading");
        setTimeout(() => {
          window.location.href = first.urlFinal;
        }, 400);
      }
    }

    if (e.key === "Escape") {
      e.preventDefault();
      closeSearchUI({ clear: true });
    }
  });

  // click button:
  // - if closed: open + focus
  // - if open: search
  searchBtn.addEventListener("click", () => {
    if (!searchWrap.classList.contains("open")) {
      openSearchUI();
      searchInput.focus();
      return;
    }
    searchGames(searchInput.value);
  });

  // click outside => close
  document.addEventListener("click", (e) => {
    if (!searchWrap.contains(e.target)) closeSearchUI();
  });
})();

// ==============================
// Highlight card on destination page (?q=...)
// ==============================
function findBestCardMatch(query) {
  const q = norm(query);
  if (!q) return null;

  const cards = Array.from(document.querySelectorAll(".game-card"));
  if (!cards.length) return null;

  // data-title exact
  let exact = cards.find((c) => norm(c.dataset.title) === q);
  if (exact) return exact;

  // h2 exact
  exact = cards.find((c) => norm(c.querySelector("h2")?.textContent) === q);
  if (exact) return exact;

  // includes
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

  setTimeout(() => card.classList.remove("match-highlight"), 2500);
}

window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  if (!q) return;

  ensureCardIds(); // مطمئن شو id ساخته شده
  const card = findBestCardMatch(q);
  highlightAndScrollToCard(card);
});
