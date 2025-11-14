# Payment Service

Payment service for handling Razorpay integration in the Illajwala platform.

## Environment Variables

```env
NODE_ENV=development
PORT=4003
MONGODB_URI=mongodb://127.0.0.1:27017/illajwala
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=your-jwt-secret
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_CURRENCY=INR
CLIENT_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

## Development

```bash
pnpm dev
```

## Build

```bash
pnpm build
pnpm start
```
