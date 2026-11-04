| # | Anforderung | Zweck | Meilenstein | Objekte (IFC-Klasse) | Property / Quantity (mit Pset) | erlaubte Werte / Datentyp | Prüfmethode | Verantwortlich | Quelle |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Soll-Installationsdatum und Montagestatus bei jedem Element erfasst | Soll-Termin pro Bauteil festhalten, Montage-Rückmeldung des Poliers erfassen, Status pro Bauteil ableiten | `InstallationDate`: initial bei Übergabe Ausführungsmodell vor Baubeginn (Phase 52), danach unverändert; `IsInstalled`: initial FALSE, laufend bei jeder Montage-Rückmeldung | IfcElement ohne IfcOpeningElement (im IDS als Liste aller 45 Bauteilklassen von IFC2X3) | Pset_InstallationOccurrence.InstallationDate; Pset_InstallationOccurrence.IsInstalled | `InstallationDate`: IfcLabel (IFC2X3), Format YYYY-MM-DD, Pflicht, Soll-Datum gemäss Terminplan (in IFC 4.3: IfcDate); `IsInstalled`: IfcBoolean (TRUE/FALSE), Pflicht | IDS-Check (a1_baufortschritt.ids) + Stichprobe im Viewer | `InstallationDate`: Modellautor / BIM-Koordinator gemäss Terminplan; `IsInstalled`: initial Modellautor (FALSE), Aktualisierung Polier (TRUE) | IFC 4.3 Pset_InstallationOccurrence; `IsInstalled` projektspezifisch (Vorgabe Modell Dozent); MVP Abschnitt 3 |
| 2 | Abnahmedatum plausibel | Abnahmen erfassen, ausstehende Abnahmen als Pendenz der Bauleitung erkennen | Laufend nach jeder Kontrolle durch die Bauleitung; vollständig spätestens zur Bauabnahme (Phase 53) | IfcElement ohne IfcOpeningElement (im IDS als Liste aller 45 Bauteilklassen von IFC2X3) | Pset_InstallationOccurrence.AcceptanceDate (verglichen mit Pset_InstallationOccurrence.IsInstalled und Prüfdatum) | IfcLabel, Format YYYY-MM-DD; optional (leer = noch nicht abgenommen); falls gesetzt: `IsInstalled` = TRUE und ≤ Prüfdatum; vor `InstallationDate` nur Hinweis (vorzeitig montiert), kein Fehler | IDS-Check (nur Format) + eigene Prüflogik (Python/IfcOpenShell) | Bauleitung | IFC 4.3 Pset_InstallationOccurrence; Projektregel „Abnahme nur nach Montage“ (MVP Abschnitt 3) |
| 3 | Montageverzug erkannt | Überfällige Bauteile als Pendenz erkennen und Verzug beziffern | Laufend, z. B. täglich durch die Bauleitung und wöchentlich vor der Bausitzung | IfcElement ohne IfcOpeningElement (im IDS als Liste aller 45 Bauteilklassen von IFC2X3) | Pset_InstallationOccurrence.InstallationDate + Pset_InstallationOccurrence.IsInstalled + Prüfdatum | Überfällig, wenn `InstallationDate` ≤ Prüfdatum und `IsInstalled` = FALSE; Verzug in Tagen (Integer) = Prüfdatum − `InstallationDate` | Eigene Prüflogik (Python/IfcOpenShell), Liste der überfälligen Bauteile mit GlobalId | Bauleitung | Terminplan (als `InstallationDate` im Modell); MVP Abschnitt 4 |

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

## Werkzeuge

Polier und Bauleitung arbeiten mit der [Baustellen-App](../apps/baustellen-app/Anleitung.md). Das Passwort bestimmt die Rolle. Beide Ansichten wenden dieselbe Statustabelle an, und «Stand speichern» schreibt die Werte direkt ins IFC (ohne CSV).

