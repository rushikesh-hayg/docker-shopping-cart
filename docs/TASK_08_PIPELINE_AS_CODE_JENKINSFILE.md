# Task 08: Pipeline as Code (Jenkinsfile) & Nginx Automated Deployment

## 1. Scope
Transition from Freestyle CI to version-controlled Declarative Pipeline as Code using Jenkinsfile.

## 2. Pipeline Stages
1. Checkout SCM: Clones origin/develop
2. Lint & Validate: node --check backend/src/server.js
3. Build & Package: Generates shopping-cart-build.tar.gz
4. Deploy to Web Server: Syncs frontend assets to Nginx web root (/var/www/html)

## 3. Jenkinsfile Execution Trace
[Pipeline] stage: Checkout SCM -> SUCCESS
[Pipeline] stage: Lint & Validate -> SUCCESS
[Pipeline] stage: Build & Package -> SUCCESS
[Pipeline] stage: Deploy to Web Server -> SUCCESS
Finished: SUCCESS