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


async function loadCategory(catId) {
    const resultBox = document.getElementById("results");

    try {
        const response = await fetch(`data/${catId}.json`);
        const data = await response.json();

        // Daten aus der JSON holen (z. B. haushalt → haushalt-Daten)
        const categoryData = data[catId];

        // Ausgabe
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


    
    resultBox.innerHTML = `
        <div class="placeholder">
            Kategorie <strong>${catName}</strong> wird geladen ...
        </div>
    `;

    try {
        const response = await fetch(`data/${file}`);
        const data = await response.json();

        // Noch keine Inhalte vorhanden
        if (data.length === 0) {
            resultBox.innerHTML = `
                <div class="placeholder">
                    Noch keine Einträge in dieser Kategorie vorhanden.<br>
                    Die Datenbank wird bald erweitert.
                </div>
            `;
            return;
        }

        // Inhalte ausgeben
        resultBox.innerHTML = data.map(item => `
            <div class="entry-box">
                <h3>${item.title}</h3>
                <p>${item.text}</p>
            </div>
        `).join("");

    } catch (e) {
        resultBox.innerHTML = `
            <div class="placeholder">
                Fehler beim Laden der Kategorie. (Kann an GitHub liegen)
            </div>
        `;
    }
}


// 🔹 Kategorie-Klicks aktivieren
document.querySelectorAll(".cat-item").forEach(item => {
    item.addEventListener("click", () => {
        const category = item.textContent.trim();
        loadCategory(category);
    });
});

