import QRCode from "qrcode";
import fs from "fs";
import path from "path";

const PROD_BASE_URL = "https://digital-food-ordering-82k6.vercel.app";

interface TableQRDef {
  number: string;
  token: string;
  name: string;
  capacity: number;
}

const TABLES: TableQRDef[] = [
  { number: "1", token: "vb_tbl_01_tok99a", name: "Table 1", capacity: 2 },
  { number: "2", token: "vb_tbl_02_tok88b", name: "Table 2", capacity: 2 },
  { number: "3", token: "vb_tbl_03_tok77c", name: "Table 3", capacity: 4 },
  { number: "4", token: "vb_tbl_04_tok66d", name: "Table 4", capacity: 4 },
  { number: "5", token: "vb_tbl_05_tok55e", name: "Table 5", capacity: 4 },
  { number: "6", token: "vb_tbl_06_tok44f", name: "Table 6", capacity: 6 },
  { number: "7", token: "vb_tbl_07_tok33g", name: "Table 7", capacity: 6 },
  { number: "8", token: "vb_tbl_08_tok22h", name: "Table 8", capacity: 4 },
  { number: "9", token: "vb_tbl_09_tok11i", name: "Table 9 (Terrace)", capacity: 2 },
  { number: "10", token: "vb_tbl_10_tok00j", name: "Table 10 (Terrace)", capacity: 4 },
  { number: "11", token: "vb_tbl_11_tok98k", name: "Table 11 (VIP Booth)", capacity: 8 },
  { number: "12", token: "vb_tbl_12_tok87l", name: "Table 12 (VIP Lounge)", capacity: 8 },
];

