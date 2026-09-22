/* =========================================================
   MCHANGO — pdf.js (API VERSION)
   Builds a PDF report from live Store data (now async since
   Store talks to the backend API).
   ========================================================= */

async function generatePDFReport(){
  if(!window.jspdf){
    showToast('PDF haikuweza kutengenezwa — angalia mtandao wako');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:'pt', format:'a4' });

  const [summary, gharama, mkeka] = await Promise.all([
    Store.summary(),
    Store.listGharama(),
    Store.mkeka()
  ]);

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 56;

  const gold = [166, 130, 24];
  const ink = [18, 36, 43];
  const dim = [100, 110, 108];

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...ink);
  doc.text('MCHANGO — Ripoti', margin, y);
  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...dim);
  doc.text(summary.jina, margin, y);
  y += 14;
  doc.text('Tarehe ya ripoti: ' + new Date().toLocaleDateString('en-GB'), margin, y);
  y += 28;

  // Summary box
  doc.setDrawColor(220,220,220);
  doc.roundedRect(margin, y, pageWidth - margin*2, 92, 8, 8);
  const colW = (pageWidth - margin*2) / 4;
  const rows = [
    ['Gharama Zote', Store.formatMoney(summary.gharamaZote)],
    ['Zilizokusanywa', Store.formatMoney(summary.zilizokusanywa)],
    ['Zilizobaki', Store.formatMoney(summary.zilizobaki)],
    ['Washiriki', String(summary.washiriki)]
  ];
  rows.forEach((r, i)=>{
    const x = margin + i*colW + 14;
    doc.setFontSize(9.5);
    doc.setTextColor(...dim);
    doc.text(r[0], x, y + 26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(...ink);
    doc.text(String(r[1]), x, y + 46, { maxWidth: colW - 20 });
    doc.setFont('helvetica', 'normal');
  });
  y += 92 + 14;

  doc.setFontSize(10.5);
  doc.setTextColor(...gold);
  doc.text('Maendeleo: ' + summary.progress.toFixed(1) + '%', margin, y);
  y += 26;

  // Gharama table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...ink);
  doc.text('Gharama', margin, y);
  y += 10;
  y = drawTable(doc, y, margin, pageWidth,
    ['Kipengele', 'Tarehe', 'Kiasi'],
    gharama.length ? gharama.map(g=>[g.jina, g.tarehe, Store.formatMoney(g.kiasi)]) : [['Hakuna gharama zilizowekwa','','']]
  );
  y += 20;

  // Mkeka table
  if(y > 680){ doc.addPage(); y = 56; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...ink);
  doc.text('Mkeka wa Washiriki', margin, y);
  y += 10;
  y = drawTable(doc, y, margin, pageWidth,
    ['Jina', 'Simu', 'Amelipa', 'Hali'],
    mkeka.length ? mkeka.map(m=>[m.jina, m.simu||'-', Store.formatMoney(m.kiasi), m.amelipa ? 'Kamili' : (m.kiasi>0 ? 'Sehemu' : 'Bado')]) : [['Hakuna washiriki bado','','','']]
  );

  const fileName = (summary.jina || 'Mchango').replace(/[^a-z0-9]+/gi,'_') + '_ripoti.pdf';
  doc.save(fileName);
  showToast('Ripoti ya PDF imepakuliwa');
}

function drawTable(doc, startY, margin, pageWidth, headers, rows){
  let y = startY + 18;
  const tableWidth = pageWidth - margin*2;
  const colWidths = headers.length === 3 ? [tableWidth*0.5, tableWidth*0.25, tableWidth*0.25]
                                          : [tableWidth*0.34, tableWidth*0.22, tableWidth*0.24, tableWidth*0.20];
  doc.setFillColor(27, 58, 64);
  doc.rect(margin, y - 12, tableWidth, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255,255,255);
  let x = margin + 8;
  headers.forEach((h, i)=>{ doc.text(h, x, y + 2); x += colWidths[i]; });
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40,40,40);
  rows.forEach((row, ri)=>{
    if(y > 780){ doc.addPage(); y = 56; }
    if(ri % 2 === 0){ doc.setFillColor(246,246,244); doc.rect(margin, y - 10, tableWidth, 18, 'F'); }
    let cx = margin + 8;
    row.forEach((cell, i)=>{
      doc.setFontSize(9.5);
      doc.text(String(cell), cx, y + 3, { maxWidth: colWidths[i]-10 });
      cx += colWidths[i];
    });
    y += 18;
  });
  return y;
}

window.generatePDFReport = generatePDFReport;
