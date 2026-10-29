# Task 03: Requirements, Architecture, and Technology Setup

## 1. 3-Tier System Architecture Specification

The Dockerized Shopping Cart and Checkout Application follows a decoupled, cloud-native 3-tier architectural pattern:

+---------------------------------------------------------------------------------------+
|                               3-TIER ARCHITECTURE DESIGN                              |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|   1. PRESENTATION TIER (Client Facing)                                                |
|      * Responsive Storefront & Admin Dashboard (HTML5, Vanilla CSS3, ES6 JavaScript)  |
|      * High-performance static web server & Reverse Proxy: Nginx (Port 80)           |
|      * Routes frontend requests: '/' -> Static Web Assets, '/api/*' -> Backend API   |
|                                         |                                             |
|                                         v (Reverse Proxy HTTP :5000)                  |
|                                                                                       |
|   2. APPLICATION TIER (Microservice Logic)                                            |
|      * Runtime Engine: Node.js 20 LTS & Express Framework (Port 5000)                 |
|      * Endpoints: Catalog Search, Cart Calculations, Atomic Checkout & Admin Stats    |
|      * Process Management: Graceful SIGTERM shutdowns, Non-root process execution     |
|                                         |                                             |
|                                         v (Persistent File I/O)                       |
|                                                                                       |
|   3. DATABASE TIER (Data Persistence)                                                 |
|      * Storage Engine: SQLite 3 Engine (zero-network serverless database)             |
|      * Location: /app/data/shopping_cart.db (bound to persistent volume)              |
|      * Capabilities: ACID transaction safety for atomic inventory deductions          |
|                                                                                       |
+---------------------------------------------------------------------------------------+
