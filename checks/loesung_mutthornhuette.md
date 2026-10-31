# Lösungsschlüssel · Mutthornhütte (Lehrmodell)

**Modell:** [`model/Mutthornhuette_Baufortschritt.ifc`](../model/Mutthornhuette_Baufortschritt.ifc)
- IFC2X3, 81 Bauteile, 4 Geschosse (Untergeschoss −2.72, Erdgeschoss 0.00, Obergeschoss +3.10, Dach +6.20)
- Erzeugt mit [`checks/erzeuge_mutthornhuette.js`](erzeuge_mutthornhuette.js), Aufruf `node checks/erzeuge_mutthornhuette.js` im Repository-Ordner (Node.js). Gleiches Script, gleiche Datei, also auch gleiche GlobalIds.

**Stichtag (Prüfdatum):** 03.11.2026

Das Modell ist vereinfacht, nach den Plänen und Fotos der Mutthornhütte: ein Baukörper von 22.80 × 11.50 m mit Satteldach (Blech mit Falzen), ein Untergeschoss nur im Westteil, Wände und Decken als einfache Volumen. Die Fassade folgt den Fotos:
- **Lärchenschalung** mit vertikalen Brettern rundum
- **PV-Module** im OG-Band der Südseite und am ganzen Westgiebel
- **Fenster** mit Rahmen, an den Giebeln als Fensterbänder
- **Gitterrost-Terrasse** im Süden

Jedes Bauteil trägt `Pset_InstallationOccurrence` mit `InstallationDate` (IfcLabel, JJJJ-MM-TT), `IsInstalled` (IfcBoolean) und `AcceptanceDate` (IfcLabel).

## Bauablauf (Soll)

| Zeitraum | Arbeiten | Stand am 03.11.2026 |
|---|---|---|
| 14.–24.09. | Fundamente, Betonsockel, Bodenplatte und Wände UG | montiert und abgenommen (Ausnahme: Betonsockel 4) |
| 29.09.–20.10. | Boden EG, Wände, Stützen und Unterzug EG, Wassertanks, Treppe UG–EG | montiert, teils abgenommen |
| 19.–28.10. | Innenwände EG Nord, Decke über EG, Treppe EG–OG | **im Verzug** |
| 04.–06.11. | Fenster EG, Hauseingangstür | geplant |
| 09.–19.11. | Obergeschoss: Wände, Decke, Fenster; Fensterbänder West und Ost | geplant |
| 17.–18.11. | Dachflächen | geplant |
| 20.–26.11. | Lärchenschalung Süd, Nord, Ost; PV-Fassade Süd und West; Terrasse | geplant |

Damit ist am Stichtag etwa die Hälfte gebaut: Fundament und UG sind fertig, das EG ist im Rohbau. Dach und Fassade fehlen noch.

## Erwartetes Ergebnis im Baufortschritt-Check (Prüfdatum 03.11.2026)

| Kennzahl | Wert |
|---|---|
| Geprüfte Bauteile | 81 (keine Öffnungen) |
| Montiert | 33 von 81 (41 %) |
| Abgenommen | 20 |
| Abnahme ausstehend | 12 |
| Montage überfällig | 4 (grösster Verzug 15 Tage) |
| Geplant | 39 |
| Daten fehlerhaft | 6 |
| Anforderung 1 | 76 von 81 erfüllt, 5 nicht erfüllt |
| Anforderung 2 | 20 von 21 Abnahmen plausibel, 1 fehlerhaft, 2 Hinweise (vorzeitig montiert) |
| Anforderung 3 | 4 von 44 offenen Montagen im Verzug |

Nach Geschoss:

| Geschoss | Abgenommen | Abnahme ausstehend | Überfällig | Geplant | Fehler |
|---|---|---|---|---|---|
| Untergeschoss | 15 | 5 | 0 | 0 | 2 |
| Erdgeschoss (inkl. Fassade und Terrasse) | 5 | 7 | 4 | 14 | 3 |
| Obergeschoss | 0 | 0 | 0 | 23 | 1 |
| Dach | 0 | 0 | 0 | 2 | 0 |

