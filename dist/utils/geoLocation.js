"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDistance = void 0;
const haversine_1 = __importDefault(require("haversine"));
const getDistance = async (lat1, lon1, lat2, lon2) => {
    const start = {
        latitude: lat1,
        longitude: lon1,
    };
    const end = {
        latitude: lat2,
        longitude: lon2,
    };
    return (0, haversine_1.default)(start, end, { unit: "km" });
};
exports.getDistance = getDistance;