| Property | Gesetzt von | Werkzeug | Stand |
|---|---|---|---|
| `InstallationDate`, `IsInstalled` = FALSE | Modellautor | Autorensoftware | im Modell des Dozenten vorhanden |
| `IsInstalled` = TRUE | Polier | Baustellen-App, Polier-Ansicht: heute fällige und überfällige Bauteile, Montage melden | umgesetzt (Prototyp) |
| Prüfung Anforderungen 1–3 | Bauleitung | Baustellen-App, Bauleitungs-Ansicht: Status, Pendenzen, Verzug, Bericht für `results/`; Zweitprüfung mit dem ifclite-Skript `baufortschritt.js` | umgesetzt |
| `AcceptanceDate` | Bauleitung | Baustellen-App, Bauleitungs-Ansicht: «Abnehmen» (Datum = Prüfdatum, höchstens heute) | umgesetzt (Prototyp) |
| Korrektur `InstallationDate` / `AcceptanceDate` / ungültiges `IsInstalled` bei Datenfehlern | Bauleitung | Baustellen-App, Bauleitungs-Ansicht: «Korrigieren» | umgesetzt (Prototyp) |

Grenze: Der Passwortschutz im Browser verhindert Fehlbedienung, ist aber kein Zugriffsschutz. Echten Schutz bietet erst Variante B mit Server (siehe [Konzept](../workflow/Konzept_Baustellen-App.md)). Die früheren Einzeltools mit CSV-Rückführung liegen auf `main`.

Bis dahin lässt sich Anforderung 2 nur mit Testdaten prüfen (im Modell des Dozenten ist `AcceptanceDate` überall leer).

## Prüfbar gemacht: Anforderung Nr. 1
- Spezifikation: [`a1_baufortschritt.ids`](a1_baufortschritt.ids) mit 3 Regeln: „A1 InstallationDate“, „A1 IsInstalled“ und der Formatteil von Anforderung 2 („A2 AcceptanceDate“). Jede Regel gilt für alle 45 Bauteilklassen von IFC2X3 (IfcElement ohne Aussparungen wie IfcOpeningElement).
- Warum eine Klassenliste: IDS 1.0 prüft beim Entity-Facet nur die genannte Klasse, keine Subtypen. Bis 04.11.2026 enthielt das IDS nur die 9 Klassen des Snowdon-Modells (27 Regeln), damit fielen in der Mutthornhütte 33 von 81 Bauteilen (Fenster, Tanks, PV, Treppen, Bekleidung, Tür) durch das Raster.
- Erzeugt mit [`erzeuge_ids.js`](erzeuge_ids.js) (`node requirements/erzeuge_ids.js`), das auch die lesbare Fassung [`a1_baufortschritt.yaml`](a1_baufortschritt.yaml) schreibt. IDS-Light kennt keine Klassenlisten und wird darum nicht mehr verwendet.
- Modell des Dozenten: `model/Team_4_Snowdon_Baufortschritt_IsInstalled.ifc` (IFC2X3), 1446 Elemente (1585 `IfcElement` − 139 `IfcOpeningElement`), alle mit `Pset_InstallationOccurrence`, `AcceptanceDate` überall leer.
- Test des Agents am 04.11.2026 mit ifctester 0.9.0 (IfcOpenShell 0.9.0.post1), IDS gegen das IDS-1.0-Schema validiert:
  - Modell des Dozenten: alle 3 Regeln bestanden, 1446 Bauteile geprüft.
  - Mutthornhütte: 81 Bauteile geprüft, 4 durchgefallen. Das sind die Fehler F1, F2, F3 und F5 aus dem [Lösungsschlüssel](../checks/loesung_mutthornhuette.md) (Wassertank 2 und 4 ohne Datum, PV-Fassade West mit `24.11.2026`, Zimmerwand OG Nord 2 mit `IsInstalled` als Text).
  - Nicht gefunden: F4 (`2026-09-31` passt zum Pattern) und F6 (Abnahme ohne Montage). Beides findet nur die Prüflogik der App.
