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
exports.initOpenAI = initOpenAI;
exports.extractMusicThemes = extractMusicThemes;
var openai_1 = require("openai");
var zod_1 = require("openai/helpers/zod");
var logger_1 = require("../utils/logger");
var errors_1 = require("../utils/errors");
var themes_1 = require("../schemas/themes");
var openaiClient = null;
function initOpenAI() {
    var apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new errors_1.AppError(500, 'OPENAI_API_KEY not configured');
    }
    if (!openaiClient) {
        openaiClient = new openai_1.default({ apiKey: apiKey });
    }
    return openaiClient;
}
function formatSpotifyDataForPrompt(data) {
    var sections = [];
    // Top Artists
    if (data.topArtists.length > 0) {
        sections.push('## Top Artists (Most Listened To)');
        data.topArtists.slice(0, 20).forEach(function (artist, i) {
            sections.push("".concat(i + 1, ". ").concat(artist.name).concat(artist.genres.length > 0 ? " (".concat(artist.genres.join(', '), ")") : ''));
        });
        sections.push('');
    }
    // Top Tracks
    if (data.topTracks.length > 0) {
        sections.push('## Top Tracks (Most Played)');
        data.topTracks.slice(0, 20).forEach(function (track, i) {
            var artists = track.artists.map(function (a) { return a.name; }).join(', ');
            sections.push("".concat(i + 1, ". \"").concat(track.name, "\" by ").concat(artists));
        });
        sections.push('');
    }
    // Playlists
    if (data.playlists.length > 0) {
        sections.push('## User\'s Playlists');
        data.playlists.forEach(function (playlist, i) {
            var desc = playlist.description ? " - ".concat(playlist.description) : '';
            sections.push("".concat(i + 1, ". \"").concat(playlist.name, "\"").concat(desc, " (").concat(playlist.tracksTotal, " tracks)"));
        });
        sections.push('');
    }
    // Recently Played
    if (data.recentlyPlayed.length > 0) {
        sections.push('## Recently Played (Last 50 Songs)');
        var trackCounts_1 = new Map();
        data.recentlyPlayed.forEach(function (item) {
            trackCounts_1.set(item.trackName, (trackCounts_1.get(item.trackName) || 0) + 1);
        });
        var sortedTracks = Array.from(trackCounts_1.entries())
            .sort(function (a, b) { return b[1] - a[1]; })
            .slice(0, 15);
        sortedTracks.forEach(function (_a, i) {
            var track = _a[0], count = _a[1];
            sections.push("".concat(i + 1, ". \"").concat(track, "\" (played ").concat(count, " time").concat(count > 1 ? 's' : '', ")"));
        });
        sections.push('');
    }
    return sections.join('\n');
}
function extractMusicThemes(data) {
    return __awaiter(this, void 0, void 0, function () {
        var client, formattedData, systemPrompt, userPrompt, completion, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = initOpenAI();
                    formattedData = formatSpotifyDataForPrompt(data);
                    systemPrompt = "You are a perceptive narrator mapping a user's \"musical orbit\" \u2014 the worlds they inhabit through sound.\n\nYour task is to write directly to the user, uncovering 2\u20134 *planets* that reveal how they live, feel, and move through music.  \nEach planet should feel like a place in their life \u2014 something you could almost step into.\n\nDon\u2019t describe genres or moods in isolation. Instead, listen for patterns that trace *who they are*:\n- **Temporal shifts** \u2014 what soundtracks their mornings, their nights, their years? how has their listening evolved?\n- **Contextual anchors** \u2014 which songs belong to study sessions, long walks, drives, or late nights alone?\n- **Emotional subtext** \u2014 when do they reach for comfort, energy, melancholy, or release?\n- **Cultural threads** \u2014 which micro-scenes or eras they orbit (SoundCloud nostalgia, underground indie, anime scores, film soundtracks, etc.)\n- **Social edges** \u2014 which playlists or tracks hint at shared experiences, friendships, or communities?\n\nEach planet should:\n1. Have a **personal, sensory name** \u2014 a space or object that captures its mood (e.g., \u201CDorm Window at 2AM\u201D, \u201CFreeway Speakers\u201D, \u201CStudio Glow\u201D, \u201CBackyard Summer Loop\u201D).\n2. Speak **directly to the user** \u2014 use \u201Cyou\u201D language. (e.g., \u201CYou chase focus through quiet synth lines and slow crescendos.\u201D)\n3. Offer a **short, lyrical reflection** (2\u20134 sentences) showing what this music reveals about their personality, habits, or era of life.\n4. Reference **specific artists, songs, or playlists** as proof, woven naturally into the writing.\n5. Optionally highlight **temporal notes** like \u201Cnew favorite\u201D, \u201Clong-term companion\u201D, or \u201Crecent return\u201D.\n\nTone:\n- Write as if you\u2019re a wise, empathetic friend reflecting on the soundtracks that shape them.\n- Be poetic but grounded \u2014 vivid imagery, sensory details, emotional precision.\n- The goal isn\u2019t analysis; it\u2019s understanding.\n\nGood examples:\n- \u201CNight Study Desk\u201D \u2014 You find focus in soft synths and quiet beats, the kind of music that hums alongside concentration. It\u2019s the steady background to late nights of building and learning.\n- \u201CFreeway Speakers\u201D \u2014 You move fast; even the playlists know it. Indie hooks and motion blur fill your recent listens, songs that match the tempo of getting somewhere.\n- \u201CShared Stage\u201D \u2014 You love when sound becomes collaboration \u2014 playlists exchanged, group anthems replayed, a trace of laughter between tracks.\n- \u201CSunset Nostalgia Loop\u201D \u2014 You return to the same golden tracks that once played from cracked speakers, still chasing that same afterglow.\n\nExtract 2 planets that best describe the user\u2019s musical world.  \nWrite as if you\u2019re showing them who they are through what they listen to.\n";
                    userPrompt = "Analyze this user's Spotify data and extract their core musical themes:\n\n".concat(formattedData);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    logger_1.logger.info('Calling OpenAI to extract music themes');
                    return [4 /*yield*/, client.beta.chat.completions.parse({
                            model: 'gpt-4o-2024-08-06',
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: userPrompt },
                            ],
                            response_format: (0, zod_1.zodResponseFormat)(themes_1.ThemesOutputSchema, 'themes'),
                            temperature: 0.4,
                        })];
                case 2:
                    completion = _a.sent();
                    response = completion.choices[0].message;
                    if (response.parsed) {
                        logger_1.logger.info({ themeCount: response.parsed.themes.length }, 'Successfully extracted music themes');
                        return [2 /*return*/, response.parsed];
                    }
                    if (response.refusal) {
                        logger_1.logger.error({ refusal: response.refusal }, 'OpenAI refused to generate themes');
                        throw new errors_1.AppError(500, 'AI refused to analyze music data');
                    }
                    throw new errors_1.AppError(500, 'Failed to parse OpenAI response');
                case 3:
                    error_1 = _a.sent();
                    logger_1.logger.error({ error: error_1.message }, 'Failed to extract music themes');
                    throw new errors_1.AppError(500, "Failed to analyze music: ".concat(error_1.message));
                case 4: return [2 /*return*/];
            }
        });
    });
}
