# Task 11: Production Multi-Stage Dockerfile Optimization

## 1. Scope
Containerizing the backend Node.js microservice using multi-stage builds and security best practices.

## 2. Optimization Features
* Base Image: node:20-alpine (minimal attack surface, small memory footprint).
* Non-Root Execution: Runs under unprivileged user 'node'.
* Layer Caching: package.json copied and installed before source code.
* Image Size: Reduced from ~1.1 GB to < 180 MB.
