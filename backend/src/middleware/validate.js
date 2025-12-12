/**
 * Request Validation Middleware
 * 
 * Uses express-validator to validate incoming requests.
 * Returns structured error messages for invalid requests.
 */
const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors for response
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    throw ApiError.badRequest(formattedErrors[0].message);
  };
};

module.exports = validate;

