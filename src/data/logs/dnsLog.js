const now = Date.now()
const ts = (offsetMinutes) => new Date(now - offsetMinutes * 60000).toISOString()

export const dnsLog = [
  // DNS Tunneling (high frequency, long subdomain)
  { _time: ts(88), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.100.10', query: 'aGVsbG8td29ybGQ.tunnel-c2.xyz', query_type: 'TXT', answer: '10.0.0.1', ttl: '0', response_code: 'NOERROR', bytes: '280' },
  { _time: ts(87), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.100.10', query: 'dGhpcyBpcyBhIHRlc3Q.tunnel-c2.xyz', query_type: 'TXT', answer: '10.0.0.1', ttl: '0', response_code: 'NOERROR', bytes: '310' },
  { _time: ts(86), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.100.10', query: 'c3BseyBkbnMgdHVubmVs.tunnel-c2.xyz', query_type: 'TXT', answer: '10.0.0.1', ttl: '0', response_code: 'NOERROR', bytes: '295' },
  { _time: ts(85), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.100.10', query: 'ZXhhbXBsZSBkYXRhIGhlcmU.tunnel-c2.xyz', query_type: 'TXT', answer: '10.0.0.1', ttl: '0', response_code: 'NOERROR', bytes: '320' },
  { _time: ts(84), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.100.10', query: 'bW9yZSBkYXRhIHRvIGV4ZmlsdHJhdGU.tunnel-c2.xyz', query_type: 'TXT', answer: '10.0.0.1', ttl: '0', response_code: 'NOERROR', bytes: '350' },
  { _time: ts(83), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.100.10', query: 'cGF5bG9hZCBjaHVuayA2.tunnel-c2.xyz', query_type: 'TXT', answer: '10.0.0.1', ttl: '0', response_code: 'NOERROR', bytes: '288' },
  { _time: ts(82), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.100.10', query: 'ZmluYWwgY2h1bmsgb2YgZGF0YQ.tunnel-c2.xyz', query_type: 'TXT', answer: '10.0.0.1', ttl: '0', response_code: 'NOERROR', bytes: '305' },
  // Known malicious domain resolution
  { _time: ts(86), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.100.10', query: 'malware-dist.ru', query_type: 'A', answer: '91.108.4.10', ttl: '300', response_code: 'NOERROR', bytes: '80' },
  { _time: ts(26), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.100.10', query: 'file-drop.xyz', query_type: 'A', answer: '203.0.113.99', ttl: '60', response_code: 'NOERROR', bytes: '75' },
  { _time: ts(60), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.100.10', query: 'c2-panel.onion.to', query_type: 'A', answer: '185.220.101.45', ttl: '30', response_code: 'NOERROR', bytes: '78' },
  // Normal DNS traffic
  { _time: ts(500), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.1.50', query: 'www.google.com', query_type: 'A', answer: '142.250.4.147', ttl: '300', response_code: 'NOERROR', bytes: '65' },
  { _time: ts(499), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.1.51', query: 'docs.splunk.com', query_type: 'A', answer: '35.166.5.18', ttl: '300', response_code: 'NOERROR', bytes: '68' },
  { _time: ts(498), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.1.52', query: 'outlook.office365.com', query_type: 'A', answer: '52.97.128.1', ttl: '60', response_code: 'NOERROR', bytes: '72' },
  { _time: ts(497), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.1.53', query: 'github.com', query_type: 'A', answer: '140.82.112.4', ttl: '60', response_code: 'NOERROR', bytes: '63' },
  { _time: ts(496), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.1.54', query: 'api.microsoft.com', query_type: 'A', answer: '20.190.144.10', ttl: '300', response_code: 'NOERROR', bytes: '70' },
  { _time: ts(495), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.1.55', query: 'www.youtube.com', query_type: 'A', answer: '142.250.185.78', ttl: '300', response_code: 'NOERROR', bytes: '66' },
  // Failed/NXDOMAIN
  { _time: ts(400), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.1.50', query: 'nonexistent-domain-xyz123.com', query_type: 'A', answer: '', ttl: '0', response_code: 'NXDOMAIN', bytes: '55' },
  { _time: ts(398), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.1.51', query: 'typo-micros0ft.com', query_type: 'A', answer: '', ttl: '0', response_code: 'NXDOMAIN', bytes: '58' },
  // Multiple MX/TXT lookups (normal mail)
  { _time: ts(300), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.100.5', query: 'gmail.com', query_type: 'MX', answer: 'alt1.gmail-smtp-in.l.google.com', ttl: '300', response_code: 'NOERROR', bytes: '90' },
  { _time: ts(299), index: 'dns', sourcetype: 'stream:dns', host: 'DNS-INT', src_ip: '192.168.100.5', query: 'outlook.com', query_type: 'MX', answer: 'outlook-com.olc.protection.outlook.com', ttl: '300', response_code: 'NOERROR', bytes: '95' },
]
