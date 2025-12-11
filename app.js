// 🎄 Weihnachtsmodus (1.–26. Dezember)
document.addEventListener("DOMContentLoaded", function () {
    const now = new Date();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    if (m === 12 && d >= 1 && d <= 26) {
        document.body.classList.add("christmas");
    }
});

// ░░░░░░░░░░░░░  KONFIGURATION  
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

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

// ░░░░░░░░░░░░░  HEALTH SCORE (nur wenn > 0)
function getHealthIcons(score) {
    if (!score || score === 0) return "";

    if (score >= 80) return `<div class="health-score-box health-3">💚💚💚</div>`;
    if (score >= 60) return `<div class="health-score-box health-2">💚💚</div>`;
    if (score >= 40) return `<div class="health-score-box health-1">💚</div>`;
    if (score >= 20) return `<div class="health-score-box health-mid">🧡🧡</div>`;
    return `<div class="health-score-box health-bad">⚠️❗⚠️</div>`;
}

// ░░░░░░░░░░░░░  INDUSTRIE SCORE (nur wenn > 0)
function renderProcessBar(score) {
    if (!score || score === 0) return "";

    const s = Math.max(1, Math.min(10, score));
    let color = "#2ecc71";
    if (s >= 4 && s <= 6) color = "#f1c40f";
    if (s >= 7) color = "#e74c3c";

    return `
        <div class="process-bar-bg">
            <div class="process-bar-fill" style="width:${s * 10}%; background:${color};"></div>
        </div>
        <div class="process-bar-label">${s}/10</div>
    `;
}

// ░░░░░░░░░░░░░  SUCHFUNKTION  
document.getElementById("searchInput").addEventListener("input", async function () {
    const q = this.value.trim();
    const results = document.getElementById("results");

    if (q.length < 2) {
        results.innerHTML = "";
        return;
    }

    results.innerHTML = "<p>Suche...</p>";

    const url = `${SUPABASE_URL}/rest/v1/entries?select=*&or=(
        title.ilike.*${q}*,
        summary.ilike.*${q}*,
        mechanism.ilike.*${q}*
    )`;

    const response = await fetch(url, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });

    const data = await response.json();
    if (!data || data.length === 0) {
        results.innerHTML = "<p>Keine Treffer.</p>";
        return;
    }

    const ranked = data.sort((a, b) => (b.score || 0) - (a.score || 0));

    results.innerHTML = `
        <div class="search-hint">Für Details bitte antippen.</div>
        ${ranked.map(entry => `
            <div class="search-item search-result" data-id="${entry.id}">
                <div class="search-title">${entry.title}</div>
                <div class="search-short">
                    ${entry.summary?.substring(0, 120) || ""}…
                </div>

                <div class="search-metrics">
                    ${entry.score > 0 ? `<div class="health-mini">${getHealthIcons(entry.score)}</div>` : ""}
                    ${entry.processing_score > 0 ? `<div class="process-bar process-bar-mini">${renderProcessBar(entry.processing_score)}</div>` : ""}
                </div>
            </div>
        `).join("")}
    `;
});

// ░░░░░░░░░░░░░  CLICK → EINZELANSICHT  
document.addEventListener("click", function (e) {
    const card = e.target.closest(".search-result");
    if (card) loadFullEntry(card.dataset.id);
});

// ░░░░░░░░░░░░░  KATEGORIE-ANSICHT  
async function loadCategory(categoryName) {
    const results = document.getElementById("results");
    results.innerHTML = "<p>Lade Daten...</p>";

    const url = `${SUPABASE_URL}/rest/v1/entries?category=eq.${encodeURIComponent(categoryName)}`;
    const response = await fetch(url, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });

    const data = await response.json();

    if (!data || data.length === 0) {
        results.innerHTML = "<p>Noch keine Einträge in dieser Kategorie.</p>";
        return;
    }

    results.innerHTML = data.map(entry => renderEntryCard(entry)).join("");
}

// ░░░░░░░░░░░░░  EINZELANSICHT  
async function loadFullEntry(id) {
    const results = document.getElementById("results");
    results.innerHTML = "<p>Lade Eintrag...</p>";

    const url = `${SUPABASE_URL}/rest/v1/entries?id=eq.${id}`;
    const response = await fetch(url, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });

    const data = await response.json();
    results.innerHTML = renderEntryCard(data[0], true);
}

// ░░░░░░░░░░░░░  EINTRAG RENDERN  
function renderEntryCard(entry, full = false) {
    const isInfo = (entry.score === 0 && entry.processing_score === 0);

    // ⭐ INFO-TYP → nur reiner Text
    if (isInfo) {
        return `
            <div class="entry-card">
                <h2>${entry.title}</h2>
                <p>${entry.summary || ""}</p>
            </div>
        `;
    }

    // ⭐ SCIENCE / STOFFE → volle Anzeige
    return `
        <div class="entry-card">
            <h2 class="entry-title">${entry.title}</h2>

            <div class="metrics-icons">
                ${entry.score > 0 ? `
                    <div class="metric-row">
                        ${getHealthIcons(entry.score)}
                        <span class="metric-text">Gesundheitsindex</span>
                    </div>` : ""}

                ${entry.processing_score > 0 ? `
                    <div class="metric-row">
                        ${renderProcessBar(entry.processing_score)}
                        <span class="metric-text">Industriescore</span>
                    </div>` : ""}
            </div>

            <p>${entry.summary || ""}</p>

            ${full ? renderDetails(entry) : ""}
        </div>
    `;
}

// ░░░░░░░░░░░░░  DETAILFELDER  
function renderDetails(e) {
    return `
        ${renderList("Positive Effekte", e.effects_positive)}
        ${renderList("Negative Effekte", e.effects_negative)}
        ${renderList("Risikogruppen", e.risk_groups)}
        ${renderList("Synergien", e.synergy)}
        ${renderList("Natürliche Quellen", e.natural_sources)}

        ${e.scientific_note ? `
            <h3>Wissenschaftlicher Hinweis</h3>
            <p>${e.scientific_note}</p>
        ` : ""}
    `;
}

function renderList(title, arr) {
    if (!arr || arr.length === 0) return "";
    return `
        <h3>${title}</h3>
        <ul>${arr.map(v => `<li>• ${v}</li>`).join("")}</ul>
    `;
}
