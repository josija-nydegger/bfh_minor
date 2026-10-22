| # | Anforderung | Zweck | Meilenstein | Objekte (IFC-Klasse) | Property / Quantity (mit Pset) | erlaubte Werte / Datentyp | Prüfmethode | Verantwortlich | Quelle |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Soll-Installationsdatum und Montagestatus bei jedem Element erfasst | Soll-Termin pro Bauteil festhalten, Montage-Rückmeldung des Poliers erfassen, Status pro Bauteil ableiten | `InstallationDate`: initial bei Übergabe Ausführungsmodell vor Baubeginn (Phase 52), danach unverändert; `IsInstalled`: initial FALSE, laufend bei jeder Montage-Rückmeldung | IfcElement ohne IfcOpeningElement (im Modell 9 Klassen: IfcBeam, IfcColumn, IfcSlab, IfcWall, IfcWallStandardCase, IfcFooting, IfcReinforcingBar, IfcElementAssembly, IfcBuildingElementProxy) | Pset_InstallationOccurrence.InstallationDate; Pset_InstallationOccurrence.IsInstalled | `InstallationDate`: IfcLabel (IFC2X3), Format YYYY-MM-DD, Pflicht, Soll-Datum gemäss Terminplan (in IFC 4.3: IfcDate); `IsInstalled`: IfcBoolean (TRUE/FALSE), Pflicht | IDS-Check (a1_baufortschritt.ids) + Stichprobe im Viewer | `InstallationDate`: Modellautor / BIM-Koordinator gemäss Terminplan; `IsInstalled`: initial Modellautor (FALSE), Aktualisierung Polier (TRUE) | IFC 4.3 Pset_InstallationOccurrence; `IsInstalled` projektspezifisch (Vorgabe Modell Dozent); MVP Abschnitt 3 |
| 2 | Abnahmedatum plausibel | Abnahmen erfassen, ausstehende Abnahmen als Pendenz der Bauleitung erkennen | Laufend nach jeder Kontrolle durch die Bauleitung; vollständig spätestens zur Bauabnahme (Phase 53) | IfcElement ohne IfcOpeningElement (im Modell 9 Klassen: IfcBeam, IfcColumn, IfcSlab, IfcWall, IfcWallStandardCase, IfcFooting, IfcReinforcingBar, IfcElementAssembly, IfcBuildingElementProxy) | Pset_InstallationOccurrence.AcceptanceDate (verglichen mit Pset_InstallationOccurrence.IsInstalled und Prüfdatum) | IfcLabel, Format YYYY-MM-DD; optional (leer = noch nicht abgenommen); falls gesetzt: `IsInstalled` = TRUE und ≤ Prüfdatum; vor `InstallationDate` nur Hinweis (vorzeitig montiert), kein Fehler | IDS-Check (nur Format) + eigene Prüflogik (Python/IfcOpenShell) | Bauleitung | IFC 4.3 Pset_InstallationOccurrence; Projektregel „Abnahme nur nach Montage“ (MVP Abschnitt 3) |
| 3 | Montageverzug erkannt | Überfällige Bauteile als Pendenz erkennen und Verzug beziffern | Laufend, z. B. täglich durch die Bauleitung und wöchentlich vor der Bausitzung | IfcElement ohne IfcOpeningElement (im Modell 9 Klassen: IfcBeam, IfcColumn, IfcSlab, IfcWall, IfcWallStandardCase, IfcFooting, IfcReinforcingBar, IfcElementAssembly, IfcBuildingElementProxy) | Pset_InstallationOccurrence.InstallationDate + Pset_InstallationOccurrence.IsInstalled + Prüfdatum | Überfällig, wenn `InstallationDate` ≤ Prüfdatum und `IsInstalled` = FALSE; Verzug in Tagen (Integer) = Prüfdatum − `InstallationDate` | Eigene Prüflogik (Python/IfcOpenShell), Liste der überfälligen Bauteile mit GlobalId | Bauleitung | Terminplan (als `InstallationDate` im Modell); MVP Abschnitt 4 |

Statusableitung pro Bauteil (Grundlage für Anforderungen 2 und 3):

