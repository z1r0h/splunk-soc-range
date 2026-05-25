import { parseFieldList, evalCondition } from './basic.js'
import { evalExpr } from './advanced.js'
import { lookupTables } from '../../data/lookups/lookupTables.js'

// ─── REX ──────────────────────────────────────────────────────────────────────
export function cmdRex(events, args) {
  // rex field=X "regex" OR rex "regex" (defaults to _raw)
  const fieldM = args.match(/field\s*=\s*(\S+)/i)
  const field = fieldM ? fieldM[1] : '_raw'
  const regexM = args.match(/"([^"]+)"/)
  if (!regexM) return events
  const pattern = regexM[1]
  let re
  try { re = new RegExp(pattern) } catch { return events }
  return events.map(e => {
    const val = String(e[field] ?? '')
    const m = re.exec(val)
    if (!m) return e
    const row = { ...e }
    // Named groups
    if (m.groups) {
      Object.entries(m.groups).forEach(([k, v]) => { if (v !== undefined) row[k] = v })
    }
    return row
  })
}

// ─── LOOKUP ───────────────────────────────────────────────────────────────────
export function cmdLookup(events, args) {
  // lookup tableName inputField AS eventField OUTPUT f1 f2 ...
  // lookup tableName inputField OUTPUT f1 f2 ...
  const tableM = args.match(/^(\w+)/)
  if (!tableM) return events
  const tableName = tableM[1]
  const table = lookupTables[tableName]
  if (!table) return events

  // Parse: AS clause for field mapping
  const asM = args.match(/(\w+)\s+AS\s+(\w+)/i)
  const outputM = args.match(/OUTPUT\s+(.+)$/i)

  let tableKeyField, eventKeyField
  if (asM) {
    tableKeyField = asM[1]
    eventKeyField = asM[2]
  } else {
    // Try to find matching field name
    const afterTable = args.slice(tableName.length).trim()
    const firstField = afterTable.split(/\s+/)[0]
    if (firstField && firstField.toLowerCase() !== 'output') {
      tableKeyField = firstField
      eventKeyField = firstField
    } else {
      tableKeyField = 'ip'
      eventKeyField = 'dest_ip'
    }
  }

  const outputFields = outputM
    ? parseFieldList(outputM[1])
    : Object.keys(table[0] || {}).filter(k => k !== tableKeyField)

  // Build lookup index
  const idx = new Map()
  table.forEach(row => {
    const key = String(row[tableKeyField] ?? '').toLowerCase()
    idx.set(key, row)
  })

  return events.map(e => {
    const lookupKey = String(e[eventKeyField] ?? '').toLowerCase()
    const match = idx.get(lookupKey)
    const row = { ...e }
    if (match) {
      outputFields.forEach(f => { row[f] = match[f] ?? null })
    }
    return row
  })
}

// ─── INPUTLOOKUP ──────────────────────────────────────────────────────────────
export function cmdInputlookup(events, args) {
  const tableM = args.match(/^(\w+)/)
  if (!tableM) return events
  const table = lookupTables[tableM[1]]
  if (!table) return []
  return table.map(row => ({ ...row }))
}

