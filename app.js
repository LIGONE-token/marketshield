// 🎄 Weihnachtsmodus (1.–26. Dezember)
document.addEventListener("DOMContentLoaded", function () {
    const now = new Date();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    if (m === 12 && d >= 1 && d <= 26) {
        document.body.classList.add("christmas");
    }

    // 🔗 Deep-Link direkt laden
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
        loadFullEntry(id);
    }
});


// ░░░░░░░░░░░░░  KONFIGURATION
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";


// ░░░░░░░░░░░░░  SUPABASE CLIENT
const supabase = {
    async select(query) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`
            }
        });
        return await response.json();
    }
};


// ░░░░░░░░░░░░░  KATEGORIEN LADEN
fetch("categories.json")
    .then(r => r.json())
    .then(data => {
        const grid = document.querySelector(".category-grid");
        grid.innerHTML = "";

        data.categories.forEach(cat => {
            const btn = document.createElement("button");
            btn.textContent = cat.title;
            btn.dataset.category = cat.title;
            btn.addEventListener("click", () => loadCategory(cat.title));
            grid.appendChild(btn);
        });
    });


// ░░░░░░░░░░░░░  HEALTH SCORE
function getHealthIcons(score) {
    if (!score || score === 0) return "";
    if (score >= 80) return `<div class="health-score-box health-3">💚💚💚</div>`;
    if (score >= 60) return `<div class="health-score-box health-2">💚💚</div>`;
    if (score >= 40) return `<div class="health-score-box health-1">💚</div>`;
    if (score >= 20) return `<div class="health-score-box health-mid">🧡🧡</div>`;
    return `<div class="health-score-box health-bad">⚠️❗⚠️</div>`;
}


// ░░░░░░░░░░░░░  INDUSTRIE SCORE
function renderProcessBar(score) {
    if (score === null || score === undefined) return "";

    const s = Math.max(1, Math.min(10, score));
    let color = "#2ecc71";
    if (s >= 4 && s <= 6) color = "#f1c40f";
    if (s >= 7) color = "#e74c3c";

    return `
        <div class="process-wrapper">
            <div class="process-title">Industriescore</div>
            <div class="process-bar-bg">
                <div class="process-bar-fill" style="width:${s * 10}%; background:${color};"></div>
            </div>
            <div class="process-bar-label">${s}/10</div>
        </div>
    `;
}


// ░░░░░░░░░░░░░  SUCHFUNKTION
document.getElementById("searchInput").addEventListener("input", async function () {
    const raw = this.value.trim();
    const results = document.getElementById("results");

    if (raw.length < 2) {
        results.innerHTML = "";
        return;
    }

    results.innerHTML = "<p>Suche...</p>";

    const q = encodeURIComponent(raw);

    const query =
        `entries?select=*` +
        `&or=(` +
        `title.ilike.%25${q}%25,` +
        `summary.ilike.%25${q}%25,` +
        `mechanism.ilike.%25${q}%25` +
        `)`;

    const data = await supabase.select(query);

    if (!data || data.length === 0) {
        results.innerHTML = "<p>Keine Treffer.</p>";
        return;
    }

    results.innerHTML = `
    ${data.map(entry => `
        <div class="search-result" data-id="${entry.id}">
            <div class="search-title">${entry.title}</div>

            <div class="search-short">
                ${entry.summary?.substring(0, 120) || ""}…
            </div>

            <div class="search-metrics">
                ${entry.processing_score > 0
                  ? `<div class="process-mini">${renderProcessBar(entry.processing_score)}</div>`
                  : ""}
                ${entry.score > 0
                  ? `<div class="health-mini">${getHealthIcons(entry.score)}</div>`
                  : ""}
            </div>
        </div>
    `).join("")}
`;

});


// ░░░░░░░░░░░░░  KATEGORIE-ANSICHT
async function loadCategory(categoryName) {
    const results = document.getElementById("results");
    results.innerHTML = "<p>Lade Daten...</p>";

    const query = `entries?select=*&category=eq.${encodeURIComponent(categoryName)}`;
    const data = await supabase.select(query);

    if (!data || data.length === 0) {
        results.innerHTML = "<p>Noch keine Einträge.</p>";
        return;
    }

    results.innerHTML = data.map(entry => `
        <div class="entry-card" data-id="${entry.id}">
            <h3>${entry.title}</h3>
            <p>${entry.summary?.substring(0, 120) || ""}…</p>
        </div>
    `).join("");
}


// ░░░░░░░░░░░░░  EINZELANSICHT
async function loadFullEntry(id) {
    const results = document.getElementById("results");
    results.innerHTML = "<p>Lade Eintrag...</p>";

    const query = `entries?select=*&id=eq.${id}`;
    const data = await supabase.select(query);

    if (!data || !data[0]) {
        results.innerHTML = "<p>Fehler.</p>";
        return;
    }

    results.innerHTML = renderEntryCard(data[0]);
}


// ░░░░░░░░░░░░░  EINTRAG
function renderEntryCard(entry) {
    return `
        <div class="entry-card">
            <h2>${entry.title}</h2>
            ${renderProcessBar(entry.processing_score)}
            ${getHealthIcons(entry.score)}
            <p>${entry.summary || ""}</p>
        </div>
    `;
}


// ░░░░░░░░░░░░░  VERGLEICH (DYNAMISCH)
const compareBtn = document.getElementById("compareBtn");

if (compareBtn) {
    compareBtn.addEventListener("click", async () => {
        const results = document.getElementById("results");
        results.innerHTML = "<p>Vergleich wird geladen...</p>";

        const query =
            `entries?select=title,score,processing_score` +
            `&category=eq.Genussmittel` +
            `&processing_score=gt.0` +
            `&order=processing_score.desc`;

        const data = await supabase.select(query);

        results.innerHTML = `
            <h2>Vergleich: Industriegrad</h2>
            ${data.map(e => `
                <div class="compare-card">
                    <h3>${e.title}</h3>
                    ${renderProcessBar(e.processing_score)}
                    ${getHealthIcons(e.score)}
                </div>
            `).join("")}
        `;
    });
}


// ░░░░░░░░░░░░░  GLOBAL CLICK
document.addEventListener("click", function (e) {
    const card = e.target.closest(".entry-card, .search-result");
    if (card && card.dataset.id) {
        loadFullEntry(card.dataset.id);
    }
});
