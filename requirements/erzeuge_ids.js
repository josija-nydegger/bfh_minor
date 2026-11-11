// Erzeugt requirements/a1_baufortschritt.ids und requirements/a1_baufortschritt.yaml aus einer Klassenliste.
// Aufruf im Repository-Ordner: node requirements/erzeuge_ids.js
// Das ist ein Node.js-Script, kein ifclite-Script. In ifclite wird nur die fertige
// a1_baufortschritt.ids zusammen mit dem Modell geladen.
//
// IDS 1.0 prüft beim Entity-Facet nur die genannte Klasse, keine Subtypen. Darum zählt die
// Anwendbarkeit alle Bauteilklassen von IFC2X3 auf: IfcElement ohne IfcFeatureElement
// (IfcOpeningElement, IfcProjectionElement) und ohne IfcVirtualElement. So gilt jede Regel
// für jedes Modell, auch wenn neue Klassen dazukommen.
// IDS-Light (idslight.com) kennt keine Klassenlisten, darum erzeugt dieses Script beide Dateien.
const fs = require("fs");
const path = require("path");

const CLASSES = [
  // IfcBuildingElement
  "IfcBeam", "IfcBuildingElementProxy", "IfcColumn", "IfcCovering", "IfcCurtainWall", "IfcDoor", "IfcFooting",
  "IfcMember", "IfcPile", "IfcPlate", "IfcRailing", "IfcRamp", "IfcRampFlight", "IfcRoof", "IfcSlab",
  "IfcStair", "IfcStairFlight", "IfcWall", "IfcWallStandardCase", "IfcWindow",
  // IfcBuildingElementComponent
  "IfcBuildingElementPart", "IfcReinforcingBar", "IfcReinforcingMesh", "IfcTendon", "IfcTendonAnchor",
  // IfcElementComponent
  "IfcDiscreteAccessory", "IfcFastener", "IfcMechanicalFastener",
  // IfcDistributionElement
  "IfcDistributionElement", "IfcDistributionControlElement", "IfcDistributionFlowElement", "IfcDistributionChamberElement",
  "IfcEnergyConversionDevice", "IfcFlowController", "IfcFlowFitting", "IfcFlowMovingDevice", "IfcFlowSegment",
  "IfcFlowStorageDevice", "IfcFlowTerminal", "IfcFlowTreatmentDevice",
  // weitere IfcElement
  "IfcElementAssembly", "IfcFurnishingElement", "IfcTransportElement", "IfcElectricalElement", "IfcEquipmentElement",
];

const PATTERN = "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])";
const TITLE = "Baufortschritt - Soll-Installationsdatum, Montagestatus und Abnahmedatum";
const DESC = "Anforderung 1: InstallationDate (Soll-Datum gemäss Terminplan) vorhanden und im Format YYYY-MM-DD; IsInstalled vorhanden und IfcBoolean. Anforderung 2 (nur Format): AcceptanceDate, falls gesetzt, im Format YYYY-MM-DD. Gilt für alle " + CLASSES.length + " Bauteilklassen von IFC2X3.";
const DATE = "2026-11-04";
const RULES = [
  { name: "A1 InstallationDate", desc: "Soll-Datum gemäss Terminplan bei jedem Bauteil", prop: "InstallationDate", type: "IFCLABEL", yamlType: "string", card: "required", pattern: true,
    instr: "Soll-Datum der Installation gemäss Terminplan im Format YYYY-MM-DD; wird nach der Übergabe nicht verändert" },
  { name: "A1 IsInstalled", desc: "Montagestatus bei jedem Bauteil", prop: "IsInstalled", type: "IFCBOOLEAN", yamlType: "boolean", card: "required", pattern: false,
    instr: "Montagestatus: initial FALSE (Modellautor), TRUE nach Montage-Rückmeldung des Poliers" },
  { name: "A2 AcceptanceDate", desc: "Abnahmedatum, falls gesetzt, im Format YYYY-MM-DD", prop: "AcceptanceDate", type: "IFCLABEL", yamlType: "string", card: "optional", pattern: true,
    instr: "Abnahmedatum der Bauleitung im Format YYYY-MM-DD; leer = noch nicht abgenommen" },
];

