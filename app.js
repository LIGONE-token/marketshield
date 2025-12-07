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
document.getElementById("searchInput").addEventListener("input", function () {
    const resultBox = document.getElementById("results");

    const q = this.value.trim();

    if (q.length < 2) {
        resultBox.innerHTML = "";
        return;
    }

    // Noch keine lokalen Dateien → Meldung anzeigen
    resultBox.innerHTML = `<p>Suche wird aktiviert, sobald Supabase-Daten geladen werden.</p>`;
});


// ░░░░░░░░░░░░░  EINTRÄGE LADEN (noch ohne Supabase) ░░░░░░░░░░░░░░░░░░░░

function loadCategory(categoryId) {
    const results = document.getElementById("results");
    results.innerHTML = "";

    // Da wir aktuell ohne JSON-Dateien arbeiten:
    results.innerHTML = `<p>Noch keine Einträge in dieser Kategorie.</p>`;
}

