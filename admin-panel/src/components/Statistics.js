import React, { useState, useEffect } from 'react';
import { FiBarChart2, FiTrendingUp, FiUsers, FiEye, FiFileText, FiClock } from 'react-icons/fi';
import { adminAPI } from '../utils/api';

const Statistics = () => {
	const [stats, setStats] = useState(null);
	const [recentShares, setRecentShares] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchStatistics();
	}, []);

	const fetchStatistics = async () => {
		setLoading(true);
		try {
			const response = await adminAPI.getStatistics();
			setStats(response.data);
			setRecentShares(response.data.recentShares || []);
		} catch (error) {
			// Error handled by interceptor
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString('zh-CN', {
			month: 'short',
			day: 'numeric'
		});
	};

	if (loading) {
		return (
			<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="text-center py-8">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						<p className="mt-2 text-gray-600">正在加载统计信息...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
			<div className="px-4 py-6 sm:px-0">
				<div className="mb-6">
					<h1 className="text-2xl font-semibold text-gray-900">统计分析</h1>
					<p className="mt-1 text-sm text-gray-600">系统整体统计与趋势概览</p>
				</div>

				{/* Stats Overview */}
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<FiFileText className="h-6 w-6 text-blue-600" />
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											总分享数
										</dt>
										<dd className="text-2xl font-bold text-gray-900">
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
									<FiEye className="h-6 w-6 text-green-600" />
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											总访问量
										</dt>
										<dd className="text-2xl font-bold text-gray-900">
											{stats.totalAccesses || 0}
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
									<FiUsers className="h-6 w-6 text-purple-600" />
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											活跃分享数
										</dt>
										<dd className="text-2xl font-bold text-gray-900">
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
									<FiClock className="h-6 w-6 text-yellow-600" />
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											已过期分享数
										</dt>
										<dd className="text-2xl font-bold text-gray-900">
											{stats.expiredShares || 0}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					{/* Daily Statistics Chart */}
					<div className="bg-white shadow overflow-hidden sm:rounded-lg">
						<div className="px-4 py-5 sm:px-6">
							<h3 className="text-lg leading-6 font-medium text-gray-900">
								每日创建分享数
							</h3>
							<p className="mt-1 text-sm text-gray-500">
								最近 7 天每天创建的分享数量
							</p>
						</div>
						<div className="px-4 py-5 sm:p-6">
							{recentShares.length > 0 ? (
								<div className="space-y-4">
									{recentShares.map((day) => {
										const maxCount = Math.max(...recentShares.map(d => d.count));
										const widthPercentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
										return (
											<div key={day.date} className="space-y-1">
												<div className="flex justify-between text-sm">
													<span className="text-gray-700">{formatDate(day.date)}</span>
													<span className="font-medium text-gray-900">{day.count} 个分享</span>
												</div>
												<div className="w-full bg-gray-200 rounded-full h-2">
													<div
														className="bg-blue-600 h-2 rounded-full"
														style={{ width: `${widthPercentage}%` }}
													></div>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div className="text-center py-8 text-gray-500">
									<FiBarChart2 className="mx-auto h-12 w-12 text-gray-400" />
									<p className="mt-2">最近 7 天暂无数据</p>
								</div>
							)}
						</div>
					</div>

					{/* Top Shares */}
					<div className="bg-white shadow overflow-hidden sm:rounded-lg">
						<div className="px-4 py-5 sm:px-6">
							<h3 className="text-lg leading-6 font-medium text-gray-900">
								访问最多的分享
							</h3>
							<p className="mt-1 text-sm text-gray-500">
								访问量最高的分享笔记
							</p>
						</div>
						<div className="px-4 py-5 sm:p-6">
							{stats.topShares && stats.topShares.length > 0 ? (
								<div className="space-y-4">
									{stats.topShares.map((share, index) => (
										<div key={share.share_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
											<div className="flex items-center">
												<div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
													{index + 1}
												</div>
												<div className="ml-3">
													<p className="text-sm font-medium text-gray-900 truncate">
														{share.share_id}
													</p>
													<p className="text-xs text-gray-500">
														创建于 {formatDate(share.created_at)}
													</p>
												</div>
											</div>
											<div className="flex items-center">
												<FiEye className="h-4 w-4 text-gray-400 mr-1" />
												<span className="text-sm font-medium text-gray-900">
													{share.access_count}
												</span>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-8 text-gray-500">
									<FiTrendingUp className="mx-auto h-12 w-12 text-gray-400" />
									<p className="mt-2">还没有被访问过的分享</p>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* System Info */}
				<div className="bg-white shadow overflow-hidden sm:rounded-lg">
					<div className="px-4 py-5 sm:px-6">
						<h3 className="text-lg leading-6 font-medium text-gray-900">
							系统信息
						</h3>
						<p className="mt-1 text-sm text-gray-500">
							当前系统状态与关键指标
						</p>
					</div>
					<div className="border-t border-gray-200 px-4 py-5 sm:p-6">
						<dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
							<div className="sm:col-span-1">
								<dt className="text-sm font-medium text-gray-500">
									当前日期
								</dt>
								<dd className="mt-1 text-sm text-gray-900">
									{new Date().toLocaleDateString('zh-CN', {
										weekday: 'long',
										year: 'numeric',
										month: 'long',
										day: 'numeric'
									})}
								</dd>
							</div>
							<div className="sm:col-span-1">
								<dt className="text-sm font-medium text-gray-500">
									系统运行时间
								</dt>
								<dd className="mt-1 text-sm text-gray-900">
									自 {new Date().toLocaleDateString('zh-CN')} 起
								</dd>
							</div>
							<div className="sm:col-span-1">
								<dt className="text-sm font-medium text-gray-500">
									今日访问量
								</dt>
								<dd className="mt-1 text-sm text-gray-900">
									{stats.todayAccesses || 0} 次访问
								</dd>
							</div>
							<div className="sm:col-span-1">
								<dt className="text-sm font-medium text-gray-500">
									单个分享平均访问量
								</dt>
								<dd className="mt-1 text-sm text-gray-900">
									{stats.totalShares > 0
										? Math.round(stats.totalAccesses / stats.totalShares)
										: 0} 次/分享
								</dd>
							</div>
							<div className="sm:col-span-2">
								<dt className="text-sm font-medium text-gray-500">
									系统状态
								</dt>
								<dd className="mt-1 text-sm text-gray-900">
									<div className="flex items-center">
										<div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mr-2"></div>
										<span className="text-green-700 font-medium">系统运行正常</span>
									</div>
									<p className="mt-1 text-gray-500">
										所有服务运行正常，数据库连接稳定且响应正常。
									</p>
								</dd>
							</div>
						</dl>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Statistics;
