# bfh_minor – Digitale Baufortschrittsüberwachung

Gruppenarbeit von Team 4 (Matthias, Josija) im Modul Data Science und BIM an der BFH.

Die Bauleitung erfährt direkt aus dem IFC-Modell, welche Bauteile montiert, überfällig oder abgenommen sind. Grundlage ist `Pset_InstallationOccurrence` mit drei Properties:

| Property | Datentyp | Gesetzt von | Bedeutung |
|---|---|---|---|
| `InstallationDate` | `IfcLabel` (`YYYY-MM-DD`) | Modellautor | Soll-Datum gemäss Terminplan, wird nicht verändert |
| `IsInstalled` | `IfcBoolean` | Polier | `TRUE`, sobald das Bauteil montiert ist (projektspezifisch, nicht in IFC 4.3) |
| `AcceptanceDate` | `IfcLabel` (`YYYY-MM-DD`) | Bauleitung | Datum der Abnahme nach der Kontrolle |

Daraus leitet die Baustellen-App pro Bauteil den Status ab: geplant, Montage überfällig, Abnahme ausstehend, abgenommen oder Fehler. Details stehen im [MVP](MVP/MVP%20definitive%20Themenwahl.md).

> Dieser Branch enthält die zusammengeführte **Baustellen-App**. Die früheren Einzeltools (Polier-Tool mit CSV und `csv_ins_ifc.py`, Baufortschritt-Check) und die Peer-Audit-Anleitung vom 03.11.2026 liegen unverändert auf `main`.

## Schritt für Schritt: ein Tag mit der Baustellen-App

Polier und Bauleitung arbeiten mit derselben App. Das Passwort bestimmt die Rolle. **Stand speichern** schreibt die Rückmeldungen direkt ins IFC-Modell, ein CSV gibt es nicht mehr.

```
Polier: anmelden → Montage melden → Stand speichern ──IFC──▶ Bauleitung: anmelden → prüfen → abnehmen → Stand speichern
```

Übungsmodell: [`model/Mutthornhuette_Baufortschritt.ifc`](model/Mutthornhuette_Baufortschritt.ifc), eine vereinfachte Mutthornhütte mit 81 Bauteilen und absichtlich eingebauten Fehlern. **Stichtag ist der 03.11.2026.**

### Was ihr braucht

- Laptop mit Chrome oder Edge und Internet (die 3D-Ansicht lädt three.js und web-ifc von einem CDN)
- die Passwörter für Polier und Bauleitung. Sie stehen nicht im Repository, ihr bekommt sie von Team 4.
- Python wird nicht gebraucht.

### Schritt 0 · Repository herunterladen

Auf GitHub den Branch `baustellen-app` wählen, dann **Code → Download ZIP** klicken und die ZIP-Datei entpacken.

### Schritt 1 · Polier meldet Montagen

1. [`apps/baustellen-app/Baustellen-App.html`](apps/baustellen-app/Baustellen-App.html) mit Doppelklick öffnen und mit dem **Polier-Passwort** anmelden.
2. `model/Mutthornhuette_Baufortschritt.ifc` in das Feld ziehen.
3. Den Stichtag oben mit **›** auf **Di 3.11.** stellen. Am 03.11. selbst steht er schon dort.
4. Kontrolle: **Überfällig 4 · Montiert 33 · Fehler 5 · Alle 81**.
5. **Überfällig** antippen → **Alle 4 angezeigten als montiert melden …** → **Ja, alle 4 als montiert melden**. Oben steht jetzt **4 ungespeicherte Änderungen**.
6. **Stand speichern** klicken. Im Download-Ordner liegt jetzt `Mutthornhuette_Baufortschritt_stand_<Datum>_<Uhrzeit>.ifc`. Kontrolle: **Überfällig 0 · Montiert 37**.

### Schritt 2 · Bauleitung prüft und nimmt ab

1. **Abmelden** und mit dem **Bauleitungs-Passwort** anmelden.
2. Die gespeicherte Datei `…_stand_….ifc` aus dem Download-Ordner in das Feld ziehen.
3. Rechts das **Prüfdatum** auf **03.11.2026** stellen.
4. Kontrolle:

   | | Originalmodell | Nach Schritt 1 | Nach Schritt 2 |
   |---|---|---|---|
   | Montiert | 33 von 81 | **37 von 81** | 37 von 81 |
   | Abgenommen | 20 | 20 | **36** |
   | Abnahme ausstehend | 12 | **16** | **0** |
   | Montage überfällig | 4 | **0** | 0 |
   | Geplant | 39 | 39 | 39 |
   | Daten fehlerhaft | 6 | 6 | 6 |

5. In der Bauteilliste den Filter **Abnahme ausstehend** wählen → **Alle 16 angezeigten am 03.11.2026 abnehmen …** → **Ja**. Einzelne Bauteile lassen sich mit **Abnehmen** abnehmen und unter «Abgenommen» mit **Rückgängig** zurücknehmen.
6. **Stand speichern**. Das neue IFC enthält die Abnahmen.
7. Unter **Ergebnis sichern → Liste als Excel-Datei (CSV)** speichert ihr den Prüfbericht für `results/`.

Die 6 Datenfehler sind absichtlich eingebaut, zum Beispiel Wassertanks ohne Soll-Datum oder das unmögliche Datum `2026-09-31`. Die Liste steht im [Lösungsschlüssel](checks/loesung_mutthornhuette.md).

