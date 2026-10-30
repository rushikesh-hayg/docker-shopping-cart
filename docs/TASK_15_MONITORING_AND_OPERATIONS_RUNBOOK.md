# Task 15: Monitoring, Health Probes & Operations Runbook

## 1. Scope
Production health monitoring, liveness probes, and standard operating procedures (SOP).

## 2. Health Monitoring
* Probe Endpoint: GET /api/health (Checks API liveness and SQLite file access).
* Telemetry Dashboard: Real-time order metrics, gross revenue, and inventory counters.
* Restart Policy: unless-stopped restart rule for high availability.

## 3. Maintenance Runbook
* Backup Command: cp /app/data/shopping_cart.db /backups/shopping_cart_$(date +%F).db
* Service Restart: docker-compose restart backend