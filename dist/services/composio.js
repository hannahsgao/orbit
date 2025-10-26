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
exports.initComposio = initComposio;
exports.getOrCreateAuthConfig = getOrCreateAuthConfig;
exports.initiateConnection = initiateConnection;
exports.getConnectedAccount = getConnectedAccount;
exports.listConnectedAccounts = listConnectedAccounts;
exports.getConnectedAccountById = getConnectedAccountById;
exports.executeTool = executeTool;
exports.fetchGmailEmails = fetchGmailEmails;
var axios_1 = require("axios");
var logger_1 = require("../utils/logger");
var errors_1 = require("../utils/errors");
var COMPOSIO_API_BASE = 'https://backend.composio.dev/api/v3';
var config = null;
function initComposio(apiKey) {
    config = { apiKey: apiKey };
}
function getConfig() {
    if (!config) {
        var apiKey = process.env.COMPOSIO_API_KEY;
        if (!apiKey) {
            throw new errors_1.AppError(500, 'COMPOSIO_API_KEY not set in environment');
        }
        config = { apiKey: apiKey };
    }
    return config;
}
function getHeaders() {
    var apiKey = getConfig().apiKey;
    return {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
    };
}
// Cache auth config IDs to avoid recreating them
var authConfigCache = new Map();
function getOrCreateAuthConfig(toolkit) {
    return __awaiter(this, void 0, void 0, function () {
        var listResponse, configs, configId_1, createResponse, configId, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Check cache first
                    if (authConfigCache.has(toolkit)) {
                        return [2 /*return*/, authConfigCache.get(toolkit)];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, axios_1.default.get("".concat(COMPOSIO_API_BASE, "/auth_configs"), {
                            headers: getHeaders(),
                            params: {
                                toolkit: toolkit,
                            },
                        })];
                case 2:
                    listResponse = _a.sent();
                    configs = listResponse.data.items || [];
                    if (configs.length > 0) {
                        configId_1 = configs[0].id;
                        authConfigCache.set(toolkit, configId_1);
                        logger_1.logger.info({ toolkit: toolkit, configId: configId_1 }, 'Found existing auth config');
                        return [2 /*return*/, configId_1];
                    }
                    return [4 /*yield*/, axios_1.default.post("".concat(COMPOSIO_API_BASE, "/auth_configs"), {
                            toolkit: {
                                slug: toolkit,
                            },
                        }, { headers: getHeaders() })];
                case 3:
                    createResponse = _a.sent();
                    configId = createResponse.data.id;
                    authConfigCache.set(toolkit, configId);
                    logger_1.logger.info({ toolkit: toolkit, configId: configId }, 'Created new auth config');
                    return [2 /*return*/, configId];
                case 4:
                    error_1 = _a.sent();
                    if (axios_1.default.isAxiosError(error_1) && error_1.response) {
                        logger_1.logger.error({
                            error: error_1.response.data,
                            toolkit: toolkit
                        }, 'Failed to get or create auth config');
                    }
                    throw new errors_1.AppError(500, "Failed to get or create auth config for ".concat(toolkit));
                case 5: return [2 /*return*/];
            }
        });
    });
}
function initiateConnection(userId_1) {
    return __awaiter(this, arguments, void 0, function (userId, toolkit) {
        var authConfigId, response, error_2;
        if (toolkit === void 0) { toolkit = 'gmail'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, getOrCreateAuthConfig(toolkit)];
                case 1:
                    authConfigId = _a.sent();
                    return [4 /*yield*/, axios_1.default.post("".concat(COMPOSIO_API_BASE, "/connected_accounts/link"), {
                            user_id: userId,
                            auth_config_id: authConfigId,
                            integration_id: toolkit,
                        }, { headers: getHeaders() })];
                case 2:
                    response = _a.sent();
                    logger_1.logger.info({ userId: userId, toolkit: toolkit, authConfigId: authConfigId, response: response.data }, 'Created Composio auth link');
                    return [2 /*return*/, {
                            connectionStatus: 'initiated',
                            connectedAccountId: response.data.connected_account_id,
                            redirectUrl: response.data.redirect_url,
                        }];
                case 3:
                    error_2 = _a.sent();
                    if (axios_1.default.isAxiosError(error_2) && error_2.response) {
                        logger_1.logger.error({
                            error: error_2.response.data,
                            status: error_2.response.status,
                            userId: userId,
                            toolkit: toolkit,
                            url: "".concat(COMPOSIO_API_BASE, "/connected_accounts/link")
                        }, 'Failed to create Composio auth link');
                        throw new errors_1.AppError(500, "Composio API error: ".concat(JSON.stringify(error_2.response.data)));
                    }
                    logger_1.logger.error({ error: error_2, userId: userId, toolkit: toolkit }, 'Failed to create Composio auth link');
                    throw new errors_1.AppError(500, 'Failed to create auth link with Composio');
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getConnectedAccount(userId_1) {
    return __awaiter(this, arguments, void 0, function (userId, toolkit) {
        var response, data, allAccounts, matchingAccounts, result, error_3;
        var _a, _b, _c;
        if (toolkit === void 0) { toolkit = 'gmail'; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.get("".concat(COMPOSIO_API_BASE, "/connected_accounts"), {
                            headers: getHeaders(),
                            params: {
                                showDisabled: false,
                            },
                        })];
                case 1:
                    response = _d.sent();
                    data = response.data;
                    allAccounts = data.items || data.connectedAccounts || data || [];
                    if (!Array.isArray(allAccounts)) {
                        logger_1.logger.warn({ userId: userId, toolkit: toolkit, responseData: data }, 'Invalid response format from Composio');
                        return [2 /*return*/, null];
                    }
                    matchingAccounts = allAccounts.filter(function (acc) {
                        var _a;
                        return acc.user_id === userId &&
                            ((_a = acc.toolkit) === null || _a === void 0 ? void 0 : _a.slug) === toolkit &&
                            (acc.status === 'ACTIVE' || acc.connectionStatus === 'ACTIVE');
                    });
                    if (matchingAccounts.length > 0) {
                        result = matchingAccounts.sort(function (a, b) {
                            return new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime();
                        })[0];
                        logger_1.logger.info({
                            userId: userId,
                            toolkit: toolkit,
                            accountId: result.id,
                            status: result.status,
                            totalMatching: matchingAccounts.length
                        }, 'Found connected account');
                        return [2 /*return*/, result];
                    }
                    logger_1.logger.warn({ userId: userId, toolkit: toolkit, totalAccounts: allAccounts.length }, 'No matching connected accounts found');
                    return [2 /*return*/, null];
                case 2:
                    error_3 = _d.sent();
                    if (axios_1.default.isAxiosError(error_3)) {
                        logger_1.logger.error({
                            userId: userId,
                            toolkit: toolkit,
                            status: (_a = error_3.response) === null || _a === void 0 ? void 0 : _a.status,
                            data: (_b = error_3.response) === null || _b === void 0 ? void 0 : _b.data,
                            url: (_c = error_3.config) === null || _c === void 0 ? void 0 : _c.url
                        }, 'Failed to get connected account');
                    }
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function listConnectedAccounts(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.get("".concat(COMPOSIO_API_BASE, "/connected_accounts"), {
                            headers: getHeaders(),
                            params: {
                                user_id: userId,
                            },
                        })];
                case 1:
                    response = _a.sent();
                    data = response.data;
                    return [2 /*return*/, data.items || data.connectedAccounts || data || []];
                case 2:
                    error_4 = _a.sent();
                    logger_1.logger.error({ error: error_4, userId: userId }, 'Failed to list connected accounts');
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getConnectedAccountById(accountId) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_5;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.get("".concat(COMPOSIO_API_BASE, "/connected_accounts/").concat(accountId), {
                            headers: getHeaders(),
                        })];
                case 1:
                    response = _c.sent();
                    logger_1.logger.info({ accountId: accountId, account: response.data }, 'Retrieved connected account by ID');
                    return [2 /*return*/, response.data];
                case 2:
                    error_5 = _c.sent();
                    if (axios_1.default.isAxiosError(error_5)) {
                        logger_1.logger.error({
                            accountId: accountId,
                            status: (_a = error_5.response) === null || _a === void 0 ? void 0 : _a.status,
                            data: (_b = error_5.response) === null || _b === void 0 ? void 0 : _b.data
                        }, 'Failed to get connected account by ID');
                    }
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function executeTool(request) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_6;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.post("".concat(COMPOSIO_API_BASE, "/tools/execute/").concat(request.actionName), {
                            entity_id: request.entityId, // Required: user_id for entity identification
                            connected_account_id: request.connectedAccountId,
                            arguments: request.input, // v3 uses 'arguments' instead of 'input'
                        }, { headers: getHeaders() })];
                case 1:
                    response = _c.sent();
                    return [2 /*return*/, {
                            data: response.data.data || response.data.response_data || response.data,
                            successful: response.data.successful !== false && response.data.success !== false,
                            error: response.data.error,
                        }];
                case 2:
                    error_6 = _c.sent();
                    logger_1.logger.error({ error: error_6, request: request }, 'Failed to execute Composio tool');
                    if (axios_1.default.isAxiosError(error_6) && error_6.response) {
                        return [2 /*return*/, {
                                data: null,
                                successful: false,
                                error: ((_a = error_6.response.data) === null || _a === void 0 ? void 0 : _a.error) || ((_b = error_6.response.data) === null || _b === void 0 ? void 0 : _b.message) || 'Tool execution failed',
                            }];
                    }
                    throw new errors_1.AppError(500, 'Failed to execute tool');
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Gmail-specific helpers
function fetchGmailEmails(entityId_1, connectedAccountId_1, query_1) {
    return __awaiter(this, arguments, void 0, function (entityId, connectedAccountId, query, maxResults) {
        if (maxResults === void 0) { maxResults = 100; }
        return __generator(this, function (_a) {
            return [2 /*return*/, executeTool({
                    entityId: entityId,
                    connectedAccountId: connectedAccountId,
                    appName: 'gmail',
                    actionName: 'gmail_fetch_emails', // v3 uses lowercase snake_case
                    input: {
                        query: query || "newer_than:90d -category:promotions -category:social",
                        max_results: maxResults, // snake_case for v3 parameters
                        include_payload: false, // snake_case - if true, returns full email content
                        ids_only: false, // snake_case for v3 parameters
                        user_id: 'me', // snake_case for v3 parameters
                        verbose: true, // Get basic metadata even with include_payload=false
                    },
                })];
        });
    });
}
