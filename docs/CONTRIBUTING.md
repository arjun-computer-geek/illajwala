# Contributing to Illajwala

Thank you for your interest in contributing to the Illajwala platform! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Prerequisites:**
   - Node.js 20 LTS
   - PNPM 9.x
   - Docker Desktop (for local infrastructure)

2. **Initial Setup:**
   ```bash
   # Install dependencies
   pnpm install

   # Start infrastructure (MongoDB, Redis, Mailhog)
   cd infra
   docker compose up -d

   # Initialize MongoDB replica set (first time only)
   docker exec -it illajwala-mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{ _id: 0, host: 'illajwala-mongodb:27017' }]})"

   # Seed the database
   cd ../services/identity-service
   pnpm seed
   ```

3. **Running Services:**
   ```bash
   # Run all services in parallel
   pnpm dev

   # Or run individually
   pnpm dev:identity    # Backend API on http://localhost:4000
   pnpm dev:patient     # Patient app on http://localhost:3000
   pnpm dev:doctor      # Doctor app on http://localhost:3001
   pnpm dev:admin       # Admin app on http://localhost:3002
   ```

## Code Quality Standards

### Pre-commit Hooks

We use Husky and lint-staged to enforce code quality:

- **ESLint:** Automatically fixes linting issues
- **Prettier:** Formats code consistently

These run automatically on commit. If they fail, fix the issues before committing.

### TypeScript

- Use strict TypeScript mode
- Avoid `any` types - use proper types or `unknown`
- Add JSDoc comments for complex functions
- Ensure all functions have proper return types

### Code Style

- Follow existing code patterns
- Use meaningful variable and function names
- Keep functions focused and small
- Add comments for complex logic

### Testing

- Write tests for new features (when test infrastructure is ready)
- Test edge cases and error scenarios
- Ensure tests are deterministic

## Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Write clean, maintainable code
   - Follow the existing architecture patterns
   - Update documentation as needed

3. **Before committing:**
   ```bash
   # Run linter
   pnpm lint

   # Format code
   pnpm format:write

   # Build to check for errors
   pnpm build
   ```

4. **Commit your changes:**
   - Use clear, descriptive commit messages
   - Follow conventional commit format when possible
   - Pre-commit hooks will run automatically

5. **Push and create a PR:**
   - Push your branch
   - Create a pull request with a clear description
   - Reference any related issues

## Project Structure

```
illajwala/
├── apps/              # Next.js frontend applications
│   ├── patient/      # Patient-facing app
│   ├── doctor/       # Doctor/clinic app
│   └── admin/        # Admin console
├── services/         # Backend services
│   ├── identity-service/    # Main API service
│   └── messaging-service/  # Messaging service
├── packages/         # Shared packages
│   ├── ui/           # Shared UI components
│   ├── types/        # TypeScript type definitions
│   ├── api-client/   # API client utilities
│   └── utils/        # Shared utilities
└── docs/             # Documentation
```

## Architecture Guidelines

### Multi-Tenant Architecture

- All data models must include `tenantId`
- All API queries must filter by `tenantId`
- JWT tokens include tenant context
- Never expose data across tenants

### API Design

- Use RESTful conventions
- Return consistent response formats
- Handle errors gracefully
- Include proper HTTP status codes

### Frontend Patterns

- Use React Query for data fetching
- Implement optimistic updates where appropriate
- Handle loading and error states
- Follow accessibility best practices

## Documentation

- Update relevant documentation when adding features
- Add JSDoc comments for public APIs
- Update README files if setup changes
- Document breaking changes

## Questions?

If you have questions or need help:
- Check existing documentation in `docs/`
- Review similar code in the codebase
- Ask in team discussions

Thank you for contributing! 🎉