| `InstallationDate` | `IsInstalled` | `AcceptanceDate` | Status |
|---|---|---|---|
| Zukunft | FALSE | leer | geplant |
| heute oder vergangen | FALSE | leer | Montage überfällig (Pendenz Polier) |
| beliebig | TRUE | leer | Abnahme ausstehend (Pendenz Bauleitung) |
| beliebig | TRUE | gesetzt | abgenommen |
| beliebig | FALSE | gesetzt | Fehler (Abnahme ohne Montage) |
| leer | beliebig | beliebig | Fehler |

Hinweis zu Anforderung 3: Weil `InstallationDate` das Soll-Datum ist und nicht überschrieben wird, gibt es kein Ist-Datum der Montage. Der Verzug wird darum nur für noch nicht montierte Bauteile berechnet. Ein Abgleich mit einem externen Terminplan entfällt.

## Prüfbar gemacht: Anforderung Nr. 1
- Spezifikation: `a1_baufortschritt.yaml` / `a1_baufortschritt.ids`, 27 Regeln: je Bauteilklasse „A1 InstallationDate“, „A1 IsInstalled“ und den Formatteil von Anforderung 2 („A2 AcceptanceDate“). Das IDS wurde aus derselben Regelliste wie die YAML erzeugt (Aufbau wie die IDS-Light-Ausgabe, `boolean` → `IFCBOOLEAN` gemäss idslight.com/docs).
- Modell: `model/Team_4_Snowdon_Baufortschritt_IsInstalled.ifc` (IFC2X3, vom Dozenten bereitgestellt). 1446 Elemente (1585 `IfcElement` − 139 `IfcOpeningElement`), alle mit `Pset_InstallationOccurrence`; `IsInstalled` als IfcBoolean bei allen 1446 (1061 TRUE, 385 FALSE); `AcceptanceDate` überall leer.
- Befund am Modell: `InstallationDate` ist nur bei den 1061 montierten Bauteilen gesetzt (2026-05-04 bis 2026-10-20), bei den 385 unmontierten leer. Das Modell nutzt `InstallationDate` also noch als Ist-Datum und nicht als Soll-Datum für alle Bauteile.
- Vorabtest des Agents mit ifctester 0.9.0 (IfcOpenShell 0.8.5), IDS dabei gegen das IDS-1.0-Schema validiert:
  - A1 InstallationDate: 385 Elemente durchgefallen, genau die unmontierten mit leerem Datum.
  - A1 IsInstalled: 0 durchgefallen.
  - A2 AcceptanceDate (Format): 0 durchgefallen (überall leer).
  - ifctester zählt bei `IfcWall` auch `IfcWallStandardCase` mit (58 statt 13), darum 1491 statt 1446 geprüfte Fälle pro Regelgruppe. ifclite zählt ohne Subtypen.
- Negativtest auf einer Kopie des Modells (nicht im Repo): `IsInstalled` als Text „ja“ (GlobalId `0ahmh31Gj03RaIKrCwgzDC`), `IsInstalled` entfernt (`0ahmh31Gj03RaIKrCwgzDD`) und `AcceptanceDate` = `3.9.2026` (`0lyEh4MQj5dfRBgL_Q5SWN`) wurden alle drei erkannt.
- Positiver Testfall (muss bestehen): GlobalId `0B2YGPanTBc9mM6oEg4jTv` (IfcFooting), `InstallationDate` = `2026-05-04`, `IsInstalled` = TRUE.
- Negativer Testfall (fällt durch): GlobalId `0lyEh4MQj5dfRBgL_Q5SWN` (IfcColumn), `IsInstalled` = FALSE, `InstallationDate` leer.
- Ausstehend: Lauf in https://www.ifclite.com durch das Team, Resultate in `results/` ablegen.
- Hinweis Validator: `Pset_InstallationOccurrence` existiert erst in IFC 4.3 (ifclite warnte beim alten Lauf `W_IFC_PSET_RESERVED_PREFIX`). `IsInstalled` ist zusätzlich keine Standard-Property dieses Psets; der Name entspricht der Vorgabe im Modell.
- Was die Regel nicht prüft:
  - Ob das Datum im Kalender existiert: das Pattern lässt z. B. `2027-02-30` durch.
  - Ob `InstallationDate` dem Terminplan entspricht und nach der Übergabe unverändert bleibt.
  - Den Wert von `IsInstalled` (TRUE oder FALSE sind beide gültig).
  - „`AcceptanceDate` nur bei `IsInstalled` = TRUE“ und „nicht in der Zukunft“ (eigene Prüflogik, Anforderung 2), ebenso den Verzug (Anforderung 3).
  - Klassen, die im Modell nicht vorkommen (z. B. `IfcStair`, `IfcRailing`): IDS 1.0 prüft beim Entity-Facet keine Subtypen von `IfcElement`, darum ist jede Klasse einzeln aufgeführt. Kommt eine neue Klasse ins Modell, muss eine Regel ergänzt werden.
  - Jede Regel verlangt mindestens ein Objekt der Klasse (`minOccurs="1"`); fehlt eine Klasse im Modell, schlägt die Regel fehl, obwohl kein Bauteil fehlerhaft ist.

