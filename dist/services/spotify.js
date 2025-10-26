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
exports.SPOTIFY_API_BASE = void 0;
exports.spotifyGet = spotifyGet;
exports.spotifyPaginate = spotifyPaginate;
exports.exchangeCodeForTokens = exchangeCodeForTokens;
exports.refreshAccessToken = refreshAccessToken;
var axios_1 = require("axios");
var logger_1 = require("../utils/logger");
var errors_1 = require("../utils/errors");
var SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
exports.SPOTIFY_API_BASE = SPOTIFY_API_BASE;
function spotifyGet(url_1, accessToken_1) {
    return __awaiter(this, arguments, void 0, function (url, accessToken, retryOn429) {
        var response, error_1, axiosError, retryAfter_1;
        var _a, _b, _c;
        if (retryOn429 === void 0) { retryOn429 = true; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 6]);
                    return [4 /*yield*/, axios_1.default.get(url, {
                            headers: {
                                Authorization: "Bearer ".concat(accessToken),
                            },
                        })];
                case 1:
                    response = _d.sent();
                    return [2 /*return*/, response.data];
                case 2:
                    error_1 = _d.sent();
                    if (!axios_1.default.isAxiosError(error_1)) return [3 /*break*/, 5];
                    axiosError = error_1;
                    if (!(((_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.status) === 429 && retryOn429)) return [3 /*break*/, 4];
                    retryAfter_1 = parseInt(axiosError.response.headers['retry-after'] || '1', 10);
                    logger_1.logger.warn({ url: url, retryAfter: retryAfter_1 }, 'Rate limited, retrying after delay');
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, retryAfter_1 * 1000); })];
                case 3:
                    _d.sent();
                    return [2 /*return*/, spotifyGet(url, accessToken, false)];
                case 4:
                    if (((_b = axiosError.response) === null || _b === void 0 ? void 0 : _b.status) === 401) {
                        throw new errors_1.AppError(401, 'Spotify access token expired or invalid');
                    }
                    throw new errors_1.AppError(((_c = axiosError.response) === null || _c === void 0 ? void 0 : _c.status) || 500, "Spotify API error: ".concat(axiosError.message));
                case 5: throw error_1;
                case 6: return [2 /*return*/];
            }
        });
    });
}
function spotifyPaginate(url_1, accessToken_1) {
    return __awaiter(this, arguments, void 0, function (url, accessToken, itemsKey) {
        var allItems, nextUrl, response;
        if (itemsKey === void 0) { itemsKey = 'items'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    allItems = [];
                    nextUrl = url;
                    _a.label = 1;
                case 1:
                    if (!nextUrl) return [3 /*break*/, 3];
                    return [4 /*yield*/, spotifyGet(nextUrl, accessToken)];
                case 2:
                    response = _a.sent();
                    allItems.push.apply(allItems, response.items);
                    nextUrl = response.next;
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/, allItems];
            }
        });
    });
}
function exchangeCodeForTokens(code) {
    return __awaiter(this, void 0, void 0, function () {
        var clientId, clientSecret, redirectUri, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clientId = process.env.SPOTIFY_CLIENT_ID;
                    clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
                    redirectUri = process.env.SPOTIFY_REDIRECT_URI;
                    if (!clientId || !clientSecret || !redirectUri) {
                        throw new errors_1.AppError(500, 'Missing Spotify configuration');
                    }
                    return [4 /*yield*/, axios_1.default.post('https://accounts.spotify.com/api/token', new URLSearchParams({
                            grant_type: 'authorization_code',
                            code: code,
                            redirect_uri: redirectUri,
                        }), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                Authorization: "Basic ".concat(Buffer.from("".concat(clientId, ":").concat(clientSecret)).toString('base64')),
                            },
                        })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
            }
        });
    });
}
function refreshAccessToken(refreshToken) {
    return __awaiter(this, void 0, void 0, function () {
        var clientId, clientSecret, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clientId = process.env.SPOTIFY_CLIENT_ID;
                    clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
                    if (!clientId || !clientSecret) {
                        throw new errors_1.AppError(500, 'Missing Spotify configuration');
                    }
                    return [4 /*yield*/, axios_1.default.post('https://accounts.spotify.com/api/token', new URLSearchParams({
                            grant_type: 'refresh_token',
                            refresh_token: refreshToken,
                        }), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                Authorization: "Basic ".concat(Buffer.from("".concat(clientId, ":").concat(clientSecret)).toString('base64')),
                            },
                        })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
            }
        });
    });
}
