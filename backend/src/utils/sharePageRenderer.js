const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');

marked.setOptions({
	gfm: true,
	breaks: true
});

function escapeHtml(value = '') {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function formatDateTime(dateString) {
	if (!dateString) return '未设置';

	return new Intl.DateTimeFormat('zh-CN', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(new Date(dateString));
}

function formatCompletionDate(dateString) {
	if (!dateString) return '未设置';

	const parsedDate = new Date(dateString);
	if (Number.isNaN(parsedDate.getTime())) {
		return dateString;
	}

	return new Intl.DateTimeFormat('zh-CN', {
		dateStyle: 'long'
	}).format(parsedDate);
}

function preprocessMarkdown(content = '') {
	return content
		.replace(/([^\n\s])(!\[[^\]]*\]\([^)]+\))/g, '$1\n\n$2')
		.replace(/(!\[[^\]]*\]\([^)]+\))([^\n\s])/g, '$1\n\n$2');
}

function getCalloutMeta(type) {
	const normalizedType = (type || 'note').toLowerCase();
	const metaMap = {
		note: { icon: '✎', title: 'Note', color: '#2563eb', background: 'rgba(37, 99, 235, 0.10)' },
		abstract: { icon: '≡', title: 'Abstract', color: '#0f766e', background: 'rgba(15, 118, 110, 0.10)' },
		summary: { icon: '≡', title: 'Summary', color: '#0f766e', background: 'rgba(15, 118, 110, 0.10)' },
		tldr: { icon: '≡', title: 'TL;DR', color: '#0f766e', background: 'rgba(15, 118, 110, 0.10)' },
		info: { icon: 'ℹ', title: 'Info', color: '#0284c7', background: 'rgba(2, 132, 199, 0.10)' },
		tip: { icon: '💡', title: 'Tip', color: '#16a34a', background: 'rgba(22, 163, 74, 0.10)' },
		important: { icon: '!', title: 'Important', color: '#ea580c', background: 'rgba(234, 88, 12, 0.10)' },
		success: { icon: '✓', title: 'Success', color: '#16a34a', background: 'rgba(22, 163, 74, 0.10)' },
		question: { icon: '?', title: 'Question', color: '#7c3aed', background: 'rgba(124, 58, 237, 0.10)' },
		warning: { icon: '⚠', title: 'Warning', color: '#d97706', background: 'rgba(217, 119, 6, 0.12)' },
		fail: { icon: '✕', title: 'Fail', color: '#dc2626', background: 'rgba(220, 38, 38, 0.10)' },
		failure: { icon: '✕', title: 'Failure', color: '#dc2626', background: 'rgba(220, 38, 38, 0.10)' },
		danger: { icon: '⛔', title: 'Danger', color: '#dc2626', background: 'rgba(220, 38, 38, 0.10)' },
		error: { icon: '⛔', title: 'Error', color: '#dc2626', background: 'rgba(220, 38, 38, 0.10)' },
		bug: { icon: '🐞', title: 'Bug', color: '#be123c', background: 'rgba(190, 18, 60, 0.10)' },
		example: { icon: '✦', title: 'Example', color: '#7c3aed', background: 'rgba(124, 58, 237, 0.10)' },
		quote: { icon: '❝', title: 'Quote', color: '#475569', background: 'rgba(71, 85, 105, 0.10)' }
	};

	return metaMap[normalizedType] || {
		icon: '◆',
		title: type,
		color: '#2563eb',
		background: 'rgba(37, 99, 235, 0.10)'
	};
}

