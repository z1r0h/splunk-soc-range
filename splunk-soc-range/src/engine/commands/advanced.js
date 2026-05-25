import { parseFieldList } from './basic.js'

// ─── EVAL ─────────────────────────────────────────────────────────────────────
export function cmdEval(events, args) {
  // eval field=expression, field2=expression2
  const assignments = splitEvalAssignments(args)
  return events.map(e => {
    const row = { ...e }
    assignments.forEach(({ field, expr }) => {
      row[field] = evalExpr(row, expr)
    })
    return row
  })
}

function splitEvalAssignments(args) {
  // Split by comma but not inside parentheses or quotes
  const results = []
  let depth = 0, inQ = false, current = '', qChar = ''
  for (let i = 0; i < args.length; i++) {
    const ch = args[i]
    if ((ch === '"' || ch === "'") && !inQ) { inQ = true; qChar = ch; current += ch }
    else if (inQ && ch === qChar) { inQ = false; current += ch }
    else if (!inQ && (ch === '(' || ch === '[')) { depth++; current += ch }
    else if (!inQ && (ch === ')' || ch === ']')) { depth--; current += ch }
    else if (!inQ && depth === 0 && ch === ',') {
      const m = current.trim().match(/^(\w+)\s*=\s*(.+)$/)
      if (m) results.push({ field: m[1], expr: m[2].trim() })
      current = ''
    } else { current += ch }
  }
  if (current.trim()) {
    const m = current.trim().match(/^(\w+)\s*=\s*(.+)$/)
    if (m) results.push({ field: m[1], expr: m[2].trim() })
  }
  return results
}

