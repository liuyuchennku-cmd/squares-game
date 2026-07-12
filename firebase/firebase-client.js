import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
    browserLocalPersistence,
    getAuth,
    onAuthStateChanged,
    setPersistence,
    signInAnonymously
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
    doc,
    getDoc,
    getFirestore,
    serverTimestamp,
    setDoc
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const SKIN_STORAGE_PREFIX = 'squareGameUserProfile:';
const COLORS = ['blue', 'yellow', 'red', 'green'];

export const SKINS = {
    base: {
        label: '基础皮肤（随机）',
        accent: '#218be0',
        colors: {
            blue: ['#0d5ca8', '#218be0'],
            yellow: ['#a66808', '#f6b41d'],
            red: ['#9c302c', '#e45a4f'],
            green: ['#28793a', '#46a755']
        }
    },
    classic: {
        label: '水晶',
        accent: '#4bb9ff',
        colors: {
            blue: ['#1b68b0', '#4bb9ff'],
            yellow: ['#9b6814', '#ffd463'],
            red: ['#a92c58', '#fc769f'],
            green: ['#5f48af', '#9d82ff']
        }
    },
    ocean: {
        label: '水脉',
        accent: '#0891b2',
        colors: {
            blue: ['#075985', '#06b6d4'],
            yellow: ['#854d0e', '#facc15'],
            red: ['#9f1239', '#fb7185'],
            green: ['#166534', '#22c55e']
        }
    },
    forest: {
        label: '奶奶的翡翠',
        accent: '#15803d',
        colors: {
            blue: ['#164e63', '#0e7490'],
            yellow: ['#713f12', '#a3e635'],
            red: ['#7f1d1d', '#f87171'],
            green: ['#14532d', '#16a34a']
        }
    },
    ember: {
        label: '熔岩',
        accent: '#ea580c',
        colors: {
            blue: ['#1e3a8a', '#6366f1'],
            yellow: ['#9a3412', '#fb923c'],
            red: ['#7f1d1d', '#f43f5e'],
            green: ['#365314', '#84cc16']
        }
    },
    neon: {
        label: '霓虹回路',
        accent: '#e64bff',
        colors: {
            blue: ['#2344a4', '#00d7ff'],
            yellow: ['#9c6e0f', '#ffcf3f'],
            red: ['#8c2aa0', '#e64bff'],
            green: ['#3d8f1c', '#87f126']
        }
    },
    glowing_mycelium: {
        label: '荧光菌丝',
        accent: '#b9f35a',
        colors: {
            blue: ['#267b84', '#55e0d5'],
            yellow: ['#6c9132', '#b9f35a'],
            red: ['#9e4e86', '#ff8dc7'],
            green: ['#6954ad', '#c58cff']
        }
    },
    rope_knots: {
        label: '绳结',
        accent: '#c18b51',
        colors: {
            blue: ['#5c6254', '#8f9777'],
            yellow: ['#9c6d35', '#d5aa6b'],
            red: ['#794533', '#a86343'],
            green: ['#5e4b37', '#c18b51']
        }
    },
    star_constellation: {
        label: '星座',
        accent: '#789aff',
        colors: {
            blue: ['#3755bb', '#789aff'],
            yellow: ['#9c8132', '#f4d76d'],
            red: ['#714aaf', '#b599ff'],
            green: ['#327f9d', '#65ddff']
        }
    },
    thunder_pulse: {
        label: '雷霆脉冲',
        accent: '#2f6de0',
        colors: {
            blue: ['#336eb8', '#6fb7ff'],
            yellow: ['#a4861c', '#f2cf3f'],
            red: ['#a94f27', '#f58d4e'],
            green: ['#654db3', '#a57bff']
        }
    },
    vine_path: {
        label: '藤径',
        accent: '#55a841',
        colors: {
            blue: ['#2c7b84', '#53bdca'],
            yellow: ['#889c31', '#d4c34c'],
            red: ['#9a6e2c', '#d4a347'],
            green: ['#2d6f35', '#55a841']
        }
    },
    carved_wood: {
        label: '雕刻木纹',
        accent: '#a4581c',
        colors: {
            blue: ['#6c4727', '#bd7b2d'],
            yellow: ['#86601f', '#d7a447'],
            red: ['#76402f', '#ad5d3d'],
            green: ['#615128', '#97823b']
        }
    }
};

const firebaseConfig = globalThis.firebaseConfig;
let services = null;
let authReadyPromise = null;

function hasFirebaseConfig() {
    return firebaseConfig
        && firebaseConfig.apiKey
        && firebaseConfig.projectId;
}