- Positiver Testfall (muss bestehen): GlobalId `0B2YGPanTBc9mM6oEg4jTv` (IfcFooting, Snowdon).
- Negativer Testfall (fällt durch): GlobalId `0YoDRe$5vuQ0vtGGKlgxcM` (IfcFlowStorageDevice, Mutthornhütte), `InstallationDate` leer.
- Lauf in ifclite 5.5.0 (Data validation → IDS validation) durch Matthias am 04.11.2026, Mutthornhütte: 243 Prüfungen, 4 durchgefallen, dieselben 4 Bauteile wie bei ifctester; ifclite versteht die Klassenliste. Report: [`results/a1_ids_mutthornhuette_ifclite_2026-11-04.json`](../results/a1_ids_mutthornhuette_ifclite_2026-11-04.json).
- Lauf in ifclite 5.5.0 durch Matthias am 04.11.2026, Modell des Dozenten: alle 3 Regeln bestanden, 1446 Bauteile je Regel (4338 Prüfungen, 0 durchgefallen). Report: [`results/a1_ids_snowdon_ifclite_2026-11-04.json`](../results/a1_ids_snowdon_ifclite_2026-11-04.json).
- Hinweis Validator: `Pset_InstallationOccurrence` existiert erst in IFC 4.3 (ifclite warnte beim alten Lauf `W_IFC_PSET_RESERVED_PREFIX`). `IsInstalled` ist zusätzlich keine Standard-Property dieses Psets; der Name entspricht der Vorgabe im Modell.
- Was die Regel nicht prüft:
  - Ob das Datum im Kalender existiert: das Pattern lässt z. B. `2026-09-31` durch.
  - Ob `InstallationDate` dem Terminplan entspricht und nach der Übergabe unverändert bleibt.
  - Den Wert von `IsInstalled` (TRUE oder FALSE sind beide gültig).
  - „`AcceptanceDate` nur bei `IsInstalled` = TRUE“ und „nicht in der Zukunft“ (eigene Prüflogik, Anforderung 2), ebenso den Verzug (Anforderung 3).
  - Klassen ausserhalb der Liste (Aussparungen, virtuelle Elemente). Jede Regel verlangt mindestens ein Bauteil im Modell (`minOccurs="1"`).

## KI_USAGE
| Werkzeug | Wofür? | Was übernommen? | Wie geprüft? |
|---|---|---|---|
| Claude Code (Opus 5.5) | Matrix für die drei Anforderungen aus dem MVP ausgefüllt, IDS-Light-YAML für Anforderung 1 (plus Formatteil Anforderung 2) erstellt | Einträge in der Matrix (Vorschläge in „…“), YAML-Regeln pro Bauteilklasse und Liste „Was die Regel nicht prüft“ | Bauteilklassen mit IfcOpenShell aus dem Testmodell ausgelesen; Ausschnitt der YAML in idslight.com konvertiert (gültig, IFC2X3, IFCLABEL, Pattern). Vorschläge in „…“ geprüft. |
| Claude Code (Opus 5.5) | Prüfung der vom Studenten ergänzten Resultate, Abgleich des ifclite-Reports mit `checks/loesung.csv` | Korrigierte Resultate getrennt nach A1/A2, korrigierte GlobalId des positiven Testfalls, neuer negativer Testfall für A1, Hinweise zu Testmodell, Blindtest und Validator-Warnung | JSON-Export von ifclite per Skript mit `loesung.csv` verglichen (37 von 37 übereinstimmend); GlobalIds im Modell nachgeschlagen. Erwartung vor dem Lauf bestätigt. |
| Claude Code (Opus 5.5) | Matrix, YAML und IDS an den neuen Prozess angepasst (`InstallationDate` = Soll-Datum, `IsInstalled` durch Polier, `AcceptanceDate` durch Bauleitung) und auf das Modell des Dozenten umgestellt | Neue Anforderungen 1–3, Statustabelle, 27 IDS-Regeln, Befund zum Modell; altes IDS nach `archiv/` verschoben | IDS mit ifctester gegen das IDS-1.0-Schema und das Modell geprüft (385 Fehler bei `InstallationDate`, sonst keine), Negativtest mit drei absichtlich fehlerhaften Werten. Ausstehend: Lauf in ifclite durch das Team. |
| Claude Code (Opus 5.5) | Abschnitt «Werkzeuge» ergänzt: Polier-Tool (Polier), Baufortschritt-Check (Bauleitung), Setzen von `AcceptanceDate` offen | Zuordnung von Josija vorgegeben; Tabelle und Lösungsvarianten als Vorschlag | Funktionsumfang beider Tools im Code nachgelesen (keines schreibt `AcceptanceDate`), Links geprüft. |
| Claude Code (Opus 5.5) | IDS auf alle 45 Bauteilklassen von IFC2X3 erweitert (3 Regeln mit Klassenliste statt 27), Generator `erzeuge_ids.js` | Klassenliste und Script als Vorschlag, Anstoss von Matthias | ifctester 0.9.0: Snowdon 3/3 bestanden (1446 Bauteile), Mutthornhütte 4 Fehler wie im Lösungsschlüssel (F1, F2, F3, F5) |
