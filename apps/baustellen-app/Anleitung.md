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

## Regeln beim Speichern

- Geändert werden nur Werte in `Pset_InstallationOccurrence`: `IsInstalled` (Polier), `AcceptanceDate` (Bauleitung) und `InstallationDate`. Das Soll-Datum ändert nur die Bauleitung, und nur bei Datenfehlern. Ebenso korrigiert sie `IsInstalled` nur, wenn der Wert fehlt oder ungültig ist.
- Abgenommene Bauteile kann der Polier nicht zurücksetzen.
- Ist ein Pset oder eine Property für mehrere Bauteile gemeinsam, trennt die App sie für das geänderte Bauteil. Fehlt das Pset oder die Property, wird sie angelegt.
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

- Mit dem Mutthorn-Modell (Stichtag 03.11.2026):
  - Polier meldet 4 überfällige Bauteile → gespeichertes IFC hat 37 montierte Bauteile.
  - Bauleitung nimmt alle 16 offenen ab → 36 abgenommen, 0 ausstehend.
  - Das Ergebnis aus dem Browser ist byte-gleich mit einem Kontrolllauf in Node. IfcOpenShell meldet keinen Befund, alle 81 Bauteile haben Geometrie.
- Geteiltes Pset, geteilte Property und fehlendes Pset: mit einem Testmodell geprüft.
- Modell des Dozenten (9 MB): 265 Änderungen in rund 0,1 s geschrieben. Das 3D-Modell der Bauleitung lädt in rund 3 s.

## Grenzen

- Arbeiten zwei Personen gleichzeitig an derselben Datei, gewinnt die zuletzt gespeicherte. Darum pro Modell immer nur eine Person gleichzeitig.
- Nicht gespeicherte Abnahmen gehen beim Schliessen verloren, die App warnt davor. Meldungen des Poliers bleiben im Browser zwischengespeichert.
- Getestet über einen lokalen Webserver in Chrome, auch mit `Baustellen-App.html` allein in einem leeren Ordner. Öffnen per Doppelklick (`file://`) ist noch nicht vollständig geprüft.
