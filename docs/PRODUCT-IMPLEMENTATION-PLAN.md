# MarineAegis merged implementation blueprint

## Source of truth

This plan merges the detailed MarineAegis PRD with the final-year project/demo brief. The detailed PRD defines the complete product requirements. The demo brief defines the practical MVP flow and presentation priorities.

Project decisions override technology recommendations in either document:

- Frontend: React, Vite and Tailwind CSS
- Backend: Node.js, Express and Socket.IO
- Database: MongoDB with Mongoose (no PostgreSQL or TimescaleDB)
- IoT: simulated ESP32/MPU6050 until physical hardware is connected
- Detection: explainable deterministic multi-sensor scoring first; trained ML is added only with a labelled simulated dataset and evaluation results

## Required end-to-end flow

Authentication -> vessel scope -> voyage simulator -> GPS/AIS/MPU6050 telemetry -> GhostTrace -> confidence -> explanation -> alert -> incident -> digital-twin proposal -> human decision -> audit -> replay -> report.

No module is considered complete when it exists only as a page, button, route name, model or static value.

## Delivery phases

1. Foundation: authentication, RBAC, vessel scope, audit integrity. **Implemented.**
2. Telemetry: append-only history, current state, secure ingestion, realtime updates. **Implemented.**
3. GhostTrace foundation: dead reckoning, AIS/gyro/speed/MPU6050 comparison, confidence and explanations. **Implemented as deterministic MVP; trained ML pending.**
4. Main demo simulation: start/stop voyage, spoof injection, independent true/AIS position, simulated LED/buzzer. **Implemented for the GPS-spoofing MVP.**
5. Navigation visualization: route, expected position, GPS, AIS and discrepancy markers. **MVP implemented; multi-waypoint routes remain.**
6. Human response: trusted-position override, safe mode, approve/reject and false-positive workflow. **Implemented for GhostTrace.**
7. Navigation digital twin: simulate corrective action before approval. **Implemented for trusted-position correction.**
8. Incident replay and PDF/JSON reports. **Implemented with stored timeline events, legacy evidence reconstruction and downloadable backend-generated reports.**
9. EdgeArmor and device inventory. **Implemented for mock and physical telemetry contracts: registry, heartbeat monitor, explainable health/risk scoring, anomaly alerts and guarded quarantine/release.**
10. NetGuard DNS/network defense. **Deterministic MVP implemented: authenticated event ingestion, threat indicators, DNS sinkhole decisions, review/whitelist, default-deny segmentation, satellite-policy failover, alerts and audit. OS-level DNS/SD-WAN adapters remain deployment work.**
11. AgentWatch attack-sequence detection. **Onboard deterministic MVP implemented: append-only event stream, four-stage timing correlation, MITRE mapping, explainability/confidence, HIGH-confidence source isolation, analyst review and confirmed fleet-pattern sharing. Trained shore ML remains Phase 17.**
12. FleetChoke supplier/device risk. **MongoDB dependency-graph MVP implemented: supplier/asset/firmware inventory, EdgeArmor auto-sync, CVE + field-anomaly risk, weighted blast radius, fleet alerts, interactive dependency map and stored what-if scenarios. Neo4j/GNN remains an optional scale-out implementation.**
13. SARVerify distress authentication. **Deterministic offline-capable MVP implemented: GMDSS/DSC/AIS-EPIRB ingestion contract, local MMSI and weather caches, five-dimension weighted trust scoring, auto-accept/navigation dispatch, bridge/ROC review, likely-hoax alert/incident response and full audit evidence. External GMDSS hardware and fleet-intelligence synchronization remain deployment work.**
14. ROCShield remote-command integrity. **Deterministic offline-capable MVP implemented: inline interception, nonce/timestamp replay protection, six-dimension weighted risk scoring, per-operator behavioral baselines, role authority, low-risk execution, medium-risk queue, high-risk blocking/alerts/incidents, authenticator MFA supervisor decisions, immutable audit history and repeated-command Safe Mode. Trained XGBoost and physical control-bus adapter remain Phase 17/deployment work.**
15. RecoveryShield ransomware detection and recovery simulation. **Offline-capable MongoDB prototype implemented: scheduled/manual AES-256-GCM snapshots, application WORM locks, SHA-256 integrity, three-signal ransomware detection, automatic sync shutdown/device quarantine/satellite failover, rollback preview, authorized restore, reconnect/sign-off, audit timeline and PDF incident report. Production MinIO S3 Object Lock remains deployment work.**
16. Unified threat intelligence, fleet learning and compliance evidence. **MongoDB MVP implemented: eight normalized indicator types, SHA-256 deduplication, privacy-safe extracted vectors, immediate high-risk sharing, reconnect synchronization, versioned fleet rule packs, measured precision/recall activation gates, per-vessel deployment/rollback, seven IACS UR E26 evidence report types, scoped JSON/PDF export and application-WORM hashes. Actual ML retraining remains Phase 17; production MinIO Object Lock remains deployment work.**
17. ML training/evaluation service and labelled simulated datasets. **Implemented in two layers: an always-available Node supervised baseline plus a private Python FastAPI service with GhostTrace Isolation Forest + LSTM, EdgeArmor One-Class SVM + autoencoder, AgentWatch sequence classifier and ROCShield XGBoost. Includes reproducible minimum-100-sample labelled simulation, held-out evaluation, metrics/confusion matrices, artifact and dataset hashes, model cards, secured backend-to-ML calls, MongoDB registry, deployment gates, per-vessel distribution/rollback and deterministic fallback. Real labelled maritime trials are still required before production performance claims.**
18. Performance, security, end-to-end and demonstration testing. **Repository-level hardening implemented: request IDs, structured request logs, API rate limiting, dangerous Mongo/prototype key rejection, CSP/HSTS headers, readiness checks, bounded HTTP/detection latency metrics, secured Prometheus export, dependency health, local performance regression tests, 32 backend tests, targeted frontend lint/build gates, Python ML tests, Docker health checks and GitHub Actions security/quality workflow. External Grafana/Loki/Tempo/AlertManager, Keycloak/Vault/mTLS, full Playwright browser coverage and production load/penetration testing remain deployment work.**

Physical ESP32 firmware, LEDs and buzzer replace the mock adapter later without changing the telemetry or GhostTrace API contract.
