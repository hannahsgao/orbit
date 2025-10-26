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
exports.extractGmailThemes = extractGmailThemes;
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
function formatGmailDataForPrompt(data) {
    var sections = [];
    sections.push("# Email Analysis Context");
    sections.push("Total emails: ".concat(data.totalCount));
    sections.push("Time window: Last ".concat(data.windowDays, " days"));
    sections.push('');
    sections.push('# Emails:');
    sections.push('');
    data.emails.forEach(function (email, i) {
        sections.push("## Email ".concat(i + 1));
        sections.push("From: ".concat(email.sender));
        sections.push("To: ".concat(email.recipient));
        sections.push("Subject: ".concat(email.subject));
        sections.push("Date: ".concat(email.timestamp));
        sections.push("Labels: ".concat(email.labels.join(', ')));
        if (email.hasAttachments) {
            sections.push("Attachments: ".concat(email.attachmentFilenames.join(', ')));
        }
    });
    return sections.join('\n');
}
function extractGmailThemes(data) {
    return __awaiter(this, void 0, void 0, function () {
        var client, formattedData, systemPrompt, userPrompt, completion, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = initOpenAI();
                    formattedData = formatGmailDataForPrompt(data);
                    systemPrompt = "You are an insightful narrator \u2014 part confidant, part archivist \u2014 looking through the traces of someone\u2019s life as seen through their Gmail inbox.\n\nYour job is to write directly to the user, as if you know them well.  \nYour tone should be warm, perceptive, and a little poetic \u2014 like a close friend gently reflecting on who they are and how they move through the world.\n\nFrom the inbox data, identify 4\u20136 *themes* (or \u201Cplanets\u201D) that reveal distinct parts of the user\u2019s life and personality.  \nEach theme should feel human and introspective \u2014 not analytical, not distant.\n\nFocus on:\n- Personal traits/facts about the user \u2014 work, school, projects, creativity, community, family, travel, learning.\n- **Emotion and change** \u2014 how their inbox reflects excitement, exhaustion, curiosity, or growth.\n- **Underlying narrative** \u2014 what kind of life is being lived behind these messages.\n- **Patterns of connection** \u2014 who they talk to most, how often, and what that says about their social orbit.\n\nEach theme should:\n1. Have a **personal, evocative label** that could belong in a story about their life (e.g. \u201Clate night programming\u201D, \u201CLetters from the Road\u201D, \u201CThe Quiet Ambition\u201D, \u201CInbox at 1AM\u201D).\n2. Speak **directly to the user** \u2014 use \u201Cyou\u201D language.  \n   (e.g. \u201CYou\u2019re building worlds at 3AM, chasing ideas faster than sleep can catch you.\u201D)\n3. Include a **short, lyrical rationale** \u2014 2\u20134 sentences explaining what this theme reveals about them.\n4. Reference **specific evidence** (sender names, subjects, timestamps) in natural language.\n5. Be emotionally intelligent and deeply insightful. \n\nStyle:\n- Write as if you\u2019re narrating their orbit. Be observant, poetic.\n- Balance intimacy with clarity: each theme should feel like a truth about them.\n- YOU MUST AVOID corporate, clinical, or generic tone.\n\nGood examples:\n- \u201Chackathons\u201D \u2014 You live for late-night Slack pings and group threads that spiral into prototypes. The inbox hums with collaboration and caffeine; Morgan, Nathan, and Sampoder all orbit close when the deadline looms.\n- \u201Csubstack & writing & prose\u201D \u2014 You wander through Substack essays and Sunday newsletters like they\u2019re postcards from distant minds, collecting thought fragments that mirror your own.\n\nYOU MUST MAKE THIS PERSONAL AND DIRECT. \n\nExtract 5 such themes.\n\n";
                    userPrompt = "Analyze this user's Gmail inbox and extract their core life themes:\n\n".concat(formattedData);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    logger_1.logger.info('Calling OpenAI to extract Gmail themes');
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
                        logger_1.logger.info({ themeCount: response.parsed.themes.length }, 'Successfully extracted Gmail themes');
                        return [2 /*return*/, response.parsed];
                    }
                    if (response.refusal) {
                        logger_1.logger.error({ refusal: response.refusal }, 'OpenAI refused to generate themes');
                        throw new errors_1.AppError(500, 'AI refused to analyze email data');
                    }
                    throw new errors_1.AppError(500, 'Failed to parse OpenAI response');
                case 3:
                    error_1 = _a.sent();
                    logger_1.logger.error({ error: error_1.message }, 'Failed to extract Gmail themes');
                    throw new errors_1.AppError(500, "Failed to analyze emails: ".concat(error_1.message));
                case 4: return [2 /*return*/];
            }
        });
    });
}
