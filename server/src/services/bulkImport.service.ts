// ============================================================================
// ElectroKart — Bulk Product Import Service
// ============================================================================
// Processes bulk product spreadsheet data from Excel/CSV uploads or Google Sheets.
// Provides dry-run validation previews and high-performance MongoDB bulkWrite operations.
// ============================================================================

import * as XLSX from 'xlsx';
import slugify from 'slugify';
import Product, { IProduct } from '../models/Product.model.js';
import Category from '../models/Category.model.js';
import Brand from '../models/Brand.model.js';
import { GoogleSheetsService } from './googleSheets.service.js';
import { ApiError, logger } from '../utils/index.js';

export interface BulkPreviewItem {
  rowNumber: number;
  action: 'create' | 'update' | 'error';
  sku: string;
  name: string;
  categoryName?: string;
  brandName?: string;
  price: number;
  salePrice?: number;
  stock: number;
  isActive: boolean;
  changes?: string[];
  errors?: string[];
  parsedData?: any;
}

export interface BulkImportPreviewResult {
  totalRows: number;
  validCount: number;
  errorCount: number;
  newProductsCount: number;
  updatedProductsCount: number;
  items: BulkPreviewItem[];
}

export class BulkImportService {
  /**
   * Helper to safely extract numeric values from raw strings/numbers.
   */
  private static parseNumber(val: any): number | undefined {
    if (val === undefined || val === null || val === '') return undefined;
    if (typeof val === 'number') return isNaN(val) ? undefined : val;
    // Strip currency symbols (₹, $, commas)
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Helper to normalize raw sheet row object keys into standard fields.
   */
  private static normalizeRow(rawRow: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    for (const [key, value] of Object.entries(rawRow)) {
      const cleanKey = key.trim().toLowerCase();
      if (cleanKey === 'sku' || cleanKey === 'product sku') {
        normalized.sku = String(value || '').trim().toUpperCase();
      } else if (cleanKey === 'name' || cleanKey === 'product name' || cleanKey === 'title') {
        normalized.name = String(value || '').trim();
      } else if (cleanKey === 'category' || cleanKey === 'category name') {
        normalized.categoryName = String(value || '').trim();
      } else if (cleanKey === 'brand' || cleanKey === 'brand name') {
        normalized.brandName = String(value || '').trim();
      } else if (cleanKey === 'price' || cleanKey === 'mrp' || cleanKey === 'price / range') {
        normalized.price = this.parseNumber(value);
      } else if (cleanKey === 'sale price' || cleanKey === 'saleprice' || cleanKey === 'discount price') {
        normalized.salePrice = this.parseNumber(value);
      } else if (cleanKey === 'stock' || cleanKey === 'total stock' || cleanKey === 'quantity') {
        normalized.stock = this.parseNumber(value);
      } else if (cleanKey === 'description') {
        normalized.description = String(value || '').trim();
      } else if (cleanKey === 'status') {
        const strVal = String(value || '').trim().toLowerCase();
        normalized.isActive = strVal === 'active' || strVal === 'true' || strVal === '1';
      }
    }
    return normalized;
  }

  /**
   * Performs a dry-run parsing & validation of spreadsheet data.
   */
  public static async previewImport(
    source: 'file' | 'google_sheets',
    fileBuffer?: Buffer
  ): Promise<BulkImportPreviewResult> {
    let rawRows: Record<string, any>[] = [];

    if (source === 'file') {
      if (!fileBuffer) {
        throw new ApiError(400, 'No file uploaded for bulk import.');
      }
      try {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          throw new ApiError(400, 'Uploaded spreadsheet is empty.');
        }
        const worksheet = workbook.Sheets[sheetName];
        rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      } catch (err: any) {
        throw new ApiError(400, `Failed to parse spreadsheet file: ${err.message || 'Invalid format'}`);
      }
    } else if (source === 'google_sheets') {
      // Pull products from Google Sheets
      const syncRes = await GoogleSheetsService.syncAllProducts(); // Ensure initialized
      logger.info(`Bulk import pulling from Google Sheets (synced ${syncRes.totalSynced} items baseline)`);
      
      // Access doc directly
      const doc = (GoogleSheetsService as any).doc;
      if (!doc || !doc.sheetsByTitle['Products']) {
        throw new ApiError(400, 'Google Sheets Products tab is not available or credentials missing.');
      }
      const sheet = doc.sheetsByTitle['Products'];
      const rows = await sheet.getRows();
      rawRows = rows.map((r: any) => r.toObject());
    }

    if (rawRows.length === 0) {
      return {
        totalRows: 0,
        validCount: 0,
        errorCount: 0,
        newProductsCount: 0,
        updatedProductsCount: 0,
        items: [],
      };
    }

    // Limit batch size to safeguard server memory
    if (rawRows.length > 1000) {
      throw new ApiError(400, `Bulk import batch limit exceeded. Maximum 1,000 rows allowed (found ${rawRows.length}).`);
    }

    // Pre-fetch Category & Brand maps
    const categories = await Category.find({}).lean();
    const categoryMap = new Map<string, string>(); // lowercase name -> _id
    for (const c of categories) {
      categoryMap.set(c.name.toLowerCase().trim(), c._id.toString());
    }

    const brands = await Brand.find({}).lean();
    const brandMap = new Map<string, string>(); // lowercase name -> _id
    for (const b of brands) {
      brandMap.set(b.name.toLowerCase().trim(), b._id.toString());
    }

    // Extract all SKUs to check existing products in MongoDB
    const rowSkus: string[] = [];
    rawRows.forEach((r) => {
      const norm = this.normalizeRow(r);
      if (norm.sku) rowSkus.push(norm.sku);
    });

    const existingProducts = await Product.find({ sku: { $in: rowSkus } }).lean();
    const existingSkuMap = new Map<string, any>();
    for (const p of existingProducts) {
      existingSkuMap.set(p.sku.toUpperCase(), p);
    }

    const items: BulkPreviewItem[] = [];
    let validCount = 0;
    let errorCount = 0;
    let newProductsCount = 0;
    let updatedProductsCount = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const raw = rawRows[i];
      const norm = this.normalizeRow(raw);
      const rowNum = i + 2; // Row 1 is header
      const errors: string[] = [];
      const changes: string[] = [];

      const sku = norm.sku || '';
      const name = norm.name || '';
      const categoryName = norm.categoryName || '';
      const brandName = norm.brandName || '';
      const price = norm.price;
      const salePrice = norm.salePrice;
      const stock = norm.stock !== undefined ? norm.stock : 0;
      const isActive = norm.isActive !== undefined ? norm.isActive : true;
      const description = norm.description || `${name} - Bulk imported item`;

      // Validation Rules
      if (!sku) {
        errors.push('SKU is required');
      } else if (!/^[A-Z0-9-]+$/.test(sku)) {
        errors.push('SKU must contain only uppercase letters, numbers, and hyphens');
      }

      if (!name) {
        errors.push('Product Name is required');
      }

      if (price === undefined || price === null || isNaN(price) || price < 0) {
        errors.push('Price must be a valid positive number');
      }

      if (salePrice !== undefined && salePrice !== null && (isNaN(salePrice) || salePrice >= (price || 0))) {
        errors.push('Sale price must be less than regular price');
      }

      if (stock < 0) {
        errors.push('Stock cannot be negative');
      }

      let categoryId: string | undefined;
      if (categoryName) {
        categoryId = categoryMap.get(categoryName.toLowerCase());
        if (!categoryId) {
          errors.push(`Category "${categoryName}" does not exist in database`);
        }
      } else {
        errors.push('Category name is required');
      }

      let brandId: string | undefined;
      if (brandName) {
        brandId = brandMap.get(brandName.toLowerCase());
        if (!brandId) {
          errors.push(`Brand "${brandName}" does not exist in database`);
        }
      } else {
        errors.push('Brand name is required');
      }

      if (errors.length > 0) {
        errorCount++;
        items.push({
          rowNumber: rowNum,
          action: 'error',
          sku: sku || `ROW-${rowNum}`,
          name: name || 'Unnamed Product',
          categoryName,
          brandName,
          price: price || 0,
          salePrice,
          stock,
          isActive,
          errors,
        });
        continue;
      }

      // Determine Create vs Update
      const existing = existingSkuMap.get(sku);
      let action: 'create' | 'update' = 'create';

      if (existing) {
        action = 'update';
        updatedProductsCount++;

        if (existing.name !== name) changes.push(`Name: "${existing.name}" ➔ "${name}"`);
        if (existing.price !== price) changes.push(`Price: ₹${existing.price} ➔ ₹${price}`);
        if ((existing.salePrice || 0) !== (salePrice || 0)) {
          changes.push(`Sale Price: ₹${existing.salePrice || 0} ➔ ₹${salePrice || 0}`);
        }
        if (existing.stock !== stock) changes.push(`Stock: ${existing.stock} ➔ ${stock}`);
        if (existing.isActive !== isActive) changes.push(`Status: ${existing.isActive ? 'Active' : 'Inactive'} ➔ ${isActive ? 'Active' : 'Inactive'}`);
      } else {
        action = 'create';
        newProductsCount++;
        changes.push('New product document will be created');
      }

      validCount++;
      items.push({
        rowNumber: rowNum,
        action,
        sku,
        name,
        categoryName,
        brandName,
        price,
        salePrice,
        stock,
        isActive,
        changes,
        parsedData: {
          sku,
          name,
          description,
          price,
          salePrice: salePrice || undefined,
          stock,
          category: categoryId,
          brand: brandId,
          isActive,
          approvalStatus: 'approved', // Admin bulk imports are pre-approved
        },
      });
    }

