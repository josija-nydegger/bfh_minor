// Erzeugt ein vereinfachtes IFC2X3-Modell der Mutthornhütte mit Baufortschritts-Daten
// (Pset_InstallationOccurrence: InstallationDate, IsInstalled, AcceptanceDate).
// Aufruf (im Repository-Ordner): node checks/erzeuge_mutthornhuette.js [Ausgabedatei.ifc]
// Ohne Argument wird model/Mutthornhuette_Baufortschritt.ifc geschrieben.
// Stichtag für den Lösungsschlüssel (checks/loesung_mutthornhuette.md): 03.11.2026

const fs = require("fs");
const OUT = process.argv[2] || "model/Mutthornhuette_Baufortschritt.ifc";

// ---------- STEP-Hilfen ----------
let nextId = 1;
const lines = [];
function add(s) { const id = nextId++; lines.push(`#${id}=${s};`); return `#${id}`; }
function str(s) {
  if (s === null || s === undefined) return "$";
  let o = "";
  for (const ch of String(s)) {
    const c = ch.codePointAt(0);
    if (ch === "'") o += "''";
    else if (ch === "\\") o += "\\\\";
    else if (c < 128) o += ch;
    else o += "\\X2\\" + c.toString(16).toUpperCase().padStart(4, "0") + "\\X0\\";
  }
  return `'${o}'`;
}
const f = (n) => { const s = Number(n).toFixed(4).replace(/0+$/, ""); return s.endsWith(".") ? s : s; };
const pt = (x, y, z) => add(`IFCCARTESIANPOINT((${f(x)},${f(y)},${f(z)}))`);
const pt2 = (x, y) => add(`IFCCARTESIANPOINT((${f(x)},${f(y)}))`);
const dir = (x, y, z) => add(`IFCDIRECTION((${f(x)},${f(y)},${f(z)}))`);

// Deterministische GlobalIds (22 Zeichen, IFC-Base64) aus einem MD5-Hash pro Zähler:
// gleiche Eingabe → gleiche GlobalIds, also wiederholbar.
const B64 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";
let gidCount = 0;
function gid() {
  const h = require("crypto").createHash("md5").update("mutthorn-" + gidCount++).digest();
  let n = BigInt("0x" + h.toString("hex")), s = "";
  for (let i = 0; i < 21; i++) { s = B64[Number(n % 64n)] + s; n /= 64n; }
  return `'${B64[Number(n % 4n)]}${s}'`;
}

// ---------- Kopf, Einheiten, Kontext ----------
const person = add(`IFCPERSON($,'Team 4',$,$,$,$,$,$)`);
const org = add(`IFCORGANIZATION($,'BFH Architektur, Holz und Bau',$,$,$)`);
const pao = add(`IFCPERSONANDORGANIZATION(${person},${org},$)`);
const app = add(`IFCAPPLICATION(${org},'0.1','Mutthorn-Generator Team 4','MUTTHORN')`);
const oh = add(`IFCOWNERHISTORY(${pao},${app},$,.ADDED.,$,$,$,1793664000)`);
const units = add(`IFCUNITASSIGNMENT((${add("IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)")},${add("IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)")},${add("IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)")},${add("IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)")}))`);
const origin = pt(0, 0, 0);
const zDir = dir(0, 0, 1), xDir = dir(1, 0, 0);
const worldAx = add(`IFCAXIS2PLACEMENT3D(${origin},${zDir},${xDir})`);
const ctx = add(`IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,${worldAx},$)`);
const project = add(`IFCPROJECT(${gid()},${oh},'Mutthornh\\X2\\00FC\\X0\\tte',${str("Vereinfachtes Lehrmodell für die Baufortschrittsüberwachung (Team 4, BFH)")},$,${str("Mutthornhütte SAC – Neubau (vereinfacht)")},$,(${ctx}),${units})`);

