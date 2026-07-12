const SKIN_FOLDERS = {
    base: null,
    classic: 'crystal_pieces_transparent',
    ocean: 'water_vein_v2_pieces_transparent_512',
    forest: 'vine_pieces_transparent',
    ember: 'lava_pieces_transparent',
    neon: 'neon_pieces_transparent',
    glowing_mycelium: 'glowing_mycelium_pieces_transparent_512',
    rope_knots: 'rope_knots_v2_pieces_transparent_512',
    star_constellation: 'star_constellation_v2_pieces_transparent_512',
    thunder_pulse: 'thunder_pulse_pieces_transparent_512',
    vine_path: 'vine_path_v2_pieces_transparent_512',
    carved_wood: null
};

const PROCEDURAL_SKINS = {
    carved_wood: './assets/skins/carved_wood_tile.png'
};

const PIECE_FILES = {
    p01: '01_single.png',
    p02: '02_line2.png',
    p03: '03_line3.png',
    p04: '04_L3.png',
    p05: '05_line4.png',
    p06: '06_square.png',
    p07: '07_T4.png',
    p08: '08_L4.png',
    p09: '09_S4.png',
    p10: '10_line5.png',
    p11: '11_4plus1_left.png',
    p12: '12_N.png',
    p13: '13_P.png',
    p14: '14_U.png',
    p15: '15_V.png',
    p16: '16_4plus1_second.png',
    p17: '17_lightning.png',
    p18: '18_T5.png',
    p19: '19_cross.png',
    p20: '20_Z5.png',
    p21: '21_F.png'
};

const PIECE_CELLS = {
    p01: [[0, 0]], p02: [[0, 0], [0, 1]], p03: [[0, 0], [0, 1], [0, 2]],
    p04: [[0, 0], [1, 0], [1, 1]], p05: [[0, 0], [0, 1], [0, 2], [0, 3]],
    p06: [[0, 0], [0, 1], [1, 0], [1, 1]], p07: [[0, 1], [1, 0], [1, 1], [1, 2]],
    p08: [[0, 0], [1, 0], [2, 0], [2, 1]], p09: [[0, 1], [0, 2], [1, 0], [1, 1]],
    p10: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], p11: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0]],
    p12: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]], p13: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]],
    p14: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]], p15: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
    p16: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 1]], p17: [[0, 2], [0, 3], [1, 0], [1, 1], [1, 2]],
    p18: [[0, 1], [1, 1], [2, 0], [2, 1], [2, 2]], p19: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
    p20: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]], p21: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]]
};

const ART_BOUNDS = new Map();
const ART_BOUND_REQUESTS = new Map();
const OPAQUE_PIXEL_ALPHA = 128;
const ART_CONTENT_SCALE = 1.25;
const REDUCED_ART_SCALE = 1.08;
const REDUCED_ART_SKINS = new Set([
    'classic', 'ocean', 'forest', 'ember', 'neon', 'glowing_mycelium',
    'rope_knots', 'thunder_pulse'
]);

const BASE_PLAYER_THEMES = {
    blue: { accent: '#218be0', deep: '#0d5ca8' },
    yellow: { accent: '#f6b41d', deep: '#a66808' },
    red: { accent: '#e45a4f', deep: '#9c302c' },
    green: { accent: '#46a755', deep: '#28793a' }
};

const SKIN_ACCENTS = {
    classic: '#4bb9ff',
    ocean: '#0891b2',
    forest: '#15803d',
    ember: '#ea580c',
    neon: '#e64bff',
    glowing_mycelium: '#b9f35a',
    rope_knots: '#c18b51',
    star_constellation: '#789aff',
    thunder_pulse: '#2f6de0',
    vine_path: '#55a841',
    carved_wood: '#a4581c'
};

