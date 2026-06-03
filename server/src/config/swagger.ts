// ============================================================================
// ElectroKart — Swagger/OpenAPI Configuration
// ============================================================================
// Configures swagger-jsdoc and swagger-ui-express to automatically generate
// and serve interactive API documentation under /api/v1/docs.
// ============================================================================

import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { env } from './env.js';

// ---------------------------------------------------------------------------
// Swagger OpenAPI Specification Definition
// ---------------------------------------------------------------------------

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ElectroKart API Documentation',
      version: '1.0.0',
      description: 'Production-ready, enterprise-grade E-Commerce API for engineering students purchasing electronics, robotics, IoT, and DIY components.',
      contact: {
        name: 'ElectroKart Engineering Support',
        email: 'support@electrokart.com',
        url: env.CLIENT_URL,
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}${env.API_BASE_PATH}`,
        description: 'Local Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Input your Access Token to make authorized requests.',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Paths to files containing OpenAPI JSDoc comments
  apis: [
    './src/routes/*.ts',
    './src/routes/**/*.ts',
    './src/controllers/*.ts',
    './src/controllers/**/*.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);

// ---------------------------------------------------------------------------
// Swagger UI Mounting Setup
// ---------------------------------------------------------------------------

export function setupSwagger(app: Express): void {
  if (!env.SWAGGER_ENABLED) {
    console.log('ℹ️ Swagger documentation is disabled by configuration.');
    return;
  }

  const docUrl = `${env.API_BASE_PATH}/docs`;
  
  app.use(docUrl, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  console.log(`📑 Swagger Documentation mounted at: http://localhost:${env.PORT}${docUrl}`);
}

export default setupSwagger;
