import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI, setAdminToken } from '../utils/api';

const Profile = ({ adminProfile, onProfileUpdate }) => {
	const [formData, setFormData] = useState({
		nickname: '',
		username: '',
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	});
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!adminProfile) {
			return;
		}

		setFormData((prev) => ({
			...prev,
			nickname: adminProfile.nickname || '',
			username: adminProfile.username || '',
			currentPassword: '',
			newPassword: '',
			confirmPassword: ''
		}));
	}, [adminProfile]);

	const handleChange = (event) => {
		const { name, value } = event.target;
		setFormData((prev) => ({
			...prev,
			[name]: value
		}));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
			toast.error('两次输入的新密码不一致');
			return;
		}

		setLoading(true);
		try {
			const response = await adminAPI.updateProfile(formData);
			const nextPassword = formData.newPassword || formData.currentPassword;
			setAdminToken(response.data.username, nextPassword);
			onProfileUpdate(response.data);
			setFormData((prev) => ({
				...prev,
				currentPassword: '',
				newPassword: '',
				confirmPassword: ''
			}));
			toast.success('个人资料已更新');
		} catch (error) {
			// Error handled by interceptor
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
			<div className="px-4 py-6 sm:px-0">
				<div className="mb-6">
					<h1 className="text-2xl font-semibold text-gray-900">个人资料</h1>
					<p className="mt-1 text-sm text-gray-600">
						在这里修改昵称、登录账号和密码。
					</p>
				</div>

				<div className="card">
					<form className="space-y-6" onSubmit={handleSubmit}>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="nickname">
									昵称
								</label>
								<input
									id="nickname"
									name="nickname"
									type="text"
									className="input"
									value={formData.nickname}
									onChange={handleChange}
									disabled={loading}
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="username">
									账号
								</label>
								<input
									id="username"
									name="username"
									type="text"
									className="input"
									value={formData.username}
									onChange={handleChange}
									disabled={loading}
									required
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="currentPassword">
									当前密码
								</label>
								<input
									id="currentPassword"
									name="currentPassword"
									type="password"
									className="input"
									placeholder="保存资料时必须输入当前密码"
									value={formData.currentPassword}
									onChange={handleChange}
									disabled={loading}
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="newPassword">
									新密码
								</label>
								<input
									id="newPassword"
									name="newPassword"
									type="password"
									className="input"
									placeholder="不修改密码可留空"
									value={formData.newPassword}
									onChange={handleChange}
									disabled={loading}
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="confirmPassword">
								确认新密码
							</label>
							<input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								className="input"
								placeholder="再次输入新密码"
								value={formData.confirmPassword}
								onChange={handleChange}
								disabled={loading}
							/>
						</div>

						<div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
							修改账号或密码后，当前浏览器会自动更新登录状态。
						</div>

						<div className="flex justify-end">
							<button
								type="submit"
								disabled={loading}
								className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{loading ? '保存中...' : '保存资料'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Profile;
