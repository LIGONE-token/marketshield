// 🎄 Weihnachtsmodus aktivieren (1.–26. Dezember)
document.addEventListener("DOMContentLoaded", function () {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const isChristmasTime = (month === 12 && day >= 1 && day <= 26);

    if (isChristmasTime) document.body.classList.add("christmas");
});

// ░░░░░░░░░░░░░  KONFIGURATION  
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

// ░░░░░░░░░░░░░  KATEGORIEN LADEN  
fetch("categories.json")
    .then(response => response.json())
    .then(data => {
        const grid = document.querySelector(".category-grid");
        grid.innerHTML = "";

        data.categories.forEach(cat => {
            const btn = document.createElement("button");
            btn.textContent = cat.title;

            // ⚠️ WICHTIG: Kategorie-Name statt ID übergeben
            btn.dataset.category = cat.title;
            btn.addEventListener("click", () => loadCategory(cat.title));

            grid.appendChild(btn);
        });
    })
    .catch(error => console.error("Fehler beim Laden der Kategorien:", error));

// ░░░░░░░░░░░░░  GESUNDHEITSSCORE  
function getHealthIcons(score) {
    const s = score || 0;

    if (s >= 80) return `<div class="health-score-box health-3">💚💚💚</div>`;
    if (s >= 60) return `<div class="health-score-box health-2">💚💚</div>`;
    if (s >= 40) return `<div class="health-score-box health-1">💚</div>`;
    if (s >= 20) return `<div class="health-score-box health-mid">🧡🧡</div>`;
    return `<div class="health-score-box health-bad">⚠️❗⚠️</div>`;
}

// ░░░░░░░░░░░░░  INDUSTRIE-SCORE  
function renderProcessBar(score) {
    const s = Math.max(1, Math.min(10, score || 1));

    let color = "#2ecc71";
    if (s >= 4 && s <= 6) color = "#f1c40f";
    if (s >= 7) color = "#e74c3c";

    const width = (s * 10) + "%";

    return `
        <div class="process-bar-bg">
            <div class="process-bar-fill" style="width:${width}; background:${color};"></div>
        </div>
        <div class="process-bar-label">${s}/10</div>
    `;
}

// ░░░░░░░░░░░░░  SUCHFUNKTION  
document.getElementById("searchInput").addEventListener("input", async function () {
    const query = this.value.trim();
    const results = document.getElementById("results");
    results.innerHTML = "";

    if (query.length < 2) return;

    results.innerHTML = "<p>Suche...</p>";

    const url = `${SUPABASE_URL}/rest/v1/entries?select=*&or=(
        title.ilike.*${query}*,
        summary.ilike.*${query}*,
        mechanism.ilike.*${query}*,
        scientific_note.ilike.*${query}*
    )`;

    const response = await fetch(url, {
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
        }
    });

    const data = await response.json();

    if (!data || data.length === 0) {
        results.innerHTML = "<p>Keine Treffer.</p>";
        return;
    }

    const ranked = data
        .map(item => {
            let score = 0;
            const q = query.toLowerCase();
            if (item.title?.toLowerCase().includes(q)) score += 8;
            if (item.summary?.toLowerCase().includes(q)) score += 4;
            if (item.mechanism?.toLowerCase().includes(q)) score += 2;
            score += (item.score || 0) * 0.2;
            return { item, score };
        })
        .sort((a, b) => b.score - a.score)
        .map(r => r.item);

    results.innerHTML =
        `<div class="search-hint">Für Details bitte antippen.</div>` +
        ranked.map(entry => `
            <div class="search-item search-result" data-id="${entry.id}">
                <div class="search-title">${entry.title}</div>

                <div class="search-short">
                    ${entry.summary ? entry.summary.substring(0, 120) + (entry.summary.length > 120 ? "…" : "") : ""}
                </div>

                <div class="search-metrics">
                    <div class="health-mini">${getHealthIcons(entry.score)}</div>

                    <div class="process-bar process-bar-mini">
                        ${renderProcessBar(entry.processing_score)}
                    </div>
                </div>
            </div>
        `).join("");
});

// ░░░░░░░░░░░░░  CLICK → EINZELANSICHT  
document.addEventListener("click", function (e) {
    const card = e.target.closest(".search-result");
    if (!card) return;
    loadFullEntry(card.dataset.id);
});

