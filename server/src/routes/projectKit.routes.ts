// ============================================================================
// ElectroKart — ProjectKit Routes (Smart Project Builder)
// ============================================================================
// Public endpoints for browsing projects, viewing BOM with live pricing.
// Authenticated endpoint for adding project kit to cart.
// Admin-only endpoints for project CRUD management.
// ============================================================================

import { Router } from 'express';
import { ProjectKitController } from '../controllers/index.js';
import { authenticate, authorize, validate } from '../middlewares/index.js';
import {
  createProjectKitSchema,
  updateProjectKitSchema,
  projectKitQuerySchema,
  objectIdSchema,
} from '../validators/index.js';
import { z } from 'zod';

const router = Router();

// ─── Public Routes ──────────────────────────────────────────────────────────

/**
 * @openapi
 * /project-kits:
 *   get:
 *     summary: List active project kits (Public, paginated, filterable)
 *     tags: [ProjectKits]
 *     parameters:
 *       - in: query
 *         name: applicationArea
 *         schema:
 *           type: string
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, popular, featured]
 *     responses:
 *       200:
 *         description: Projects listed successfully
 */
router.get(
  '/',
  validate({ query: projectKitQuerySchema }),
  ProjectKitController.getActiveProjects
);

/**
 * @openapi
 * /project-kits/featured:
 *   get:
 *     summary: Retrieve featured project kits for homepage display
 *     tags: [ProjectKits]
 *     responses:
 *       200:
 *         description: Featured projects retrieved successfully
 */
router.get('/featured', ProjectKitController.getFeaturedProjects);

/**
 * @openapi
 * /project-kits/{slug}:
 *   get:
 *     summary: Get full project detail by slug (Public)
 *     tags: [ProjectKits]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project details retrieved successfully
 */
router.get('/:slug', ProjectKitController.getProjectBySlug);

/**
 * @openapi
 * /project-kits/{slug}/bom:
 *   get:
 *     summary: Get BOM with live pricing for a project (Public)
 *     tags: [ProjectKits]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: BOM with pricing retrieved successfully
 */
router.get('/:slug/bom', ProjectKitController.getProjectBom);

// ─── Authenticated: Add Kit to Cart ─────────────────────────────────────────

/**
 * @openapi
 * /project-kits/{id}/add-to-cart:
 *   post:
 *     summary: Add all required BOM components to user's cart
 *     tags: [ProjectKits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Components processed for cart
 */
router.post(
  '/:id/add-to-cart',
  authenticate,
  validate({ params: z.object({ id: objectIdSchema }) }),
  ProjectKitController.addToCart
);

// ─── Admin-Only Management ──────────────────────────────────────────────────

router.use('/admin', authenticate, authorize('admin'));

/**
 * @openapi
 * /project-kits/admin:
 *   get:
 *     summary: List all project kits including drafts (Admin only)
 *     tags: [ProjectKits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All projects listed successfully
 */
router.get('/admin', ProjectKitController.getAllProjects);

/**
 * @openapi
 * /project-kits/admin/{id}:
 *   get:
 *     summary: Get project by ID for editing (Admin only)
 *     tags: [ProjectKits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 */
router.get(
  '/admin/:id',
  validate({ params: z.object({ id: objectIdSchema }) }),
  ProjectKitController.getProjectById
);

/**
 * @openapi
 * /project-kits/admin:
 *   post:
 *     summary: Create a new project kit (Admin only)
 *     tags: [ProjectKits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Project created successfully
 */
router.post(
  '/admin',
  validate({ body: createProjectKitSchema }),
  ProjectKitController.createProject
);

/**
 * @openapi
 * /project-kits/admin/{id}:
 *   patch:
 *     summary: Update an existing project kit (Admin only)
 *     tags: [ProjectKits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 */
router.patch(
  '/admin/:id',
  validate({ params: z.object({ id: objectIdSchema }), body: updateProjectKitSchema }),
  ProjectKitController.updateProject
);

/**
 * @openapi
 * /project-kits/admin/{id}:
 *   delete:
 *     summary: Delete a project kit (Admin only)
 *     tags: [ProjectKits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted successfully
 */
router.delete(
  '/admin/:id',
  validate({ params: z.object({ id: objectIdSchema }) }),
  ProjectKitController.deleteProject
);

export default router;
