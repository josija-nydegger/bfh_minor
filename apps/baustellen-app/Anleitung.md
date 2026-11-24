# Anleitung Baustellen-App (Prototyp, Variante A)

Die Baustellen-App fasst Polier-Tool und Baufortschritt-Check zusammen. Das Passwort bestimmt die Rolle. Die Rückmeldungen schreibt die App **direkt ins IFC-Modell**: Es gibt kein CSV und kein `csv_ins_ifc.py` mehr. Konzept: [Konzept_Baustellen-App.md](../../workflow/Konzept_Baustellen-App.md).

**Zum Benutzen braucht es nur eine Datei:** `Baustellen-App.html`. Sie lässt sich einzeln herunterladen, weitergeben und per Doppelklick öffnen, beide Ansichten sind darin enthalten.

| Datei | Inhalt |
|---|---|
| `Baustellen-App.html` | **die App** (erzeugt, nicht direkt bearbeiten): Login, Modell öffnen, **Stand speichern** (schreibt das IFC), Polier- und Bauleitungs-Ansicht |
| `src/app.html` | Quelle: Login, Modell öffnen, IFC-Schreiber |
| `src/polier.html` | Quelle: Polier-Ansicht, aus dem Polier-Tool ohne CSV |
| `src/bauleitung.html` | Quelle: Bauleitungs-Ansicht, aus dem Baufortschritt-Check, mit **Abnehmen** und 3D-Modell |
| `build.js` | packt die Quellen zu `Baustellen-App.html` |
| `baufortschritt.js` | Zweitprüfung als Skript in https://www.ifclite.com (Analyze → Script Editor), unabhängig von der App |

**Etwas ändern:** Die Dateien in `src/` bearbeiten und danach im Repository-Ordner neu bauen (Node.js):

```bash
node apps/baustellen-app/build.js
```

## Ablauf an einem Tag

1. **Polier:** `Baustellen-App.html` öffnen und mit dem Polier-Passwort anmelden. Dann das aktuelle IFC aus dem gemeinsamen Ordner öffnen.
2. Bauteile wie im Polier-Tool als montiert melden. Oben steht, wie viele Änderungen noch nicht gespeichert sind.
3. **Stand speichern:** Die App speichert `<Modell>_stand_<Datum>_<Uhrzeit>.ifc` im Download-Ordner. Diese Datei in den gemeinsamen Ordner legen.
4. **Bauleitung:** mit dem Bauleitungs-Passwort anmelden und diese neue Datei öffnen. Der Check läuft sofort.
   Unter **Modell nach Status** zeigt ein 3D-Modell die Bauteile in den Farben der Übersicht. Geplante Bauteile sind durchscheinend, damit der Rohbau sichtbar bleibt. Der Filter der Bauteilliste (z. B. «Montage überfällig») wirkt auch im Modell. Ein Klick auf ein Bauteil zeigt Status, Soll-Datum und Abnahme. Bei offener Abnahme lässt es sich dort direkt **abnehmen**.
   **Datenfehler korrigieren:** Bei Bauteilen mit «Daten fehlerhaft» öffnet **Korrigieren** (in der Liste oder in der 3D-Detailkarte) einen Dialog. Dort setzt oder ändert die Bauleitung das **Soll-Datum** (`InstallationDate`) und setzt, ändert oder leert das **Abnahmedatum**. Ein Abnahmedatum ist nur bei montierten Bauteilen möglich und höchstens bis heute bzw. zum Prüfdatum. Fehlt der **Montagestatus** (`IsInstalled`) oder ist er kein Ja/Nein-Wert (z. B. Text `'FALSE'`), wählt die Bauleitung «Ja» oder «Nein». Die App speichert dann ein korrektes `IfcBoolean`. Gültige Werte meldet weiterhin der Polier. **Korrektur zurücknehmen** steht danach beim Bauteil.
