/**
 * Slot Routes
 */
const express = require('express');
const { body, param, query } = require('express-validator');
const slotController = require('../controllers/slotController');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

/**
 * @swagger
 * /slots:
 *   get:
 *     summary: Get available slots
 *     tags: [Slots]
 *     parameters:
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by doctor
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for range
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for range
 *     responses:
 *       200:
 *         description: List of available slots
 */
router.get('/', slotController.getAvailable);

/**
 * @swagger
 * /slots/doctor/{doctorId}:
 *   get:
 *     summary: Get slots for a specific doctor
 *     tags: [Slots]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date
 *       - in: query
 *         name: available_only
 *         schema:
 *           type: boolean
 *         description: Only show available slots
 *     responses:
 *       200:
 *         description: Doctor's slots
 */
router.get(
  '/doctor/:doctorId',
  validate([param('doctorId').isUUID().withMessage('Invalid doctor ID')]),
  slotController.getByDoctor
);

/**
 * @swagger
 * /slots:
 *   post:
 *     summary: Create a single slot (Admin only)
 *     tags: [Slots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctor_id
 *               - start_time
 *               - end_time
 *             properties:
 *               doctor_id:
 *                 type: string
 *                 format: uuid
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Slot created
 */
router.post(
  '/',
  authenticate,
  requireRole(USER_ROLES.ADMIN),
  validate([
    body('doctor_id').isUUID().withMessage('Valid doctor ID required'),
    body('start_time').isISO8601().withMessage('Valid start time required'),
    body('end_time').isISO8601().withMessage('Valid end time required')
  ]),
  slotController.create
);

/**
 * @swagger
 * /slots/bulk:
 *   post:
 *     summary: Create multiple slots for a date (Admin only)
 *     tags: [Slots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctor_id
 *               - date
 *               - slots
 *             properties:
 *               doctor_id:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               slots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     start_time:
 *                       type: string
 *                       example: "09:00"
 *                     end_time:
 *                       type: string
 *                       example: "09:30"
 *     responses:
 *       201:
 *         description: Slots created
 */
router.post(
  '/bulk',
  authenticate,
  requireRole(USER_ROLES.ADMIN),
  validate([
    body('doctor_id').isUUID().withMessage('Valid doctor ID required'),
    body('date').isDate().withMessage('Valid date required'),
    body('slots').isArray({ min: 1 }).withMessage('At least one slot required')
  ]),
  slotController.createBulk
);

/**
 * @swagger
 * /slots/{id}:
 *   delete:
 *     summary: Delete a slot (Admin only)
 *     tags: [Slots]
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
 *         description: Slot deleted
 */
router.delete(
  '/:id',
  authenticate,
  requireRole(USER_ROLES.ADMIN),
  validate([param('id').isUUID().withMessage('Invalid slot ID')]),
  slotController.delete
);

module.exports = router;

