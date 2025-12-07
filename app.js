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

document.getElementById("searchInput").addEventListener("input", function () {
    const q = this.value.trim().toLowerCase();
    const resultBox = document.getElementById("results");

    if (q.length < 2) {
        resultBox.innerHTML = "";
        return;
    }

    // Alle Dateien laden (wie bei loadCategory)
    Promise.all(
        dataFiles.map(file => fetch(file).then(res => res.json()))
    )
    .then(listOfEntries => {
        const allEntries = listOfEntries.flat();

        // Suchfilter
        const filtered = allEntries.filter(entry =>
            entry.name.toLowerCase().includes(q) ||
            entry.description.toLowerCase().includes(q)
        );

        resultBox.innerHTML = "";

        if (filtered.length === 0) {
            resultBox.innerHTML = "<p>Keine Ergebnisse gefunden.</p>";
            return;
        }

        filtered.forEach(entry => {
            const box = document.createElement("div");
            box.classList.add("entry-box");

            box.innerHTML = `
                <h3>${entry.name}</h3>
                <p>${entry.description}</p>
            `;

            resultBox.appendChild(box);
        });
    })
    .catch(err => console.error("Suchfehler:", err));
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

