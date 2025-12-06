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


// 🔹 Kategorien aus categories.json laden
fetch("data/categories.json")
  .then(response => response.json())
  .then(data => {
    const grid = document.querySelector(".category-grid");

    data.categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.innerHTML = cat.title.replace("Verbraucherschutz", "Verbraucher-<br>schutz");
      btn.dataset.category = cat.id;

      btn.addEventListener("click", () => {
        loadCategory(cat.id);
      });

      grid.appendChild(btn);
    });
  })
  .catch(error => console.error("Fehler beim Laden der Kategorien:", error));



// 🔹 Suchfunktion
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



// 🔹 Kategorie-Datei laden und anzeigen
async function loadCategory(catId) {
    const resultBox = document.getElementById("results");

    try {
        const response = await fetch(`data/${catId}.json`);
        const data = await response.json();

        const categoryData = data[catId];

        resultBox.innerHTML = `
            <h2>${categoryData.description}</h2>
            <ul>
              ${(categoryData.items || []).map(item => `<li>${item}</li>`).join("")}
            </ul>
        `;
    } catch (error) {
        resultBox.innerHTML = "<p>Fehler beim Laden der Kategorie.</p>";
        console.error("Ladefehler:", error);
    }
}
function loadCategory(categoryId) {
  fetch("data/entries.json")
    .then(response => response.json())
    .then(data => {
      const results = document.getElementById("results");
      results.innerHTML = "";

      const filtered = data.entries.filter(entry => entry.category === categoryId);

      if (filtered.length === 0) {
        results.innerHTML = "<p>Keine Einträge vorhanden.</p>";
        return;
      }

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
