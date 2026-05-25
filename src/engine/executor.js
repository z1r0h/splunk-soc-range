import { tokenize } from './tokenizer.js'
import { cmdSearch, cmdWhere, cmdTable, cmdFields, cmdRename, cmdSort, cmdHead, cmdTail, cmdDedup, cmdFillnull, cmdReplace } from './commands/basic.js'
import { cmdEval, cmdStats, cmdEventstats, cmdStreamstats, cmdTimechart, cmdBin } from './commands/advanced.js'
import { cmdRex, cmdLookup, cmdInputlookup, cmdJoin, cmdAppend, cmdAppendcols, cmdTransaction, cmdMakemv, cmdMvexpand, cmdTstats } from './commands/data.js'
import { ALL_EVENTS } from '../data/index.js'

export function executeSPL(spl) {
  if (!spl.trim()) throw new Error('Empty query')
  const stages = tokenize(spl)
  if (!stages.length) throw new Error('Could not parse query')

  // Recursive executor for subsearches
  const executor = (subSpl) => executeSPL(subSpl)

  let results = ALL_EVENTS
  let isFirstStage = true

  for (const { command, args } of stages) {
    switch (command.toLowerCase()) {
      case 'search':
        results = cmdSearch(results, args, ALL_EVENTS)
        break
      case 'where':
        results = cmdWhere(results, args)
        break
      case 'eval':
        results = cmdEval(results, args)
        break
      case 'stats':
        results = cmdStats(results, args)
        break
      case 'eventstats':
        results = cmdEventstats(results, args)
        break
      case 'streamstats':
        results = cmdStreamstats(results, args)
        break
      case 'timechart':
        results = cmdTimechart(results, args)
        break
      case 'bin':
        results = cmdBin(results, args)
        break
      case 'table':
        results = cmdTable(results, args)
        break
      case 'fields':
        results = cmdFields(results, args)
        break
      case 'rename':
        results = cmdRename(results, args)
        break
      case 'sort':
        results = cmdSort(results, args)
        break
      case 'head':
        results = cmdHead(results, args)
        break
      case 'tail':
        results = cmdTail(results, args)
        break
      case 'dedup':
        results = cmdDedup(results, args)
        break
      case 'rex':
        results = cmdRex(results, args)
        break
      case 'lookup':
        results = cmdLookup(results, args)
        break
      case 'inputlookup':
        results = cmdInputlookup(results, args)
        break
      case 'join':
        results = cmdJoin(results, args, ALL_EVENTS, executor)
        break
      case 'append':
        results = cmdAppend(results, args, ALL_EVENTS, executor)
        break
      case 'appendcols':
        results = cmdAppendcols(results, args, ALL_EVENTS, executor)
        break
      case 'transaction':
        results = cmdTransaction(results, args)
        break
      case 'makemv':
        results = cmdMakemv(results, args)
        break
      case 'mvexpand':
        results = cmdMvexpand(results, args)
        break
      case 'tstats':
      case 'prestats':
        results = cmdTstats(results, args, ALL_EVENTS)
        break
      case 'fillnull':
        results = cmdFillnull(results, args)
        break
      case 'replace':
        results = cmdReplace(results, args)
        break
      case 'coalesce':
        // coalesce as a standalone pipe command is uncommon; usually used inside eval
        break
      default:
        throw new Error(`Unknown command: "${command}". Supported commands: search, where, eval, stats, eventstats, streamstats, timechart, bin, table, fields, rename, sort, head, tail, dedup, rex, lookup, inputlookup, join, append, transaction, makemv, mvexpand, tstats, fillnull, replace`)
    }
    isFirstStage = false
  }

  // Cap results for display performance
  const MAX_RESULTS = 500
  if (results.length > MAX_RESULTS) {
    return { rows: results.slice(0, MAX_RESULTS), truncated: true, total: results.length }
  }
  return { rows: results, truncated: false, total: results.length }
}

export function getColumns(rows) {
  if (!rows.length) return []
  const seen = new Set()
  const cols = []
  // _time first
  if (rows[0]._time !== undefined) { seen.add('_time'); cols.push('_time') }
  rows.forEach(r => {
    Object.keys(r).forEach(k => {
      if (!seen.has(k) && !k.startsWith('_')) { seen.add(k); cols.push(k) }
    })
  })
  // internal fields last
  rows.forEach(r => {
    Object.keys(r).forEach(k => {
      if (!seen.has(k)) { seen.add(k); cols.push(k) }
    })
  })
  return cols.filter(c => c !== '_raw' && c !== '_serial')
}
