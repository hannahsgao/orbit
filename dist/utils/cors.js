"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = void 0;
var cors_1 = require("cors");
exports.corsOptions = (0, cors_1.default)({
    origin: process.env.ORIGIN || 'http://127.0.0.1:3000',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});
