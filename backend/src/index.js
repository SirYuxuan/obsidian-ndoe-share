const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			baseUri: ["'self'"],
			fontSrc: ["'self'", 'https:', 'data:'],
			formAction: ["'self'"],
			frameAncestors: ["'self'"],
			imgSrc: ["'self'", 'data:', 'https:'],
			objectSrc: ["'none'"],
			scriptSrc: ["'self'", 'https:'],
			scriptSrcAttr: ["'none'"],
			styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
			upgradeInsecureRequests: []
		}
	}
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(session({
	secret: process.env.SESSION_SECRET || 'change-this-session-secret',
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 1000 * 60 * 60 * 24
	}
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/share', require('./routes/sharePageRoutes'));
app.use('/api/shares', require('./routes/shareRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(err.status || 500).json({
		error: err.message || 'Internal Server Error',
		stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
	});
});

// Start server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
	console.log(`Environment: ${process.env.NODE_ENV}`);
	console.log(`Database: ${process.env.DB_PATH}`);
});

module.exports = app;
