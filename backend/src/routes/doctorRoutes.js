/**
 * Doctor Routes
 */
const express = require('express');
const { body, param, query } = require('express-validator');
const doctorController = require('../controllers/doctorController');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

/**
 * @swagger
 * /doctors:
 *   get:
 *     summary: Get all doctors
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *         description: Filter by specialization
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of doctors
 */
router.get('/', doctorController.getAll);

/**
 * @swagger
 * /doctors/specializations:
 *   get:
 *     summary: Get all specializations
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: List of specializations
 */
router.get('/specializations', doctorController.getSpecializations);

/**
 * @swagger
 * /doctors/{id}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Doctor details
 *       404:
 *         description: Doctor not found
 */
router.get(
  '/:id',
  validate([param('id').isUUID().withMessage('Invalid doctor ID')]),
  doctorController.getById
);

/**
 * @swagger
 * /doctors:
 *   post:
 *     summary: Create a new doctor (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - specialization
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               specialization:
 *                 type: string
 *               qualification:
 *                 type: string
 *               experience_years:
 *                 type: integer
 *               consultation_fee:
 *                 type: number
 *               bio:
 *                 type: string
 *     responses:
 *       201:
 *         description: Doctor created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.post(
  '/',
  authenticate,
  requireRole(USER_ROLES.ADMIN),
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('specialization').trim().notEmpty().withMessage('Specialization is required'),
    body('qualification').optional().trim(),
    body('experience_years').optional().isInt({ min: 0 }).withMessage('Experience must be positive'),
    body('consultation_fee').optional().isFloat({ min: 0 }).withMessage('Fee must be positive'),
    body('bio').optional().trim()
  ]),
  doctorController.create
);

/**
 * @swagger
 * /doctors/{id}:
 *   put:
 *     summary: Update doctor (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               specialization:
 *                 type: string
 *               qualification:
 *                 type: string
 *               experience_years:
 *                 type: integer
 *               consultation_fee:
 *                 type: number
 *               bio:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Doctor updated
 */
router.put(
  '/:id',
  authenticate,
  requireRole(USER_ROLES.ADMIN),
  validate([param('id').isUUID().withMessage('Invalid doctor ID')]),
  doctorController.update
);

/**
 * @swagger
 * /doctors/{id}:
 *   delete:
 *     summary: Delete doctor (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Doctor deleted
 */
router.delete(
  '/:id',
  authenticate,
  requireRole(USER_ROLES.ADMIN),
  validate([param('id').isUUID().withMessage('Invalid doctor ID')]),
  doctorController.delete
);

module.exports = router;

