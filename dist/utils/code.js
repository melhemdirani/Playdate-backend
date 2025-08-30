"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCode = void 0;
const generateCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
};
exports.generateCode = generateCode;