function placement(rel, x, y, z, axis, ref) {
  const ap = add(`IFCAXIS2PLACEMENT3D(${pt(x, y, z)},${axis || "$"},${ref || "$"})`);
  return add(`IFCLOCALPLACEMENT(${rel || "$"},${ap})`);
}
const sitePl = placement(null, 0, 0, 0);
const site = add(`IFCSITE(${gid()},${oh},'Mutthorn',$,$,${sitePl},$,$,.ELEMENT.,$,$,$,$,$)`);
const bldPl = placement(sitePl, 0, 0, 0);
const building = add(`IFCBUILDING(${gid()},${oh},${str("Mutthornhütte")},$,$,${bldPl},$,$,.ELEMENT.,$,$,$)`);
add(`IFCRELAGGREGATES(${gid()},${oh},$,$,${project},(${site}))`);
add(`IFCRELAGGREGATES(${gid()},${oh},$,$,${site},(${building}))`);

const STOREYS = [["Untergeschoss", -2.72], ["Erdgeschoss", 0], ["Obergeschoss", 3.1], ["Dach", 6.2]];
const storey = {};
for (const [name, elev] of STOREYS) {
  const pl = placement(bldPl, 0, 0, elev);
  storey[name] = { pl, id: add(`IFCBUILDINGSTOREY(${gid()},${oh},${str(name)},$,$,${pl},$,$,.ELEMENT.,${f(elev)})`), items: [] };
}
add(`IFCRELAGGREGATES(${gid()},${oh},$,$,${building},(${Object.values(storey).map((s) => s.id).join(",")}))`);

// ---------- Farben ----------
const styleCache = {};
function style(name, r, g, b) {
  if (styleCache[name]) return styleCache[name];
  const col = add(`IFCCOLOURRGB($,${f(r)},${f(g)},${f(b)})`);
  const shading = add(`IFCSURFACESTYLESHADING(${col})`);
  const ss = add(`IFCSURFACESTYLE(${str(name)},.BOTH.,(${shading}))`);
  return (styleCache[name] = add(`IFCPRESENTATIONSTYLEASSIGNMENT((${ss}))`));
}
const COL = {
  beton: ["Beton", 0.62, 0.62, 0.6], holz: ["Holz", 0.79, 0.64, 0.42], fassade: ["Fassade dunkel", 0.18, 0.19, 0.2],
  glas: ["Glas", 0.5, 0.7, 0.84], dach: ["Blech Dach", 0.36, 0.38, 0.4], tank: ["Tank", 0.86, 0.9, 0.92],
  pv: ["PV", 0.11, 0.18, 0.35], tuer: ["Tür", 0.42, 0.29, 0.17],
};

// ---------- Bauteile ----------
// Quader: (x, y, z) = Ecke im Geschoss-Koordinatensystem, (dx, dy, dz) = Masse in m.
// opts.axis/opts.ref drehen das lokale System (für geneigte Dachflächen).
const elements = [];
function bauteil(cls, name, st, x, y, z, dx, dy, dz, extra, col, plan, opts = {}) {
  const S = storey[st];
  const pl = placement(S.pl, x, y, z, opts.axis, opts.ref);
  const prof = add(`IFCRECTANGLEPROFILEDEF(.AREA.,$,${add(`IFCAXIS2PLACEMENT2D(${pt2(dx / 2, dy / 2)},$)`)},${f(dx)},${f(dy)})`);
  const solid = add(`IFCEXTRUDEDAREASOLID(${prof},${add(`IFCAXIS2PLACEMENT3D(${origin},$,$)`)},${zDir},${f(dz)})`);
  add(`IFCSTYLEDITEM(${solid},(${style(...COL[col])}),$)`);
  const rep = add(`IFCSHAPEREPRESENTATION(${ctx},'Body','SweptSolid',(${solid}))`);
  const shape = add(`IFCPRODUCTDEFINITIONSHAPE($,$,(${rep}))`);
  const id = add(`${cls}(${gid()},${oh},${str(name)},$,$,${pl},${shape},$${extra ? "," + extra : ""})`);
  S.items.push(id);
  elements.push({ id, cls, name, st, plan });
}
const W = (...a) => bauteil("IFCWALL", ...a.slice(0, 8), "", ...a.slice(8));

// Plan je Bauteil: [InstallationDate, IsInstalled, AcceptanceDate]
// IsInstalled: true/false = IfcBoolean, String = absichtlich falscher Typ (IfcLabel)
const L = 22.8, B = 11.5, t = 0.3;

