/**
 * Slot Controller
 */
const slotService = require('../services/slotService');
const asyncHandler = require('../utils/asyncHandler');

exports.create = asyncHandler(async (req, res) => {
  const { doctor_id, start_time, end_time } = req.body;
  
  const slot = await slotService.create({ doctor_id, start_time, end_time });
  
  res.status(201).json({
    success: true,
    message: 'Slot created successfully',
    data: slot
  });
});

exports.createBulk = asyncHandler(async (req, res) => {
  const { doctor_id, date, slots } = req.body;
  
  const results = await slotService.createBulk({ doctor_id, date, slots });
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  res.status(201).json({
    success: true,
    message: `Created ${successful} slots, ${failed} failed`,
    data: results
  });
});

exports.getByDoctor = asyncHandler(async (req, res) => {
  const { date, available_only } = req.query;
  
  const slots = await slotService.getByDoctor(req.params.doctorId, {
    date,
    available_only: available_only !== 'false'
  });
  
  res.json({
    success: true,
    data: slots
  });
});

exports.getAvailable = asyncHandler(async (req, res) => {
  const { doctor_id, date, start_date, end_date } = req.query;
  
  const slots = await slotService.getAvailable({ doctor_id, date, start_date, end_date });
  
  res.json({
    success: true,
    data: slots
  });
});

exports.delete = asyncHandler(async (req, res) => {
  await slotService.delete(req.params.id);
  
  res.json({
    success: true,
    message: 'Slot deleted successfully'
  });
});

