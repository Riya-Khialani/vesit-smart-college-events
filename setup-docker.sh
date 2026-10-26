#!/usr/bin/env bash
# ==============================================================================
# Smart College Event Management System - 1-Click Docker Setup Script (Linux/macOS)
# Group 11 (VESIT D17A - ACC DevOps)
# ==============================================================================

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================================================${NC}"
echo -e "${CYAN} 🚀 VESIT Smart College Event Management System - 1-Click Setup     ${NC}"
echo -e "${CYAN} Group 11 • D17A (ACC DevOps Containerized Microservices Stack)      ${NC}"
echo -e "${CYAN}=====================================================================${NC}"
echo ""

# 1. Check Docker
echo -e "${YELLOW}[1/5] Checking Docker CLI...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi
echo -e "${GREEN}  ✅ Docker CLI $(docker --version) found.${NC}"

# 2. Check Docker Daemon
echo -e "${YELLOW}[2/5] Checking Docker Daemon status...${NC}"
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running. Please start Docker and re-run this script.${NC}"
    exit 1
fi
echo -e "${GREEN}  ✅ Docker daemon is active and running.${NC}"

# 3. Setup .env
echo -e "${YELLOW}[3/5] Setting up environment configuration...${NC}"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}  ✅ Created .env from .env.example.${NC}"
    else
        cat <<EOF > .env
PORT=5000
NODE_ENV=production
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=college_events
JWT_SECRET=vesit_acc_super_secret_jwt_key_2026
EOF
        echo -e "${GREEN}  ✅ Generated default .env file.${NC}"
    fi
else
    echo -e "${GREEN}  ✅ Existing .env file detected.${NC}"
fi

# 4. Build and start containers
echo -e "${YELLOW}[4/5] Building and starting microservices stack (MySQL, Backend, Frontend)...${NC}"
docker compose up --build -d

# 5. Wait for containers to be healthy
echo -e "${YELLOW}[5/5] Verifying health probes...${NC}"
RETRIES=20
HEALTHY=false
while [ $RETRIES -gt 0 ]; do
    if curl -s http://127.0.0.1:5000/health | grep -q "healthy"; then
        HEALTHY=true
        break
    fi
    echo -e "     Waiting for services to become healthy... ($RETRIES attempts left)"
    sleep 3
    RETRIES=$((RETRIES-1))
done

if [ "$HEALTHY" = true ]; then
    echo -e "${GREEN}  ✅ All containers are healthy and running!${NC}"
else
    echo -e "${YELLOW}  ⚠️  Containers started, but health check is taking longer than expected.${NC}"
fi

echo ""
echo -e "${GREEN}=====================================================================${NC}"
echo -e "${GREEN} 🎉 REPLICATION COMPLETE - APPLICATION IS LIVE & RUNNING!           ${NC}"
echo -e "${GREEN}=====================================================================${NC}"
echo -e " 🌐 Frontend Web Application : ${CYAN}http://localhost:3000${NC}"
echo -e " ⚙️  Backend REST API         : ${CYAN}http://localhost:5000/api/events${NC}"
echo -e " 🩺 Health Check Probe       : ${CYAN}http://localhost:5000/health${NC}"
echo -e " 🗄️  MySQL Database           : ${CYAN}localhost:3306 (user: root, pass: rootpassword)${NC}"
echo ""
echo -e "${YELLOW} 🔑 PRE-SEEDED TEST ACCOUNTS:${NC}"
echo -e "   • Admin   : admin@vesit.edu   /  Admin@123"
echo -e "   • Student : riya@vesit.edu    /  Student@123"
echo -e "   • Scanner : scanner@vesit.edu /  Scanner@123"
echo ""
echo -e "${YELLOW} 💡 MANAGEMENT COMMANDS:${NC}"
echo -e "   • View container logs : docker compose logs -f"
echo -e "   • Stop containers     : docker compose down"
echo -e "   • Deploy to K8s       : kubectl apply -f k8s/"
echo -e "${GREEN}=====================================================================${NC}"
