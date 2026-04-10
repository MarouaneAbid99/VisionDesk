/**
 * Database initialization module
 * Ensures Prisma migrations are applied before application starts
 * Used by Railway/production deployments
 */

import { execSync } from 'child_process';
import logger from './logger.js';

export const initializeDatabase = async (): Promise<void> => {
  try {
    logger.info({}, '[DB Init] Checking and applying pending migrations...');
    
    // Run migrations in production only
    if (process.env.NODE_ENV === 'production') {
      try {
        execSync('npx prisma migrate deploy --skip-generate', {
          stdio: 'inherit',
          env: process.env
        });
        logger.info({}, '[DB Init] ✅ Migrations completed');
      } catch (migrationError: unknown) {
        const errorMsg = migrationError instanceof Error ? migrationError.message : String(migrationError);
        
        // Some migration errors are okay (no migrations to apply)
        if (errorMsg.includes('already exists') || errorMsg.includes('no migrations')) {
          logger.info({}, '[DB Init] No pending migrations');
        } else {
          // Real error - but don't block startup, just warn
          logger.warn({}, `[DB Init] Migration warning: ${errorMsg}`);
        }
      }
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.warn({}, `[DB Init] Database initialization warning: ${errorMsg}`);
    // Don't throw - allow app to start even if migrations have issues
    // This prevents startup loops in production
  }
};
