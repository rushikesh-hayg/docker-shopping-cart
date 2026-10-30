# Task 07: Jenkins Installation, Configuration & Freestyle CI Archive Job

## 1. Objective & Scope
Automates build verification and artifact packaging upon code commits:
* Deploy and configure an enterprise Jenkins LTS automation controller.
* Establish secure SCM integration with GitHub repository branch develop.
* Implement a Freestyle CI project to automate packaging and artifact archiving.
* Enforce automated build status reporting and artifact retention.

---

## 2. Jenkins Controller Architecture & Setup
* Engine: Jenkins 2.x LTS (Containerized / Host service)
* Access URL: http://localhost:8080
* Plugins Installed:
  * Git Plugin (SCM polling and checkout)
  * Pipeline & Workspace Cleanup Plugin
  * Credentials Binding Plugin
  * JUnit & TestNG Results Plugin

---

## 3. Freestyle CI Job Specification: shopping-cart-ci-build
* Job Name: shopping-cart-ci-build
* Job Type: Freestyle Project
* SCM: Git
  * Repository: https://github.com/rushikesh-hayg/docker-shopping-cart.git
  * Target Branch: */develop
* Build Commands:
  node --check backend/src/server.js
  tar -czvf shopping-cart-build.tar.gz frontend/ backend/ .env.example package.json
* Archive Artifacts: shopping-cart-build.tar.gz

---

## 4. Build Execution Trace
Started by user admin
Running as SYSTEM
Building in workspace /var/jenkins_home/workspace/shopping-cart-ci-build
Checking out Revision (origin/develop)
+ node --check backend/src/server.js
+ tar -czvf shopping-cart-build.tar.gz frontend/ backend/ .env.example package.json
Archiving artifacts: shopping-cart-build.tar.gz saved.
Finished: SUCCESS

---

## 5. Verification Sign-off
* SCM Checkout: PASS
* Node Syntax Check: PASS
* Build Packaging: PASS
* Artifact Retention: PASS