| # | Anforderung | Zweck | Meilenstein | Objekte (IFC-Klasse) | Property / Quantity (mit Pset) | erlaubte Werte / Datentyp | Prüfmethode | Verantwortlich | Quelle |
|---|---|---|---|---|---|---|---|---|---|
| Beispiel | Türen haben eine Feuerwiderstandsklasse | Brandschutznachweis | Ende Phase 32 | IfcDoor | Pset_DoorCommon.FireRating | IfcLabel: EI30, EI60, EI90, „keine Anforderung“ | IDS-Check + Stichprobe | Modellautor ARC / BIM-Koordinator | AHB-EIR S. 10/48 → Elementplan |
| 1 | Installationsdatum bei jedem Element erfasst | Montagefortschritt überwachen, Status pro Bauteil ableiten (geplant / Abnahme ausstehend) | „Initial bei Übergabe Ausführungsmodell vor Baubeginn (Phase 52), danach laufend bei jeder Montage-Rückmeldung“ | IfcElement ohne IfcOpeningElement (im Testmodell 9 Klassen: IfcBeam, IfcColumn, IfcSlab, IfcWall, IfcWallStandardCase, IfcFooting, IfcReinforcingBar, IfcElementAssembly, IfcBuildingElementProxy) | Pset_InstallationOccurrence.InstallationDate | IfcLabel (IFC2X3), Format YYYY-MM-DD; Pflicht (in IFC 4.3: IfcDate) | IDS-Check (a1_installationsdatum.ids) + Stichprobe im Viewer | Initial: „Modellautor TWP / BIM-Koordinator gemäss Terminplan“; Aktualisierung: Polier | IFC 4.3 Pset_InstallationOccurrence; MVP Abschnitt 3 (Prozess Schritte 1–2) |
| 2 | Abnahmedatum plausibel | Abnahmen erfassen, ausstehende Abnahmen als Pendenz der Bauleitung erkennen | „Laufend nach jeder Abnahme; vollständig spätestens zur Bauabnahme (Phase 53)“ | IfcElement ohne IfcOpeningElement (im Testmodell 9 Klassen: IfcBeam, IfcColumn, IfcSlab, IfcWall, IfcWallStandardCase, IfcFooting, IfcReinforcingBar, IfcElementAssembly, IfcBuildingElementProxy) | Pset_InstallationOccurrence.AcceptanceDate (verglichen mit Pset_InstallationOccurrence.InstallationDate) | IfcLabel, Format YYYY-MM-DD; optional (leer = noch nicht abgenommen); falls gesetzt: ≥ InstallationDate und ≤ Prüfdatum | IDS-Check (nur Format) + eigene Prüflogik (Python/IfcOpenShell, Datumsvergleich) | Bauleitung | IFC 4.3 Pset_InstallationOccurrence; Projektregel „Abnahme folgt auf Montage“ (MVP Abschnitt 3, Schritt 3) |
| 3 | Installationsdatum mit Terminplan abgeglichen | Terminabweichungen und Verzug erkennen | „Laufend, z. B. wöchentlich vor der Bausitzung“ | IfcElement ohne IfcOpeningElement (im Testmodell 9 Klassen: IfcBeam, IfcColumn, IfcSlab, IfcWall, IfcWallStandardCase, IfcFooting, IfcReinforcingBar, IfcElementAssembly, IfcBuildingElementProxy) | Pset_InstallationOccurrence.InstallationDate + Soll-Termin aus Terminplan (pro GlobalId, ausserhalb des Modells) | Jede GlobalId hat einen Soll-Termin; Abweichung in Tagen (Integer), > 0 = Verzug | Eigene Prüflogik (Abgleich IFC ↔ „Terminplan als CSV“) | Bauleitung; Terminplan: „Bauleitung / Terminplaner“ | Terminplan; MVP Abschnitt 4 |

## Prüfbar gemacht: Anforderung Nr. 1
- Spezifikation: `a1_installationsdatum.yaml` / `a1_installationsdatum.ids` (XML aus idslight.com, noch zu erzeugen); enthält zusätzlich den Formatteil von Anforderung 2 (Regeln „A2 …“)
- Erwartung vor dem Lauf: … von 1446 Objekten bestehen (1585 `IfcElement` − 139 `IfcOpeningElement`)
- Resultat: … geprüft · … bestanden · … durchgefallen
- Positiver Testfall (muss bestehen): GlobalId …
- Negativer Testfall (muss durchfallen): GlobalId …
- Was die Regel nicht prüft:
  - Ob das Datum im Kalender existiert: das Pattern lässt z. B. `2027-02-30` durch.
  - Ob das Datum plausibel ist (Jahr, Bezug zum Terminplan); das folgt in Anforderung 3.
  - Klassen, die im Testmodell nicht vorkommen (z. B. `IfcStair`, `IfcRailing`): IDS 1.0 prüft beim Entity-Facet keine Subtypen von `IfcElement`, darum ist jede Klasse einzeln aufgeführt. Kommt eine neue Klasse ins Modell, muss eine Regel ergänzt werden.
  - Die Reihenfolge „AcceptanceDate nicht vor InstallationDate“ und „nicht in der Zukunft“ (eigene Prüflogik, Anforderung 2).
  - Jede Regel verlangt mindestens ein Objekt der Klasse (`minOccurs="1"`); fehlt eine Klasse im Modell, schlägt die Regel fehl, obwohl kein Bauteil fehlerhaft ist.

## IDS-Light / YAML
Quelle auch als Datei: [a1_installationsdatum.yaml](a1_installationsdatum.yaml). In https://www.idslight.com einfügen, XML kopieren und als `requirements/a1_installationsdatum.ids` speichern.

