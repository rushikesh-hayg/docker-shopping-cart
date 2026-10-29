# Task 04: Version Control, Security Rules & Repository Governance

## 1. GitFlow Branching Model & Strategy

The project implements the industry-standard GitFlow branching model to separate stable production releases from continuous feature development:

+---------------------------------------------------------------------------------------+
|                                GITFLOW BRANCHING TOPOLOGY                             |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|   [ main ]  =============================================> Tag: v1.0.0-mvp (PROD)     |
|                   ^                                  ^                                |
|                   |                                  | Merge (Approved PR)            |
|   [ develop ] ----+----------------------------------+--------------------> (STAGING) |
|                     \                              /                                  |
|                      \                            / PR Review & Merge                 |
|   [ feature/* ]       +--> feature/task-05-catalog-cart                               |
|                       +--> feature/task-06-checkout-flow                              |
|                                                                                       |
+---------------------------------------------------------------------------------------+

* `main`: Protected production branch. Direct pushes prohibited. Deploys only via validated release tags.
* `develop`: Active integration branch where feature branches merge after peer review.
* `feature/*`: Short-lived branches dedicated to specific backlog items or user stories.

---

## 2. Conventional Commit Standards

Every commit message follows the formal Conventional Commits v1.0 specification (`<type>(<scope>): <description>`):
* `feat`: A new user-facing functionality (e.g., `feat(cart): add item removal`).
* `fix`: A bug fix or defect correction (e.g., `fix(checkout): resolve stock calculation`).
* `docs`: Documentation additions or revisions (e.g., `docs: add task 4 SCM specs`).
* `ci`: Continuous integration changes (e.g., `ci(jenkins): configure automated test stage`).
* `chore`: Maintenance tasks, dependencies, or `.gitignore` updates (e.g., `chore: update dependencies`).

---

## 3. Security Rules & Secret Protection (`.gitignore` & `.env.example`)

### Security `.gitignore` Baseline
To enforce zero secret leakage and prevent repository bloat, the following patterns are committed:
* `node_modules/`: Large dependency trees installed via package managers.
* `*.db`, `*.sqlite`, `*.sqlite3`: Binary database files with active state.
* `.env`, `.env.local`: Real system secrets, passwords, and private tokens.
* `target/`, `build/`: Temporary build directories from compilers or test runners.
* `.vscode/`, `.DS_Store`: Host-specific IDE and operating system metadata.

### Configuration Template (`.env.example`)
Developers copy this file to `.env` for local configuration without exposing production values:
```bash
NODE_ENV=development
PORT=5000
DB_PATH=./data/shopping_cart.db
APP_URL=http://localhost

