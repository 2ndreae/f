const http = require("http");
const fs = require("fs");
const WebSocket = require("ws");

// HTTP 서버 생성
const server = http.createServer((req, res) => {
    const fileMap = {
        "/": "index.html",
        "/index.html": "index.html",
        "/script.js": "script.js",
        "/player.png": "player.png",
        "/player0.png": "player0.png",
        "/background.png": "background.png"
    };

    const filePath = fileMap[req.url];

    if (filePath) {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Internal Server Error");
            } else {
                const contentType = req.url.endsWith(".png") ? "image/png" : "text/html";
                res.writeHead(200, { "Content-Type": contentType });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    }
});

const wss = new WebSocket.Server({ server });

let avatars = {};
let clientId = 0;

wss.on("connection", (ws) => {
    const userId = `user_${clientId++}`;
    avatars[userId] = { x: 200, y: 200, gender: null, username: `익명_${clientId}` };

    ws.send(JSON.stringify({ avatars }));

    ws.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.username) {
            avatars[userId].username = data.username; // ✅ 사용자 이름 저장!
        }

        if (data.gender) {
            avatars[userId].gender = data.gender;
        }

        if (data.dx !== undefined && data.dy !== undefined) {
            avatars[userId].x = Math.max(0, Math.min(380, avatars[userId].x + data.dx));
            avatars[userId].y = Math.max(0, Math.min(380, avatars[userId].y + data.dy));
        }

        if (data.message) {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ message: `${avatars[userId].username}: ${data.message}` }));
                }
            });
        }

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ avatars }));
            }
        });
    });

    ws.on("close", () => {
        delete avatars[userId];
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ avatars }));
            }
        });
    });
});

server.listen(8000, () => {
    console.log("Server is running on http://localhost:8000");
});
