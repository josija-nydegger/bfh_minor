# Anleitung Baufortschritt-Check

Der Baufortschritt-Check ist das Werkzeug der Bauleitung für die Baukontrolle. Er liest ein IFC-Modell, prüft die drei Anforderungen aus der [AIA-BEP-Matrix](../../requirements/aia-bep-matrix.md) und zeigt pro Bauteil, was geplant, überfällig, montiert, abgenommen oder fehlerhaft ist. Das Modell wird nicht verändert.

Es gibt zwei Varianten mit derselben Prüflogik:

| Datei | Wo | Ergebnis |
|---|---|---|
| [`Baufortschritt-Check.html`](Baufortschritt-Check.html) | im Browser, ohne Installation | Übersicht, Bauteilliste, CSV, Bericht als PDF |
| [`baufortschritt.js`](baufortschritt.js) | als Skript in https://www.ifclite.com | Übersicht im Output-Fenster, Bauteile im 3D-Modell eingefärbt, CSV |

## Einordnung im Soll-Prozess

Siehe [MVP](../../MVP/MVP%20definitive%20Themenwahl.md), Abschnitt 3:

1. Der Modellautor setzt `InstallationDate` (Soll-Datum gemäss Terminplan) und `IsInstalled` = FALSE.
2. Der Polier setzt bei der Montage `IsInstalled` = TRUE ([Polier-Tool](../polier-tool/Anleitung.md)). Seine Rückmeldung wird mit `csv_ins_ifc.py` ins Modell übernommen.
3. **Die Bauleitung prüft mit dem Baufortschritt-Check** und setzt nach der Kontrolle `AcceptanceDate`.

