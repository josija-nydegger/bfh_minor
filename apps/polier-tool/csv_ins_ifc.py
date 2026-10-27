import argparse
import csv
import sys
from datetime import date
from pathlib import Path

import ifcopenshell
import ifcopenshell.api

# Führt die Rückmeldung des Poliers (CSV aus dem Polier-Tool) ins IFC-Modell zurück.
# Gesetzt wird nur Pset_InstallationOccurrence.IsInstalled (IfcBoolean);
# InstallationDate und AcceptanceDate bleiben unverändert.
#
# Aufruf: python csv_ins_ifc.py <modell.ifc> <rueckmeldung.csv> [weitere.csv ...] [-o <ausgabe.ifc>] [--alle]
# Ergebnis: neues IFC (Standard: <modell>_rueckgemeldet_<datum>.ifc) und daneben ein Protokoll als CSV.

PSET = "Pset_InstallationOccurrence"
PROP = "IsInstalled"
SPALTEN = {"GlobalId", "IsInstalled", "GeaendertDurchPolier"}


def lies_csv(pfad, alle):
    """Gibt {GlobalId: (True/False, InstallationDate aus CSV)} zurück; ungültige Zeilen landen in fehler."""
    werte, fehler = {}, []
    with open(pfad, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        fehlend = SPALTEN - set(reader.fieldnames or [])
        if fehlend:
            sys.exit(f"{pfad}: Spalten fehlen ({', '.join(sorted(fehlend))}). Ist das ein CSV aus dem Polier-Tool?")
        for zeile in reader:
            if not alle and zeile["GeaendertDurchPolier"].strip().lower() != "ja":
                continue
            guid, wert = zeile["GlobalId"].strip(), zeile["IsInstalled"].strip().upper()
            if wert not in ("TRUE", "FALSE"):
                fehler.append((guid, f"IsInstalled „{zeile['IsInstalled']}“ ist weder TRUE noch FALSE"))
                continue
            werte[guid] = (wert == "TRUE", zeile.get("InstallationDate", "").strip())
    return werte, fehler


def pset_von(bauteil):
    for rel in bauteil.IsDefinedBy or []:
        if rel.is_a("IfcRelDefinesByProperties") and rel.RelatingPropertyDefinition.is_a("IfcPropertySet") \
                and rel.RelatingPropertyDefinition.Name == PSET:
            return rel.RelatingPropertyDefinition, rel
    return None, None


def eigenschaften(pset):
    return {p.Name: p for p in pset.HasProperties or [] if p.is_a("IfcPropertySingleValue")}


def wert_von(prop):
    if prop is None or prop.NominalValue is None:
        return None
    return prop.NominalValue.wrappedValue


def setze(model, bauteil, wert, owner_history):
    """Setzt IsInstalled; gibt (alter Wert, Hinweis) zurück oder wirft ValueError, wenn nichts geändert werden darf."""
    pset, rel = pset_von(bauteil)
    if pset is None:
        pset = ifcopenshell.api.run("pset.add_pset", model, product=bauteil, name=PSET)
        for objekt in (pset, *model.get_inverse(pset)):
            if hasattr(objekt, "OwnerHistory") and objekt.OwnerHistory is None:
                objekt.OwnerHistory = owner_history
        hinweis = f"{PSET} neu angelegt"
    elif len(rel.RelatedObjects) > 1:
        raise ValueError(f"{PSET} wird von {len(rel.RelatedObjects)} Bauteilen geteilt")
    else:
        hinweis = ""
    props = eigenschaften(pset)
    acceptance = wert_von(props.get("AcceptanceDate"))
    alt = props.get(PROP)
    alter_wert = wert_von(alt)
    if acceptance and wert is False:
        raise ValueError(f"bereits abgenommen (AcceptanceDate {acceptance}), IsInstalled bleibt TRUE")
    neu = model.create_entity("IfcBoolean", wert)
    if alt is not None and len(model.get_inverse(alt)) == 1:
        alt.NominalValue = neu
    else:
        # Property fehlt oder wird von mehreren Psets genutzt: eigene Property anlegen
        prop = model.create_entity("IfcPropertySingleValue", Name=PROP, NominalValue=neu)
        pset.HasProperties = [p for p in pset.HasProperties or [] if p != alt] + [prop]
        hinweis = hinweis or f"{PROP} neu angelegt"
    return alter_wert, hinweis


def main():
    parser = argparse.ArgumentParser(description="Rückmeldung (CSV aus dem Polier-Tool) als IsInstalled ins IFC übernehmen.")
    parser.add_argument("modell", type=Path, help="IFC-Modell, aus dem das CSV erstellt wurde")
    parser.add_argument("csv", type=Path, nargs="+", help="ein oder mehrere CSV aus dem Polier-Tool")
    parser.add_argument("-o", "--ausgabe", type=Path, help="Ziel-IFC (Standard: <modell>_rueckgemeldet_<datum>.ifc)")
    parser.add_argument("--alle", action="store_true", help="alle Zeilen übernehmen, nicht nur GeaendertDurchPolier = ja")
    args = parser.parse_args()

    ausgabe = args.ausgabe or args.modell.with_name(f"{args.modell.stem}_rueckgemeldet_{date.today().isoformat()}.ifc")
    if ausgabe.resolve() == args.modell.resolve():
        sys.exit("Die Ausgabe darf das Eingabemodell nicht überschreiben.")

    # CSV einlesen; widersprüchliche Angaben aus mehreren Dateien werden nicht übernommen
    rueckmeldung, protokoll, quelle = {}, [], {}
    for pfad in args.csv:
        werte, fehler = lies_csv(pfad, args.alle)
        protokoll += [(guid, "", "", "übersprungen", f"{pfad.name}: {text}") for guid, text in fehler]
        for guid, (wert, soll) in werte.items():
            if guid in rueckmeldung and rueckmeldung[guid][0] != wert:
                protokoll.append((guid, "", "", "übersprungen", f"Widerspruch zwischen {quelle[guid]} und {pfad.name}"))
                rueckmeldung[guid] = (None, soll)
            elif guid not in rueckmeldung:
                rueckmeldung[guid], quelle[guid] = (wert, soll), pfad.name

    model = ifcopenshell.open(str(args.modell))
    owner_history = (model.by_type("IfcOwnerHistory") or [None])[0]
    zaehler = {"gesetzt": 0, "unverändert": 0, "übersprungen": len(protokoll)}
    b = lambda w: "" if w is None else "TRUE" if w else "FALSE"

    for guid, (wert, soll_csv) in rueckmeldung.items():
        if wert is None:
            continue
        try:
            bauteil = model.by_guid(guid)
        except RuntimeError:
            protokoll.append((guid, "", b(wert), "übersprungen", "GlobalId nicht im Modell"))
            zaehler["übersprungen"] += 1
            continue
        pset, _ = pset_von(bauteil)
        props = eigenschaften(pset) if pset else {}
        soll_modell = wert_von(props.get("InstallationDate")) or ""
        hinweis_soll = f"InstallationDate im CSV ({soll_csv}) weicht vom Modell ab ({soll_modell})" \
            if soll_csv and soll_csv != soll_modell else ""
        alt = wert_von(props.get(PROP))
        if alt is wert and props[PROP].NominalValue.is_a("IfcBoolean"):
            protokoll.append((guid, b(alt), b(wert), "unverändert", hinweis_soll))
            zaehler["unverändert"] += 1
            continue
        try:
            alt, hinweis = setze(model, bauteil, wert, owner_history)
        except ValueError as e:
            protokoll.append((guid, b(alt), b(wert), "übersprungen", str(e)))
            zaehler["übersprungen"] += 1
            continue
        protokoll.append((guid, b(alt), b(wert), "gesetzt", "; ".join(h for h in (hinweis, hinweis_soll) if h)))
        zaehler["gesetzt"] += 1

    model.write(str(ausgabe))
    pfad_protokoll = ausgabe.with_name(ausgabe.stem + "_protokoll.csv")
    with open(pfad_protokoll, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(["GlobalId", "IsInstalledAlt", "IsInstalledNeu", "Ergebnis", "Hinweis"])
        writer.writerows(protokoll)

    print(f"Rückmeldungen: {len(rueckmeldung)} GlobalIds aus {len(args.csv)} CSV")
    print(f"  gesetzt:      {zaehler['gesetzt']}")
    print(f"  unverändert:  {zaehler['unverändert']}")
    print(f"  übersprungen: {zaehler['übersprungen']}")
    print("Modell:   ", ausgabe)
    print("Protokoll:", pfad_protokoll)


if __name__ == "__main__":
    main()
