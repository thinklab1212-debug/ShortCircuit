import { Request, Response } from 'express';
import { Product } from '../models/Product.js';

export async function listProducts(req: Request, res: Response) {
  try {
    const { search } = req.query;
    const query: any = {};
    if (search) {
      const rgx = new RegExp(String(search), 'i');
      query.$or = [{ name: rgx }, { sku: rgx }, { hsn: rgx }];
    }
    const products = await Product.find(query).sort({ name: 1 }).lean();
    res.json({ products });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch products' });
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const { name, sku, description, hsn, unit, unitPrice, gstRate } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const product = new Product({
      name,
      sku: sku || '',
      description: description || '',
      hsn: hsn || '8542',
      unit: unit || 'NOS',
      unitPrice: Number(unitPrice) || 0,
      gstRate: Number(gstRate) || 18,
    });

    await product.save();
    res.status(201).json({ product });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create product' });
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update product' });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete product' });
  }
}
