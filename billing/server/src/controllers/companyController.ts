import { Request, Response } from 'express';
import { Company } from '../models/Company.js';
import path from 'path';
import fs from 'fs';
import { cloudinary, isConfigured as isCloudinaryConfigured } from '../config/cloudinary.js';

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

export async function uploadBrandingAssets(req: Request, res: Response) {
  try {
    let company = await Company.findOne();
    if (!company) company = await Company.create({});

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (files?.logo && files.logo[0]) {
      const logoFile = files.logo[0];
      company.logoPath = `/uploads/branding/${logoFile.filename}`;
      // Also copy to root assets for PDF fallback
      try {
        const dest = path.resolve(process.cwd(), 'assets/logo.png');
        fs.copyFileSync(logoFile.path, dest);
      } catch {}

      if (isCloudinaryConfigured) {
        try {
          const up = await cloudinary.uploader.upload(logoFile.path, {
            folder: 'billing_branding',
            public_id: 'logo',
          });
          company.logoPath = up.secure_url;
        } catch {}
      }
    }

    if (files?.stamp && files.stamp[0]) {
      const stampFile = files.stamp[0];
      company.stampPath = `/uploads/branding/${stampFile.filename}`;
      // Also copy to root assets for PDF fallback
      try {
        const dest = path.resolve(process.cwd(), 'assets/stamp.png');
        fs.copyFileSync(stampFile.path, dest);
      } catch {}

      if (isCloudinaryConfigured) {
        try {
          const up = await cloudinary.uploader.upload(stampFile.path, {
            folder: 'billing_branding',
            public_id: 'stamp',
          });
          company.stampPath = up.secure_url;
        } catch {}
      }
    }

    await company.save();

    res.json({
      success: true,
      message: 'Branding images uploaded successfully',
      company,
    });
  } catch (error: any) {
    console.error('Branding upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload branding images' });
  }
}
