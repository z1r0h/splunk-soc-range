// ─── SEARCH ───────────────────────────────────────────────────────────────────
// Handles: index=X sourcetype=Y field=value field!=value keyword *wildcard*
export function cmdSearch(events, args, allEvents) {
  if (!args.trim()) return events.length ? events : allEvents

  let pool = allEvents
  const tokens = tokenizeSearchArgs(args)

  // Extract index= and sourcetype= first to narrow pool fast
  const indexTokens = tokens.filter(t => t.type === 'kv' && t.key === 'index')
  const stTokens    = tokens.filter(t => t.type === 'kv' && t.key === 'sourcetype')
  const rest        = tokens.filter(t => !(t.type === 'kv' && (t.key === 'index' || t.key === 'sourcetype')))

  if (indexTokens.length) {
    const idxVals = indexTokens.map(t => t.value.toLowerCase())
    pool = pool.filter(e => idxVals.some(v => matchWildcard(v, (e.index||'').toLowerCase())))
  }
  if (stTokens.length) {
    const stVals = stTokens.map(t => t.value.toLowerCase())
    pool = pool.filter(e => stVals.some(v => matchWildcard(v, (e.sourcetype||'').toLowerCase())))
  }

  // Apply remaining filters
  return pool.filter(e => matchAllTokens(e, rest))
}

