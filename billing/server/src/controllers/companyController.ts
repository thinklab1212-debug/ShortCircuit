import { Request, Response } from 'express';
import { Company } from '../models/Company.js';

export async function getCompanyProfile(req: Request, res: Response) {
  try {
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({});
    }
    res.json({ company });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch company profile' });
  }
}

export async function updateCompanyProfile(req: Request, res: Response) {
  try {
    let company = await Company.findOne();
    if (!company) {
      company = new Company(req.body);
    } else {
      Object.assign(company, req.body);
    }
    await company.save();
    res.json({ message: 'Company profile updated', company });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update company profile' });
  }
}
