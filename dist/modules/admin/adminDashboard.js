"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDashboardStatsHandler = exports.getAdminDashboardStats = void 0;
const db_1 = require("../../db/db");
async function getAdminDashboardStats() {
    // Total users
    const totalUsers = await db_1.prisma.user.count();
    // Total matches
    const totalMatches = await db_1.prisma.match.count();
    // Total revenue (sum of completed payments)
    const totalRevenueResult = await db_1.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: { in: ["COMPLETED", "PARTIALLY_REFUNDED", "REFUNDED"] } },
    });
    const totalRevenue = totalRevenueResult._sum.amount || 0;
    // Pending reports
    const pendingReports = await db_1.prisma.userReport.count({
        where: { status: "PENDING" },
    });
    // Current active matches (status: ONGOING)
    const activeMatches = await db_1.prisma.match.count({
        where: { status: "ONGOING" },
    });
    // New users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await db_1.prisma.user.count({
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
exports.getAdminDashboardStats = getAdminDashboardStats;
async function getAdminDashboardStatsHandler(req, res) {
    try {
        const stats = await getAdminDashboardStats();
        res.status(200).json(stats);
    }
    catch (error) {
        res
            .status(500)
            .json({ error: error.message || "Failed to fetch dashboard stats" });
    }
}
exports.getAdminDashboardStatsHandler = getAdminDashboardStatsHandler;
// Example result format:
// {
//   totalUsers: 1234,
//   totalMatches: 567,
//   totalRevenue: 8901.23,
//   pendingReports: 12,
//   activeMatches: 5,
//   newUsersThisMonth: 34
// }