function ensureStyles() {
    if (document.getElementById('square-game-piece-art-styles')) return;

    const style = document.createElement('style');
    style.id = 'square-game-piece-art-styles';
    style.textContent = `
        .mini-piece-art {
            display: block;
            height: 58px;
            object-fit: contain;
            pointer-events: none;
            width: 100%;
        }
        .board-cell.has-piece-art {
            background-repeat: no-repeat;
        }
        .board {
            position: relative;
        }
        .board-piece-art {
            overflow: hidden;
            pointer-events: none;
            position: absolute;
            z-index: 3;
        }
        .board-piece-art img {
            display: block;
            max-width: none;
            position: absolute;
        }
        .procedural-piece-art {
            display: grid;
            gap: 2px;
            justify-content: center;
            justify-self: center;
            pointer-events: none;
        }
        .procedural-piece-cell {
            aspect-ratio: 1;
            background: var(--piece-tile) center / 100% 100% no-repeat;
            border-radius: 3px;
            width: 14px;
        }
        .skin-preview .procedural-piece-art {
            transform: scale(1.4);
        }
        html[data-player-skin-indicators="true"] body .player-card.blue { background: var(--skin-card-blue) !important; color: var(--skin-card-blue-text) !important; }
        html[data-player-skin-indicators="true"] body .player-card.yellow { background: var(--skin-card-yellow) !important; color: var(--skin-card-yellow-text) !important; }
        html[data-player-skin-indicators="true"] body .player-card.red { background: var(--skin-card-red) !important; color: var(--skin-card-red-text) !important; }
        html[data-player-skin-indicators="true"] body .player-card.green { background: var(--skin-card-green) !important; color: var(--skin-card-green-text) !important; }
        html[data-player-skin-indicators="true"] body .board-cell.start-corner.start-blue {
            --corner-color: var(--skin-corner-blue);
            --corner-fill: var(--skin-corner-blue-soft);
            background: var(--skin-corner-blue-faint) !important;
        }
        html[data-player-skin-indicators="true"] body .board-cell.start-corner.start-yellow {
            --corner-color: var(--skin-corner-yellow);
            --corner-fill: var(--skin-corner-yellow-soft);
            background: var(--skin-corner-yellow-faint) !important;
        }
        html[data-player-skin-indicators="true"] body .board-cell.start-corner.start-red {
            --corner-color: var(--skin-corner-red);
            --corner-fill: var(--skin-corner-red-soft);
            background: var(--skin-corner-red-faint) !important;
        }
        html[data-player-skin-indicators="true"] body .board-cell.start-corner.start-green {
            --corner-color: var(--skin-corner-green);
            --corner-fill: var(--skin-corner-green-soft);
            background: var(--skin-corner-green-faint) !important;
        }
        html[data-player-skin-indicators="true"] body .board-cell.preview.blue:not(.invalid) { background: var(--skin-preview-blue) !important; outline-color: var(--skin-corner-blue) !important; }
        html[data-player-skin-indicators="true"] body .board-cell.preview.yellow:not(.invalid) { background: var(--skin-preview-yellow) !important; outline-color: var(--skin-corner-yellow) !important; }
        html[data-player-skin-indicators="true"] body .board-cell.preview.red:not(.invalid) { background: var(--skin-preview-red) !important; outline-color: var(--skin-corner-red) !important; }
        html[data-player-skin-indicators="true"] body .board-cell.preview.green:not(.invalid) { background: var(--skin-preview-green) !important; outline-color: var(--skin-corner-green) !important; }
        html[data-player-skin-indicators="true"] body .score-dot.blue { background: var(--skin-indicator-blue) !important; }
        html[data-player-skin-indicators="true"] body .score-dot.yellow { background: var(--skin-indicator-yellow) !important; }
        html[data-player-skin-indicators="true"] body .score-dot.red { background: var(--skin-indicator-red) !important; }
        html[data-player-skin-indicators="true"] body .score-dot.green { background: var(--skin-indicator-green) !important; }
    `;
    document.head.appendChild(style);
}

export function normalizeSkinId(skinId) {
    return Object.prototype.hasOwnProperty.call(SKIN_FOLDERS, skinId) ? skinId : 'base';
}

