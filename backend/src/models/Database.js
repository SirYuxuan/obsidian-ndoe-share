const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
	constructor() {
		this.dbPath = process.env.DB_PATH || './data/shares.db';
		this.init();
	}

	init() {
		// Ensure data directory exists
		const dataDir = path.dirname(this.dbPath);
		if (!fs.existsSync(dataDir)) {
			fs.mkdirSync(dataDir, { recursive: true });
		}

		this.db = new sqlite3.Database(this.dbPath, (err) => {
			if (err) {
				console.error('Error opening database:', err);
				return;
			}
			console.log('Connected to SQLite database');
			this.createTables();
		});
	}

	createTables() {
		// Shares table
		this.db.run(`
			CREATE TABLE IF NOT EXISTS shares (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				share_id TEXT UNIQUE NOT NULL,
				title TEXT,
				content TEXT NOT NULL,
				password_hash TEXT,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				expires_at DATETIME,
				access_count INTEGER DEFAULT 0,
				last_accessed_at DATETIME,
				is_active BOOLEAN DEFAULT 1
			)
		`, (err) => {
			if (err) {
				console.error('Error creating shares table:', err);
			} else {
				this.ensureShareColumns();
			}
		});

		// Access logs table
		this.db.run(`
			CREATE TABLE IF NOT EXISTS access_logs (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				share_id TEXT NOT NULL,
				accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				ip_address TEXT,
				user_agent TEXT,
				FOREIGN KEY (share_id) REFERENCES shares (share_id) ON DELETE CASCADE
			)
		`, (err) => {
			if (err) {
				console.error('Error creating access_logs table:', err);
			}
		});

		// Admins table
		this.db.run(`
			CREATE TABLE IF NOT EXISTS admins (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				username TEXT UNIQUE NOT NULL,
				password_hash TEXT NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				last_login_at DATETIME
			)
		`, (err) => {
			if (err) {
				console.error('Error creating admins table:', err);
			} else {
				this.ensureAdminColumns();
				// Ensure the default admin is created only after the admins table exists.
				this.createDefaultAdmin();
			}
		});
	}

	ensureShareColumns() {
		this.db.all('PRAGMA table_info(shares)', (err, columns) => {
			if (err) {
				console.error('Error inspecting shares table:', err);
				return;
			}

			const hasTitleColumn = columns.some((column) => column.name === 'title');
			if (!hasTitleColumn) {
				this.db.run('ALTER TABLE shares ADD COLUMN title TEXT', (alterErr) => {
					if (alterErr) {
						console.error('Error adding title column to shares table:', alterErr);
					}
				});
			}
		});
	}

	ensureAdminColumns() {
		this.db.all('PRAGMA table_info(admins)', (err, columns) => {
			if (err) {
				console.error('Error inspecting admins table:', err);
				return;
			}

			const hasNicknameColumn = columns.some((column) => column.name === 'nickname');
			if (!hasNicknameColumn) {
				this.db.run('ALTER TABLE admins ADD COLUMN nickname TEXT', (alterErr) => {
					if (alterErr) {
						console.error('Error adding nickname column to admins table:', alterErr);
						return;
					}

					this.db.run(
						'UPDATE admins SET nickname = username WHERE nickname IS NULL OR nickname = ""',
						(updateErr) => {
							if (updateErr) {
								console.error('Error filling default admin nicknames:', updateErr);
							}
						}
					);
				});
			}
		});
	}

	createDefaultAdmin() {
		const bcrypt = require('bcryptjs');
		const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
		const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';

		const checkAdminQuery = 'SELECT * FROM admins WHERE username = ?';
		this.db.get(checkAdminQuery, [defaultUsername], (err, row) => {
			if (err) {
				console.error('Error checking admin:', err);
				return;
			}

			if (!row) {
				const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
				const passwordHash = bcrypt.hashSync(defaultPassword, saltRounds);

				const insertQuery = 'INSERT INTO admins (username, nickname, password_hash) VALUES (?, ?, ?)';
				this.db.run(insertQuery, [defaultUsername, defaultUsername, passwordHash], (err) => {
					if (err) {
						console.error('Error creating default admin:', err);
					} else {
						console.log('Default admin created');
					}
				});
			}
		});
	}

	// Share operations
	createShare(shareId, title, content, passwordHash, options = {}) {
		return new Promise((resolve, reject) => {
			const { expireDays = 30, expiresAt: customExpiresAt = null } = options;
			let expiresAt = customExpiresAt;
			if (!expiresAt && expireDays && expireDays > 0) {
				const now = new Date();
				now.setDate(now.getDate() + expireDays);
				expiresAt = now.toISOString();
			}

			const query = `
				INSERT INTO shares (share_id, title, content, password_hash, expires_at)
				VALUES (?, ?, ?, ?, ?)
			`;

			this.db.run(query, [shareId, title, content, passwordHash, expiresAt], function(err) {
				if (err) {
					reject(err);
				} else {
					resolve(this.lastID);
				}
			});
		});
	}

	getShare(shareId) {
		return new Promise((resolve, reject) => {
			const query = 'SELECT * FROM shares WHERE share_id = ? AND is_active = 1';
			this.db.get(query, [shareId], (err, row) => {
				if (err) {
					reject(err);
				} else {
					resolve(row);
				}
			});
		});
	}

	validatePassword(shareId, password) {
		return new Promise((resolve, reject) => {
			const query = 'SELECT password_hash FROM shares WHERE share_id = ? AND is_active = 1';
			this.db.get(query, [shareId], (err, row) => {
				if (err) {
					reject(err);
				} else if (!row || !row.password_hash) {
					resolve(true); // No password required
				} else {
					const bcrypt = require('bcryptjs');
					const isValid = bcrypt.compareSync(password, row.password_hash);
					resolve(isValid);
				}
			});
		});
	}

	recordAccess(shareId, ip, userAgent) {
		return new Promise((resolve, reject) => {
			// Update share access count
			const updateShareQuery = `
				UPDATE shares
				SET access_count = access_count + 1,
					last_accessed_at = CURRENT_TIMESTAMP
				WHERE share_id = ?
			`;

			this.db.run(updateShareQuery, [shareId], (err) => {
				if (err) {
					console.error('Error updating share access count:', err);
				}
			});

			// Log access
			const logQuery = `
				INSERT INTO access_logs (share_id, ip_address, user_agent)
				VALUES (?, ?, ?)
			`;

			this.db.run(logQuery, [shareId, ip, userAgent], function(err) {
				if (err) {
					reject(err);
				} else {
					resolve(this.lastID);
				}
			});
		});
	}

	getAllShares(page = 1, limit = 20) {
		return new Promise((resolve, reject) => {
			const offset = (page - 1) * limit;
			const query = `
				SELECT * FROM shares
				ORDER BY created_at DESC
				LIMIT ? OFFSET ?
			`;

			this.db.all(query, [limit, offset], (err, rows) => {
				if (err) {
					reject(err);
				} else {
					// Get total count
					this.db.get('SELECT COUNT(*) as total FROM shares', (err, countRow) => {
						if (err) {
							reject(err);
						} else {
							resolve({
								shares: rows,
								total: countRow.total,
								page,
								limit,
								totalPages: Math.ceil(countRow.total / limit)
							});
						}
					});
				}
			});
		});
	}

	deleteShare(shareId) {
		return new Promise((resolve, reject) => {
			// Soft delete by setting is_active to 0
			const query = 'UPDATE shares SET is_active = 0 WHERE share_id = ?';
			this.db.run(query, [shareId], function(err) {
				if (err) {
					reject(err);
				} else {
					resolve(this.changes > 0);
				}
			});
		});
	}

	getShareStats() {
		return new Promise((resolve, reject) => {
			const queries = [
				'SELECT COUNT(*) as total FROM shares',
				'SELECT COUNT(*) as active FROM shares WHERE is_active = 1',
				'SELECT COUNT(*) as expired FROM shares WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP',
				'SELECT SUM(access_count) as total_accesses FROM shares',
				'SELECT COUNT(*) as today_access FROM access_logs WHERE DATE(accessed_at) = DATE("now")'
			];

			Promise.all(queries.map(query => {
				return new Promise((resolve, reject) => {
					this.db.get(query, (err, row) => {
						if (err) reject(err);
						else resolve(Object.values(row)[0]);
					});
				});
			}))
			.then(results => {
				resolve({
					totalShares: results[0],
					activeShares: results[1],
					expiredShares: results[2],
					totalAccesses: results[3],
					todayAccesses: results[4]
				});
			})
			.catch(reject);
		});
	}

	// Admin operations
	validateAdmin(username, password) {
		return new Promise((resolve, reject) => {
			const query = 'SELECT * FROM admins WHERE username = ?';
			this.db.get(query, [username], (err, row) => {
				if (err) {
					reject(err);
				} else if (!row) {
					resolve(false);
				} else {
					const bcrypt = require('bcryptjs');
					const isValid = bcrypt.compareSync(password, row.password_hash);
					if (isValid) {
						// Update last login
						this.db.run('UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);
					}
					resolve(isValid);
				}
			});
		});
	}

	getAdminProfile(username) {
		return new Promise((resolve, reject) => {
			const query = `
				SELECT id, username, nickname, created_at, last_login_at
				FROM admins
				WHERE username = ?
			`;
			this.db.get(query, [username], (err, row) => {
				if (err) {
					reject(err);
				} else {
					resolve(row || null);
				}
			});
		});
	}

	updateAdminProfile(currentUsername, { nickname, username, currentPassword, newPassword }) {
		return new Promise((resolve, reject) => {
			const query = 'SELECT * FROM admins WHERE username = ?';
			this.db.get(query, [currentUsername], (err, admin) => {
				if (err) {
					reject(err);
					return;
				}

				if (!admin) {
					resolve({ success: false, error: '管理员账号不存在' });
					return;
				}

				const bcrypt = require('bcryptjs');
				const isValid = bcrypt.compareSync(currentPassword, admin.password_hash);
				if (!isValid) {
					resolve({ success: false, error: '当前密码不正确' });
					return;
				}

				const nextUsername = username.trim();
				const nextNickname = nickname.trim();
				const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
				const nextPasswordHash = newPassword
					? bcrypt.hashSync(newPassword, saltRounds)
					: admin.password_hash;

				const applyUpdate = () => {
					const updateQuery = `
						UPDATE admins
						SET username = ?, nickname = ?, password_hash = ?
						WHERE id = ?
					`;
					this.db.run(
						updateQuery,
						[nextUsername, nextNickname, nextPasswordHash, admin.id],
						(updateErr) => {
							if (updateErr) {
								reject(updateErr);
							} else {
								resolve({
									success: true,
									data: {
										username: nextUsername,
										nickname: nextNickname
									}
								});
							}
						}
					);
				};

				if (nextUsername !== currentUsername) {
					this.db.get(
						'SELECT id FROM admins WHERE username = ? AND id != ?',
						[nextUsername, admin.id],
						(duplicateErr, duplicate) => {
							if (duplicateErr) {
								reject(duplicateErr);
							} else if (duplicate) {
								resolve({ success: false, error: '该账号名已被使用' });
							} else {
								applyUpdate();
							}
						}
					);
				} else {
					applyUpdate();
				}
			});
		});
	}

	close() {
		this.db.close();
	}
}

module.exports = new Database();
