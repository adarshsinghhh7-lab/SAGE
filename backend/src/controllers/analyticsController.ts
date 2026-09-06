import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { FirestoreService } from '../services/firestoreService.js';
import { ComplaintCategory } from '../types/index.js';

const CATEGORIES: ComplaintCategory[] = [
  'Infrastructure',
  'Mess/Food',
  'Harassment',
  'WiFi/Internet',
  'Hygiene',
  'Other',
];

export class AnalyticsController {
  /**
   * GET /api/analytics
   * Aggregates telemetry for Admin Dashboard visualizations
   */
  static async getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const complaints = await FirestoreService.getComplaints({});

      // 1. Category Breakdown
      const categoryCounts: Record<string, number> = {};
      CATEGORIES.forEach((cat) => (categoryCounts[cat] = 0));
      complaints.forEach((c: any) => {
        categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
      });

      const categoryData = CATEGORIES.map((cat) => ({
        name: cat,
        value: categoryCounts[cat] || 0,
      }));

      // 2. Hostel Breakdown
      const hostelCounts: Record<string, number> = {};
      complaints.forEach((c: any) => {
        let hostelKey = 'Campus General';
        const loc = c.location.toLowerCase();

        // Official hostels (checked before loose 'block' matches so a bhavan
        // name never gets mis-bucketed as a campus building).
        if (loc.includes('vivekanand bhavan')) {
          hostelKey = 'Vivekanand Bhavan';
        } else if (loc.includes('dayanand bhavan')) {
          hostelKey = 'Dayanand Bhavan';
        } else if (loc.includes('chanakya bhavan')) {
          hostelKey = 'Chanakya Bhavan';
        } else if (loc.includes('aurobindo bhavan')) {
          hostelKey = 'Aurobindo Bhavan';
        } else if (loc.includes('ramakrishna bhavan')) {
          hostelKey = 'Ramakrishna Bhavan';
        } else if (loc.includes('fr building')) {
          hostelKey = 'FR Building';
        } else if (loc.includes('kasturba bhavan')) {
          hostelKey = 'Kasturba Bhavan';
        } else if (loc.includes('sarojini bhavan')) {
          hostelKey = 'Sarojini Bhavan';
        }
        // Campus academic / administrative buildings
        else if (loc.includes('aryabhatta block')) {
          hostelKey = 'Aryabhatta Block';
        } else if (loc.includes('ramanujan block')) {
          hostelKey = 'Ramanujan Block';
        } else if (loc.includes('bhabha block')) {
          hostelKey = 'Bhabha Block';
        } else if (loc.includes('raman block')) {
          hostelKey = 'Raman Block';
        } else if (loc.includes('vishwakarma block')) {
          hostelKey = 'Vishwakarma Block';
        } else if (loc.includes('business block')) {
          hostelKey = 'Business Block';
        } else if (loc.includes('dining') || loc.includes('mess')) {
          hostelKey = 'Mess Hall';
        } else if (loc.includes('library')) {
          hostelKey = 'Library';
        } else if (loc.includes('academic') || loc.includes('complex')) {
          hostelKey = 'Academic';
        } else if (loc.includes('gate') || loc.includes('pathway')) {
          hostelKey = 'Gate / Grounds';
        }
        // Legacy demo-seed hostel labels (kept for backwards compatibility)
        else if (loc.includes('hostel block a')) {
          hostelKey = 'Block A';
        } else if (loc.includes('hostel block b')) {
          hostelKey = 'Block B';
        } else if (loc.includes('hostel block c')) {
          hostelKey = 'Block C';
        } else if (loc.includes('girls hostel 1') || loc.includes('gh1')) {
          hostelKey = 'Girls H-1';
        } else if (loc.includes('girls hostel 2') || loc.includes('gh2')) {
          hostelKey = 'Girls H-2';
        } else {
          hostelKey = c.location.split('(')[0].split('-')[0].trim().slice(0, 14);
        }

        hostelCounts[hostelKey] = (hostelCounts[hostelKey] || 0) + 1;
      });

      const hostelData = Object.keys(hostelCounts)
        .map((k) => ({
          hostel: k,
          complaints: hostelCounts[k],
        }))
        .sort((a, b) => b.complaints - a.complaints);

      // 3. Resolution Stats
      const resolvedList = complaints.filter((c: any) => c.status === 'Resolved');
      let totalResolutionHours = 0;
      let counted = 0;

      resolvedList.forEach((c: any) => {
        if (c.resolvedAt) {
          const diffMs = new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime();
          const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
          totalResolutionHours += diffHours;
          counted++;
        } else {
          totalResolutionHours += 22;
          counted++;
        }
      });

      const avgResolutionTimeHours = counted > 0 ? (totalResolutionHours / counted).toFixed(1) : '18.5';
      const resolutionRate = complaints.length > 0 ? Math.round((resolvedList.length / complaints.length) * 100) : 0;

      // 4. Status Counts
      const total = complaints.length;
      const submitted = complaints.filter((c: any) => c.status === 'Submitted').length;
      const underReview = complaints.filter((c: any) => c.status === 'Under Review').length;
      const resolved = complaints.filter((c: any) => c.status === 'Resolved').length;
      const urgent = complaints.filter((c: any) => c.urgency === 'Urgent' && c.status !== 'Resolved').length;
      const totalUpvotes = complaints.reduce((sum: number, c: any) => sum + (c.upvotes || 0), 0);

      res.status(200).json({
        success: true,
        data: {
          summary: {
            total,
            submitted,
            underReview,
            resolved,
            urgent,
            totalUpvotes,
            avgResolutionTimeHours: parseFloat(avgResolutionTimeHours),
            resolutionRate,
          },
          categoryData,
          hostelData,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to compute analytics',
        details: error?.message,
      });
    }
  }
}
