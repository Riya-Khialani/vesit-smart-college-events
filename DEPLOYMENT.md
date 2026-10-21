# Free Cloud Deployment Guide

This project is architected as a **unified full-stack application**. In production, the Express backend automatically serves the pre-compiled React frontend and handles all `/api/*` REST endpoints on a single port.

---

## Method 1: Instant Live Public HTTPS Link (Active Now)

An instant public HTTPS tunnel is currently running from this machine:

- **Public URL**: [https://spotty-geckos-sneeze.loca.lt](https://spotty-geckos-sneeze.loca.lt)
- **Tunnel Password / Host IP**: `103.120.253.87`

*(When you open the link on any phone or PC for the first time, localtunnel displays a security check asking for the "Tunnel Password". Enter `103.120.253.87` and click Submit. The full app will load instantly with camera QR scanning enabled).*

---

## Method 2: Free Cloud Docker Container Deployment (Render.com)

Render provides a 100% free tier to build and host **real Docker containers** directly from a `Dockerfile`.

### Step 1: Push Repository to GitHub
Create a new repo on [GitHub](https://github.com/new) and push:
```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/vesit-event-management.git
git push -u origin master
```

### Step 2: Deploy Container on Render
1. Open [https://dashboard.render.com](https://dashboard.render.com) (Free account).
2. Click **"New +"** $\rightarrow$ **"Blueprint"** (or **"Web Service"**).
3. Connect your GitHub repository.
4. Render automatically reads [render.yaml](render.yaml):
   - **Environment**: `Docker`
   - **Dockerfile**: `./Dockerfile` (Multi-stage build compiling React + Node Alpine)
   - **Port**: `5000`
5. Click **"Apply"** — Render's cloud engine will build the Docker container image, spin up the container, and provide a permanent free HTTPS URL (e.g. `https://vesit-smart-events.onrender.com`).

---

## Method 3: Free Cloud Docker Container on Koyeb

Koyeb offers free native Docker container hosting:
1. Sign in to [https://app.koyeb.com](https://app.koyeb.com) (Free).
2. Click **"Create App"** $\rightarrow$ **"GitHub"**.
3. Select your repository.
4. Choose **"Dockerfile"** builder (points to `./Dockerfile`).
5. Set port to `5000` and click **"Deploy"**. Koyeb builds and hosts the Docker container in the cloud for free.

---

## Method 4: Local Multi-Container Docker Compose (`docker-compose.yml`)

The project includes a complete microservices architecture in [docker-compose.yml](docker-compose.yml) orchestrating 3 containers:
* `mysql`: MySQL 8.0 with pre-seeded database volume
* `backend`: Node.js Express microservice container
* `frontend`: Nginx Alpine serving the React SPA container

To run it locally on your PC:
1. Open PowerShell as **Administrator** and run:
   ```powershell
   wsl --install
   ```
   *(Restart PC once to finish WSL Linux kernel enablement for Docker Desktop)*.
2. Launch **Docker Desktop** from your start menu.
3. In this directory, run:
   ```bash
   docker-compose up --build
   ```
4. Access:
   - Frontend Web UI (Nginx): `http://localhost:3000`
   - Backend API: `http://localhost:5000`
   - MySQL Database: `localhost:3306`

---

## Method 3: Free Deployment on Koyeb or Railway

If you prefer Koyeb or Railway:
1. Connect your GitHub repository.
2. Set the **Build Command** to:
   ```bash
   npm run deploy:build
   ```
3. Set the **Start Command** to:
   ```bash
   node backend/src/server.js
   ```
4. Set the Port to `5000` (or leave default `$PORT`).
5. Deploy!

---

## Verified Production Seed Accounts

All accounts use authentic bcrypt password verification and cryptographic JWT authentication:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@vesit.edu` | `Admin@123` | Event creation, capacity editing, attendance analytics, registration freeze, CSV export |
| **Gate Scanner** | `scanner@vesit.edu` | `Scanner@123` | Venue gate check-in, duplicate detection, emergency roster search |
| **Student (Riya)** | `riya@vesit.edu` | `Student@123` | Ticket reservations, waitlist queueing, personal pass downloads |
| **Student (Prachi)** | `prachi@vesit.edu` | `Student@123` | Ticket reservations, personal pass downloads |