// ─── JOIN ─────────────────────────────────────────────────────────────────────
export function cmdJoin(events, args, allEvents, executor) {
  // join [type=left|inner] field [subsearch]
  const typeM = args.match(/type\s*=\s*(left|inner)/i)
  const joinType = typeM ? typeM[1].toLowerCase() : 'inner'
  const subsearchM = args.match(/\[(.+)\]/s)
  if (!subsearchM) return events

  const fieldM = args.match(/^(?:type\s*=\s*\S+\s+)?(\w+)\s*\[/)
  const joinField = fieldM ? fieldM[1] : 'host'

  let subResults = []
  try { subResults = executor(subsearchM[1].trim()) } catch { return events }

  const subIdx = new Map()
  subResults.forEach(r => {
    const key = String(r[joinField] ?? '')
    if (!subIdx.has(key)) subIdx.set(key, [])
    subIdx.get(key).push(r)
  })

  const result = []
  events.forEach(e => {
    const key = String(e[joinField] ?? '')
    const matches = subIdx.get(key) || []
    if (matches.length) {
      matches.forEach(m => result.push({ ...e, ...m }))
    } else if (joinType === 'left') {
      result.push({ ...e })
    }
  })
  return result
}

// ─── APPEND ───────────────────────────────────────────────────────────────────
export function cmdAppend(events, args, allEvents, executor) {
  const subsearchM = args.match(/\[(.+)\]/s)
  if (!subsearchM) return events
  try {
    const subResults = executor(subsearchM[1].trim())
    return [...events, ...subResults]
  } catch { return events }
}

// ─── APPENDCOLS ───────────────────────────────────────────────────────────────
export function cmdAppendcols(events, args, allEvents, executor) {
  const subsearchM = args.match(/\[(.+)\]/s)
  if (!subsearchM) return events
  try {
    const subResults = executor(subsearchM[1].trim())
    return events.map((e, i) => ({ ...e, ...(subResults[i] || {}) }))
  } catch { return events }
}

// ─── TRANSACTION ──────────────────────────────────────────────────────────────
export function cmdTransaction(events, args) {
  const maxspanM = args.match(/maxspan\s*=\s*(\d+)([smhd]?)/i)
  const maxeventsM = args.match(/maxevents\s*=\s*(\d+)/i)
  const startsM = args.match(/startswith\s*=\s*"([^"]+)"/i)
  const endsM = args.match(/endswith\s*=\s*"([^"]+)"/i)
  const maxSpanMs = maxspanM ? parseSpanMs(maxspanM[1], maxspanM[2]) : Infinity
  const maxEvents = maxeventsM ? parseInt(maxeventsM[1]) : Infinity
  const byPart = args.replace(/maxspan\s*=\s*\S+/i,'').replace(/maxevents\s*=\s*\d+/i,'').replace(/startswith\s*=\s*"[^"]+"/i,'').replace(/endswith\s*=\s*"[^"]+"/i,'').trim()
  const byFields = parseFieldList(byPart)

  if (!byFields.length) {
    const tx = buildTx(events, maxSpanMs, maxEvents)
    return tx ? [tx] : []
  }

  const groups = new Map()
  events.forEach(e => {
    const key = byFields.map(f => String(e[f] ?? '')).join('|||')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(e)
  })

  const result = []
  for (const [, grpEvents] of groups.entries()) {
    let open = null
    grpEvents.forEach(e => {
      if (!open) { open = { events: [e], start: new Date(e._time).getTime() }; return }
      const elapsed = new Date(e._time).getTime() - open.start
      if (elapsed > maxSpanMs || open.events.length >= maxEvents) {
        result.push(collapseTx(open.events))
        open = { events: [e], start: new Date(e._time).getTime() }
      } else {
        open.events.push(e)
      }
    })
    if (open) result.push(collapseTx(open.events))
  }
  return result
}

function buildTx(events, maxSpanMs, maxEvents) {
  if (!events.length) return null
  return collapseTx(events)
}

function collapseTx(evs) {
  const first = evs[0], last = evs[evs.length - 1]
  const startMs = new Date(first._time).getTime()
  const endMs = new Date(last._time).getTime()
  const base = { ...first }
  // Merge multi-value fields
  Object.keys(first).forEach(k => {
    const vals = [...new Set(evs.map(e => e[k]).filter(v => v !== null && v !== undefined))]
    base[k] = vals.length === 1 ? vals[0] : vals
  })
  base._time = first._time
  base.duration = ((endMs - startMs) / 1000).toFixed(1)
  base.eventcount = evs.length
  return base
}

function parseSpanMs(num, unit) {
  const n = parseInt(num)
  switch ((unit || 's').toLowerCase()) {
    case 's': return n * 1000
    case 'm': return n * 60000
    case 'h': return n * 3600000
    case 'd': return n * 86400000
    default: return n * 1000
  }
}

// ─── MAKEMV ───────────────────────────────────────────────────────────────────
export function cmdMakemv(events, args) {
  // makemv [delim=","] field
  const delimM = args.match(/delim\s*=\s*"([^"]*)"/i) || args.match(/delim\s*=\s*(\S+)/i)
  const delim = delimM ? delimM[1] : ' '
  const fieldM = args.replace(/delim\s*=\s*\S+/i, '').trim()
  const field = fieldM.split(/\s+/)[0]
  if (!field) return events
  return events.map(e => {
    if (!e[field]) return e
    return { ...e, [field]: String(e[field]).split(delim).map(s => s.trim()).filter(Boolean) }
  })
}

