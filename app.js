document.getElementById("searchInput").addEventListener("input", function () {
    const q = this.value.trim().toLowerCase();
    const resultBox = document.getElementById("results");

    if (q.length < 2) {
        resultBox.innerHTML = "";
        return;
    }

    // Platzhalter-Ergebnis bis die Datenstruktur eingefügt ist
    resultBox.innerHTML = `
        <div class="placeholder">
            Suche nach: <strong>${q}</strong><br>
            Die vollständige Datenbank wird geladen ...
        </div>
    `;
});
