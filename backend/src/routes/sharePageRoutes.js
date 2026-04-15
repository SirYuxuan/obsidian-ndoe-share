const express = require('express');
const db = require('../models/Database');
const {
	renderMarkdown,
	renderPasswordView,
	renderShareView,
	renderStateView
} = require('../utils/sharePageRenderer');

const router = express.Router();

function getClientIp(req) {
	return req.ip || req.connection.remoteAddress || '';
}

function hasExpired(share) {
	return share.expires_at && new Date(share.expires_at) < new Date();
}

function ensureVerifiedShareStore(req) {
	if (!req.session.verifiedShares) {
		req.session.verifiedShares = {};
	}

	return req.session.verifiedShares;
}

async function loadActiveShare(shareId) {
	return db.getShare(shareId);
}

router.get('/:shareId', async (req, res) => {
	try {
		const { shareId } = req.params;
		const share = await loadActiveShare(shareId);

		if (!share) {
			return res
				.status(404)
				.send(renderStateView({
					title: '分享不存在',
					eyebrow: '链接无效',
					message: '没有找到这个分享，可能已经被删除或链接有误。',
					shareId
				}));
		}

		if (hasExpired(share)) {
			return res
				.status(410)
				.send(renderStateView({
					title: '分享已过期',
					eyebrow: '已失效',
					message: '这个分享已经超过有效期，无法继续访问。',
					shareId,
					variant: 'warning'
				}));
		}

		const verifiedShares = ensureVerifiedShareStore(req);
		if (share.password_hash && !verifiedShares[shareId]) {
			return res.send(renderPasswordView({ shareId, share }));
		}

		await db.recordAccess(shareId, getClientIp(req), req.get('User-Agent') || '');

		return res.send(renderShareView({
			shareId,
			share,
			contentHtml: renderMarkdown(share.content)
		}));
	} catch (error) {
		console.error('Error rendering share page:', error);
		return res
			.status(500)
			.send(renderStateView({
				title: '分享页加载失败',
				eyebrow: '服务器错误',
				message: '服务器暂时无法渲染该分享，请稍后再试。'
			}));
	}
});

router.post('/:shareId', async (req, res) => {
	try {
		const { shareId } = req.params;
		const password = req.body.password || '';
		const share = await loadActiveShare(shareId);

		if (!share) {
			return res
				.status(404)
				.send(renderStateView({
					title: '分享不存在',
					eyebrow: '链接无效',
					message: '没有找到这个分享，可能已经被删除或链接有误。',
					shareId
				}));
		}

		if (hasExpired(share)) {
			return res
				.status(410)
				.send(renderStateView({
					title: '分享已过期',
					eyebrow: '已失效',
					message: '这个分享已经超过有效期，无法继续访问。',
					shareId,
					variant: 'warning'
				}));
		}

		const isValidPassword = await db.validatePassword(shareId, password);
		if (!isValidPassword) {
			return res
				.status(401)
				.send(renderPasswordView({
					shareId,
					share,
					errorMessage: '密码错误，请重新输入。'
				}));
		}

		const verifiedShares = ensureVerifiedShareStore(req);
		verifiedShares[shareId] = true;

		return req.session.save((saveError) => {
			if (saveError) {
				console.error('Error saving share verification state:', saveError);
				return res
					.status(500)
					.send(renderStateView({
						title: '验证状态保存失败',
						eyebrow: '服务器错误',
						message: '密码验证已通过，但服务器未能保存会话，请刷新后重试。'
					}));
			}

			return res.redirect(`/share/${encodeURIComponent(shareId)}`);
		});
	} catch (error) {
		console.error('Error verifying share password:', error);
		return res
			.status(500)
			.send(renderStateView({
				title: '密码验证失败',
				eyebrow: '服务器错误',
				message: '服务器暂时无法完成密码校验，请稍后再试。'
			}));
	}
});

module.exports = router;
