import csv
import sys
from pathlib import Path

import ifcopenshell
import ifcopenshell.api

# Schreibt Testwerte für Pset_InstallationOccurrence in eine Kopie des Snowdon-Modells.
# Aufruf: python ergaenze_testdaten.py <Pfad zu einer Kopie des Original-Modells>
# Das Modell wird überschrieben; loesung.csv wird neben diesem Skript abgelegt.
# ACHTUNG: Dieses Skript und loesung.csv enthalten die Lösung für den IDS-Test.
# ARCHIV: gehört zum alten Testmodell (Stand 18.10.2026), siehe requirements/archiv/README.md.
if len(sys.argv) < 2:
    sys.exit("Aufruf: python ergaenze_testdaten.py <Pfad zu einer Kopie des Original-Modells>")
pfad = sys.argv[1]
model = ifcopenshell.open(pfad)

PSET = "Pset_InstallationOccurrence"

# Schutz: ein bereits ergänztes Modell nicht ein zweites Mal beschreiben
if any(p.Name == PSET for p in model.by_type("IfcPropertySet")):
    sys.exit(f"{PSET} ist im Modell bereits vorhanden, Abbruch.")

# (Status, InstallationDate, AcceptanceDate, Bemerkung); None = Property fehlt
FAELLE = [
    *[("geplant", f"2027-0{m}-1{m}", None, "Plandatum in der Zukunft") for m in range(1, 10)],
    *[("Abnahme ausstehend", f"2026-09-{t:02d}", None, "montiert, nicht abgenommen") for t in range(1, 28, 3)],
    *[("abgenommen", f"2026-0{m}-0{m}", f"2026-0{m}-2{m}", "korrekt") for m in range(1, 10)],
    ("Fehler", None, "2026-09-15", "InstallationDate fehlt, AcceptanceDate gesetzt"),
    ("Fehler", None, None, "Pset nur mit PutIntoOperationDate, InstallationDate fehlt"),
    ("Fehler", "", None, "InstallationDate leer"),
    ("Fehler", "", "2026-08-20", "InstallationDate leer, AcceptanceDate gesetzt"),
    ("abgenommen", "2026-09-10", "2026-09-01", "Anforderung 2 verletzt: Abnahme vor Installation"),
    ("abgenommen", "2026-07-15", "2026-07-10", "Anforderung 2 verletzt: Abnahme vor Installation"),
    ("abgenommen", "2026-09-30", "2027-02-15", "Anforderung 2 verletzt: Abnahme in der Zukunft"),
    ("abgenommen", "2026-10-01", "2027-01-20", "Anforderung 2 verletzt: Abnahme in der Zukunft"),
    ("Fehler", "20.09.2026", None, "Anforderung 1 verletzt: ungültiges Datumsformat"),
    ("abgenommen", "2026-08-03", "3.9.2026", "Anforderung 2 verletzt: ungültiges Datumsformat"),
]

# Bauteile über mehrere Klassen verteilt auswählen (deterministisch, nach GlobalId sortiert)
klassen = ["IfcColumn", "IfcBeam", "IfcSlab", "IfcWallStandardCase", "IfcFooting"]
kandidaten = {k: sorted(model.by_type(k, include_subtypes=False), key=lambda e: e.GlobalId) for k in klassen}
auswahl = []
i = 0
while len(auswahl) < len(FAELLE):
    liste = kandidaten[klassen[i % len(klassen)]]
    index = (i // len(klassen)) * 7
    if index < len(liste):
        auswahl.append(liste[index])
    i += 1

zeilen = []
for bauteil, (status, installation, abnahme, bemerkung) in zip(auswahl, FAELLE):
    pset = ifcopenshell.api.run("pset.add_pset", model, product=bauteil, name=PSET)
    werte = {}
    if installation is not None:
        werte["InstallationDate"] = installation
    if abnahme is not None:
        werte["AcceptanceDate"] = abnahme
    if not werte:
        werte["PutIntoOperationDate"] = "2026-10-01"
    for name, wert in werte.items():
        # IFC2X3 kennt kein IfcDate, deshalb als IfcLabel
        pset.HasProperties = list(pset.HasProperties or []) + [
            model.createIfcPropertySingleValue(name, None, model.createIfcLabel(wert), None)
        ]
    zeilen.append([bauteil.GlobalId, bauteil.is_a(), bauteil.Name, installation, abnahme, status, bemerkung])

# IFC2X3 verlangt eine OwnerHistory bei neuen Objekten: die bestehende übernehmen
owner_history = model.by_type("IfcOwnerHistory")[0]
for objekt in model.by_type("IfcPropertySet") + model.by_type("IfcRelDefinesByProperties"):
    if objekt.OwnerHistory is None:
        objekt.OwnerHistory = owner_history

model.write(pfad)

with open(Path(__file__).parent / "loesung.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f, delimiter=";")
    writer.writerow(["GlobalId", "Klasse", "Name", "InstallationDate", "AcceptanceDate", "Status", "Bemerkung"])
    writer.writerows(zeilen)

print(len(zeilen), "Bauteile ergänzt, Lösung in loesung.csv")
