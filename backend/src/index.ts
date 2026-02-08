import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';

// Import route registration functions
import { registerArticlesRoutes } from './routes/articles.js';
import { registerTop10Routes } from './routes/top10.js';
import { registerEventsRoutes } from './routes/events.js';
import { registerMetadataRoutes } from './routes/metadata.js';
import { registerSplashRoutes } from './routes/splash.js';

// Combine schemas
const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication
app.withAuth();

// Register routes - IMPORTANT: Always use registration functions to avoid circular dependency issues
registerArticlesRoutes(app);
registerTop10Routes(app);
registerEventsRoutes(app);
registerMetadataRoutes(app);
registerSplashRoutes(app);

await app.run();
app.logger.info('Application running');
