import sys
from collections import Counter
from pathlib import Path

import ifcopenshell
import ifcopenshell.util.element as el

# Aufruf: python kennzahlen.py [Pfad zum IFC-Modell]
pfad = sys.argv[1] if len(sys.argv) > 1 else Path(__file__).parent.parent / "model" / "Team_4_Snowdon_Baufortschritt_IsInstalled.ifc"
model = ifcopenshell.open(str(pfad))

print("Modell:", pfad)
print("Schema:", model.schema)

elemente = model.by_type("IfcElement")
print("Anzahl IfcElement:", len(elemente))
for klasse, anzahl in Counter(e.is_a() for e in elemente).most_common():
    print("  ", klasse, anzahl)

# Terminplan im Modell?
print("IfcTask:        ", len(model.by_type("IfcTask")))
print("IfcWorkSchedule:", len(model.by_type("IfcWorkSchedule")))

# Öffnungen werden nicht montiert und deshalb nicht geprüft
bauteile = [e for e in elemente if not e.is_a("IfcOpeningElement")]
print("Geprüfte Bauteile (ohne IfcOpeningElement):", len(bauteile))

mit, ohne = [], []
for bauteil in bauteile:
    psets = el.get_psets(bauteil)       # Instanz- UND Typ-Properties
    (mit if "Pset_InstallationOccurrence" in psets else ohne).append(bauteil)

print("Mit Pset_InstallationOccurrence: ", len(mit))
print("Ohne Pset_InstallationOccurrence:", len(ohne))

# Je ein Beispiel pro Klasse als Evidenz
print("Beispiele ohne Pset:")
for klasse in ("IfcColumn", "IfcBeam", "IfcSlab"):
    for bauteil in ohne:
        if bauteil.is_a(klasse):
            print("  ", klasse, bauteil.GlobalId, bauteil.Name)
            break
