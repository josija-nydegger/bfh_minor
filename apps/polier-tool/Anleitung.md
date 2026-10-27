# Anleitung Polier-Tool

Mit dem Polier-Tool sieht der Polier, welche Bauteile heute montiert werden sollen und welche überfällig sind, und meldet montierte Bauteile zurück. Er setzt dabei nur `IsInstalled`. Die Rückmeldung wird als CSV exportiert.

Das Tool deckt nur den Teil des Poliers im Soll-Prozess ab (siehe [MVP](../../MVP/MVP%20definitive%20Themenwahl.md), Abschnitt 3):

1. Der Modellautor setzt `InstallationDate` (Soll-Datum gemäss Terminplan) und `IsInstalled` = FALSE.
2. **Der Polier setzt bei der Montage `IsInstalled` = TRUE (dieses Tool).**
3. Die Bauleitung prüft per Skript und setzt nach der Kontrolle `AcceptanceDate`.

## Voraussetzungen

- Aktueller Browser (Chrome, Edge, Safari oder Firefox), auf dem Handy, Tablet oder Computer.
- Internetverbindung: Das Tool lädt die Bibliotheken three.js (3D) und web-ifc (IFC lesen) von einem CDN. Schriften werden keine geladen.
- IFC-Modell (IFC2X3, getestet; IFC4 sollte ebenfalls funktionieren) mit `Pset_InstallationOccurrence` pro Bauteil:

| Property | Datentyp | Bedeutung im Tool |
|---|---|---|
| `InstallationDate` | `IfcLabel`, Format `YYYY-MM-DD` | Soll-Datum, nur angezeigt |
| `IsInstalled` | `IfcBoolean` | Montagestatus, wird vom Polier gesetzt |
| `AcceptanceDate` | `IfcLabel`, Format `YYYY-MM-DD` | Abnahme durch die Bauleitung, nur angezeigt |

## Starten

1. `Polier-Tool.html` im Browser öffnen (Doppelklick).
2. **IFC-Datei wählen** oder die Datei in das Feld ziehen.

Die Datei wird nur lokal im Browser gelesen und nicht hochgeladen. Mit **Datei** in der Kopfleiste lässt sich ein anderes Modell laden.

Läuft das Tool über einen Webserver, kann das Modell auch per URL geladen werden: `Polier-Tool.html?ifc=pfad/zum/modell.ifc`.

## Bedienung

- **Stichtag:** Oben in der Mitte, Standard ist heute. Mit ‹ und › einen anderen Tag wählen, ein Tipp auf das Datum springt zurück zu heute.
- **Filter:** Mit den Chips zwischen den Ansichten wechseln:
  - **Heute:** Bauteile mit Soll-Datum am Stichtag, die noch nicht montiert sind.
  - **Überfällig:** Soll-Datum vor dem Stichtag, noch nicht montiert; in der Liste mit Verzug in Tagen.
  - **Montiert:** `IsInstalled` = TRUE, inklusive abgenommener Bauteile.
  - **Fehler:** nur sichtbar, wenn das Modell Fehler enthält (siehe unten).
  - **Alle**
- **Geschoss:** Die Auswahl unter den Chips schränkt Liste und 3D-Ansicht auf ein Geschoss ein.
- **3D-Ansicht:** Mit einem Finger drehen, mit zwei Fingern zoomen und verschieben. Ein Bauteil antippen öffnet die Detailansicht. Die Farben entsprechen der Legende unten links.
- **Detailansicht:** Zeigt die Werte aus `Pset_InstallationOccurrence`. **Isoliert** blendet die übrigen Bauteile aus, **Zoom** fährt auf das Bauteil, ‹ und › blättern durch die Liste.

### Montage melden

- **✓ Als montiert melden** setzt `IsInstalled` = TRUE.
- **Rückgängig** setzt den Wert wieder auf FALSE.
- **Alle … angezeigten als montiert melden:** In den Ansichten «Heute» und «Überfällig» lassen sich alle angezeigten Bauteile auf einmal melden, z. B. ein ganzes Geschoss. Der Knopf fragt vor dem Ausführen nach.
- **Abgenommene Bauteile** (mit `AcceptanceDate`) sind gesperrt. Ihren Status kann nur die Bauleitung ändern.
- **Baugruppen** (z. B. `IfcElementAssembly`) haben keine eigene Geometrie. In 3D werden ihre Teile hervorgehoben.

Das `InstallationDate` (Soll-Datum) wird nie verändert, und das Tool erfasst kein Ist-Datum.

## Status

Das Tool leitet den Status pro Bauteil aus den drei Properties und dem Stichtag ab. Die CSV-Spalte `Status` verwendet die Begriffe der Statustabelle im MVP.