## IDS-Light / YAML
Quelle auch als Datei: [a1_baufortschritt.yaml](a1_baufortschritt.yaml). In https://www.idslight.com einfügen, XML kopieren und als `requirements/a1_baufortschritt.ids` speichern.

```yaml
# IDS-Light-Quelle für Anforderung 1 (und Formatteil von Anforderung 2)
# Editor: https://www.idslight.com  ->  XML kopieren als a1_baufortschritt.ids
#
# Geltungsbereich laut MVP: alle IfcElement ohne IfcOpeningElement.
# IDS 1.0 prüft beim Entity-Facet nur die genannte Klasse (keine Subtypen) und
# IDS-Light kennt weder Klassenlisten noch YAML-Anker. Darum eine Regel pro
# Bauteilklasse, die im Modell vorkommt (9 Klassen, 1446 Elemente).
#
# Datum als IfcLabel (IFC2X3 kennt kein IfcDate), Format YYYY-MM-DD per Pattern.
# Das Pattern ist ein XSD-Regex: implizit verankert, darum ohne ^ und $.
# IsInstalled als boolean (-> IFCBOOLEAN).

ids:
  title: "Baufortschritt - Soll-Installationsdatum, Montagestatus und Abnahmedatum"
  description: "Anforderung 1: InstallationDate (Soll-Datum gemäss Terminplan) vorhanden und im Format YYYY-MM-DD; IsInstalled vorhanden und IfcBoolean. Anforderung 2 (nur Format): AcceptanceDate, falls gesetzt, im Format YYYY-MM-DD."
  date: "2026-10-22"
  ifcVersion: "IFC2X3"
  rules:
    # ---------- Anforderung 1a: InstallationDate (Soll gemäss Terminplan) erfasst ----------
    - name: "A1 InstallationDate - IfcBeam"
      entity: "IfcBeam"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Soll-Datum der Installation gemäss Terminplan im Format YYYY-MM-DD; wird nach der Übergabe nicht verändert"
    - name: "A1 InstallationDate - IfcColumn"
      entity: "IfcColumn"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Soll-Datum der Installation gemäss Terminplan im Format YYYY-MM-DD; wird nach der Übergabe nicht verändert"
    - name: "A1 InstallationDate - IfcSlab"
      entity: "IfcSlab"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Soll-Datum der Installation gemäss Terminplan im Format YYYY-MM-DD; wird nach der Übergabe nicht verändert"
    - name: "A1 InstallationDate - IfcWall"
      entity: "IfcWall"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Soll-Datum der Installation gemäss Terminplan im Format YYYY-MM-DD; wird nach der Übergabe nicht verändert"
    - name: "A1 InstallationDate - IfcWallStandardCase"
      entity: "IfcWallStandardCase"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Soll-Datum der Installation gemäss Terminplan im Format YYYY-MM-DD; wird nach der Übergabe nicht verändert"
    - name: "A1 InstallationDate - IfcFooting"
      entity: "IfcFooting"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Soll-Datum der Installation gemäss Terminplan im Format YYYY-MM-DD; wird nach der Übergabe nicht verändert"
    - name: "A1 InstallationDate - IfcReinforcingBar"
      entity: "IfcReinforcingBar"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Soll-Datum der Installation gemäss Terminplan im Format YYYY-MM-DD; wird nach der Übergabe nicht verändert"
    - name: "A1 InstallationDate - IfcElementAssembly"
      entity: "IfcElementAssembly"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Soll-Datum der Installation gemäss Terminplan im Format YYYY-MM-DD; wird nach der Übergabe nicht verändert"
    - name: "A1 InstallationDate - IfcBuildingElementProxy"
      entity: "IfcBuildingElementProxy"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Soll-Datum der Installation gemäss Terminplan im Format YYYY-MM-DD; wird nach der Übergabe nicht verändert"

    # ---------- Anforderung 1b: IsInstalled (Montagestatus) erfasst ----------
    # Projektspezifische Property im Pset_InstallationOccurrence (so im Modell geliefert),
    # nicht Teil von IFC 4.3. Der Wert (TRUE/FALSE) wird nicht eingeschränkt.
    - name: "A1 IsInstalled - IfcBeam"
      entity: "IfcBeam"
      properties:
        - name: "Pset_InstallationOccurrence.IsInstalled"
          datatype: "boolean"
          presence: "required"
          instructions: "Montagestatus: initial FALSE (Modellautor), TRUE sobald der Polier die Montage meldet"
    - name: "A1 IsInstalled - IfcColumn"
      entity: "IfcColumn"
      properties:
        - name: "Pset_InstallationOccurrence.IsInstalled"
          datatype: "boolean"
          presence: "required"
          instructions: "Montagestatus: initial FALSE (Modellautor), TRUE sobald der Polier die Montage meldet"
    - name: "A1 IsInstalled - IfcSlab"
      entity: "IfcSlab"
      properties:
        - name: "Pset_InstallationOccurrence.IsInstalled"
          datatype: "boolean"
          presence: "required"
          instructions: "Montagestatus: initial FALSE (Modellautor), TRUE sobald der Polier die Montage meldet"
    - name: "A1 IsInstalled - IfcWall"
      entity: "IfcWall"
      properties:
        - name: "Pset_InstallationOccurrence.IsInstalled"
          datatype: "boolean"
          presence: "required"
          instructions: "Montagestatus: initial FALSE (Modellautor), TRUE sobald der Polier die Montage meldet"
    - name: "A1 IsInstalled - IfcWallStandardCase"
      entity: "IfcWallStandardCase"
      properties:
        - name: "Pset_InstallationOccurrence.IsInstalled"
          datatype: "boolean"
          presence: "required"
          instructions: "Montagestatus: initial FALSE (Modellautor), TRUE sobald der Polier die Montage meldet"
    - name: "A1 IsInstalled - IfcFooting"
      entity: "IfcFooting"
      properties:
        - name: "Pset_InstallationOccurrence.IsInstalled"
          datatype: "boolean"
          presence: "required"
          instructions: "Montagestatus: initial FALSE (Modellautor), TRUE sobald der Polier die Montage meldet"
    - name: "A1 IsInstalled - IfcReinforcingBar"
      entity: "IfcReinforcingBar"
      properties:
        - name: "Pset_InstallationOccurrence.IsInstalled"
          datatype: "boolean"
          presence: "required"
          instructions: "Montagestatus: initial FALSE (Modellautor), TRUE sobald der Polier die Montage meldet"
    - name: "A1 IsInstalled - IfcElementAssembly"
      entity: "IfcElementAssembly"
      properties:
        - name: "Pset_InstallationOccurrence.IsInstalled"
          datatype: "boolean"
          presence: "required"
          instructions: "Montagestatus: initial FALSE (Modellautor), TRUE sobald der Polier die Montage meldet"
    - name: "A1 IsInstalled - IfcBuildingElementProxy"
      entity: "IfcBuildingElementProxy"
      properties:
        - name: "Pset_InstallationOccurrence.IsInstalled"
          datatype: "boolean"
          presence: "required"
          instructions: "Montagestatus: initial FALSE (Modellautor), TRUE sobald der Polier die Montage meldet"

    # ---------- Anforderung 2 (nur Format): AcceptanceDate, falls gesetzt ----------
    # "nur wenn IsInstalled = TRUE" und "nicht in der Zukunft" sind im IDS nicht
    # prüfbar und folgen in der eigenen Prüflogik.
    - name: "A2 AcceptanceDate - IfcBeam"
      entity: "IfcBeam"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme durch die Bauleitung, falls gesetzt, im Format YYYY-MM-DD"
    - name: "A2 AcceptanceDate - IfcColumn"
      entity: "IfcColumn"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme durch die Bauleitung, falls gesetzt, im Format YYYY-MM-DD"
    - name: "A2 AcceptanceDate - IfcSlab"
      entity: "IfcSlab"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme durch die Bauleitung, falls gesetzt, im Format YYYY-MM-DD"
    - name: "A2 AcceptanceDate - IfcWall"
      entity: "IfcWall"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme durch die Bauleitung, falls gesetzt, im Format YYYY-MM-DD"
    - name: "A2 AcceptanceDate - IfcWallStandardCase"
      entity: "IfcWallStandardCase"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme durch die Bauleitung, falls gesetzt, im Format YYYY-MM-DD"
    - name: "A2 AcceptanceDate - IfcFooting"
      entity: "IfcFooting"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme durch die Bauleitung, falls gesetzt, im Format YYYY-MM-DD"
    - name: "A2 AcceptanceDate - IfcReinforcingBar"
      entity: "IfcReinforcingBar"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme durch die Bauleitung, falls gesetzt, im Format YYYY-MM-DD"
    - name: "A2 AcceptanceDate - IfcElementAssembly"
      entity: "IfcElementAssembly"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme durch die Bauleitung, falls gesetzt, im Format YYYY-MM-DD"
    - name: "A2 AcceptanceDate - IfcBuildingElementProxy"
      entity: "IfcBuildingElementProxy"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme durch die Bauleitung, falls gesetzt, im Format YYYY-MM-DD"
```

