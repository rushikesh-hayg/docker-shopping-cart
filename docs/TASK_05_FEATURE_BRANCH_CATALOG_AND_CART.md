# Task 05: Feature Development with Branching (Catalog & Cart)

## 1. Feature Objective & Scope

Under Sprint 1 (GitFlow Execution), this task implements the core storefront shopping experience on an isolated feature branch:
* **Branch Name**: `feature/task-05-catalog-cart`
* **Target Base Branch**: `develop`
* **Deliverables**:
  1. Product catalog rendering with keyword search and category filtering.
  2. Client-side shopping cart state management with real-time tax and total calculations.
  3. Git branch lifecycle trace: branch creation, feature commit, remote push, and pull request merge.

---

## 2. API & Component Implementation

### 1. Catalog API Endpoint (`GET /api/products`)
* **Controller**: `backend/src/controllers/productController.js`
* **Query Parameters**: `?search=<keyword>`
* **Database Query**:
  SELECT * FROM products WHERE name LIKE ? OR category LIKE ?;
* **Sample JSON Response**:
  [
    {
      "id": 1,
      "name": "DevOps Engineered Hoodie",
      "description": "Premium fleece hoodie with embroidered DevOps infinity loop.",
      "price": 49.99,
      "stock": 25,
      "category": "Apparel"
    }
  ]

### 2. Cart Calculation & State Logic (`frontend/app.js`)
* **State Array**: `let cart = [];`
* **Mathematical Formula**:
  * Subtotal = Sum of (item.price * item.quantity)
  * Tax = Subtotal * 0.05 (Fixed 5% Sales Tax)
  * Grand Total = Subtotal + Tax
* **Inventory Guard**: Prevents shoppers from incrementing cart quantities beyond available database stock.

---

## 3. GitFlow Execution Trace

The exact Git commands executed to adhere to team repository governance:

# 1. Create and switch to feature branch
git checkout -b feature/task-05-catalog-cart

# 2. Stage and commit feature additions
git add frontend/ backend/
git commit -m "feat(catalog-cart): implement product catalog search and dynamic cart state"

# 3. Push feature branch to GitHub remote
git push -u origin feature/task-05-catalog-cart

# 4. Integrate back into develop branch
git checkout develop
git merge feature/task-05-catalog-cart --no-ff -m "merge: incorporate feature/task-05-catalog-cart into develop"
git push origin develop

---

## 4. Verification & Acceptance Sign-off

| Acceptance Criteria | Expected Outcome | Verification Status |
|---|---|---|
| **Catalog API** | `GET /api/products` returns 200 with catalog array | PASS |
| **Catalog Search** | Querying `?search=Docker` filters items dynamically | PASS |
| **Cart Quantity** | Updating item count recalculates subtotal, 5% tax, and total | PASS |
| **Zero Count Removal** | Reducing count below 1 purges item from cart | PASS |
| **Branch Trace** | Merge commit present in `git log --graph` | PASS |
