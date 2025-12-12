/**
 * Doctor Controller
 */
const doctorService = require('../services/doctorService');
const asyncHandler = require('../utils/asyncHandler');

exports.create = asyncHandler(async (req, res) => {
  const doctor = await doctorService.create(req.body);
  
  res.status(201).json({
    success: true,
    message: 'Doctor created successfully',
    data: doctor
  });
});

exports.getAll = asyncHandler(async (req, res) => {
  const { specialization, page, limit } = req.query;
  
  const result = await doctorService.getAll({
    specialization,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20
  });
  
  res.json({
    success: true,
    data: result.doctors,
    pagination: result.pagination
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const doctor = await doctorService.getById(req.params.id);
  
  res.json({
    success: true,
    data: doctor
  });
});

exports.update = asyncHandler(async (req, res) => {
  const doctor = await doctorService.update(req.params.id, req.body);
  
  res.json({
    success: true,
    message: 'Doctor updated successfully',
    data: doctor
  });
});

exports.delete = asyncHandler(async (req, res) => {
  await doctorService.delete(req.params.id);
  
  res.json({
    success: true,
    message: 'Doctor deleted successfully'
  });
});

exports.getSpecializations = asyncHandler(async (req, res) => {
  const specializations = await doctorService.getSpecializations();
  
  res.json({
    success: true,
    data: specializations
  });
});