function ensureSkinStyles() {
    if (document.getElementById('square-game-skin-styles')) return;

    const style = document.createElement('style');
    style.id = 'square-game-skin-styles';
    style.textContent = `
        html[data-player-skins] .board-cell.filled.blue,
        html[data-player-skins] .board-cell.preview.blue,
        html[data-player-skins] .mini-cell.blue,
        html[data-player-skins] .score-dot.blue,
        html[data-player-skins] .online-player .dot.blue,
        html[data-player-skins] .player-card.blue {
            background: var(--player-blue-background) !important;
        }
        html[data-player-skins] .board-cell.filled.yellow,
        html[data-player-skins] .board-cell.preview.yellow,
        html[data-player-skins] .mini-cell.yellow,
        html[data-player-skins] .score-dot.yellow,
        html[data-player-skins] .online-player .dot.yellow,
        html[data-player-skins] .player-card.yellow {
            background: var(--player-yellow-background) !important;
        }
        html[data-player-skins] .board-cell.filled.red,
        html[data-player-skins] .board-cell.preview.red,
        html[data-player-skins] .mini-cell.red,
        html[data-player-skins] .score-dot.red,
        html[data-player-skins] .online-player .dot.red,
        html[data-player-skins] .player-card.red {
            background: var(--player-red-background) !important;
        }
        html[data-player-skins] .board-cell.filled.green,
        html[data-player-skins] .board-cell.preview.green,
        html[data-player-skins] .mini-cell.green,
        html[data-player-skins] .score-dot.green,
        html[data-player-skins] .online-player .dot.green,
        html[data-player-skins] .player-card.green {
            background: var(--player-green-background) !important;
        }
        html[data-skin] .skin-preview {
            border-color: var(--self-skin-accent) !important;
        }
    `;
    document.head.appendChild(style);
}

function getSkin(skinId) {
    return SKINS[normalizeSkinId(skinId)];
}

function normalizeSkinId(skinId) {
    return Object.prototype.hasOwnProperty.call(SKINS, skinId) ? skinId : 'base';
}

function skinBackground(skinId, color) {
    const [deep, main] = getSkin(skinId).colors[color];
    return `linear-gradient(135deg, ${deep}, ${main} 62%, rgba(255,255,255,0.34))`;
}

export function getFirebaseServices() {
    if (!hasFirebaseConfig()) {
        throw new Error('请先在 firebase/firebase-config.js 中配置 Firebase Web App。');
    }

    if (!services) {
        const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        services = {
            app,
            auth: getAuth(app),
            db: getFirestore(app)
        };
    }

    return services;
}

export function ensureUser() {
    const { auth } = getFirebaseServices();
    if (!authReadyPromise) {
        authReadyPromise = (async () => {
            await setPersistence(auth, browserLocalPersistence);

            if (auth.currentUser) return auth.currentUser;

            return new Promise((resolve, reject) => {
                let signInStarted = false;
                const unsubscribe = onAuthStateChanged(auth, (user) => {
                    if (user) {
                        unsubscribe();
                        resolve(user);
                        return;
                    }

                    if (!signInStarted) {
                        signInStarted = true;
                        signInAnonymously(auth).catch((error) => {
                            unsubscribe();
                            reject(error);
                        });
                    }
                }, (error) => {
                    unsubscribe();
                    reject(error);
                });
            });
        })().catch((error) => {
            authReadyPromise = null;
            throw error;
        });
    }

    return authReadyPromise;
}

export async function loadUserProfile(user) {
    const { db } = getFirebaseServices();
    const profileRef = doc(db, 'users', user.uid);
    const cached = JSON.parse(localStorage.getItem(`${SKIN_STORAGE_PREFIX}${user.uid}`) || 'null');
    const fallback = {
        uid: user.uid,
        skinId: normalizeSkinId(cached?.skinId)
    };

    try {
        const snapshot = await getDoc(profileRef);
        if (!snapshot.exists()) {
            await setDoc(profileRef, {
                uid: user.uid,
                skinId: fallback.skinId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });
            localStorage.setItem(`${SKIN_STORAGE_PREFIX}${user.uid}`, JSON.stringify(fallback));
            return fallback;
        }

        const profile = {
            uid: user.uid,
            skinId: normalizeSkinId(snapshot.data().skinId)
        };
        localStorage.setItem(`${SKIN_STORAGE_PREFIX}${user.uid}`, JSON.stringify(profile));
        return profile;
    } catch (error) {
        return fallback;
    }
}

export async function saveUserProfile(user, changes) {
    const { db } = getFirebaseServices();
    const nextProfile = {
        uid: user.uid,
        skinId: normalizeSkinId(changes.skinId)
    };
    localStorage.setItem(`${SKIN_STORAGE_PREFIX}${user.uid}`, JSON.stringify(nextProfile));
    localStorage.setItem('squareGameSelectedSkin', nextProfile.skinId);
    try {
        await setDoc(doc(db, 'users', user.uid), {
            skinId: nextProfile.skinId,
            updatedAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        return nextProfile;
    }
    return nextProfile;
}

export function applySkin(skinId) {
    ensureSkinStyles();
    const skin = getSkin(skinId);
    const root = document.documentElement;
    root.dataset.skin = normalizeSkinId(skinId);
    root.style.setProperty('--self-skin-accent', skin.accent);
    root.style.setProperty('--self-skin-background', skinBackground(root.dataset.skin, 'blue'));
}

export function applyPlayerSkins(players = []) {
    ensureSkinStyles();
    const root = document.documentElement;
    const skinByColor = new Map(players.map((player) => [player.color, player.skinId || 'base']));

    COLORS.forEach((color) => {
        const skinId = skinByColor.get(color) || 'base';
        root.style.setProperty(`--player-${color}-background`, skinBackground(skinId, color));
    });

    root.dataset.playerSkins = 'true';
}

export async function ensureUserProfile() {
    const user = await ensureUser();
    const profile = await loadUserProfile(user);
    applySkin(profile.skinId);
    globalThis.squareGameUserProfile = profile;
    globalThis.squareGameApplyPlayerSkins = applyPlayerSkins;
    return { user, profile };
}
