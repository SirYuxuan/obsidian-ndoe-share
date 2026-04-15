import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiRefreshCw, FiTrash2, FiBarChart2, FiUsers, FiEye, FiFileText, FiClock } from 'react-icons/fi';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
	const [stats, setStats] = useState(null);
	const [recentShares, setRecentShares] = useState([]);
	const [topShares, setTopShares] = useState([]);
	const [loading, setLoading] = useState(true);
	const [cleanupLoading, setCleanupLoading] = useState(false);

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		setLoading(true);
		try {
			const [statsResponse, sharesResponse] = await Promise.all([
				adminAPI.getStatistics(),
				adminAPI.getShares(1, 10)
			]);

			setStats(statsResponse.data);
			setRecentShares(sharesResponse.data.shares.slice(0, 5));
			setTopShares(statsResponse.data.topShares || []);
		} catch (error) {
			// Error handled by interceptor
		} finally {
			setLoading(false);
		}
	};

	const handleCleanup = async () => {
		if (!window.confirm('确定要清理所有已过期的分享吗？')) {
			return;
		}

		setCleanupLoading(true);
		try {
			const response = await adminAPI.cleanupExpired();
			toast.success(response.message);
			fetchData(); // Refresh data
		} catch (error) {
			// Error handled by interceptor
		} finally {
			setCleanupLoading(false);
		}
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString();
	};

	if (loading) {
		return (
			<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="text-center py-8">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<p className="mt-2 text-gray-600">加载中...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
			<div className="px-4 py-6 sm:px-0">
				<div className="flex justify-between items-center mb-6">
					<div>
						<h1 className="text-2xl font-semibold text-gray-900">仪表板</h1>
						<p className="mt-1 text-sm text-gray-600">
							分享笔记系统概览
						</p>
					</div>
					<div className="flex gap-2">
						<button
							onClick={handleCleanup}
							disabled={cleanupLoading}
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<FiTrash2 className="mr-2" />
							{cleanupLoading ? '清理中...' : '清理过期分享'}
						</button>
						<button
							onClick={fetchData}
							className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							<FiRefreshCw className="mr-2" />
							刷新
						</button>
					</div>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<FiFileText className="h-6 w-6 text-gray-400" />
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											总分享数
										</dt>
										<dd className="text-lg font-medium text-gray-900">
											{stats.totalShares || 0}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<FiEye className="h-6 w-6 text-gray-400" />
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											活跃分享数
										</dt>
										<dd className="text-lg font-medium text-gray-900">
											{stats.activeShares || 0}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<FiUsers className="h-6 w-6 text-gray-400" />
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											今日访问量
										</dt>
										<dd className="text-lg font-medium text-gray-900">
											{stats.todayAccesses || 0}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<FiClock className="h-6 w-6 text-gray-400" />
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											过期分享数
										</dt>
										<dd className="text-lg font-medium text-gray-900">
											{stats.expiredShares || 0}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* 最近分享 */}
					<div className="bg-white shadow overflow-hidden sm:rounded-lg">
						<div className="px-4 py-5 sm:px-6">
							<h3 className="text-lg leading-6 font-medium text-gray-900">
								最近分享
							</h3>
							<p className="mt-1 max-w-2xl text-sm text-gray-500">
								最近创建的分享笔记
							</p>
						</div>
						<div className="border-t border-gray-200">
							{recentShares.length === 0 ? (
								<div className="px-4 py-5 sm:p-6 text-center text-gray-500">
									未找到分享
								</div>
							) : (
								<ul className="divide-y divide-gray-200">
									{recentShares.map((share) => (
										<li key={share.share_id}>
											<Link
												to={`/shares/${share.share_id}`}
												className="block hover:bg-gray-50"
											>
												<div className="px-4 py-4 sm:px-6">
													<div className="flex items-center justify-between">
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-2 mb-1">
																<span className="font-mono text-sm text-gray-900 truncate">
																	{share.share_id}
																</span>
															</div>
															<p className="text-sm text-gray-600 truncate">
																{share.content.substring(0, 100)}...
															</p>
														</div>
														<div className="ml-4 text-sm text-gray-500">
															{formatDate(share.created_at)}
														</div>
													</div>
												</div>
											</Link>
										</li>
									))}
								</ul>
							)}
							<div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
								<Link
									to="/shares"
									className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								>
									查看所有分享
								</Link>
							</div>
						</div>
					</div>

					{/* Top Viewed Shares */}
					<div className="bg-white shadow overflow-hidden sm:rounded-lg">
						<div className="px-4 py-5 sm:px-6">
							<h3 className="text-lg leading-6 font-medium text-gray-900">
								最多访问分享
							</h3>
							<p className="mt-1 max-w-2xl text-sm text-gray-500">
								访问次数最多的分享笔记
							</p>
						</div>
						<div className="border-t border-gray-200">
							{topShares.length === 0 ? (
								<div className="px-4 py-5 sm:p-6 text-center text-gray-500">
									暂无数据
								</div>
							) : (
								<ul className="divide-y divide-gray-200">
									{topShares.map((share) => (
										<li key={share.share_id}>
											<Link
												to={`/shares/${share.share_id}`}
												className="block hover:bg-gray-50"
											>
												<div className="px-4 py-4 sm:px-6">
													<div className="flex items-center justify-between">
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-2 mb-1">
																<span className="font-mono text-sm text-gray-900 truncate">
																	{share.share_id}
																</span>
															</div>
															<div className="flex items-center text-sm text-gray-600">
																<FiEye className="mr-1 h-4 w-4" />
																{share.access_count} 次访问
															</div>
														</div>
														<div className="ml-4 text-sm text-gray-500">
															{formatDate(share.created_at)}
														</div>
													</div>
												</div>
											</Link>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				</div>

				{/* Statistics Chart Placeholder */}
				<div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
					<div className="px-4 py-5 sm:px-6">
						<h3 className="text-lg leading-6 font-medium text-gray-900">
							每日分享创建数（最近7天）
						</h3>
					</div>
					<div className="px-4 py-5 sm:p-6">
						{stats.recentShares && stats.recentShares.length > 0 ? (
							<div className="h-64 flex items-center justify-center">
								<div className="w-full">
									<div className="flex items-end h-48 gap-1">
										{stats.recentShares.map((day) => {
											const maxCount = Math.max(...stats.recentShares.map(d => d.count));
											const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
											return (
												<div key={day.date} className="flex-1 flex flex-col items-center">
													<div
														className="w-full bg-blue-600 rounded-t"
														style={{ height: `${height}%` }}
													></div>
													<div className="mt-2 text-xs text-gray-500">
														{day.date.split('-').slice(1).join('/')}
													</div>
													<div className="mt-1 text-xs font-medium">
														{day.count}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							</div>
						) : (
							<div className="text-center py-8 text-gray-500">
								<FiBarChart2 className="mx-auto h-12 w-12 text-gray-400" />
								<p className="mt-2">最近 7 天暂无数据</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
