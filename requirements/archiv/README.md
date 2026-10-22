# Archiv – nicht mehr gültig

Nur als Referenz. Gültig sind `requirements/a1_baufortschritt.yaml` / `.ids` (siehe `requirements/aia-bep-matrix.md`) und das Modell `model/Team_4_Snowdon_Baufortschritt_IsInstalled.ifc`.

Stand 18.10.2026: ohne `IsInstalled`; `InstallationDate` war bis zur Montage Plandatum und danach Ist-Datum. Das Testmodell wurde per Skript ergänzt und mit dem alten IDS in ifclite geprüft.

| Datei | Inhalt |
|---|---|
| `requirements/archiv/a1_installationsdatum_ALT_2026-10-18.yaml` / `.ids` | Altes IDS (Anforderung 1 und Format von Anforderung 2) |
| `model/archiv/01_Snowdon_Towers_Sample_Structural_ergaenzt.ifc` | Altes Testmodell, 37 Bauteile mit `Pset_InstallationOccurrence` |
| `checks/archiv/ergaenze_testdaten.py` | Skript, das das alte Testmodell erzeugt hat |
| `checks/archiv/loesung.csv` | Lösungsschlüssel zum alten Testmodell |
| `results/archiv/a1_installationsdatum_ifclite_2026-10-18.html` / `.json` | ifclite-Report des alten IDS auf dem alten Testmodell |