    return {
      totalRows: rawRows.length,
      validCount,
      errorCount,
      newProductsCount,
      updatedProductsCount,
      items,
    };
  }

  /**
   * Executes the bulk insert/update operation in MongoDB using bulkWrite.
   */
  public static async executeImport(validItems: any[]): Promise<{ createdCount: number; updatedCount: number; totalExecuted: number }> {
    if (!validItems || validItems.length === 0) {
      throw new ApiError(400, 'No valid items provided for bulk execution.');
    }

    const bulkOps: any[] = [];
    let createdCount = 0;
    let updatedCount = 0;

    for (const item of validItems) {
      const data = item.parsedData;
      if (!data || !data.sku) continue;

      const slug = (slugify as any)(data.name, { lower: true, strict: true });

      if (item.action === 'create') {
        createdCount++;
        bulkOps.push({
          insertOne: {
            document: {
              ...data,
              slug,
              images: [],
              specifications: [],
              tags: [data.name.toLowerCase(), data.sku.toLowerCase()],
              soldCount: 0,
              ratingsAverage: 0,
              ratingsCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        });
      } else {
        updatedCount++;
        bulkOps.push({
          updateOne: {
            filter: { sku: data.sku },
            update: {
              $set: {
                name: data.name,
                slug,
                price: data.price,
                ...(data.salePrice ? { salePrice: data.salePrice } : { $unset: { salePrice: '' } }),
                stock: data.stock,
                category: data.category,
                brand: data.brand,
                isActive: data.isActive,
                updatedAt: new Date(),
              },
            },
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
      logger.info(`✅ Bulk import executed: ${createdCount} created, ${updatedCount} updated.`);
    }

    return {
      createdCount,
      updatedCount,
      totalExecuted: bulkOps.length,
    };
  }
}
