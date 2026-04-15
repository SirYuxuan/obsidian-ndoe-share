const express = require('express');
const router = express.Router();
const db = require('../models/Database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');

function getConfiguredApiKey() {
	return (process.env.SHARE_API_KEY || '').trim();
}

function requireShareApiKey(req, res, next) {
	const configuredApiKey = getConfiguredApiKey();

	if (!configuredApiKey) {
		return next();
	}

	const providedApiKey = (req.get('X-Share-Api-Key') || '').trim();
	if (!providedApiKey || providedApiKey !== configuredApiKey) {
		return res.status(401).json({ error: '分享接口密钥无效' });
	}

	return next();
}

// Generate random share ID
function generateShareId(length = 16) {
	return crypto.randomBytes(length).toString('hex').slice(0, length);
}

router.get('/connection-test', requireShareApiKey, async (req, res) => {
	res.json({
		success: true,
		message: '分享接口连接成功',
		data: {
			apiBaseUrl: process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`,
			shareUrlPrefix: process.env.SHARE_URL_PREFIX || `${req.protocol}://${req.get('host')}/share`,
			apiKeyConfigured: !!getConfiguredApiKey()
		}
	});
});

// Create a new share
router.post('/', [
	body('title').optional().isString(),
	body('content').notEmpty().withMessage('Content is required'),
	body('password').optional().isString(),
	body('expireDays').optional().isInt({ min: 0 }),
	body('expiresAt').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('expiresAt 格式无效')
], requireShareApiKey, async (req, res) => {
	try {
		// Validate input
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ error: '请求参数校验失败', details: errors.array() });
		}

		const { title, content, password, expireDays, expiresAt } = req.body;
		const normalizedExpireDays = expireDays ?? 30;
		const normalizedExpiresAt = expiresAt ? new Date(expiresAt).toISOString() : null;
		const normalizedTitle = (title || '').trim() || '未命名分享';

		// Generate share ID
		const shareId = generateShareId();

		// Hash password if provided
		let passwordHash = null;
		if (password && password.trim() !== '') {
			const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
			passwordHash = bcrypt.hashSync(password, saltRounds);
		}

		// Save to database
		const id = await db.createShare(shareId, normalizedTitle, content, passwordHash, {
			expireDays: normalizedExpiresAt ? 0 : normalizedExpireDays,
			expiresAt: normalizedExpiresAt
		});

		// Construct share URL
		const baseUrl = process.env.SHARE_URL_PREFIX || `${req.protocol}://${req.get('host')}/share`;
		const shareUrl = `${baseUrl}/${shareId}`;

		res.status(201).json({
			success: true,
			data: {
				id,
				shareId,
				title: normalizedTitle,
				url: shareUrl,
				hasPassword: !!passwordHash,
				expiresAt: normalizedExpiresAt || (normalizedExpireDays > 0
					? new Date(Date.now() + normalizedExpireDays * 24 * 60 * 60 * 1000).toISOString()
					: null)
			}
		});
	} catch (error) {
		console.error('Error creating share:', error);
		res.status(500).json({ error: '创建分享失败' });
	}
});

// Get share content
router.get('/:shareId', async (req, res) => {
	try {
		const { shareId } = req.params;
		const { password } = req.query;

		// Get share from database
		const share = await db.getShare(shareId);
		if (!share) {
			return res.status(404).json({ error: '分享不存在或已失效' });
		}

		// Check if expired
		if (share.expires_at && new Date(share.expires_at) < new Date()) {
			return res.status(410).json({ error: '分享已过期' });
		}

		// Check password
		const isValidPassword = await db.validatePassword(shareId, password || '');
		if (!isValidPassword) {
			return res.status(401).json({ error: '访问密码错误' });
		}

		// Record access
		const ip = req.ip || req.connection.remoteAddress;
		const userAgent = req.get('User-Agent') || '';
		await db.recordAccess(shareId, ip, userAgent);

		// Return content
		res.json({
			success: true,
			data: {
				title: share.title,
				content: share.content,
				createdAt: share.created_at,
				accessCount: share.access_count,
				hasPassword: !!share.password_hash,
				expiresAt: share.expires_at
			}
		});
	} catch (error) {
		console.error('Error getting share:', error);
		res.status(500).json({ error: '获取分享失败' });
	}
});

// Verify share exists (for frontend validation)
router.head('/:shareId', async (req, res) => {
	try {
		const { shareId } = req.params;
		const share = await db.getShare(shareId);

		if (!share) {
			return res.status(404).end();
		}

		// Check if expired
		if (share.expires_at && new Date(share.expires_at) < new Date()) {
			return res.status(410).end();
		}

		res.status(200).end();
	} catch (error) {
		console.error('Error checking share:', error);
		res.status(500).end();
	}
});

// Get share stats
router.get('/:shareId/stats', async (req, res) => {
	try {
		const { shareId } = req.params;
		const share = await db.getShare(shareId);

		if (!share) {
			return res.status(404).json({ error: '未找到该分享' });
		}

		res.json({
			success: true,
			data: {
				shareId: share.share_id,
				createdAt: share.created_at,
				lastAccessedAt: share.last_accessed_at,
				accessCount: share.access_count,
				expiresAt: share.expires_at,
				isActive: share.is_active
			}
		});
	} catch (error) {
		console.error('Error getting share stats:', error);
		res.status(500).json({ error: '获取分享统计失败' });
	}
});

// Check if share requires password
router.get('/:shareId/requires-password', async (req, res) => {
	try {
		const { shareId } = req.params;
		const share = await db.getShare(shareId);

		if (!share) {
			return res.status(404).json({ error: '未找到该分享' });
		}

		// Check if expired
		if (share.expires_at && new Date(share.expires_at) < new Date()) {
			return res.status(410).json({ error: '分享已过期' });
		}

		res.json({
			success: true,
			data: {
				requiresPassword: !!share.password_hash
			}
		});
	} catch (error) {
		console.error('Error checking password requirement:', error);
		res.status(500).json({ error: '检查密码状态失败' });
	}
});

module.exports = router;
