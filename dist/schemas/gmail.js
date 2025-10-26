"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailSummaryResponseSchema = exports.GmailAggregatesSchema = exports.TopicTokenSchema = exports.TopSenderSchema = exports.GmailMessagesResponseSchema = exports.GmailMessageMetaSchema = void 0;
const zod_1 = require("zod");
exports.GmailMessageMetaSchema = zod_1.z.object({
    id: zod_1.z.string(),
    threadId: zod_1.z.string(),
    subject: zod_1.z.string(),
    fromName: zod_1.z.string(),
    fromEmail: zod_1.z.string(), // Redacted
    date: zod_1.z.string(), // ISO format
    labels: zod_1.z.array(zod_1.z.string()),
});
exports.GmailMessagesResponseSchema = zod_1.z.object({
    source: zod_1.z.literal('gmail'),
    fetchedAt: zod_1.z.string(),
    windowDays: zod_1.z.number(),
    messages: zod_1.z.array(exports.GmailMessageMetaSchema),
});
exports.TopSenderSchema = zod_1.z.object({
    sender: zod_1.z.string(),
    count: zod_1.z.number(),
});
exports.TopicTokenSchema = zod_1.z.object({
    token: zod_1.z.string(),
    score: zod_1.z.number(),
});
exports.GmailAggregatesSchema = zod_1.z.object({
    topSenders: zod_1.z.array(exports.TopSenderSchema),
    topicTokens: zod_1.z.array(exports.TopicTokenSchema),
    cadencePerWeek: zod_1.z.number(),
});
exports.GmailSummaryResponseSchema = zod_1.z.object({
    source: zod_1.z.literal('gmail'),
    fetchedAt: zod_1.z.string(),
    windowDays: zod_1.z.number(),
    aggregates: exports.GmailAggregatesSchema,
});
//# sourceMappingURL=gmail.js.map