"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMatchRequest = exports.getMatchRequests = void 0;
const db_1 = require("../../db/db");
async function getMatchRequests() {
    return await db_1.prisma.matchRequest.findMany({
        include: {
            game: true,
            location: true,
            requestedBy: true,
        },
    });
}
exports.getMatchRequests = getMatchRequests;
async function createMatchRequest(data, userId) {
    const { gameId, location, scheduledAt, maxPlayers, durationMins } = data;
    // Create location first
    const createdLocation = await db_1.prisma.location.create({
        data: location,
    });
    // Create match request
    const matchRequest = await db_1.prisma.matchRequest.create({
        data: {
            gameId,
            locationId: createdLocation.id,
            scheduledAt,
            maxPlayers,
            durationMins,
            pricePerUser: 0,
            requestedById: userId,
            status: "PENDING",
        },
    });
    return matchRequest;
}
exports.createMatchRequest = createMatchRequest;
