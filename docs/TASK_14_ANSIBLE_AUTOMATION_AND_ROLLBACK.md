# Task 14: Ansible Configuration Management & Zero-Downtime Rollback

## 1. Scope
Automated server provisioning, application deployment, and zero-downtime rollback using Ansible playbooks.

## 2. Playbooks Inventory
* inventory.ini: Defines target deployment hosts.
* setup_server.yml: Installs Docker, Nginx, and host prerequisites.
* deploy_app.yml: Deploys newest release container.
* rollback.yml: Reverts to previous stable container tag on deployment failure.
