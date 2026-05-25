// Threat Intelligence Lookup Tables
// Used by lookup / inputlookup commands in the SPL engine

export const lookupTables = {

  // threat_intel_ip.csv — malicious IP list
  threat_intel_ip: [
    { ip: '185.220.101.45', threat_type: 'C2', confidence: 'High',   source: 'AlienVault', description: 'Known Cobalt Strike C2 server' },
    { ip: '203.0.113.99',   threat_type: 'Exfil', confidence: 'High', source: 'ThreatFox',  description: 'Data exfiltration endpoint' },
    { ip: '91.108.4.10',    threat_type: 'Malware', confidence: 'High', source: 'VirusTotal', description: 'Malware distribution server' },
    { ip: '45.142.212.100', threat_type: 'Scanner', confidence: 'Medium', source: 'Shodan', description: 'Known port scanner' },
    { ip: '45.142.212.101', threat_type: 'Scanner', confidence: 'Medium', source: 'Shodan', description: 'Known port scanner' },
    { ip: '10.10.5.22',     threat_type: 'Internal', confidence: 'High', source: 'SOC',    description: 'Compromised internal host - IT Asset' },
  ],

  // threat_intel_domain.csv — malicious domain list
  threat_intel_domain: [
    { domain: 'malware-dist.ru',   threat_type: 'Malware',  confidence: 'High',   source: 'VirusTotal', description: 'Malware payload distribution' },
    { domain: 'c2-panel.onion.to', threat_type: 'C2',       confidence: 'High',   source: 'AlienVault', description: 'C2 panel proxy' },
    { domain: 'file-drop.xyz',     threat_type: 'Exfil',    confidence: 'High',   source: 'ThreatFox',  description: 'Anonymous file upload service abused for exfil' },
    { domain: 'tunnel-c2.xyz',     threat_type: 'DNS Tunnel', confidence: 'High', source: 'SOC',        description: 'DNS tunneling C2 domain' },
    { domain: 'typo-micros0ft.com', threat_type: 'Phishing', confidence: 'Medium', source: 'PhishTank', description: 'Microsoft typosquatting domain' },
  ],

  // threat_intel_hash.csv — malicious file hashes
  threat_intel_hash: [
    { hash: '92CFCEB39D57D914ED8B14D0E37643DE0797AE56', threat_type: 'Credential Dumper', confidence: 'High',   source: 'VirusTotal', description: 'Mimikatz variant' },
    { hash: '7353F60B1739074EB17C5F4DDDEFE239',         threat_type: 'Loader',            confidence: 'High',   source: 'MalwareBazaar', description: 'Cobalt Strike stager' },
    { hash: 'DEADBEEF1234567890ABCDEF12345678',         threat_type: 'Ransomware',         confidence: 'High',   source: 'ThreatFox',  description: 'LockBit 3.0 variant' },
  ],

  // user_asset_map.csv — user to asset mapping (Asset & Identity)
  user_asset_map: [
    { user: 'jsmith',     asset: 'WIN-WS01', department: 'IT',       priority: 'medium', title: 'IT Engineer' },
    { user: 'alee',       asset: 'WIN-WS02', department: 'Finance',  priority: 'high',   title: 'CFO' },
    { user: 'btan',       asset: 'WIN-WS03', department: 'IT',       priority: 'medium', title: 'SOC Analyst' },
    { user: 'cchow',      asset: 'WIN-WS04', department: 'HR',       priority: 'medium', title: 'HR Manager' },
    { user: 'dng',        asset: 'WIN-WS05', department: 'Engineering', priority: 'medium', title: 'Developer' },
    { user: 'eong',       asset: 'WIN-WS06', department: 'Sales',    priority: 'low',    title: 'Sales Rep' },
    { user: 'svc_backup', asset: 'WIN-DC01', department: 'IT',       priority: 'critical', title: 'Service Account - Backup' },
    { user: 'admin',      asset: 'WIN-DC01', department: 'IT',       priority: 'critical', title: 'Domain Admin' },
  ],

  // lolbins.csv — known Living-off-the-Land binaries
  lolbins: [
    { process_name: 'certutil.exe',  risk: 'High',   technique: 'T1105', description: 'Can download files from internet' },
    { process_name: 'mshta.exe',     risk: 'High',   technique: 'T1218.005', description: 'Executes HTA files, can bypass AppLocker' },
    { process_name: 'regsvr32.exe',  risk: 'High',   technique: 'T1218.010', description: 'Executes DLLs, bypasses UAC' },
    { process_name: 'wmic.exe',      risk: 'High',   technique: 'T1047', description: 'WMI lateral movement and execution' },
    { process_name: 'bitsadmin.exe', risk: 'Medium', technique: 'T1197', description: 'Background file transfer' },
    { process_name: 'rundll32.exe',  risk: 'Medium', technique: 'T1218.011', description: 'Executes DLLs' },
    { process_name: 'powershell.exe', risk: 'High',  technique: 'T1059.001', description: 'Script execution, often obfuscated' },
    { process_name: 'mimikatz.exe',  risk: 'Critical', technique: 'T1003', description: 'Credential dumping tool' },
  ],
}
