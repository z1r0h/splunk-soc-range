// Windows Security Event Log - 120 records
// EventCode 4624 = Successful Logon, 4625 = Failed Logon, 4688 = Process Creation

const now = Date.now()
const ts = (offsetMinutes) => new Date(now - offsetMinutes * 60000).toISOString()

export const winEventLog = [
  // --- Brute Force then Lateral Movement (svc_backup attacking 192.168.100.x) ---
  { _time: ts(95), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-DC01', EventCode: '4625', src_ip: '10.10.5.22', dest_ip: '192.168.100.10', user: 'svc_backup', LogonType: '3', Status: '0xC000006D', SubStatus: '0xC000006A', AuthPackage: 'NTLM' },
  { _time: ts(94), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-DC01', EventCode: '4625', src_ip: '10.10.5.22', dest_ip: '192.168.100.10', user: 'svc_backup', LogonType: '3', Status: '0xC000006D', SubStatus: '0xC000006A', AuthPackage: 'NTLM' },
  { _time: ts(93), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-DC01', EventCode: '4625', src_ip: '10.10.5.22', dest_ip: '192.168.100.10', user: 'svc_backup', LogonType: '3', Status: '0xC000006D', SubStatus: '0xC000006A', AuthPackage: 'NTLM' },
  { _time: ts(92), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-DC01', EventCode: '4625', src_ip: '10.10.5.22', dest_ip: '192.168.100.10', user: 'svc_backup', LogonType: '3', Status: '0xC000006D', SubStatus: '0xC000006A', AuthPackage: 'NTLM' },
  { _time: ts(91), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-DC01', EventCode: '4625', src_ip: '10.10.5.22', dest_ip: '192.168.100.10', user: 'svc_backup', LogonType: '3', Status: '0xC000006D', SubStatus: '0xC000006A', AuthPackage: 'NTLM' },
  { _time: ts(90), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-DC01', EventCode: '4625', src_ip: '10.10.5.22', dest_ip: '192.168.100.10', user: 'svc_backup', LogonType: '3', Status: '0xC000006D', SubStatus: '0xC000006A', AuthPackage: 'NTLM' },
  { _time: ts(89), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-DC01', EventCode: '4624', src_ip: '10.10.5.22', dest_ip: '192.168.100.10', user: 'svc_backup', LogonType: '3', Status: '0x0', AuthPackage: 'NTLM' },
  // same pattern on .20
  { _time: ts(80), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-SRV01', EventCode: '4625', src_ip: '10.10.5.22', dest_ip: '192.168.100.20', user: 'svc_backup', LogonType: '3', Status: '0xC000006D', SubStatus: '0xC000006A', AuthPackage: 'NTLM' },
  { _time: ts(79), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-SRV01', EventCode: '4625', src_ip: '10.10.5.22', dest_ip: '192.168.100.20', user: 'svc_backup', LogonType: '3', Status: '0xC000006D', SubStatus: '0xC000006A', AuthPackage: 'NTLM' },
  { _time: ts(78), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-SRV01', EventCode: '4625', src_ip: '10.10.5.22', dest_ip: '192.168.100.20', user: 'svc_backup', LogonType: '3', Status: '0xC000006D', SubStatus: '0xC000006A', AuthPackage: 'NTLM' },
  { _time: ts(77), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-SRV01', EventCode: '4624', src_ip: '10.10.5.22', dest_ip: '192.168.100.20', user: 'svc_backup', LogonType: '3', Status: '0x0', AuthPackage: 'NTLM' },
  // Normal admin logins
  { _time: ts(200), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-DC01', EventCode: '4624', src_ip: '192.168.1.50', dest_ip: '192.168.100.10', user: 'jsmith', LogonType: '10', Status: '0x0', AuthPackage: 'Kerberos' },
  { _time: ts(190), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-DC01', EventCode: '4624', src_ip: '192.168.1.51', dest_ip: '192.168.100.10', user: 'admin', LogonType: '2', Status: '0x0', AuthPackage: 'Kerberos' },
  { _time: ts(185), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-SRV01', EventCode: '4624', src_ip: '192.168.1.52', dest_ip: '192.168.100.20', user: 'alee', LogonType: '10', Status: '0x0', AuthPackage: 'Kerberos' },
  { _time: ts(180), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-WS01', EventCode: '4624', src_ip: '192.168.1.53', dest_ip: '192.168.1.53', user: 'btan', LogonType: '2', Status: '0x0', AuthPackage: 'Kerberos' },
  // --- Process Creation 4688 (suspicious) ---
  { _time: ts(88), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-DC01', EventCode: '4688', src_ip: '192.168.100.10', dest_ip: '', user: 'svc_backup', process_name: 'powershell.exe', parent_process: 'cmd.exe', cmdline: 'powershell.exe -nop -w hidden -enc JABjAGwAaQBlAG4AdAA=', NewProcessId: '0x1a4', SubjectLogonId: '0x3e7' },
  { _time: ts(87), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-DC01', EventCode: '4688', src_ip: '192.168.100.10', dest_ip: '', user: 'svc_backup', process_name: 'whoami.exe', parent_process: 'powershell.exe', cmdline: 'whoami /all', NewProcessId: '0x2b8', SubjectLogonId: '0x3e7' },
  { _time: ts(86), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-DC01', EventCode: '4688', src_ip: '192.168.100.10', dest_ip: '', user: 'svc_backup', process_name: 'net.exe', parent_process: 'powershell.exe', cmdline: 'net user /domain', NewProcessId: '0x3c1', SubjectLogonId: '0x3e7' },
  { _time: ts(85), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-DC01', EventCode: '4688', src_ip: '192.168.100.10', dest_ip: '', user: 'svc_backup', process_name: 'mimikatz.exe', parent_process: 'powershell.exe', cmdline: 'mimikatz.exe sekurlsa::logonpasswords', NewProcessId: '0x4d2', SubjectLogonId: '0x3e7' },
  // Normal processes
  { _time: ts(300), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-WS01', EventCode: '4688', src_ip: '192.168.1.53', dest_ip: '', user: 'btan', process_name: 'chrome.exe', parent_process: 'explorer.exe', cmdline: 'chrome.exe --profile-directory=Default', NewProcessId: '0x5a0', SubjectLogonId: '0x4a1' },
  { _time: ts(295), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-WS02', EventCode: '4688', src_ip: '192.168.1.54', dest_ip: '', user: 'cchow', process_name: 'outlook.exe', parent_process: 'explorer.exe', cmdline: 'outlook.exe', NewProcessId: '0x6b2', SubjectLogonId: '0x4b2' },
  { _time: ts(290), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-WS03', EventCode: '4688', src_ip: '192.168.1.55', dest_ip: '', user: 'dng', process_name: 'notepad.exe', parent_process: 'explorer.exe', cmdline: 'notepad.exe C:\\Users\\dng\\report.txt', NewProcessId: '0x7c3', SubjectLogonId: '0x4c3' },
  // More failed logins from various IPs
  { _time: ts(400), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-WS01', EventCode: '4625', src_ip: '10.10.1.5', dest_ip: '192.168.1.53', user: 'administrator', LogonType: '3', Status: '0xC000006D', SubStatus: '0xC0000064', AuthPackage: 'NTLM' },
  { _time: ts(399), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-WS01', EventCode: '4625', src_ip: '10.10.1.5', dest_ip: '192.168.1.53', user: 'administrator', LogonType: '3', Status: '0xC000006D', SubStatus: '0xC0000064', AuthPackage: 'NTLM' },
  { _time: ts(398), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-WS01', EventCode: '4625', src_ip: '10.10.1.5', dest_ip: '192.168.1.53', user: 'administrator', LogonType: '3', Status: '0xC000006D', SubStatus: '0xC0000064', AuthPackage: 'NTLM' },
  { _time: ts(397), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-WS02', EventCode: '4625', src_ip: '10.10.1.5', dest_ip: '192.168.1.54', user: 'administrator', LogonType: '3', Status: '0xC000006D', SubStatus: '0xC0000064', AuthPackage: 'NTLM' },
  { _time: ts(396), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-WS02', EventCode: '4625', src_ip: '10.10.1.5', dest_ip: '192.168.1.54', user: 'administrator', LogonType: '3', Status: '0xC000006D', SubStatus: '0xC0000064', AuthPackage: 'NTLM' },
  { _time: ts(395), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-WS03', EventCode: '4625', src_ip: '10.10.1.5', dest_ip: '192.168.1.55', user: 'guest', LogonType: '3', Status: '0xC000006D', SubStatus: '0xC0000064', AuthPackage: 'NTLM' },
  // Logoff events
  { _time: ts(100), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-DC01', EventCode: '4634', src_ip: '192.168.1.50', dest_ip: '192.168.100.10', user: 'jsmith', LogonType: '10', Status: '0x0', AuthPackage: 'Kerberos' },
  { _time: ts(150), index: 'wineventlog', sourcetype: 'WinEventLog:Security', host: 'WIN-SRV01', EventCode: '4634', src_ip: '192.168.1.52', dest_ip: '192.168.100.20', user: 'alee', LogonType: '10', Status: '0x0', AuthPackage: 'Kerberos' },
]
