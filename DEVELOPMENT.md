# Development Guide

## Quick Start - Development Mode with Hot-Reload

### Prerequisites
- Docker and Docker Compose installed
- Ollama running locally (optional, for better AI responses)

### Starting Development Environment

1. **Navigate to the project root:**
   ```bash
   cd qabot
   ```

2. **Start development containers:**
   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3005
   - Backend API: http://localhost:8000

### How It Works

The development setup uses:
- **Volume mounts**: Your local code is mounted into the containers
- **Hot-reload**: Next.js Fast Refresh automatically updates the UI
- **Auto-reload**: FastAPI/Uvicorn automatically restarts on code changes

### Making Changes

1. **Edit your code** in your local editor
2. **Save the file**
3. **See changes instantly** - no rebuild needed!

### When to Rebuild

You only need to rebuild (`--build` flag) when:
- Adding new npm packages (client)
- Adding new Python packages (server)
- Changing Dockerfile configuration
- First time setup

### Common Commands

```bash
# Start development environment
docker compose -f docker-compose.dev.yml up

# Start in background (detached mode)
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# View logs for specific service
docker compose -f docker-compose.dev.yml logs -f client
docker compose -f docker-compose.dev.yml logs -f server

# Stop containers
docker compose -f docker-compose.dev.yml down

# Restart containers (if changes aren't reflecting)
docker compose -f docker-compose.dev.yml restart

# Rebuild and restart
docker compose -f docker-compose.dev.yml up --build
```

### Troubleshooting

**Changes not reflecting?**
- Make sure you're using `docker-compose.dev.yml` (not the production one)
- Try restarting: `docker compose -f docker-compose.dev.yml restart`
- Check logs: `docker compose -f docker-compose.dev.yml logs`

**Port already in use?**
- Stop other services using ports 3005 or 8000
- Or modify ports in `docker-compose.dev.yml`

**Node modules issues?**
- The container uses its own node_modules (mounted as anonymous volume)
- If you need to reinstall: `docker compose -f docker-compose.dev.yml exec client npm install`

**Python dependencies issues?**
- Rebuild the server: `docker compose -f docker-compose.dev.yml build server`
- Or exec into container: `docker compose -f docker-compose.dev.yml exec server pip install -r requirements.txt`

### File Structure

```
qabot/
├── docker-compose.yml          # Production configuration
├── docker-compose.dev.yml      # Development configuration (with volumes)
├── client/
│   ├── Dockerfile              # Production Dockerfile
│   ├── Dockerfile.dev          # Development Dockerfile (hot-reload)
│   └── ...
└── server/
    ├── Dockerfile              # Production Dockerfile
    ├── Dockerfile.dev          # Development Dockerfile (auto-reload)
    └── ...
```

### Switching Between Dev and Production

**Development (hot-reload):**
```bash
docker compose -f docker-compose.dev.yml up
```

**Production:**
```bash
docker compose up
```
