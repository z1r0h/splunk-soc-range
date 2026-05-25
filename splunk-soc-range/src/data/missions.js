// 15 Missions — 10 SPL_Technical + 5 ES_Concept
// Each mission has 3-level hints and full expected SPL

export const missions = [

  // ─────────────────────────────────────────────
  // MISSION 01 — Easy | search + table + sort
  // ─────────────────────────────────────────────
  {
    id: '01',
    type: 'SPL_Technical',
    difficulty: 'Easy',
    title: 'First Responder: Find Failed Logins',
    threat_type: 'Brute Force',
    mitre: { tactic: 'TA0006 - Credential Access', technique: 'T1110 - Brute Force' },
    context: {
      description: 'A Tier 1 alert has fired — multiple failed login events detected. Your first task as a SOC analyst is to retrieve all failed login events and display them in a clean, readable table sorted by most recent first.',
      index: 'wineventlog',
      sourcetype: 'WinEventLog:Security',
      env: { EventCode_failed: '4625', fields_needed: 'src_ip, dest_ip, user, LogonType, _time' }
    },
    task: 'Write a SPL query to retrieve all EventCode=4625 (failed login) events. Display only the fields: _time, src_ip, dest_ip, user, LogonType. Sort by _time descending (newest first). Limit to 20 results.',
    required_commands: ['search', 'table', 'sort', 'head'],
    hints: [
      { level: 1, label: 'Direction', text: 'Start by filtering your index and sourcetype first — always constrain the search space before pulling data. Then filter by the specific EventCode.' },
      { level: 2, label: 'Syntax', text: 'Use: index=wineventlog sourcetype="WinEventLog:Security" EventCode=4625\nThen pipe to | table _time src_ip dest_ip user LogonType\nThen | sort -_time\nThen | head 20' },
      { level: 3, label: 'Answer', text: `index=wineventlog sourcetype="WinEventLog:Security" EventCode=4625
| table _time src_ip dest_ip user LogonType
| sort -_time
| head 20` }
    ],
    expected_spl: `index=wineventlog sourcetype="WinEventLog:Security" EventCode=4625
| table _time src_ip dest_ip user LogonType
| sort -_time
| head 20`,
    soc_mindset: 'As a SOC L1 analyst, 4625 alone is noise — every network has password typos. Your job is not to panic, but to triage: How many? From where? Targeting which accounts? This query is Step 1 of that triage.',
    mitre_explanation: 'EventCode 4625 maps to T1110 (Brute Force). A single failure is normal; a pattern across multiple accounts or destinations in a short window escalates to a true positive.',
  },

  // ─────────────────────────────────────────────
  // MISSION 02 — Easy | stats + dedup
  // ─────────────────────────────────────────────
  {
    id: '02',
    type: 'SPL_Technical',
    difficulty: 'Easy',
    title: 'Count the Noise: Login Summary',
    threat_type: 'Brute Force',
    mitre: { tactic: 'TA0006 - Credential Access', technique: 'T1110 - Brute Force' },
    context: {
      description: 'After finding individual failed events, you need a summary view. How many unique source IPs are attempting logins? Which accounts are being targeted most? Use stats to aggregate the picture.',
      index: 'wineventlog',
      sourcetype: 'WinEventLog:Security',
      env: { EventCode_failed: '4625', group_by: 'src_ip, user' }
    },
    task: 'Write a SPL query to count failed login attempts (EventCode=4625), grouped by src_ip and user. Show total count per combination. Also use dedup to find the list of unique usernames being targeted. Sort by count descending.',
    required_commands: ['stats', 'dedup', 'sort'],
    hints: [
      { level: 1, label: 'Direction', text: 'Think about two separate questions: (1) How many attempts per src_ip+user combo? Use stats count by. (2) What unique users are targeted? Use dedup on the user field.' },
      { level: 2, label: 'Syntax', text: 'For the count query:\nindex=wineventlog EventCode=4625 | stats count by src_ip user | sort -count\n\nFor unique users:\nindex=wineventlog EventCode=4625 | dedup user | table user' },
      { level: 3, label: 'Answer', text: `index=wineventlog sourcetype="WinEventLog:Security" EventCode=4625
| stats count by src_ip user
| sort -count` }
    ],
    expected_spl: `index=wineventlog sourcetype="WinEventLog:Security" EventCode=4625
| stats count by src_ip user
| sort -count`,
    soc_mindset: 'A stats summary transforms raw noise into a heat map of attacker behavior. If one src_ip appears across 10+ users, that is credential stuffing or password spraying — a very different threat than a single user forgetting their password.',
    mitre_explanation: 'High count per src_ip against multiple users = T1110.003 Password Spraying. High count per src_ip against one user = T1110.001 Password Guessing.',
  },

  // ─────────────────────────────────────────────
  // MISSION 03 — Easy | eval if + fields + rename
  // ─────────────────────────────────────────────
  {
    id: '03',
    type: 'SPL_Technical',
    difficulty: 'Easy',
    title: 'Label the Events: Success vs Failure',
    threat_type: 'Authentication Analysis',
    mitre: { tactic: 'TA0001 - Initial Access', technique: 'T1078 - Valid Accounts' },
    context: {
      description: 'You need to create a clean report showing both successful and failed logon events, with a human-readable label indicating the outcome. Raw EventCodes are not readable in a management report.',
      index: 'wineventlog',
      sourcetype: 'WinEventLog:Security',
      env: { EventCode_success: '4624', EventCode_failed: '4625' }
    },
    task: 'Retrieve all EventCode 4624 and 4625 events. Use eval to create a new field called "outcome" with value "Success" if EventCode=4624, and "Failure" if EventCode=4625. Rename src_ip to "Source IP" and user to "Account". Display _time, Source IP, Account, outcome using table.',
    required_commands: ['eval', 'rename', 'fields', 'table'],
    hints: [
      { level: 1, label: 'Direction', text: 'You need to (1) filter for both EventCodes using OR, (2) create a derived field with eval+if, (3) rename fields for readability, (4) select output columns with table.' },
      { level: 2, label: 'Syntax', text: 'Filter: index=wineventlog (EventCode=4624 OR EventCode=4625)\nCreate label: | eval outcome=if(EventCode="4624","Success","Failure")\nRename: | rename src_ip AS "Source IP", user AS "Account"\nDisplay: | table _time "Source IP" Account outcome' },
      { level: 3, label: 'Answer', text: `index=wineventlog sourcetype="WinEventLog:Security" (EventCode=4624 OR EventCode=4625)
| eval outcome=if(EventCode="4624","Success","Failure")
| rename src_ip AS "Source IP", user AS "Account"
| table _time "Source IP" Account outcome
| sort -_time` }
    ],
    expected_spl: `index=wineventlog sourcetype="WinEventLog:Security" (EventCode=4624 OR EventCode=4625)
| eval outcome=if(EventCode="4624","Success","Failure")
| rename src_ip AS "Source IP", user AS "Account"
| table _time "Source IP" Account outcome
| sort -_time`,
    soc_mindset: 'Readable field names matter when escalating to Tier 2 or presenting to management. Always translate raw codes into business language before sharing findings. eval+if is your translation layer.',
    mitre_explanation: '4624 after multiple 4625 from the same source is a strong indicator of T1078 (Valid Accounts) — the attacker successfully obtained credentials through brute force.',
  },

  // ─────────────────────────────────────────────
  // MISSION 04 — Medium | rex + eval
  // ─────────────────────────────────────────────
  {
    id: '04',
    type: 'SPL_Technical',
    difficulty: 'Medium',
    title: 'Extract the Evidence: Parse Command Lines',
    threat_type: 'Defense Evasion',
    mitre: { tactic: 'TA0005 - Defense Evasion', technique: 'T1059.001 - PowerShell' },
    context: {
      description: 'Sysmon EventCode 1 (Process Creation) logs contain raw command line strings. You need to extract meaningful indicators — specifically the -enc flag (Base64 encoded payload) from PowerShell commands and flag them as suspicious.',
      index: 'sysmon',
      sourcetype: 'XmlWinEventLog:Microsoft-Windows-Sysmon/Operational',
      env: { EventCode: '1', suspicious_process: 'powershell.exe', flag_to_extract: '-enc' }
    },
    task: 'From Sysmon EventCode=1 events where process_name is powershell.exe, use rex to extract the encoded payload that follows "-enc " in the cmdline field into a new field called "b64_payload". Then use eval to create a field "is_suspicious" = "YES" if b64_payload is not null, else "NO". Display process_name, user, b64_payload, is_suspicious.',
    required_commands: ['rex', 'eval', 'table', 'search'],
    hints: [
      { level: 1, label: 'Direction', text: 'rex uses named capture groups in regex. The syntax is: | rex field=cmdline "your_regex_here". To capture "everything after -enc ", use a named group like (?P<fieldname>pattern). Then coalesce or isnull to check if extraction succeeded.' },
      { level: 2, label: 'Syntax', text: 'Filter: index=sysmon EventCode=1 process_name=powershell.exe\nExtract: | rex field=cmdline "-enc\\s+(?P<b64_payload>\\S+)"\nFlag: | eval is_suspicious=if(isnotnull(b64_payload),"YES","NO")\nDisplay: | table user process_name b64_payload is_suspicious' },
      { level: 3, label: 'Answer', text: `index=sysmon sourcetype="XmlWinEventLog:Microsoft-Windows-Sysmon/Operational" EventCode=1 process_name=powershell.exe
| rex field=cmdline "-enc\\s+(?P<b64_payload>\\S+)"
| eval is_suspicious=if(isnotnull(b64_payload),"YES","NO")
| table _time user process_name b64_payload is_suspicious
| sort -_time` }
    ],
    expected_spl: `index=sysmon sourcetype="XmlWinEventLog:Microsoft-Windows-Sysmon/Operational" EventCode=1 process_name=powershell.exe
| rex field=cmdline "-enc\\s+(?P<b64_payload>\\S+)"
| eval is_suspicious=if(isnotnull(b64_payload),"YES","NO")
| table _time user process_name b64_payload is_suspicious
| sort -_time`,
    soc_mindset: 'PowerShell -enc (EncodedCommand) is one of the most common obfuscation techniques. Attackers encode payloads in Base64 to bypass keyword-based detection. When you see -enc, always decode the payload and pivot to what it does.',
    mitre_explanation: 'T1059.001 (PowerShell) + T1027 (Obfuscated Files or Information). The -enc flag is a direct indicator. Decode the Base64 and look for download cradles, reverse shells, or credential theft commands.',
  },

  // ─────────────────────────────────────────────
  // MISSION 05 — Medium | lookup + table
  // ─────────────────────────────────────────────
  {
    id: '05',
    type: 'SPL_Technical',
    difficulty: 'Medium',
    title: 'Threat Intel Match: IOC Correlation',
    threat_type: 'Command and Control',
    mitre: { tactic: 'TA0011 - Command and Control', technique: 'T1071 - Application Layer Protocol' },
    context: {
      description: 'Your threat intel team has provided a lookup table of known malicious IPs (threat_intel_ip). You need to correlate your network firewall logs against this threat intelligence to identify any internal hosts communicating with known bad IPs.',
      index: 'network',
      sourcetype: 'cisco:asa',
      env: { lookup_table: 'threat_intel_ip', match_field: 'dest_ip', intel_fields: 'threat_type, confidence, description' }
    },
    task: 'Search network firewall logs and use lookup to enrich each event with threat intelligence from the "threat_intel_ip" table (matching on dest_ip = ip). Filter to only show events where a threat_type was matched (i.e., the lookup returned a value). Display src_ip, dest_ip, threat_type, confidence, description, and action.',
    required_commands: ['lookup', 'search', 'where', 'table'],
    hints: [
      { level: 1, label: 'Direction', text: 'The lookup command joins your events with a static table. Syntax: | lookup tablename match_field AS event_field. After lookup, use where isnotnull(threat_type) to keep only events that had a match. Think of it like a LEFT JOIN in SQL, then filtering for matched rows.' },
      { level: 2, label: 'Syntax', text: 'index=network | lookup threat_intel_ip ip AS dest_ip OUTPUT threat_type confidence description\n| where isnotnull(threat_type)\n| table src_ip dest_ip threat_type confidence description action' },
      { level: 3, label: 'Answer', text: `index=network sourcetype="cisco:asa"
| lookup threat_intel_ip ip AS dest_ip OUTPUT threat_type confidence description source
| where isnotnull(threat_type)
| table _time src_ip dest_ip action threat_type confidence description
| sort -_time` }
    ],
    expected_spl: `index=network sourcetype="cisco:asa"
| lookup threat_intel_ip ip AS dest_ip OUTPUT threat_type confidence description source
| where isnotnull(threat_type)
| table _time src_ip dest_ip action threat_type confidence description
| sort -_time`,
    soc_mindset: 'IOC matching is the fastest way to confirm a true positive. A hit against threat intel means someone already identified this IP as malicious. Your job is to answer: which internal host hit it, how often, and what was transferred? That is your incident scope.',
    mitre_explanation: 'C2 communication (T1071) is often beacon traffic — regular, small packets to the same external IP. Combined with a threat intel hit, this becomes a Tier 1 escalation immediately.',
  },

  // ─────────────────────────────────────────────
  // MISSION 06 — Medium | transaction
  // ─────────────────────────────────────────────
  {
    id: '06',
    type: 'SPL_Technical',
    difficulty: 'Medium',
    title: 'Session Reconstruction: Group Login Events',
    threat_type: 'Lateral Movement',
    mitre: { tactic: 'TA0008 - Lateral Movement', technique: 'T1021.001 - Remote Desktop Protocol' },
    context: {
      description: 'Authentication logs contain individual events. To understand attacker sessions, you need to group related events (failures followed by success) from the same src_ip into a single transaction to measure session duration and event sequence.',
      index: 'wineventlog',
      sourcetype: 'WinEventLog:Security',
      env: { transaction_fields: 'src_ip, user', maxspan: '10m', EventCodes: '4624, 4625' }
    },
    task: 'Use the transaction command to group authentication events (EventCode 4624 and 4625) by src_ip and user. Set maxspan=10m. Display src_ip, user, duration, eventcount, and the list of EventCodes seen in each transaction. Filter to only show transactions with more than 3 events.',
    required_commands: ['transaction', 'eval', 'where', 'table'],
    hints: [
      { level: 1, label: 'Direction', text: 'transaction groups events that share field values within a time window. Fields after the command are the grouping keys. maxspan sets the max time window. After transaction, you get duration and eventcount as automatic fields. Use mvexpand or list to see all EventCodes per session.' },
      { level: 2, label: 'Syntax', text: 'index=wineventlog (EventCode=4624 OR EventCode=4625)\n| transaction src_ip user maxspan=10m\n| where eventcount > 3\n| eval event_list=mvjoin(EventCode,",")\n| table src_ip user duration eventcount event_list' },
      { level: 3, label: 'Answer', text: `index=wineventlog sourcetype="WinEventLog:Security" (EventCode=4624 OR EventCode=4625)
| transaction src_ip user maxspan=10m
| where eventcount > 3
| eval event_list=mvjoin(EventCode,",")
| table _time src_ip user duration eventcount event_list
| sort -eventcount` }
    ],
    expected_spl: `index=wineventlog sourcetype="WinEventLog:Security" (EventCode=4624 OR EventCode=4625)
| transaction src_ip user maxspan=10m
| where eventcount > 3
| eval event_list=mvjoin(EventCode,",")
| table _time src_ip user duration eventcount event_list
| sort -eventcount`,
    soc_mindset: 'transaction is powerful for timeline reconstruction. A session with 6x 4625 followed by 1x 4624 tells a clear story: brute force succeeded. The duration field tells you how fast the attacker worked. Short duration + high count = automated tool.',
    mitre_explanation: 'T1021.001 (RDP) lateral movement often shows LogonType=10 for success after many LogonType=3 failures. transaction helps you see the full attack sequence as one cohesive event.',
  },

  // ─────────────────────────────────────────────
  // MISSION 07 — Medium | timechart + bin
  // ─────────────────────────────────────────────
  {
    id: '07',
    type: 'SPL_Technical',
    difficulty: 'Medium',
    title: 'Visualize the Attack: Login Spike Detection',
    threat_type: 'Brute Force',
    mitre: { tactic: 'TA0006 - Credential Access', technique: 'T1110 - Brute Force' },
    context: {
      description: 'You want to visualize authentication event volume over time to identify spikes that correspond to brute force activity. Time-based visualization is a key SOC skill for spotting anomalies in event rate.',
      index: 'wineventlog',
      sourcetype: 'WinEventLog:Security',
      env: { time_bucket: '15m', split_by: 'EventCode' }
    },
    task: 'Create a timechart of authentication event counts split by EventCode (4624 and 4625), using 15-minute time buckets. This shows you visually when attack peaks occurred. Also write a separate query using bin to manually bucket events into 30-minute windows and count events per window.',
    required_commands: ['timechart', 'bin', 'stats'],
    hints: [
      { level: 1, label: 'Direction', text: 'timechart is the go-to command for time-series visualization. It implicitly uses _time as the X axis. The span parameter controls bucket size. The "by" clause splits lines. bin is the manual equivalent — you bucket _time yourself, then use stats count.' },
      { level: 2, label: 'Syntax', text: 'timechart: index=wineventlog (EventCode=4624 OR EventCode=4625) | timechart span=15m count by EventCode\n\nbin approach: index=wineventlog (EventCode=4624 OR EventCode=4625) | bin _time span=30m | stats count by _time EventCode' },
      { level: 3, label: 'Answer', text: `index=wineventlog sourcetype="WinEventLog:Security" (EventCode=4624 OR EventCode=4625)
| timechart span=15m count by EventCode` }
    ],
    expected_spl: `index=wineventlog sourcetype="WinEventLog:Security" (EventCode=4624 OR EventCode=4625)
| timechart span=15m count by EventCode`,
    soc_mindset: 'A spike in 4625 events with a sudden 4624 immediately after is a visual fingerprint of brute force success. Normal environments have a baseline — learn yours. Any deviation 3x above baseline during off-hours is an immediate investigation trigger.',
    mitre_explanation: 'Time-based analysis helps distinguish automated attack tools (rapid, uniform intervals) from human activity (irregular timing). Cobalt Strike and Metasploit have characteristic beacon intervals visible in timechart.',
  },

  // ─────────────────────────────────────────────
  // MISSION 08 — Medium | eventstats + eval case
  // ─────────────────────────────────────────────
  {
    id: '08',
    type: 'SPL_Technical',
    difficulty: 'Medium',
    title: 'Risk Scoring: Flag High-Volume Attackers',
    threat_type: 'Credential Access',
    mitre: { tactic: 'TA0006 - Credential Access', technique: 'T1110.003 - Password Spraying' },
    context: {
      description: 'You want to assign a risk tier to each authentication event based on how many total failures that source IP has generated. eventstats lets you attach aggregate statistics back onto individual events without collapsing them.',
      index: 'wineventlog',
      sourcetype: 'WinEventLog:Security',
      env: { risk_thresholds: 'Low:<5, Medium:5-20, High:>20', base_event: 'EventCode=4625' }
    },
    task: 'For all failed login events (EventCode=4625), use eventstats to calculate the total count of failures per src_ip (as "total_failures") and attach it to each event. Then use eval with case to create a "risk_tier" field: "Low" if total_failures < 5, "Medium" if 5-20, "High" if > 20. Display src_ip, user, total_failures, risk_tier.',
    required_commands: ['eventstats', 'eval', 'table', 'sort'],
    hints: [
      { level: 1, label: 'Direction', text: 'eventstats is like stats but keeps all original events intact — it adds a new column to every row. After eventstats count AS total_failures by src_ip, every event from that src_ip will have total_failures populated. Then eval+case lets you create multi-branch conditional logic.' },
      { level: 2, label: 'Syntax', text: '| eventstats count AS total_failures by src_ip\n| eval risk_tier=case(total_failures<5,"Low", total_failures<=20,"Medium", total_failures>20,"High")\n| dedup src_ip\n| table src_ip total_failures risk_tier' },
      { level: 3, label: 'Answer', text: `index=wineventlog sourcetype="WinEventLog:Security" EventCode=4625
| eventstats count AS total_failures by src_ip
| eval risk_tier=case(total_failures<5,"Low",total_failures<=20,"Medium",total_failures>20,"High")
| dedup src_ip
| table src_ip total_failures risk_tier
| sort -total_failures` }
    ],
    expected_spl: `index=wineventlog sourcetype="WinEventLog:Security" EventCode=4625
| eventstats count AS total_failures by src_ip
| eval risk_tier=case(total_failures<5,"Low",total_failures<=20,"Medium",total_failures>20,"High")
| dedup src_ip
| table src_ip total_failures risk_tier
| sort -total_failures`,
    soc_mindset: 'Risk tiering turns raw data into actionable triage priority. High tier IPs go to Tier 2 immediately. This approach mirrors how Splunk ES Risk Framework works — accumulating scores per entity over time to surface the most dangerous actors.',
    mitre_explanation: 'T1110.003 Password Spraying — one password across many accounts to avoid lockout — shows as medium count per src_ip against many different users. eventstats lets you score the src_ip as a whole entity, not just individual events.',
  },

  // ─────────────────────────────────────────────
  // MISSION 09 — Medium | makemv + mvexpand + values
  // ─────────────────────────────────────────────
  {
    id: '09',
    type: 'SPL_Technical',
    difficulty: 'Medium',
    title: 'DNS Tunneling: Analyse Multi-Value Query Patterns',
    threat_type: 'Exfiltration / C2',
    mitre: { tactic: 'TA0011 - C2', technique: 'T1071.004 - DNS' },
    context: {
      description: 'DNS tunneling encodes data into subdomain labels. To detect it, you need to aggregate all DNS queries per src_ip into a multi-value field and analyze patterns — query length, query count, and unique domains.',
      index: 'dns',
      sourcetype: 'stream:dns',
      env: { suspicious_domain: 'tunnel-c2.xyz', query_type: 'TXT', threshold_queries: '5' }
    },
    task: 'From DNS logs, use stats with values() to collect all queries per src_ip into a multi-value field "all_queries". Use mvcount to count how many unique queries each IP made. Use eval+len on a sample query to measure average query length. Filter for IPs with more than 5 queries. Also show the list of unique domains queried.',
    required_commands: ['stats', 'values', 'eval', 'where', 'table'],
    hints: [
      { level: 1, label: 'Direction', text: 'stats values(query) AS all_queries BY src_ip collects all query strings into a multi-value field. mvcount(all_queries) gives the count. To analyze the queries further, you can use mvexpand to explode them back into individual rows, or use eval with mvindex to sample one.' },
      { level: 2, label: 'Syntax', text: 'index=dns\n| stats values(query) AS all_queries dc(query) AS unique_queries by src_ip\n| eval query_count=mvcount(all_queries)\n| where query_count > 5\n| table src_ip query_count unique_queries all_queries' },
      { level: 3, label: 'Answer', text: `index=dns sourcetype="stream:dns"
| stats values(query) AS all_queries dc(query) AS unique_queries count AS total_queries by src_ip
| eval query_count=mvcount(all_queries)
| where query_count > 5
| eval sample_query=mvindex(all_queries,0)
| eval sample_length=len(sample_query)
| table src_ip total_queries unique_queries sample_length all_queries
| sort -total_queries` }
    ],
    expected_spl: `index=dns sourcetype="stream:dns"
| stats values(query) AS all_queries dc(query) AS unique_queries count AS total_queries by src_ip
| eval query_count=mvcount(all_queries)
| where query_count > 5
| eval sample_query=mvindex(all_queries,0)
| eval sample_length=len(sample_query)
| table src_ip total_queries unique_queries sample_length all_queries
| sort -total_queries`,
    soc_mindset: 'DNS tunneling indicators: (1) High query volume to one domain, (2) Very long subdomain labels (>50 chars) with random-looking Base64, (3) Mostly TXT record queries. Normal DNS has short, human-readable subdomains. If the subdomain looks like it was randomly generated — it probably was.',
    mitre_explanation: 'T1071.004 DNS — attackers use DNS because it is rarely blocked at the perimeter. Tools like dnscat2 and iodine create full TCP tunnels over DNS. Detection requires baselining normal query lengths and flagging statistical outliers.',
  },

  // ─────────────────────────────────────────────
  // MISSION 10 — Hard | tstats + cidrmatch
  // ─────────────────────────────────────────────
  {
    id: '10',
    type: 'SPL_Technical',
    difficulty: 'Hard',
    title: 'Data Model Speed: Subnet-Scoped Auth Query',
    threat_type: 'Lateral Movement',
    mitre: { tactic: 'TA0008 - Lateral Movement', technique: 'T1021 - Remote Services' },
    context: {
      description: 'Production environments have millions of events. Direct index searches are too slow for dashboards. tstats queries accelerated Data Models (tsidx files) instead of raw events — typically 10-100x faster. You need to use tstats to query Authentication data and then filter by subnet using eval+cidrmatch.',
      index: 'wineventlog',
      sourcetype: 'WinEventLog:Security',
      env: { data_model: 'Authentication', internal_subnet: '10.0.0.0/8', server_subnet: '192.168.100.0/24' }
    },
    task: 'Use tstats to query the Authentication data model and retrieve count of events grouped by Authentication.src, Authentication.dest, Authentication.user, Authentication.action. Then use eval+cidrmatch to filter: only keep rows where src is in 10.0.0.0/8 AND dest is in 192.168.100.0/24. Sort by count descending.',
    required_commands: ['tstats', 'eval', 'where'],
    hints: [
      { level: 1, label: 'Direction', text: 'tstats syntax: | tstats count FROM datamodel=Authentication WHERE ... BY Authentication.src Authentication.dest. Field names must include the data model node prefix (Authentication.). After tstats, field names keep the prefix — use rename or reference them with the prefix in eval. cidrmatch("subnet", field) returns true/false.' },
      { level: 2, label: 'Syntax', text: '| tstats count FROM datamodel=Authentication BY Authentication.src Authentication.dest Authentication.user Authentication.action\n| eval src_internal=cidrmatch("10.0.0.0/8",\'Authentication.src\')\n| eval dest_server=cidrmatch("192.168.100.0/24",\'Authentication.dest\')\n| where src_internal=1 AND dest_server=1' },
      { level: 3, label: 'Answer', text: `| tstats count FROM datamodel=Authentication BY Authentication.src Authentication.dest Authentication.user Authentication.action
| rename Authentication.src AS src Authentication.dest AS dest Authentication.user AS user Authentication.action AS action
| eval src_internal=cidrmatch("10.0.0.0/8",src)
| eval dest_server=cidrmatch("192.168.100.0/24",dest)
| where src_internal=1 AND dest_server=1
| table src dest user action count
| sort -count` }
    ],
    expected_spl: `| tstats count FROM datamodel=Authentication BY Authentication.src Authentication.dest Authentication.user Authentication.action
| rename Authentication.src AS src Authentication.dest AS dest Authentication.user AS user Authentication.action AS action
| eval src_internal=cidrmatch("10.0.0.0/8",src)
| eval dest_server=cidrmatch("192.168.100.0/24",dest)
| where src_internal=1 AND dest_server=1
| table src dest user action count
| sort -count`,
    soc_mindset: 'In a real SOC with 100M+ events/day, tstats is not optional — it is required. If your dashboard runs a raw search against index=* for the last 24 hours, you will be waiting 5 minutes per refresh. tstats makes the same query run in seconds. Learn the Data Model field mappings (CIM).',
    mitre_explanation: 'Querying by subnet pair (internal→server) is a lateral movement detection pattern. T1021 covers all remote service abuse. Filtering to server_subnet isolates high-value target activity from normal workstation-to-workstation noise.',
  },

  // ─────────────────────────────────────────────
  // MISSION 11 — Hard | streamstats
  // ─────────────────────────────────────────────
  {
    id: '11',
    type: 'SPL_Technical',
    difficulty: 'Hard',
    title: 'Sliding Window: Detect Brute Force → Success Pattern',
    threat_type: 'Credential Access → Initial Access',
    mitre: { tactic: 'TA0006 - Credential Access', technique: 'T1110 - Brute Force' },
    context: {
      description: 'You need to detect the exact pattern: 5+ failed logins (4625) from the same src_ip followed by a successful login (4624) within a 10-minute window. This requires streamstats to maintain a running count that resets per attacker context.',
      index: 'wineventlog',
      sourcetype: 'WinEventLog:Security',
      env: { window: '10m', failure_threshold: '5', EventCode_fail: '4625', EventCode_success: '4624' }
    },
    task: 'Write a SPL query that: (1) Gets all 4624 and 4625 events, (2) Creates a binary field is_failure=1 for 4625 events, (3) Uses streamstats with window=10 current=f to count failures per src_ip, (4) Filters to rows where the event is a 4624 (success) AND the preceding failure count >= 5. This identifies brute force that succeeded.',
    required_commands: ['streamstats', 'eval', 'where', 'table'],
    hints: [
      { level: 1, label: 'Direction', text: 'streamstats processes events in time order and computes running statistics. window=N means "look at the last N events". current=f means "exclude the current event from the window" — important here so the success event itself is not counted as a failure. sort by _time first, then partition by src_ip using the "by" clause.' },
      { level: 2, label: 'Syntax', text: '| sort _time\n| eval is_failure=if(EventCode="4625",1,0)\n| streamstats sum(is_failure) AS failure_count window=10 current=f by src_ip\n| where EventCode="4624" AND failure_count >= 5\n| table _time src_ip user failure_count' },
      { level: 3, label: 'Answer', text: `index=wineventlog sourcetype="WinEventLog:Security" (EventCode=4624 OR EventCode=4625)
| sort 0 _time
| eval is_failure=if(EventCode="4625",1,0)
| streamstats sum(is_failure) AS failure_count window=10 current=f by src_ip
| where EventCode="4624" AND failure_count >= 5
| table _time src_ip dest_ip user failure_count
| sort -failure_count` }
    ],
    expected_spl: `index=wineventlog sourcetype="WinEventLog:Security" (EventCode=4624 OR EventCode=4625)
| sort 0 _time
| eval is_failure=if(EventCode="4625",1,0)
| streamstats sum(is_failure) AS failure_count window=10 current=f by src_ip
| where EventCode="4624" AND failure_count >= 5
| table _time src_ip dest_ip user failure_count
| sort -failure_count`,
    soc_mindset: 'This exact pattern — failures then success from same IP — is one of the most reliable brute force indicators. The critical insight is current=f: you want to count failures BEFORE the success event, not including it. Missing this parameter is a common mistake that gives wrong counts.',
    mitre_explanation: 'This query is essentially a correlation rule — the same logic Splunk ES uses internally for its "Brute Force Access Behavior Detected" correlation search. Understanding streamstats means you can write custom detections that ES does not have out of the box.',
  },

  // ─────────────────────────────────────────────
  // MISSION 12 — Hard | join + append
  // ─────────────────────────────────────────────
  {
    id: '12',
    type: 'SPL_Technical',
    difficulty: 'Hard',
    title: 'Multi-Source Pivot: Full Attack Chain Correlation',
    threat_type: 'Full Kill Chain',
    mitre: { tactic: 'Multiple', technique: 'T1078 + T1059.001 + T1041' },
    context: {
      description: 'The full picture of the incident requires correlating across three data sources: Windows auth logs (who logged in), Sysmon logs (what processes ran), and proxy logs (what external connections were made). You need to join and append these sources around the attacker account.',
      index: 'multiple',
      sourcetype: 'multiple',
      env: { pivot_user: 'svc_backup', pivot_host: 'WIN-DC01', join_field: 'user' }
    },
    task: 'Build a multi-source correlation query: (1) Use a subsearch with join to enrich Sysmon process creation events with the user\'s authentication events from wineventlog. (2) Use append to add proxy log entries for the same user. The goal is a unified timeline of: auth event → process creation → external connection. Pivot on user=svc_backup.',
    required_commands: ['join', 'append', 'table', 'sort'],
    hints: [
      { level: 1, label: 'Direction', text: 'join in Splunk is expensive — use it sparingly and always on small result sets. The syntax is: | join [type=left] field [subsearch]. append adds rows from a subsearch to your current results. Think of join as "add columns" and append as "add rows". For a timeline, append is often better.' },
      { level: 2, label: 'Syntax', text: 'Approach with append:\n(index=sysmon EventCode=1 user=svc_backup | eval source="Sysmon" | table _time source user process_name cmdline)\n| append [search index=wineventlog EventCode=4624 user=svc_backup | eval source="Auth" | table _time source user dest_ip]\n| append [search index=proxy user=svc_backup | eval source="Proxy" | table _time source user url]\n| sort _time' },
      { level: 3, label: 'Answer', text: `(index=sysmon sourcetype="XmlWinEventLog:Microsoft-Windows-Sysmon/Operational" EventCode=1 user=svc_backup
| eval source="Process" | eval detail=process_name." | ".cmdline
| table _time source user detail)
| append [search index=wineventlog sourcetype="WinEventLog:Security" (EventCode=4624 OR EventCode=4625) user=svc_backup
| eval source="Auth-".EventCode | eval detail="LogonType:".LogonType." dest:".dest_ip
| table _time source user detail]
| append [search index=proxy user=svc_backup
| eval source="Proxy" | eval detail=http_method." ".url." (".bytes_out." bytes out)"
| table _time source user detail]
| sort 0 _time` }
    ],
    expected_spl: `(index=sysmon sourcetype="XmlWinEventLog:Microsoft-Windows-Sysmon/Operational" EventCode=1 user=svc_backup
| eval source="Process" | eval detail=process_name." | ".cmdline
| table _time source user detail)
| append [search index=wineventlog sourcetype="WinEventLog:Security" (EventCode=4624 OR EventCode=4625) user=svc_backup
| eval source="Auth-".EventCode | eval detail="LogonType:".LogonType." dest:".dest_ip
| table _time source user detail]
| append [search index=proxy user=svc_backup
| eval source="Proxy" | eval detail=http_method." ".url." (".bytes_out." bytes out)"
| table _time source user detail]
| sort 0 _time`,
    soc_mindset: 'Multi-source correlation is what separates Tier 1 triage from Tier 2 investigation. A single data source gives you an alert. Multiple correlated sources give you an attack story. When writing an incident report, you need this unified timeline to establish timeline of compromise.',
    mitre_explanation: 'This query surfaces the full kill chain: T1078 (Valid Accounts) → T1059.001 (PowerShell) → T1041 (Exfiltration over C2). Each data source covers a different phase. Correlating them proves attacker continuity across the chain.',
  },

  // ─────────────────────────────────────────────
  // MISSION 13 — ES Concept | Notable Events
  // ─────────────────────────────────────────────
  {
    id: '13',
    type: 'ES_Concept',
    difficulty: 'Medium',
    title: 'ES Workflow: Notable Event Disposition',
    threat_type: 'Incident Triage',
    mitre: null,
    context: {
      description: 'You are a SOC L1 analyst working in Splunk Enterprise Security Incident Review. A Notable Event "Brute Force Access Behavior Detected" has fired. After investigation, you find that the source IP belongs to an authorized penetration testing team that was conducting a scheduled red team exercise. No actual compromise occurred. What disposition should you assign?',
    },
    task: 'A Notable Event fired for brute force activity. After investigation, you confirmed it was an authorized pen test — no actual attack, no actual compromise. Which disposition is MOST appropriate, and why are the other options incorrect?',
    mcq: [
      { key: 'A', text: 'True Positive — because the brute force activity genuinely occurred in the logs.' },
      { key: 'B', text: 'False Positive — because the alert fired for activity that was expected and authorized, not a real threat.' },
      { key: 'C', text: 'Benign Positive — because the activity was real and detected correctly, but it was authorized and not malicious.' },
      { key: 'D', text: 'False Negative — because the alert should not have fired at all for authorized activity.' },
    ],
    correct_answer: 'C',
    hints: [
      { level: 1, label: 'Direction', text: 'Think about what each disposition means: True Positive = real attack, real detection. False Positive = no real activity, alert fired incorrectly. Benign Positive = real activity correctly detected, but activity was authorized/harmless. False Negative = real attack, alert missed it.' },
      { level: 2, label: 'Key Distinction', text: 'The key question is: did the detection logic work correctly? Yes — brute force really happened. Was it a threat? No — it was authorized. That combination = Benign Positive. False Positive would mean the logs were wrong or the detection was triggered by completely unrelated activity.' },
      { level: 3, label: 'Answer', text: 'C — Benign Positive. The activity occurred, the detection fired correctly, but the activity was authorized. False Positive implies the detection was wrong. True Positive implies a real threat. Benign Positive is specifically for "correctly detected, but not malicious."' }
    ],
    explanation: 'Benign Positive is the correct disposition. The brute force activity was real (logs confirm it), the correlation search detected it correctly (the detection worked), but the context makes it non-malicious (authorized pen test). False Positive would be used if the alert fired due to a bug in the detection logic or completely unrelated, benign activity misclassified. A common mistake is labeling all "no harm done" events as False Positives — but that conflates detection accuracy with threat severity.',
    soc_mindset: 'Disposition accuracy is critical for SOC metrics. If you label everything not-a-real-attack as False Positive, your MTTD and detection quality stats become meaningless. Benign Positive tells your detection engineering team: the rule works, but consider adding an exclusion for authorized pen test IPs.',
  },

  // ─────────────────────────────────────────────
  // MISSION 14 — ES Concept | Adaptive Response
  // ─────────────────────────────────────────────
  {
    id: '14',
    type: 'ES_Concept',
    difficulty: 'Medium',
    title: 'ES Framework: Adaptive Response Actions',
    threat_type: 'Incident Response Automation',
    mitre: null,
    context: {
      description: 'A Notable Event for "Malware - Known Bad Hash Detected" has fired in Splunk Enterprise Security. The analyst wants to immediately run an automated investigation action to gather more context about the affected host without leaving the Incident Review interface. Which ES feature enables this capability?',
    },
    task: 'An analyst wants to trigger an automated host isolation or context-gathering action directly from a Notable Event in Splunk ES Incident Review, integrating with an external EDR tool. Which feature provides this capability?',
    mcq: [
      { key: 'A', text: 'Asset and Identity Framework — it enriches events with host ownership and priority information.' },
      { key: 'B', text: 'Threat Intelligence Framework — it correlates the hash against known IOC feeds automatically.' },
      { key: 'C', text: 'Adaptive Response — it provides a mechanism to run preconfigured actions within Splunk or integrate with external tools from within an investigation.' },
      { key: 'D', text: 'Risk Framework — it scores the host based on the event severity and accumulates risk over time.' },
    ],
    correct_answer: 'C',
    hints: [
      { level: 1, label: 'Direction', text: 'The question asks about triggering an ACTION from within Incident Review — not enrichment, not scoring, not intel correlation. Which framework is specifically about taking action (isolate, notify, query) in response to an event?' },
      { level: 2, label: 'Key Feature', text: 'Adaptive Response Actions (ARAs) are configured per correlation search or manually triggered from Notable Events. They can: run a script, send a notification, query an external API (e.g., CrowdStrike, Carbon Black), create a ticket in ServiceNow, or run another Splunk search.' },
      { level: 3, label: 'Answer', text: 'C — Adaptive Response. It is specifically designed for automated and manual response actions triggered from Notable Events. Asset & Identity (A) does enrichment. Threat Intel (B) does IOC matching. Risk (D) does scoring. Only Adaptive Response does action execution.' }
    ],
    explanation: 'Adaptive Response is the ES framework for executing actions in response to security events. It decouples detection (correlation searches) from response (what to do when detected). Preconfigured response actions can include: running a saved search, sending alerts to SIEM, querying an external REST API, isolating a host through an EDR integration, or creating a ServiceNow ticket. This is different from Asset & Identity (which enriches who/what), Threat Intelligence (which enriches IOC context), and Risk Framework (which scores entities over time).',
    soc_mindset: 'In a mature SOC, Adaptive Response reduces MTTR (Mean Time to Respond) by automating repetitive investigative steps. Instead of manually opening CrowdStrike, searching for the host, and checking isolation status, an ARA does it in one click from Incident Review. Know your playbooks and which ARAs are configured for which alert types.',
  },

  // ─────────────────────────────────────────────
  // MISSION 15 — ES Concept | Risk + Annotations + MITRE
  // ─────────────────────────────────────────────
  {
    id: '15',
    type: 'ES_Concept',
    difficulty: 'Hard',
    title: 'ES Advanced: Risk Framework + MITRE Annotations',
    threat_type: 'Threat Detection Framework',
    mitre: null,
    context: {
      description: 'Your security team wants to: (1) Ensure that correlation searches that fire on the same host multiple times accumulate a risk score for that host over 24 hours, rather than generating dozens of individual Notable Events. (2) Map every correlation search result to the MITRE ATT&CK framework so analysts can see which tactic/technique the alert represents. Which two ES features address these requirements respectively?',
    },
    task: 'Match the two requirements to the correct ES features: (1) Accumulate risk scores per entity over time instead of individual alerts. (2) Map correlation search results to MITRE ATT&CK tactics and techniques.',
    mcq: [
      { key: 'A', text: '(1) Notable Event suppression + (2) Threat Intelligence Framework' },
      { key: 'B', text: '(1) Risk Framework with Risk Rules + (2) Annotations' },
      { key: 'C', text: '(1) Adaptive Response + (2) Asset and Identity Framework' },
      { key: 'D', text: '(1) Risk Framework with Risk Rules + (2) Threat Intelligence Framework' },
    ],
    correct_answer: 'B',
    hints: [
      { level: 1, label: 'Direction', text: 'Break the question into two independent parts. For (1): which ES feature is specifically about accumulating scores per host/user over time instead of firing individual events? For (2): which feature allows you to tag a correlation search with a specific MITRE ATT&CK tactic and technique?' },
      { level: 2, label: 'Key Features', text: '(1) Risk Framework: Risk Rules define how much risk score each correlation search adds to a Risk Object (host, user, IP). Risk Notable events fire when the accumulated score crosses a threshold — reducing alert fatigue. (2) Annotations: Configuration within a correlation search that maps it to MITRE ATT&CK, CIS Controls, or Kill Chain stages.' },
      { level: 3, label: 'Answer', text: 'B — Risk Framework with Risk Rules handles score accumulation per entity. Annotations handle the MITRE ATT&CK framework mapping. Threat Intelligence (A, D) is about IOC matching, not framework mapping. Notable Event suppression (A) silences alerts, not accumulates scores. Asset & Identity (C) does enrichment.' }
    ],
    explanation: 'Risk Framework: Instead of every correlation search creating a Notable Event, Risk Rules add points to a Risk Object (a host, user, or IP). Only when the total risk score exceeds a threshold does a "Risk Notable" fire — dramatically reducing alert fatigue while maintaining detection coverage. Annotations: Each correlation search in ES can be tagged with cybersecurity framework mappings (MITRE ATT&CK tactic+technique, CIS Controls, Cyber Kill Chain phase). This is configured in the correlation search editor and appears in Incident Review, helping analysts immediately understand the attack context without external lookups.',
    soc_mindset: 'Risk-based alerting is the future of SOC operations. Instead of "this one event is suspicious," it asks "has this host been doing 10 suspicious things over 24 hours?" That accumulated risk picture is much harder for attackers to hide from and much easier for analysts to triage. Combined with MITRE annotations, every alert tells you what phase of the attack it represents.',
  },
]
