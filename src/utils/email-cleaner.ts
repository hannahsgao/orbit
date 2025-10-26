import * as cheerio from 'cheerio';

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

export class EmailCleaner {
  private maxUrlLength: number;
  private removeElements: string[];
  private noiseElements: string[];
  private trackingParams: Set<string>;

  constructor(maxUrlLength: number = 60) {
    this.maxUrlLength = maxUrlLength;
    this.removeElements = [
      'style',
      'script',
      'meta',
      'link',
      'title',
      'head',
      'noscript',
      'iframe',
      'embed',
      'object',
      'img',
    ];
    this.noiseElements = [
      'footer',
      'header',
      '.footer',
      '.header',
      '[class*="footer"]',
      '[class*="header"]',
      '[class*="tracking"]',
      '[class*="pixel"]',
      '[style*="display:none"]',
      '[style*="display: none"]',
    ];
    this.trackingParams = new Set([
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'gclid',
      'fbclid',
      'ref',
      'trk',
    ]);
  }

  cleanHtmlEmail(htmlContent: string): string {
    try {
      const $ = cheerio.load(htmlContent);

      // Remove unwanted elements
      this.removeElements.forEach((element) => {
        $(element).remove();
      });

      // Remove noise elements
      this.noiseElements.forEach((selector) => {
        try {
          $(selector).remove();
        } catch (error) {
          // Ignore selector errors
        }
      });

      // Process links
      $('a').each((_, link) => {
        const $link = $(link);
        const href = $link.attr('href') || '';
        const text = $link.text().trim();

        if (href) {
          const displayUrl = this.truncateUrl(href);

          if (text && text !== href && !this.isUrlLike(text)) {
            $link.replaceWith(`${text} (${displayUrl})`);
          } else if (text && text !== href) {
            $link.replaceWith(`[Link: ${displayUrl}]`);
          } else {
            $link.replaceWith(`[Link: ${displayUrl}]`);
          }
        }
      });

      // Extract text
      let text = $.text();
      return this.postProcessText(text);
    } catch (error) {
      console.error('Error cleaning HTML email:', error);
      return this.fallbackTextExtraction(htmlContent);
    }
  }

  truncateUrl(url: string): string {
    if (!url || url.length <= this.maxUrlLength) {
      return url;
    }

    const cleaned = this.removeTrackingParams(url);
    if (cleaned.length <= this.maxUrlLength) {
      return cleaned;
    }

    return `${cleaned.substring(0, this.maxUrlLength)}...`;
  }

  removeTrackingParams(url: string): string {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);

      // Remove tracking parameters
      this.trackingParams.forEach((param) => {
        params.delete(param);
      });

      urlObj.search = params.toString();
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }

  isUrlLike(text: string): boolean {
    if (!text) return false;
    const lowered = text.toLowerCase();
    if (
      lowered.startsWith('http://') ||
      lowered.startsWith('https://') ||
      lowered.startsWith('www.') ||
      lowered.startsWith('ftp://')
    ) {
      return true;
    }
    return text.includes('.') && !text.includes(' ') && text.split('.').length >= 2;
  }

  postProcessText(text: string): string {
    // Unescape HTML entities (cheerio does most of this)
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');

    // Remove excessive newlines
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');

    // Remove excessive spaces
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n /g, '\n');

    // Remove common noise patterns
    const noisePatterns = [
      /View this email in your browser.*?\n/gi,
      /If you can't see this email.*?\n/gi,
      /This is a system-generated email.*?\n/gi,
      /Please do not reply to this email.*?\n/gi,
      /Unsubscribe.*?preferences.*?\n/gi,
      /© \d{4}.*?All rights reserved.*?\n/gi,
      /\[Image:.*?\]/g,
      /\[Image\]/g,
      /<image>.*?<\/image>/g,
      /\(image\)/gi,
      /Image: .*?\n/g,
      /Alt text: .*?\n/g,
    ];

    noisePatterns.forEach((pattern) => {
      text = text.replace(pattern, '');
    });

    // Final cleanup
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();

    return text;
  }

  fallbackTextExtraction(htmlContent: string): string {
    // Simple regex-based text extraction
    let stripped = htmlContent.replace(/<[^>]+>/g, ' ');
    stripped = stripped.replace(/\s+/g, ' ');
    return this.postProcessText(stripped);
  }

  processEmail(rawMessage: any): ProcessedEmail {
    const messageId = rawMessage.messageId || rawMessage.id || '';
    const threadId = rawMessage.threadId || messageId;
    const subject = rawMessage.subject || 'No Subject';
    const sender = rawMessage.sender || 'Unknown Sender';
    const recipient = rawMessage.to || '';
    const timestamp = rawMessage.messageTimestamp || new Date().toISOString();
    const labels = rawMessage.labelIds || [];
    const htmlContent = rawMessage.messageText || '';
    
    // Clean the HTML content
    const cleanText = htmlContent ? this.cleanHtmlEmail(htmlContent) : '';

    // Process attachments
    const attachmentList = rawMessage.attachmentList || [];
    const hasAttachments = attachmentList.length > 0;
    const attachmentCount = attachmentList.length;
    const attachmentFilenames = attachmentList
      .map((att: any) => att.filename || att.name)
      .filter(Boolean);

    return {
      id: messageId,
      threadId,
      subject,
      sender,
      recipient,
      timestamp,
      labels,
      cleanText,
      htmlContent,
      hasAttachments,
      attachmentCount,
      attachmentFilenames,
    };
  }

  processEmails(rawMessages: any[]): ProcessedEmail[] {
    return rawMessages.map((msg) => this.processEmail(msg));
  }
}

export type { ProcessedEmail };

