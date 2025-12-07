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

// Holt die Buttons direkt aus categories.json im Hauptordner
fetch("categories.json")
  .then(response => response.json())
  .then(data => {
    const grid = document.querySelector(".category-grid");

    data.categories.forEach(cat => {
      const btn = document.createElement("button");

      // Einfacher, fehlerfreier Button-Text
      btn.textContent = cat.title;
      btn.dataset.category = cat.id;

      btn.addEventListener("click", () => {
        loadCategory(cat.id);
      });

      grid.appendChild(btn);
    });
  })
  .catch(error => console.error("Fehler beim Laden der Kategorien:", error));


// ░░░░░░░░░░░░░  SUCHFELD (temporär deaktiviert, bis Supabase aktiv ist) ░░░░░░░░░░░░░░░░░░░░

// Leerer Loader verhindert Fehler aus fehlenden Dateien
document.getElementById("searchInput").addEventListener("input", async function () {
    const query = this.value.trim();

    const resultBox = document.getElementById("results");
    resultBox.innerHTML = "";

    if (query.length < 2) {
        return;
    }

    resultBox.innerHTML = "<p>Suche...</p>";

    const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
    const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

    // 🔍 Supabase Volltext-ähnliche Suche (ILIKE)
    const url =
        `${SUPABASE_URL}/rest/v1/entries?` +
        `title=ilike.%25${query}%25` +
        `&or=(summary.ilike.%25${query}%25,mechanism.ilike.%25${query}%25)` +
        `&select=*`;

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

    // ⭐ Relevanz-Bewertung
    const ranked = data.map(item => {
        let score = 0;
        const q = query.toLowerCase();

        if (item.title?.toLowerCase().includes(q)) score += 8;
        if (item.summary?.toLowerCase().includes(q)) score += 4;
        if (item.mechanism?.toLowerCase().includes(q)) score += 2;

        score += (item.score || 0) * 0.2; // Bonus für Empfehlung
        return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(r => r.item);

    // ⭐ Ausgabe
    resultBox.innerHTML = ranked.map(entry => `
        <div class="entry-card">
            <h2>${entry.title}</h2>
            <p>${entry.summary || ""}</p>
            <p><strong>Score:</strong> ${entry.score}/10</p>
        </div>
    `).join("");
});



// ░░░░░░░░░░░░░  EINTRÄGE LADEN (noch ohne Supabase) ░░░░░░░░░░░░░░░░░░░░

async function loadCategory(categoryId) {
    const results = document.getElementById("results");
    results.innerHTML = "<p>Lade Daten...</p>";

    const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
    const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

    // Supabase REST API Anfrage
    const response = await fetch(`${SUPABASE_URL}/rest/v1/entries?category=eq.${categoryId}`, {
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
        const box = document.createElement("div");
        box.classList.add("entry-card");

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
            <ul>
                ${(entry.effects_positive || []).map(e => `<li>✓ ${e}</li>`).join("")}
            </ul>

            <h3>Negative Effekte</h3>
            <ul>
                ${(entry.effects_negative || []).map(e => `<li>⚠ ${e}</li>`).join("")}
            </ul>

            <h3>Risikogruppen</h3>
            <ul>
                ${(entry.risk_groups || []).map(e => `<li>• ${e}</li>`).join("")}
            </ul>

            <h3>Synergien</h3>
            <ul>
                ${(entry.synergy || []).map(e => `<li>• ${e}</li>`).join("")}
            </ul>

            <h3>Natürliche Quellen</h3>
            <ul>
                ${(entry.natural_sources || []).map(e => `<li>• ${e}</li>`).join("")}
            </ul>

            <h3>Wissenschaftlicher Hinweis</h3>
            <p>${entry.scientific_note || "Keine wissenschaftliche Notiz verfügbar."}</p>
        `;

        results.appendChild(box);
    });
}
