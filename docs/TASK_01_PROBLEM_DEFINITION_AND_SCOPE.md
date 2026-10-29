# Task 01: Problem Definition, Stakeholder Analysis & Approved MVP Scope

## 1. Project Title
**Dockerized Shopping Cart and Checkout Application**

---

## 2. Problem Statement & Real-Time Operational Need
Modern e-commerce platforms experience volatile traffic patterns, with extreme traffic spikes during sales and promotional checkout periods. In traditional bare-metal or monolithic virtual machine (VM) architectures, running shopping cart and checkout services causes severe operational challenges[cite: 1]:
* **Environment Inconsistency:** Discrepancies between local developer machines (macOS/Windows) and Linux test/production servers result in runtime errors ("it works on my machine" syndrome)[cite: 1].
* **Resource Inefficiency:** Traditional VMs waste significant memory and compute by duplicating guest operating systems for simple web services[cite: 1].
* **Slow Disaster Recovery:** Manual server provisioning, configuration drift, and lack of self-healing containers make recovering from runtime failures slow, leading to cart abandonment and revenue loss[cite: 1].

### The DevOps Solution
Containerizing the application using **Docker**, managing services with **Docker Compose**, automating testing and builds with **Jenkins**, and enforcing configuration consistency through **Ansible** ensures immutable, portable, and self-healing deployments across all environments[cite: 1, 2, 7, 13].

---

## 3. Existing Pain Points Analysis
| # | Pain Point | Description & Impact |
|---|---|---|
| 1 | **Environment Drift** | Mismatches in Node.js versions, SQLite binaries, or OS packages lead to unexpected production failures[cite: 1]. |
| 2 | **Manual Setup Overhead** | New developers take hours manually installing runtimes, databases, and dependencies[cite: 1]. |
| 3 | **Deployment Downtime** | Updating payment/cart logic manually risks taking down the entire web store[cite: 1]. |
| 4 | **Lack of Quality Gates** | Unvetted commits with syntax or calculation bugs reach live servers without automated regression tests[cite: 2, 10]. |
| 5 | **Manual Recovery** | Service failures require manual engineer intervention via SSH rather than automated self-healing[cite: 1]. |

---

## 4. Stakeholder & Target User Matrix
| Stakeholder / User | Category | Primary Focus & Value |
|---|---|---|
| **Online Shoppers** | End-User | Sub-second page loads, persistent cart contents across page reloads, and fast, error-free checkout[cite: 1]. |
| **Application Developers** | Internal | Ability to boot the entire multi-tier stack locally in seconds using a single command (`docker compose up`)[cite: 1]. |
| **QA / Test Engineers** | Internal | Clean, disposable test container environments running automated Selenium test suites per commit[cite: 1, 9]. |
| **DevOps / SRE Team** | Internal | Automated CI/CD pipelines, container health monitoring, idempotent server provisioning, and automated rollback[cite: 1, 14]. |
| **Store Management** | Business | Maximized store uptime, zero lost sales due to deployment crashes, and minimized cloud compute costs[cite: 1]. |

---

## 5. Objectives & Measurable Success Criteria (KPIs)
To ensure objective engineering evaluation, the project must meet the following concrete benchmarks:
* **Setup Speed:** Spin up the complete application stack from scratch in **under 120 seconds**[cite: 1].
* **Container Image Size:** Keep the backend production image under **100 MB** (achieved ~84.3 MB using multi-stage Alpine build)[cite: 1, 11].
* **Test Reliability:** 100% automated pass rate across core Selenium user journeys (Search, Cart mutations, Checkout) before code deployment[cite: 2, 9, 10].
* **Configuration Idempotency:** Running the Ansible provisioning script a second time must report `changed=0, failed=0` (zero drift)[cite: 13, 14].
* **Disaster Recovery (MTTR):** Automated rollback from a broken container image to the previous stable release in **under 10 seconds**[cite: 1, 14].

---

## 6. System & Operational Constraints
* **Zero Infrastructure Budget:** The entire solution must run locally or on open-source, free-tier platforms (Docker, Jenkins LTS, SQLite, GitHub, Docker Hub)[cite: 1, 4, 7, 12].
* **Security & PCI-DSS Scope:** Payment processing is simulated/mocked for MVP safety—no real credit cards or financial credentials will be accepted or stored[cite: 1].
* **Secret Management:** No API keys, tokens, or credentials may be hardcoded into Dockerfiles or pushed to public Git repositories[cite: 1].
* **Scope Freeze:** Strictly constrained to the 15-task baseline to prevent feature creep[cite: 1].

---

## 7. Approved & Frozen 15-Task MVP Scope

### In-Scope (Committed Deliverables)[cite: 1]:
* Product catalog listing with search/filter capabilities[cite: 1, 3].
* Dynamic in-memory and persistent shopping cart updates[cite: 1, 3].
* Simulated checkout endpoint with atomic inventory deduction and Order ID generation[cite: 1, 3, 6].
* Admin dashboard reporting real-time revenue, order counts, and low-stock alerts[cite: 1, 3, 6].
* Automated Git branching (`main`, `develop`, feature branches, semantic tagging `v1.0.0-mvp`)[cite: 4, 5, 6].
* Multi-stage Docker containerization with non-root security and health checks[cite: 1, 11].
* Jenkins CI/CD pipeline with Selenium quality gates and Docker Hub registry push[cite: 1, 10, 12].
* Ansible configuration playbooks with verified idempotency and automated rollback[cite: 13, 14].

### Out-of-Scope (Excluded from MVP)[cite: 1]:
* Live third-party payment gateways (Stripe/Razorpay live credit card billing)[cite: 1].
* Multi-factor user authentication (OAuth, SMS OTP, password resets)[cite: 1].
* Multi-cluster Kubernetes orchestration (Mesh, Istio)[cite: 1].
* Post-checkout shipping logistics and carrier APIs[cite: 1].