function tokenizeSearchArgs(args) {
  const tokens = []
  // Regex to capture: key!=val  key=val  "quoted string"  bareword
  const re = /(\w[\w.]*)\s*(!?=)\s*"([^"]*?)"|(\w[\w.]*)\s*(!?=)\s*(\S+)|"([^"]+)"|(\S+)/g
  let m
  while ((m = re.exec(args)) !== null) {
    if (m[1] !== undefined) {
      // key op "quoted"
      tokens.push({ type: 'kv', key: m[1], op: m[2], value: m[3] })
    } else if (m[4] !== undefined) {
      // key op bare
      tokens.push({ type: 'kv', key: m[4], op: m[5], value: m[6] })
    } else if (m[7] !== undefined) {
      tokens.push({ type: 'keyword', value: m[7] })
    } else if (m[8] !== undefined) {
      // handle OR / AND / NOT
      const w = m[8].toUpperCase()
      if (w === 'OR' || w === 'AND' || w === 'NOT') {
        tokens.push({ type: 'logic', value: w })
      } else {
        tokens.push({ type: 'keyword', value: m[8] })
      }
    }
  }
  return tokens
}

function matchAllTokens(event, tokens) {
  // Simple left-to-right evaluation with OR support
  if (!tokens.length) return true
  let result = true
  let i = 0
  while (i < tokens.length) {
    const t = tokens[i]
    if (t.type === 'logic') {
      if (t.value === 'OR') {
        i++
        const next = tokens[i]
        result = result || matchToken(event, next)
      } else if (t.value === 'NOT') {
        i++
        const next = tokens[i]
        result = result && !matchToken(event, next)
      }
      // AND is implicit
    } else {
      if (i === 0) result = matchToken(event, t)
      else result = result && matchToken(event, t)
    }
    i++
  }
  return result
}

function matchToken(event, token) {
  if (!token) return true
  if (token.type === 'kv') {
    const fieldVal = String(event[token.key] ?? '')
    const match = matchWildcard(token.value.toLowerCase(), fieldVal.toLowerCase())
    return token.op === '!=' ? !match : match
  }
  if (token.type === 'keyword') {
    const raw = (event._raw || Object.values(event).join(' ')).toLowerCase()
    return matchWildcard(token.value.toLowerCase(), raw)
  }
  return true
}

function matchWildcard(pattern, value) {
  if (!pattern.includes('*')) return pattern === value
  const re = new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')
  return re.test(value)
}

// ─── WHERE ────────────────────────────────────────────────────────────────────
export function cmdWhere(events, args) {
  return events.filter(e => evalCondition(e, args))
}

// ─── TABLE ────────────────────────────────────────────────────────────────────
export function cmdTable(events, args) {
  const fields = parseFieldList(args)
  return events.map(e => {
    const row = {}
    fields.forEach(f => { row[f] = e[f] ?? '' })
    return row
  })
}

// ─── FIELDS ───────────────────────────────────────────────────────────────────
export function cmdFields(events, args) {
  const m = args.trim().match(/^([+-])?\s*(.+)$/)
  const sign = m?.[1] || '+'
  const fields = parseFieldList(m?.[2] || args)
  if (sign === '-') {
    return events.map(e => {
      const row = { ...e }
      fields.forEach(f => delete row[f])
      return row
    })
  }
  return events.map(e => {
    const row = {}
    // always keep _time
    if (e._time) row._time = e._time
    fields.forEach(f => { row[f] = e[f] ?? '' })
    return row
  })
}

// ─── RENAME ───────────────────────────────────────────────────────────────────
export function cmdRename(events, args) {
  // Syntax: old AS new, old AS new, ...
  const pairs = args.split(',').map(p => {
    const m = p.trim().match(/^(.+?)\s+[Aa][Ss]\s+(.+)$/)
    if (!m) return null
    return { from: m[1].trim().replace(/^"|"$/g, ''), to: m[2].trim().replace(/^"|"$/g, '') }
  }).filter(Boolean)
  return events.map(e => {
    const row = { ...e }
    pairs.forEach(({ from, to }) => {
      if (from in row) { row[to] = row[from]; delete row[from] }
    })
    return row
  })
}

// ─── SORT ─────────────────────────────────────────────────────────────────────
export function cmdSort(events, args) {
  // args: -field1 +field2 field3  or  0 -field (0 means unlimited)
  let rest = args.trim()
  // strip leading limit number (e.g. "0 " or "10000 ")
  rest = rest.replace(/^\d+\s+/, '')
  if (!rest) return events

  const parts = rest.split(/\s+/)
  const criteria = parts.map(p => {
    if (p.startsWith('-')) return { field: p.slice(1), dir: -1 }
    if (p.startsWith('+')) return { field: p.slice(1), dir: 1 }
    return { field: p, dir: 1 }
  })

  return [...events].sort((a, b) => {
    for (const { field, dir } of criteria) {
      const av = a[field] ?? ''
      const bv = b[field] ?? ''
      const an = parseFloat(av), bn = parseFloat(bv)
      let cmp
      if (!isNaN(an) && !isNaN(bn)) cmp = an - bn
      else cmp = String(av).localeCompare(String(bv))
      if (cmp !== 0) return cmp * dir
    }
    return 0
  })
}

// ─── HEAD ─────────────────────────────────────────────────────────────────────
export function cmdHead(events, args) {
  const n = parseInt(args.trim()) || 10
  return events.slice(0, n)
}

// ─── TAIL ─────────────────────────────────────────────────────────────────────
export function cmdTail(events, args) {
  const n = parseInt(args.trim()) || 10
  return events.slice(-n)
}

// ─── DEDUP ────────────────────────────────────────────────────────────────────
export function cmdDedup(events, args) {
  // dedup [N] field1 field2 ... [sortby -field] [keepevents=t]
  let rest = args.trim()
  const keepEvents = /keepevents\s*=\s*t/i.test(rest)
  rest = rest.replace(/keepevents\s*=\s*\w+/i, '').trim()
  const sortByMatch = rest.match(/sortby\s+(.+)$/i)
  let sortByArgs = ''
  if (sortByMatch) { sortByArgs = sortByMatch[1]; rest = rest.replace(sortByMatch[0], '').trim() }
  const numMatch = rest.match(/^(\d+)\s+/)
  const keepN = numMatch ? parseInt(numMatch[1]) : 1
  if (numMatch) rest = rest.slice(numMatch[0].length)
  const fields = parseFieldList(rest)
  if (!fields.length) return events

  let pool = events
  if (sortByArgs) pool = cmdSort(events, sortByArgs)

  const seen = new Map()
  const result = []
  for (const e of pool) {
    const key = fields.map(f => String(e[f] ?? '')).join('|||')
    const count = seen.get(key) || 0
    if (count < keepN) {
      result.push(e)
      seen.set(key, count + 1)
    } else if (keepEvents) {
      result.push({ ...e, _isDuplicate: true })
    }
  }
  return result
}

// ─── FILLNULL ─────────────────────────────────────────────────────────────────
export function cmdFillnull(events, args) {
  const valMatch = args.match(/value\s*=\s*"?([^"\s]+)"?/i)
  const fillVal = valMatch ? valMatch[1] : '0'
  const fieldPart = args.replace(/value\s*=\s*"?[^"\s]+"?/i, '').trim()
  const fields = fieldPart ? parseFieldList(fieldPart) : null
  return events.map(e => {
    const row = { ...e }
    const keys = fields || Object.keys(row)
    keys.forEach(k => { if (row[k] == null || row[k] === '') row[k] = fillVal })
    return row
  })
}