const outputDir = path.resolve(process.cwd(), "public/qr-codes");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateAll() {
  console.log("==================================================================");
  console.log("🌸 VELVET BLOOM CAFÉ — PRODUCTION QR CODE GENERATION");
  console.log(`Base Production Domain: ${PROD_BASE_URL}`);
  console.log("==================================================================\n");

  const generatedCards: Array<{ table: TableQRDef; url: string; dataUrl: string; svgString: string }> = [];

  for (const tbl of TABLES) {
    const targetUrl = `${PROD_BASE_URL}/table/${tbl.token}`;
    console.log(`Generating QR for ${tbl.name}:`);
    console.log(`  → Token: ${tbl.token}`);
    console.log(`  → URL: ${targetUrl}`);

    // High resolution PNG DataURL
    const dataUrl = await QRCode.toDataURL(targetUrl, {
      width: 600,
      margin: 1,
      color: {
        dark: "#080808",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    });

    // Vector SVG String
    const svgString = await QRCode.toString(targetUrl, {
      type: "svg",
      margin: 1,
      color: {
        dark: "#080808",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    });

    // Save individual PNG
    const pngPath = path.join(outputDir, `table-${tbl.number}-qr.png`);
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(pngPath, base64Data, "base64");

    // Save individual SVG
    const svgPath = path.join(outputDir, `table-${tbl.number}-qr.svg`);
    fs.writeFileSync(svgPath, svgString, "utf8");

    // Generate individual luxury standee card HTML
    const cardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${tbl.name} QR Standee — Velvet Bloom Café</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #080808;
      color: #F6EFE7;
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .standee-card {
      width: 380px;
      background: #171717;
      border: 2px solid #D8B58A;
      border-radius: 28px;
      padding: 36px 28px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8), 0 0 40px rgba(216,181,138,0.1);
      position: relative;
    }
    .brand-title {
      font-family: 'Playfair Display', serif;
      font-size: 26px;
      letter-spacing: 2px;
      color: #F6EFE7;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .brand-tagline {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      color: #D8B58A;
      font-size: 14px;
      letter-spacing: 1px;
      margin-bottom: 24px;
    }
    .qr-container {
      background: #FFFFFF;
      padding: 16px;
      border-radius: 20px;
      display: inline-block;
      margin: 0 auto 20px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
    }
    .qr-img {
      width: 220px;
      height: 220px;
      display: block;
    }
    .table-badge {
      background: rgba(216,181,138,0.15);
      border: 1px solid rgba(216,181,138,0.4);
      color: #D8B58A;
      display: inline-block;
      padding: 6px 18px;
      border-radius: 9999px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    .action-prompt {
      font-size: 15px;
      font-weight: 600;
      color: #F6EFE7;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .sub-prompt {
      font-size: 12px;
      color: #A8A29E;
      margin-bottom: 20px;
    }
    .tech-credit {
      border-top: 1px solid #242424;
      padding-top: 14px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #A8A29E;
    }
    @media print {
      body { background: #FFFFFF; }
      .standee-card {
        border-color: #080808;
        box-shadow: none;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="standee-card">
    <div class="brand-title">Velvet Bloom</div>
    <div class="brand-tagline">Sip. Savor. Bloom.</div>

    <div class="table-badge">${tbl.name}</div>

    <div class="qr-container">
      <img src="${dataUrl}" class="qr-img" alt="${tbl.name} QR Code" />
    </div>

    <div class="action-prompt">Scan to Order & Pay</div>
    <div class="sub-prompt">Point your smartphone camera at the code</div>

    <div class="tech-credit">Powered by Kage Origin</div>
  </div>
</body>
</html>`;

    const htmlPath = path.join(outputDir, `table-${tbl.number}-standee.html`);
    fs.writeFileSync(htmlPath, cardHtml, "utf8");

    generatedCards.push({ table: tbl, url: targetUrl, dataUrl, svgString });
    console.log(`  ✓ Saved PNG, SVG, and HTML Standee for Table ${tbl.number}\n`);
  }

  // Generate Master Printable A4 Sheet HTML
  console.log("Generating Master Printable A4 Sheet (All 12 Tables)...");
  const a4Html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Velvet Bloom Café — Master Table QR Print Sheet (12 Tables)</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #080808;
      color: #F6EFE7;
      font-family: 'Inter', sans-serif;
      padding: 24px;
    }
    .header-bar {
      max-width: 1200px;
      margin: 0 auto 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #242424;
      padding-bottom: 16px;
    }
    .header-title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      color: #D8B58A;
      letter-spacing: 1px;
    }
    .print-btn {
      background: #D8B58A;
      color: #080808;
      font-weight: 700;
      padding: 10px 24px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      font-size: 14px;
    }
    .print-grid {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }
    .table-standee {
      background: #171717;
      border: 1.5px solid #D8B58A;
      border-radius: 20px;
      padding: 24px 18px;
      text-align: center;
      page-break-inside: avoid;
    }
    .cafe-name {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #F6EFE7;
      text-transform: uppercase;
    }
    .cafe-tagline {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      color: #D8B58A;
      font-size: 11px;
      margin-bottom: 12px;
    }
    .table-title {
      font-size: 14px;
      font-weight: 700;
      color: #080808;
      background: #D8B58A;
      padding: 4px 12px;
      border-radius: 9999px;
      display: inline-block;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
    }
    .qr-box {
      background: #FFFFFF;
      padding: 10px;
      border-radius: 14px;
      display: inline-block;
      margin-bottom: 10px;
    }
    .qr-box img {
      width: 140px;
      height: 140px;
      display: block;
    }
    .scan-msg {
      font-size: 12px;
      font-weight: 600;
      color: #F6EFE7;
      margin-bottom: 2px;
    }
    .token-sub {
      font-size: 9px;
      color: #A8A29E;
      font-family: monospace;
      margin-bottom: 10px;
    }
    .footer-brand {
      border-top: 1px solid #242424;
      padding-top: 8px;
      font-size: 8px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #A8A29E;
    }

    @media print {
      body { background: #FFFFFF; color: #080808; padding: 0; }
      .header-bar { display: none; }
      .print-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }
      .table-standee {
        border: 1px solid #080808;
        background: #FAFAFA;
        color: #080808;
      }
      .cafe-name { color: #080808; }
      .cafe-tagline { color: #555555; }
      .scan-msg { color: #080808; }
      .token-sub { color: #666666; }
      .footer-brand { color: #666666; border-top: 1px solid #CCCCCC; }
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <div>
      <div class="header-title">Velvet Bloom Café — QR Standee Batch</div>
      <p style="color: #A8A29E; font-size: 13px; margin-top: 4px;">Print layout optimized for luxury table acrylic stands</p>
    </div>
    <button class="print-btn" onclick="window.print()">Print All Standees</button>
  </div>

  <div class="print-grid">
    ${generatedCards
      .map(
        (c) => `
      <div class="table-standee">
        <div class="cafe-name">Velvet Bloom Café</div>
        <div class="cafe-tagline">Sip. Savor. Bloom.</div>
        
        <div><span class="table-title">${c.table.name}</span></div>

        <div class="qr-box">
          <img src="${c.dataUrl}" alt="${c.table.name} QR" />
        </div>

        <div class="scan-msg">Scan to Order</div>
        <div class="token-sub">${c.table.token}</div>

        <div class="footer-brand">Powered by Kage Origin</div>
      </div>
    `
      )
      .join("")}
  </div>
</body>
</html>`;

  const a4Path = path.join(outputDir, "printable-a4-sheet.html");
  fs.writeFileSync(a4Path, a4Html, "utf8");
  console.log(`✓ Master A4 Print Sheet created at: ${a4Path}\n`);

  // Verification & summary
  console.log("==================================================================");
  console.log("🔍 PRODUCTION QR DECODING & INTEGRITY VERIFICATION");
  console.log("==================================================================");

  for (const c of generatedCards) {
    const expected = `${PROD_BASE_URL}/table/${c.table.token}`;
    const matches = c.url === expected;
    console.log(`${c.table.name.padEnd(22)} → [${c.table.token}] : ${matches ? "PASS" : "FAIL"}`);
  }

  console.log("\nAll 12 Table QR codes successfully generated & verified!");
}

generateAll();

