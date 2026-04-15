import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiRefreshCw, FiTrash2, FiEye, FiCopy, FiCalendar, FiLock, FiUnlock } from 'react-icons/fi';
import { adminAPI } from '../utils/api';
import { buildShareUrl } from '../utils/shareUrl';
import toast from 'react-hot-toast';

const SharesList = () => {
	const [shares, setShares] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 0
	});

	const fetchShares = async (page = 1) => {
		setLoading(true);
		try {
			const response = await adminAPI.getShares(page, pagination.limit, search);
			setShares(response.data.shares);
			setPagination(response.data.pagination);
		} catch (error) {
			// Error handled by interceptor
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchShares();
	}, []);

	const handleSearch = (e) => {
		e.preventDefault();
		fetchShares(1);
	};

	const handleDelete = async (shareId) => {
		if (!window.confirm('确定要删除这个分享吗？')) {
			return;
		}

		try {
			await adminAPI.deleteShare(shareId);
			toast.success('分享已删除');
			fetchShares(pagination.page); // Refresh current page
		} catch (error) {
			// Error handled by interceptor
		}
	};

	const handleCopyUrl = (shareId) => {
		const url = buildShareUrl(shareId);
		navigator.clipboard.writeText(url);
		toast.success('分享链接已复制到剪贴板');
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleString();
	};

	const formatExpiry = (expiresAt) => {
		if (!expiresAt) return '永不过期';
		const now = new Date();
		const expiry = new Date(expiresAt);
		const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

		if (diffDays < 0) return '已过期';
		if (diffDays === 0) return '今天到期';
		if (diffDays === 1) return '明天到期';
		return `${diffDays} 天后到期`;
	};

	return (
		<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
			<div className="px-4 py-6 sm:px-0">
				<div className="flex justify-between items-center mb-6">
					<div>
						<h1 className="text-2xl font-semibold text-gray-900">分享列表</h1>
						<p className="mt-1 text-sm text-gray-600">
							管理所有已分享的笔记
						</p>
					</div>
					<button
						onClick={() => fetchShares(pagination.page)}
						className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						<FiRefreshCw className="mr-2" />
						刷新
					</button>
				</div>

				<div className="mb-6">
					<form onSubmit={handleSearch} className="flex gap-4">
						<input
							type="text"
							placeholder="按分享 ID 或内容搜索..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="flex-grow input"
						/>
						<button
							type="submit"
							className="btn btn-primary"
						>
							搜索
						</button>
						<button
							type="button"
							onClick={() => {
								setSearch('');
								fetchShares(1);
							}}
							className="btn btn-secondary"
						>
							清空
						</button>
					</form>
				</div>

				{loading ? (
					<div className="text-center py-8">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						<p className="mt-2 text-gray-600">正在加载分享列表...</p>
					</div>
				) : shares.length === 0 ? (
					<div className="text-center py-8 bg-white rounded-lg shadow">
						<p className="text-gray-500">未找到分享</p>
					</div>
				) : (
					<div className="bg-white shadow overflow-hidden sm:rounded-md">
						<ul className="divide-y divide-gray-200">
							{shares.map((share) => (
								<li key={share.share_id}>
									<div className="px-4 py-4 sm:px-6">
										<div className="flex items-center justify-between">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-2">
													<span className="font-mono text-sm text-gray-900 truncate">
														{share.share_id}
													</span>
													{share.password_hash ? (
														<FiLock className="h-4 w-4 text-red-500" title="已设密码" />
													) : (
														<FiUnlock className="h-4 w-4 text-green-500" title="未设密码" />
													)}
												</div>
												<p className="text-sm text-gray-600 truncate mb-2">
													{share.content.substring(0, 200)}...
												</p>
												<div className="flex items-center gap-4 text-xs text-gray-500">
													<div className="flex items-center">
														<FiCalendar className="mr-1" />
														{formatDate(share.created_at)}
													</div>
													<div className="flex items-center">
														<span>过期时间：{formatExpiry(share.expires_at)}</span>
													</div>
													<div className="flex items-center">
														<span>访问次数：{share.access_count}</span>
													</div>
												</div>
											</div>
											<div className="flex items-center gap-2 ml-4">
												<Link
													to={`/shares/${share.share_id}`}
													className="inline-flex items-center p-2 border border-transparent rounded-full text-gray-700 hover:bg-gray-100"
													title="查看详情"
												>
													<FiEye className="h-4 w-4" />
												</Link>
												<button
													onClick={() => handleCopyUrl(share.share_id)}
													className="inline-flex items-center p-2 border border-transparent rounded-full text-gray-700 hover:bg-gray-100"
													title="复制链接"
												>
													<FiCopy className="h-4 w-4" />
												</button>
												<button
													onClick={() => handleDelete(share.share_id)}
													className="inline-flex items-center p-2 border border-transparent rounded-full text-red-600 hover:bg-red-50"
													title="删除分享"
												>
													<FiTrash2 className="h-4 w-4" />
												</button>
											</div>
										</div>
									</div>
								</li>
							))}
						</ul>

						{/* Pagination */}
						{pagination.totalPages > 1 && (
							<div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
								<div className="flex-1 flex justify-between sm:hidden">
									<button
										onClick={() => fetchShares(pagination.page - 1)}
										disabled={pagination.page === 1}
										className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										上一页
									</button>
									<button
										onClick={() => fetchShares(pagination.page + 1)}
										disabled={pagination.page === pagination.totalPages}
										className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										下一页
									</button>
								</div>
								<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
									<div>
										<p className="text-sm text-gray-700">
											显示第{' '}
											<span className="font-medium">
												{(pagination.page - 1) * pagination.limit + 1}
											</span>{' '}
											到{' '}
											<span className="font-medium">
												{Math.min(pagination.page * pagination.limit, pagination.total)}
											</span>{' '}
											条，共 <span className="font-medium">{pagination.total}</span> 条
										</p>
									</div>
									<div>
										<nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
											<button
												onClick={() => fetchShares(pagination.page - 1)}
												disabled={pagination.page === 1}
												className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												上一页
											</button>
											{/* Page numbers */}
											{[...Array(pagination.totalPages)].map((_, i) => {
												const pageNum = i + 1;
												const isCurrent = pageNum === pagination.page;
												return (
													<button
														key={pageNum}
														onClick={() => fetchShares(pageNum)}
														className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
															isCurrent
																? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
																: 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
														}`}
													>
														{pageNum}
													</button>
												);
											})}
											<button
												onClick={() => fetchShares(pagination.page + 1)}
												disabled={pagination.page === pagination.totalPages}
												className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												下一页
											</button>
										</nav>
									</div>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default SharesList;