function injectObsidianCallouts(rawHtml) {
	return rawHtml.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (fullMatch, innerHtml) => {
		const firstParagraphMatch = innerHtml.match(/^\s*<p>([\s\S]*?)<\/p>/);
		if (!firstParagraphMatch) {
			return fullMatch;
		}

		const paragraphContent = firstParagraphMatch[1];
		const calloutMatch = paragraphContent.match(/^\[!([A-Za-z0-9_-]+)\]([+-])?\s*([^\n<]*)(?:<br\s*\/?>|\n)?([\s\S]*)$/);
		if (!calloutMatch) {
			return fullMatch;
		}

		const [, rawType, foldMarker, customTitle, firstBodyChunk] = calloutMatch;
		const calloutMeta = getCalloutMeta(rawType);
		const titleText = (customTitle || '').trim() || calloutMeta.title;
		const remainingHtml = innerHtml.replace(/^\s*<p>[\s\S]*?<\/p>/, '');
		const firstBodyHtml = (firstBodyChunk || '').trim();
		const bodyHtml = `${firstBodyHtml ? `<p>${firstBodyHtml}</p>` : ''}${remainingHtml}`.trim();

		return `<div class="callout" data-callout="${escapeHtml(rawType.toLowerCase())}" data-fold="${foldMarker || ''}" style="--callout-color:${calloutMeta.color};--callout-bg:${calloutMeta.background};">
			<div class="callout-title">
				<span class="callout-icon" aria-hidden="true">${calloutMeta.icon}</span>
				<span class="callout-title-text">${escapeHtml(titleText)}</span>
			</div>
			<div class="callout-content">${bodyHtml}</div>
		</div>`;
	});
}

function injectCompletionChip(rawHtml) {
	return rawHtml.replace(/\[completion::\s*([^\]]+)\]/g, (_match, rawDate) => {
		const dateValue = rawDate.trim();
		const formattedDate = formatCompletionDate(dateValue);
		return `<span class="completion-chip" data-completion="${escapeHtml(dateValue)}">✅ ${escapeHtml(formattedDate)}</span>`;
	});
}

function unwrapImageOnlyParagraphs(rawHtml) {
	return rawHtml.replace(/<p>\s*((?:<img\b[^>]*>\s*)+)<\/p>/g, '$1');
}

function renderMarkdown(content) {
	const rawHtml = marked.parse(preprocessMarkdown(content));
	const htmlWithCallouts = injectObsidianCallouts(rawHtml);
	const htmlWithCompletionChip = injectCompletionChip(htmlWithCallouts);
	const htmlWithUnwrappedImages = unwrapImageOnlyParagraphs(htmlWithCompletionChip);
	return sanitizeHtml(htmlWithUnwrappedImages, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat([
			'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'div', 'span',
			'pre', 'code', 'hr', 'del', 'input'
		]),
		allowedAttributes: {
			a: ['href', 'name', 'target', 'rel'],
			div: ['class', 'data-completion', 'data-callout', 'data-fold', 'style'],
			span: ['class', 'data-completion'],
			img: ['src', 'alt', 'title'],
			code: ['class'],
			input: ['type', 'checked', 'disabled'],
			th: ['align'],
			td: ['align']
		},
		allowedSchemes: ['http', 'https', 'mailto'],
		transformTags: {
			a: sanitizeHtml.simpleTransform('a', {
				target: '_blank',
				rel: 'noopener noreferrer'
			})
		}
	});
}

