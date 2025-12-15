import dotenv from 'dotenv'
import { Hono } from 'hono';
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { serve } from '@hono/node-server'
import GisController from './api/GisController.js';
import CountryController from './api/CountryController.js';
import ZipCodeController from './api/ZipCodeController.js';
import WeatherController from './api/WeatherController.js';
import FarmacyController from './api/FarmacyController.js';
import DocsController from './api/DocsContoller.js';
import DangerController from './api/DangerController.js';
import { testDBConnection } from './helpers/db.js';

// Load environment variables
dotenv.config({
  path: process.cwd() + '/.env'
});

const app = new Hono();
app.use(logger())
app.use(prettyJSON())
app.use('/api/*', cors())

app.get('/', (c) => {
  return c.redirect('/docs');
});

// Init controllers
DocsController.init(app)
DangerController.init(app)
CountryController.init(app)
GisController.init(app)
ZipCodeController.init(app)
WeatherController.init(app)
FarmacyController.init(app)

// Test DB connection and start server
testDBConnection().then(() => {
  serve({
    fetch: app.fetch,
    port: process.env.PORT || 3000
  }, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  })
}).catch(err => {
  console.error('Failed to initialize database models', err);
});
