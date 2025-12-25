/* =====================================================
   MARKETSHIELD – FINAL OVERRIDES (LETZTER BLOCK)
   Zweck: App MUSS funktionieren, egal was davor steht.
===================================================== */

/* Back-Button: niemals am linken Rand kleben */
#backHome{
  display:none;
  position:relative !important;
  left:auto !important;
  right:auto !important;
  margin:16px auto !important;
  max-width:900px !important;
  width:calc(100% - 32px) !important;
  padding:8px 12px !important;
  cursor:pointer !important;
  box-sizing:border-box !important;
}

/* Karten: stabil & lesbar */
.entry-card{ padding:14px !important; border-radius:10px !important; background:#fff !important; }
.ms-title{ font-size:20px !important; font-weight:800 !important; margin:0 0 6px 0 !important; }
.ms-snippet{ margin-top:6px !important; }

/* ================= SCORES ================= */
function renderHealth(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";
  return "⚠️❗⚠️";
}

function renderIndustry(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";

  // Industrie 0–10 → 80px Balken
  const w = Math.round((n / 10) * 80);

  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;">
      <div style="width:${w}px;height:8px;background:#2e7d32;"></div>
    </div>
  `;
}

/* ================= SCORE BLOCK (FINAL / EXAKT) ================= */
/* Ziel:
   - feste linke Score-Spalte
   - Text startet IMMER exakt gleich
   - Score & Text nah beieinander
   - keine Umbrüche, kein Springen
*/
function renderScoreBlock(score, processing, size = 13) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);

  if (!h && !i) return "";

  // 80px Balken + 10px Reserve = feste Textkante
  const colW = 90;
  const colGap = 8;
  const rowGap = 6;
  const labelStyle = `font-size:${size}px;opacity:0.85;line-height:1.2;`;

  return `
    <div style="margin:12px 0;">
      ${h ? `
        <div style="
          display:grid;
          grid-template-columns:${colW}px 1fr;
          column-gap:${colGap}px;
          align-items:center;
          margin-bottom:${i ? rowGap : 0}px;">
          <div style="white-space:nowrap;">${h}</div>
          <div style="${labelStyle}">Gesundheitsscore</div>
        </div>
      ` : ""}

      ${i ? `
        <div style="
          display:grid;
          grid-template-columns:${colW}px 1fr;
          column-gap:${colGap}px;
          align-items:center;">
          <div style="white-space:nowrap;">${i}</div>
          <div style="${labelStyle}">Industrie-Verarbeitungsgrad</div>
        </div>
      ` : ""}
    </div>
  `;
}


/* Tooltip (Warnung) */
.ms-tooltip{ position:relative !important; cursor:help !important; }
.ms-tooltip::after{
  content:attr(data-tip);
  position:absolute;
  left:0;
  bottom:125%;
  background:#222;
  color:#fff;
  padding:6px 8px;
  font-size:12px;
  line-height:1.35;
  border-radius:4px;
  opacity:0;
  pointer-events:none;
  z-index:9999;
  white-space:normal;
  min-width:220px;
}
.ms-tooltip:hover::after,
.ms-tooltip:focus::after{ opacity:1; }

/* Text & Tabellen: Absätze sichtbar, Tabellen lesbar */
.ms-text p{ margin:0 0 12px 0 !important; line-height:1.6 !important; }
.ms-table-wrap{ overflow-x:auto !important; margin:12px 0 !important; }
.ms-table-wrap table{ border-collapse:collapse !important; width:100% !important; }
.ms-table-wrap th,.ms-table-wrap td{ border:1px solid #ddd !important; padding:8px !important; text-align:left !important; }
.ms-table-wrap th{ background:#f5f5f5 !important; font-weight:600 !important; }

/* Detail & Actions: Social + Copy + Print immer sichtbar (unten) */
.ms-detail{ max-width:900px !important; margin:0 auto !important; padding:0 16px !important; }
.ms-h2{ margin:10px 0 6px 0 !important; }
.ms-h3{ margin:16px 0 8px 0 !important; }

.ms-actions{
  display:flex !important;
  flex-wrap:wrap !important;
  gap:10px !important;
  align-items:center !important;
  margin:16px 0 8px 0 !important;
}
.ms-btn{
  display:inline-block !important;
  padding:7px 10px !important;
  font-size:13px !important;
  cursor:pointer !important;
}
.ms-social{
  display:flex !important;
  gap:8px !important;
  align-items:center !important;
}
.ms-icon-btn{
  display:inline-flex !important;
  align-items:center !important;
  justify-content:center !important;
  width:36px !important;
  height:36px !important;
  border-radius:8px !important;
  text-decoration:none !important;
  font-weight:700 !important;
  background:#f2f2f2 !important;
  color:#111 !important;
}

/* Schutz gegen „alles verstecken“-Regeln */
.ms-actions, .ms-social, .ms-btn, .ms-icon-btn{
  visibility:visible !important;
  opacity:1 !important;
  pointer-events:auto !important;
}
