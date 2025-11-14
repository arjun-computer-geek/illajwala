# Illajwala Infrastructure

This directory contains Docker Compose configuration for local development.

## Quick Start

1. **Start all services:**

   ```bash
   cd infra
   docker compose up -d
   ```

2. **Check service status:**

   ```bash
   docker compose ps
   ```

3. **View logs:**

   ```bash
   docker compose logs -f [service-name]
   ```

4. **Stop all services:**

   ```bash
   docker compose down
   ```

5. **Stop and remove volumes (clean slate):**
   ```bash
   docker compose down -v
   ```

## Services

### MongoDB

- **Port:** 27017
- **Connection String:** `mongodb://root:root@localhost:27017/illajwala?authSource=admin`
- **Health Check:** Automatic ping every 10 seconds
- **Replica Set:** Configured as `rs0` (required for transactions)

**Initialization:**
After starting MongoDB, initialize the replica set:

```bash
docker exec -it illajwala-mongodb mongosh --eval "rs.initiate()"
```

### Redis

- **Port:** 6379
- **Connection String:** `redis://localhost:6379`
- **Health Check:** Automatic ping every 10 seconds
- **Persistence:** Saves every 60 seconds if at least 1 key changed

### Mailhog

- **SMTP Port:** 1025
- **Web UI:** http://localhost:8025
- **Health Check:** HTTP check every 10 seconds

**Usage:**

- Configure your app to send emails to `localhost:1025`
- View all emails in the web UI at http://localhost:8025

## Health Checks

All services include health checks that:

- Run every 10 seconds
- Have a 5-second timeout
- Retry up to 5 times
- Include a start period to allow services to initialize

Check health status:

```bash
docker compose ps
```

Services with `(healthy)` status are ready to use.

## Volumes

Data is persisted in Docker volumes:

- `mongo-data`: MongoDB database files
- `mongo-config`: MongoDB configuration
- `redis-data`: Redis persistence files

To remove all data:

```bash
docker compose down -v
```

## Networks

All services are connected to the `illajwala-dev-network` bridge network, allowing them to communicate using service names.

## Customization

Create a `docker-compose.override.yml` file to customize settings without modifying the main file:

```bash
cp docker-compose.override.yml.example docker-compose.override.yml
# Edit docker-compose.override.yml as needed
```

## Troubleshooting

### MongoDB Replica Set Not Initialized

```bash
docker exec -it illajwala-mongodb mongosh --eval "rs.initiate()"
```

### Services Not Starting

1. Check logs: `docker compose logs [service-name]`
2. Verify ports aren't in use: `netstat -an | grep [port]`
3. Check Docker resources: `docker system df`

### Health Checks Failing

1. Wait for services to fully start (30-60 seconds)
2. Check service logs for errors
3. Verify network connectivity: `docker network inspect illajwala-dev-network`

### Reset Everything

```bash
docker compose down -v
docker compose up -d
# Re-initialize MongoDB replica set
docker exec -it illajwala-mongodb mongosh --eval "rs.initiate()"
```

## Production

⚠️ **This configuration is for local development only.**

For production:

- Use managed services (MongoDB Atlas, Upstash Redis)
- Configure proper authentication
- Set up backups and monitoring
- Use environment-specific configurations
