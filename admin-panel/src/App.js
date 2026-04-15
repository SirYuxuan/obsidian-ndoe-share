import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SharesList from './components/SharesList';
import ShareDetail from './components/ShareDetail';
import Statistics from './components/Statistics';
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import { adminAPI, clearAdminToken } from './utils/api';
import './index.css';

function App() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true);
	const [adminProfile, setAdminProfile] = useState(null);

	useEffect(() => {
		const token = localStorage.getItem('adminToken');
		if (!token) {
			setLoading(false);
			return;
		}

		adminAPI.getProfile()
			.then((response) => {
				setAdminProfile(response.data);
				setIsAuthenticated(true);
			})
			.catch(() => {
				clearAdminToken();
				setIsAuthenticated(false);
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	const handleLogin = (profile) => {
		setAdminProfile(profile);
		setIsAuthenticated(true);
	};

	const handleProfileUpdate = (profile) => {
		setAdminProfile(profile);
	};

	const handleLogout = () => {
		clearAdminToken();
		setAdminProfile(null);
		setIsAuthenticated(false);
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg">加载中...</div>
			</div>
		);
	}

	return (
		<Router>
			<div className="min-h-screen bg-gray-50">
				{isAuthenticated && <Navbar adminProfile={adminProfile} onLogout={handleLogout} />}
				<Routes>
					<Route
						path="/login"
						element={
							isAuthenticated ? (
								<Navigate to="/dashboard" />
							) : (
								<Login onLogin={handleLogin} />
							)
						}
					/>
					<Route
						path="/dashboard"
						element={
							isAuthenticated ? (
								<Dashboard />
							) : (
								<Navigate to="/login" />
							)
						}
					/>
					<Route
						path="/shares"
						element={
							isAuthenticated ? (
								<SharesList />
							) : (
								<Navigate to="/login" />
							)
						}
					/>
					<Route
						path="/shares/:shareId"
						element={
							isAuthenticated ? (
								<ShareDetail />
							) : (
								<Navigate to="/login" />
							)
						}
					/>
					<Route
						path="/statistics"
						element={
							isAuthenticated ? (
								<Statistics />
							) : (
								<Navigate to="/login" />
							)
						}
					/>
					<Route
						path="/profile"
						element={
							isAuthenticated ? (
								<Profile adminProfile={adminProfile} onProfileUpdate={handleProfileUpdate} />
							) : (
								<Navigate to="/login" />
							)
						}
					/>
					<Route
						path="/"
						element={
							isAuthenticated ? (
								<Navigate to="/dashboard" />
							) : (
								<Navigate to="/login" />
							)
						}
					/>
				</Routes>
			</div>
		</Router>
	);
}

export default App;