Der Check liest nur das IFC-Modell, nicht das CSV des Poliers. Damit die Rückmeldungen des Poliers berücksichtigt werden, muss zuerst das zurückgeführte Modell (`<modell>_rueckgemeldet_<datum>.ifc`) erstellt und dieses geladen werden (siehe [Zusammenspiel](#zusammenspiel-mit-dem-polier-tool)).

Das Setzen von `AcceptanceDate` deckt der Check nicht ab. Dieser Schritt ist noch offen (siehe Matrix, Abschnitt «Werkzeuge»).

## Voraussetzungen

- Aktueller Browser (Chrome, Edge, Safari oder Firefox), am besten auf dem Computer.
- IFC-Modell als `.ifc` (nicht `.ifczip` oder `.ifcxml`) mit `Pset_InstallationOccurrence` pro Bauteil. Getestet mit IFC2X3.
- Internetverbindung nur für die Schriften (Google Fonts). Ohne Internet funktioniert der Check trotzdem, die Seite sieht dann mit Ersatzschriften etwas anders aus.

## HTML-Variante

### Starten

1. `Baufortschritt-Check.html` im Browser öffnen (Doppelklick).
2. Beim Start ist ein Beispielmodell geladen («Wohnhaus Lindenweg», 20 Bauteile mit allen Status). Es dient nur zur Veranschaulichung.
3. IFC-Datei in das Feld ziehen oder auf das Feld klicken und die Datei wählen. Die Datei wird nur lokal gelesen und nicht hochgeladen.
4. **Prüfdatum (Stichtag)** wählen. Standard ist heute, **Auf heute setzen** springt zurück. Bei einer Änderung wird sofort neu geprüft.

### Ansicht

- **Kopf:** Bauvorhaben, Modell, Prüfdatum und Anzahl geprüfter Bauteile.
- **Übersicht:** Anteil montiert und abgenommen, Balken nach Status. Ein Klick auf einen Status filtert die Bauteilliste.
- **Was ist zu tun?** Offene Pendenzen nach Rolle:
  - Polier: überfällige Montagen mit dem grössten Verzug
  - Bauleitung: offene Abnahmen
  - Modellautor: Bauteile mit Datenfehlern
- **Soll-Montagen pro Woche:** Bauteile pro Woche gemäss `InstallationDate`, eingefärbt nach Status, mit Markierung des Prüfdatums.
- **Die drei Anforderungen:** Resultat pro Anforderung (erfüllt / nicht erfüllt, Anzahl).
- **Fortschritt nach Geschoss**
- **Bauteilliste:** Filter nach Status, Suche nach Name, Geschoss oder GlobalId. Ein Klick auf die GlobalId kopiert sie.
- **Wie wird der Status bestimmt?** Aufklappbare Regeltabelle direkt im Tool.

### Ergebnis sichern

- **Liste als Excel-Datei (CSV):** alle Bauteile, Dateiname `Baufortschritt_<Modell>_<Prüfdatum>.csv`, für den Ordner `results/`.
- **Liste kopieren:** Tabelle in die Zwischenablage, zum Einfügen in Excel.
- **Bericht drucken / als PDF:** die ganze Seite mit allen Bauteilen und Prüfprotokoll (Modell, Schema, Prüfdatum, Anzahl, Zeitpunkt, Version).

## ifclite-Variante

1. https://www.ifclite.com öffnen und das Modell laden.
2. **Analyze → Script Editor → Import script file** und `baufortschritt.js` wählen.
3. Optional oben im Skript `PRUEFDATUM` setzen (z. B. `'2026-10-27'`), damit der Lauf wiederholbar ist. Leer = heute.
4. **Run.**

Ergebnis: Übersicht im Output-Fenster (Status, Pendenzen nach Rolle, drei Anforderungen, Datenfehler nach Art, die zehn grössten Verzüge), Einfärbung im 3D-Modell und Download `Baufortschritt_<Prüfdatum>.csv`. Mit `CSV_SPEICHERN = false` wird kein CSV heruntergeladen.

Farben: rot = Montage überfällig, violett = Daten fehlerhaft, gelb = Abnahme ausstehend, grau = geplant, grün = abgenommen.

## Prüfregeln

Geprüft werden alle `IfcElement` ausser Öffnungen (`IfcOpeningElement`).

| `InstallationDate` | `IsInstalled` | `AcceptanceDate` | Status | Pendenz |
|---|---|---|---|---|
| nach dem Prüfdatum | FALSE | leer | Geplant | – |
| am oder vor dem Prüfdatum | FALSE | leer | Montage überfällig | Polier |
| beliebig | TRUE | leer | Abnahme ausstehend | Bauleitung |
| beliebig | TRUE | gesetzt | Abgenommen | – |
| beliebig | FALSE | gesetzt | Daten fehlerhaft | Modellautor / Bauleitung |
| leer oder ungültig | beliebig | beliebig | Daten fehlerhaft | Modellautor |

Zusätzlich gilt als «Daten fehlerhaft»:

- `Pset_InstallationOccurrence` fehlt
- `IsInstalled` fehlt, ist leer oder kein `IfcBoolean`
- `AcceptanceDate` ist kein gültiges Datum (`YYYY-MM-DD`) oder liegt nach dem Prüfdatum

Nur ein Hinweis, kein Fehler: `AcceptanceDate` vor dem `InstallationDate` (vorzeitig montiert).

Verzug in Tagen = Prüfdatum − `InstallationDate`, nur für nicht montierte Bauteile.

### CSV-Spalten

`GlobalId`, `Bauteil`, `IFC-Klasse`, `Geschoss`, `Soll-Datum (InstallationDate)`, `Montiert (IsInstalled)` (Ja/Nein), `Abnahme (AcceptanceDate)`, `Status`, `Verzug (Tage)`, `Anforderung` (welche Anforderung verletzt ist), `Grund / Hinweis`, `Prüfdatum`.

Trennzeichen `;`, UTF-8 mit BOM. Sortiert nach Dringlichkeit, überfällige Bauteile mit dem grössten Verzug zuerst.

## Zusammenspiel mit dem Polier-Tool

| Schritt | Wer | Werkzeug | Ergebnis |
|---|---|---|---|
| 1 | Polier | [Polier-Tool](../polier-tool/Anleitung.md): montierte Bauteile melden, **CSV: nur Änderungen** | `<Modell>_IsInstalled_aenderungen_<Stichtag>.csv` |
| 2 | Bauleitung (oder BIM-Koordination) | `python apps/polier-tool/csv_ins_ifc.py <modell>.ifc <rueckmeldung>.csv` | `<modell>_rueckgemeldet_<datum>.ifc` und Protokoll |
| 3 | Bauleitung | Baufortschritt-Check mit dem Modell aus Schritt 2 und demselben Stichtag | Übersicht, Pendenzen, CSV / PDF für `results/` |
| 4 | Bauleitung | Abnahme vor Ort, `AcceptanceDate` setzen | noch offen, kein Werkzeug |

Beide Tools wenden dieselbe Statustabelle an, also dieselbe Regel für «überfällig» (`InstallationDate` ≤ Stichtag und `IsInstalled` = FALSE). Bei gleichem Modell und gleichem Stichtag stimmen die Zahlen überein. Am Team-4-Modell wurde das nachgerechnet. Unterschiede gibt es nur bei den Bezeichnungen und bei den Fehlerprüfungen:

| Polier-Tool (Anzeige) | Polier-Tool (CSV) | Baufortschritt-Check |
|---|---|---|
| Später geplant | geplant | Geplant |
| Heute fällig / Überfällig | Montage überfällig | Montage überfällig |
| Montiert | Abnahme ausstehend | Abnahme ausstehend |
| Abgenommen | abgenommen | Abgenommen |
| Fehler | Fehler | Daten fehlerhaft |

Der Baufortschritt-Check prüft `AcceptanceDate` strenger als das Polier-Tool: Datumsformat und «nicht nach dem Prüfdatum» prüft nur er. Ein Bauteil kann darum im Check «Daten fehlerhaft» sein und im Polier-Tool «Abgenommen».

## Grenzen

- **Nur lesen:** Der Check verändert das IFC-Modell nicht. Er setzt weder `IsInstalled` noch `AcceptanceDate`.
- **Kein Ist-Datum:** Weil `InstallationDate` das Soll-Datum bleibt, wird der Verzug nur für noch nicht montierte Bauteile berechnet.
- **Externe Schriften:** Die HTML-Variante lädt Schriften von Google Fonts. Dabei wird die IP-Adresse an Google übermittelt, nicht aber das Modell.
- **Klassen:** Die HTML-Variante prüft alle Unterklassen von `IfcElement` aus einer im Tool hinterlegten Liste, das ifclite-Skript alle `IfcElement`. Das IDS führt dagegen jede Klasse einzeln auf (siehe Matrix).
