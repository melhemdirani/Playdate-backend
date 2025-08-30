import { prisma } from "../../db/db";

export async function getAdminDashboardStats() {
  // Total users
  const totalUsers = await prisma.user.count();

  // Total matches
  const totalMatches = await prisma.match.count();

  // Total revenue (sum of completed payments)
  const totalRevenueResult = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: { in: ["COMPLETED", "PARTIALLY_REFUNDED", "REFUNDED"] } },
  });
  const totalRevenue = totalRevenueResult._sum.amount || 0;

  // Pending reports
  const pendingReports = await prisma.userReport.count({
    where: { status: "PENDING" },
  });

  // Current active matches (status: ONGOING)
  const activeMatches = await prisma.match.count({
    where: { status: "ONGOING" },
  });

  // New users this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const newUsersThisMonth = await prisma.user.count({
    where: { createdAt: { gte: startOfMonth } },
  });

  return {
    totalUsers,
    totalMatches,
    totalRevenue,
    pendingReports,
    activeMatches,
    newUsersThisMonth,
  };
}

import { Request, Response } from "express";

export async function getAdminDashboardStatsHandler(
  req: Request,
  res: Response
) {
  try {
    const stats = await getAdminDashboardStats();
    res.status(200).json(stats);
  } catch (error: any) {
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch dashboard stats" });
  }
}

// Example result format:
// {
//   totalUsers: 1234,
//   totalMatches: 567,
//   totalRevenue: 8901.23,
//   pendingReports: 12,
//   activeMatches: 5,
//   newUsersThisMonth: 34
// }
