# bfh_minor – Digitale Baufortschrittsüberwachung

Gruppenarbeit von Team 4 (Matthias, Josija) im Modul Data Science und BIM an der BFH.

Die Bauleitung erfährt direkt aus dem IFC-Modell, welche Bauteile montiert, überfällig oder abgenommen sind. Grundlage ist `Pset_InstallationOccurrence` mit drei Properties:

| Property | Datentyp | Gesetzt von | Bedeutung |
|---|---|---|---|
| `InstallationDate` | `IfcLabel` (`YYYY-MM-DD`) | Modellautor | Soll-Datum gemäss Terminplan, wird nicht verändert |
| `IsInstalled` | `IfcBoolean` | Polier | `TRUE`, sobald das Bauteil montiert ist (projektspezifisch, nicht in IFC 4.3) |
| `AcceptanceDate` | `IfcLabel` (`YYYY-MM-DD`) | Bauleitung | Datum der Abnahme nach der Kontrolle |

Daraus leitet ein Prüfskript pro Bauteil den Status ab: geplant, Montage überfällig, Abnahme ausstehend, abgenommen oder Fehler. Details stehen im [MVP](MVP/MVP%20definitive%20Themenwahl.md).

## Ordner

| Ordner | Inhalt |
|---|---|
| [`MVP/`](MVP/) | Themenwahl und MVP: Use Case, Modell und Evidenz, drei Anforderungen, Automatisierung |
| [`requirements/`](requirements/) | [AIA-BEP-Matrix](requirements/aia-bep-matrix.md) und IDS für Anforderung 1 (`a1_baufortschritt.yaml` / `.ids`) |
| [`model/`](model/) | IFC-Modell des Dozenten (`Team_4_Snowdon_Baufortschritt_IsInstalled.ifc`, IFC2X3) |
| [`checks/`](checks/) | Python-Skripte (IfcOpenShell), z. B. `kennzahlen.py` für die Kennzahlen des Modells |
| [`results/`](results/) | Prüfresultate (ifclite-Reports) |
| [`workflow/`](workflow/) | Ist- und Soll-Prozess als BPMN-Swimlane (draw.io, PNG, PDF) |
| [`poster/`](poster/) | Poster (folgt) |

Die `archiv/`-Unterordner enthalten den abgelösten Stand vom 18.10.2026 (altes IDS, Testmodell, Lösungsschlüssel). Eine Übersicht steht im [Archiv-README](requirements/archiv/README.md).

## Verwendung

Kennzahlen des Modells ausgeben (Python mit IfcOpenShell 0.8.5):

```bash
pip install ifcopenshell
python checks/kennzahlen.py
```

Ohne Argument liest das Skript `model/Team_4_Snowdon_Baufortschritt_IsInstalled.ifc`; ein anderes Modell kann als Pfad übergeben werden.

IDS prüfen: `requirements/a1_baufortschritt.ids` und das Modell in https://www.ifclite.com laden. Das IDS wird aus der YAML-Datei in https://www.idslight.com erzeugt.

## Stand

- Anforderungen, IDS und Soll-Prozess sind auf den aktuellen Prozess mit `IsInstalled` umgestellt.
- Im aktuellen Modell fehlt bei den 385 nicht montierten Bauteilen das `InstallationDate`. Der Dozent liefert ein korrigiertes Modell; danach folgt der IDS-Test in ifclite.
- Die Prüflogik für die Anforderungen 2 und 3 (Python) ist noch offen.

## KI-Einsatz

Jeder Einsatz von KI ist in [`KI-USAGE.md`](KI-USAGE.md) festgehalten. Die Regeln dazu stehen in [`AGENTS.md`](AGENTS.md).

## Lizenz

[MIT](LICENSE)
