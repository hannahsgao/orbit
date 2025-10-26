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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var composio_1 = require("../services/composio");
var errors_1 = require("../utils/errors");
var logger_1 = require("../utils/logger");
var email_cleaner_1 = require("../utils/email-cleaner");
var gmail_themes_1 = require("../services/gmail_themes");
var router = (0, express_1.Router)();
// Helper to get user ID from request
function getUserId(req) {
    // Use session_id cookie or default to 'default_user'
    return req.cookies.session_id || req.cookies.gmail_session_id || 'default_user';
}
// Initiate Gmail connection via Composio (GET - browser friendly)
router.get('/gmail/connect', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, connectionRequest, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.query.userId || getUserId(req);
                logger_1.logger.info({ userId: userId }, 'Initiating Gmail connection via Composio');
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, (0, composio_1.initiateConnection)(userId, 'gmail')];
            case 2:
                connectionRequest = _a.sent();
                logger_1.logger.info({ userId: userId, redirectUrl: connectionRequest.redirectUrl }, 'Got redirect URL from Composio');
                // Redirect directly to Composio auth URL
                return [2 /*return*/, res.redirect(connectionRequest.redirectUrl)];
            case 3:
                error_1 = _a.sent();
                logger_1.logger.error({ error: error_1, userId: userId }, 'Failed to initiate Gmail connection');
                return [2 /*return*/, res.send("\n      <html>\n        <head><title>Gmail Connection Failed</title></head>\n        <body style=\"font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;\">\n          <h1>\u2717 Connection Failed</h1>\n          <p>Failed to initiate Gmail connection with Composio.</p>\n          <p><strong>User ID:</strong> ".concat(userId, "</p>\n          <p><strong>Error:</strong> ").concat(error_1 instanceof Error ? error_1.message : 'Unknown error', "</p>\n          <h3>Troubleshooting:</h3>\n          <ul>\n            <li>Make sure your <code>COMPOSIO_API_KEY</code> is set correctly in <code>.env</code></li>\n            <li>Check that the API key is valid at <a href=\"https://app.composio.dev\" target=\"_blank\">app.composio.dev</a></li>\n            <li>Try using a simple user ID: <a href=\"/gmail/connect?userId=test-user\">/gmail/connect?userId=test-user</a></li>\n          </ul>\n          <p><a href=\"/gmail/connect?userId=test-user\">Try again with test-user</a></p>\n        </body>\n      </html>\n    "))];
            case 4: return [2 /*return*/];
        }
    });
}); });
// POST version for API usage
router.post('/gmail/connect', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, existingAccount, connectionRequest, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.body.userId || getUserId(req);
                logger_1.logger.info({ userId: userId }, 'Initiating Gmail connection via Composio (POST)');
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, (0, composio_1.getConnectedAccount)(userId, 'gmail')];
            case 2:
                existingAccount = _a.sent();
                if (existingAccount) {
                    return [2 /*return*/, res.json({
                            message: 'Already connected',
                            connectedAccountId: existingAccount.id,
                            status: 'active',
                        })];
                }
                return [4 /*yield*/, (0, composio_1.initiateConnection)(userId, 'gmail')];
            case 3:
                connectionRequest = _a.sent();
                return [2 /*return*/, res.json({
                        message: 'Visit the redirect URL to authenticate Gmail',
                        redirectUrl: connectionRequest.redirectUrl,
                        connectedAccountId: connectionRequest.connectedAccountId,
                        status: connectionRequest.connectionStatus,
                    })];
            case 4:
                error_2 = _a.sent();
                logger_1.logger.error({ error: error_2, userId: userId }, 'Failed to initiate Gmail connection');
                throw new errors_1.AppError(500, 'Failed to initiate Gmail connection');
            case 5: return [2 /*return*/];
        }
    });
}); });
// Debug: List ALL connected accounts for a user
router.get('/gmail/debug/accounts', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, accounts, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.query.userId || getUserId(req);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, (0, composio_1.listConnectedAccounts)(userId)];
            case 2:
                accounts = _a.sent();
                logger_1.logger.info({ userId: userId, count: accounts.length, fullAccounts: accounts }, 'Listed all connected accounts with full details');
                return [2 /*return*/, res.json({
                        userId: userId,
                        totalAccounts: accounts.length,
                        accounts: accounts.map(function (acc) { return ({
                            id: acc.id,
                            integrationId: acc.integrationId || acc.integration_id || acc.appName,
                            status: acc.status || acc.connectionStatus,
                            createdAt: acc.createdAt || acc.created_at,
                            // Show all fields to debug
                            raw: acc,
                        }); }),
                    })];
            case 3:
                error_3 = _a.sent();
                logger_1.logger.error({ error: error_3, userId: userId }, 'Failed to list accounts');
                throw new errors_1.AppError(500, 'Failed to list accounts');
            case 4: return [2 /*return*/];
        }
    });
}); });
// Check Gmail connection status
router.get('/gmail/status', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, account, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.query.userId || getUserId(req);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, (0, composio_1.getConnectedAccount)(userId, 'gmail')];
            case 2:
                account = _a.sent();
                if (!account) {
                    return [2 /*return*/, res.json({
                            connected: false,
                            message: 'No Gmail account connected. Use POST /gmail/connect to authenticate.',
                        })];
                }
                return [2 /*return*/, res.json({
                        connected: true,
                        connectedAccountId: account.id,
                        status: account.status,
                        createdAt: account.createdAt,
                    })];
            case 3:
                error_4 = _a.sent();
                logger_1.logger.error({ error: error_4, userId: userId }, 'Failed to check Gmail status');
                throw new errors_1.AppError(500, 'Failed to check connection status');
            case 4: return [2 /*return*/];
        }
    });
}); });
// Fetch Gmail messages
router.get('/gmail/messages', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, includeHtml, account, result, rawMessages, emailCleaner, processedEmails, messages, error_5;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = req.query.userId || getUserId(req);
                includeHtml = req.query.includeHtml === 'true';
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                return [4 /*yield*/, (0, composio_1.getConnectedAccount)(userId, 'gmail')];
            case 2:
                account = _b.sent();
                if (!account) {
                    throw new errors_1.AppError(401, 'Gmail not connected. Use POST /gmail/connect first.');
                }
                return [4 /*yield*/, (0, composio_1.fetchGmailEmails)(userId, account.id)];
            case 3:
                result = _b.sent();
                if (!result.successful) {
                    throw new errors_1.AppError(500, result.error || 'Failed to fetch emails');
                }
                rawMessages = ((_a = result.data) === null || _a === void 0 ? void 0 : _a.messages) || [];
                emailCleaner = new email_cleaner_1.EmailCleaner();
                processedEmails = emailCleaner.processEmails(rawMessages);
                messages = includeHtml
                    ? processedEmails
                    : processedEmails.map(function (_a) {
                        var htmlContent = _a.htmlContent, rest = __rest(_a, ["htmlContent"]);
                        return rest;
                    });
                logger_1.logger.info({ userId: userId, count: messages.length }, 'Processed Gmail messages');
                return [2 /*return*/, res.json({
                        source: 'gmail',
                        provider: 'composio',
                        fetchedAt: new Date().toISOString(),
                        windowDays: 90,
                        count: messages.length,
                        messages: messages,
                    })];
            case 4:
                error_5 = _b.sent();
                logger_1.logger.error({ error: error_5, userId: userId }, 'Failed to fetch Gmail messages');
                if (error_5 instanceof errors_1.AppError) {
                    throw error_5;
                }
                throw new errors_1.AppError(500, 'Failed to fetch Gmail messages');
            case 5: return [2 /*return*/];
        }
    });
}); });
// Extract Gmail themes using AI
router.get('/gmail/themes', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, account, result, rawMessages, emailCleaner, processedEmails, themes, error_6;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = req.query.userId || getUserId(req);
                _b.label = 1;
            case 1:
                _b.trys.push([1, 5, , 6]);
                return [4 /*yield*/, (0, composio_1.getConnectedAccount)(userId, 'gmail')];
            case 2:
                account = _b.sent();
                if (!account) {
                    return [2 /*return*/, res.status(401).json({
                            error: 'Gmail not connected',
                            message: 'Please authenticate with Gmail first',
                            connectUrl: '/gmail/connect'
                        })];
                }
                return [4 /*yield*/, (0, composio_1.fetchGmailEmails)(userId, account.id)];
            case 3:
                result = _b.sent();
                if (!result.successful) {
                    throw new errors_1.AppError(500, result.error || 'Failed to fetch emails');
                }
                rawMessages = ((_a = result.data) === null || _a === void 0 ? void 0 : _a.messages) || [];
                emailCleaner = new email_cleaner_1.EmailCleaner();
                processedEmails = emailCleaner.processEmails(rawMessages);
                if (processedEmails.length === 0) {
                    throw new errors_1.AppError(400, 'No emails found to analyze. Connect Gmail and ensure you have emails in your inbox.');
                }
                logger_1.logger.info({ userId: userId, emailCount: processedEmails.length }, 'Extracting Gmail themes');
                return [4 /*yield*/, (0, gmail_themes_1.extractGmailThemes)({
                        emails: processedEmails,
                        totalCount: processedEmails.length,
                        windowDays: 90,
                    })];
            case 4:
                themes = _b.sent();
                return [2 /*return*/, res.json({
                        source: 'gmail',
                        provider: 'composio',
                        analyzedAt: new Date().toISOString(),
                        emailsAnalyzed: processedEmails.length,
                        windowDays: 90,
                        themes: themes.themes,
                    })];
            case 5:
                error_6 = _b.sent();
                logger_1.logger.error({ error: error_6, userId: userId }, 'Failed to extract Gmail themes');
                if (error_6 instanceof errors_1.AppError) {
                    return [2 /*return*/, res.status(error_6.statusCode).json({
                            error: error_6.message
                        })];
                }
                return [2 /*return*/, res.status(500).json({
                        error: 'Failed to extract Gmail themes'
                    })];
            case 6: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
