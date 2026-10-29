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

---

## 2. Technology Evaluations & Architectural Decisions

### Evaluation 1: Database Engine (SQLite3 vs. PostgreSQL / MySQL)
| Metric | SQLite3 (Chosen) | PostgreSQL / MySQL | Decision Rationale |
|---|---|---|---|
| **Resource Overhead** | Minimal (< 5 MB RAM) | Heavy (150 MB - 500 MB RAM base) | SQLite runs inside the backend container process without requiring a separate database daemon. |
| **Setup & Dependencies** | Zero-configuration single file | Requires network setup, user grants, TCP ports | Perfect for portable single-command Docker provisioning (`docker run` / Compose)[cite: 1, 2, 3]. |
| **Concurrency & ACID** | Full ACID transactions with file-level locking | Row-level locking for enterprise scale | For our frozen MVP checkout volume, SQLite transactions are fully ACID-compliant and sufficient[cite: 1, 3]. |

### Evaluation 2: Reverse Proxy & Static Server (Nginx vs. Apache Tomcat)
| Metric | Nginx (Chosen) | Apache Tomcat | Decision Rationale |
|---|---|---|---|
| **Primary Design Intent** | High-concurrency reverse proxy & static asset server | Java Servlet & JSP Container (.war applications) | Tomcat carries 250 MB+ JVM overhead and is tailored for Java WAR files. Our app is lightweight Node.js/JS. |
| **API Path Forwarding** | Native `proxy_pass` directive for `/api/` routing | Complex XML connector configuration | Nginx enables same-origin access (`http://localhost/api/*`), completely eliminating CORS pre-flight latency. |
| **Memory Footprint** | ~15 MB container image layer | ~250 MB JVM runtime footprint[cite: 3] | Nginx aligns with our Task 1 KPI of keeping containers minimal and performant[cite: 1]. |

---
## 3. Database Schema & Data Dictionary

### Table 1: `products`
Stores merchandise catalog items available for checkout:
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  stock INTEGER NOT NULL,
  category TEXT NOT NULL
);

### Table 2: `orders`
Stores completed checkout transactions:
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'PROCESSING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

---

## 4. REST API Specification

| HTTP Method | Endpoint URI | Description | Success Code | Error Code |
|---|---|---|---|---|
| `GET` | `/api/health` | Service liveness probe & SQLite connectivity check | `200 OK` | `500 Server Error` |
| `GET` | `/api/products` | Retrieve catalog with optional query `?search=<term>` | `200 OK` | `500 Server Error` |
| `POST` | `/api/checkout` | Process order payload and atomically decrement stock | `201 Created` | `400 Bad Request` |
| `GET` | `/api/dashboard/stats` | Aggregate order counts, gross revenue, and low stock items | `200 OK` | `500 Server Error` |

---

## 5. Local Environment Baseline & Dependency Tree
* **Runtime**: Node.js 20 LTS
* **Express**: Fast, unopinionated minimalist web framework
* **CORS**: Cross-origin middleware for local development convenience
* **dotenv**: Zero-dependency environment variable parser
* **sqlite3**: Asynchronous, non-blocking SQLite3 bindings
* **Environment Configuration**: Managed via root `.env.example` and local `.env`



