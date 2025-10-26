"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var crypto_1 = require("crypto");
var spotify_1 = require("../services/spotify");
var spotify_themes_1 = require("../services/spotify_themes");
var tokens_1 = require("../services/tokens");
var errors_1 = require("../utils/errors");
var logger_1 = require("../utils/logger");
var spotify_2 = require("../schemas/spotify");
var router = (0, express_1.Router)();
var SCOPES = [
    'user-read-email',
    'user-top-read',
    'playlist-read-private',
    'user-read-recently-played',
].join(' ');
// Spotify OAuth - Initiate connection
router.get('/spotify/connect', function (_req, res) {
    var clientId = process.env.SPOTIFY_CLIENT_ID;
    var redirectUri = process.env.SPOTIFY_REDIRECT_URI;
    if (!clientId || !redirectUri) {
        throw new errors_1.AppError(500, 'Missing Spotify configuration');
    }
    var state = (0, crypto_1.randomBytes)(16).toString('hex');
    res.cookie('spotify_auth_state', state, {
        httpOnly: true,
        maxAge: 5 * 60 * 1000, // 5 minutes
        sameSite: 'lax',
        path: '/',
    });
    logger_1.logger.info({ state: state }, 'Setting auth state cookie');
    var params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: SCOPES,
        redirect_uri: redirectUri,
        state: state,
    });
    return res.redirect("https://accounts.spotify.com/authorize?".concat(params.toString()));
});
// Spotify OAuth - Callback
router.get('/spotify/callback', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, code, state, error, storedState, tokens, expiresAt, sessionId, origin_1, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.query, code = _a.code, state = _a.state, error = _a.error;
                storedState = req.cookies.spotify_auth_state;
                logger_1.logger.info({
                    receivedState: state,
                    storedState: storedState,
                    allCookies: Object.keys(req.cookies),
                    hasCode: !!code
                }, 'OAuth callback received');
                if (error) {
                    logger_1.logger.error({ error: error }, 'Spotify authorization error');
                    return [2 /*return*/, res.status(400).json({ error: 'Authorization failed' })];
                }
                if (!state || state !== storedState) {
                    logger_1.logger.error({ state: state, storedState: storedState }, 'State mismatch');
                    return [2 /*return*/, res.status(400).json({
                            error: 'State mismatch',
                            details: "Received: ".concat(state, ", Expected: ").concat(storedState),
                            hint: 'Make sure you access the server via 127.0.0.1, not localhost'
                        })];
                }
                if (!code || typeof code !== 'string') {
                    return [2 /*return*/, res.status(400).json({ error: 'Missing authorization code' })];
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, (0, spotify_1.exchangeCodeForTokens)(code)];
            case 2:
                tokens = _b.sent();
                expiresAt = Date.now() + tokens.expires_in * 1000;
                sessionId = (0, crypto_1.randomBytes)(16).toString('hex');
                tokens_1.tokenStore.set(sessionId, {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiresAt: expiresAt,
                });
                res.cookie('session_id', sessionId, {
                    httpOnly: true,
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                    sameSite: 'lax',
                    path: '/',
                });
                res.cookie('access_token', tokens.access_token, {
                    httpOnly: true,
                    maxAge: 55 * 60 * 1000, // 55 minutes
                    sameSite: 'lax',
                    path: '/',
                });
                res.cookie('refresh_token', tokens.refresh_token, {
                    httpOnly: true,
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                    sameSite: 'lax',
                    path: '/',
                });
                res.clearCookie('spotify_auth_state');
                origin_1 = process.env.ORIGIN || 'http://127.0.0.1:3000';
                // If no frontend is running, show success page from backend
                if (!process.env.ORIGIN || process.env.ORIGIN === 'http://127.0.0.1:3000') {
                    return [2 /*return*/, res.send("\n        <html>\n          <head><title>Authentication Successful</title></head>\n          <body style=\"font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;\">\n            <h1>\u2713 Authentication Successful</h1>\n            <p>You have successfully connected your Spotify account.</p>\n            <h3>Available Endpoints:</h3>\n            <ul>\n              <li><a href=\"/spotify/profile\">GET /spotify/profile</a> - Your Spotify profile</li>\n              <li><a href=\"/spotify/top-artists\">GET /spotify/top-artists</a> - Top 25 artists</li>\n              <li><a href=\"/spotify/top-tracks\">GET /spotify/top-tracks</a> - Top 25 tracks</li>\n              <li><a href=\"/spotify/playlists\">GET /spotify/playlists</a> - All playlists</li>\n              <li><a href=\"/spotify/recent\">GET /spotify/recent</a> - Recently played (last 50)</li>\n              <li><a href=\"/spotify/themes\">GET /spotify/themes</a> - <strong>AI-generated music themes</strong></li>\n            </ul>\n            <p><small>Session ID: ".concat(sessionId, "</small></p>\n            <p><small>Access via: <code>http://127.0.0.1:5173</code></small></p>\n          </body>\n        </html>\n      "))];
                }
                return [2 /*return*/, res.redirect("".concat(origin_1, "/success"))];
            case 3:
                error_1 = _b.sent();
                logger_1.logger.error({ error: error_1 }, 'Token exchange failed');
                return [2 /*return*/, res.status(500).json({ error: 'Failed to exchange authorization code' })];
            case 4: return [2 /*return*/];
        }
    });
}); });
function getAccessToken(req) {
    if (process.env.MOCK_MODE === 'true') {
        return 'MOCK_TOKEN';
    }
    var token = req.cookies.access_token;
    if (!token) {
        throw new errors_1.AppError(401, 'No access token provided');
    }
    return token;
}
function getMockProfile() {
    return {
        id: 'mock_user_123',
        name: 'Mock User',
        email: 'mock@example.com',
        image: 'https://i.scdn.co/image/mock',
    };
}
function getMockArtists(count) {
    var genres = ['indie rock', 'electronic', 'ambient', 'jazz', 'folk'];
    return Array.from({ length: count }, function (_, i) { return ({
        id: "artist_".concat(i),
        name: "Artist ".concat(i),
        genres: [genres[i % genres.length]],
        image: "https://i.scdn.co/image/artist_".concat(i),
        popularity: 50 + i,
    }); });
}
function getMockTracks(count) {
    return Array.from({ length: count }, function (_, i) { return ({
        id: "track_".concat(i),
        name: "Track ".concat(i),
        artists: [{ id: "artist_".concat(i), name: "Artist ".concat(i) }],
        album: {
            id: "album_".concat(i),
            name: "Album ".concat(i),
            image: "https://i.scdn.co/image/album_".concat(i),
        },
        popularity: 60 + i,
    }); });
}
function getMockPlaylists() {
    return [
        {
            id: 'playlist_1',
            name: 'Chill Vibes',
            description: 'Relaxing music for studying',
            image: 'https://i.scdn.co/image/playlist_1',
            tracksTotal: 50,
            public: true,
            ownerId: 'mock_user_123',
        },
        {
            id: 'playlist_2',
            name: 'Workout Pump',
            description: 'High energy tracks for the gym',
            image: 'https://i.scdn.co/image/playlist_2',
            tracksTotal: 30,
            public: true,
            ownerId: 'mock_user_123',
        },
    ];
}
function getMockRecent() {
    return Array.from({ length: 20 }, function (_, i) { return ({
        trackId: "track_".concat(i),
        trackName: "Track ".concat(i),
        artistIds: ["artist_".concat(i)],
        playedAt: new Date(Date.now() - i * 3600000).toISOString(),
    }); });
}
router.get('/spotify/profile', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var accessToken, data, profile;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                accessToken = getAccessToken(req);
                if (process.env.MOCK_MODE === 'true') {
                    return [2 /*return*/, res.json(getMockProfile())];
                }
                return [4 /*yield*/, (0, spotify_1.spotifyGet)("".concat(spotify_1.SPOTIFY_API_BASE, "/me"), accessToken)];
            case 1:
                data = _c.sent();
                profile = spotify_2.UserProfileSchema.parse({
                    id: data.id,
                    name: data.display_name,
                    email: data.email,
                    image: (_b = (_a = data.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url,
                });
                return [2 /*return*/, res.json(profile)];
        }
    });
}); });
router.get('/spotify/top-artists', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var accessToken, timeRange, limit, data, artists;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                accessToken = getAccessToken(req);
                timeRange = req.query.time_range || 'medium_term';
                limit = Math.min(parseInt(req.query.limit) || 25, 50);
                if (process.env.MOCK_MODE === 'true') {
                    return [2 /*return*/, res.json(getMockArtists(limit))];
                }
                return [4 /*yield*/, (0, spotify_1.spotifyGet)("".concat(spotify_1.SPOTIFY_API_BASE, "/me/top/artists?time_range=").concat(timeRange, "&limit=").concat(limit), accessToken)];
            case 1:
                data = _a.sent();
                artists = data.items.map(function (item) {
                    var _a, _b;
                    return spotify_2.ArtistSchema.parse({
                        id: item.id,
                        name: item.name,
                        genres: item.genres || [],
                        image: (_b = (_a = item.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url,
                        popularity: item.popularity,
                    });
                });
                return [2 /*return*/, res.json(artists)];
        }
    });
}); });
router.get('/spotify/top-tracks', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var accessToken, timeRange, limit, data, tracks;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                accessToken = getAccessToken(req);
                timeRange = req.query.time_range || 'medium_term';
                limit = Math.min(parseInt(req.query.limit) || 25, 50);
                if (process.env.MOCK_MODE === 'true') {
                    return [2 /*return*/, res.json(getMockTracks(limit))];
                }
                return [4 /*yield*/, (0, spotify_1.spotifyGet)("".concat(spotify_1.SPOTIFY_API_BASE, "/me/top/tracks?time_range=").concat(timeRange, "&limit=").concat(limit), accessToken)];
            case 1:
                data = _a.sent();
                tracks = data.items.map(function (item) {
                    var _a, _b;
                    return spotify_2.TrackSchema.parse({
                        id: item.id,
                        name: item.name,
                        artists: item.artists.map(function (a) { return ({ id: a.id, name: a.name }); }),
                        album: {
                            id: item.album.id,
                            name: item.album.name,
                            image: (_b = (_a = item.album.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url,
                        },
                        popularity: item.popularity,
                    });
                });
                return [2 /*return*/, res.json(tracks)];
        }
    });
}); });
router.get('/spotify/playlists', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var accessToken, items, playlists;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                accessToken = getAccessToken(req);
                if (process.env.MOCK_MODE === 'true') {
                    return [2 /*return*/, res.json(getMockPlaylists())];
                }
                return [4 /*yield*/, (0, spotify_1.spotifyPaginate)("".concat(spotify_1.SPOTIFY_API_BASE, "/me/playlists?limit=50"), accessToken)];
            case 1:
                items = _a.sent();
                playlists = items.map(function (item) {
                    var _a, _b;
                    return spotify_2.PlaylistSchema.parse({
                        id: item.id,
                        name: item.name,
                        description: item.description || '',
                        image: (_b = (_a = item.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url,
                        tracksTotal: item.tracks.total,
                        public: item.public,
                        ownerId: item.owner.id,
                    });
                });
                return [2 /*return*/, res.json(playlists)];
        }
    });
}); });
router.get('/spotify/recent', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var accessToken, data, recent;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                accessToken = getAccessToken(req);
                if (process.env.MOCK_MODE === 'true') {
                    return [2 /*return*/, res.json(getMockRecent())];
                }
                return [4 /*yield*/, (0, spotify_1.spotifyGet)("".concat(spotify_1.SPOTIFY_API_BASE, "/me/player/recently-played?limit=50"), accessToken)];
            case 1:
                data = _a.sent();
                recent = data.items.map(function (item) {
                    return spotify_2.RecentlyPlayedItemSchema.parse({
                        trackId: item.track.id,
                        trackName: item.track.name,
                        artistIds: item.track.artists.map(function (a) { return a.id; }),
                        playedAt: item.played_at,
                    });
                });
                return [2 /*return*/, res.json(recent)];
        }
    });
}); });
function getMockThemes() {
    return {
        source: 'spotify',
        analyzedAt: new Date().toISOString(),
        themes: [
            {
                label: "Ambient Focus Flow",
                rationale: "Your listening patterns show a preference for atmospheric, non-intrusive music ideal for concentration and deep work.",
                sources: [
                    { title: "Artist 0", type: "artist" },
                    { title: "Track 2", type: "track" },
                    { title: "Chill Vibes", type: "playlist" },
                ]
            },
            {
                label: "Electronic Exploration",
                rationale: "A strong theme of electronic and experimental music suggests curiosity about synthetic soundscapes and modern production.",
                sources: [
                    { title: "Artist 1", type: "artist" },
                    { title: "Track 5", type: "track" },
                ]
            },
            {
                label: "High Energy Movement",
                rationale: "Workout-oriented playlists and high-tempo tracks indicate music used for physical activity and motivation.",
                sources: [
                    { title: "Workout Pump", type: "playlist" },
                    { title: "Track 8", type: "track" },
                ]
            },
        ]
    };
}
// NEW: AI-powered theme extraction
router.get('/spotify/themes', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var accessToken_1, _a, topArtists, topTracks, playlists, recentlyPlayed, themes, error_2;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                accessToken_1 = getAccessToken(req);
                // Handle mock mode
                if (process.env.MOCK_MODE === 'true') {
                    return [2 /*return*/, res.json(getMockThemes())];
                }
                return [4 /*yield*/, Promise.all([
                        // Top Artists
                        (function () { return __awaiter(void 0, void 0, void 0, function () {
                            var data;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, spotify_1.spotifyGet)("".concat(spotify_1.SPOTIFY_API_BASE, "/me/top/artists?time_range=medium_term&limit=25"), accessToken_1)];
                                    case 1:
                                        data = _a.sent();
                                        return [2 /*return*/, data.items.map(function (item) {
                                                var _a, _b;
                                                return spotify_2.ArtistSchema.parse({
                                                    id: item.id,
                                                    name: item.name,
                                                    genres: item.genres || [],
                                                    image: (_b = (_a = item.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url,
                                                    popularity: item.popularity,
                                                });
                                            })];
                                }
                            });
                        }); })(),
                        // Top Tracks
                        (function () { return __awaiter(void 0, void 0, void 0, function () {
                            var data;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, spotify_1.spotifyGet)("".concat(spotify_1.SPOTIFY_API_BASE, "/me/top/tracks?time_range=medium_term&limit=50"), accessToken_1)];
                                    case 1:
                                        data = _a.sent();
                                        return [2 /*return*/, data.items.map(function (item) {
                                                var _a, _b;
                                                return spotify_2.TrackSchema.parse({
                                                    id: item.id,
                                                    name: item.name,
                                                    artists: item.artists.map(function (a) { return ({ id: a.id, name: a.name }); }),
                                                    album: {
                                                        id: item.album.id,
                                                        name: item.album.name,
                                                        image: (_b = (_a = item.album.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url,
                                                    },
                                                    popularity: item.popularity,
                                                });
                                            })];
                                }
                            });
                        }); })(),
                        // Playlists
                        (function () { return __awaiter(void 0, void 0, void 0, function () {
                            var items;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, spotify_1.spotifyPaginate)("".concat(spotify_1.SPOTIFY_API_BASE, "/me/playlists?limit=50"), accessToken_1)];
                                    case 1:
                                        items = _a.sent();
                                        return [2 /*return*/, items.map(function (item) {
                                                var _a, _b;
                                                return spotify_2.PlaylistSchema.parse({
                                                    id: item.id,
                                                    name: item.name,
                                                    description: item.description || '',
                                                    image: (_b = (_a = item.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url,
                                                    tracksTotal: item.tracks.total,
                                                    public: item.public,
                                                    ownerId: item.owner.id,
                                                });
                                            })];
                                }
                            });
                        }); })(),
                        // Recently Played
                        (function () { return __awaiter(void 0, void 0, void 0, function () {
                            var data;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, spotify_1.spotifyGet)("".concat(spotify_1.SPOTIFY_API_BASE, "/me/player/recently-played?limit=50"), accessToken_1)];
                                    case 1:
                                        data = _a.sent();
                                        return [2 /*return*/, data.items.map(function (item) {
                                                return spotify_2.RecentlyPlayedItemSchema.parse({
                                                    trackId: item.track.id,
                                                    trackName: item.track.name,
                                                    artistIds: item.track.artists.map(function (a) { return a.id; }),
                                                    playedAt: item.played_at,
                                                });
                                            })];
                                }
                            });
                        }); })(),
                    ])];
            case 1:
                _a = _c.sent(), topArtists = _a[0], topTracks = _a[1], playlists = _a[2], recentlyPlayed = _a[3];
                return [4 /*yield*/, (0, spotify_themes_1.extractMusicThemes)({
                        topArtists: topArtists,
                        topTracks: topTracks,
                        playlists: playlists,
                        recentlyPlayed: recentlyPlayed,
                    })];
            case 2:
                themes = _c.sent();
                return [2 /*return*/, res.json({
                        source: 'spotify',
                        analyzedAt: new Date().toISOString(),
                        themes: themes.themes,
                    })];
            case 3:
                error_2 = _c.sent();
                logger_1.logger.error({ error: error_2 }, 'Failed to extract Spotify themes');
                // Check if it's an auth error
                if (error_2.statusCode === 401 || ((_b = error_2.message) === null || _b === void 0 ? void 0 : _b.includes('No access token'))) {
                    return [2 /*return*/, res.status(401).json({
                            error: 'Spotify not connected',
                            message: 'Please authenticate with Spotify first',
                            connectUrl: '/spotify/connect'
                        })];
                }
                return [2 /*return*/, res.status(500).json({
                        error: 'Failed to extract themes',
                        message: error_2.message || 'Unknown error'
                    })];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
