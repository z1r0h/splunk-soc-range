import { winEventLog } from './logs/winEventLog.js'
import { networkLog } from './logs/networkLog.js'
import { proxyLog } from './logs/proxyLog.js'
import { sysmonLog } from './logs/sysmonLog.js'
import { dnsLog } from './logs/dnsLog.js'
import { lookupTables } from './lookups/lookupTables.js'

// Combine all logs into one searchable dataset
export const ALL_EVENTS = [
  ...winEventLog,
  ...networkLog,
  ...proxyLog,
  ...sysmonLog,
  ...dnsLog,
].map((e, i) => ({
  ...e,
  _raw: Object.entries(e).map(([k,v]) => `${k}=${v}`).join(' '),
  _serial: i,
}))

export { lookupTables }
export const INDEX_MAP = {
  wineventlog: winEventLog,
  network: networkLog,
  proxy: proxyLog,
  sysmon: sysmonLog,
  dns: dnsLog,
}