| Anzeige im Tool | Bedingung | `Status` im CSV |
|---|---|---|
| Später geplant | `InstallationDate` nach dem Stichtag, `IsInstalled` = FALSE | geplant |
| Heute fällig | `InstallationDate` = Stichtag, `IsInstalled` = FALSE | Montage überfällig (Verzug 0 Tage) |
| Überfällig | `InstallationDate` vor dem Stichtag, `IsInstalled` = FALSE | Montage überfällig |
| Montiert | `IsInstalled` = TRUE, `AcceptanceDate` leer | Abnahme ausstehend |
| Abgenommen | `IsInstalled` = TRUE, `AcceptanceDate` gesetzt | abgenommen |
| Fehler | `InstallationDate` fehlt oder ist kein gültiges Datum, `IsInstalled` fehlt, oder `AcceptanceDate` gesetzt ohne Montage | Fehler |

Fehlerhafte Bauteile kann der Polier trotzdem als montiert melden. Die Ursache steht in der Liste und in der Detailansicht und sollte dem Modellautor gemeldet werden.

## Speichern und Export

- **Speichern:** Rückmeldungen werden automatisch im Browser gespeichert (`localStorage`). Lädt man dieselbe Datei wieder, werden sie übernommen. Gespeichert wird pro Dateiname und Dateigrösse, nur auf diesem Gerät und in diesem Browser.
- **Export:** öffnet die Tabelle mit einer Zeile pro `GlobalId`; geänderte Zeilen sind grün.
  - **CSV: nur Änderungen:** nur die Bauteile, bei denen der Polier `IsInstalled` geändert hat. Das ist die eigentliche Rückmeldung.
  - **CSV: alle Bauteile:** der ganze Stand am Stichtag.
  - **Änderungen verwerfen:** löscht alle gespeicherten Rückmeldungen für dieses Modell (mit Rückfrage).

Dateiname: `<Modell>_IsInstalled_<aenderungen|alle>_<Stichtag>.csv`. Trennzeichen `;`, Kodierung UTF-8 mit BOM, damit Excel Umlaute richtig anzeigt.

| Spalte | Inhalt |
|---|---|
| `GlobalId` | Verknüpfung zum Bauteil im IFC-Modell |
| `IfcKlasse`, `Name`, `Geschoss` | zur Orientierung |
| `InstallationDate` | Soll-Datum aus dem Modell (unverändert) |
| `IsInstalled` | `TRUE` / `FALSE` nach der Rückmeldung (leer, wenn im Modell nicht vorhanden) |
| `AcceptanceDate` | aus dem Modell (unverändert) |
| `Status` | Status gemäss MVP am Stichtag |
| `VerzugTage` | Stichtag − `InstallationDate` bei nicht montierten Bauteilen mit Soll-Datum am oder vor dem Stichtag |
| `Stichtag` | Datum, auf das sich `Status` und `VerzugTage` beziehen |
| `GeaendertDurchPolier` | `ja`, wenn der Polier `IsInstalled` geändert hat |

## Rückführung ins IFC-Modell

Das Skript [`csv_ins_ifc.py`](csv_ins_ifc.py) übernimmt die Rückmeldung aus dem CSV ins Modell (Python mit IfcOpenShell):

```bash
python apps/polier-tool/csv_ins_ifc.py model/<modell>.ifc <rueckmeldung>.csv [weitere.csv ...]
```

- **Übernommene Werte:** nur `Pset_InstallationOccurrence.IsInstalled` als `IfcBoolean`. `InstallationDate` und `AcceptanceDate` bleiben unverändert. Standardmässig werden nur Zeilen mit `GeaendertDurchPolier` = `ja` übernommen; mit `--alle` alle Zeilen.
- **Mehrere CSV:** Rückmeldungen mehrerer Poliere lassen sich in einem Lauf übernehmen.
- **Ergebnis:** Ein neues Modell `<modell>_rueckgemeldet_<datum>.ifc`, das Eingabemodell bleibt unverändert. Mit `-o` lässt sich ein anderes Ziel angeben. Daneben entsteht ein Protokoll `…_protokoll.csv` mit altem und neuem Wert pro `GlobalId`.
- **Übersprungen und im Protokoll vermerkt** werden:
  - `GlobalId` nicht im Modell
  - ungültiger Wert (weder `TRUE` noch `FALSE`)
  - widersprüchliche Angaben in mehreren CSV
  - `FALSE` für ein bereits abgenommenes Bauteil
- **Nur Hinweis:** Weicht das `InstallationDate` im CSV vom Modell ab (CSV aus einer anderen Modellversion), wird der Wert trotzdem gesetzt und die Abweichung im Protokoll vermerkt.
- **Fehlendes Pset oder fehlende Property:** wird angelegt.

## Grenzen

- **Keine Änderung am IFC durch das Tool selbst:** Das Tool schreibt nicht ins Modell. Die Rückführung erfolgt mit `csv_ins_ifc.py` (siehe oben).
- **Kein Abgleich zwischen Geräten:** Rückmeldungen verschiedener Geräte oder Browser werden nicht zusammengeführt. Jeder Polier exportiert sein eigenes CSV.
- **Nicht alle Bauteile in 3D:** Bauteile ohne Geometrie erscheinen nur in der Liste. Öffnungen (`IfcOpeningElement`) werden nicht berücksichtigt.
- **Grosse Modelle:** Das Laden kann auf älteren Handys einige Sekunden dauern.