export function evalExpr(event, expr) {
  const e = expr.trim()

  // if(cond, true_val, false_val)
  const ifM = e.match(/^if\s*\((.+)\)$/i)
  if (ifM) {
    const parts = splitArgs(ifM[1])
    if (parts.length >= 2) {
      const cond = evalConditionExpr(event, parts[0])
      return cond ? evalExpr(event, parts[1]) : (parts[2] ? evalExpr(event, parts[2]) : null)
    }
  }

  // case(cond1, val1, cond2, val2, ...)
  const caseM = e.match(/^case\s*\((.+)\)$/i)
  if (caseM) {
    const parts = splitArgs(caseM[1])
    for (let i = 0; i < parts.length - 1; i += 2) {
      if (evalConditionExpr(event, parts[i])) return evalExpr(event, parts[i + 1])
    }
    return null
  }

  // coalesce(f1, f2, ...)
  const coalesceM = e.match(/^coalesce\s*\((.+)\)$/i)
  if (coalesceM) {
    const parts = splitArgs(coalesceM[1])
    for (const p of parts) {
      const v = evalExpr(event, p)
      if (v !== null && v !== undefined && v !== '') return v
    }
    return null
  }

  // isnotnull(field)
  if (/^isnotnull\s*\(([^)]+)\)$/i.test(e)) {
    const f = e.match(/^isnotnull\s*\(([^)]+)\)$/i)[1].trim()
    const v = event[f]
    return v !== null && v !== undefined && v !== '' ? 1 : 0
  }
  if (/^isnull\s*\(([^)]+)\)$/i.test(e)) {
    const f = e.match(/^isnull\s*\(([^)]+)\)$/i)[1].trim()
    const v = event[f]
    return v === null || v === undefined || v === '' ? 1 : 0
  }

  // cidrmatch("subnet", field)
  const cidrM = e.match(/^cidrmatch\s*\(\s*"([^"]+)"\s*,\s*(.+?)\s*\)$/i)
  if (cidrM) {
    const subnet = cidrM[1]
    const fieldVal = String(evalExpr(event, cidrM[2]) ?? '')
    return cidrMatch(subnet, fieldVal) ? 1 : 0
  }

  // String functions
  const lenM = e.match(/^len\s*\((.+)\)$/i)
  if (lenM) return String(evalExpr(event, lenM[1]) ?? '').length

  const upperM = e.match(/^upper\s*\((.+)\)$/i)
  if (upperM) return String(evalExpr(event, upperM[1]) ?? '').toUpperCase()

  const lowerM = e.match(/^lower\s*\((.+)\)$/i)
  if (lowerM) return String(evalExpr(event, lowerM[1]) ?? '').toLowerCase()

  const tostrM = e.match(/^tostring\s*\((.+)\)$/i)
  if (tostrM) { const parts = splitArgs(tostrM[1]); return String(evalExpr(event, parts[0]) ?? '') }

  const tonumM = e.match(/^tonumber\s*\((.+)\)$/i)
  if (tonumM) { const v = parseFloat(evalExpr(event, tonumM[1])); return isNaN(v) ? null : v }

  const substrM = e.match(/^substr\s*\((.+)\)$/i)
  if (substrM) {
    const parts = splitArgs(substrM[1])
    const s = String(evalExpr(event, parts[0]) ?? '')
    const start = (parseInt(evalExpr(event, parts[1])) || 1) - 1
    const length = parts[2] ? parseInt(evalExpr(event, parts[2])) : undefined
    return length !== undefined ? s.substr(start, length) : s.substr(start)
  }

  // mvjoin(field, delim)
  const mvjoinM = e.match(/^mvjoin\s*\((.+)\)$/i)
  if (mvjoinM) {
    const parts = splitArgs(mvjoinM[1])
    const val = evalExpr(event, parts[0])
    const delim = parts[1] ? String(evalExpr(event, parts[1])).replace(/^"|"$/g, '') : ' '
    if (Array.isArray(val)) return val.join(delim)
    return String(val ?? '')
  }

  // mvcount(field)
  const mvcountM = e.match(/^mvcount\s*\((.+)\)$/i)
  if (mvcountM) {
    const val = evalExpr(event, mvcountM[1].trim())
    return Array.isArray(val) ? val.length : (val ? 1 : 0)
  }

  // mvindex(field, idx)
  const mvidxM = e.match(/^mvindex\s*\((.+)\)$/i)
  if (mvidxM) {
    const parts = splitArgs(mvidxM[1])
    const val = evalExpr(event, parts[0])
    const idx = parseInt(evalExpr(event, parts[1])) || 0
    if (Array.isArray(val)) return val[idx] ?? null
    return val
  }

  // String concatenation with .
  if (e.includes('.')) {
    const concatParts = splitByDotOutsideParens(e)
    if (concatParts.length > 1) {
      return concatParts.map(p => String(evalExpr(event, p.trim()) ?? '')).join('')
    }
  }

  // Arithmetic: +, -, *, /
  const arithM = e.match(/^(.+?)\s*([+\-*\/])\s*(.+)$/)
  if (arithM) {
    const left = parseFloat(evalExpr(event, arithM[1].trim()))
    const right = parseFloat(evalExpr(event, arithM[3].trim()))
    if (!isNaN(left) && !isNaN(right)) {
      switch (arithM[2]) {
        case '+': return left + right
        case '-': return left - right
        case '*': return left * right
        case '/': return right !== 0 ? left / right : null
      }
    }
  }

  // Quoted string literal
  if ((e.startsWith('"') && e.endsWith('"')) || (e.startsWith("'") && e.endsWith("'"))) {
    return e.slice(1, -1)
  }

  // Numeric literal
  if (!isNaN(parseFloat(e)) && isFinite(e)) return parseFloat(e)

  // Field reference
  if (e in event) return event[e]

  // Fallback: return as string
  return e
}

