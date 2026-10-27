
# MVP – Digitale Baufortschrittsüberwachung

## 1. Projekttitel und Use Case

Die Bauleitung braucht pro Bauteil das Installations- und das Abnahmedatum aus dem IFC-Modell, um Montagefortschritt, ausstehende Abnahmen und Abweichungen zum Terminplan zu überwachen.

## 2. Zielgruppe und Nutzen

| Zielgruppe (Rolle)     | Nutzen                                                                 |
| ---------------------- | ---------------------------------------------------------------------- |
| Bauleitung             | Fortschritt überwachen, Abnahmen erfassen, Terminabweichungen erkennen |
| Polier                 | Installationen rückmelden und offene Pendenzen koordinieren            |
| Handwerker und Gewerke | Anstehende Montagen und Termine einsehen                               |

## 3. Modell und Evidenz

**Modell:** `model/Team_4_Snowdon_Baufortschritt_IsInstalled.ifc`, vom Dozenten angepasste Fassung von `01_Snowdon_Towers_Sample_Structural.ifc` (Schema IFC2X3, 1585 `IfcElement`, davon 139 `IfcOpeningElement`, also 1446 zu prüfende Bauteile).

Das IFC-4.3-PropertySet `Pset_InstallationOccurrence` (anwendbar auf `IfcElement`, `IfcAsset`, `IfcSystem`) definiert die drei Datums-Properties. `IsInstalled` ist eine projektspezifische Ergänzung, die im Modell im selben Pset liegt:

| Property               | Datentyp     | Bedeutung                                                         |
| ---------------------- | ------------ | ----------------------------------------------------------------- |
| `InstallationDate`     | `IfcDate`    | Soll-Datum der Installation gemäss Terminplan, wird nicht verändert |
| `IsInstalled`          | `IfcBoolean` | Montagestatus: FALSE = nicht montiert, TRUE = montiert (projektspezifisch, nicht in IFC 4.3) |
| `AcceptanceDate`       | `IfcDate`    | Datum der Abnahme durch die Bauleitung                            |
| `PutIntoOperationDate` | `IfcDate`    | Datum der Inbetriebnahme (im MVP nicht verwendet)                 |

Das Schema IFC2X3 kennt den Datentyp `IfcDate` nicht; die Daten liegen deshalb als `IfcLabel` vor und das Format (`YYYY-MM-DD`) wird per IDS-Pattern geprüft.

**Was im Originalmodell fehlte:**

- Keines der 1585 Elemente trägt `Pset_InstallationOccurrence`; es gibt auch kein anderes PropertySet mit Installations- oder Abnahmedatum.
- Das Modell enthält keinen Terminplan (0 `IfcTask`, 0 `IfcWorkSchedule`).

| Beispiel | IFC-Klasse | `GlobalId` | Befund |
|---|---|---|---|
| Concrete-Rectangular-Column:CC24x24:606069 | `IfcColumn` | `3ZT5EhLQn6JfRlijT8hqQ9` | `Pset_InstallationOccurrence` fehlt |
| Concrete-Rectangular Beam:CB24x24:606873 | `IfcBeam` | `3ZT5EhLQn6JfRlijT8hpjb` | `Pset_InstallationOccurrence` fehlt |
| Floor:NW Concrete on Metal Deck:621720 | `IfcSlab` | `3eRW_mgkzCZQysdnuCHWNw` | `Pset_InstallationOccurrence` fehlt |

**Stand angepasstes Modell:**

- Alle 1446 Bauteile tragen `Pset_InstallationOccurrence` mit `IsInstalled` als `IfcBoolean` (1061 TRUE, 385 FALSE); `AcceptanceDate` ist überall leer.
- `InstallationDate` ist nur bei den 1061 montierten Bauteilen gesetzt (2026-05-04 bis 2026-10-20), bei den 385 unmontierten leer. Für sie fehlt das Soll-Datum; Anforderung 1 ist dort nicht erfüllt.
- Weiterhin kein Terminplan im Modell (0 `IfcTask`, 0 `IfcWorkSchedule`); der Soll-Termin steckt nur in `InstallationDate`.

| Beispiel | IFC-Klasse | `GlobalId` | Befund |
|---|---|---|---|
| Wall Foundation:Bearing Footing - 36"x18":676633 | `IfcFooting` | `0B2YGPanTBc9mM6oEg4jTv` | `InstallationDate` = 2026-05-04, `IsInstalled` = TRUE, nicht abgenommen |
| W Shapes-Column:W8x31:705124 | `IfcColumn` | `0lyEh4MQj5dfRBgL_Q5SWN` | `IsInstalled` = FALSE, `InstallationDate` leer |

**Prozess:**
1. Der Modellautor setzt bei jedem Element `InstallationDate` gemäss Terminplan (Soll-Datum) und `IsInstalled` = FALSE. Das `InstallationDate` wird danach nicht mehr verändert.
2. Der Polier setzt bei der Montage `IsInstalled` = TRUE.
3. Die Bauleitung prüft per Skript, ob alles montiert ist, was bis heute hätte montiert sein sollen, kontrolliert die montierten Elemente und setzt danach das `AcceptanceDate`.