// ─── MVEXPAND ─────────────────────────────────────────────────────────────────
export function cmdMvexpand(events, args) {
  const field = args.trim().split(/\s+/)[0]
  if (!field) return events
  const result = []
  events.forEach(e => {
    const val = e[field]
    if (Array.isArray(val)) {
      val.forEach(v => result.push({ ...e, [field]: v }))
    } else {
      result.push(e)
    }
  })
  return result
}

// ─── TSTATS ───────────────────────────────────────────────────────────────────
// Simulates tstats by filtering allEvents based on datamodel/where, then running stats
export function cmdTstats(events, args, allEvents) {
  // | tstats count FROM datamodel=X WHERE ... BY field1 field2
  const dmM = args.match(/FROM\s+datamodel\s*=\s*(\w+)/i)
  const whereM = args.match(/WHERE\s+(.+?)(?:\s+BY\s|$)/i)
  const byM = args.match(/BY\s+(.+)$/i)

  const datamodel = dmM ? dmM[1].toLowerCase() : null
  const whereExpr = whereM ? whereM[1].trim() : null
  const byFields = byM ? parseFieldList(byM[1]) : []

  // Aggr: first word before FROM
  const aggPart = args.split(/FROM/i)[0].trim()
  const aggM = aggPart.match(/^count$/i)
    ? { func: 'count', field: null, alias: 'count' }
    : parseAggExprSimple(aggPart)

  // Filter by datamodel (simulate via sourcetype mapping)
  const dmSourcetypeMap = {
    authentication: ['WinEventLog:Security', 'WinEventLog:security'],
    network_traffic: ['cisco:asa', 'palo:traffic'],
    web: ['bluecoat:proxysg:access:syslog', 'squid'],
    endpoint: ['XmlWinEventLog:Microsoft-Windows-Sysmon/Operational'],
    dns: ['stream:dns'],
  }

  let pool = allEvents
  if (datamodel && dmSourcetypeMap[datamodel]) {
    const sts = dmSourcetypeMap[datamodel]
    pool = pool.filter(e => sts.some(st => (e.sourcetype || '').includes(st.split(':')[0])))
  }

  // Apply WHERE — handle Authentication.src style field names
  if (whereExpr) {
    const normalizedWhere = whereExpr.replace(/\w+\./g, '')
    pool = pool.filter(e => {
      try { return evalCondition(e, normalizedWhere) } catch { return true }
    })
  }

  // Rename DM-prefixed by fields
  const normalizedByFields = byFields.map(f => f.includes('.') ? f.split('.').pop() : f)

  if (!normalizedByFields.length) {
    const row = {}
    row[aggM?.alias || 'count'] = pool.length
    return [row]
  }

  const groups = new Map()
  pool.forEach(e => {
    const key = normalizedByFields.map(f => String(e[f] ?? '')).join('|||')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(e)
  })

  return Array.from(groups.entries()).map(([key, grp]) => {
    const row = {}
    normalizedByFields.forEach((f, i) => {
      // Keep original prefixed name as the output key
      const origF = byFields[i]
      row[origF] = key.split('|||')[i]
    })
    row[aggM?.alias || 'count'] = aggM ? computeAggSimple(grp, aggM) : grp.length
    return row
  })
}

function parseAggExprSimple(expr) {
  const asM = expr.match(/^(.+?)\s+AS\s+(\w+)$/i)
  const alias = asM ? asM[2] : null
  const base = asM ? asM[1].trim() : expr.trim()
  if (/^count$/i.test(base)) return { func: 'count', field: null, alias: alias || 'count' }
  const m = base.match(/^(\w+)\s*\(([^)]+)\)$/)
  if (!m) return { func: 'count', field: null, alias: alias || 'count' }
  return { func: m[1].toLowerCase(), field: m[2].trim(), alias: alias || base }
}

function computeAggSimple(events, agg) {
  if (agg.func === 'count') return events.length
  const vals = agg.field ? events.map(e => parseFloat(e[agg.field])).filter(v => !isNaN(v)) : []
  switch (agg.func) {
    case 'sum': return vals.reduce((s, v) => s + v, 0)
    case 'avg': return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
    case 'dc':  return new Set(events.map(e => e[agg.field])).size
    default: return events.length
  }
}
