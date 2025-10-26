interface ProcessedEmail {
    id: string;
    threadId: string;
    subject: string;
    sender: string;
    recipient: string;
    timestamp: string;
    labels: string[];
    cleanText: string;
    htmlContent: string;
    hasAttachments: boolean;
    attachmentCount: number;
    attachmentFilenames: string[];
}
export declare class EmailCleaner {
    private maxUrlLength;
    private removeElements;
    private noiseElements;
    private trackingParams;
    constructor(maxUrlLength?: number);
    cleanHtmlEmail(htmlContent: string): string;
    truncateUrl(url: string): string;
    removeTrackingParams(url: string): string;
    isUrlLike(text: string): boolean;
    postProcessText(text: string): string;
    fallbackTextExtraction(htmlContent: string): string;
    processEmail(rawMessage: any): ProcessedEmail;
    processEmails(rawMessages: any[]): ProcessedEmail[];
}
export type { ProcessedEmail };
//# sourceMappingURL=email-cleaner.d.ts.map