// Untergeschoss (nur Westteil, x 0–8.16)
const ug = "Untergeschoss";
[["Süd", 0, 1.5, 8.16, 0.6], ["Nord", 0, 9.4, 8.16, 0.6], ["West", 0, 2.1, 0.6, 7.3], ["Ost", 7.56, 2.1, 0.6, 7.3]].forEach(([n, x, y, dx, dy]) =>
  bauteil("IFCFOOTING", `Streifenfundament ${n}`, ug, x, y, -0.4, dx, dy, 0.4, ".STRIP_FOOTING.", "beton", ["2026-09-14", true, "2026-09-18"]));
bauteil("IFCSLAB", "Bodenplatte UG", ug, 0, 1.5, 0, 8.16, 8.5, 0.25, ".BASESLAB.", "beton", ["2026-09-16", true, "2026-09-18"]);
[[10.5, 0.4], [16.5, 0.4], [22.2, 0.4], [10.5, 10.5], [16.5, 10.5], [22.2, 10.5]].forEach(([x, y], i) =>
  bauteil("IFCFOOTING", `Betonsockel ${i + 1}`, ug, x - 0.3, y, 1.92, 0.6, 0.6, 0.8, ".PAD_FOOTING.", "beton",
    i === 3 ? ["2026-09-17", true, null] : ["2026-09-17", true, "2026-09-23"]));
W("Wand UG Süd", ug, 0, 1.5, 0.25, 8.16, t, 2.17, "beton", ["2026-09-22", true, "2026-09-30"]);
W("Wand UG Nord", ug, 0, 9.7, 0.25, 8.16, t, 2.17, "beton", ["2026-09-22", true, "2026-09-30"]);
W("Wand UG West", ug, 0, 1.8, 0.25, t, 7.9, 2.17, "beton", ["2026-09-23", true, "2026-09-30"]);
W("Wand UG Ost", ug, 7.86, 1.8, 0.25, t, 7.9, 2.17, "beton", ["2026-09-23", true, "2026-09-30"]);
W("Innenwand UG Technik", ug, 0.3, 5.6, 0.25, 7.56, 0.2, 2.17, "beton", ["2026-09-24", true, "2026-09-30"]);
bauteil("IFCSTAIR", "Treppe UG–EG", ug, 5.4, 1.8, 0.25, 2.2, 1.1, 2.17, ".STRAIGHT_RUN_STAIR.", "beton", ["2026-10-14", true, null]);
for (let i = 0; i < 5; i++)
  bauteil("IFCFLOWSTORAGEDEVICE", `Wassertank ${i + 1}`, ug, 0.6 + i * 1.45, 7.6, 0.25, 1.2, 1.8, 1.6, "", "tank",
    i === 1 || i === 3 ? [null, false, null] : ["2026-10-07", true, null]);

// Erdgeschoss
const eg = "Erdgeschoss";
bauteil("IFCSLAB", "Boden EG (Holzelement)", eg, 0, 0, -0.3, L, B, 0.3, ".FLOOR.", "holz", ["2026-09-29", true, "2026-10-02"]);
W("Aussenwand EG Süd", eg, 0, 0, 0, L, t, 2.8, "holz", ["2026-10-05", true, "2026-10-14"]);
W("Aussenwand EG Nord", eg, 0, B - t, 0, L, t, 2.8, "holz", ["2026-10-05", true, null]);
W("Aussenwand EG West", eg, 0, t, 0, t, B - 2 * t, 2.8, "holz", ["2026-10-06", true, "2026-10-14"]);
W("Aussenwand EG Ost", eg, L - t, t, 0, t, B - 2 * t, 2.8, "holz", ["2026-10-07", true, null]);
W("Korridorwand EG Süd", eg, t, 5.0, 0, L - 2 * t, 0.15, 2.8, "holz", ["2026-10-12", true, null]);
W("Korridorwand EG Nord", eg, t, 7.2, 0, L - 2 * t, 0.15, 2.8, "holz", ["2026-10-12", true, null]);
[6, 11, 16].forEach((x, i) =>
  bauteil("IFCCOLUMN", `Stütze Korridor EG ${i + 1}`, eg, x - 0.1, 6.0, 0, 0.2, 0.2, 2.8, "", "holz",
    i === 0 ? ["2026-10-08", true, "2026-10-14"] : i === 1 ? ["2026-10-08", true, null] : ["2026-09-31", true, null]));
