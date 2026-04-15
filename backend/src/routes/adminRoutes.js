const express = require('express');
const router = express.Router();
const db = require('../models/Database');
const { body, validationResult } = require('express-validator');

// Middleware to check admin authentication
const requireAdmin = (req, res, next) => {
	// Basic auth for admin routes
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Basic ')) {
		return res.status(401).json({ error: '需要先登录管理员账号' });
	}

	const base64Credentials = authHeader.split(' ')[1];
	const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
	const [username, password] = credentials.split(':');

	db.validateAdmin(username, password)
		.then(isValid => {
			if (isValid) {
				req.adminUsername = username;
				next();
			} else {
				res.status(401).json({ error: '用户名或密码错误' });
			}
		})
		.catch(err => {
			console.error('Auth error:', err);
			res.status(500).json({ error: '管理员认证失败' });
		});
};

// Admin login
router.post('/login', [
	body('username').notEmpty().withMessage('用户名不能为空'),
	body('password').notEmpty().withMessage('密码不能为空')
], async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ error: '请求参数校验失败', details: errors.array() });
		}

		const { username, password } = req.body;
		const isValid = await db.validateAdmin(username, password);

		if (isValid) {
			res.json({
				success: true,
				message: '登录成功',
				username
			});
		} else {
			res.status(401).json({ error: '用户名或密码错误' });
		}
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ error: '登录失败' });
	}
});

// Get all shares (with pagination)
router.get('/shares', requireAdmin, async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 20;
		const search = req.query.search || '';

		let query = 'SELECT * FROM shares WHERE is_active = 1';
		let params = [];

		if (search) {
			query += ' AND (share_id LIKE ? OR content LIKE ?)';
			const searchTerm = `%${search}%`;
			params.push(searchTerm, searchTerm);
		}

		query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
		params.push(limit, (page - 1) * limit);

		db.db.all(query, params, (err, rows) => {
			if (err) {
				console.error('Error fetching shares:', err);
				return res.status(500).json({ error: '获取分享列表失败' });
			}

			// Get total count
			let countQuery = 'SELECT COUNT(*) as total FROM shares WHERE is_active = 1';
			const countParams = [];

			if (search) {
				countQuery += ' AND (share_id LIKE ? OR content LIKE ?)';
				const searchTerm = `%${search}%`;
				countParams.push(searchTerm, searchTerm);
			}

			db.db.get(countQuery, countParams, (err, countRow) => {
				if (err) {
					console.error('Error counting shares:', err);
					return res.status(500).json({ error: '统计分享数量失败' });
				}

				res.json({
					success: true,
					data: {
						shares: rows,
						pagination: {
							page,
							limit,
							total: countRow.total,
							totalPages: Math.ceil(countRow.total / limit)
						}
					}
				});
			});
		});
	} catch (error) {
		console.error('Error getting shares:', error);
		res.status(500).json({ error: '获取分享列表失败' });
	}
});

// Get share details
router.get('/shares/:shareId', requireAdmin, async (req, res) => {
	try {
		const { shareId } = req.params;
		const share = await db.getShare(shareId);

		if (!share) {
			return res.status(404).json({ error: '未找到该分享' });
		}

		// Get access logs
		const logsQuery = 'SELECT * FROM access_logs WHERE share_id = ? ORDER BY accessed_at DESC LIMIT 100';
		db.db.all(logsQuery, [shareId], (err, logs) => {
			if (err) {
				console.error('Error fetching logs:', err);
				return res.status(500).json({ error: '获取访问日志失败' });
			}

			res.json({
				success: true,
				data: {
					share,
					accessLogs: logs
				}
			});
		});
	} catch (error) {
		console.error('Error getting share details:', error);
		res.status(500).json({ error: '获取分享详情失败' });
	}
});

// Delete share
router.delete('/shares/:shareId', requireAdmin, async (req, res) => {
	try {
		const { shareId } = req.params;
		const deleted = await db.deleteShare(shareId);

		if (deleted) {
			res.json({
				success: true,
				message: '分享已删除'
			});
		} else {
			res.status(404).json({ error: '未找到该分享' });
		}
	} catch (error) {
		console.error('Error deleting share:', error);
		res.status(500).json({ error: '删除分享失败' });
	}
});

// Get statistics
router.get('/stats', requireAdmin, async (req, res) => {
	try {
		const stats = await db.getShareStats();

		// Get recent shares (last 7 days)
		const recentQuery = `
			SELECT
				DATE(created_at) as date,
				COUNT(*) as count
			FROM shares
			WHERE created_at >= DATE('now', '-7 days')
			GROUP BY DATE(created_at)
			ORDER BY date
		`;

		db.db.all(recentQuery, [], (err, recentData) => {
			if (err) {
				console.error('Error fetching recent data:', err);
				return res.status(500).json({ error: '获取最近统计数据失败' });
			}

			// Get top accessed shares
			const topQuery = `
				SELECT
					share_id,
					access_count,
					created_at
				FROM shares
				WHERE is_active = 1
				ORDER BY access_count DESC
				LIMIT 10
			`;

			db.db.all(topQuery, [], (err, topShares) => {
				if (err) {
					console.error('Error fetching top shares:', err);
					return res.status(500).json({ error: '获取热门分享失败' });
				}

				res.json({
					success: true,
					data: {
						...stats,
						recentShares: recentData,
						topShares: topShares
					}
				});
			});
		});
	} catch (error) {
		console.error('Error getting stats:', error);
		res.status(500).json({ error: '获取统计信息失败' });
	}
});

// Clear expired shares
router.post('/cleanup', requireAdmin, async (req, res) => {
	try {
		const query = 'UPDATE shares SET is_active = 0 WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP';

		db.db.run(query, [], function(err) {
			if (err) {
				console.error('Error cleaning up expired shares:', err);
				return res.status(500).json({ error: '清理过期分享失败' });
			}

			res.json({
				success: true,
				message: `已停用 ${this.changes} 个过期分享`
			});
		});
	} catch (error) {
		console.error('Error in cleanup:', error);
		res.status(500).json({ error: '清理分享失败' });
	}
});

module.exports = router;
