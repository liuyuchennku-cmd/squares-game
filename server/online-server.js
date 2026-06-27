const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8090);
const ROOT = path.resolve(__dirname, '..');
const rooms = new Map();

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
};

function sendJson(res, status, data) {
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(data));
}

function readJson(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 5 * 1024 * 1024) {
                reject(new Error('请求体过大'));
                req.destroy();
            }
        });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}

function makeId(length = 4) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < length; i += 1) {
        id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return id;
}

function makeRoomId() {
    let id = makeId();
    while (rooms.has(id)) id = makeId();
    return id;
}

function getColorsForMode(mode) {
    return Number(mode) === 2 ? ['blue', 'yellow'] : ['blue', 'yellow', 'red', 'green'];
}

function publicRoom(room) {
    return {
        roomId: room.roomId,
        mode: room.mode,
        boardSize: room.boardSize,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        clients: Array.from(room.clients.values()).map(publicClient)
    };
}

function publicClient(client) {
    return {
        clientId: client.clientId,
        name: client.name,
        color: client.color,
        host: client.host,
        connected: client.connected,
        lastSeen: client.lastSeen
    };
}

function assignColor(room) {
    const colors = getColorsForMode(room.mode);
    const used = new Set(Array.from(room.clients.values()).map((client) => client.color).filter(Boolean));
    return colors.find((color) => !used.has(color)) || null;
}

function sendEvent(res, type, payload) {
    if (res.destroyed || res.writableEnded) return false;
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    return true;
}

function broadcast(room, type, payload) {
    for (const client of room.clients.values()) {
        if (!client.stream) continue;
        try {
            if (!sendEvent(client.stream, type, payload)) {
                client.stream = null;
                client.connected = false;
            }
        } catch (error) {
            client.stream = null;
            client.connected = false;
        }
    }
}

function touchClient(client, connected = client.connected) {
    client.connected = connected;
    client.lastSeen = Date.now();
}

function createClient(room, name, host = false, existingClientId = null) {
    const clientId = existingClientId || makeId(10);
    const client = {
        clientId,
        name: name || `玩家${room.clients.size + 1}`,
        color: host ? getColorsForMode(room.mode)[0] : assignColor(room),
        host,
        connected: false,
        lastSeen: Date.now(),
        stream: null
    };
    room.clients.set(clientId, client);
    return client;
}

function getCurrentSnapshotPlayer(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.players)) return null;
    return snapshot.players[snapshot.currentPlayerIndex] || null;
}

function cleanupDeadStreams() {
    const now = Date.now();
    for (const room of rooms.values()) {
        for (const client of room.clients.values()) {
            if (client.connected && now - client.lastSeen > 90_000) {
                client.connected = false;
                client.stream = null;
            }
        }
    }
}

setInterval(cleanupDeadStreams, 30_000).unref();

function serveStatic(req, res, url) {
    const rawPath = decodeURIComponent(url.pathname === '/' ? '/online.html' : url.pathname);
    const safePath = path.normalize(rawPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(ROOT, safePath);

    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (error, data) => {
        if (error) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Cache-Control': 'no-store'
        });
        res.end(data);
    });
}