function rgba(hex, alpha) {
    const value = hex.replace('#', '');
    const red = Number.parseInt(value.slice(0, 2), 16);
    const green = Number.parseInt(value.slice(2, 4), 16);
    const blue = Number.parseInt(value.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function darken(hex, ratio) {
    const value = hex.replace('#', '');
    const channel = (offset) => Math.round(Number.parseInt(value.slice(offset, offset + 2), 16) * ratio)
        .toString(16)
        .padStart(2, '0');
    return `#${channel(0)}${channel(2)}${channel(4)}`;
}

function useDarkCardText(hex) {
    const value = hex.replace('#', '');
    const red = Number.parseInt(value.slice(0, 2), 16);
    const green = Number.parseInt(value.slice(2, 4), 16);
    const blue = Number.parseInt(value.slice(4, 6), 16);
    return (red * 299 + green * 587 + blue * 114) / 1000 > 164;
}

export function getPlayerSkinAccent(skinId, color = 'blue') {
    const normalizedSkinId = normalizeSkinId(skinId);
    return normalizedSkinId === 'base'
        ? (BASE_PLAYER_THEMES[color] || BASE_PLAYER_THEMES.blue).accent
        : SKIN_ACCENTS[normalizedSkinId];
}

export function applyPlayerSkinIndicators(players = [], getSkinIdForColor = () => 'base') {
    ensureStyles();
    const root = document.documentElement;
    const skinByColor = new Map(players.map((player) => [player.color, player.skinId || getSkinIdForColor(player.color)]));

    Object.keys(BASE_PLAYER_THEMES).forEach((color) => {
        const skinId = skinByColor.get(color) || getSkinIdForColor(color);
        const accent = getPlayerSkinAccent(skinId, color);
        const deep = normalizeSkinId(skinId) === 'base'
            ? BASE_PLAYER_THEMES[color].deep
            : darken(accent, 0.62);

        root.style.setProperty(`--skin-indicator-${color}`, accent);
        root.style.setProperty(`--skin-preview-${color}`, rgba(accent, 0.72));
        root.style.setProperty(`--skin-corner-${color}`, rgba(accent, 0.8));
        root.style.setProperty(`--skin-corner-${color}-soft`, rgba(accent, 0.2));
        root.style.setProperty(`--skin-corner-${color}-faint`, rgba(accent, 0.08));
        root.style.setProperty(`--skin-card-${color}`, `linear-gradient(135deg, ${deep}, ${accent})`);
        root.style.setProperty(`--skin-card-${color}-text`, useDarkCardText(accent) ? '#271a00' : '#ffffff');
    });

    root.dataset.playerSkinIndicators = 'true';
}

export function getPieceAssetPath(skinId, pieceId) {
    const normalizedSkinId = normalizeSkinId(skinId);
    if (PROCEDURAL_SKINS[normalizedSkinId]) return PROCEDURAL_SKINS[normalizedSkinId];
    if (normalizedSkinId === 'base') return '';
    const folder = SKIN_FOLDERS[normalizedSkinId];
    const file = PIECE_FILES[pieceId];
    return file ? `./assets/skins/${folder}/${file}` : '';
}

export function renderPieceArt(pieceId, skinId, label) {
    ensureStyles();
    const normalizedSkinId = normalizeSkinId(skinId);
    if (PROCEDURAL_SKINS[normalizedSkinId]) {
        return renderProceduralPieceArt(pieceId, label, PROCEDURAL_SKINS[normalizedSkinId]);
    }
    const source = getPieceAssetPath(skinId, pieceId);
    if (!source) return '';
    return `<img class="mini-piece-art" src="${source}" alt="${label || ''}" draggable="false">`;
}

function renderProceduralPieceArt(pieceId, label, tileSource) {
    const cells = PIECE_CELLS[pieceId];
    if (!cells) return '';

    const rows = Math.max(...cells.map(([row]) => row)) + 1;
    const cols = Math.max(...cells.map(([, col]) => col)) + 1;
    const occupied = new Set(cells.map(([row, col]) => `${row},${col}`));
    let html = `<span class="procedural-piece-art" style="--piece-tile:url('${tileSource}');grid-template-columns:repeat(${cols},14px)" role="img" aria-label="${label || ''}">`;

    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            html += occupied.has(`${row},${col}`) ? '<span class="procedural-piece-cell"></span>' : '<span></span>';
        }
    }

    return `${html}</span>`;
}

function getPieceGroups(board) {
    const groups = [];
    const visited = new Set();
    const keyFor = (row, col) => `${row},${col}`;

    for (let row = 0; row < board.length; row += 1) {
        for (let col = 0; col < board[row].length; col += 1) {
            const start = board[row][col];
            if (!start?.color || !start?.pieceId || visited.has(keyFor(row, col))) continue;

            const cells = [];
            const queue = [[row, col]];
            visited.add(keyFor(row, col));

            while (queue.length) {
                const [currentRow, currentCol] = queue.pop();
                cells.push([currentRow, currentCol]);

                for (const [nextRow, nextCol] of [
                    [currentRow - 1, currentCol],
                    [currentRow + 1, currentCol],
                    [currentRow, currentCol - 1],
                    [currentRow, currentCol + 1]
                ]) {
                    const next = board[nextRow]?.[nextCol];
                    const nextKey = keyFor(nextRow, nextCol);
                    if (
                        next
                        && next.color === start.color
                        && next.pieceId === start.pieceId
                        && !visited.has(nextKey)
                    ) {
                        visited.add(nextKey);
                        queue.push([nextRow, nextCol]);
                    }
                }
            }

            groups.push({ color: start.color, pieceId: start.pieceId, cells });
        }
    }

    return groups;
}

function findOpaqueBounds(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width;
    let top = canvas.height;
    let right = -1;
    let bottom = -1;

    for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
            if (pixels[(y * canvas.width + x) * 4 + 3] <= OPAQUE_PIXEL_ALPHA) continue;
            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x);
            bottom = Math.max(bottom, y);
        }
    }

    if (right < left || bottom < top) {
        return { imageWidth: canvas.width, imageHeight: canvas.height, left: 0, top: 0, width: canvas.width, height: canvas.height };
    }

    return {
        imageWidth: canvas.width,
        imageHeight: canvas.height,
        left,
        top,
        width: right - left + 1,
        height: bottom - top + 1
    };
}

