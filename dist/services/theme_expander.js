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
exports.expandTheme = expandTheme;
var openai_1 = require("openai");
var zod_1 = require("openai/helpers/zod");
var logger_1 = require("../utils/logger");
var errors_1 = require("../utils/errors");
var zod_2 = require("zod");
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
// Schema for sub-theme generation
var SubThemeSchema = zod_2.z.object({
    label: zod_2.z.string().describe('Concise label for the sub-theme'),
    rationale: zod_2.z.string().describe('Why this sub-theme exists within the parent theme'),
    sources: zod_2.z.array(zod_2.z.object({
        title: zod_2.z.string(),
        type: zod_2.z.enum(['track', 'artist', 'playlist', 'genre', 'email', 'sender', 'conversation', 'detail']),
    })).describe('2-3 specific examples'),
});
var SubThemesOutputSchema = zod_2.z.object({
    subthemes: zod_2.z.array(SubThemeSchema).describe('2-4 sub-themes that dive deeper into the parent theme'),
});
/**
 * Generate sub-themes for a given parent theme using LLM
 */
function expandTheme(request) {
    return __awaiter(this, void 0, void 0, function () {
        var client, parentTheme, sourceType, sourceExamples, systemPrompt, completion, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = initOpenAI();
                    parentTheme = request.parentTheme;
                    sourceType = parentTheme.dataSource;
                    sourceExamples = parentTheme.sources.map(function (s) { return s.title; }).join(', ');
                    systemPrompt = '';
                    if (sourceType === 'spotify') {
                        systemPrompt = "You are a music analyst helping to explore deeper aspects of a user's musical theme.\n\nThe user has a theme called \"".concat(parentTheme.label, "\" with this rationale:\n\"").concat(parentTheme.rationale, "\"\n\nEvidence: ").concat(sourceExamples, "\n\nYour job is to identify 2-4 **sub-themes** that represent more specific or nuanced aspects of this theme.\n\nEach sub-theme should:\n1. Be a natural subdivision or specific aspect of \"").concat(parentTheme.label, "\"\n2. Maintain the same tone and insight as the parent\n3. Reference 2-3 specific examples from the user's music that support it\n4. Feel like you're zooming into a specific corner of the parent theme\n\nGood examples:\nIf parent is \"Late-Night Study Desk\" \u2192 [\"Lofi Hip-Hop Focus\", \"Ambient Instrumental Flow\", \"Coffee Shop Acoustics\"]\nIf parent is \"Workout Energy\" \u2192 [\"Cardio Tempo Hits\", \"Weightlifting Power Tracks\", \"Cool-Down Rhythms\"]\n\nGenerate sub-themes that feel like natural expansions of \"").concat(parentTheme.label, "\".");
                    }
                    else if (sourceType === 'gmail') {
                        systemPrompt = "You are a life analyst helping to explore deeper aspects of a user's communication theme.\n\nThe user has a theme called \"".concat(parentTheme.label, "\" with this rationale:\n\"").concat(parentTheme.rationale, "\"\n\nEvidence: ").concat(sourceExamples, "\n\nYour job is to identify 2-4 **sub-themes** that represent more specific aspects of this life area.\n\nEach sub-theme should:\n1. Be a natural subdivision of \"").concat(parentTheme.label, "\"\n2. Maintain the personal, narrative tone\n3. Reference 2-3 specific examples (senders, subject patterns, or conversation types)\n4. Feel like zooming into a specific part of their life\n\nGood examples:\nIf parent is \"Project Command Center\" \u2192 [\"Weekend Deadline Sprints\", \"Client Check-ins\", \"Team Collaboration\"]\nIf parent is \"Learning Journey\" \u2192 [\"Course Enrollments\", \"Tutorial Deep-Dives\", \"Knowledge Sharing\"]\n\nGenerate sub-themes that naturally expand \"").concat(parentTheme.label, "\".");
                    }
                    else {
                        systemPrompt = "You are analyzing a multi-source theme about a user's interests and activities.\n\nThe user has a theme called \"".concat(parentTheme.label, "\" with this rationale:\n\"").concat(parentTheme.rationale, "\"\n\nEvidence: ").concat(sourceExamples, "\n\nYour job is to identify 2-4 **sub-themes** that dive deeper into specific aspects.\n\nEach sub-theme should:\n1. Represent a focused aspect of \"").concat(parentTheme.label, "\"\n2. Feel personal and specific to this user\n3. Include 2-3 concrete examples\n4. Maintain the insight and tone of the parent\n\nGenerate sub-themes that naturally expand \"").concat(parentTheme.label, "\".");
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    logger_1.logger.info({ parentLabel: parentTheme.label }, 'Expanding theme with LLM');
                    return [4 /*yield*/, client.beta.chat.completions.parse({
                            model: 'gpt-4o-2024-08-06',
                            messages: [
                                { role: 'system', content: systemPrompt },
                                {
                                    role: 'user',
                                    content: "Generate 2-4 sub-themes that explore different aspects of \"".concat(parentTheme.label, "\".")
                                },
                            ],
                            response_format: (0, zod_1.zodResponseFormat)(SubThemesOutputSchema, 'subthemes'),
                            temperature: 0.7, // Slightly higher for creative sub-theme generation
                        })];
                case 2:
                    completion = _a.sent();
                    response = completion.choices[0].message;
                    if (response.parsed) {
                        logger_1.logger.info({
                            parentLabel: parentTheme.label,
                            subthemeCount: response.parsed.subthemes.length
                        }, 'Successfully generated sub-themes');
                        return [2 /*return*/, response.parsed.subthemes];
                    }
                    if (response.refusal) {
                        logger_1.logger.error({ refusal: response.refusal }, 'OpenAI refused to generate sub-themes');
                        throw new errors_1.AppError(500, 'AI refused to generate sub-themes');
                    }
                    throw new errors_1.AppError(500, 'Failed to parse OpenAI response');
                case 3:
                    error_1 = _a.sent();
                    logger_1.logger.error({ error: error_1.message, parentLabel: parentTheme.label }, 'Failed to expand theme');
                    throw new errors_1.AppError(500, "Failed to generate sub-themes: ".concat(error_1.message));
                case 4: return [2 /*return*/];
            }
        });
    });
}