function evalConditionExpr(event, expr) {
  const e = expr.trim()
  // isnotnull / isnull
  if (/^isnotnull\s*\(/i.test(e)) return evalExpr(event, e) === 1
  if (/^isnull\s*\(/i.test(e)) return evalExpr(event, e) === 1

  // Comparison
  const cmpM = e.match(/^(.+?)\s*(>=|<=|!=|>|<|=)\s*(.+)$/)
  if (cmpM) {
    const lv = evalExpr(event, cmpM[1].trim())
    const rv = evalExpr(event, cmpM[3].trim())
    const ln = parseFloat(lv), rn = parseFloat(rv)
    const useNum = !isNaN(ln) && !isNaN(rn)
    const a = useNum ? ln : String(lv ?? '').toLowerCase()
    const b = useNum ? rn : String(rv ?? '').toLowerCase()
    switch (cmpM[2]) {
      case '=': case '==': return a == b
      case '!=': return a != b
      case '>': return a > b
      case '<': return a < b
      case '>=': return a >= b
      case '<=': return a <= b
    }
  }
  return Boolean(evalExpr(event, e))
}

function splitArgs(args) {
  const result = []
  let depth = 0, inQ = false, qChar = '', current = ''
  for (const ch of args) {
    if ((ch === '"' || ch === "'") && !inQ) { inQ = true; qChar = ch; current += ch }
    else if (inQ && ch === qChar) { inQ = false; current += ch }
    else if (!inQ && ch === '(') { depth++; current += ch }
    else if (!inQ && ch === ')') { depth--; current += ch }
    else if (!inQ && depth === 0 && ch === ',') { result.push(current.trim()); current = '' }
    else { current += ch }
  }
  if (current.trim()) result.push(current.trim())
  return result
}

function splitByDotOutsideParens(s) {
  const parts = []
  let depth = 0, inQ = false, qChar = '', current = ''
  for (const ch of s) {
    if ((ch === '"' || ch === "'") && !inQ) { inQ = true; qChar = ch; current += ch }
    else if (inQ && ch === qChar) { inQ = false; current += ch }
    else if (!inQ && ch === '(') { depth++; current += ch }
    else if (!inQ && ch === ')') { depth--; current += ch }
    else if (!inQ && depth === 0 && ch === '.') { parts.push(current); current = '' }
    else { current += ch }
  }
  if (current) parts.push(current)
  return parts
}

// CIDR matching utility
export function cidrMatch(cidr, ip) {
  try {
    const [network, bits] = cidr.split('/')
    const mask = ~(0xFFFFFFFF >>> parseInt(bits)) >>> 0
    return (ipToInt(ip) & mask) === (ipToInt(network) & mask)
  } catch { return false }
}

function ipToInt(ip) {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0) >>> 0
}

// ─── STATS ────────────────────────────────────────────────────────────────────
export function cmdStats(events, args) {
  const { aggs, byFields } = parseStatsArgs(args)
  if (!byFields.length) {
    const row = computeAggs(events, aggs)
    return [row]
  }
  const groups = groupBy(events, byFields)
  return Array.from(groups.entries()).map(([key, grpEvents]) => {
    const row = computeAggs(grpEvents, aggs)
    byFields.forEach((f, i) => { row[f] = key.split('|||')[i] })
    return row
  })
}

// ─── EVENTSTATS ───────────────────────────────────────────────────────────────
export function cmdEventstats(events, args) {
  const { aggs, byFields } = parseStatsArgs(args)
  if (!byFields.length) {
    const row = computeAggs(events, aggs)
    return events.map(e => ({ ...e, ...row }))
  }
  const groups = groupBy(events, byFields)
  return events.map(e => {
    const key = byFields.map(f => String(e[f] ?? '')).join('|||')
    const grpEvents = groups.get(key) || []
    const row = computeAggs(grpEvents, aggs)
    return { ...e, ...row }
  })
}

// ─── STREAMSTATS ──────────────────────────────────────────────────────────────
export function cmdStreamstats(events, args) {
  const windowM = args.match(/window\s*=\s*(\d+)/i)
  const currentM = args.match(/current\s*=\s*([tf])/i)
  const byM = args.match(/\bby\s+(.+)$/i)
  const window = windowM ? parseInt(windowM[1]) : events.length
  const includeCurrent = currentM ? currentM[1].toLowerCase() === 't' : true
  const byFields = byM ? parseFieldList(byM[1]) : []
  const restArgs = args
    .replace(/window\s*=\s*\d+/i, '')
    .replace(/current\s*=\s*[tf]/i, '')
    .replace(/\bby\s+.+$/, '')
    .trim()
  const { aggs } = parseStatsArgs(restArgs)

  const buckets = new Map()
  return events.map((e, idx) => {
    const key = byFields.map(f => String(e[f] ?? '')).join('|||')
    if (!buckets.has(key)) buckets.set(key, [])
    const buf = buckets.get(key)
    buf.push(e)
    const start = Math.max(0, buf.length - window)
    const windowEvents = includeCurrent ? buf.slice(start) : buf.slice(start, -1)
    const agg = computeAggs(windowEvents, aggs)
    return { ...e, ...agg }
  })
}

// ─── TIMECHART ────────────────────────────────────────────────────────────────
export function cmdTimechart(events, args) {
  const spanM = args.match(/span\s*=\s*(\d+)([smhd]?)/i)
  const spanMs = spanM ? parseSpan(spanM[1], spanM[2]) : 3600000
  const byM = args.match(/\bby\s+(\w+)$/i)
  const byField = byM ? byM[1] : null
  const restArgs = args
    .replace(/span\s*=\s*\S+/i, '')
    .replace(/\bby\s+\w+$/i, '')
    .trim()

  const aggM = restArgs.match(/^count$/i) ? { func: 'count', field: null, alias: 'count' }
    : parseAggExpr(restArgs.split(/\s+by\s+/i)[0].trim())

  const buckets = new Map()
  events.forEach(e => {
    const t = new Date(e._time).getTime()
    const bucket = Math.floor(t / spanMs) * spanMs
    const bKey = bucket
    if (!buckets.has(bKey)) buckets.set(bKey, [])
    buckets.get(bKey).push(e)
  })

  const rows = []
  for (const [bTime, bEvents] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
    if (!byField) {
      const row = { _time: new Date(bTime).toISOString() }
      const alias = aggM?.alias || 'count'
      row[alias] = computeSingleAgg(bEvents, aggM || { func: 'count' })
      rows.push(row)
    } else {
      const subGroups = groupBy(bEvents, [byField])
      const row = { _time: new Date(bTime).toISOString() }
      for (const [gKey, gEvents] of subGroups.entries()) {
        row[gKey] = computeSingleAgg(gEvents, aggM || { func: 'count' })
      }
      rows.push(row)
    }
  }
  return rows
}

// ─── BIN ──────────────────────────────────────────────────────────────────────
export function cmdBin(events, args) {
  const spanM = args.match(/span\s*=\s*(\d+)([smhd]?)/i)
  if (!spanM) return events
  const spanMs = parseSpan(spanM[1], spanM[2])
  const fieldM = args.match(/^(\w+)/)
  const field = fieldM ? fieldM[1] : '_time'
  return events.map(e => {
    const val = field === '_time' ? new Date(e._time).getTime() : parseFloat(e[field])
    const binned = Math.floor(val / spanMs) * spanMs
    return { ...e, [field]: field === '_time' ? new Date(binned).toISOString() : binned }
  })
}

// ─── Shared stats helpers ─────────────────────────────────────────────────────
function parseStatsArgs(args) {
  const byM = args.match(/\bby\s+(.+)$/i)
  const byFields = byM ? parseFieldList(byM[1]) : []
  const aggPart = byM ? args.slice(0, byM.index).trim() : args.trim()
  const aggs = aggPart.split(',').map(a => parseAggExpr(a.trim())).filter(Boolean)
  return { aggs, byFields }
}

function parseAggExpr(expr) {
  // count AS alias, sum(field) AS alias, dc(field) AS alias, values(field) AS alias
  const asM = expr.match(/^(.+?)\s+[Aa][Ss]\s+(\w+)$/)
  const alias = asM ? asM[2] : null
  const base = asM ? asM[1].trim() : expr.trim()

  if (/^count$/i.test(base)) return { func: 'count', field: null, alias: alias || 'count' }
  const funcM = base.match(/^(\w+)\s*\(([^)]+)\)$/)
  if (!funcM) return null
  return { func: funcM[1].toLowerCase(), field: funcM[2].trim(), alias: alias || `${funcM[1]}(${funcM[2]})` }
}

