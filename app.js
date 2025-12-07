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
const dataFiles = ["data/additives_test.json"];


// 🔹 Kategorien aus categories.json laden
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



// 🔹 Suchfunktion (wird später an entries.json angebunden)
document.getElementById("searchInput").addEventListener("input", function () {
    const q = this.value.trim().toLowerCase();
    const resultBox = document.getElementById("results");

    if (q.length < 2) {
        resultBox.innerHTML = "";
        return;
    }

    resultBox.innerHTML = `
        <div class="placeholder">
            Suche nach: <strong>${q}</strong><br>
            Die vollständige Datenbank wird geladen ...
        </div>
    `;
});



// 🔹 EINZIGE gültige loadCategory-Funktion
//    → Sie lädt immer entries.json
//    → Für später beliebig viele Einträge geeignet (auch 100.000+)
function loadCategory(categoryId) {
  fetch("data/entries.json")
    .then(response => response.json())
    .then(data => {
      const results = document.getElementById("results");
      results.innerHTML = "";

      // Einträge filtern nach Kategorie
      const filtered = data.entries.filter(entry => entry.category === categoryId);

      if (filtered.length === 0) {
        results.innerHTML = "<p>Noch keine Einträge in dieser Kategorie.</p>";
        return;
      }

      // Einträge anzeigen
      filtered.forEach(entry => {
        const box = document.createElement("div");
        box.classList.add("entry-box");

        box.innerHTML = `
          <h3>${entry.title}</h3>
          <p>${entry.text}</p>
        `;

        results.appendChild(box);
      });
    })
    .catch(err => console.error("Fehler beim Laden der Einträge:", err));
}
// 🔧 Hilfsfunktion: Massendaten-Datei erzeugen
window.createMassFile = function () {
  const count = 5000;          // Anzahl Datensätze pro Datei
  const fileIndex = 1;         // Dateinummer (für additives_1, _2, ...)

  const entries = [];
  for (let i = 1; i <= count; i++) {
    entries.push({
      id: "auto_" + ((fileIndex - 1) * count + i),
      category: "zusatzstoffe",
      sub: "auto",
      topic: "Automatisch erzeugter Zusatzstoff " + i,
      text: "Automatisch generierter Platzhalter für Massendaten-Tests."
    });
  }

  const json = JSON.stringify({ entries: entries }, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `additives_${fileIndex}.json`;
  a.click();

  URL.revokeObjectURL(url);
};
