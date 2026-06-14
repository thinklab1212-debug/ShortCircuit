// ============================================================================
// ElectroKart — Order Service
// ============================================================================
// Handles order creation (using transactions), cancellations (restoring stock),
// tracking details updates, and invoice generations.
// ============================================================================

import mongoose from 'mongoose';
import Order from '../models/Order.model.js';
import Address from '../models/Address.model.js';
import Coupon from '../models/Coupon.model.js';
import User from '../models/User.model.js';
import { CartService } from './cart.service.js';
import { ProductService } from './product.service.js';
import { EmailService } from './email.service.js';
import { InvoiceService } from './invoice.service.js';
import { ApiError } from '../utils/index.js';
import { executePaginatedQuery } from '../utils/pagination.js';
import { buildOrderFilters } from '../utils/filterBuilder.js';

export class OrderService {
  /**
   * Places an order from the user's cart. Wrapped in a Mongoose transaction.
   */
  public static async placeOrder(
    userId: string,
    shippingAddressId: string,
    paymentMethod: 'razorpay' | 'upi' | 'cod',
    couponCode?: string,
    customerNote?: string
  ): Promise<InstanceType<typeof Order>> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Get user details
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw ApiError.notFound('User not found.');
      }

      // 2. Get cart items
      const cart = await CartService.getCart(userId);
      if (!cart || cart.items.length === 0) {
        throw new ApiError(400, 'Your cart is empty. Cannot place an order.');
      }

      // 3. Retrieve shipping address
      const address = await Address.findOne({ _id: shippingAddressId, user: userId }).session(session);
      if (!address) {
        throw ApiError.notFound('Shipping address not found or unauthorized.');
      }

      // 4. Calculate final totals (validation of coupon happens here)
      const totals = await CartService.calculateTotals(userId, couponCode);
      if (couponCode && !totals.couponApplied) {
        throw new ApiError(400, totals.couponError || 'Invalid coupon code.');
      }

      // 5. Prepare order items snapshots and deduct stocks atomically
      const orderItems: any[] = [];
      for (const item of cart.items) {
        const product = item.product as any;
        if (!product || !product.isActive) {
          throw new ApiError(400, `Product "${product?.name || 'Unknown'}" is no longer available.`);
        }

        // Deduct stock inside the transaction session
        const variantName = item.variant?.name;
        const variantValue = item.variant?.value;
        await ProductService.checkAndDecreaseStock(
          product._id.toString(),
          variantName,
          variantValue,
          item.quantity,
          session
        );

        orderItems.push({
          product: product._id,
          name: product.name,
          image: product.images.find((img: any) => img.isPrimary)?.url || product.images[0]?.url || '',
          slug: product.slug,
          sku: product.sku,
          variant: item.variant ? { name: item.variant.name, value: item.variant.value } : undefined,
          quantity: item.quantity,
          price: item.price,
        });
      }

      // 6. Manage coupon metrics lock
      let couponId = undefined;
      if (totals.couponApplied && couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true }).session(session);
        if (coupon) {
          couponId = coupon._id;
          coupon.usedCount += 1;
          coupon.usedBy.push({
            user: userId as any,
            usedAt: new Date(),
            orderId: new mongoose.Types.ObjectId() as any, // Temporary placeholder resolved post-save
          });
          await coupon.save({ session });
        }
      }

      // 7. Map shipping address snapshot
      const shippingAddressSnapshot = {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country || 'India',
      };

      // 8. Create Order document (ID auto-generation happens in pre-save hook)
      const order = new Order({
        user: userId,
        items: orderItems,
        shippingAddress: shippingAddressSnapshot,
        paymentMethod,
        paymentStatus: 'pending', // Pending until captured online or delivered COD
        orderStatus: 'placed',
        itemsPrice: totals.itemsPrice,
        shippingPrice: totals.shippingPrice,
        taxPrice: totals.taxPrice,
        discountAmount: totals.discountAmount,
        totalPrice: totals.totalPrice,
        coupon: couponId,
        couponCode: couponCode ? couponCode.toUpperCase() : undefined,
        customerNote,
      });

      await order.save({ session });

      // 9. Update the coupon order references placeholder if coupon was used
      if (couponId && totals.couponApplied && couponCode) {
        await Coupon.updateOne(
          { _id: couponId, 'usedBy.user': userId },
          { $set: { 'usedBy.$.orderId': order._id } }
        ).session(session);
      }

      // 10. Clear shopping cart
      await CartService.clearCart(userId);

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      // Send Order Confirmation Email (non-blocking)
      EmailService.sendOrderConfirmationEmail(user.email, user.firstName, order.orderId, order.totalPrice);

      return order;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Retrieves orders history for a user (paginated).
   */
  public static async getUserOrders(userId: string, queryParams: any) {
    const filter = { user: userId };
    return executePaginatedQuery(Order, filter, {
      ...queryParams,
      sort: '-createdAt',
    });
  }

  /**
   * Retrieves administrative list of all orders (paginated).
   */
  public static async getAllOrders(queryParams: any) {
    const { filter, sort } = buildOrderFilters(queryParams);
    return executePaginatedQuery(Order, filter, {
      ...queryParams,
      sort,
      populate: [{ path: 'user', select: 'firstName lastName email' }],
    });
  }

  /**
   * Retrieves a single order details by ID (verifying ownership or admin role).
   */
  public static async getOrderById(
    orderId: string,
    userId: string,
    userRole: string
  ): Promise<InstanceType<typeof Order>> {
    const order = userRole === 'admin'
      ? await Order.findById(orderId).select('+cancellationRequest.internalAdminNote +adminNote')
      : await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    // Verify authorization
    if (userRole !== 'admin' && order.user.toString() !== userId.toString()) {
      throw ApiError.forbidden('You do not have permission to view this order.');
    }

    return order;
  }

  /**
   * Cancels a user order (restoring inventory stock). Wrapped in transaction.
   */
  public static async cancelOrder(
    orderId: string,
    userId: string,
    userRole: string,
    cancellationReason: string
  ): Promise<InstanceType<typeof Order>> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw ApiError.notFound('Order not found.');
      }

      // Check role
      if (userRole !== 'admin') {
        throw ApiError.forbidden('Only administrators can cancel orders directly.');
      }

      // Cancel restrictions: only allow before shipping
      const cancelableStatuses = ['placed', 'confirmed', 'processing'];
      if (!cancelableStatuses.includes(order.orderStatus)) {
        throw new ApiError(400, `Cannot cancel order at this stage. Current status: ${order.orderStatus}`);
      }

      // Restore inventory stock counts
      for (const item of order.items) {
        // If variant exists
        const variantName = item.variant?.name;
        const variantValue = item.variant?.value;
        
        await ProductService.increaseStock(
          item.product.toString(),
          variantName,
          variantValue,
          item.quantity,
          session
        );
      }

      // Update order status
      order.orderStatus = 'cancelled';
      order.cancelledAt = new Date();
      order.cancelledBy = new mongoose.Types.ObjectId(userId);
      order.cancellationApprovedAt = new Date();
      order.cancellationReason = cancellationReason;
      
      // Update payment status if already paid
      if (order.paymentStatus === 'paid') {
        order.paymentStatus = 'refunded'; // Refund preparation initiated
      }

      order.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: `Order cancelled by admin. Reason: ${cancellationReason}`,
        updatedBy: userId as any,
      });

      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      return order;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Submits a cancellation request on behalf of a customer.
   */
  public static async requestCancellation(
    orderId: string,
    userId: string,
    category: string,
    reason: string
  ): Promise<InstanceType<typeof Order>> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    // Check ownership
    if (order.user.toString() !== userId.toString()) {
      throw ApiError.forbidden('You do not have permission to request cancellation for this order.');
    }

    // Block cancellation after delivery, or if already cancelled/returned
    if (
      order.orderStatus === 'delivered' ||
      order.orderStatus === 'cancelled' ||
      order.orderStatus === 'returned'
    ) {
      throw ApiError.forbidden('Cannot request cancellation after delivery, or if the order is already cancelled or returned.');
    }

    // Prevent duplicate requests
    if (order.cancellationRequest?.status === 'pending') {
      throw ApiError.conflict('A cancellation request is already pending for this order.');
    }

    // Save cancellation request details
    order.cancellationRequest = {
      requested: true,
      requestedAt: new Date(),
      category: category as any,
      reason,
      status: 'pending',
    };

    // Add status history entry
    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note: `Cancellation requested. Category: ${category}, Reason: ${reason}`,
      updatedBy: new mongoose.Types.ObjectId(userId),
    });

    await order.save();

    // Send confirmation email
    const user = await User.findById(userId).select('email firstName');
    if (user) {
      await EmailService.sendCancellationSubmittedEmail(
        user.email,
        user.firstName,
        order.orderId,
        category,
        reason
      );
    }

    return order;
  }

  /**
   * Administrative review of a cancellation request.
   */
  public static async reviewCancellationRequest(
    orderId: string,
    action: 'approve' | 'reject',
    adminResponse: string | undefined,
    internalAdminNote: string | undefined,
    adminUserId: string
  ): Promise<InstanceType<typeof Order>> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw ApiError.notFound('Order not found.');
      }

      if (!order.cancellationRequest || !order.cancellationRequest.requested) {
        throw ApiError.badRequest('No cancellation request exists for this order.');
      }

      if (order.cancellationRequest.status !== 'pending') {
        throw ApiError.badRequest(`This cancellation request has already been ${order.cancellationRequest.status}.`);
      }

      const user = await User.findById(order.user).session(session);
      const customerEmail = user?.email || '';
      const customerName = user?.firstName || 'Customer';

      if (action === 'approve') {
        // Stock restoration rule: ONLY IF orderStatus !== 'delivered'
        if (order.orderStatus !== 'delivered') {
          for (const item of order.items) {
            const variantName = item.variant?.name;
            const variantValue = item.variant?.value;
            
            await ProductService.increaseStock(
              item.product.toString(),
              variantName,
              variantValue,
              item.quantity,
              session
            );
          }
        }

        // Update order status
        order.orderStatus = 'cancelled';
        order.cancelledAt = new Date();
        order.cancelledBy = new mongoose.Types.ObjectId(adminUserId);
        order.cancellationApprovedAt = new Date();
        order.cancellationReason = order.cancellationRequest.reason;

        if (order.paymentStatus === 'paid') {
          order.paymentStatus = 'refunded';
        }

        // Update cancellationRequest status
        order.cancellationRequest.status = 'approved';
        order.cancellationRequest.reviewedAt = new Date();
        order.cancellationRequest.reviewedBy = new mongoose.Types.ObjectId(adminUserId);
        order.cancellationRequest.adminResponse = adminResponse;
        order.cancellationRequest.internalAdminNote = internalAdminNote;

        order.statusHistory.push({
          status: 'cancelled',
          timestamp: new Date(),
          note: `Order cancellation approved by admin. Response: ${adminResponse || 'None'}. Internal note: ${internalAdminNote || 'None'}`,
          updatedBy: new mongoose.Types.ObjectId(adminUserId),
        });

        await order.save({ session });
        await session.commitTransaction();
        session.endSession();

        // Send approval email
        if (customerEmail) {
          await EmailService.sendCancellationApprovedEmail(customerEmail, customerName, order.orderId);
        }
      } else {
        // action === 'reject'
        order.cancellationRequest.status = 'rejected';
        order.cancellationRequest.reviewedAt = new Date();
        order.cancellationRequest.reviewedBy = new mongoose.Types.ObjectId(adminUserId);
        order.cancellationRequest.adminResponse = adminResponse;
        order.cancellationRequest.internalAdminNote = internalAdminNote;

        order.statusHistory.push({
          status: order.orderStatus,
          timestamp: new Date(),
          note: `Order cancellation request rejected by admin. Response: ${adminResponse || 'None'}. Internal note: ${internalAdminNote || 'None'}`,
          updatedBy: new mongoose.Types.ObjectId(adminUserId),
        });

        await order.save({ session });
        await session.commitTransaction();
        session.endSession();

        // Send rejection email
        if (customerEmail) {
          await EmailService.sendCancellationRejectedEmail(
            customerEmail,
            customerName,
            order.orderId,
            adminResponse
          );
        }
      }

      return order;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Retrieves orders with cancellation requests (paginated, for Admin).
   */
  public static async getCancellationRequests(queryParams: any) {
    const { filter, sort } = buildOrderFilters(queryParams);
    
    // Constrain to cancellation requests
    const updatedFilter: any = {
      ...filter,
      'cancellationRequest.requested': true,
    };

    // Filter by request status if specified
    if (queryParams.requestStatus) {
      updatedFilter['cancellationRequest.status'] = queryParams.requestStatus;
    }

    return executePaginatedQuery(Order, updatedFilter, {
      ...queryParams,
      sort: queryParams.sort || '-cancellationRequest.requestedAt',
      populate: [{ path: 'user', select: 'firstName lastName email' }],
    });
  }

  /**
   * Fetches the count of pending cancellation requests (for Admin priority badge).
   */
  public static async getPendingCancellationCount(): Promise<number> {
    return Order.countDocuments({
      'cancellationRequest.requested': true,
      'cancellationRequest.status': 'pending',
    });
  }

  /**
   * Updates an order status (Admin only).
   */
  public static async updateOrderStatus(
    orderId: string,
    status: string,
    note: string = '',
    adminUserId: string
  ): Promise<InstanceType<typeof Order>> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    if (order.orderStatus === 'cancelled' || order.orderStatus === 'delivered') {
      throw new ApiError(400, `Cannot modify status of a finished order. Current status: ${order.orderStatus}`);
    }

    order.orderStatus = status;

    if (status === 'delivered') {
      order.deliveredAt = new Date();
      if (order.paymentMethod === 'cod') {
        order.paymentStatus = 'paid'; // COD collected
      }
    }

    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`,
      updatedBy: adminUserId as any,
    });

    await order.save();
    return order;
  }

  /**
   * Administrative shipping/carrier tracking details (Admin only).
   */
  public static async updateTrackingInfo(
    orderId: string,
    shippingCarrier: string,
    shippingTrackingId: string,
    adminUserId: string
  ): Promise<InstanceType<typeof Order>> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    order.shippingCarrier = shippingCarrier;
    order.shippingTrackingId = shippingTrackingId;

    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note: `Tracking information updated. Carrier: ${shippingCarrier}, ID: ${shippingTrackingId}`,
      updatedBy: adminUserId as any,
    });

    await order.save();
    return order;
  }

  /**
   * Compiles invoice PDF/HTML data metadata.
   */
  public static async getInvoiceMetadata(orderId: string, userId: string, userRole: string) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    if (userRole !== 'admin' && order.user.toString() !== userId.toString()) {
      throw ApiError.forbidden('You do not have permission to access this invoice.');
    }

    const user = await User.findById(order.user).select('email');
    const userEmail = user?.email || '';

    const InvoiceSettings = mongoose.model('InvoiceSettings');
    const settings = await InvoiceSettings.findOne() || await InvoiceSettings.create({});

    return InvoiceService.compileInvoiceMetadata(order, userEmail, settings as any);
  }

  /**
   * Generates a raw PDF buffer for the invoice.
   */
  public static async generateInvoicePdf(orderId: string, userId: string, userRole: string): Promise<Buffer> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    // Authorization: Admin or Order Owner
    if (userRole !== 'admin' && order.user.toString() !== userId.toString()) {
      throw ApiError.forbidden('You do not have permission to access this invoice.');
    }

    const InvoiceSettings = mongoose.model('InvoiceSettings');
    const settings = await InvoiceSettings.findOne() || await InvoiceSettings.create({});

    // Enforce delivery and payment rules based on settings toggle
    const mustBeDeliveredAndPaid = settings.allowOnlyDeliveredAndPaid !== false;
    
    if (mustBeDeliveredAndPaid) {
      if (order.orderStatus !== 'delivered' || order.paymentStatus !== 'paid') {
        throw new ApiError(403, 'Invoice will be available after successful delivery and payment completion.');
      }
    }

    // Enforce that invoice has been generated (which happens when order became Delivered + Paid)
    if (!order.invoiceNumber || !order.invoiceSnapshot) {
      throw new ApiError(400, 'Invoice has not been generated for this order yet.');
    }

    const user = await User.findById(order.user).select('email');
    const userEmail = user?.email || '';

    return InvoiceService.generateInvoicePdfBuffer(order, userEmail, settings as any);
  }
}

export default OrderService;
