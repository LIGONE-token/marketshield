// 🎄 Weihnachtsmodus aktivieren (1.–26. Dezember)
document.addEventListener("DOMContentLoaded", function () {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const isChristmasTime = (month === 12 && day >= 1 && day <= 26);

    if (isChristmasTime) {
        document.body.classList.add("christmas");
    } else {
        document.body.classList.remove("christmas");
    }
});


// ░░░░░░░░░░░░░  KATEGORIEN LADEN  ░░░░░░░░░░░░░░░░░░░░

fetch("categories.json")
  .then(response => response.json())
  .then(data => {
    const grid = document.querySelector(".category-grid");

    data.categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.textContent = cat.title;
      btn.dataset.category = cat.id;

      btn.addEventListener("click", () => {
        loadCategory(cat.id);
      });

      grid.appendChild(btn);
    });
  })
  .catch(error => console.error("Fehler beim Laden der Kategorien:", error));


// ░░░░░░░░░░░░░  SUCHFUNKTION (Supabase)  ░░░░░░░░░░░░░░░░░░░░

document.getElementById("searchInput").addEventListener("input", async function () {
    const query = this.value.trim();
    const resultBox = document.getElementById("results");
    resultBox.innerHTML = "";

    if (query.length < 2) return;

    resultBox.innerHTML = "<p>Suche...</p>";

    const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
    const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

    const url = `${SUPABASE_URL}/rest/v1/entries?select=*&or=(title.ilike.*${query}*,summary.ilike.*${query}*,mechanism.ilike.*${query}*,scientific_note.ilike.*${query}*)`;



    const response = await fetch(url, {
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
        }
    });

    const data = await response.json();

    if (!data || data.length === 0) {
        resultBox.innerHTML = "<p>Keine Treffer.</p>";
        return;
    }

    const ranked = data.map(item => {
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

       resultBox.innerHTML = ranked.map(entry => `
        <div class="search-item search-result" data-id="${entry.id}">
            <div class="search-title">${entry.title}</div>
            <div class="search-short">
                ${entry.summary ? entry.summary.substring(0, 80) + (entry.summary.length > 80 ? "…" : "") : ""}
            </div>
            <div class="search-score score-${entry.score || 0}"></div>
        </div>
    `).join("");
});



// ░░░░░░░░░░░░░  KLICK AUF SUCHERGEBNIS → VOLLANSICHT  ░░░░░░░░░░░░░░░░░░░░

document.addEventListener("click", function (e) {
    const card = e.target.closest(".search-result");
    if (!card) return;

    const id = card.dataset.id;
    loadFullEntry(id);
});


// ░░░░░░░░░░░░░  KATEGORIE → VOLLANSICHT ANZEIGEN  ░░░░░░░░░░░░░░░░░░░░

async function loadCategory(categoryId) {
    const results = document.getElementById("results");
    results.innerHTML = "<p>Lade Daten...</p>";

    const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
    const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/entries?category=eq.${categoryId}`,
        {
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`
            }
        }
    );

    const data = await response.json();

    if (!data || data.length === 0) {
        results.innerHTML = "<p>Noch keine Einträge in dieser Kategorie.</p>";
        return;
    }

    results.innerHTML = "";

    data.forEach(entry => {
        const box = document.createElement("div");
        box.classList.add("entry-card", "full");

        box.innerHTML = `
            <h2 class="entry-title">${entry.title}</h2>

            <div class="score-section">
                <strong>Score:</strong>
                <span class="score-value score-${entry.score}">${entry.score}/10</span>
            </div>

            <div class="processing-section">
                <strong>Industrielle Verarbeitung:</strong>
                <span>${entry.processing_score}/10</span>
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
        `;

        results.appendChild(box);
    });
}


// ░░░░░░░░░░░░░  VOLLANSICHT FÜR EINZELNEN EINTRAG  ░░░░░░░░░░░░░░░░░░░░

async function loadFullEntry(id) {
    const results = document.getElementById("results");
    results.innerHTML = "<p>Lade Eintrag...</p>";

    const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
    const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

    const response = await fetch(`${SUPABASE_URL}/rest/v1/entries?id=eq.${id}`, {
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
        }
    });

    const data = await response.json();
    const entry = data[0];

    results.innerHTML = `
        <div class="entry-card full">
            <h2 class="entry-title">${entry.title}</h2>

            <div class="score-section">
                <strong>Score:</strong>
                <span class="score-value score-${entry.score}">
    ${entry.score}/10
    <span class="score-dot score-${entry.score}"></span>
</span>

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
