"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => {
    return res.json({
        status: 'ok',
        service: 'orbit-mcp-spotify',
    });
});
exports.default = router;
//# sourceMappingURL=health.js.map