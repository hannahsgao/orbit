import { z } from 'zod';

export const GmailMessageMetaSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  subject: z.string(),
  fromName: z.string(),
  fromEmail: z.string(), // Redacted
  date: z.string(), // ISO format
  labels: z.array(z.string()),
});

export const GmailMessagesResponseSchema = z.object({
  source: z.literal('gmail'),
  fetchedAt: z.string(),
  windowDays: z.number(),
  messages: z.array(GmailMessageMetaSchema),
});

export const TopSenderSchema = z.object({
  sender: z.string(),
  count: z.number(),
});

export const TopicTokenSchema = z.object({
  token: z.string(),
  score: z.number(),
});

export const GmailAggregatesSchema = z.object({
  topSenders: z.array(TopSenderSchema),
  topicTokens: z.array(TopicTokenSchema),
  cadencePerWeek: z.number(),
});

export const GmailSummaryResponseSchema = z.object({
  source: z.literal('gmail'),
  fetchedAt: z.string(),
  windowDays: z.number(),
  aggregates: GmailAggregatesSchema,
});

export type GmailMessageMeta = z.infer<typeof GmailMessageMetaSchema>;
export type GmailMessagesResponse = z.infer<typeof GmailMessagesResponseSchema>;
export type TopSender = z.infer<typeof TopSenderSchema>;
export type TopicToken = z.infer<typeof TopicTokenSchema>;
export type GmailAggregates = z.infer<typeof GmailAggregatesSchema>;
export type GmailSummaryResponse = z.infer<typeof GmailSummaryResponseSchema>;

