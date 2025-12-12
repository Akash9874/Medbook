/**
 * Authentication Controller
 */
const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

exports.register = asyncHandler(async (req, res) => {
  const { email, password, name, phone } = req.body;
  
  const { user, token } = await authService.register({ email, password, name, phone });
  
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user, token }
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const { user, token } = await authService.login({ email, password });
  
  res.json({
    success: true,
    message: 'Login successful',
    data: { user, token }
  });
});

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  
  res.json({
    success: true,
    data: user
  });
});

