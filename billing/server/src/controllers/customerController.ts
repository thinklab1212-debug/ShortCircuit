import { Request, Response } from 'express';
import { Customer } from '../models/Customer.js';

export async function listCustomers(req: Request, res: Response) {
  try {
    const { search } = req.query;
    const query: any = {};
    if (search) {
      const rgx = new RegExp(String(search), 'i');
      query.$or = [{ name: rgx }, { companyName: rgx }, { phone: rgx }, { email: rgx }, { gstin: rgx }];
    }
    const customers = await Customer.find(query).sort({ name: 1 }).lean();
    res.json({ customers });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch customers' });
  }
}

export async function createCustomer(req: Request, res: Response) {
  try {
    const { name, companyName, phone, email, address, city, state, stateCode, pincode, gstin, pan } = req.body;
    if (!name || !address) {
      return res.status(400).json({ error: 'Customer name and address are required' });
    }

    const customer = new Customer({
      name,
      companyName,
      phone,
      email,
      address,
      city,
      state: state || 'Uttar Pradesh',
      stateCode: stateCode || '09',
      pincode,
      gstin,
      pan,
    });

    await customer.save();
    res.status(201).json({ customer });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create customer' });
  }
}

export async function updateCustomer(req: Request, res: Response) {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ customer });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update customer' });
  }
}

export async function deleteCustomer(req: Request, res: Response) {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete customer' });
  }
}
