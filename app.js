/* === MarketShield – JS BOOTSTRAP TEST === */

console.log("JS DATEI GELADEN");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM READY");

  // TEST: Suche klickbar?
  const search = document.getElementById("searchInput");
  if (search) {
    search.addEventListener("click", () => {
      alert("SUCH-FELD KLICKBAR");
    });
  }

  // TEST: Kategorien sichtbar & klickbar?
  const catGrid = document.querySelector(".category-grid");
  if (catGrid) {
    catGrid.innerHTML = `
      <button class="test-cat">Kategorie A</button>
      <button class="test-cat">Kategorie B</button>
    `;
  }

  document.addEventListener("click", e => {
    if (e.target.classList.contains("test-cat")) {
      alert("KATEGORIE KLICKBAR");
    }
  });
});
