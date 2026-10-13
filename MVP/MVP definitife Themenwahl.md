
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

**Modell:** `01_Snowdon_Towers_Sample_Structural.ifc` (Schema IFC2X3, 1585 `IfcElement`, davon 139 `IfcOpeningElement`). Das Modell wird vom Dozenten angepasst und bereitgestellt, damit die Prüfung getestet und die Automatisierung erstellt werden kann.

Das IFC-4.3-PropertySet `Pset_InstallationOccurrence` (anwendbar auf `IfcElement`, `IfcAsset`, `IfcSystem`) definiert folgende Properties:

| Property               | Datentyp  | Bedeutung                                                |
| ---------------------- | --------- | -------------------------------------------------------- |
| `InstallationDate`     | `IfcDate` | Datum der Installation (bis zur Montage: geplantes Datum) |
| `AcceptanceDate`       | `IfcDate` | Datum der Abnahme                                        |
| `PutIntoOperationDate` | `IfcDate` | Datum der Inbetriebnahme (im MVP nicht verwendet)        |

Das Schema IFC2X3 kennt den Datentyp `IfcDate` nicht; bleibt das Modell in IFC2X3, muss die Gültigkeit des Datums (`YYYY-MM-DD`) über die eigene Prüflogik sichergestellt werden.

**Was fehlt im Modell (Stand Originalmodell):**

- Keines der 1585 Elemente trägt `Pset_InstallationOccurrence`; es gibt auch kein anderes PropertySet mit Installations- oder Abnahmedatum.
- Das Modell enthält keinen Terminplan (0 `IfcTask`, 0 `IfcWorkSchedule`).

| Beispiel | IFC-Klasse | `GlobalId` | Befund |
|---|---|---|---|
| Concrete-Rectangular-Column:CC24x24:606069 | `IfcColumn` | `3ZT5EhLQn6JfRlijT8hqQ9` | `Pset_InstallationOccurrence` fehlt |
| Concrete-Rectangular Beam:CB24x24:606873 | `IfcBeam` | `3ZT5EhLQn6JfRlijT8hpjb` | `Pset_InstallationOccurrence` fehlt |
| Floor:NW Concrete on Metal Deck:621720 | `IfcSlab` | `3eRW_mgkzCZQysdnuCHWNw` | `Pset_InstallationOccurrence` fehlt |

**Prozess:**
1. Das `InstallationDate` wird bei jedem Element initial gemäss Terminplan gesetzt (geplantes Datum).
2. Der Polier passt das `InstallationDate` bei der tatsächlichen Installation an und informiert die Bauleitung.
3. Die Bauleitung kontrolliert das Element und setzt das `AcceptanceDate`.

**Prüfbedarf:** Es wird untersucht, ob die Properties vorhanden, gültig und zueinander sowie zum Terminplan plausibel sind. Geprüft werden alle `IfcElement` ohne `IfcOpeningElement` (Öffnungen werden nicht montiert). Abweichungen werden mit der jeweiligen `GlobalId` dokumentiert. Aus den beiden Properties wird pro Bauteil der Status abgeleitet:

| `InstallationDate`   | `AcceptanceDate` | Status                                  |
| -------------------- | ---------------- | --------------------------------------- |
| in der Zukunft       | leer             | geplant                                 |
| heute oder vergangen | leer             | Abnahme ausstehend (Pendenz Bauleitung) |
| gesetzt              | gesetzt          | abgenommen                              |
| leer                 | beliebig         | Fehler                                  |

## 4. Drei Anforderungen

| Anforderung                                   | Prüfkriterium                                                                                                                                                | Quelle                                            | Prüfbar mit      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | ---------------- |
| Installationsdatum bei jedem Element erfasst  | `InstallationDate` vorhanden und ein gültiges Datum (`YYYY-MM-DD`)                                                                                           | IFC 4.3                                           | IDS              |
| Abnahmedatum plausibel                        | `AcceptanceDate`, falls gesetzt, ein gültiges Datum, nicht vor `InstallationDate` und nicht in der Zukunft                                                   | IFC 4.3, Projektregel (Abnahme folgt auf Montage) | eigene Prüflogik |
| Installationsdatum mit Terminplan abgeglichen | Jedes Element hat einen Soll-Termin im Terminplan; Abweichung `InstallationDate` − Soll-Termin wird in Tagen ausgewiesen, ein späteres Datum gilt als Verzug | Terminplan                                        | eigene Prüflogik |

## 5. MVP: Automatisierung

- **Input:** angepasstes IFC-Modell, Terminplan (Soll-Termin pro `GlobalId`)
- **Automatisierung:** Die drei Anforderungen prüfen, Status pro Bauteil ableiten und Abweichung zum Soll-Termin berechnen
- **Output:** Fortschrittsübersicht (geplant / Abnahme ausstehend / abgenommen), Terminabweichungen und offene Pendenzen mit `GlobalId`

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



#BIM #IFC #Baustelle #MVP #Baufortschritt

