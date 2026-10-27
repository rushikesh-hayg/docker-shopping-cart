#!/usr/bin/env bash
# ==============================================================================
# Docker Container Lifecycle Manager
# Automated orchestration for Shopping Cart CI/CD and Local Testing
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ACTION="${1:-help}"
SERVICE="${2:-}"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

function log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

function log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

function log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

function check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker CLI is not installed or not in PATH."
        exit 1
    fi
}

cd "$PROJECT_ROOT"

case "$ACTION" in
    build)
        check_docker
        log_info "Building production multi-stage Docker images..."
        docker compose build --no-cache
        log_success "Build complete. Images created."
        ;;

    up)
        check_docker
        log_info "Starting containers in detached mode with persistent volume..."
        docker compose up -d
        log_info "Waiting for healthcheck probe..."
        sleep 4
        docker compose ps
        log_success "Cluster is up and running."
        ;;

    down)
        check_docker
        log_warn "Stopping and removing containers..."
        docker compose down
        log_success "Services stopped."
        ;;

    stop)
        check_docker
        log_warn "Pausing containers..."
        docker compose stop
        ;;

    restart)
        check_docker
        log_info "Restarting services: ${SERVICE:-all}..."
        docker compose restart ${SERVICE}
        ;;

    logs)
        check_docker
        if [ -n "$SERVICE" ]; then
            docker compose logs -f "$SERVICE"
        else
            docker compose logs -f --tail=100
        fi
        ;;

    inspect)
        check_docker
        log_info "Inspecting cart-backend container telemetry..."
        echo -e "\n${YELLOW}--- HEALTH STATUS ---${NC}"
        docker inspect --format='Name: {{.Name}} | Status: {{.State.Status}} | Health: {{json .State.Health.Status}} | User: {{.Config.User}}' cart-backend || true
        echo -e "\n${YELLOW}--- PERSISTENT VOLUMES ---${NC}"
        docker inspect --format='{{range .Mounts}}Source: {{.Source}} -> Destination: {{.Destination}} (Type: {{.Type}}){{println}}{{end}}' cart-backend || true
        ;;

    health)
        log_info "Probing container health endpoints..."
        if curl -s -f http://localhost:5000/api/health > /dev/null 2>&1; then
            log_success "Backend Health Probe (Port 5000): HEALTHY (HTTP 200)"
            curl -s http://localhost:5000/api/health | jq . 2>/dev/null || curl -s http://localhost:5000/api/health
            echo ""
        else
            log_error "Backend Health Probe (Port 5000) FAILED"
        fi

        if curl -s -f http://localhost/health > /dev/null 2>&1; then
            log_success "Frontend Nginx Reverse Proxy (Port 80): HEALTHY (HTTP 200)"
        else
            log_error "Frontend Nginx Reverse Proxy (Port 80) FAILED"
        fi
        ;;

    reset-db)
        check_docker
        log_warn "Flushing SQLite persistent volume..."
        docker compose down -v
        log_success "Volume cart-db-data deleted. Database will auto-seed on next launch."
        ;;

    clean)
        check_docker
        log_warn "Cleaning all project images, containers, and volumes..."
        docker compose down --rmi all --volumes --remove-orphans
        docker system prune -f
        log_success "Clean completed."
        ;;

    help|*)
        echo "Usage: $0 {build|up|down|stop|restart|logs|inspect|health|reset-db|clean} [service_name]"
        echo "Example: $0 up"
        echo "Example: $0 logs backend"
        ;;
esac
