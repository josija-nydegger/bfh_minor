# bfh_minor – Digitale Baufortschrittsüberwachung

Gruppenarbeit von Team 4 (Matthias, Josija) im Modul Data Science und BIM an der BFH.

Die Bauleitung erfährt direkt aus dem IFC-Modell, welche Bauteile montiert, überfällig oder abgenommen sind. Grundlage ist `Pset_InstallationOccurrence` mit drei Properties:

| Property | Datentyp | Gesetzt von | Bedeutung |
|---|---|---|---|
| `InstallationDate` | `IfcLabel` (`YYYY-MM-DD`) | Modellautor | Soll-Datum gemäss Terminplan, wird nicht verändert |
| `IsInstalled` | `IfcBoolean` | Polier | `TRUE`, sobald das Bauteil montiert ist (projektspezifisch, nicht in IFC 4.3) |
| `AcceptanceDate` | `IfcLabel` (`YYYY-MM-DD`) | Bauleitung | Datum der Abnahme nach der Kontrolle |

Daraus leitet ein Prüfskript pro Bauteil den Status ab: geplant, Montage überfällig, Abnahme ausstehend, abgenommen oder Fehler. Details stehen im [MVP](MVP/MVP%20definitive%20Themenwahl.md).

## Schritt für Schritt: die drei Tools ausprobieren (Peer-Audit)

Ihr spielt einen Tag auf der Baustelle durch: Der **Polier** meldet montierte Bauteile, die Rückmeldung wird **ins Modell übernommen**, und die **Bauleitung** prüft den Baufortschritt.

```
1 Polier-Tool  ──CSV──▶  2 csv_ins_ifc.py  ──neues IFC──▶  3 Baufortschritt-Check
  (Browser)                (Python)                          (Browser)
```

Übungsmodell: [`model/Mutthornhuette_Baufortschritt.ifc`](model/Mutthornhuette_Baufortschritt.ifc), eine vereinfachte Mutthornhütte mit 81 Bauteilen und absichtlich eingebauten Fehlern. **Stichtag ist der 03.11.2026.** Die erwarteten Zahlen stehen bei jedem Schritt.

### Was ihr braucht

| | Version (getestet am 02.11.2026) |
|---|---|
| Laptop mit Chrome oder Edge, Internetverbindung | Chrome/Edge aktuell |
| Python | 3.12.10 |
| IfcOpenShell (nur für Schritt 2) | 0.9.0.post1 |

### Schritt 0 · Repository herunterladen und Python vorbereiten

1. Auf GitHub oben rechts **Code → Download ZIP** klicken und die ZIP-Datei entpacken. Wer Git kennt, kann stattdessen klonen: `git clone https://github.com/josija-nydegger/bfh_minor.git`
2. Im entpackten Ordner `bfh_minor` ein Terminal öffnen. Unter Windows im Explorer in die Adresszeile `powershell` tippen und Enter drücken.
3. IfcOpenShell installieren:

   ```bash
   python -m pip install ifcopenshell==0.9.0.post1
   ```

   Kennt Windows `python` nicht, stattdessen `py` verwenden, also `py -m pip install …`.

### Schritt 1 · Polier-Tool: Montage melden

1. [`apps/polier-tool/Polier-Tool.html`](apps/polier-tool/Polier-Tool.html) mit Doppelklick öffnen.
2. **IFC-Datei wählen** klicken und `model/Mutthornhuette_Baufortschritt.ifc` öffnen.
3. Oben in der Mitte den Stichtag mit **›** auf **Di 3.11.** stellen. Am 03.11. selbst steht er schon dort.
4. Kontrolle: Die Chips zeigen **Überfällig 4 · Montiert 33 · Fehler 5 · Alle 81**.
5. **Überfällig** antippen. Es erscheinen 4 Bauteile mit 15, 14, 8 und 6 Tagen Verzug, darunter «Decke über EG».
6. **Alle 4 angezeigten als montiert melden …** klicken und mit **Ja, alle 4 als montiert melden** bestätigen.
7. **Export → CSV: nur Änderungen (4)** klicken. Im Download-Ordner liegt jetzt `Mutthornhuette_Baufortschritt_IsInstalled_aenderungen_<Stichtag>.csv`. Das Datum am Schluss ist der Stichtag, der im Tool eingestellt war, z. B. `2026-11-03`.
8. Diese CSV-Datei in den Ordner `bfh_minor` kopieren, also dorthin, wo diese README liegt.