bauteil("IFCBEAM", "Unterzug Korridor EG", eg, t, 5.95, 2.5, L - 2 * t, 0.3, 0.3, "", "holz", ["2026-10-15", true, null]);
W("Innenwand EG Gaststube/Küche", eg, 13.0, t, 0, 0.15, 5.0 - t, 2.8, "holz", ["2026-10-19", true, null]);
W("Innenwand EG Nord 1", eg, 6.0, 7.35, 0, 0.15, B - t - 7.35, 2.8, "holz", ["2026-10-19", false, null]);
W("Innenwand EG Nord 2", eg, 15.0, 7.35, 0, 0.15, B - t - 7.35, 2.8, "holz", ["2026-10-20", false, null]);
bauteil("IFCSLAB", "Decke über EG", eg, 0, 0, 2.8, L, B, 0.3, ".FLOOR.", "holz", ["2026-10-26", false, null]);
bauteil("IFCSTAIR", "Treppe EG–OG", eg, 19.6, 5.15, 0, 2.6, 2.05, 2.8, ".STRAIGHT_RUN_STAIR.", "holz", ["2026-10-28", false, null]);
bauteil("IFCDOOR", "Hauseingangstür", eg, L - 0.2, 5.6, 0, 0.1, 1.2, 2.2, "2.2,1.2", "tuer", ["2026-11-05", false, "2026-10-28"]);
[2, 5.5, 9, 15, 18.5].forEach((x, i) =>
  bauteil("IFCWINDOW", `Fenster EG Süd ${i + 1}`, eg, x, 0.1, 0.9, 1.6, 0.1, 1.4, "1.4,1.6", "glas",
    i === 2 ? ["2026-11-05", true, "2026-10-30"] : [`2026-11-0${4 + (i % 3)}`, false, null]));
[3, 10, 17].forEach((x, i) =>
  bauteil("IFCWINDOW", `Fenster EG Nord ${i + 1}`, eg, x, B - 0.2, 1.2, 1.0, 0.1, 1.1, "1.1,1.", "glas", ["2026-11-06", false, null]));
// Fassade (über EG und OG, 0–6.2 m)
bauteil("IFCCOVERING", "Fassade Süd", eg, 0, -0.08, 0, L, 0.08, 6.2, ".CLADDING.", "fassade", ["2026-11-20", false, null]);
bauteil("IFCCOVERING", "Fassade Nord", eg, 0, B, 0, L, 0.08, 6.2, ".CLADDING.", "fassade", ["2026-11-23", false, null]);
bauteil("IFCCOVERING", "Fassade West", eg, -0.08, -0.08, 0, 0.08, B + 0.16, 6.2, ".CLADDING.", "fassade", ["2026-11-24", false, null]);
bauteil("IFCCOVERING", "Fassade Ost", eg, L, -0.08, 0, 0.08, B + 0.16, 6.2, ".CLADDING.", "fassade", ["2026-11-25", false, null]);

// Obergeschoss
const og = "Obergeschoss";
W("Aussenwand OG Süd", og, 0, 0, 0, L, t, 2.8, "holz", ["2026-11-09", false, null]);
W("Aussenwand OG Nord", og, 0, B - t, 0, L, t, 2.8, "holz", ["2026-11-09", false, null]);
W("Aussenwand OG West", og, 0, t, 0, t, B - 2 * t, 2.8, "holz", ["2026-11-10", false, null]);
W("Aussenwand OG Ost", og, L - t, t, 0, t, B - 2 * t, 2.8, "holz", ["2026-11-10", false, null]);
W("Korridorwand OG Süd", og, t, 5.0, 0, L - 2 * t, 0.15, 2.8, "holz", ["2026-11-11", false, null]);
W("Korridorwand OG Nord", og, t, 7.2, 0, L - 2 * t, 0.15, 2.8, "holz", ["2026-11-11", false, null]);
[4.6, 8.9, 13.2, 17.5].forEach((x, i) =>
  W(`Zimmerwand OG Süd ${i + 1}`, og, x, t, 0, 0.12, 5.0 - t, 2.8, "holz", ["2026-11-12", false, null]));
[5.8, 11.4, 17.0].forEach((x, i) =>
  W(`Zimmerwand OG Nord ${i + 1}`, og, x, 7.35, 0, 0.12, B - t - 7.35, 2.8, "holz", ["2026-11-12", i === 1 ? "FALSE" : false, null]));