function computeAggs(events, aggs) {
  const row = {}
  aggs.forEach(agg => {
    if (!agg) return
    row[agg.alias] = computeSingleAgg(events, agg)
  })
  return row
}

function computeSingleAgg(events, agg) {
  if (!agg) return events.length
  const { func, field } = agg
  const vals = field ? events.map(e => e[field]).filter(v => v !== null && v !== undefined && v !== '') : []
  switch (func) {
    case 'count': return events.length
    case 'sum':   return vals.reduce((s, v) => s + parseFloat(v || 0), 0)
    case 'avg': { const n = vals.map(v => parseFloat(v)).filter(v => !isNaN(v)); return n.length ? n.reduce((s,v)=>s+v,0)/n.length : 0 }
    case 'min':   return Math.min(...vals.map(v => parseFloat(v)).filter(v => !isNaN(v)))
    case 'max':   return Math.max(...vals.map(v => parseFloat(v)).filter(v => !isNaN(v)))
    case 'dc':    return new Set(vals.map(v => String(v))).size
    case 'values':return [...new Set(vals.map(v => String(v)))]
    case 'list':  return vals.map(v => String(v))
    case 'first': return vals[0] ?? null
    case 'last':  return vals[vals.length - 1] ?? null
    default: return events.length
  }
}

function groupBy(events, fields) {
  const map = new Map()
  events.forEach(e => {
    const key = fields.map(f => String(e[f] ?? '')).join('|||')
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(e)
  })
  return map
}

function parseSpan(num, unit) {
  const n = parseInt(num)
  switch ((unit || 's').toLowerCase()) {
    case 's': return n * 1000
    case 'm': return n * 60000
    case 'h': return n * 3600000
    case 'd': return n * 86400000
    default: return n * 1000
  }
}
