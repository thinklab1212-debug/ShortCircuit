import { Router } from 'express';
import {
  listInvoices,
  getInvoiceById,
  createInvoice,
  downloadInvoicePdf,
  updatePaymentStatus,
  deleteInvoice,
  getNextInvoiceNumber,
  emailInvoice,
} from '../controllers/invoiceController.js';
import { syncComponentsFromStore } from '../scripts/syncFromStore.js';
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import {
  getCompanyProfile,
  updateCompanyProfile,
} from '../controllers/companyController.js';

const router = Router();

// Invoices
router.get('/invoices/next-number', getNextInvoiceNumber);
router.get('/invoices', listInvoices);
router.post('/invoices', createInvoice);
router.get('/invoices/:id', getInvoiceById);
router.get('/invoices/:id/pdf', downloadInvoicePdf);
router.post('/invoices/:id/email', emailInvoice);
router.patch('/invoices/:id/payment', updatePaymentStatus);
router.delete('/invoices/:id', deleteInvoice);

// Store Products Sync
router.post('/products/sync-store', async (req, res) => {
  try {
    const result = await syncComponentsFromStore();
    res.json({ success: true, message: `Synced ${result.syncedProducts} products and ${result.syncedKits} kits from ShortCircuit store!`, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Store sync failed. Ensure store Atlas IP is accessible.' });
  }
});

// Customers
router.get('/customers', listCustomers);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

// Products / Services
router.get('/products', listProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Company Profile & Settings
router.get('/company', getCompanyProfile);
router.put('/company', updateCompanyProfile);

export default router;
