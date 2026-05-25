const now = Date.now()
const ts = (offsetMinutes) => new Date(now - offsetMinutes * 60000).toISOString()

export const networkLog = [
  // C2 beacon traffic (regular interval to malicious IP)
  { _time: ts(60), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '192.168.100.10', dest_ip: '185.220.101.45', src_port: '54321', dest_port: '443', protocol: 'tcp', action: 'allow', bytes_in: '512', bytes_out: '128', duration: '2', app: 'ssl' },
  { _time: ts(50), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '192.168.100.10', dest_ip: '185.220.101.45', src_port: '54322', dest_port: '443', protocol: 'tcp', action: 'allow', bytes_in: '512', bytes_out: '128', duration: '2', app: 'ssl' },
  { _time: ts(40), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '192.168.100.10', dest_ip: '185.220.101.45', src_port: '54323', dest_port: '443', protocol: 'tcp', action: 'allow', bytes_in: '512', bytes_out: '128', duration: '2', app: 'ssl' },
  { _time: ts(30), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '192.168.100.10', dest_ip: '185.220.101.45', src_port: '54324', dest_port: '443', protocol: 'tcp', action: 'allow', bytes_in: '512', bytes_out: '128', duration: '2', app: 'ssl' },
  { _time: ts(20), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '192.168.100.10', dest_ip: '185.220.101.45', src_port: '54325', dest_port: '443', protocol: 'tcp', action: 'allow', bytes_in: '512', bytes_out: '128', duration: '2', app: 'ssl' },
  { _time: ts(10), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '192.168.100.10', dest_ip: '185.220.101.45', src_port: '54326', dest_port: '443', protocol: 'tcp', action: 'allow', bytes_in: '512', bytes_out: '128', duration: '2', app: 'ssl' },
  // Large data exfiltration
  { _time: ts(25), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '192.168.100.10', dest_ip: '203.0.113.99', src_port: '49200', dest_port: '443', protocol: 'tcp', action: 'allow', bytes_in: '1024', bytes_out: '52428800', duration: '180', app: 'ssl' },
  { _time: ts(24), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '192.168.100.10', dest_ip: '203.0.113.99', src_port: '49201', dest_port: '8443', protocol: 'tcp', action: 'allow', bytes_in: '512', bytes_out: '31457280', duration: '120', app: 'ssl' },
  // Port scanning
  { _time: ts(120), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '10.10.5.22', dest_ip: '192.168.100.10', src_port: '60001', dest_port: '22', protocol: 'tcp', action: 'deny', bytes_in: '60', bytes_out: '0', duration: '0', app: 'ssh' },
  { _time: ts(120), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '10.10.5.22', dest_ip: '192.168.100.10', src_port: '60002', dest_port: '23', protocol: 'tcp', action: 'deny', bytes_in: '60', bytes_out: '0', duration: '0', app: 'telnet' },
  { _time: ts(120), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '10.10.5.22', dest_ip: '192.168.100.10', src_port: '60003', dest_port: '80', protocol: 'tcp', action: 'allow', bytes_in: '200', bytes_out: '400', duration: '1', app: 'http' },
  { _time: ts(120), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '10.10.5.22', dest_ip: '192.168.100.10', src_port: '60004', dest_port: '135', protocol: 'tcp', action: 'deny', bytes_in: '60', bytes_out: '0', duration: '0', app: 'msrpc' },
  { _time: ts(120), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '10.10.5.22', dest_ip: '192.168.100.10', src_port: '60005', dest_port: '139', protocol: 'tcp', action: 'allow', bytes_in: '200', bytes_out: '100', duration: '1', app: 'netbios' },
  { _time: ts(120), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '10.10.5.22', dest_ip: '192.168.100.10', src_port: '60006', dest_port: '445', protocol: 'tcp', action: 'allow', bytes_in: '500', bytes_out: '200', duration: '2', app: 'smb' },
  { _time: ts(120), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '10.10.5.22', dest_ip: '192.168.100.10', src_port: '60007', dest_port: '3389', protocol: 'tcp', action: 'allow', bytes_in: '200', bytes_out: '100', duration: '1', app: 'rdp' },
  { _time: ts(119), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '10.10.5.22', dest_ip: '192.168.100.20', src_port: '60010', dest_port: '22', protocol: 'tcp', action: 'deny', bytes_in: '60', bytes_out: '0', duration: '0', app: 'ssh' },
  { _time: ts(119), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '10.10.5.22', dest_ip: '192.168.100.20', src_port: '60011', dest_port: '3389', protocol: 'tcp', action: 'allow', bytes_in: '200', bytes_out: '100', duration: '1', app: 'rdp' },
  { _time: ts(119), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '10.10.5.22', dest_ip: '192.168.100.30', src_port: '60020', dest_port: '445', protocol: 'tcp', action: 'allow', bytes_in: '500', bytes_out: '200', duration: '2', app: 'smb' },
  // Normal outbound traffic
  { _time: ts(500), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '192.168.1.50', dest_ip: '8.8.8.8', src_port: '52000', dest_port: '443', protocol: 'tcp', action: 'allow', bytes_in: '5000', bytes_out: '2000', duration: '30', app: 'ssl' },
  { _time: ts(490), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '192.168.1.51', dest_ip: '1.1.1.1', src_port: '52100', dest_port: '443', protocol: 'tcp', action: 'allow', bytes_in: '8000', bytes_out: '3000', duration: '45', app: 'ssl' },
  { _time: ts(480), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '192.168.1.52', dest_ip: '172.217.14.78', src_port: '52200', dest_port: '80', protocol: 'tcp', action: 'allow', bytes_in: '15000', bytes_out: '5000', duration: '60', app: 'http' },
  { _time: ts(470), index: 'network', sourcetype: 'cisco:asa', host: 'FW-CORE', src_ip: '192.168.1.53', dest_ip: '52.95.110.1', src_port: '52300', dest_port: '443', protocol: 'tcp', action: 'allow', bytes_in: '20000', bytes_out: '8000', duration: '90', app: 'ssl' },
  // Blocked external attacks
  { _time: ts(600), index: 'network', sourcetype: 'cisco:asa', host: 'FW-EDGE', src_ip: '45.142.212.100', dest_ip: '203.0.113.5', src_port: '11000', dest_port: '22', protocol: 'tcp', action: 'deny', bytes_in: '60', bytes_out: '0', duration: '0', app: 'ssh' },
  { _time: ts(599), index: 'network', sourcetype: 'cisco:asa', host: 'FW-EDGE', src_ip: '45.142.212.100', dest_ip: '203.0.113.5', src_port: '11001', dest_port: '22', protocol: 'tcp', action: 'deny', bytes_in: '60', bytes_out: '0', duration: '0', app: 'ssh' },
  { _time: ts(598), index: 'network', sourcetype: 'cisco:asa', host: 'FW-EDGE', src_ip: '45.142.212.101', dest_ip: '203.0.113.5', src_port: '11002', dest_port: '3389', protocol: 'tcp', action: 'deny', bytes_in: '60', bytes_out: '0', duration: '0', app: 'rdp' },
]
