import { prisma } from "../../db/db";
import { CreateMatchRequestInput } from "./matchRequestSchema";
export async function getMatchRequests() {
  return await prisma.matchRequest.findMany({
    include: {
      game: true,
      location: true,
      requestedBy: true,
    },
  });
}

export async function createMatchRequest(
  data: CreateMatchRequestInput,
  userId: string
) {
  const { gameId, location, scheduledAt, maxPlayers, durationMins } = data;

  // Create location first
  const createdLocation = await prisma.location.create({
    data: location,
  });

  // Create match request
  const matchRequest = await prisma.matchRequest.create({
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