5. Vor Ort kontrollieren, dann in der Bauteilliste bei «Abnahme ausstehend» auf **Abnehmen** klicken, oder **Alle … angezeigten abnehmen**. Das Abnahmedatum ist das Prüfdatum. Ein Datum nach heute ist nicht möglich. **Rückgängig** steht beim Bauteil unter «Abgenommen».
6. **Stand speichern** und die neue Datei wieder in den gemeinsamen Ordner legen. Den Prüfbericht für `results/` speichert ihr wie bisher unter «Ergebnis sichern».

## Wetter am Standort

Damit ein Verzug begründet und bei Streitigkeiten nachvollzogen werden kann, speichert die App das Wetter im IFC: pro Tag für das ganze Modell und bei jeder Montage für das Bauteil. Für die Modellwerte braucht es Internet.

- **Modellwerte immer, Messung nur von der eigenen Station:** Die nächsten Stationen von MeteoSchweiz liegen für die Hütte zu weit weg oder zu tief (Blatten 7 km, 1240 m tiefer; Jungfraujoch 15 km, ohne Niederschlag). Niederschlag und Wind sind zu lokal, um sie von dort zu übernehmen. Gemessene Werte kommen deshalb nur von einer eigenen Messstation auf der Baustelle. Der Polier tippt sie ab.
- **Standort:** aus `IfcSite` (`RefLatitude`, `RefLongitude`, `RefElevation`). Fehlen die Koordinaten, zeigt die App kein Wetter. Die Mutthornhütte steht auf 46.48700 N, 7.81672 O, 2788 m ü. M. (neue Hütte, Wikipedia). Gesendet werden nur die Koordinaten.
- **Modell-Tageswerte, zwei Modelle:** Beide kommen von [Open-Meteo](https://open-meteo.com), Zeitzone Europe/Zurich, und beide werden gespeichert und angezeigt.
  - **ICON-CH1** (MeteoSchweiz-Modell, Raster etwa 1 km): bildet Grat, Gletscher und Höhe gut ab und ist schon am nächsten Tag da. Es sind kurzfristige Prognoseläufe, aneinandergereiht (Historical Forecast), keine nachträglich korrigierte Reanalyse. Bei Open-Meteo erst ab etwa September 2025. **ICON-CH1 gilt.**
  - **ERA5** (Reanalyse, Raster rund 10–25 km): das etablierte Archiv, mit Beobachtungen nachgerechnet, lange zurück verfügbar. Dient zum Vergleich und als Ersatz für Tage ohne ICON-CH1.
  - Vergleich Mutthornhütte 28.09.–23.11.2026: ICON-CH1 zeigt rund 20 % mehr Niederschlag, 60 % mehr Schnee und nachts im Mittel 3,5 °C wärmere Minima; 24 statt 21 Schlechtwettertage, uneinig an 3 von 57 Tagen.
  - Zeitraum: vom frühesten Datum im Modell bis gestern, höchstens 400 Tage. Beim Öffnen holt die App nur die Tage, die noch nicht im IFC stehen. Gespeicherte Tage bleiben unverändert, sie sind der Beleg.
- **Messung eigene Station pro Tag (Polier):** Bei «Heute» oder «Überfällig» unter dem Wetterstreifen auf **Messung eigene Station erfassen …** tippen. Möglich nur für heute oder gestern: Station, Niederschlag Tagessumme (mm), Temperatur min/max (°C), Böen max (km/h). Leere Felder gelten als nicht gemessen. Bis zum Speichern lässt sich die Eingabe ändern oder löschen, danach ist der Tag fest im IFC. Die App merkt sich den Stationsnamen auf dem Gerät.
- **Wetter bei der Montage:** Meldet der Polier ein Bauteil als montiert, merkt sich die App die Uhrzeit und holt den Stundenwert des MeteoSchweiz-Modells ICON-CH1 (Raster etwa 1 km, sonst ICON-CH2) über Open-Meteo. Ohne Internet holt sie den Wert nach, aber nur am selben Kalendertag (beim nächsten Öffnen, alle 5 Minuten oder sobald wieder Netz da ist). Danach bleibt «nicht abgerufen» stehen, rückwirkend wird nichts ergänzt.
- **Messung eigene Station bei der Montage (Polier, optional):** In der Detailansicht des montierten Bauteils auf **Messung eigene Station erfassen …** tippen: Station, Temperatur, Niederschlag der letzten Stunde, Wind, Böen. Nur am Montagetag. Die Messung gilt für alle Bauteile, die zur selben Minute gemeldet wurden (z. B. «Alle … als montiert melden»).
- **Speichern:** Mit «Stand speichern» schreibt die App:
  - Pset `Baufortschritt_Wetter_ICON_CH1` an `IfcSite` (Modell ICON-CH1) und Pset `Baufortschritt_Wetter` an `IfcSite` (Modell ERA5), je mit `Datum`, `Niederschlag_mm`, `Schnee_cm`, `Wind_max_kmh`, `Boeen_max_kmh`, `Temp_max_C`, `Temp_min_C` (je eine Liste, `IfcPropertyListValue`) sowie `Quelle` und `Abgerufen`. Fehlwert 0.
  - Pset `Baufortschritt_Wetter_Messung` an `IfcSite` (eigene Station): `Datum`, `Niederschlag_mm`, `Temp_min_C`, `Temp_max_C`, `Boeen_max_kmh`, `Station`, `Erfasst` (Zeitpunkt der Eingabe) als Listen sowie `Quelle`. Fehlwert −999 = nicht erfasst.
  - Pset `Baufortschritt_Montagewetter` am Bauteil: `Zeitpunkt`, `Status` (abgerufen, ausstehend), `Abgerufen`, `Quelle`, `Modell`, `Modell_Stunde`, `Modell_Temp_C`, `Modell_Niederschlag_mm_h`, `Modell_Schnee_cm_h`, `Modell_Wind_kmh`, `Modell_Boeen_kmh` sowie `Mess_Station`, `Mess_Zeit`, `Mess_Temp_C`, `Mess_Niederschlag_mm_1h`, `Mess_Wind_kmh`, `Mess_Boeen_kmh` (leer = nicht erfasst).
  - Neue Wettertage, Messungen und Montagewetter allein blockieren Öffnen und Abmelden nicht.
- **Schlechtwettertag:** Niederschlag ≥ 5 mm, Schnee ≥ 2 cm oder Böen ≥ 60 km/h. Pro Wert gilt die Messung der eigenen Station, wo erfasst, sonst ICON-CH1, sonst ERA5. Schnee kommt immer aus dem Modell. Das ist ein Richtwert für die Begründung, keine vertragliche Regel.
- **Bauleitung:** Grafik «Wetter am Standort» mit Niederschlag pro Tag und markierten Schlechtwettertagen; ein Punkt über dem Balken heisst «Messung eigene Station», der Tooltip nennt die Quelle jedes Werts und zeigt ICON-CH1 und ERA5 nebeneinander. Unter der Grafik stehen beide Modelle getrennt (Schlechtwettertage, Niederschlag, Böen). Bei überfälligen Bauteilen steht in der Liste, in der 3D-Detailkarte und im CSV-Bericht das Wetter vom Soll-Datum bis zum Prüfdatum (in Karte und CSV zusätzlich beide Modelle getrennt), bei montierten Bauteilen in der 3D-Detailkarte und im CSV-Bericht das Wetter bei der Montage. Die Bauleitung erfasst keine Messungen.
- **Polier:** Bei «Heute» und «Überfällig» zeigt ein Streifen das Wetter der letzten 7 Tage vor dem Stichtag (• = Messung eigene Station; beim Antippen bzw. Darüberfahren beide Modelle). Überfällige Bauteile zeigen die Zahl der Schlechtwettertage seit dem Soll-Datum, die Detailansicht die Summe und beide Modelle getrennt. Montierte Bauteile zeigen in der Detailansicht das Wetter bei der Montage.

## Regeln beim Speichern

- Geändert werden nur Werte in `Pset_InstallationOccurrence`: `IsInstalled` (Polier), `AcceptanceDate` (Bauleitung) und `InstallationDate`. Das Soll-Datum ändert nur die Bauleitung, und nur bei Datenfehlern. Ebenso korrigiert sie `IsInstalled` nur, wenn der Wert fehlt oder ungültig ist.
- Abgenommene Bauteile kann der Polier nicht zurücksetzen.
- Ist ein Pset oder eine Property für mehrere Bauteile gemeinsam, trennt die App sie für das geänderte Bauteil. Fehlt das Pset oder die Property, wird sie angelegt.
- Wetter kommt in die Psets `Baufortschritt_Wetter_ICON_CH1`, `Baufortschritt_Wetter` und `Baufortschritt_Wetter_Messung` an `IfcSite` und ins Pset `Baufortschritt_Montagewetter` am Bauteil (siehe oben).
- Alle übrigen Zeilen der IFC-Datei bleiben byte-gleich.

## Passwörter

Im Code stehen nur die SHA-256-Hashes. Die Passwörter selbst werden nicht im Repository gespeichert, sondern im Team weitergegeben. Neues Passwort:

```bash
python -c "import hashlib; print(hashlib.sha256('NEUES-PASSWORT'.encode()).hexdigest())"
```

Den ausgegebenen Hash in `src/app.html` bei `ROLES` ersetzen und neu bauen.

**Anmelden aus einer anderen Seite:** Ist die App in einer Seite eingebettet (iframe, z. B. `pitch/Zwischenpitch.html`), kann diese Seite das Passwort mit `postMessage({ type: "bs-login", pw })` schicken. Die App prüft es mit demselben Hash wie das Login-Formular und antwortet mit `{ type: "bs-login-result", ok, role }`. Mit ungespeicherten Änderungen wechselt sie die Rolle nicht. Die Präsentation fragt das Passwort einmal pro Browser-Tab ab und speichert es nur im `sessionStorage`. Im Repository steht es nicht.

**Wichtig:** Der Passwortschutz verhindert Fehlbedienung, er ist aber **kein Datenschutz**. Wer den Code öffnet, kann ihn umgehen. Für echten Schutz braucht es Variante B mit Server (siehe Konzept).

## Getestet (03.11.2026)

- Mit dem Mutthorn-Modell (Stichtag 03.11.2026; seit 16.11. sind alle Daten um 14 Tage verschoben, am Stichtag 17.11.2026 gilt dasselbe Ergebnis):
  - Polier meldet 4 Bauteile (am 17.11.: 2 heute fällig, 2 überfällig) → gespeichertes IFC hat 37 montierte Bauteile.
  - Bauleitung nimmt alle 16 offenen ab → 36 abgenommen, 0 ausstehend.
  - Das Ergebnis aus dem Browser ist byte-gleich mit einem Kontrolllauf in Node. IfcOpenShell meldet keinen Befund, alle 81 Bauteile haben Geometrie.
- Geteiltes Pset, geteilte Property und fehlendes Pset: mit einem Testmodell geprüft.
- Modell des Dozenten (9 MB): 265 Änderungen in rund 0,1 s geschrieben. Das 3D-Modell der Bauleitung lädt in rund 3 s.

## Grenzen

- Arbeiten zwei Personen gleichzeitig an derselben Datei, gewinnt die zuletzt gespeicherte. Darum pro Modell immer nur eine Person gleichzeitig.
- Nicht gespeicherte Abnahmen gehen beim Schliessen verloren, die App warnt davor. Meldungen des Poliers bleiben im Browser zwischengespeichert.
- Getestet über einen lokalen Webserver in Chrome, auch mit `Baustellen-App.html` allein in einem leeren Ordner. Öffnen per Doppelklick (`file://`) funktioniert (Test Josija, 04.11.2026). Die Polier-Ansicht, das 3D-Modell und das Wetter brauchen Internet.