function requestArtBounds(source) {
    if (ART_BOUNDS.has(source)) return Promise.resolve(ART_BOUNDS.get(source));
    if (ART_BOUND_REQUESTS.has(source)) return ART_BOUND_REQUESTS.get(source);

    const request = new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            let bounds = null;
            try {
                bounds = findOpaqueBounds(image);
            } catch (error) {
                // The untrimmed image remains a graceful fallback.
            }
            ART_BOUNDS.set(source, bounds);
            resolve(bounds);
        };
        image.onerror = () => {
            ART_BOUNDS.set(source, null);
            resolve(null);
        };
        image.src = source;
    });

    ART_BOUND_REQUESTS.set(source, request);
    return request;
}

function renderGroupArt(boardElement, group, source, bounds, contentScale) {
    if (!bounds) return;

    const cells = group.cells.map(([row, col]) => boardElement.querySelector(`.board-cell[data-row="${row}"][data-col="${col}"]`));
    if (cells.some((cell) => !cell)) return;

    const boardRect = boardElement.getBoundingClientRect();
    const cellRects = cells.map((cell) => cell.getBoundingClientRect());
    const left = Math.min(...cellRects.map((rect) => rect.left));
    const top = Math.min(...cellRects.map((rect) => rect.top));
    const right = Math.max(...cellRects.map((rect) => rect.right));
    const bottom = Math.max(...cellRects.map((rect) => rect.bottom));
    const width = right - left;
    const height = bottom - top;

    cells.forEach((cell) => {
        cell.classList.add('has-piece-art');
        cell.style.setProperty('background-color', 'var(--empty)', 'important');
        cell.style.setProperty('background-image', 'none', 'important');
        cell.style.setProperty('box-shadow', 'none', 'important');
    });

    const croppedBounds = {
        ...bounds,
        left: bounds.left + bounds.width * (1 - 1 / contentScale) / 2,
        top: bounds.top + bounds.height * (1 - 1 / contentScale) / 2,
        width: bounds.width / contentScale,
        height: bounds.height / contentScale
    };
    const layer = document.createElement('div');
    const image = document.createElement('img');
    const scaleX = width / croppedBounds.width;
    const scaleY = height / croppedBounds.height;

    layer.className = 'board-piece-art';
    layer.style.left = `${left - boardRect.left}px`;
    layer.style.top = `${top - boardRect.top}px`;
    layer.style.width = `${width}px`;
    layer.style.height = `${height}px`;

    image.src = source;
    image.alt = '';
    image.draggable = false;
    image.style.left = `${-croppedBounds.left * scaleX}px`;
    image.style.top = `${-croppedBounds.top * scaleY}px`;
    image.style.width = `${bounds.imageWidth * scaleX}px`;
    image.style.height = `${bounds.imageHeight * scaleY}px`;
    layer.appendChild(image);
    boardElement.appendChild(layer);
}

function renderProceduralBoardGroup(boardElement, group, tileSource) {
    group.cells.forEach(([row, col]) => {
        const cell = boardElement.querySelector(`.board-cell[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;

        cell.classList.add('has-piece-art');
        cell.style.setProperty('background-color', 'var(--empty)', 'important');
        cell.style.setProperty('background-image', `url("${tileSource}")`, 'important');
        cell.style.setProperty('background-size', '100% 100%', 'important');
        cell.style.setProperty('background-position', 'center', 'important');
        cell.style.setProperty('background-repeat', 'no-repeat', 'important');
        cell.style.setProperty('box-shadow', 'none', 'important');
    });
}

export function applyBoardPieceArt(boardElement, board, getSkinIdForColor) {
    ensureStyles();
    if (!boardElement || !Array.isArray(board)) return;

    const version = String(Number(boardElement.dataset.pieceArtVersion || 0) + 1);
    boardElement.dataset.pieceArtVersion = version;
    boardElement.querySelectorAll('.board-piece-art').forEach((layer) => layer.remove());

    getPieceGroups(board).forEach((group) => {
        const skinId = normalizeSkinId(getSkinIdForColor(group.color));
        const proceduralTile = PROCEDURAL_SKINS[skinId];
        if (proceduralTile) {
            renderProceduralBoardGroup(boardElement, group, proceduralTile);
            return;
        }

        const source = getPieceAssetPath(skinId, group.pieceId);

        if (!source) return;
        const contentScale = REDUCED_ART_SKINS.has(skinId) ? REDUCED_ART_SCALE : ART_CONTENT_SCALE;
        requestArtBounds(source).then((bounds) => {
            if (boardElement.dataset.pieceArtVersion === version) {
                renderGroupArt(boardElement, group, source, bounds, contentScale);
            }
        });
    });
}