### Schritt 2 · Rückmeldung ins Modell übernehmen

Im Terminal (Ordner `bfh_minor`). Das Datum im CSV-Namen muss mit eurer Datei übereinstimmen:

```bash
python apps/polier-tool/csv_ins_ifc.py model/Mutthornhuette_Baufortschritt.ifc Mutthornhuette_Baufortschritt_IsInstalled_aenderungen_2026-11-03.csv
```

Tipp: `Mutthornhuette_Baufortschritt_IsInstalled` tippen und die **Tab**-Taste drücken. Das Terminal ergänzt dann den richtigen Dateinamen.

Kontrolle: Die Ausgabe zeigt **gesetzt: 4 · unverändert: 0 · übersprungen: 0**. Im Ordner `model/` liegen danach zwei neue Dateien:
- `Mutthornhuette_Baufortschritt_rueckgemeldet_<heute>.ifc`: das Modell mit den Rückmeldungen
- `…_protokoll.csv`: alter und neuer Wert pro GlobalId

Das Eingabemodell bleibt unverändert.

### Schritt 3 · Baufortschritt-Check: Bauleitung prüft

1. [`apps/baufortschritt-check/Baufortschritt-Check.html`](apps/baufortschritt-check/Baufortschritt-Check.html) mit Doppelklick öffnen. Zuerst erscheint ein Beispiel.
2. Rechts das **Prüfdatum** auf **03.11.2026** stellen.
3. Das **neue** Modell `model/Mutthornhuette_Baufortschritt_rueckgemeldet_<heute>.ifc` in das Feld ziehen.
4. Kontrolle:

   | | Originalmodell | Nach Schritt 2 |
   |---|---|---|
   | Montiert | 33 von 81 | **37 von 81** |
   | Abgenommen | 20 | 20 |
   | Abnahme ausstehend | 12 | **16** |
   | Montage überfällig | 4 | **0** |
   | Geplant | 39 | 39 |
   | Daten fehlerhaft | 6 | 6 |

   Die 6 Datenfehler sind absichtlich eingebaut, zum Beispiel Wassertanks ohne Soll-Datum oder das unmögliche Datum `2026-09-31`. Die Liste steht im [Lösungsschlüssel](checks/loesung_mutthornhuette.md).
5. Unter **Ergebnis sichern → Liste als Excel-Datei (CSV)** speichert ihr den Prüfbericht, der nach `results/` gehört.

Variante ohne HTML: Der gleiche Check läuft als Skript in https://www.ifclite.com (v5.2.2): Modell öffnen, dann **Analyze → Script Editor → Import script file** und [`apps/baufortschritt-check/baufortschritt.js`](apps/baufortschritt-check/baufortschritt.js) wählen. Oben im Skript `PRUEFDATUM = '2026-11-03'` setzen und **Run** klicken. Die Bauteile werden dann nach Status eingefärbt.

### Wenn etwas nicht klappt

| Problem | Lösung |
|---|---|
| Polier-Tool bleibt leer oder lädt nicht | Internet prüfen, denn das Tool lädt three.js und web-ifc von einem CDN. Sonst im Ordner `bfh_minor` `python -m http.server` starten und http://localhost:8000/apps/polier-tool/Polier-Tool.html öffnen. |
| `python` wird nicht gefunden | `py` statt `python` verwenden |
| `No module named ifcopenshell` | Schritt 0.3 wiederholen, mit demselben `python` bzw. `py` |
| Schritt 2: `FileNotFoundError` | Die CSV liegt nicht im Ordner `bfh_minor`, oder das Datum im Namen ist anders (Stichtag im Polier-Tool). Mit `dir *.csv` nachsehen und den Namen mit der Tab-Taste ergänzen. |
| Andere Zahlen in Schritt 3 | Prüfdatum 03.11.2026? Das **neue** Modell aus Schritt 2 geladen? |
| Polier-Tool zeigt alte Meldungen | **Export → Änderungen verwerfen**. Die Meldungen werden pro Browser gespeichert. |

