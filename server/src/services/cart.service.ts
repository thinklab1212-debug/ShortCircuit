// ============================================================================
// ElectroKart — Cart Service
// ============================================================================
// Handles shopping cart CRUD operations, inventory checks, variant modifiers,
// and order pricing math (MRP, taxes, shipping, coupon values).
// ============================================================================

import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';
import Coupon from '../models/Coupon.model.js';
import { ApiError } from '../utils/index.js';

export class CartService {
  /**
   * Retrieves the user's cart (creating it if it does not exist).
   */
  public static async getCart(userId: string): Promise<InstanceType<typeof Cart>> {
    let cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name slug images price salePrice stock isActive variants sku',
    });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    return cart;
  }

  /**
   * Adds a product/variant to the cart. Enforces purchase limits and stock checks.
   */
  public static async addToCart(
    userId: string,
    productId: string,
    variantDto: { name: string; value: string } | undefined,
    quantity: number = 1
  ): Promise<InstanceType<typeof Cart>> {
    // 1. Verify product exists
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      throw ApiError.notFound('Product not found or is currently inactive.');
    }

    // 2. Fetch or create cart
    const cart = await this.getCart(userId);

    // 3. Resolve variant modifiers if variant is specified
    let selectedVariant: any = undefined;
    let priceModifier = 0;
    let availableStock = product.stock;

    if (variantDto) {
      const dbVariant = product.variants.find(
        (v) => v.name.toLowerCase() === variantDto.name.toLowerCase()
      );
      if (!dbVariant) {
        throw ApiError.badRequest(`Variant "${variantDto.name}" does not exist for this product.`);
      }

      const option = dbVariant.options.find(
        (o) => o.value.toLowerCase() === variantDto.value.toLowerCase()
      );
      if (!option) {
        throw ApiError.badRequest(`Option "${variantDto.value}" not found under variant "${variantDto.name}".`);
      }

      priceModifier = option.priceModifier;
      availableStock = option.stock;
      
      selectedVariant = {
        name: dbVariant.name,
        value: option.value,
        priceModifier,
      };
    }

    if (availableStock < quantity) {
      throw new ApiError(400, `Insufficient stock. Only ${availableStock} units available.`);
    }

    // 4. Check if item already exists in the cart with the exact same variant parameters
    const existingItemIndex = cart.items.findIndex((item) => {
      const productMatch = item.product._id.toString() === productId.toString();
      if (!productMatch) return false;
      
      if (!variantDto && !item.variant) return true;
      if (variantDto && item.variant) {
        return (
          item.variant.name.toLowerCase() === variantDto.name.toLowerCase() &&
          item.variant.value.toLowerCase() === variantDto.value.toLowerCase()
        );
      }
      return false;
    });

    const unitPrice = (product.salePrice || product.price) + priceModifier;

    if (existingItemIndex > -1) {
      const existingItem = cart.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > 10) {
        throw new ApiError(400, 'Purchase limit exceeded. You can buy at most 10 units of a product.');
      }
      if (availableStock < newQuantity) {
        throw new ApiError(400, `Insufficient stock. Only ${availableStock} units available, you already have ${existingItem.quantity} in cart.`);
      }

      existingItem.quantity = newQuantity;
      existingItem.price = unitPrice; // Update price snapshot to current value
    } else {
      if (cart.items.length >= 50) {
        throw new ApiError(400, 'Cart limit reached. You can hold at most 50 unique items.');
      }

      cart.items.push({
        product: productId as any,
        variant: selectedVariant,
        quantity,
        price: unitPrice,
      });
    }

    await cart.save();
    return this.getCart(userId); // Return fully populated cart
  }

  /**
   * Updates an item's quantity in the cart using its embedded ID.
   */
  public static async updateQuantity(
    userId: string,
    itemId: string,
    quantity: number
  ): Promise<InstanceType<typeof Cart>> {
    const cart = await this.getCart(userId);
    
    const item = (cart.items as any).id(itemId) as any;
    if (!item) {
      throw ApiError.notFound('Item not found in cart.');
    }

    // Fetch product to verify stock
    const product = await Product.findById(item.product._id);
    if (!product || !product.isActive) {
      throw ApiError.notFound('Product is no longer available.');
    }

    let availableStock = product.stock;
    let priceModifier = 0;

    if (item.variant) {
      const dbVariant = product.variants.find((v) => v.name === item.variant.name);
      if (dbVariant) {
        const option = dbVariant.options.find((o) => o.value === item.variant.value);
        if (option) {
          availableStock = option.stock;
          priceModifier = option.priceModifier;
        }
      }
    }

    if (availableStock < quantity) {
      throw new ApiError(400, `Insufficient stock. Only ${availableStock} units available.`);
    }

    item.quantity = quantity;
    item.price = (product.salePrice || product.price) + priceModifier; // Refresh price snapshot
    
    await cart.save();
    return this.getCart(userId);
  }

  /**
   * Removes an item from the cart.
   */
  public static async removeFromCart(userId: string, itemId: string): Promise<InstanceType<typeof Cart>> {
    const cart = await this.getCart(userId);
    
    const item = (cart.items as any).id(itemId);
    if (!item) {
      throw ApiError.notFound('Item not found in cart.');
    }

    item.deleteOne();
    await cart.save();
    
    return this.getCart(userId);
  }

  /**
   * Empties the cart.
   */
  public static async clearCart(userId: string): Promise<void> {
    await Cart.updateOne({ user: userId }, { $set: { items: [] } });
  }

  /**
   * Computes subtotal, taxes, shipping fee, discounts, and final payable amount.
   */
  public static async calculateTotals(
    userId: string,
    couponCode?: string
  ): Promise<{
    itemsPrice: number;
    shippingPrice: number;
    taxPrice: number;
    discountAmount: number;
    totalPrice: number;
    couponApplied?: boolean;
    couponError?: string;
  }> {
    const cart = await this.getCart(userId);
    
    if (cart.items.length === 0) {
      return { itemsPrice: 0, shippingPrice: 0, taxPrice: 0, discountAmount: 0, totalPrice: 0 };
    }

    // Calculate items base subtotal
    let itemsPrice = 0;
    for (const item of cart.items) {
      const product = item.product as any;
      if (product && product.isActive) {
        const priceModifier = item.variant?.priceModifier || 0;
        const unitPrice = (product.salePrice || product.price) + priceModifier;
        itemsPrice += unitPrice * item.quantity;
      }
    }

    // Calculate coupon discount
    let discountAmount = 0;
    let couponApplied = false;
    let couponError: string | undefined = undefined;

    if (couponCode) {
      try {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
        
        if (!coupon) {
          couponError = 'Coupon code is invalid or has expired.';
        } else {
          // Check coupon validity against cart total and user ID
          const isValid = await coupon.isValid();
          const hasExceeded = await coupon.hasUserExceededLimit(userId as any);
          
          if (!isValid) {
            couponError = 'Coupon code is expired or usage limits are exceeded.';
          } else if (hasExceeded) {
            couponError = 'You have exceeded the usage limit for this coupon.';
          } else if (itemsPrice < (coupon.minOrderAmount || 0)) {
            couponError = `Minimum order amount of ₹${coupon.minOrderAmount} is required to apply this coupon.`;
          } else {
            // Check if coupon is scoped to categories
            let qualifies = true;
            if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
              // Check if any cart item matches applicable categories
              const applicableCategories = coupon.applicableCategories;
              const matches = cart.items.some((item) => {
                const product = item.product as any;
                return applicableCategories.map((c) => c.toString()).includes(product.category.toString());
              });
              if (!matches) {
                qualifies = false;
                couponError = 'This coupon is not applicable to the items in your cart.';
              }
            }

            if (qualifies) {
              discountAmount = coupon.calculateDiscount(itemsPrice);
              couponApplied = true;
            }
          }
        }
      } catch (err) {
        couponError = 'Failed to validate coupon.';
      }
    }

    // Calculate taxes (GST 18% included in product prices, but displayed as lines item for students transparency)
    // Formula for inclusive tax: Tax = TotalPrice - (TotalPrice / (1 + TaxRate))
    const taxPrice = Math.round((itemsPrice - discountAmount) - ((itemsPrice - discountAmount) / 1.18));

    // Calculate shipping (Free above ₹999, else ₹49)
    const netSubtotal = itemsPrice - discountAmount;
    const shippingPrice = netSubtotal >= 999 ? 0 : 49;

    // Final total
    const totalPrice = netSubtotal + shippingPrice;

    return {
      itemsPrice,
      shippingPrice,
      taxPrice,
      discountAmount,
      totalPrice,
      couponApplied,
      couponError,
    };
  }
}

export default CartService;