function renderPageShell({ title, body, description = 'YxMdShare 分享内容' }) {
	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="description" content="${escapeHtml(description)}" />
	<title>${escapeHtml(title)}</title>
	<style>
		:root {
			color-scheme: light;
			--bg: #f5f7fb;
			--card: rgba(255, 255, 255, 0.92);
			--card-border: rgba(15, 23, 42, 0.08);
			--text: #172033;
			--muted: #60708a;
			--accent: #2563eb;
			--accent-strong: #1d4ed8;
			--danger: #dc2626;
			--warning: #d97706;
			--shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
			--radius: 20px;
		}

		* {
			box-sizing: border-box;
		}

		body {
			margin: 0;
			font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
			background:
				radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 30%),
				radial-gradient(circle at top right, rgba(14, 165, 233, 0.10), transparent 25%),
				linear-gradient(180deg, #f8fbff 0%, var(--bg) 100%);
			color: var(--text);
			min-height: 100vh;
		}

		a {
			color: var(--accent);
		}

		.page {
			max-width: 960px;
			margin: 0 auto;
			padding: 48px 20px 64px;
		}

		.hero {
			margin-bottom: 12px;
		}

		.eyebrow {
			display: inline-flex;
			align-items: center;
			padding: 6px 12px;
			border-radius: 999px;
			background: rgba(37, 99, 235, 0.10);
			color: var(--accent-strong);
			font-size: 13px;
			font-weight: 600;
			letter-spacing: 0.02em;
		}

		.card {
			background: var(--card);
			backdrop-filter: blur(14px);
			border: 1px solid var(--card-border);
			border-radius: var(--radius);
			box-shadow: var(--shadow);
			padding: 28px;
		}

		.card.compact-card {
			padding: 16px 18px;
		}

		.card + .card {
			margin-top: 14px;
		}

		h1 {
			font-size: clamp(28px, 4vw, 42px);
			line-height: 1.1;
			margin: 12px 0 8px;
		}

		h2, h3, h4, h5, h6 {
			margin-top: 1.6em;
			margin-bottom: 0.6em;
		}

		p {
			line-height: 1.8;
			margin: 0 0 1em;
		}

		.meta {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
			gap: 10px;
			margin-top: 0;
		}

		.meta-item {
			padding: 10px 12px;
			border-radius: 14px;
			background: rgba(148, 163, 184, 0.10);
		}

		.meta-label {
			font-size: 12px;
			color: var(--muted);
			margin-bottom: 3px;
			line-height: 1.3;
		}

		.meta-value {
			font-size: 14px;
			font-weight: 600;
			line-height: 1.45;
		}

		.markdown {
			font-size: 16px;
			line-height: 1.85;
		}

		.markdown img {
			max-width: 100%;
			height: auto;
			border-radius: 14px;
			display: inline-block;
			vertical-align: top;
			margin: 0.85rem 0.5rem 0.85rem 0;
		}

		.markdown pre {
			padding: 16px;
			overflow-x: auto;
			background: #0f172a;
			color: #e2e8f0;
			border-radius: 16px;
		}

		.markdown code {
			font-family: "SFMono-Regular", Consolas, monospace;
			background: rgba(15, 23, 42, 0.06);
			padding: 0.15em 0.35em;
			border-radius: 6px;
		}

		.markdown pre code {
			background: transparent;
			padding: 0;
		}

		.markdown blockquote {
			margin: 1.2rem 0;
			padding: 0.4rem 0 0.4rem 1rem;
			border-left: 4px solid rgba(37, 99, 235, 0.45);
			color: #334155;
			background: rgba(37, 99, 235, 0.04);
			border-radius: 0 12px 12px 0;
		}

		.markdown .callout {
			margin: 1rem 0;
			padding: 14px 16px;
			border-radius: 16px;
			background: var(--callout-bg, rgba(37, 99, 235, 0.10));
			border: 1px solid color-mix(in srgb, var(--callout-color, #2563eb) 24%, white);
		}

		.markdown .callout-title {
			display: flex;
			align-items: center;
			gap: 10px;
			color: var(--callout-color, #2563eb);
			font-weight: 700;
			margin-bottom: 8px;
		}

		.markdown .callout-icon {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 20px;
			height: 20px;
			font-size: 14px;
			line-height: 1;
		}

		.markdown .callout-content > :first-child {
			margin-top: 0;
		}

		.markdown .callout-content > :last-child {
			margin-bottom: 0;
		}

		.markdown table {
			width: 100%;
			border-collapse: collapse;
			margin: 1.2rem 0;
			overflow: hidden;
			border-radius: 12px;
			font-size: 14px;
		}

		.markdown th,
		.markdown td {
			padding: 12px 14px;
			border: 1px solid rgba(148, 163, 184, 0.22);
			text-align: left;
		}

		.markdown th {
			background: rgba(15, 23, 42, 0.05);
		}

		.markdown ul {
			padding-left: 1.4rem;
		}

		.markdown ul ul,
		.markdown ul ol,
		.markdown ol ul,
		.markdown ol ol {
			margin-top: -0.5rem;
			margin-left: 20px;
			padding-left: 1.25rem;
		}

		.markdown li {
			margin: 0.35rem 0;
		}

		.markdown li:has(> input[type="checkbox"]),
		.markdown li:has(> p > input[type="checkbox"]) {
			list-style: none;
			margin-left: -1.4rem;
			display: grid;
			grid-template-columns: 16px minmax(0, 1fr);
			align-items: start;
			gap: 0.65rem;
		}

		.markdown li:has(> p > input[type="checkbox"]) > p {
			grid-column: 2;
			margin: 0;
			color: var(--text);
		}

		.markdown li > input[type="checkbox"],
		.markdown li > p > input[type="checkbox"] {
			appearance: none;
			-webkit-appearance: none;
			vertical-align: -0.12em;
			margin: 0 0.55rem 0 0;
			width: 18px;
			height: 18px;
			flex: 0 0 auto;
			pointer-events: none;
			border-radius: 5px;
			border: 1.5px solid #dc2626;
			background: #dc2626;
			position: relative;
			opacity: 1;
			box-shadow: none;
		}

		.markdown li > input[type="checkbox"]::after,
		.markdown li > p > input[type="checkbox"]::after {
			content: "";
			position: absolute;
			left: 5px;
			top: 1px;
			width: 4px;
			height: 9px;
			border-right: 2px solid #ffffff;
			border-bottom: 2px solid #ffffff;
			transform: rotate(45deg);
			opacity: 0;
		}

		.markdown li > input[type="checkbox"]:checked,
		.markdown li > p > input[type="checkbox"]:checked {
			border-color: #0ea5e9;
			background: #0ea5e9;
		}

		.markdown li > input[type="checkbox"]:checked::after,
		.markdown li > p > input[type="checkbox"]:checked::after {
			opacity: 1;
		}

		.markdown li > input[type="checkbox"]:not(:checked)::before,
		.markdown li > p > input[type="checkbox"]:not(:checked)::before {
			content: "";
			position: absolute;
			left: 4px;
			top: 7px;
			width: 8px;
			height: 2px;
			border-radius: 999px;
			background: #ffffff;
		}

		.markdown li:has(> input[type="checkbox"]) > ul,
		.markdown li:has(> input[type="checkbox"]) > ol,
		.markdown li:has(> p > input[type="checkbox"]) > ul,
		.markdown li:has(> p > input[type="checkbox"]) > ol {
			grid-column: 2;
			margin-top: -0.5rem;
		}

		.markdown .completion-chip {
			display: inline-flex;
			align-items: center;
			max-width: 100%;
			margin-left: 0.45rem;
			vertical-align: baseline;
			white-space: nowrap;
			padding: 0.45rem 0.85rem;
			border-radius: 999px;
			background: rgba(56, 189, 248, 0.14);
			color: #0369a1;
			font-size: 14px;
			font-weight: 600;
			line-height: 1.4;
		}

		.form {
			display: grid;
			gap: 16px;
			margin-top: 24px;
		}

		.input,
		.button {
			width: 100%;
			border-radius: 14px;
			font-size: 16px;
		}

		.input {
			padding: 14px 16px;
			border: 1px solid rgba(148, 163, 184, 0.35);
			background: #fff;
		}

		.button {
			padding: 14px 18px;
			border: 0;
			background: linear-gradient(135deg, var(--accent), var(--accent-strong));
			color: #fff;
			font-weight: 700;
			cursor: pointer;
		}

		.hint,
		.status,
		.error {
			font-size: 14px;
			line-height: 1.7;
		}

		.hint,
		.status {
			color: var(--muted);
		}

		.error {
			color: var(--danger);
			background: rgba(220, 38, 38, 0.08);
			padding: 12px 14px;
			border-radius: 12px;
		}

		.state-title {
			font-size: 28px;
			margin: 16px 0 10px;
		}

		.state-warning .eyebrow {
			background: rgba(217, 119, 6, 0.12);
			color: var(--warning);
		}

		.footer {
			margin-top: 22px;
			font-size: 13px;
			color: var(--muted);
			text-align: center;
		}
	</style>
</head>
<body>
	<div class="page">
		${body}
		<div class="footer">由 YxMdShare 提供分享服务</div>
	</div>
</body>
</html>`;
}

function resolveTitle(share) {
	return share.title || '未命名分享';
}

function renderShareView({ shareId, share, contentHtml }) {
	const expiresText = share.expires_at ? formatDateTime(share.expires_at) : '永不过期';
	const shareTitle = resolveTitle(share);

	return renderPageShell({
		title: `${shareTitle} - YxMdShare分享`,
		description: shareTitle,
		body: `
			<section class="hero">
				<span class="eyebrow">YxMdShare分享</span>
				<h1>${escapeHtml(shareTitle)}</h1>
			</section>
			<section class="card compact-card">
				<div class="meta">
					<div class="meta-item">
						<div class="meta-label">创建时间</div>
						<div class="meta-value">${escapeHtml(formatDateTime(share.created_at))}</div>
					</div>
					<div class="meta-item">
						<div class="meta-label">过期时间</div>
						<div class="meta-value">${escapeHtml(expiresText)}</div>
					</div>
					<div class="meta-item">
						<div class="meta-label">访问次数</div>
						<div class="meta-value">${share.access_count + 1}</div>
					</div>
				</div>
			</section>
			<section class="card markdown">
				${contentHtml}
			</section>
		`
	});
}

function renderPasswordView({ shareId, errorMessage, share }) {
	const expiresText = share.expires_at ? formatDateTime(share.expires_at) : '永不过期';
	const shareTitle = resolveTitle(share);
	return renderPageShell({
		title: `${shareTitle} - 需要密码`,
		description: `${shareTitle} 需要密码`,
		body: `
			<section class="hero">
				<span class="eyebrow">受密码保护</span>
				<h1>${escapeHtml(shareTitle)}</h1>
				<p class="status">请输入访问密码后继续查看。</p>
			</section>
			<section class="card">
				<div class="meta">
					<div class="meta-item">
						<div class="meta-label">过期时间</div>
						<div class="meta-value">${escapeHtml(expiresText)}</div>
					</div>
				</div>
				<form class="form" method="post" action="/share/${encodeURIComponent(shareId)}">
					${errorMessage ? `<div class="error">${escapeHtml(errorMessage)}</div>` : ''}
					<input class="input" type="password" name="password" placeholder="请输入访问密码" autocomplete="current-password" required />
					<button class="button" type="submit">验证密码并查看内容</button>
					<p class="hint">密码验证通过后，本次会话内可直接访问该分享。</p>
				</form>
			</section>
		`
	});
}

function renderStateView({ title, eyebrow, message, shareId, variant = 'default' }) {
	return renderPageShell({
		title,
		description: title,
		body: `
			<section class="hero ${variant === 'warning' ? 'state-warning' : ''}">
				<span class="eyebrow">${escapeHtml(eyebrow)}</span>
				<h1 class="state-title">${escapeHtml(title)}</h1>
				<div class="card">
					<p>${escapeHtml(message)}</p>
					${shareId ? `<p class="hint">分享 ID：${escapeHtml(shareId)}</p>` : ''}
				</div>
			</section>
		`
	});
}

module.exports = {
	renderMarkdown,
	renderPasswordView,
	renderShareView,
	renderStateView
};