### Zweitprüfung in ifclite

Der gleiche Check läuft als Skript in https://www.ifclite.com (v5.2.2): Modell öffnen, dann **Analyze → Script Editor → Import script file** und [`apps/baustellen-app/baufortschritt.js`](apps/baustellen-app/baufortschritt.js) wählen. Oben im Skript `PRUEFDATUM = '2026-11-03'` setzen und **Run** klicken. Die Bauteile werden dann nach Status eingefärbt.

### Wenn etwas nicht klappt

| Problem | Lösung |
|---|---|
| «Passwort unbekannt» | Gross- und Kleinschreibung prüfen. Die Passwörter gibt Team 4 weiter. |
| Polier-Ansicht bleibt leer | Internet prüfen. Sonst im Ordner `bfh_minor` `python -m http.server` starten und http://localhost:8000/apps/baustellen-app/Baustellen-App.html öffnen. |
| Andere Zahlen in Schritt 2 | Prüfdatum 03.11.2026? Die **gespeicherte** Datei aus Schritt 1 geladen? |
| Polier-Ansicht zeigt alte Meldungen | **Tabelle → Änderungen verwerfen**. Ungespeicherte Meldungen bleiben im Browser zwischengespeichert. |
| «Zuerst den Stand speichern» | Es gibt ungespeicherte Änderungen. Erst speichern, dann ein anderes Modell öffnen oder abmelden. |

Ausführliche Anleitung: [Baustellen-App](apps/baustellen-app/Anleitung.md) · Konzept: [Konzept_Baustellen-App.md](workflow/Konzept_Baustellen-App.md)

## Ordner

| Ordner | Inhalt |
|---|---|
| [`MVP/`](MVP/) | Themenwahl und MVP: Use Case, Modell und Evidenz, drei Anforderungen, Automatisierung |
| [`requirements/`](requirements/) | [AIA-BEP-Matrix](requirements/aia-bep-matrix.md) und IDS für Anforderung 1 (`a1_baufortschritt.yaml` / `.ids`) |
| [`model/`](model/) | IFC-Modell des Dozenten (`Team_4_Snowdon_Baufortschritt_IsInstalled.ifc`, IFC2X3) und Lehrmodell Mutthornhütte (`Mutthornhuette_Baufortschritt.ifc`, mit eingebauten Fehlern, Lösungsschlüssel in [`checks/loesung_mutthornhuette.md`](checks/loesung_mutthornhuette.md)) |
| [`apps/baustellen-app/`](apps/baustellen-app/) | Baustellen-App: Login pro Rolle, Polier-Ansicht, Bauleitungs-Ansicht mit Abnahme, schreibt direkt ins IFC; dazu das ifclite-Skript `baufortschritt.js` ([Anleitung](apps/baustellen-app/Anleitung.md)) |
| [`checks/`](checks/) | Skripte: `kennzahlen.py` (IfcOpenShell), Generator und Lösungsschlüssel des Mutthorn-Modells |
| [`results/`](results/) | Prüfresultate (ifclite-Reports) |
| [`workflow/`](workflow/) | Ist- und Soll-Prozess als BPMN-Swimlane (draw.io, PNG, PDF) und [Konzept der Baustellen-App](workflow/Konzept_Baustellen-App.md) |
| [`poster/`](poster/) | Poster (folgt) |

Die `archiv/`-Unterordner enthalten den abgelösten Stand vom 18.10.2026 (altes IDS, Testmodell, Lösungsschlüssel). Eine Übersicht steht im [Archiv-README](requirements/archiv/README.md).

## Weitere Prüfungen

Kennzahlen eines Modells ausgeben (Python mit IfcOpenShell 0.9.0.post1: `python -m pip install ifcopenshell==0.9.0.post1`):

```bash
python checks/kennzahlen.py model/Mutthornhuette_Baufortschritt.ifc
```

Ohne Argument liest das Skript `model/Team_4_Snowdon_Baufortschritt_IsInstalled.ifc`.

IDS prüfen (Anforderung 1): `requirements/a1_baufortschritt.ids` und das Modell in https://www.ifclite.com laden. Das IDS wird aus der YAML-Datei in https://www.idslight.com erzeugt.

Mit dem Modell des Dozenten (Stand 03.11.2026) und Prüfdatum 03.11.2026 zeigt die Bauleitungs-Ansicht 1446 Bauteile: 842 abgenommen, 219 Abnahme ausstehend, 46 Montage überfällig, 339 geplant, 0 Daten fehlerhaft.

## Stand

- Anforderungen, IDS und Soll-Prozess sind auf den Prozess mit `IsInstalled` umgestellt.
- Polier-Tool und Baufortschritt-Check sind in der Baustellen-App zusammengeführt (Prototyp Variante A). Die CSV-Schnittstelle entfällt.
- Die Bauleitung setzt `AcceptanceDate` jetzt in der App.
- Offen: Soll-Prozess (`workflow/prozess_ist_soll.drawio`) und AIA-BEP-Matrix an die App anpassen. Variante B (Server mit echtem Login) ist ein Ausblick.

## KI-Einsatz

Jeder Einsatz von KI ist in [`KI-USAGE.md`](KI-USAGE.md) festgehalten. Die Regeln dazu stehen in [`AGENTS.md`](AGENTS.md).

## Lizenz

[MIT](LICENSE)
