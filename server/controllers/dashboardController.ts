import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalRevenuePromise = prisma.order.aggregate({
            _sum: { total: true },
            where: { status: 'paid' },
        });

        const totalOrdersPromise = prisma.order.count();
        const totalCustomersPromise = prisma.customer.count();
        const productCountPromise = prisma.product.count({ where: { is_active: true } });

        const orderStatusCountsPromise = prisma.order.groupBy({
            by: ['status'],
            _count: {
                status: true,
            },
        });

        const recentOrdersPromise = prisma.order.findMany({
            orderBy: { created_at: 'desc' },
            take: 5,
        });

        const recentCustomersPromise = prisma.customer.findMany({
            orderBy: { created_at: 'desc' },
            take: 5,
        });

        const [
            revenueResult,
            totalOrders,
            totalCustomers,
            productCount,
            statusCountsResult,
            recentOrders,
            recentCustomers,
        ] = await Promise.all([
            totalRevenuePromise,
            totalOrdersPromise,
            totalCustomersPromise,
            productCountPromise,
            orderStatusCountsPromise,
            recentOrdersPromise,
            recentCustomersPromise,
        ]);

        const orderStatusCounts = statusCountsResult.reduce((acc, row) => {
            if (row.status) {
                acc[row.status] = row._count.status;
            }
            return acc;
        }, {} as { [key: string]: number });

        res.json({
            totalRevenue: revenueResult._sum.total || 0,
            totalOrders,
            totalCustomers,
            productCount,
            orderStatusCounts,
            recentOrders,
            recentCustomers,
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: 'Error al obtener las estadísticas' });
    }
};