**Prüfbedarf:** Es wird untersucht, ob die Properties vorhanden, gültig und zueinander plausibel sind und ob Montagen im Verzug sind. Geprüft werden alle `IfcElement` ohne `IfcOpeningElement` (Öffnungen werden nicht montiert). Abweichungen werden mit der jeweiligen `GlobalId` dokumentiert. Aus den drei Properties wird pro Bauteil der Status abgeleitet:

| `InstallationDate`   | `IsInstalled` | `AcceptanceDate` | Status                                  |
| -------------------- | ------------- | ---------------- | --------------------------------------- |
| in der Zukunft       | FALSE         | leer             | geplant                                 |
| heute oder vergangen | FALSE         | leer             | Montage überfällig (Pendenz Polier)     |
| beliebig             | TRUE          | leer             | Abnahme ausstehend (Pendenz Bauleitung) |
| beliebig             | TRUE          | gesetzt          | abgenommen                              |
| beliebig             | FALSE         | gesetzt          | Fehler (Abnahme ohne Montage)           |
| leer                 | beliebig      | beliebig         | Fehler                                  |

## 4. Drei Anforderungen

| Anforderung | Prüfkriterium | Quelle | Prüfbar mit |
| --- | --- | --- | --- |
| Soll-Installationsdatum und Montagestatus bei jedem Element erfasst | `InstallationDate` vorhanden und ein gültiges Datum (`YYYY-MM-DD`); `IsInstalled` vorhanden und `IfcBoolean` | IFC 4.3, Projektvorgabe (`IsInstalled`) | IDS |
| Abnahmedatum plausibel | `AcceptanceDate`, falls gesetzt, ein gültiges Datum, nur bei `IsInstalled` = TRUE und nicht in der Zukunft; vor `InstallationDate` nur Hinweis (vorzeitig montiert) | IFC 4.3, Projektregel (Abnahme nur nach Montage) | IDS (Format) + eigene Prüflogik |
| Montageverzug erkannt | Bauteil ist überfällig, wenn `InstallationDate` ≤ Prüfdatum und `IsInstalled` = FALSE; Verzug in Tagen = Prüfdatum − `InstallationDate` | Terminplan (als `InstallationDate` im Modell) | eigene Prüflogik |

Da `InstallationDate` das Soll-Datum ist und nicht überschrieben wird, gibt es kein Ist-Datum der Montage. Der Verzug wird darum nur für noch nicht montierte Bauteile berechnet.

## 5. MVP: Automatisierung

- **Input:** IFC-Modell mit `Pset_InstallationOccurrence` (Soll-Datum, `IsInstalled` vom Polier, `AcceptanceDate` von der Bauleitung), Prüfdatum (Standard: heute)
- **Automatisierung:** Die drei Anforderungen prüfen (IDS und eigene Prüflogik), Status pro Bauteil ableiten und für nicht montierte Bauteile den Verzug in Tagen seit dem Soll-Datum berechnen
- **Output:** Fortschrittsübersicht (geplant / Montage überfällig / Abnahme ausstehend / abgenommen), Liste der überfälligen Bauteile mit Verzug in Tagen und offene Pendenzen (Polier: Montage, Bauleitung: Abnahme) mit `GlobalId`

## 6. Verworfene Ideen

| Idee | Begründung |
|---|---|
| Vollständige KI-Terminplanung | Zu komplex für den MVP-Zeitrahmen |
| Automatische Fortschrittserkennung anhand von Baustellenbildern | Zusätzlicher Daten- und Entwicklungsaufwand |

**Fokus:** Regelbasierte IFC-Prüfungen und digitale Pendenzenliste als umsetzbarer MVP bis Dezember.

## KI_USAGE

| Werkzeug                      | Wofür?                                                                                                                     | Was übernommen?                                                                                                           | Wie geprüft?                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Claude Opus 5.5 (Claude Code) | Gegenlesen des MVP-Entwurfs auf Schlüssigkeit und gegen die Aufgabenstellung, Korrektur von Formulierungen und Tippfehlern | Statustabelle, präzisierte Prüfkriterien, Spalte «Prüfbar mit»; Prozess und die drei Anforderungen stammen von der Gruppe | Pset-Definition in den IfcOpenShell-Templates nachgeschlagen  |
| Claude Opus 5.5 (Claude Code) | Auswertung des Modells `01_Snowdon_Towers_Sample_Structural.ifc` für Abschnitt 3                                           | Kennzahlen (Schema, Anzahl Elemente, fehlendes Pset, kein Terminplan) und drei Beispiel-`GlobalId`                        | `GlobalId` stichprobenweise im IFClite nachgeprüft; Kennzahlen mit IfcOpenShell direkt aus dem Modell ausgelesen            |
| Claude Opus 5.5 (Claude Code) | Abschnitte 3, 4 und 5 an das Modell des Dozenten und den neuen Prozess (`IsInstalled` durch Polier, `InstallationDate` als Soll-Datum) angepasst | Pset-Tabelle, Befund zum angepassten Modell, Prozess, Statustabelle, die drei Anforderungen sowie Input und Output der Automatisierung | Kennzahlen und Beispiel-`GlobalId` mit IfcOpenShell aus dem neuen Modell ausgelesen |


#BIM #IFC #Baustelle #MVP #Baufortschritt

