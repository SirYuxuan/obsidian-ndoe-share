const rateLimit = require('express-rate-limit');

// Rate limiting for creating shares
const createShareLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	message: 'Too many shares created from this IP, please try again after 15 minutes'
});

// Rate limiting for accessing shares
const accessShareLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 500, // Limit each IP to 500 requests per windowMs
	message: 'Too many share accesses from this IP, please try again after 15 minutes'
});

module.exports = {
	createShareLimiter,
	accessShareLimiter
};