const validator = require('validator');

const validateSignup = (req, res, next) => {
  const { name, email, password, college, role, authorizationCode } = req.body;
  const errors = [];

  // Name validation
  if (!name || !validator.isLength(name, { min: 2, max: 50 })) {
    errors.push('Name must be between 2 and 50 characters');
  }
  if (name && !validator.matches(name, /^[a-zA-Z\s]+$/)) {
    errors.push('Name can only contain letters and spaces');
  }

  // Email validation
  if (!email || !validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // Password validation
  if (!password || !validator.isLength(password, { min: 8 })) {
    errors.push('Password must be at least 8 characters long');
  }
  if (password && !validator.matches(password, /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  }

  // College validation
  if (!college || !validator.isLength(college, { min: 2, max: 100 })) {
    errors.push('College name must be between 2 and 100 characters');
  }

  // Role validation
  const validRoles = ['student', 'college_admin', 'super_admin'];
  if (!role || !validRoles.includes(role)) {
    errors.push('Invalid role specified');
  }

  // ✅ UPDATED: Authorization code validation with environment variables
  if (role === 'super_admin' || role === 'college_admin') {
    if (!authorizationCode) {
      errors.push(`Authorization code is required for ${role.replace('_', ' ')} registration`);
    } else {
      // Get codes from environment variables
      const superAdminCode = process.env.SUPER_ADMIN_AUTH_CODE || 'SuperAdmin@123';
      const collegeAdminCode = process.env.COLLEGE_ADMIN_AUTH_CODE || 'CollegeAdmin@123';

      if (role === 'super_admin' && authorizationCode !== superAdminCode) {
        errors.push('Invalid super admin authorization code');
      } else if (role === 'college_admin' && authorizationCode !== collegeAdminCode) {
        errors.push('Invalid college admin authorization code');
      }
    }
  }

  // Sanitize inputs
  req.sanitizedInputs = {
    name: validator.escape(name),
    email: validator.normalizeEmail(email),
    password: password, // Don't sanitize password
    college: validator.escape(college),
    role: validator.escape(role),
    authorizationCode: authorizationCode // Don't sanitize authorization code
  };

  if (errors.length > 0) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Validation failed',
      errors: errors 
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Email validation
  if (!email || !validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // Password validation
  if (!password || !validator.isLength(password, { min: 1 })) {
    errors.push('Password is required');
  }

  // Sanitize inputs
  req.sanitizedInputs = {
    email: validator.normalizeEmail(email),
    password: password // Don't sanitize password
  };

  if (errors.length > 0) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Validation failed',
      errors: errors 
    });
  }

  next();
};

module.exports = {
  validateSignup,
  validateLogin
};