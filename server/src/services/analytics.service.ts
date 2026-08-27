// ============================================================================
// ElectroKart — Analytics Service
// ============================================================================
// Performs administrative report aggregations: total revenue, order metrics,
// top-selling categories, and monthly sales trends.
// ============================================================================

import Order from '../models/Order.model.js';
import User from '../models/User.model.js';
import Product from '../models/Product.model.js';
import Category from '../models/Category.model.js';

export class AnalyticsService {
  /**
   * Generates summary metrics for the main admin dashboard cards.
   */
  public static async getDashboardStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
    totalCustomers: number;
    pendingOrders: number;
    outOfStockCount: number;
    recentOrders: any[];
    lowStockProducts: any[];
    revenueGrowth: number;
    orderGrowth: number;
  }> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      revenueAggregation,
      totalOrders,
      totalProducts,
      totalUsers,
      totalCustomers,
      pendingOrders,
      outOfStockCount,
      recentOrders,
      lowStockProducts,
      recentRevAgg,
      prevRevAgg,
      recentOrderCount,
      prevOrderCount,
    ] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            $or: [
              { paymentStatus: 'paid' },
              { orderStatus: 'delivered' },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' },
          },
        },
      ]),
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Order.countDocuments({ orderStatus: { $in: ['pending', 'processing'] } }),
      Product.countDocuments({ stock: 0, isActive: true }),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email firstName lastName role')
        .lean(),
      Product.find({ stock: { $lte: 10 } })
        .sort({ stock: 1 })
        .limit(5)
        .select('name stock price isActive category images')
        .lean(),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            $or: [{ paymentStatus: 'paid' }, { orderStatus: 'delivered' }],
          },
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
            $or: [{ paymentStatus: 'paid' }, { orderStatus: 'delivered' }],
          },
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Order.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
    ]);

    const totalRevenue = revenueAggregation[0]?.total || 0;

    const recentRev = recentRevAgg[0]?.total || 0;
    const prevRev = prevRevAgg[0]?.total || 0;
    const revenueGrowth =
      prevRev === 0
        ? recentRev > 0
          ? 100
          : 0
        : Math.round(((recentRev - prevRev) / prevRev) * 100 * 10) / 10;

    const orderGrowth =
      prevOrderCount === 0
        ? recentOrderCount > 0
          ? 100
          : 0
        : Math.round(((recentOrderCount - prevOrderCount) / prevOrderCount) * 100 * 10) / 10;

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      totalCustomers,
      pendingOrders,
      outOfStockCount,
      recentOrders,
      lowStockProducts,
      revenueGrowth,
      orderGrowth,
    };
  }

  /**
   * Compiles monthly revenue data for plotting trends (past 6 months).
   */
  public static async getRevenueData(): Promise<any[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const data = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          $or: [{ paymentStatus: 'paid' }, { orderStatus: 'delivered' }],
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    return data.map((item) => {
      const monthIdx = item._id.month - 1;
      return {
        month: `${monthNames[monthIdx]} ${item._id.year}`,
        revenue: item.revenue,
        orders: item.orders,
      };
    });
  }

  /**
   * Compiles orders metrics: status distributions and average values.
   */
  public static async getOrderStats(): Promise<{
    averageOrderValue: number;
    statusDistribution: { status: string; count: number }[];
  }> {
    // 1. Calculate Average Order Value
    const averageAggregation = await Order.aggregate([
      {
        $group: {
          _id: null,
          avgValue: { $avg: '$totalPrice' },
        },
      },
    ]);
    const averageOrderValue = averageAggregation[0]?.avgValue || 0;

    // 2. Status distribution
    const distribution = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return {
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      statusDistribution: distribution,
    };
  }

  /**
   * Retrieves top selling products by physical items quantity sold.
   */
  public static async getTopProducts(limit: number = 5): Promise<any[]> {
    return Product.find({ isActive: true })
      .sort({ soldCount: -1 })
      .limit(limit)
      .select('name sku price soldCount stock images')
      .lean();
  }

  /**
   * Aggregates revenue and sales count breakdown by product category.
   */
  public static async getTopCategories(): Promise<any[]> {
    const data = await Order.aggregate([
      {
        $match: {
          $or: [{ paymentStatus: 'paid' }, { orderStatus: 'delivered' }],
        },
      },
      // Unwind order items
      { $unwind: '$items' },
      // Lookup product details to resolve its category ID
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: '$productDetails' },
      // Group by category ID
      {
        $group: {
          _id: '$productDetails.category',
          salesCount: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      // Lookup category names
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      { $unwind: '$categoryDetails' },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          categoryName: '$categoryDetails.name',
          salesCount: 1,
          revenue: 1,
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    return data;
  }
}

export default AnalyticsService;