```yaml
# IDS-Light-Quelle für Anforderung 1 (und Formatteil von Anforderung 2)
# Editor: https://www.idslight.com  ->  XML kopieren als a1_installationsdatum.ids
#
# Geltungsbereich laut MVP: alle IfcElement ohne IfcOpeningElement.
# IDS 1.0 prüft beim Entity-Facet nur die genannte Klasse (keine Subtypen) und
# IDS-Light kennt weder Klassenlisten noch YAML-Anker. Darum eine Regel pro
# Bauteilklasse, die im Testmodell vorkommt (9 Klassen, 1446 Elemente).
#
# Datum als IfcLabel (IFC2X3 kennt kein IfcDate), Format YYYY-MM-DD per Pattern.
# Das Pattern ist ein XSD-Regex: implizit verankert, darum ohne ^ und $.

ids:
  title: "Baufortschritt - Installations- und Abnahmedatum"
  description: "Anforderung 1: InstallationDate vorhanden und im Format YYYY-MM-DD. Anforderung 2 (nur Format): AcceptanceDate, falls gesetzt, im Format YYYY-MM-DD."
  date: "2026-10-18"
  ifcVersion: "IFC2X3"
  rules:
    # ---------- Anforderung 1: InstallationDate erfasst ----------
    - name: "A1 InstallationDate - IfcBeam"
      entity: "IfcBeam"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Installation (bis zur Montage: geplantes Datum) im Format YYYY-MM-DD"
    - name: "A1 InstallationDate - IfcColumn"
      entity: "IfcColumn"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Installation (bis zur Montage: geplantes Datum) im Format YYYY-MM-DD"
    - name: "A1 InstallationDate - IfcSlab"
      entity: "IfcSlab"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Installation (bis zur Montage: geplantes Datum) im Format YYYY-MM-DD"
    - name: "A1 InstallationDate - IfcWall"
      entity: "IfcWall"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Installation (bis zur Montage: geplantes Datum) im Format YYYY-MM-DD"
    - name: "A1 InstallationDate - IfcWallStandardCase"
      entity: "IfcWallStandardCase"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Installation (bis zur Montage: geplantes Datum) im Format YYYY-MM-DD"
    - name: "A1 InstallationDate - IfcFooting"
      entity: "IfcFooting"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Installation (bis zur Montage: geplantes Datum) im Format YYYY-MM-DD"
    - name: "A1 InstallationDate - IfcReinforcingBar"
      entity: "IfcReinforcingBar"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Installation (bis zur Montage: geplantes Datum) im Format YYYY-MM-DD"
    - name: "A1 InstallationDate - IfcElementAssembly"
      entity: "IfcElementAssembly"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Installation (bis zur Montage: geplantes Datum) im Format YYYY-MM-DD"
    - name: "A1 InstallationDate - IfcBuildingElementProxy"
      entity: "IfcBuildingElementProxy"
      properties:
        - name: "Pset_InstallationOccurrence.InstallationDate"
          datatype: "string"
          presence: "required"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Installation (bis zur Montage: geplantes Datum) im Format YYYY-MM-DD"

    # ---------- Anforderung 2 (nur Format): AcceptanceDate, falls gesetzt ----------
    # "nicht vor InstallationDate" und "nicht in der Zukunft" sind im IDS nicht
    # prüfbar und folgen in der eigenen Prüflogik.
    - name: "A2 AcceptanceDate - IfcBeam"
      entity: "IfcBeam"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme, falls gesetzt, im Format YYYY-MM-DD"
    - name: "A2 AcceptanceDate - IfcColumn"
      entity: "IfcColumn"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme, falls gesetzt, im Format YYYY-MM-DD"
    - name: "A2 AcceptanceDate - IfcSlab"
      entity: "IfcSlab"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme, falls gesetzt, im Format YYYY-MM-DD"
    - name: "A2 AcceptanceDate - IfcWall"
      entity: "IfcWall"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme, falls gesetzt, im Format YYYY-MM-DD"
    - name: "A2 AcceptanceDate - IfcWallStandardCase"
      entity: "IfcWallStandardCase"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme, falls gesetzt, im Format YYYY-MM-DD"
    - name: "A2 AcceptanceDate - IfcFooting"
      entity: "IfcFooting"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme, falls gesetzt, im Format YYYY-MM-DD"
    - name: "A2 AcceptanceDate - IfcReinforcingBar"
      entity: "IfcReinforcingBar"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme, falls gesetzt, im Format YYYY-MM-DD"
    - name: "A2 AcceptanceDate - IfcElementAssembly"
      entity: "IfcElementAssembly"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme, falls gesetzt, im Format YYYY-MM-DD"
    - name: "A2 AcceptanceDate - IfcBuildingElementProxy"
      entity: "IfcBuildingElementProxy"
      properties:
        - name: "Pset_InstallationOccurrence.AcceptanceDate"
          datatype: "string"
          presence: "optional"
          pattern: "[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
          instructions: "Datum der Abnahme, falls gesetzt, im Format YYYY-MM-DD"
```

## KI_USAGE
| Werkzeug | Wofür? | Was übernommen? | Wie geprüft? |
|---|---|---|---|
| Claude Code (Opus 5.5) | Matrix für die drei Anforderungen aus dem MVP ausgefüllt, IDS-Light-YAML für Anforderung 1 (plus Formatteil Anforderung 2) erstellt | Einträge in der Matrix (Vorschläge in „…“), YAML-Regeln pro Bauteilklasse und Liste „Was die Regel nicht prüft“ | Bauteilklassen mit IfcOpenShell aus dem Testmodell ausgelesen; Ausschnitt der YAML in idslight.com konvertiert (gültig, IFC2X3, IFCLABEL, Pattern). Ausstehend: Vorschläge in „…“ prüfen, XML erzeugen und gegen das Modell testen. |
