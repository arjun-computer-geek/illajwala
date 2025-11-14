# Local Development Environment

This guide walks through the tooling you need for Illajwala development and how to launch the shared infrastructure stack required by the apps and services.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or any Docker Engine ≥ 24)
- [PNPM](https://pnpm.io/installation) 9.x (repo uses a `.npmrc` to enforce)
- Node.js 20 LTS

Optional but recommended:

- [MongoDB Compass](https://www.mongodb.com/products/tools/compass) for inspecting the dev database
- [Redis Insight](https://redis.com/redis-enterprise/redis-insight/) for Redis debugging

## 1. Start the infrastructure stack

From the repository root:

```powershell
cd infra
docker compose up -d
```

The stack provisions:

- **MongoDB** at `mongodb://root:root@localhost:27017/` with replica set `rs0`
- **Redis** at `redis://localhost:6379`
- **Mailhog** SMTP at `localhost:1025` with web UI at `http://localhost:8025`
- **Identity service API** at `http://localhost:4000/api`
- **Patient web** at `http://localhost:3000`
- **Doctor hub** at `http://localhost:3001`
- **Admin console** at `http://localhost:3002`

> The replica set is enabled so that services relying on Mongo change streams can be added later without reconfiguring the environment. If you only need a standalone instance, remove the `--replSet` flag in `infra/docker-compose.yml`.

### Initialise the Mongo replica set (first run only)

```powershell
docker exec -it illajwala-mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{ _id: 0, host: 'illajwala-mongodb:27017' }]})"
```

This command is idempotent—rerunning it will no-op once the replica set is online.

### Verify services

```powershell
docker compose ps
```

All containers should report `healthy`. Mailhog’s UI is reachable at <http://localhost:8025>, and MongoDB should respond to `mongosh --eval "db.runCommand({ ping: 1 })"`.

## 2. Configure environment variables

Copy the sample environment for each service/app you plan to run. Example for the identity service:

```powershell
cd services/identity-service
copy env.sample .env
```

Update the sample `.env` to include Docker credentials and permitted frontend origins:

```
MONGODB_URI=mongodb://root:root@localhost:27017/illajwala_dev?replicaSet=rs0
CLIENT_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

The frontend apps read `NEXT_PUBLIC_API_BASE_URL`; point it at your locally running identity service or gateway.

## 3. Install dependencies & run apps

Install all packages from the repo root:

```powershell
pnpm install
```

Start the services/apps you need (in separate terminals):

```powershell
pnpm dev:identity    # Express API on http://localhost:4000
pnpm --filter @illajwala/patient dev   # Next.js app on http://localhost:3000
pnpm --filter @illajwala/doctor dev    # Next.js app on http://localhost:3001
pnpm --filter @illajwala/admin dev     # Next.js app on http://localhost:3002
```

The repo-level `pnpm dev` script will run every workspace in parallel; prefer the scoped commands during early development to keep logs readable.

## 4. Shutdown & cleanup

To stop the infrastructure stack:

```powershell
docker compose down
```

To wipe all persistence volumes (this deletes Mongo and Redis data):

```powershell
docker compose down -v
```

## 5. Development Utilities

### Database Management

```powershell
# Seed database with sample data
pnpm db:seed

# Reset database (WARNING: deletes all data)
pnpm db:reset

# Run clinic migration
cd services/identity-service
pnpm migrate:clinics
```

### Environment Validation

```powershell
# Validate environment setup
pnpm validate:env
```

This checks that:
- Required environment variables are configured
- Docker services are accessible
- Database connections are valid

## 6. Troubleshooting

### MongoDB Replica Set Not Initialized

If you see errors about replica sets:

```powershell
docker exec -it illajwala-mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{ _id: 0, host: 'illajwala-mongodb:27017' }]})"
```

### Port Conflicts

If ports are already in use:

```powershell
# Find process using port (Windows)
netstat -ano | findstr :3000

# Kill process
taskkill /PID [pid] /F
```

### Reset Everything

To start fresh:

```powershell
# Stop and remove containers with volumes
cd infra
docker compose down -v

# Restart
docker compose up -d

# Reinitialize replica set
docker exec -it illajwala-mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{ _id: 0, host: 'illajwala-mongodb:27017' }]})"

# Reseed database
cd ../services/identity-service
pnpm seed
```

---

For more detailed information, see [Development Guide](./DEVELOPMENT.md) and [Contributing Guide](./CONTRIBUTING.md).