// ░░░░░░░░░░░░░  KATEGORIE-ANSICHT  
async function loadCategory(categoryName) {
    const results = document.getElementById("results");
    results.innerHTML = "<p>Lade Daten...</p>";

    // ⭐ WICHTIG: Filter jetzt nach Kategorie-Text, NICHT ID
    const url = `${SUPABASE_URL}/rest/v1/entries?category=eq.${encodeURIComponent(categoryName)}`;

    const response = await fetch(url, {
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
        }
    });

    const data = await response.json();
    if (!data || data.length === 0) {
        results.innerHTML = "<p>Noch keine Einträge in dieser Kategorie.</p>";
        return;
    }

    results.innerHTML = "";

    data.forEach(entry => {
        results.innerHTML += `
            <div class="entry-card">
                <h2 class="entry-title">${entry.title}</h2>

                <div class="metrics-icons">
                    <div class="metric-row">
                        ${getHealthIcons(entry.score)}
                        <span class="metric-text">Gesundheitsindex – Wirkung auf den Körper</span>
                    </div>

                    <div class="metric-row">
                        <div class="process-bar">
                            ${renderProcessBar(entry.processing_score)}
                        </div>
                        <span class="metric-text">Industriescore – Grad der Verarbeitung</span>
                    </div>
                </div>

                <h3>Kurzinfo</h3>
                <p>${entry.summary || "Keine Info"}</p>

                <h3>Wirkmechanismus</h3>
                <p>${entry.mechanism || "Keine Info"}</p>

                <h3>Positive Effekte</h3>
                <ul>${(entry.effects_positive || []).map(e => `<li>✓ ${e}</li>`).join("")}</ul>

                <h3>Negative Effekte</h3>
                <ul>${(entry.effects_negative || []).map(e => `<li>⚠ ${e}</li>`).join("")}</ul>

                <h3>Risikogruppen</h3>
                <ul>${(entry.risk_groups || []).map(e => `<li>• ${e}</li>`).join("")}</ul>

                <h3>Synergien</h3>
                <ul>${(entry.synergy || []).map(e => `<li>• ${e}</li>`).join("")}</ul>

                <h3>Natürliche Quellen</h3>
                <ul>${(entry.natural_sources || []).map(e => `<li>• ${e}</li>`).join("")}</ul>

                <h3>Wissenschaftlicher Hinweis</h3>
                <p>${entry.scientific_note || "Keine wissenschaftliche Notiz verfügbar."}</p>
            </div>
        `;
    });
}

// ░░░░░░░░░░░░░  EINZELANSICHT  
async function loadFullEntry(id) {
    const results = document.getElementById("results");
    results.innerHTML = "<p>Lade Eintrag...</p>";

    const url = `${SUPABASE_URL}/rest/v1/entries?id=eq.${id}`;

    const response = await fetch(url, {
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
        }
    });

    const data = await response.json();
    const entry = data[0];

    results.innerHTML = `
        <div class="entry-card">
            <h2 class="entry-title">${entry.title}</h2>

            <div class="metrics-icons">
                <div class="metric-row">
                    ${getHealthIcons(entry.score)}
                    <span class="metric-text">Gesundheitsindex – Wirkung auf den Körper</span>
                </div>

                <div class="metric-row">
                    <div class="process-bar">
                        ${renderProcessBar(entry.processing_score)}
                    </div>
                    <span class="metric-text">Industriescore – Grad der Verarbeitung</span>
                </div>
            </div>

            <p>${entry.summary || ""}</p>

            <h3>Wirkmechanismus</h3>
            <p>${entry.mechanism || "Keine Angaben"}</p>

            <h3>Positive Effekte</h3>
            <ul>${(entry.effects_positive || []).map(e => `<li>✓ ${e}</li>`).join("")}</ul>

            <h3>Negative Effekte</h3>
            <ul>${(entry.effects_negative || []).map(e => `<li>⚠ ${e}</li>`).join("")}</ul>

            <h3>Synergien</h3>
            <ul>${(entry.synergy || []).map(e => `<li>• ${e}</li>`).join("")}</ul>
        </div>
    `;
}
