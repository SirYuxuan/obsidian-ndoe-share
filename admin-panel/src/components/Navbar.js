import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiLogOut, FiHome, FiShare2, FiBarChart2, FiUser } from 'react-icons/fi';

const Navbar = ({ adminProfile, onLogout }) => {
	const navigate = useNavigate();

	const getNavClassName = ({ isActive }) =>
		[
			'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
			isActive
				? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
				: 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
		].join(' ');

	const handleLogout = () => {
		onLogout();
		navigate('/login');
	};

	return (
		<nav className="bg-white shadow-sm border-b border-gray-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16">
					<div className="flex items-center">
						<div className="flex-shrink-0 flex items-center">
							<FiShare2 className="h-8 w-8 text-blue-600" />
							<span className="ml-2 text-xl font-bold text-gray-900">
								分享管理后台
							</span>
						</div>
						<div className="hidden sm:ml-6 sm:flex sm:space-x-8">
							<NavLink
								to="/dashboard"
								className={getNavClassName}
							>
								<FiHome className="mr-2" />
								仪表板
							</NavLink>
							<NavLink
								to="/shares"
								className={getNavClassName}
							>
								<FiShare2 className="mr-2" />
								分享列表
							</NavLink>
							<NavLink
								to="/statistics"
								className={getNavClassName}
							>
								<FiBarChart2 className="mr-2" />
								统计分析
							</NavLink>
							<NavLink
								to="/profile"
								className={getNavClassName}
							>
								<FiUser className="mr-2" />
								个人资料
							</NavLink>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="hidden md:flex flex-col items-end">
							<span className="text-sm font-medium text-gray-900">
								{adminProfile?.nickname || adminProfile?.username || '管理员'}
							</span>
							<span className="text-xs text-gray-500">
								账号：{adminProfile?.username || '未登录'}
							</span>
						</div>
						<button
							onClick={handleLogout}
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
						>
							<FiLogOut className="mr-2" />
							退出登录
						</button>
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
