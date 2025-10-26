"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailCleaner = void 0;
var cheerio = require("cheerio");
var EmailCleaner = /** @class */ (function () {
    function EmailCleaner(maxUrlLength) {
        if (maxUrlLength === void 0) { maxUrlLength = 60; }
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
    EmailCleaner.prototype.cleanHtmlEmail = function (htmlContent) {
        var _this = this;
        try {
            var $_1 = cheerio.load(htmlContent);
            // Remove unwanted elements
            this.removeElements.forEach(function (element) {
                $_1(element).remove();
            });
            // Remove noise elements
            this.noiseElements.forEach(function (selector) {
                try {
                    $_1(selector).remove();
                }
                catch (error) {
                    // Ignore selector errors
                }
            });
            // Process links
            $_1('a').each(function (_, link) {
                var $link = $_1(link);
                var href = $link.attr('href') || '';
                var text = $link.text().trim();
                if (href) {
                    var displayUrl = _this.truncateUrl(href);
                    if (text && text !== href && !_this.isUrlLike(text)) {
                        $link.replaceWith("".concat(text, " (").concat(displayUrl, ")"));
                    }
                    else if (text && text !== href) {
                        $link.replaceWith("[Link: ".concat(displayUrl, "]"));
                    }
                    else {
                        $link.replaceWith("[Link: ".concat(displayUrl, "]"));
                    }
                }
            });
            // Extract text
            var text = $_1.text();
            return this.postProcessText(text);
        }
        catch (error) {
            console.error('Error cleaning HTML email:', error);
            return this.fallbackTextExtraction(htmlContent);
        }
    };
    EmailCleaner.prototype.truncateUrl = function (url) {
        if (!url || url.length <= this.maxUrlLength) {
            return url;
        }
        var cleaned = this.removeTrackingParams(url);
        if (cleaned.length <= this.maxUrlLength) {
            return cleaned;
        }
        return "".concat(cleaned.substring(0, this.maxUrlLength), "...");
    };
    EmailCleaner.prototype.removeTrackingParams = function (url) {
        try {
            var urlObj = new URL(url);
            var params_1 = new URLSearchParams(urlObj.search);
            // Remove tracking parameters
            this.trackingParams.forEach(function (param) {
                params_1.delete(param);
            });
            urlObj.search = params_1.toString();
            return urlObj.toString();
        }
        catch (error) {
            return url;
        }
    };
    EmailCleaner.prototype.isUrlLike = function (text) {
        if (!text)
            return false;
        var lowered = text.toLowerCase();
        if (lowered.startsWith('http://') ||
            lowered.startsWith('https://') ||
            lowered.startsWith('www.') ||
            lowered.startsWith('ftp://')) {
            return true;
        }
        return text.includes('.') && !text.includes(' ') && text.split('.').length >= 2;
    };
    EmailCleaner.prototype.postProcessText = function (text) {
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
        var noisePatterns = [
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
        noisePatterns.forEach(function (pattern) {
            text = text.replace(pattern, '');
        });
        // Final cleanup
        text = text.replace(/\n{3,}/g, '\n\n');
        text = text.trim();
        return text;
    };
    EmailCleaner.prototype.fallbackTextExtraction = function (htmlContent) {
        // Simple regex-based text extraction
        var stripped = htmlContent.replace(/<[^>]+>/g, ' ');
        stripped = stripped.replace(/\s+/g, ' ');
        return this.postProcessText(stripped);
    };
    EmailCleaner.prototype.processEmail = function (rawMessage) {
        var messageId = rawMessage.messageId || rawMessage.id || '';
        var threadId = rawMessage.threadId || messageId;
        var subject = rawMessage.subject || 'No Subject';
        var sender = rawMessage.sender || 'Unknown Sender';
        var recipient = rawMessage.to || '';
        var timestamp = rawMessage.messageTimestamp || new Date().toISOString();
        var labels = rawMessage.labelIds || [];
        var htmlContent = rawMessage.messageText || '';
        // Clean the HTML content
        var cleanText = htmlContent ? this.cleanHtmlEmail(htmlContent) : '';
        // Process attachments
        var attachmentList = rawMessage.attachmentList || [];
        var hasAttachments = attachmentList.length > 0;
        var attachmentCount = attachmentList.length;
        var attachmentFilenames = attachmentList
            .map(function (att) { return att.filename || att.name; })
            .filter(Boolean);
        return {
            id: messageId,
            threadId: threadId,
            subject: subject,
            sender: sender,
            recipient: recipient,
            timestamp: timestamp,
            labels: labels,
            cleanText: cleanText,
            htmlContent: htmlContent,
            hasAttachments: hasAttachments,
            attachmentCount: attachmentCount,
            attachmentFilenames: attachmentFilenames,
        };
    };
    EmailCleaner.prototype.processEmails = function (rawMessages) {
        var _this = this;
        return rawMessages.map(function (msg) { return _this.processEmail(msg); });
    };
    return EmailCleaner;
}());
exports.EmailCleaner = EmailCleaner;
