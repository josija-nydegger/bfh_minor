# Anleitung Baustellen-App (Prototyp, Variante A)

Die Baustellen-App fasst Polier-Tool und Baufortschritt-Check zusammen. Das Passwort bestimmt die Rolle. Die Rückmeldungen schreibt die App **direkt ins IFC-Modell**: Es gibt kein CSV und kein `csv_ins_ifc.py` mehr. Konzept: [Konzept_Baustellen-App.md](../../workflow/Konzept_Baustellen-App.md).

| Datei | Inhalt |
|---|---|
| `Baustellen-App.html` | Login, Modell öffnen, **Stand speichern** (schreibt das IFC) |
| `polier.html` | Polier-Ansicht, aus dem Polier-Tool ohne CSV |
| `bauleitung.html` | Bauleitungs-Ansicht, aus dem Baufortschritt-Check mit **Abnehmen** |
| `baufortschritt.js` | Zweitprüfung als Skript in https://www.ifclite.com (Analyze → Script Editor), unabhängig von der App |

Alle drei Dateien müssen im selben Ordner liegen. Die Ansichten lassen sich nur über `Baustellen-App.html` öffnen.

## Ablauf an einem Tag

1. **Polier:** `Baustellen-App.html` öffnen und mit dem Polier-Passwort anmelden. Dann das aktuelle IFC aus dem gemeinsamen Ordner öffnen.
2. Bauteile wie im Polier-Tool als montiert melden. Oben steht, wie viele Änderungen noch nicht gespeichert sind.
3. **Stand speichern:** Die App speichert `<Modell>_stand_<Datum>_<Uhrzeit>.ifc` im Download-Ordner. Diese Datei in den gemeinsamen Ordner legen.
4. **Bauleitung:** mit dem Bauleitungs-Passwort anmelden und diese neue Datei öffnen. Der Check läuft sofort.
5. Vor Ort kontrollieren, dann in der Bauteilliste bei «Abnahme ausstehend» auf **Abnehmen** klicken, oder **Alle … angezeigten abnehmen**. Das Abnahmedatum ist das Prüfdatum. Ein Datum nach heute ist nicht möglich. **Rückgängig** steht beim Bauteil unter «Abgenommen».
6. **Stand speichern** und die neue Datei wieder in den gemeinsamen Ordner legen. Den Prüfbericht für `results/` speichert ihr wie bisher unter «Ergebnis sichern».

## Regeln beim Speichern

- Geändert werden nur `IsInstalled` (Polier) und `AcceptanceDate` (Bauleitung) in `Pset_InstallationOccurrence`. `InstallationDate` bleibt unverändert.
- Abgenommene Bauteile kann der Polier nicht zurücksetzen.
- Ist ein Pset oder eine Property für mehrere Bauteile gemeinsam, trennt die App sie für das geänderte Bauteil. Fehlt das Pset oder die Property, wird sie angelegt.
- Alle übrigen Zeilen der IFC-Datei bleiben byte-gleich.

## Passwörter

Im Code stehen nur die SHA-256-Hashes. Die Passwörter selbst werden nicht im Repository gespeichert, sondern im Team weitergegeben. Neues Passwort:

```bash
python -c "import hashlib; print(hashlib.sha256('NEUES-PASSWORT'.encode()).hexdigest())"
```

Den ausgegebenen Hash in `Baustellen-App.html` bei `ROLES` ersetzen.

**Wichtig:** Der Passwortschutz verhindert Fehlbedienung, er ist aber **kein Datenschutz**. Wer den Code öffnet, kann ihn umgehen. Für echten Schutz braucht es Variante B mit Server (siehe Konzept).

## Getestet (03.11.2026)

- Mit dem Mutthorn-Modell (Stichtag 03.11.2026):
  - Polier meldet 4 überfällige Bauteile → gespeichertes IFC hat 37 montierte Bauteile.
  - Bauleitung nimmt alle 16 offenen ab → 36 abgenommen, 0 ausstehend.
  - Das Ergebnis aus dem Browser ist byte-gleich mit einem Kontrolllauf in Node. IfcOpenShell meldet keinen Befund, alle 81 Bauteile haben Geometrie.
- Geteiltes Pset, geteilte Property und fehlendes Pset: mit einem Testmodell geprüft.
- Modell des Dozenten (9 MB): 265 Änderungen in rund 0,1 s geschrieben.

## Grenzen

- Arbeiten zwei Personen gleichzeitig an derselben Datei, gewinnt die zuletzt gespeicherte. Darum pro Modell immer nur eine Person gleichzeitig.
- Nicht gespeicherte Abnahmen gehen beim Schliessen verloren, die App warnt davor. Meldungen des Poliers bleiben im Browser zwischengespeichert.
- Getestet über einen lokalen Webserver in Chrome. Öffnen per Doppelklick (`file://`) ist noch nicht geprüft.
