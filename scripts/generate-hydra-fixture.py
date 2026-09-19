"""Generate synthetic contract data using Hydra's actual Python serializers.

Usage: python scripts/generate-hydra-fixture.py /path/to/hydra
Audited revision: dc15beba5b789a55f192f654cb00f8e27e6b1e26.
No network requests, scans or database writes. Only stdlib dependencies are needed.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(sys.argv[1]).resolve()))
from core.assets import Confidence, Finding, Host, HttpService, Port, RiskLevel
from core.intel.serialize import serialize_relationship

observed = "2026-09-19T10:00:00.123456+00:00"
run_id = "demo-contract-run"
host = Host(domain="api.example.com", ips=["192.0.2.10"],
            confidence=Confidence.LOW, confidence_score=40,
            risk_level=RiskLevel.HIGH, risk_score=75,
            dns_resolved=True, dns_wildcard=True, soft_404_detected=True,
            discovery_sources=["dnsx", "httpx", "security_headers"],
            risk_reasons=["Synthetic example: review the observed configuration."],
            first_seen=observed, last_seen=observed, scan_timestamp=observed)
host.http_services = [HttpService(url="https://api.example.com", host=host.domain, status_code=200, title="Example API")]
host.ports = [Port(host=host.domain, port=443, service="https")]
host.findings = [Finding(host=host.domain, template_id="missing-security-header", severity="medium",
                        name="Example missing security header", source="security_headers",
                        url="https://api.example.com", description="Synthetic observation; verification is not included.",
                        confidence_score=40)]
other = Host(domain="example.com", confidence=Confidence.UNKNOWN,
             first_seen=observed, last_seen=observed, scan_timestamp=observed)
relationship = serialize_relationship(
    {"relationship_id": "demo-relationship", "source_entity": "domain:api.example.com",
     "target_entity": "ip_address:192.0.2.10", "relationship_type": "RESOLVES_TO",
     "confidence": "HIGH", "strength": "dns_record", "evidence_id": "demo-evidence"},
    evidence={"evidence_id": "demo-evidence", "reason": "DNS_RESOLUTION", "source": "dnsx_records.jsonl",
              "collector": "dnsx", "observed_at": observed},
    source_entity={"scope_status": "IN_SCOPE", "collection_status": "COLLECTED"},
    run_id=run_id, explanation="Synthetic DNS observation linking this host and address.")
payload = {"run_id": run_id, "host_count": 2, "alive_count": 1,
           "hosts": [host.to_dict(), other.to_dict()], "clusters": [], "graph": {"nodes": [], "edges": []},
           "intelligence": {"relationships": [relationship]}}
destination = Path(__file__).resolve().parents[1] / "packages/ui/src/fixtures/hydra-assets.json"
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(destination)
