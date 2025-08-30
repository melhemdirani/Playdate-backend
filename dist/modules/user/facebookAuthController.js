"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.facebookAuthHandler = void 0;
const facebookAuthService_1 = require("./facebookAuthService");
async function facebookAuthHandler(req, res) {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: "Facebook token required" });
    }
    try {
        const result = await (0, facebookAuthService_1.facebookAuthService)(token);
        res.json(result);
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
}
exports.facebookAuthHandler = facebookAuthHandler;
