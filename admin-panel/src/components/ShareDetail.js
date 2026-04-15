import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiTrash2, FiCopy, FiCalendar, FiEye, FiUser } from 'react-icons/fi';
import { adminAPI } from '../utils/api';
import { buildShareUrl } from '../utils/shareUrl';
import toast from 'react-hot-toast';

const ShareDetail = () => {
	const { shareId } = useParams();
	const [share, setShare] = useState(null);
	const [accessLogs, setAccessLogs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [contentExpanded, setContentExpanded] = useState(false);

	useEffect(() => {
		fetchShareDetails();
	}, [shareId]);

	const fetchShareDetails = async () => {
		setLoading(true);
		try {
			const response = await adminAPI.getShareDetails(shareId);
			setShare(response.data.share);
			setAccessLogs(response.data.accessLogs || []);
		} catch (error) {
			// Error handled by interceptor
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!window.confirm('确定要删除这个分享吗？')) {
			return;
		}

		try {
			await adminAPI.deleteShare(shareId);
			toast.success('分享已删除');
			window.history.back();
		} catch (error) {
			// Error handled by interceptor
		}
	};

	const handleCopyUrl = () => {
		const url = buildShareUrl(shareId);
		navigator.clipboard.writeText(url);
		toast.success('分享链接已复制到剪贴板');
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleString();
	};

	const formatRelativeTime = (dateString) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now - date;
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return '刚刚';
		if (diffMins < 60) return `${diffMins} 分钟前`;
		if (diffHours < 24) return `${diffHours} 小时前`;
		if (diffDays < 30) return `${diffDays} 天前`;
		return formatDate(dateString);
	};

	if (loading) {
		return (
			<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="text-center py-8">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						<p className="mt-2 text-gray-600">正在加载分享详情...</p>
				</div>
			</div>
		);
	}

	if (!share) {
		return (
			<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="text-center py-8">
						<p className="text-gray-500">未找到该分享</p>
						<Link
							to="/shares"
							className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
						>
							<FiArrowLeft className="mr-2" />
							返回分享列表
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
			<div className="px-4 py-6 sm:px-0">
				<div className="mb-6">
					<Link
						to="/shares"
						className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
					>
						<FiArrowLeft className="mr-2" />
						返回分享列表
					</Link>
				</div>

				<div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
					<div className="px-4 py-5 sm:px-6">
						<div className="flex justify-between items-center">
							<div>
								<h3 className="text-lg leading-6 font-medium text-gray-900">
									分享详情
								</h3>
								<p className="mt-1 max-w-2xl text-sm text-gray-500">
									该分享笔记的详细信息
								</p>
							</div>
							<div className="flex gap-2">
								<button
									onClick={handleCopyUrl}
									className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
								>
									<FiCopy className="mr-2" />
									复制链接
								</button>
								<button
									onClick={handleDelete}
									className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
								>
									<FiTrash2 className="mr-2" />
									删除
								</button>
							</div>
						</div>
					</div>
					<div className="border-t border-gray-200">
						<dl>
							<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">分享 ID</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
									{share.share_id}
								</dd>
							</div>
							<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">创建时间</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									<div className="flex items-center">
										<FiCalendar className="mr-2" />
										{formatDate(share.created_at)}
									</div>
								</dd>
							</div>
							<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">最近访问</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									{share.last_accessed_at ? formatDate(share.last_accessed_at) : '从未访问'}
								</dd>
							</div>
							<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">访问次数</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									<div className="flex items-center">
										<FiEye className="mr-2" />
										{share.access_count} 次访问
									</div>
								</dd>
							</div>
							<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">密码保护</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									{share.password_hash ? '已启用' : '未启用'}
								</dd>
							</div>
							<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">过期时间</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									{share.expires_at ? formatDate(share.expires_at) : '永不过期'}
								</dd>
							</div>
							<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">状态</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
										share.is_active
											? (share.expires_at && new Date(share.expires_at) < new Date())
												? 'bg-yellow-100 text-yellow-800'
												: 'bg-green-100 text-green-800'
											: 'bg-red-100 text-red-800'
									}`}>
										{share.is_active
											? (share.expires_at && new Date(share.expires_at) < new Date())
												? '已过期'
												: '生效中'
											: '已停用'}
									</span>
								</dd>
							</div>
							<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">内容预览</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									<div className="bg-gray-50 p-4 rounded-lg">
										<pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto">
											{contentExpanded ? share.content : `${share.content.substring(0, 500)}...`}
										</pre>
										<button
											onClick={() => setContentExpanded(!contentExpanded)}
											className="mt-2 text-sm text-blue-600 hover:text-blue-800"
										>
											{contentExpanded ? '收起' : '展开更多'}
										</button>
									</div>
								</dd>
							</div>
						</dl>
					</div>
				</div>

				{/* Access Logs */}
				<div className="bg-white shadow overflow-hidden sm:rounded-lg">
					<div className="px-4 py-5 sm:px-6">
						<h3 className="text-lg leading-6 font-medium text-gray-900">
							访问日志
						</h3>
						<p className="mt-1 max-w-2xl text-sm text-gray-500">
							该分享最近的访问记录
						</p>
					</div>
					<div className="border-t border-gray-200">
						{accessLogs.length === 0 ? (
							<div className="px-4 py-5 sm:p-6 text-center text-gray-500">
								暂无访问日志
							</div>
						) : (
							<ul className="divide-y divide-gray-200">
								{accessLogs.map((log) => (
									<li key={log.id} className="px-4 py-4 sm:px-6">
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<FiUser className="h-4 w-4 text-gray-400" />
													<span className="font-mono text-sm">{log.ip_address || '未知 IP'}</span>
												</div>
												<p className="text-sm text-gray-600 truncate" title={log.user_agent}>
													{log.user_agent || '无用户代理信息'}
												</p>
											</div>
											<div className="ml-4 text-sm text-gray-500">
												{formatRelativeTime(log.accessed_at)}
											</div>
										</div>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ShareDetail;
