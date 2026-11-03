// Baut die Baustellen-App als eine einzige Datei: src/app.html + Ansichten (src/polier.html, src/bauleitung.html)
// → Baustellen-App.html. Die Ansichten werden Base64-kodiert eingebettet und zur Laufzeit als iframe (srcdoc) geöffnet.
// Aufruf (im Repository-Ordner): node apps/baustellen-app/build.js
const fs = require("fs");
const path = require("path");

const src = (f) => fs.readFileSync(path.join(__dirname, "src", f), "utf8");
const app = src("app.html");
if (!app.includes("<!--VIEWS-->")) throw new Error("Platzhalter <!--VIEWS--> fehlt in src/app.html");

const views = ["polier", "bauleitung"].map((id) => {
  const b64 = Buffer.from(src(`${id}.html`), "utf8").toString("base64");
  return `<script type="text/plain" id="view-${id}">${b64}</script>`;
});
const out = app
  .replace("<head>", "<head>\n<!-- Automatisch erzeugt mit build.js aus src/. Änderungen in src/ machen und neu bauen. -->")
  .replace("<!--VIEWS-->", views.join("\n"));

const target = path.join(__dirname, "Baustellen-App.html");
fs.writeFileSync(target, out);
console.log(`${path.relative(process.cwd(), target)}: ${Math.round(out.length / 1024)} KB`);
