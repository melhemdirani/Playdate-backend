"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMatchRequestHandler = exports.getMatchRequestsHandler = void 0;
const matchRequestService_1 = require("./matchRequestService");
const getMatchRequestsHandler = async (req, res) => {
    try {
        const matchRequests = await (0, matchRequestService_1.getMatchRequests)();
        res.status(200).json({ matchRequests });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch match requests." });
    }
};
exports.getMatchRequestsHandler = getMatchRequestsHandler;
const matchRequestService_2 = require("./matchRequestService");
const createMatchRequestHandler = async (req, res) => {
    try {
        const matchRequest = await (0, matchRequestService_2.createMatchRequest)(req.body, req.user.id);
        res.status(201).json({ matchRequest });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to create match request." });
    }
};
exports.createMatchRequestHandler = createMatchRequestHandler;