// ─── REPLACE ──────────────────────────────────────────────────────────────────
export function cmdReplace(events, args) {
  // replace "old" WITH "new" IN field
  const m = args.match(/"([^"]*)"\s+WITH\s+"([^"]*)"\s+IN\s+(\S+)/i)
    || args.match(/(\S+)\s+WITH\s+(\S+)\s+IN\s+(\S+)/i)
  if (!m) return events
  const [, oldVal, newVal, field] = m
  return events.map(e => {
    const row = { ...e }
    if (row[field] !== undefined) {
      row[field] = String(row[field]).replace(new RegExp(oldVal, 'gi'), newVal)
    }
    return row
  })
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
export function parseFieldList(args) {
  return args.split(/[\s,]+/).map(f => f.replace(/^"|"$/g, '').trim()).filter(Boolean)
}

export function evalCondition(event, expr) {
  // Simple condition evaluator for where command
  // Supports: field=val, field!=val, field>val, field<val, field>=val, field<=val
  //           isnotnull(field), isnull(field), AND, OR, NOT, (...)
  try {
    const normalized = expr
      .replace(/isnotnull\(([^)]+)\)/gi, (_, f) => `__NOTNULL__${f.trim()}__`)
      .replace(/isnull\(([^)]+)\)/gi, (_, f) => `__NULL__${f.trim()}__`)
      .replace(/\bAND\b/gi, '&&')
      .replace(/\bOR\b/gi, '||')
      .replace(/\bNOT\b/gi, '!')

    const result = evalExprParts(event, normalized)
    return Boolean(result)
  } catch {
    return true
  }
}

function evalExprParts(event, expr) {
  // Handle __NOTNULL__ and __NULL__ markers
  expr = expr.replace(/__NOTNULL__(\w+)__/g, (_, f) => {
    const v = event[f]
    return v !== null && v !== undefined && v !== '' ? 'true' : 'false'
  })
  expr = expr.replace(/__NULL__(\w+)__/g, (_, f) => {
    const v = event[f]
    return v === null || v === undefined || v === '' ? 'true' : 'false'
  })

  // Replace field comparisons: field op "val" or field op val
  expr = expr.replace(/(\w[\w.]*)\s*(>=|<=|!=|>|<|=)\s*"([^"]*)"/g, (_, f, op, v) => cmpExpr(event, f, op, v))
  expr = expr.replace(/(\w[\w.]*)\s*(>=|<=|!=|>|<|=)\s*(\S+)/g, (_, f, op, v) => cmpExpr(event, f, op, v))

  // Evaluate boolean expression
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`return (${expr})`)()
  } catch {
    return true
  }
}

function cmpExpr(event, field, op, val) {
  const ev = event[field] ?? ''
  const en = parseFloat(ev), vn = parseFloat(val)
  const useNum = !isNaN(en) && !isNaN(vn)
  const a = useNum ? en : String(ev).toLowerCase()
  const b = useNum ? vn : val.toLowerCase()
  switch (op) {
    case '=':  return a == b ? 'true' : 'false'
    case '!=': return a != b ? 'true' : 'false'
    case '>':  return a > b  ? 'true' : 'false'
    case '<':  return a < b  ? 'true' : 'false'
    case '>=': return a >= b ? 'true' : 'false'
    case '<=': return a <= b ? 'true' : 'false'
    default:   return 'true'
  }
}
