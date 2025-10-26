"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = require("./utils/cors");
const errors_1 = require("./utils/errors");
const logger_1 = require("./utils/logger");
const env_1 = require("./utils/env");
const auth_1 = __importDefault(require("./routes/auth"));
const spotify_1 = __importDefault(require("./routes/spotify"));
const gmail_1 = __importDefault(require("./routes/gmail"));
dotenv_1.default.config();
(0, env_1.validateEnv)();
const app = (0, express_1.default)();
const PORT = process.env.SERVER_PORT || 5173;
app.use(cors_1.corsOptions);
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((req, _res, next) => {
    logger_1.logger.info({ method: req.method, path: req.path }, 'Incoming request');
    next();
});
app.use(auth_1.default);
app.use(spotify_1.default);
app.use(gmail_1.default);
app.use(errors_1.errorMiddleware);
app.listen(PORT, () => {
    logger_1.logger.info({ port: PORT, mockMode: process.env.MOCK_MODE === 'true' }, 'Server started');
    logger_1.logger.info(`orbit-mcp-spotify running on http://127.0.0.1:${PORT}`);
    logger_1.logger.info(`Mock mode: ${process.env.MOCK_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
    logger_1.logger.info(`Origin: ${process.env.ORIGIN || 'http://127.0.0.1:3000'}`);
});
//# sourceMappingURL=index.js.map