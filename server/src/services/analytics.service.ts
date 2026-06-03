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
    totalCustomers: number;
    outOfStockCount: number;
  }> {
    // 1. Calculate total revenue (paid or delivered orders)
    const revenueAggregation = await Order.aggregate([
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
    ]);

    const totalRevenue = revenueAggregation[0]?.total || 0;

    // 2. Count total orders
    const totalOrders = await Order.countDocuments();

    // 3. Count total customers
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // 4. Count out-of-stock products
    const outOfStockCount = await Product.countDocuments({ stock: 0, isActive: true });

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      outOfStockCount,
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
