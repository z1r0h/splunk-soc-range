// SPL Tokenizer
// Splits a raw SPL string into an array of { command, args } objects

/**
 * Split SPL into pipeline stages.
 * Handles brackets for subsearches: [...] is treated as one token.
 */
export function tokenize(spl) {
  const trimmed = spl.trim()
  const stages = []
  let current = ''
  let depth = 0

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i]
    if (ch === '[') { depth++; current += ch }
    else if (ch === ']') { depth--; current += ch }
    else if (ch === '|' && depth === 0) {
      const s = current.trim()
      if (s) stages.push(s)
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) stages.push(current.trim())

  return stages.map(parseStage)
}

function parseStage(stageStr) {
  const s = stageStr.trim()
  // Detect implicit search (no leading command keyword)
  const firstWord = s.split(/\s+/)[0].toLowerCase()
  const knownCommands = [
    'search','where','eval','stats','eventstats','streamstats',
    'timechart','bin','table','fields','rename','sort','head','tail',
    'dedup','rex','lookup','inputlookup','join','append','appendcols',
    'transaction','makemv','mvexpand','tstats','prestats',
    'fillnull','coalesce','replace','values'
  ]
  if (!knownCommands.includes(firstWord)) {
    // Treat entire stage as a search expression
    return { command: 'search', args: s }
  }
  const spaceIdx = s.indexOf(' ')
  if (spaceIdx === -1) return { command: firstWord, args: '' }
  return {
    command: firstWord,
    args: s.slice(spaceIdx + 1).trim()
  }
}