## Die 6 eingebauten Datenfehler

| Nr. | Bauteil | Klasse | GlobalId | Wert im Modell | Erwartete Meldung | Anforderung |
|---|---|---|---|---|---|---|
| F1 | Wassertank 2 | IfcFlowStorageDevice | `0YoDRe$5vuQ0vtGGKlgxcM` | `InstallationDate` leer | Soll-Datum ist leer | 1 |
| F2 | Wassertank 4 | IfcFlowStorageDevice | `0POtwNONii4J46o7qXjdfw` | `InstallationDate` leer | Soll-Datum ist leer | 1 |
| F3 | PV-Fassade West | IfcEnergyConversionDevice | `11QiS8gHllgXAgn2d6$9hM` | `InstallationDate` = `24.11.2026` | kein gültiges Datum (falsches Format) | 1 |
| F4 | Stütze Korridor EG 3 | IfcColumn | `05slm1_p8XRKGQZASBcbP$` | `InstallationDate` = `2026-09-31` | kein gültiges Datum (den 31. September gibt es nicht) | 1 |
| F5 | Zimmerwand OG Nord 2 | IfcWall | `3ogzU7APuubcAsHw19O1kV` | `IsInstalled` = IfcLabel `'FALSE'` | kein Ja/Nein-Wert (IfcLabel statt IfcBoolean) | 1 |
| F6 | Hauseingangstür | IfcDoor | `0fNpFhOGYfqCYLXat$muz9` | `IsInstalled` = FALSE, `AcceptanceDate` = 2026-10-28 | Abnahme erfasst, aber Bauteil ist nicht montiert | 2 |

F4 ist ein guter Prüfstein: Das IDS-Pattern `\d{4}-\d{2}-\d{2}` lässt `2026-09-31` durch, der Baufortschritt-Check nicht.

## Weitere Prüffälle (keine Datenfehler)

| Bauteil | GlobalId | Werte | Erwarteter Status |
|---|---|---|---|
| Betonsockel 4 | `273EuNfk2JDWRG36A9XG2N` | montiert am Soll-Datum 17.09., keine Abnahme (die anderen 5 Sockel sind abgenommen) | Abnahme ausstehend |
| Fenster EG Süd 3 | `2dV8jK1dSfJaDA_RedMxe7` | Soll-Datum 05.11., schon montiert und am 30.10. abgenommen | Abgenommen, mit Hinweis «vorzeitig montiert» |
| Innenwand EG Nord 1 | `3dhB2dWoi$fZhkojEyxWPJ` | Soll-Datum 19.10., nicht montiert | Montage überfällig, 15 Tage |
| Innenwand EG Nord 2 | `3z$SS0wVm1E2YNE7ON3ZM9` | Soll-Datum 20.10., nicht montiert | Montage überfällig, 14 Tage |
| Decke über EG | `1sTThlokqIzGFA81PRYp7C` | Soll-Datum 26.10., nicht montiert | Montage überfällig, 8 Tage |
| Treppe EG–OG | `0$IC$gQZoTgxqwIHNqeu1_` | Soll-Datum 28.10., nicht montiert | Montage überfällig, 6 Tage |

Ein Bauteil, das vor seinem Soll-Datum montiert wurde, lässt sich nur über das Abnahmedatum erkennen, denn das Modell hat kein Ist-Datum der Montage. Darum ist Fenster EG Süd 3 schon abgenommen. Bei der Hauseingangstür (F6) erscheint derselbe Hinweis zusätzlich zum Fehler.

## Prüfung des Modells

- IfcOpenShell 0.9.0: Schema-Validierung ohne Befund, 257 GlobalIds ohne Duplikate, Geometrie für alle 81 Bauteile erzeugt.
- Baufortschritt-Check (Prüflogik der HTML-Datei in [`apps/baufortschritt-check/`](../apps/baufortschritt-check/)): Ergebnis wie oben.
