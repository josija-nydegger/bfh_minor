// Baufortschritt-Check · Team 4 · IFC-Lite Script
// Getestet mit ifclite.com v5.2.2
//
// Klickpfad: ifclite.com → Modell öffnen → Analyze → Script Editor
//            → «Import script file» → diese Datei wählen → Run
//
// Ergebnis:  1. Kurze Übersicht im Output-Fenster
//            2. Bauteile im 3D-Modell nach Status eingefärbt
//            3. CSV-Datei mit allen Bauteilen (für results/ im Repository)

// Prüfdatum: leer lassen = heute. Für einen wiederholbaren Lauf ein festes Datum setzen, z. B. '2026-10-27'.
const PRUEFDATUM = ''
// CSV automatisch herunterladen (true) oder nicht (false)
const CSV_SPEICHERN = true

const PSET = 'Pset_InstallationOccurrence'
const STATUS = {
  ueberfaellig: { label: 'Montage überfällig', farbe: '#d62f2f', farbname: 'rot', wer: 'Polier' },
  fehler: { label: 'Daten fehlerhaft', farbe: '#9a3fd0', farbname: 'violett', wer: 'Modellautor' },
  ausstehend: { label: 'Abnahme ausstehend', farbe: '#f0a800', farbname: 'gelb', wer: 'Bauleitung' },
  geplant: { label: 'Geplant', farbe: '#9aa6ae', farbname: 'grau', wer: '' },
  abgenommen: { label: 'Abgenommen', farbe: '#2e9e5b', farbname: 'grün', wer: '' }
}
const REIHENFOLGE = ['ueberfaellig', 'fehler', 'ausstehend', 'geplant', 'abgenommen']
const OEFFNUNGEN = ['IfcOpeningElement', 'IfcOpeningStandardCase']