bauteil("IFCSLAB", "Decke über OG", og, 0, 0, 2.8, L, B, 0.3, ".FLOOR.", "holz", ["2026-11-16", false, null]);
[1.5, 5.2, 9.5, 13.8, 17.6, 20.6].forEach((x, i) =>
  bauteil("IFCWINDOW", `Fenster OG Süd ${i + 1}`, og, x, 0.1, 1.0, 0.9, 0.1, 1.1, "1.1,0.9", "glas", ["2026-11-18", false, null]));
[3, 8.5, 14, 19.5].forEach((x, i) =>
  bauteil("IFCWINDOW", `Fenster OG Nord ${i + 1}`, og, x, B - 0.2, 1.0, 0.9, 0.1, 1.1, "1.1,0.9", "glas", ["2026-11-19", false, null]));

// Dach: zwei geneigte Dachflächen (Satteldach, First in der Mitte, 1.5 m über Traufe)
const dach = "Dach", ov = 0.3, rise = 1.5, half = B / 2 + ov;
const len = Math.hypot(half, rise), ca = half / len, sa = rise / len;
const nSued = dir(0, -sa, ca), nNord = dir(0, sa, ca), negX = dir(-1, 0, 0);
bauteil("IFCSLAB", "Dachfläche Süd", dach, -ov, -ov, 0, L + 2 * ov, len, 0.25, ".ROOF.", "dach", ["2026-11-17", false, null], { axis: nSued, ref: xDir });
bauteil("IFCSLAB", "Dachfläche Nord", dach, L + ov, B + ov, 0, L + 2 * ov, len, 0.25, ".ROOF.", "dach", ["2026-11-18", false, null], { axis: nNord, ref: negX });
// PV-Anlage auf der Süddachfläche (gleiche Neigung, 0.25 m über der Dachfläche)
const pvX = 3, pvY = 1.0;
bauteil("IFCENERGYCONVERSIONDEVICE", "PV-Anlage Dach Süd", dach, -ov + pvX, -ov + pvY * ca - 0.25 * sa, pvY * sa + 0.25 * ca, 16, 4.0, 0.06, "", "pv",
  ["24.11.2026", false, null], { axis: nSued, ref: xDir });

// ---------- Beziehungen und Psets ----------
for (const s of Object.values(storey))
  add(`IFCRELCONTAINEDINSPATIALSTRUCTURE(${gid()},${oh},$,$,(${s.items.join(",")}),${s.id})`);
for (const e of elements) {
  const [soll, inst, acc] = e.plan;
  const a = add(`IFCPROPERTYSINGLEVALUE('InstallationDate',$,${soll ? `IFCLABEL('${soll}')` : "$"},$)`);
  const b = add(`IFCPROPERTYSINGLEVALUE('IsInstalled',$,${typeof inst === "boolean" ? `IFCBOOLEAN(.${inst ? "T" : "F"}.)` : `IFCLABEL('${inst}')`},$)`);
  const c = add(`IFCPROPERTYSINGLEVALUE('AcceptanceDate',$,${acc ? `IFCLABEL('${acc}')` : "$"},$)`);
  const ps = add(`IFCPROPERTYSET(${gid()},${oh},'Pset_InstallationOccurrence',$,(${a},${b},${c}))`);
  add(`IFCRELDEFINESBYPROPERTIES(${gid()},${oh},$,$,(${e.id}),${ps})`);
}

const header = [
  "ISO-10303-21;", "HEADER;",
  "FILE_DESCRIPTION(('ViewDefinition [CoordinationView_V2.0]'),'2;1');",
  `FILE_NAME('${OUT.split(/[\\/]/).pop()}','2026-10-31T12:00:00',('Team 4'),('BFH Architektur, Holz und Bau'),'Mutthorn-Generator 0.1','Mutthorn-Generator 0.1','');`,
  "FILE_SCHEMA(('IFC2X3'));", "ENDSEC;", "DATA;",
];
fs.writeFileSync(OUT, header.concat(lines, ["ENDSEC;", "END-ISO-10303-21;", ""]).join("\n"));
console.log(`${OUT}: ${elements.length} Bauteile, ${lines.length} Entitäten`);