Ausführliche Anleitungen: [Polier-Tool](apps/polier-tool/Anleitung.md) · [Baufortschritt-Check](apps/baufortschritt-check/Anleitung.md)

## Ordner

| Ordner | Inhalt |
|---|---|
| [`MVP/`](MVP/) | Themenwahl und MVP: Use Case, Modell und Evidenz, drei Anforderungen, Automatisierung |
| [`requirements/`](requirements/) | [AIA-BEP-Matrix](requirements/aia-bep-matrix.md) und IDS für Anforderung 1 (`a1_baufortschritt.yaml` / `.ids`) |
| [`model/`](model/) | IFC-Modell des Dozenten (`Team_4_Snowdon_Baufortschritt_IsInstalled.ifc`, IFC2X3) und Lehrmodell Mutthornhütte (`Mutthornhuette_Baufortschritt.ifc`, mit eingebauten Fehlern, Lösungsschlüssel in [`checks/loesung_mutthornhuette.md`](checks/loesung_mutthornhuette.md)) |
| [`checks/`](checks/) | Python-Skripte (IfcOpenShell), z. B. `kennzahlen.py` für die Kennzahlen des Modells |
| [`results/`](results/) | Prüfresultate (ifclite-Reports) |
| [`apps/polier-tool/`](apps/polier-tool/) | Polier-Tool: IFC im Browser laden, heute fällige und überfällige Bauteile anzeigen, `IsInstalled` setzen, CSV-Export und Skript `csv_ins_ifc.py` für die Rückführung ins IFC ([Anleitung](apps/polier-tool/Anleitung.md)) |
| [`apps/baufortschritt-check/`](apps/baufortschritt-check/) | Baufortschritt-Check für die Bauleitung: prüft die drei Anforderungen, zeigt Status, Pendenzen und Verzug; als HTML oder ifclite-Skript ([Anleitung](apps/baufortschritt-check/Anleitung.md)) |
| [`workflow/`](workflow/) | Ist- und Soll-Prozess als BPMN-Swimlane (draw.io, PNG, PDF) |
| [`poster/`](poster/) | Poster (folgt) |

Die `archiv/`-Unterordner enthalten den abgelösten Stand vom 18.10.2026 (altes IDS, Testmodell, Lösungsschlüssel). Eine Übersicht steht im [Archiv-README](requirements/archiv/README.md).

## Weitere Prüfungen

Kennzahlen eines Modells ausgeben (Anzahl Bauteile, Klassen, mit und ohne Pset):

```bash
python checks/kennzahlen.py model/Mutthornhuette_Baufortschritt.ifc
```

Ohne Argument liest das Skript `model/Team_4_Snowdon_Baufortschritt_IsInstalled.ifc`.

IDS prüfen (Anforderung 1): `requirements/a1_baufortschritt.ids` und das Modell in https://www.ifclite.com laden. Das IDS wird aus der YAML-Datei in https://www.idslight.com erzeugt.

Mit dem Modell des Dozenten (`Team_4_Snowdon_Baufortschritt_IsInstalled.ifc`) zeigt der Baufortschritt-Check 1446 Bauteile: 1061 «Abnahme ausstehend» und 385 «Daten fehlerhaft» (Soll-Datum leer).

## Stand

- Anforderungen, IDS und Soll-Prozess sind auf den aktuellen Prozess mit `IsInstalled` umgestellt.
- Im aktuellen Modell fehlt bei den 385 nicht montierten Bauteilen das `InstallationDate`. Der Dozent liefert ein korrigiertes Modell; danach folgt der IDS-Test in ifclite.
- Die Prüflogik für die Anforderungen 1–3 ist im Baufortschritt-Check umgesetzt (JavaScript statt Python).
- Offen: Kein Werkzeug setzt bisher `AcceptanceDate` (Abnahme durch die Bauleitung).

## KI-Einsatz

Jeder Einsatz von KI ist in [`KI-USAGE.md`](KI-USAGE.md) festgehalten. Die Regeln dazu stehen in [`AGENTS.md`](AGENTS.md).

## Lizenz

[MIT](LICENSE)
