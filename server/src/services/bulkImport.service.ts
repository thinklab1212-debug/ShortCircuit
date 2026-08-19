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
  productType?: 'standalone' | 'family';
  description?: string;
  specificationsCount?: number;
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
   * Helper to clean common UTF-8 encoding glitches (en-dashes, smart quotes, corrupted accents).
   */
  private static cleanText(str: any): string {
    if (str === undefined || str === null) return '';
    let val = String(str);
    val = val
      .replace(/â€“|â€”|–|—/g, '-')    // Normalize en-dashes / em-dashes
      .replace(/â€œ|â€|“|”/g, '"')     // Normalize double quotes
      .replace(/â€™|’/g, "'")           // Normalize single quotes
      .replace(/Â/g, '')               // Strip ghost encoding characters
      .replace(/\u00A0/g, ' ')          // Non-breaking spaces
      .trim();
    return val;
  }

  /**
   * Helper to parse specifications string into structured Key-Value array.
   * Handles middle dots (·), semicolons (;), newlines (\n), and pipes (|).
   */
  private static parseSpecifications(rawSpecs: string): Array<{ key: string; value: string; group?: string }> {
    if (!rawSpecs) return [];
    
    // Split by middle dot ·, semicolon ;, newline \n, or pipe |
    const items = rawSpecs.split(/[·;\n|]/);
    const specs: Array<{ key: string; value: string; group?: string }> = [];

    for (const item of items) {
      const trimmed = this.cleanText(item);
      if (!trimmed) continue;

      const colonIdx = trimmed.indexOf(':');
      if (colonIdx > 0) {
        const key = this.cleanText(trimmed.substring(0, colonIdx));
        const val = this.cleanText(trimmed.substring(colonIdx + 1));
        if (key && val) {
          specs.push({
            key,
            value: val,
            group: 'General',
          });
        }
      }
    }

    return specs;
  }

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
        normalized.sku = this.cleanText(value).toUpperCase();
      } else if (cleanKey === 'name' || cleanKey === 'product name' || cleanKey === 'title') {
        normalized.name = this.cleanText(value);
      } else if (cleanKey === 'category' || cleanKey === 'category name') {
        normalized.categoryName = this.cleanText(value);
      } else if (cleanKey === 'brand' || cleanKey === 'brand name') {
        normalized.brandName = this.cleanText(value);
      } else if (cleanKey === 'price' || cleanKey === 'mrp' || cleanKey === 'price / range') {
        normalized.price = this.parseNumber(value);
      } else if (cleanKey === 'sale price' || cleanKey === 'saleprice' || cleanKey === 'discount price') {
        normalized.salePrice = this.parseNumber(value);
      } else if (cleanKey === 'stock' || cleanKey === 'total stock' || cleanKey === 'quantity') {
        normalized.stock = this.parseNumber(value);
      } else if (cleanKey === 'description' || cleanKey === 'short description') {
        normalized.description = this.cleanText(value);
      } else if (cleanKey === 'specifications' || cleanKey === 'specs' || cleanKey === 'variant options & specifications') {
        normalized.specificationsRaw = String(value || '').trim();
      } else if (cleanKey === 'type' || cleanKey === 'product type') {
        const typeStr = this.cleanText(value).toLowerCase();
        normalized.productType = typeStr === 'family' ? 'family' : 'standalone';
      } else if (cleanKey === 'status') {
        const strVal = this.cleanText(value).toLowerCase();
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
        // Read with UTF-8 raw buffer parsing to preserve special characters
        const workbook = XLSX.read(fileBuffer, { type: 'buffer', codepage: 65001 });
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
      const syncRes = await GoogleSheetsService.syncAllProducts();
      logger.info(`Bulk import pulling from Google Sheets (synced ${syncRes.totalSynced} items baseline)`);
      
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
      let brandName = norm.brandName || 'Generic';
      const price = norm.price;
      const salePrice = norm.salePrice;
      const stock = norm.stock !== undefined ? norm.stock : 0;
      const isActive = norm.isActive !== undefined ? norm.isActive : true;
      const productType = norm.productType || 'standalone';
      const description = norm.description || `${name} - High-quality component.`;
      const specifications = this.parseSpecifications(norm.specificationsRaw || '');

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
          // Auto-create brand if it doesn't exist (e.g. "Generic", "ST / Generic")
          const newBrand = await Brand.create({
            name: brandName,
            isActive: true,
          });
          brandId = newBrand._id.toString();
          brandMap.set(brandName.toLowerCase(), brandId);
        }
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
          productType,
          description,
          specificationsCount: specifications.length,
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
        if (specifications.length > 0) changes.push(`Updated ${specifications.length} technical specifications`);
      } else {
        action = 'create';
        newProductsCount++;
        changes.push(`New product with ${specifications.length} technical specs will be created`);
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
        productType,
        description,
        specificationsCount: specifications.length,
        changes,
        parsedData: {
          sku,
          name,
          description,
          price,
          salePrice: salePrice || undefined,
          stock,
          productType,
          category: categoryId,
          brand: brandId,
          specifications,
          isActive,
          approvalStatus: 'approved',
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
                description: data.description,
                price: data.price,
                ...(data.salePrice ? { salePrice: data.salePrice } : { $unset: { salePrice: '' } }),
                stock: data.stock,
                productType: data.productType,
                category: data.category,
                brand: data.brand,
                specifications: data.specifications,
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