## KI_USAGE
| Werkzeug | Wofür? | Was übernommen? | Wie geprüft? |
|---|---|---|---|
| Claude Code (Opus 5.5) | Matrix für die drei Anforderungen aus dem MVP ausgefüllt, IDS-Light-YAML für Anforderung 1 (plus Formatteil Anforderung 2) erstellt | Einträge in der Matrix (Vorschläge in „…“), YAML-Regeln pro Bauteilklasse und Liste „Was die Regel nicht prüft“ | Bauteilklassen mit IfcOpenShell aus dem Testmodell ausgelesen; Ausschnitt der YAML in idslight.com konvertiert (gültig, IFC2X3, IFCLABEL, Pattern). Vorschläge in „…“ geprüft. |
| Claude Code (Opus 5.5) | Prüfung der vom Studenten ergänzten Resultate, Abgleich des ifclite-Reports mit `checks/loesung.csv` | Korrigierte Resultate getrennt nach A1/A2, korrigierte GlobalId des positiven Testfalls, neuer negativer Testfall für A1, Hinweise zu Testmodell, Blindtest und Validator-Warnung | JSON-Export von ifclite per Skript mit `loesung.csv` verglichen (37 von 37 übereinstimmend); GlobalIds im Modell nachgeschlagen. Erwartung vor dem Lauf bestätigt. |
| Claude Code (Opus 5.5) | Matrix, YAML und IDS an den neuen Prozess angepasst (`InstallationDate` = Soll-Datum, `IsInstalled` durch Polier, `AcceptanceDate` durch Bauleitung) und auf das Modell des Dozenten umgestellt | Neue Anforderungen 1–3, Statustabelle, 27 IDS-Regeln, Befund zum Modell; altes IDS nach `archiv/` verschoben | IDS mit ifctester gegen das IDS-1.0-Schema und das Modell geprüft (385 Fehler bei `InstallationDate`, sonst keine), Negativtest mit drei absichtlich fehlerhaften Werten. Ausstehend: Lauf in ifclite durch das Team. |