async function handleApi(req, res, url) {
    const parts = url.pathname.split('/').filter(Boolean);

    if (req.method === 'POST' && url.pathname === '/api/rooms') {
        const body = await readJson(req);
        const roomId = makeRoomId();
        const mode = Number(body.mode) === 2 ? 2 : 4;
        const boardSize = body.boardSize || (mode === 2 ? '10x20' : '20x20');
        const room = {
            roomId,
            mode,
            boardSize,
            snapshot: body.snapshot,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            clients: new Map()
        };
        const client = createClient(room, body.name, true);
        rooms.set(roomId, room);
        sendJson(res, 201, { room: publicRoom(room), client: publicClient(client), snapshot: room.snapshot });
        return;
    }

    if (parts[0] !== 'api' || parts[1] !== 'rooms' || !parts[2]) {
        sendJson(res, 404, { error: 'API 不存在' });
        return;
    }

    const room = rooms.get(parts[2].toUpperCase());
    if (!room) {
        sendJson(res, 404, { error: '房间不存在或已过期' });
        return;
    }

    if (req.method === 'GET' && parts.length === 3) {
        sendJson(res, 200, { room: publicRoom(room), snapshot: room.snapshot });
        return;
    }

    if (req.method === 'POST' && parts[3] === 'join') {
        const body = await readJson(req);
        const color = assignColor(room);
        const client = createClient(room, body.name, false);
        client.color = color;
        room.updatedAt = Date.now();
        broadcast(room, 'room', publicRoom(room));
        sendJson(res, 200, { room: publicRoom(room), client: publicClient(client), snapshot: room.snapshot });
        return;
    }

    if (req.method === 'GET' && parts[3] === 'reconnect') {
        const clientId = url.searchParams.get('clientId');
        const client = room.clients.get(clientId);
        if (!client) {
            sendJson(res, 404, { error: '未找到该玩家，请重新加入房间' });
            return;
        }
        touchClient(client, false);
        sendJson(res, 200, { room: publicRoom(room), client: publicClient(client), snapshot: room.snapshot });
        return;
    }

    if (req.method === 'GET' && parts[3] === 'events') {
        const clientId = url.searchParams.get('clientId');
        const client = room.clients.get(clientId);
        if (!client) {
            sendJson(res, 404, { error: '未找到该玩家' });
            return;
        }

        res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-store',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no'
        });
        res.write('\n');

        client.stream = res;
        touchClient(client, true);
        sendEvent(res, 'hello', { room: publicRoom(room), client: publicClient(client), snapshot: room.snapshot });
        broadcast(room, 'room', publicRoom(room));

        const heartbeat = setInterval(() => {
            touchClient(client, true);
            sendEvent(res, 'ping', { now: Date.now() });
        }, 20_000);

        req.on('close', () => {
            clearInterval(heartbeat);
            client.stream = null;
            touchClient(client, false);
            broadcast(room, 'room', publicRoom(room));
        });
        return;
    }

    if (req.method === 'POST' && parts[3] === 'snapshot') {
        const body = await readJson(req);
        const client = room.clients.get(body.clientId);
        if (!client) {
            sendJson(res, 403, { error: '玩家身份无效' });
            return;
        }
        if (['START_GAME', 'RESET_GAME', 'END_GAME'].includes(body.actionType) && !client.host) {
            sendJson(res, 403, { error: '只有房主可以切换棋盘、重开或结束游戏' });
            return;
        }

        const turnActions = new Set(['SELECT_PIECE', 'ROTATE_PIECE', 'FLIP_PIECE', 'PLACE_PIECE', 'PASS_TURN', 'AUTO_SKIP_REST']);
        if (turnActions.has(body.actionType)) {
            const currentPlayer = getCurrentSnapshotPlayer(room.snapshot);
            if (!client.color || currentPlayer?.color !== client.color) {
                sendJson(res, 403, { error: '还没轮到你的颜色，不能提交本次操作' });
                return;
            }
        }

        if (!body.snapshot) {
            sendJson(res, 400, { error: '缺少对局快照' });
            return;
        }

        if (['START_GAME', 'RESET_GAME'].includes(body.actionType)) {
            room.mode = body.snapshot.mode;
            room.boardSize = body.snapshot.boardSize;
        }

        if (body.snapshot?.mode !== room.mode || body.snapshot?.boardSize !== room.boardSize) {
            sendJson(res, 400, { error: '对局快照与房间模式不一致' });
            return;
        }

        room.snapshot = body.snapshot;
        room.updatedAt = Date.now();
        touchClient(client, true);
        broadcast(room, 'snapshot', {
            snapshot: room.snapshot,
            room: publicRoom(room),
            originClientId: client.clientId,
            actionType: body.actionType
        });
        sendJson(res, 200, { ok: true, room: publicRoom(room) });
        return;
    }

    sendJson(res, 404, { error: 'API 不存在' });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    try {
        if (url.pathname.startsWith('/api/')) {
            await handleApi(req, res, url);
            return;
        }
        serveStatic(req, res, url);
    } catch (error) {
        if (res.headersSent) {
            res.end();
            return;
        }
        sendJson(res, 500, { error: error.message || '服务器错误' });
    }
});

server.listen(PORT, () => {
    console.log(`方格游戏联机版已启动：http://localhost:${PORT}/online.html`);
});
