# Development Guide

This guide covers development workflows, best practices, and common tasks for the Illajwala platform.

## Table of Contents

- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Database Management](#database-management)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [Testing](#testing)
- [Debugging](#debugging)
- [Common Tasks](#common-tasks)

## Local Development

### Starting the Development Environment

1. **Start Infrastructure:**
   ```bash
   cd infra
   docker compose up -d
   ```

2. **Initialize MongoDB Replica Set:**
   ```bash
   docker exec -it illajwala-mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{ _id: 0, host: 'illajwala-mongodb:27017' }]})"
   ```

3. **Seed Database:**
   ```bash
   cd services/identity-service
   pnpm seed
   ```

4. **Start Services:**
   ```bash
   # From repo root
   pnpm dev:identity    # Backend API
   pnpm dev:patient    # Patient app
   pnpm dev:doctor     # Doctor app
   pnpm dev:admin      # Admin app
   ```

### Development URLs

- Patient App: http://localhost:3000
- Doctor App: http://localhost:3001
- Admin App: http://localhost:3002
- API: http://localhost:4000/api
- Mailhog UI: http://localhost:8025

## Environment Variables

### Identity Service

Copy `services/identity-service/env.sample` to `.env`:

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://root:root@localhost:27017/illajwala_dev?replicaSet=rs0
JWT_SECRET=your-secret-key
REFRESH_JWT_SECRET=your-refresh-secret
REDIS_URL=redis://localhost:6379
CLIENT_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

### Frontend Apps

Each frontend app needs `NEXT_PUBLIC_API_BASE_URL` pointing to the API:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

## Database Management

### Seeding Data

```bash
cd services/identity-service
pnpm seed
```

This creates:
- Sample clinics
- Sample doctors
- Sample patient (arjun.patel@example.com / patient123)
- Sample admin (ops@illajwala.com / admin123)
- Sample appointments

### Resetting Database

```bash
# Stop containers and remove volumes
cd infra
docker compose down -v

# Restart and reinitialize
docker compose up -d
docker exec -it illajwala-mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{ _id: 0, host: 'illajwala-mongodb:27017' }]})"

# Reseed
cd ../services/identity-service
pnpm seed
```

### Database Access

- **MongoDB Compass:** Connect to `mongodb://root:root@localhost:27017/`
- **MongoDB Shell:**
  ```bash
  docker exec -it illajwala-mongodb mongosh -u root -p root
  ```

## API Development

### Adding New Endpoints

1. Create route handler in `services/identity-service/src/modules/[module]/[module].routes.ts`
2. Register route in `services/identity-service/src/modules/routes/index.ts`
3. Add validation using Zod schemas
4. Implement service logic
5. Add error handling

### API Structure

```
GET    /api/[resource]           # List resources
GET    /api/[resource]/:id       # Get resource
POST   /api/[resource]           # Create resource
PUT    /api/[resource]/:id       # Update resource
DELETE /api/[resource]/:id       # Delete resource
```

### Authentication

- Use `requireAuth` middleware for protected routes
- Use `requireTenantId` middleware for tenant-scoped routes
- JWT tokens include tenant context

## Frontend Development

### Adding New Pages

1. Create page in `apps/[app]/src/app/[route]/page.tsx`
2. Add navigation links if needed
3. Implement data fetching with React Query
4. Add loading and error states

### Adding Components

1. Create component in `apps/[app]/src/components/`
2. Use shared UI components from `packages/ui`
3. Follow existing component patterns
4. Add TypeScript types

### State Management

- **Server State:** React Query (`useQuery`, `useMutation`)
- **Client State:** React hooks (`useState`, `useReducer`)
- **Form State:** React Hook Form

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @illajwala/identity-service test
```

### Writing Tests

- Unit tests for utilities and helpers
- Integration tests for API endpoints
- Component tests for UI components

## Debugging

### Backend Debugging

- Use `console.log` for development (remove before commit)
- Check logs in terminal where service is running
- Use MongoDB Compass to inspect database
- Use Redis Insight to inspect cache

### Frontend Debugging

- Use React DevTools
- Check browser console
- Use Next.js dev tools
- Check network tab for API calls

### Common Issues

**MongoDB Connection Failed:**
- Ensure Docker containers are running
- Check MongoDB replica set is initialized
- Verify connection string in `.env`

**Redis Connection Failed:**
- Ensure Redis container is running
- Check `REDIS_URL` in `.env`

**CORS Errors:**
- Verify `CLIENT_ORIGINS` includes your frontend URL
- Check API middleware configuration

## Common Tasks

### Adding a New Feature

1. Create feature branch
2. Implement backend changes (if needed)
3. Implement frontend changes
4. Update documentation
5. Test locally
6. Commit and push

### Database Migrations

1. Create migration script in `services/identity-service/src/scripts/`
2. Test migration on local database
3. Document migration steps
4. Run migration script

### Updating Dependencies

```bash
# Update all dependencies
pnpm update

# Update specific package
pnpm update [package-name]

# Check for outdated packages
pnpm outdated
```

## Troubleshooting

### Port Already in Use

If a port is already in use:

```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID [pid] /F
```

### Docker Issues

```bash
# Reset Docker containers
cd infra
docker compose down -v
docker compose up -d
```

### Build Errors

```bash
# Clean build artifacts
pnpm clean

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Rebuild
pnpm build
```

## Best Practices

1. **Code Quality:**
   - Run linter before committing
   - Format code with Prettier
   - Fix TypeScript errors

2. **Git Workflow:**
   - Create feature branches
   - Write clear commit messages
   - Keep commits focused

3. **Documentation:**
   - Update docs when adding features
   - Add comments for complex logic
   - Document API changes

4. **Performance:**
   - Optimize database queries
   - Use caching where appropriate
   - Lazy load heavy components

5. **Security:**
   - Never commit secrets
   - Validate all inputs
   - Use parameterized queries

