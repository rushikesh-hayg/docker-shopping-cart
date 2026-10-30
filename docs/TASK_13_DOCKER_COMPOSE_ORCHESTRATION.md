# Task 13: Multi-Container Orchestration with Docker Compose

## 1. Scope
Coordinating the full 3-tier application (Nginx, Node.js, SQLite) using docker-compose.yml.

## 2. Services Topology
* frontend: Nginx container exposing port 80/3000, proxying /api to backend.
* backend: Node.js container on internal port 5000 with healthcheck probes.
* database: SQLite persistence via volume mount ./backend/data:/app/data.
* network: Bridge network 'app-network' providing internal DNS discovery.
