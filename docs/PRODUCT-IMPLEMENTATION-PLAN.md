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
8. Incident replay and PDF/JSON reports.
9. EdgeArmor and device inventory.
10. NetGuard DNS/network defense.
11. AgentWatch attack-sequence detection.
12. FleetChoke supplier/device risk.
13. SARVerify distress authentication.
14. ROCShield remote-command integrity.
15. RecoveryShield ransomware detection and recovery simulation.
16. Unified threat intelligence, fleet learning and compliance evidence.
17. ML training/evaluation service and labelled simulated datasets.
18. Performance, security, end-to-end and demonstration testing.

Physical ESP32 firmware, LEDs and buzzer replace the mock adapter later without changing the telemetry or GhostTrace API contract.
