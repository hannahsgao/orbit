import { z } from 'zod';
export declare const GmailMessageMetaSchema: z.ZodObject<{
    id: z.ZodString;
    threadId: z.ZodString;
    subject: z.ZodString;
    fromName: z.ZodString;
    fromEmail: z.ZodString;
    date: z.ZodString;
    labels: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    date: string;
    id: string;
    threadId: string;
    subject: string;
    labels: string[];
    fromName: string;
    fromEmail: string;
}, {
    date: string;
    id: string;
    threadId: string;
    subject: string;
    labels: string[];
    fromName: string;
    fromEmail: string;
}>;
export declare const GmailMessagesResponseSchema: z.ZodObject<{
    source: z.ZodLiteral<"gmail">;
    fetchedAt: z.ZodString;
    windowDays: z.ZodNumber;
    messages: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        threadId: z.ZodString;
        subject: z.ZodString;
        fromName: z.ZodString;
        fromEmail: z.ZodString;
        date: z.ZodString;
        labels: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        date: string;
        id: string;
        threadId: string;
        subject: string;
        labels: string[];
        fromName: string;
        fromEmail: string;
    }, {
        date: string;
        id: string;
        threadId: string;
        subject: string;
        labels: string[];
        fromName: string;
        fromEmail: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    source: "gmail";
    windowDays: number;
    fetchedAt: string;
    messages: {
        date: string;
        id: string;
        threadId: string;
        subject: string;
        labels: string[];
        fromName: string;
        fromEmail: string;
    }[];
}, {
    source: "gmail";
    windowDays: number;
    fetchedAt: string;
    messages: {
        date: string;
        id: string;
        threadId: string;
        subject: string;
        labels: string[];
        fromName: string;
        fromEmail: string;
    }[];
}>;
export declare const TopSenderSchema: z.ZodObject<{
    sender: z.ZodString;
    count: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    sender: string;
    count: number;
}, {
    sender: string;
    count: number;
}>;
export declare const TopicTokenSchema: z.ZodObject<{
    token: z.ZodString;
    score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    token: string;
    score: number;
}, {
    token: string;
    score: number;
}>;
export declare const GmailAggregatesSchema: z.ZodObject<{
    topSenders: z.ZodArray<z.ZodObject<{
        sender: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        sender: string;
        count: number;
    }, {
        sender: string;
        count: number;
    }>, "many">;
    topicTokens: z.ZodArray<z.ZodObject<{
        token: z.ZodString;
        score: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        token: string;
        score: number;
    }, {
        token: string;
        score: number;
    }>, "many">;
    cadencePerWeek: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    topSenders: {
        sender: string;
        count: number;
    }[];
    topicTokens: {
        token: string;
        score: number;
    }[];
    cadencePerWeek: number;
}, {
    topSenders: {
        sender: string;
        count: number;
    }[];
    topicTokens: {
        token: string;
        score: number;
    }[];
    cadencePerWeek: number;
}>;
export declare const GmailSummaryResponseSchema: z.ZodObject<{
    source: z.ZodLiteral<"gmail">;
    fetchedAt: z.ZodString;
    windowDays: z.ZodNumber;
    aggregates: z.ZodObject<{
        topSenders: z.ZodArray<z.ZodObject<{
            sender: z.ZodString;
            count: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            sender: string;
            count: number;
        }, {
            sender: string;
            count: number;
        }>, "many">;
        topicTokens: z.ZodArray<z.ZodObject<{
            token: z.ZodString;
            score: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            token: string;
            score: number;
        }, {
            token: string;
            score: number;
        }>, "many">;
        cadencePerWeek: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        topSenders: {
            sender: string;
            count: number;
        }[];
        topicTokens: {
            token: string;
            score: number;
        }[];
        cadencePerWeek: number;
    }, {
        topSenders: {
            sender: string;
            count: number;
        }[];
        topicTokens: {
            token: string;
            score: number;
        }[];
        cadencePerWeek: number;
    }>;
}, "strip", z.ZodTypeAny, {
    source: "gmail";
    windowDays: number;
    fetchedAt: string;
    aggregates: {
        topSenders: {
            sender: string;
            count: number;
        }[];
        topicTokens: {
            token: string;
            score: number;
        }[];
        cadencePerWeek: number;
    };
}, {
    source: "gmail";
    windowDays: number;
    fetchedAt: string;
    aggregates: {
        topSenders: {
            sender: string;
            count: number;
        }[];
        topicTokens: {
            token: string;
            score: number;
        }[];
        cadencePerWeek: number;
    };
}>;
export type GmailMessageMeta = z.infer<typeof GmailMessageMetaSchema>;
export type GmailMessagesResponse = z.infer<typeof GmailMessagesResponseSchema>;
export type TopSender = z.infer<typeof TopSenderSchema>;
export type TopicToken = z.infer<typeof TopicTokenSchema>;
export type GmailAggregates = z.infer<typeof GmailAggregatesSchema>;
export type GmailSummaryResponse = z.infer<typeof GmailSummaryResponseSchema>;
//# sourceMappingURL=gmail.d.ts.map