// ---------- IDS ----------
const enumXml = CLASSES.map((c) => `              <xs:enumeration value="${c.toUpperCase()}"/>`).join("\n");
const spec = (r) => `    <ids:specification name="${r.name}" ifcVersion="IFC2X3" description="${r.desc}">
      <ids:applicability minOccurs="1" maxOccurs="unbounded">
        <ids:entity>
          <ids:name>
            <xs:restriction base="xs:string">
${enumXml}
            </xs:restriction>
          </ids:name>
        </ids:entity>
      </ids:applicability>
      <ids:requirements>
        <ids:property dataType="${r.type}" cardinality="${r.card}" instructions="${r.instr}">
          <ids:propertySet><ids:simpleValue>Pset_InstallationOccurrence</ids:simpleValue></ids:propertySet>
          <ids:baseName><ids:simpleValue>${r.prop}</ids:simpleValue></ids:baseName>${r.pattern ? `
          <ids:value>
            <xs:restriction base="xs:string">
              <xs:pattern value="${PATTERN}"/>
            </xs:restriction>
          </ids:value>` : ""}
        </ids:property>
      </ids:requirements>
    </ids:specification>`;
const ids = `<?xml version="1.0" encoding="UTF-8"?>
<ids:ids xmlns:ids="http://standards.buildingsmart.org/IDS" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://standards.buildingsmart.org/IDS http://standards.buildingsmart.org/IDS/1.0/ids.xsd">
  <ids:info>
    <ids:title>${TITLE}</ids:title>
    <ids:description>${DESC}</ids:description>
    <ids:date>${DATE}</ids:date>
  </ids:info>
  <ids:specifications>
${RULES.map(spec).join("\n")}
  </ids:specifications>
</ids:ids>
`;

// ---------- YAML (gleiche Regeln, zum Lesen) ----------
const yaml = `# Regeln für Anforderung 1 (und Formatteil von Anforderung 2), Quelle für a1_baufortschritt.ids
# Erzeugt mit: node requirements/erzeuge_ids.js (nicht von Hand ändern, sondern das Script anpassen)
#
# Geltungsbereich laut AIA/BEP-Matrix: alle IfcElement ohne IfcOpeningElement.
# IDS 1.0 prüft beim Entity-Facet nur die genannte Klasse (keine Subtypen). Darum steht in jeder
# Regel die Liste aller ${CLASSES.length} Bauteilklassen von IFC2X3. IDS-Light kennt keine Klassenlisten,
# darum erzeugt das Script das IDS direkt.
#
# Datum als IfcLabel (IFC2X3 kennt kein IfcDate), Format YYYY-MM-DD per Pattern.
# Das Pattern ist ein XSD-Regex: implizit verankert, darum ohne ^ und $.
# IsInstalled als boolean (-> IFCBOOLEAN).

ids:
  title: "${TITLE}"
  description: "${DESC}"
  date: "${DATE}"
  ifcVersion: "IFC2X3"
  entities: &bauteile
${CLASSES.map((c) => `    - "${c}"`).join("\n")}
  rules:
${RULES.map((r) => `    - name: "${r.name}"
      entities: *bauteile
      properties:
        - name: "Pset_InstallationOccurrence.${r.prop}"
          datatype: "${r.yamlType}"
          presence: "${r.card}"${r.pattern ? `
          pattern: "${PATTERN}"` : ""}
          instructions: "${r.instr}"`).join("\n")}
`;

const crlf = (s) => s.replace(/\r?\n/g, "\r\n");
fs.writeFileSync(path.join(__dirname, "a1_baufortschritt.ids"), crlf(ids));
fs.writeFileSync(path.join(__dirname, "a1_baufortschritt.yaml"), crlf(yaml));
console.log(`${RULES.length} Regeln, ${CLASSES.length} Klassen -> a1_baufortschritt.ids, a1_baufortschritt.yaml`);
