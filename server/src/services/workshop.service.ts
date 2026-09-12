// ============================================================================
// ShortCircuit — Workshop Service
// ============================================================================
// Business logic for Workshop programs, Experience institutions, and Inquiries.
// ============================================================================

import { Workshop, WorkshopExperience, WorkshopInquiry } from '../models/index.js';
import { ApiError } from '../utils/index.js';

export class WorkshopService {
  // ── Workshop Cards ─────────────────────────────────────────────────────────

  static async getActiveWorkshops() {
    return Workshop.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 });
  }

  static async getAllWorkshopsAdmin() {
    return Workshop.find().sort({ displayOrder: 1, createdAt: -1 });
  }

  static async createWorkshop(data: {
    title: string;
    description: string;
    category: string;
    displayOrder?: number;
    isActive?: boolean;
  }) {
    return Workshop.create(data);
  }

  static async updateWorkshop(id: string, data: Partial<{
    title: string;
    description: string;
    category: string;
    displayOrder: number;
    isActive: boolean;
  }>) {
    const workshop = await Workshop.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!workshop) {
      throw ApiError.notFound('Workshop not found.');
    }
    return workshop;
  }

  static async deleteWorkshop(id: string) {
    const workshop = await Workshop.findByIdAndDelete(id);
    if (!workshop) {
      throw ApiError.notFound('Workshop not found.');
    }
    return workshop;
  }

  // ── Experience Organizations ───────────────────────────────────────────────

  static async getActiveExperience() {
    return WorkshopExperience.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 });
  }

  static async getAllExperienceAdmin() {
    return WorkshopExperience.find().sort({ displayOrder: 1, createdAt: -1 });
  }

  static async createExperience(data: {
    name: string;
    logo: { url: string; publicId: string };
    displayOrder?: number;
    isActive?: boolean;
  }) {
    return WorkshopExperience.create(data);
  }

  static async updateExperience(id: string, data: Partial<{
    name: string;
    logo: { url: string; publicId: string };
    displayOrder: number;
    isActive: boolean;
  }>) {
    const experience = await WorkshopExperience.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!experience) {
      throw ApiError.notFound('Institution experience entry not found.');
    }
    return experience;
  }

  static async deleteExperience(id: string) {
    const experience = await WorkshopExperience.findByIdAndDelete(id);
    if (!experience) {
      throw ApiError.notFound('Institution experience entry not found.');
    }
    return experience;
  }

  // ── Workshop Inquiries ─────────────────────────────────────────────────────

  static async createInquiry(data: {
    institutionName: string;
    institutionType: 'School' | 'College' | 'University' | 'Other';
    contactPerson: string;
    email: string;
    phone: string;
    workshopArea: string;
    expectedStudents: 'Less than 30' | '30–50' | '50–100' | '100–200' | '200+';
    location: string;
    preferredDate?: Date;
    message?: string;
  }) {
    return WorkshopInquiry.create(data);
  }

  static async getInquiriesAdmin(query: {
    status?: string;
    page?: number | string;
    limit?: number | string;
  }) {
    const filter: Record<string, any> = {};
    if (query.status && query.status !== 'All') {
      filter.status = query.status;
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [inquiries, total] = await Promise.all([
      WorkshopInquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      WorkshopInquiry.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      docs: inquiries,
      pagination: {
        page,
        limit,
        totalPages,
        totalResults: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  static async updateInquiryStatus(
    id: string,
    status: 'New' | 'Contacted' | 'Confirmed' | 'Completed' | 'Cancelled'
  ) {
    const inquiry = await WorkshopInquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    if (!inquiry) {
      throw ApiError.notFound('Inquiry not found.');
    }
    return inquiry;
  }

  static async deleteInquiry(id: string) {
    const inquiry = await WorkshopInquiry.findByIdAndDelete(id);
    if (!inquiry) {
      throw ApiError.notFound('Inquiry not found.');
    }
    return inquiry;
  }
}

export default WorkshopService;
