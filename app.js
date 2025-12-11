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


// ░░░░░░░░░░░░░  HEALTH SCORE (Icon-System)
function getHealthIcons(score) {
    if (!score || score === 0) return "";

    if (score >= 80) return `<div class="health-score-box health-3">💚💚💚</div>`;
    if (score >= 60) return `<div class="health-score-box health-2">💚💚</div>`;
    if (score >= 40) return `<div class="health-score-box health-1">💚</div>`;
    if (score >= 20) return `<div class="health-score-box health-mid">🧡🧡</div>`;
    return `<div class="health-score-box health-bad">⚠️❗⚠️</div>`;
}


// ░░░░░░░░░░░░░  INDUSTRIE SCORE (Balken)
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


// ░░░░░░░░░░░░░  SHARE-BUTTONS  
function renderShareButtons(entry) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Interessanter Beitrag auf MarketShield:\n${entry.title}`);

    return `
        <div class="share-box">
            <h3>Teilen</h3>

            <div class="share-buttons">
                <button class="share-btn" onclick="window.open('https://wa.me/?text=${text}%20${url}', '_blank')">📱 WhatsApp</button>
                <button class="share-btn" onclick="window.open('https://t.me/share/url?url=${url}&text=${text}', '_blank')">✈️ Telegram</button>
                <button class="share-btn" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${url}', '_blank')">📘 Facebook</button>
                <button class="share-btn" onclick="window.open('https://twitter.com/intent/tweet?text=${text}&url=${url}', '_blank')">🐦 X</button>
                <button class="share-btn" onclick="navigator.clipboard.writeText(window.location.href)">🔗 Link kopieren</button>
                <button class="share-btn" onclick="window.print()">🖨 Drucken / PDF</button>
            </div>
        </div>
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

    const query = `entries?select=*&or=(title.ilike.*${q}*,summary.ilike.*${q}*,mechanism.ilike.*${q}*)`;
    const data = await supabase.select(query);

    if (!data || data.length === 0) {
        results.innerHTML = "<p>Keine Treffer.</p>";
        return;
    }

    const ranked = data.sort((a, b) => (b.score || 0) - (a.score || 0));

    results.innerHTML = `
        <div class="search-hint">Für Details bitte antippen.</div>
        ${ranked.map(entry => `
            <div class="search-result" data-id="${entry.id}">
                <div class="search-title">${entry.title}</div>

                <div class="search-short">
                    ${entry.summary?.substring(0, 120) || ""}…
                </div>

                <div class="search-metrics">
                    ${entry.score > 0 ? `<div class="health-mini">${getHealthIcons(entry.score)}</div>` : ""}
                    ${entry.processing_score > 0 ? `<div class="process-bar-mini">${renderProcessBar(entry.processing_score)}</div>` : ""}
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
        results.innerHTML = "<p>Noch keine Einträge in dieser Kategorie.</p>";
        return;
    }

    results.innerHTML = data.map(entry => `
        <div class="entry-card" data-id="${entry.id}">
            <h3 class="entry-title-small">${entry.title}</h3>

            <p class="entry-short">
                ${entry.summary ? entry.summary.substring(0, 120) + "…" : ""}
            </p>

            <div class="mini-metrics">
                ${entry.score > 0 ? `<span class="mini-health">${getHealthIcons(entry.score)}</span>` : ""}
                ${entry.processing_score > 0 ? `<span class="mini-process">${renderProcessBar(entry.processing_score)}</span>` : ""}
            </div>
        </div>
    `).join("");
}


// ░░░░░░░░░░░░░  EINZELANSICHT LADEN  
async function loadFullEntry(id) {
    const results = document.getElementById("results");
    results.innerHTML = "<p>Lade Eintrag...</p>";

    const query = `entries?select=*&id=eq.${id}`;
    const data = await supabase.select(query);

    if (!data || !data[0]) {
        results.innerHTML = "<p>Fehler beim Laden.</p>";
        return;
    }

    results.innerHTML = renderEntryCard(data[0], true);
}


// ░░░░░░░░░░░░░  EINTRAG DARSTELLEN  
function renderEntryCard(entry, full = false) {
    const isInfo = (entry.score === 0 && entry.processing_score === 0);

    if (isInfo) {
        return `
            <div class="entry-card">
                <h2>${entry.title}</h2>
                <p>${entry.summary || ""}</p>
                ${renderShareButtons(entry)}
            </div>
        `;
    }

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
            ${full ? renderShareButtons(entry) : ""}
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


// ░░░░░░░░░░░░░  GLOBALER CLICK-LISTENER (SUCHERGEBNISSE + KATEGORIE)
document.addEventListener("click", function (e) {
    const card = e.target.closest(".entry-card, .search-result");
    if (card && card.dataset.id) {
        loadFullEntry(card.dataset.id);
    }
});
