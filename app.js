console.log("MarketShield – EMERGENCY SAFE MODE (ALL CATEGORIES)");

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".category-grid");

  if (!grid) {
    document.body.innerHTML =
      "<h2 style='color:red;padding:20px'>❌ category-grid fehlt im HTML</h2>" +
      "<p style='padding:0 20px'>Bitte prüfe: <code>&lt;div class='category-grid'&gt;&lt;/div&gt;</code></p>";
    return;
  }

  // alle 30 Kategorien (dein fixes Set)
  const CATEGORIES = [
    "Ernährung","Gesundheit","Medizin","Genussmittel","Risiken","Pflege",
    "Kosmetik","Hygiene","Sonnenschutz","Haushalt","Wohnen","Luftqualität",
    "Wasserqualität","Textilien","Umwelt","Chemikalien","Strahlung","Tiere",
    "Technik","Arbeit","Baumarkt","Zielgruppen","Lifestyle","Finanzen",
    "Trends","Konsum","Freizeit","Mobilität","Sicherheit","Energie"
  ];

  // sichtbar erzwingen (falls CSS gerade alles versteckt)
  grid.style.display = "grid";
  grid.style.visibility = "visible";
  grid.style.opacity = "1";
  grid.style.gap = "10px";

  grid.innerHTML = "";

  CATEGORIES.forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = c;

    // minimal styling, unabhängig von style.css
    b.style.padding = "12px 14px";
    b.style.fontSize = "15px";
    b.style.borderRadius = "10px";
    b.style.border = "1px solid #ddd";
    b.style.cursor = "pointer";
    b.style.background = "#fff";

    // Klick testet nur, ob Event funktioniert (noch keine Einträge!)
    b.addEventListener("click", () => {
      console.log("Kategorie geklickt:", c);
      alert("Kategorie: " + c);
    });

    grid.appendChild(b);
  });

  console.log("✅ Alle Kategorien gerendert:", CATEGORIES.length);
});
