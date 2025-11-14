# Performance Optimizations

This document outlines performance optimizations implemented in the Illajwala VisitNow platform.

## Frontend Optimizations

### Code Splitting & Lazy Loading

Heavy components are lazy-loaded to improve initial page load time:

**Admin Dashboard** (`apps/admin/src/app/dashboard/page.tsx`):

- `OpsAnalyticsCharts` - Chart rendering library (recharts)
- `ProviderReviewQueue` - Large data table
- `BookingsTable` - Appointment management table
- `NotificationResendPanel` - Complex form component
- `WaitlistOversightPanel` - Waitlist management
- `WaitlistPolicyConfig` - Policy configuration form

**Doctor Dashboard** (`apps/doctor/src/app/dashboard/page.tsx`):

- `AvailabilityPlanner` - Weekly schedule editor
- `WaitlistConsole` - Real-time waitlist management
- `ConsultationQueue` - Appointment queue

**Benefits**:

- Reduced initial bundle size
- Faster Time to Interactive (TTI)
- Better Core Web Vitals scores

### React Performance Optimizations

1. **React.memo**: Applied to frequently re-rendered components
   - `AppointmentCard` (patient app)
   - `DaySchedule` (doctor app)
   - `AppointmentActions` (admin app)
   - `BookingsTableHeader` (admin app)

2. **useCallback**: Memoized event handlers to prevent unnecessary re-renders
   - Status update handlers
   - Filter change handlers
   - Real-time event handlers

3. **useMemo**: Computed values cached to avoid recalculation
   - Filtered appointment lists
   - Sorted doctor lists
   - Grouped data structures

### Bundle Optimization

- **Dynamic imports**: Heavy libraries loaded on-demand
- **Tree shaking**: Unused code eliminated in production builds
- **Code splitting**: Route-based and component-based splitting

## Backend Optimizations

### Database Indexes

All critical query patterns are indexed. See [database-indexes.md](./database-indexes.md) for complete documentation.

**Key Indexes**:

- Multi-tenant queries: `tenantId` as first field
- Status filtering: Compound indexes with `status`
- Time-based queries: `createdAt`/`scheduledAt` for sorting
- TTL indexes: Automatic cleanup of expired documents

### Query Optimization

1. **Selective field projection**: Only fetch required fields
2. **Pagination**: Limit result sets (default: 20-100 items)
3. **Lean queries**: Use `.lean()` for read-only queries
4. **Population limits**: Limit populated references

### Caching Strategy

**Redis Usage**:

- Session cache
- Slot locking for appointments
- Real-time connection state

**Future Enhancements**:

- Query result caching for analytics
- API response caching for frequently accessed data

## Real-time Optimizations

### Server-Sent Events (SSE)

- **Connection pooling**: Efficient connection management
- **Heartbeat mechanism**: Keep connections alive
- **Automatic reconnection**: Client-side retry logic
- **Event batching**: Reduce server load

### Polling Fallback

- Graceful degradation when SSE unavailable
- Configurable polling intervals
- Smart retry logic with exponential backoff

## Image & Asset Optimization

- **Next.js Image**: Automatic image optimization
- **Lazy loading**: Images load on-demand
- **Responsive images**: Multiple sizes for different viewports

## Monitoring & Metrics

### Performance Metrics to Track

1. **Frontend**:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)
   - Cumulative Layout Shift (CLS)

2. **Backend**:
   - API response times
   - Database query execution times
   - Real-time connection counts
   - Error rates

### Tools

- **Next.js Analytics**: Built-in performance monitoring
- **MongoDB Profiler**: Slow query detection
- **Redis Monitoring**: Cache hit rates

## Best Practices

1. **Always use indexes** for database queries
2. **Lazy load** heavy components and libraries
3. **Memoize** expensive computations
4. **Optimize images** before uploading
5. **Monitor** performance in production
6. **Profile** before optimizing (measure first)

## Future Optimizations

- [ ] Service Worker for offline support
- [ ] GraphQL for efficient data fetching
- [ ] CDN for static assets
- [ ] Database read replicas for analytics
- [ ] Edge caching for API responses
