const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const BUILD_DIR = path.join(__dirname, 'build');

const MIME_TYPES = {
	'.html': 'text/html',
	'.js': 'application/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
	let filePath = req.url === '/' ? '/index.html' : req.url;
	filePath = path.join(BUILD_DIR, filePath);

	const extname = path.extname(filePath);
	const contentType = MIME_TYPES[extname] || 'application/octet-stream';

	fs.readFile(filePath, (error, content) => {
		if (error) {
			if (error.code === 'ENOENT') {
				// Serve index.html for all routes (SPA)
				fs.readFile(path.join(BUILD_DIR, 'index.html'), (error, content) => {
					if (error) {
						res.writeHead(500);
						res.end('Server Error');
					} else {
						res.writeHead(200, { 'Content-Type': 'text/html' });
						res.end(content, 'utf-8');
					}
				});
			} else {
				res.writeHead(500);
				res.end('Server Error');
			}
		} else {
			res.writeHead(200, { 'Content-Type': contentType });
			res.end(content, 'utf-8');
		}
	});
});

server.listen(PORT, () => {
	console.log(`Admin panel server running at http://localhost:${PORT}/`);
	console.log(`Build directory: ${BUILD_DIR}`);
});