#!/usr/bin/env ts-node

/**
 * Development environment validation script
 * Checks that all required environment variables and services are configured
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface EnvCheck {
  name: string;
  required: boolean;
  description: string;
}

const requiredEnvVars: EnvCheck[] = [
  {
    name: 'MONGODB_URI',
    required: true,
    description: 'MongoDB connection string',
  },
  {
    name: 'JWT_SECRET',
    required: true,
    description: 'JWT secret for token signing',
  },
  {
    name: 'REFRESH_JWT_SECRET',
    required: true,
    description: 'JWT secret for refresh tokens',
  },
  {
    name: 'REDIS_URL',
    required: true,
    description: 'Redis connection URL',
  },
  {
    name: 'CLIENT_ORIGINS',
    required: true,
    description: 'Comma-separated list of allowed CORS origins',
  },
];

const checkEnvFile = (servicePath: string): { valid: boolean; missing: string[] } => {
  const envPath = join(servicePath, '.env');
  const envSamplePath = join(servicePath, 'env.sample');

  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const envSampleContent = readFileSync(envSamplePath, 'utf-8');

    const envVars = new Set<string>();
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^([A-Z_]+)=/);
      if (match) {
        envVars.add(match[1]);
      }
    });

    const missing: string[] = [];
    requiredEnvVars.forEach((check) => {
      if (check.required && !envVars.has(check.name)) {
        missing.push(check.name);
      }
    });

    return {
      valid: missing.length === 0,
      missing,
    };
  } catch (error) {
    return {
      valid: false,
      missing: ['.env file not found'],
    };
  }
};

const validateEnvironment = () => {
  console.info('🔍 Validating development environment...\n');

  // Check identity service
  const identityServicePath = join(__dirname, '..', 'services', 'identity-service');
  const identityCheck = checkEnvFile(identityServicePath);

  console.info('📦 Identity Service:');
  if (identityCheck.valid) {
    console.info('  ✅ Environment variables configured');
  } else {
    console.error('  ❌ Missing environment variables:');
    identityCheck.missing.forEach((varName) => {
      console.error(`     - ${varName}`);
    });
    console.info('  💡 Copy env.sample to .env and configure required variables');
  }

  // Check Docker services
  console.info('\n🐳 Docker Services:');
  console.info('  ℹ️  Run "docker compose ps" in infra/ to check service status');
  console.info('  ℹ️  Ensure MongoDB, Redis, and Mailhog are running');

  // Summary
  console.info('\n📋 Summary:');
  if (identityCheck.valid) {
    console.info('  ✅ Environment validation passed');
    console.info('  💡 Next steps:');
    console.info('     1. Start Docker services: cd infra && docker compose up -d');
    console.info('     2. Initialize MongoDB replica set (see local-development.md)');
    console.info('     3. Seed database: cd services/identity-service && pnpm seed');
    console.info('     4. Start services: pnpm dev');
  } else {
    console.error('  ❌ Environment validation failed');
    console.error('  💡 Fix the issues above before starting development');
    process.exit(1);
  }
};

validateEnvironment();

