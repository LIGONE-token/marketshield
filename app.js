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

// 🔹 Die Dateien, die deine Einträge enthalten
const dataFiles = ["data/additives_test.json"];

// ░░░░░░░░░░░░░  KATEGORIEN LADEN  ░░░░░░░░░░░░░░░░░░░░

fetch("data/categories.json")
  .then(response => response.json())
  .then(data => {
    const grid = document.querySelector(".category-grid");

    data.categories.forEach(cat => {
      const btn = document.createElement("button");

      // Worttrennung für "Verbraucherschutz"
      btn.innerHTML = cat.title.replace("Verbraucherschutz", "Verbraucher-<br>schutz");
      btn.dataset.category = cat.id;

      btn.addEventListener("click", () => {
        loadCategory(cat.id);
      });

      grid.appendChild(btn);
    });
  })
  .catch(error => console.error("Fehler beim Laden der Kategorien:", error));


// ░░░░░░░░░░░░░  SUCHFELD  ░░░░░░░░░░░░░░░░░░░░

document.getElementById("searchInput").addEventListener("input", async function () {
    const query = this.value.trim().toLowerCase();
    const resultBox = document.getElementById("results");

    if (query.length < 2) {
        resultBox.innerHTML = "";
        return;
    }

    // Alle Dateien im data-Ordner automatisch laden
    const files = [
        "zusatzstoffe.json", "zucker.json", "verpackung.json", "verarbeitung.json", "naehrstoffe.json",
        "konservierer.json", "dufte.json", "polymere.json", "uvfilter.json", "tenside.json",
        "strahlung.json", "raumluft.json", "reiniger.json", "wasser.json", "textilien.json",
        "schlaf.json", "medikamente.json", "stimulanzien.json", "lebensstil.json", "immunsystem.json",
        "abos.json", "versicherungen.json", "kredite.json", "marketing.json", "digitales.json",
        "kinder.json", "senioren.json", "tiere.json", "umwelt.json", "trends.json",

        // Optional: Datei für Einträge ohne Kategorie
        "misc.json"
    ];

    let allItems = [];

    for (let file of files) {
        try {
            const res = await fetch(`data/${file}`);
            if (res.ok) {
                const json = await res.json();
                allItems = allItems.concat(json.items || []);
            }
        } catch (e) {}
    }

    // Ranking & Filter
    const results = allItems
        .map(item => {
            const title = item.title?.toLowerCase() || "";
            const desc = item.description?.toLowerCase() || "";

            let relevance = 0;

            // Match-Treffer erhöhen Score
            if (title.includes(query)) relevance += 5;
            if (desc.includes(query)) relevance += 2;

            // Bonus für hohe Empfehlung
            relevance += (item.score || 0) * 0.1;

            // Bonus für hohe Gefährlichkeit (wichtig!)
            if (item.danger_level === "high") relevance += 5;
            if (item.danger_level === "extreme") relevance += 7;

            return { item, relevance };
        })
        .filter(r => r.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance)
        .map(r => r.item);

    // Ausgabe
    resultBox.innerHTML = results
        .map(r => `<div class="search-item">${r.title}</div>`)
        .join("");
});


// ░░░░░░░░░░░░░  EINTRÄGE LADEN  ░░░░░░░░░░░░░░░░░░░░

function loadCategory(categoryId) {

    // 1. Alle Dateien laden
    Promise.all(
        dataFiles.map(file => fetch(file).then(res => res.json()))
    )
    .then(listOfEntries => {
        // JSON Arrays zusammenführen
        const allEntries = listOfEntries.flat();

        const results = document.getElementById("results");
        results.innerHTML = "";

        // Nur Einträge der ausgewählten Kategorie
        const filtered = allEntries.filter(e => e.category === categoryId);

        if (filtered.length === 0) {
            results.innerHTML = "<p>Noch keine Einträge in dieser Kategorie.</p>";
            return;
        }

        // Alle passenden Einträge anzeigen
        filtered.forEach(entry => {
            const box = document.createElement("div");
            box.classList.add("entry-box");

            box.innerHTML = `
                <h3>${entry.name}</h3>
                <p>${entry.description}</p>
            `;

            results.appendChild(box);
        });
    })
    .catch(err => console.error("Fehler beim Laden der Daten:", err));
}

