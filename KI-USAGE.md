
# KI-USAGE

## Matthias
| Datum | Werkzeug | Wofür eingesetzt? | Was übernommen/verändert? | Wie geprüft? |
| --- | --- | --- | --- | --- |


___

## Josija

| Datum | Werkzeug | Wofür eingesetzt? | Was übernommen/verändert? | Wie geprüft? |
| --- | --- | --- | --- | --- |
| 21.09.2026 | Claude Sonnet 5 (Anthropic) | Kurze Zusammenfassung (2 Sätze) der README.md zur Brandschutz-Analyse einer Aussenwand im IFC-Modell, als Verständnishilfe | Zusammenfassung sprachlich angepasst. Die Angaben stammen aus der eigenen README, die KI hat keine neuen Fakten hinzugefügt. | Abgleich der Zusammenfassung mit dem Originaltext der README (GUID, Floor, FireRating, Materialien); Kontrolle der Wand und der Werte direkt im IFC-Viewer (`Pset_FireRatingProperties`) |
| 13.10.2026 | Claude Code (Opus 5.5) | MVP-Entwurf auf Schlüssigkeit und gegen die Aufgabenstellung gegengelesen, Vorschläge für die dritte Anforderung, Korrektur von Formulierungen und Tippfehlern | Statustabelle, präzisierte Prüfkriterien und Spalte «Prüfbar mit» übernommen. Prozess und die drei Anforderungen stammen von der Gruppe. | Pset-Definition in den IfcOpenShell-0.8.5-Templates nachgeschlagen (IFC4X3: drei `IfcDate`-Properties, in IFC4 nicht vorhanden). |
| 13.10.2026 | Claude Code (Opus 5.5) | Auswertung von `01_Snowdon_Towers_Sample_Structural.ifc` für Abschnitt 3 und Skript `kennzahlen.py` dazu | Kennzahlen (Schema, Anzahl Elemente, fehlendes Pset, kein Terminplan) und drei Beispiel-`GlobalId` übernommen. | Kennzahlen mit IfcOpenShell direkt aus dem Modell ausgelesen, Skript ausgeführt und Ausgabe mit MVP-Datei abgeglichen; `GlobalId` stichprobenweise in IFClite nachgeprüft. |
| 18.10.2026 | Claude Code (Opus 5.5) | Testmodell `model/01_Snowdon_Towers_Sample_Structural_ergaenzt.ifc` mit `Pset_InstallationOccurrence` erzeugt (alle vier Status inkl. Fehler), Skript `ergaenze_testdaten.py` und Lösungsschlüssel `loesung.csv` | Modell und Skript unverändert übernommen; Werte als `IfcLabel`, da IFC2X3 kein `IfcDate` kennt. | Alle geschriebenen Werte aus dem Modell zurückgelesen und mit `loesung.csv` abgeglichen, Pflichtattribute (`OwnerHistory`) der neuen Objekte geprüft. Ausstehend: Test mit dem eigenen IDS. |
| 18.10.2026 | Claude Code (Opus 5.5) | Beratung Google Drive vs. GitHub, Repo lokal geklont, Testmodell nach `model/` kopiert, `KI-USAGE.md` ergänzt, `AGENTS.md`, `CLAUDE.md` und `.gitignore` erstellt; Skripte und `loesung.csv` nach `checks/` kopiert | Ordner `model/` und Dateien übernommen; in den Skripten Pfade an die Repo-Struktur angepasst und Schutz gegen doppeltes Ergänzen eingebaut. | Kopie des Modells bytegleich mit dem Original auf dem Drive (`cmp`). Dateien vor dem Push von Studenten durchgegangen und gh repository auf `private` gestellt. Beide Skripte im Repo ausgeführt; Testdaten aus dem Original neu erzeugt, `loesung.csv` identisch. |
