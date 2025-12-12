/**
 * Booking Routes
 */
const express = require('express');
const { body, param, query } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { bookingLimiter } = require('../middleware/rateLimiter');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     description: Books a slot for the authenticated user. The booking starts in PENDING status and must be confirmed within 2 minutes.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slot_id
 *             properties:
 *               slot_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the slot to book
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       409:
 *         description: Slot unavailable or being booked by another user
 */
router.post(
  '/',
  authenticate,
  bookingLimiter,
  validate([body('slot_id').isUUID().withMessage('Valid slot ID required')]),
  bookingController.create
);

/**
 * @swagger
 * /bookings/my:
 *   get:
 *     summary: Get current user's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, FAILED, CANCELLED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User's bookings
 */
router.get('/my', authenticate, bookingController.getMyBookings);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
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
 *         description: Booking details
 *       404:
 *         description: Booking not found
 */
router.get(
  '/:id',
  authenticate,
  validate([param('id').isUUID().withMessage('Invalid booking ID')]),
  bookingController.getById
);

/**
 * @swagger
 * /bookings/{id}/confirm:
 *   patch:
 *     summary: Confirm a pending booking
 *     description: Confirms a booking that is in PENDING status. Must be done within 2 minutes of creation.
 *     tags: [Bookings]
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
 *         description: Booking confirmed
 *       409:
 *         description: Booking expired or invalid status
 */
router.patch(
  '/:id/confirm',
  authenticate,
  validate([param('id').isUUID().withMessage('Invalid booking ID')]),
  bookingController.confirm
);

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking
 *     tags: [Bookings]
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
 *         description: Booking cancelled
 */
router.patch(
  '/:id/cancel',
  authenticate,
  validate([param('id').isUUID().withMessage('Invalid booking ID')]),
  bookingController.cancel
);

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings (Admin only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, FAILED, CANCELLED]
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: All bookings
 */
router.get(
  '/',
  authenticate,
  requireRole(USER_ROLES.ADMIN),
  bookingController.getAll
);

/**
 * @swagger
 * /bookings/admin/expire-pending:
 *   post:
 *     summary: Expire pending bookings (Admin/System)
 *     description: Marks all expired PENDING bookings as FAILED and releases their slots
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending bookings expired
 */
router.post(
  '/admin/expire-pending',
  authenticate,
  requireRole(USER_ROLES.ADMIN),
  bookingController.expirePending
);

module.exports = router;

