import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with basic auth
const createApiClient = () => {
	const instance = axios.create({
		baseURL: API_BASE_URL,
		headers: {
			'Content-Type': 'application/json',
		},
	});

	// Add auth header
	instance.interceptors.request.use((config) => {
		const token = localStorage.getItem('adminToken');
		if (token) {
			config.headers.Authorization = `Basic ${token}`;
		}
		return config;
	});

	// Handle responses
	instance.interceptors.response.use(
		(response) => response.data,
		(error) => {
			if (error.response) {
				const message = error.response.data?.error || '发生错误，请稍后重试';
				toast.error(message);
			} else if (error.request) {
				toast.error('网络异常，请检查服务或网络连接');
			} else {
				toast.error('发生错误，请稍后重试');
			}
			return Promise.reject(error);
		}
	);

	return instance;
};

const api = createApiClient();

// Admin API
export const adminAPI = {
	login: (username, password) => {
		// 创建Basic Auth token
		const token = btoa(`${username}:${password}`);
		// 存储到localStorage
		localStorage.setItem('adminToken', token);
		return api.post('/admin/login', { username, password });
	},

	getShares: (page = 1, limit = 20, search = '') => {
		return api.get('/admin/shares', {
			params: { page, limit, search }
		});
	},

	getShareDetails: (shareId) => {
		return api.get(`/admin/shares/${shareId}`);
	},

	deleteShare: (shareId) => {
		return api.delete(`/admin/shares/${shareId}`);
	},

	getStatistics: () => {
		return api.get('/admin/stats');
	},

	cleanupExpired: () => {
		return api.post('/admin/cleanup');
	}
};

// Public API (for testing)
export const publicAPI = {
	createShare: (content, password, expireDays) => {
		return api.post('/shares', { content, password, expireDays });
	},

	getShare: (shareId, password = '') => {
		return api.get(`/shares/${shareId}`, {
			params: { password }
		});
	},

	checkShareExists: (shareId) => {
		return api.head(`/shares/${shareId}`);
	},

	requiresPassword: (shareId) => {
		return api.get(`/shares/${shareId}/requires-password`);
	},

	getShareStats: (shareId) => {
		return api.get(`/shares/${shareId}/stats`);
	}
};

export default api;
