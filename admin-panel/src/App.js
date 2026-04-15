import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SharesList from './components/SharesList';
import ShareDetail from './components/ShareDetail';
import Statistics from './components/Statistics';
import Navbar from './components/Navbar';
import './index.css';

function App() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Check if user is already authenticated
		const token = localStorage.getItem('adminToken');
		if (token) {
			setIsAuthenticated(true);
		}
		setLoading(false);
	}, []);

	const handleLogin = (username) => {
		// Authentication is already handled by adminAPI.login which stores the token
		setIsAuthenticated(true);
	};

	const handleLogout = () => {
		localStorage.removeItem('adminToken');
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
				{isAuthenticated && <Navbar onLogout={handleLogout} />}
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