// ---------- Hilfsfunktionen ----------
function heuteIso() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
function leer(v) { return v === null || v === undefined || (typeof v === 'string' && v.trim() === '') }
// Gültiges Datum JJJJ-MM-TT → Tagesnummer, sonst null
function tag(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return null
  const [y, m, d] = v.trim().split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  if (t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null
  return Math.round(t.getTime() / 86400000)
}
function datum(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '.' + m[2] + '.' + m[1] : (iso || '') }
function pct(a, b) { return b ? Math.round(a / b * 100) : 0 }
function tage(n) { return n + (n === 1 ? ' Tag' : ' Tage') }

// ---------- Bauteile lesen ----------
const pruefIso = PRUEFDATUM || heuteIso()
const heute = tag(pruefIso)
if (heute === null) throw new Error('PRUEFDATUM «' + PRUEFDATUM + '» ist kein gültiges Datum. Format: JJJJ-MM-TT')

const alle = bim.query.byType('IfcElement')
const bauteile = alle.filter(e => !OEFFNUNGEN.includes(e.type))
const anzOeffnungen = alle.length - bauteile.length

const zeilen = []
const r1 = { geprueft: 0, ok: 0 }, r2 = { geprueft: 0, ok: 0, hinweise: 0 }, r3 = { geprueft: 0, verzug: 0 }
let montiert = 0, mitPset = 0

for (const e of bauteile) {
  const psets = bim.query.properties(e).filter(p => (p.name || '').toLowerCase() === PSET.toLowerCase())
  const props = {}
  for (const ps of psets) for (const p of ps.properties) props[p.name] = p.value
  const hatPset = psets.length > 0
  if (hatPset) mitPset++

  const gruende = [], hinweise = []
  let ok1 = true, ok2 = true, verzug = null

  // Anforderung 1: Soll-Datum und Montagestatus erfasst
  r1.geprueft++
  const soll = props.InstallationDate, inst = props.IsInstalled, abn = props.AcceptanceDate
  const sollTag = tag(soll)
  if (!hatPset) { gruende.push(PSET + ' fehlt'); ok1 = false }
  else {
    if (!('InstallationDate' in props)) { gruende.push('Soll-Datum (InstallationDate) fehlt'); ok1 = false }
    else if (leer(soll)) { gruende.push('Soll-Datum (InstallationDate) ist leer'); ok1 = false }
    else if (sollTag === null) { gruende.push('Soll-Datum «' + soll + '» ist kein gültiges Datum (JJJJ-MM-TT)'); ok1 = false }
    if (!('IsInstalled' in props)) { gruende.push('Montagestatus (IsInstalled) fehlt'); ok1 = false }
    else if (leer(inst)) { gruende.push('Montagestatus (IsInstalled) ist leer'); ok1 = false }
    else if (typeof inst !== 'boolean') { gruende.push('Montagestatus «' + inst + '» ist kein Ja/Nein-Wert (IfcBoolean)'); ok1 = false }
  }
  if (ok1) r1.ok++
  const istMontiert = inst === true, nichtMontiert = inst === false
  if (istMontiert) montiert++

  // Anforderung 2: Abnahmedatum plausibel
  const abnGesetzt = hatPset && !leer(abn)
  if (abnGesetzt) {
    r2.geprueft++
    const abnTag = tag(abn)
    if (abnTag === null) { gruende.push('Abnahmedatum «' + abn + '» ist kein gültiges Datum (JJJJ-MM-TT)'); ok2 = false }
    else {
      if (nichtMontiert) { gruende.push('Abnahme erfasst, aber Bauteil ist nicht montiert'); ok2 = false }
      if (abnTag > heute) { gruende.push('Abnahmedatum ' + datum(abn) + ' liegt nach dem Prüfdatum'); ok2 = false }
      if (sollTag !== null && abnTag < sollTag) { hinweise.push('Abgenommen vor dem Soll-Datum (vorzeitig montiert)'); r2.hinweise++ }
    }
    if (ok2) r2.ok++
  }

  // Anforderung 3: Montageverzug
  if (nichtMontiert && sollTag !== null) {
    r3.geprueft++
    if (sollTag <= heute) { verzug = heute - sollTag; r3.verzug++ }
  }

  let status
  if (gruende.length) status = 'fehler'
  else if (istMontiert) status = abnGesetzt ? 'abgenommen' : 'ausstehend'
  else status = verzug !== null ? 'ueberfaellig' : 'geplant'

  const st = bim.query.storey(e)
  zeilen.push({
    e, status, verzug, gruende, hinweise,
    anf: !ok1 ? 1 : !ok2 ? 2 : verzug !== null ? 3 : null,
    gid: e.globalId, name: e.name || '(ohne Namen)', klasse: e.type, geschoss: st ? st.name : '',
    soll: leer(soll) ? '' : String(soll),
    inst: !hatPset || leer(inst) ? '' : inst === true ? 'Ja' : inst === false ? 'Nein' : String(inst),
    abn: abnGesetzt ? String(abn) : ''
  })
}

// ---------- 3D-Modell einfärben ----------
bim.viewer.resetColors()
bim.viewer.colorizeAll(REIHENFOLGE
  .map(k => ({ entities: zeilen.filter(zl => zl.status === k).map(zl => zl.e), color: STATUS[k].farbe }))
  .filter(b => b.entities.length))

// ---------- Übersicht ----------
const n = zeilen.length
const anz = {}
for (const k of REIHENFOLGE) anz[k] = zeilen.filter(zl => zl.status === k).length
const spaet = zeilen.filter(zl => zl.status === 'ueberfaellig')
const maxVerzug = spaet.reduce((a, zl) => Math.max(a, zl.verzug), 0)
const linie = '────────────────────────────────────────'

console.log('BAUFORTSCHRITT-CHECK · Team 4')
console.log(linie)
console.log('Prüfdatum ' + datum(pruefIso) + ' · ' + n + ' Bauteile geprüft (' + anzOeffnungen + ' Öffnungen nicht geprüft)')
if (n === 0) console.log('ACHTUNG: Keine Bauteile gefunden. Ein leeres Ergebnis ist kein Bestanden.')
else if (mitPset === 0) console.log('ACHTUNG: Kein Bauteil hat ' + PSET + '. Der Modellautor muss zuerst Soll-Datum und Montagestatus eintragen.')
console.log('Montiert: ' + montiert + ' von ' + n + ' (' + pct(montiert, n) + ' %), davon ' + anz.abgenommen + ' abgenommen')
console.log('')
console.log('STATUS (Farbe im Modell)')
for (const k of REIHENFOLGE) console.log('  ' + (STATUS[k].label + ' (' + STATUS[k].farbname + ')').padEnd(30) + String(anz[k]).padStart(6) + String(pct(anz[k], n)).padStart(5) + ' %')
console.log('')
console.log('WAS IST ZU TUN?')
console.log('  Polier:      ' + (anz.ueberfaellig ? anz.ueberfaellig + ' Montagen überfällig, grösster Verzug ' + tage(maxVerzug) : 'nichts im Verzug'))
console.log('  Bauleitung:  ' + (anz.ausstehend ? anz.ausstehend + ' Abnahmen offen' : montiert ? 'alle montierten Bauteile abgenommen' : 'noch nichts montiert, keine Abnahme offen'))
console.log('  Modellautor: ' + (anz.fehler ? anz.fehler + ' Bauteile mit Datenfehlern' : 'alle Angaben vollständig'))
console.log('')
console.log('DIE DREI ANFORDERUNGEN')
console.log('  1 Soll-Datum und Montagestatus erfasst: ' + r1.ok + ' von ' + r1.geprueft + ' erfüllt' + (r1.geprueft - r1.ok ? ', ' + (r1.geprueft - r1.ok) + ' nicht erfüllt' : ''))
console.log('  2 Abnahmedatum plausibel: ' + (r2.geprueft ? r2.ok + ' von ' + r2.geprueft + ' plausibel' + (r2.hinweise ? ', ' + r2.hinweise + ' Hinweise (vorzeitig montiert)' : '') : 'noch keine Abnahme erfasst, nichts zu prüfen'))
console.log('  3 Montageverzug: ' + (r3.geprueft ? r3.verzug + ' von ' + r3.geprueft + ' offenen Montagen im Verzug' : 'keine offenen Montagen mit gültigem Soll-Datum'))

const arten = {}
for (const zl of zeilen) for (const g of zl.gruende) { const k = g.replace(/«.*»/, '«…»').replace(/\d{2}\.\d{2}\.\d{4}/, '…'); arten[k] = (arten[k] || 0) + 1 }
if (Object.keys(arten).length) {
  console.log('')
  console.log('DATENFEHLER NACH ART')
  for (const [k, v] of Object.entries(arten).sort((a, b) => b[1] - a[1])) console.log('  ' + String(v).padStart(5) + '  ' + k)
}
if (spaet.length) {
  console.log('')
  console.log('ÜBERFÄLLIG (die 10 grössten Verzüge)')
  for (const zl of spaet.sort((a, b) => b.verzug - a.verzug).slice(0, 10)) console.log('  ' + tage(zl.verzug).padStart(9) + '  ' + zl.gid + '  ' + zl.name)
}

// ---------- CSV ----------
const PRIO = { ueberfaellig: 0, fehler: 1, ausstehend: 2, geplant: 3, abgenommen: 4 }
const kopf = ['GlobalId', 'Bauteil', 'IFC-Klasse', 'Geschoss', 'Soll-Datum (InstallationDate)', 'Montiert (IsInstalled)', 'Abnahme (AcceptanceDate)', 'Status', 'Verzug (Tage)', 'Anforderung', 'Grund / Hinweis', 'Prüfdatum']
function csvZeile(zl) {
  return [zl.gid, zl.name, zl.klasse, zl.geschoss, zl.soll, zl.inst, zl.abn, STATUS[zl.status].label,
    zl.verzug !== null ? zl.verzug : '', zl.anf ? 'Anforderung ' + zl.anf : '', zl.gruende.concat(zl.hinweise).join(' | '), pruefIso]
}
function zelle(v) { v = String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v }
function csvText(zeile) { return zeile.map(zelle).join(';') }
const csvZeilen = zeilen.slice().sort((a, b) => PRIO[a.status] - PRIO[b.status] || (b.verzug || 0) - (a.verzug || 0)).map(csvZeile)
const csv = String.fromCharCode(0xFEFF) +[kopf].concat(csvZeilen).map(csvText).join('\r\n')
if (CSV_SPEICHERN) {
  const datei = 'Baufortschritt_' + pruefIso + '.csv'
  bim.export.download(csv, datei, 'text/csv;charset=utf-8')
  console.log('')
  console.log('CSV gespeichert: ' + datei + ' (' + n + ' Zeilen, Excel-tauglich)')
}
