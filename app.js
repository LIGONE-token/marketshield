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


// 🔹 Dynamische Kategorie-Dateien
const categoryFiles = {
    "Kosmetik": "kosmetik.json",
    "Lebensmittel": "lebensmittel.json",
    "Haushalt": "haushalt.json",
    "Schadstoffe": "schadstoffe.json",
    "Naturmittel": "naturmittel.json",
    "Reisen": "reisen.json",
    "Auto & Ersatzteile": "auto.json",
    "Finanzen": "finanzen.json",
    "Technik": "technik.json",
    "Buchtipps": "buchtipps.json",
    "Sehenswürdigkeiten": "sehenswuerdigkeiten.json",
    "Berufstipps": "berufstipps.json",
    "Löhne & Gehälter": "loehne.json",
    "Senioren & Alltagshilfe": "senioren.json"
};


// 🔹 Kategorie laden
async function loadCategory(catName) {
    const file = categoryFiles[catName];
    const resultBox = document.getElementById("results");

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

