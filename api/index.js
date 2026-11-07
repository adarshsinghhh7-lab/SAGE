// Minimal Vercel serverless handler - no heavy dependencies
// This bypasses the Express/Firebase complexity causing timeouts

const complaints = new Map();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;

    // GET /api/health
    if (pathname === '/api/health' && req.method === 'GET') {
      return res.status(200).json({
        status: 'healthy',
        system: 'SAGE Backend (Vercel)',
        timestamp: new Date().toISOString(),
      });
    }

    // POST /api/complaints - Create complaint
    if (pathname === '/api/complaints' && req.method === 'POST') {
      const body = req.body || {};
      const { category, hostelOrLocation, description, photoUrl, videoUrl } = body;

      // Validation
      if (!category || !hostelOrLocation || !description) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: category, hostelOrLocation, description',
        });
      }

      const descLen = String(description).trim().length;
      if (descLen < 20) {
        return res.status(400).json({
          success: false,
          error: `Description too short (${descLen}/20 chars minimum)`,
        });
      }

      if (descLen > 1000) {
        return res.status(400).json({
          success: false,
          error: `Description too long (${descLen}/1000 chars maximum)`,
        });
      }

      // Create complaint
      const id = `complaint-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const complaint = {
        id,
        complaintId: id,
        category: String(category).toLowerCase(),
        hostelOrLocation: String(hostelOrLocation),
        description: String(description).trim(),
        photoUrl: photoUrl ? 'photo-uploaded' : undefined,
        videoUrl: videoUrl ? 'video-uploaded' : undefined,
        status: 'submitted',
        upvoteCount: 0,
        urgencyScore: 0.5,
        createdAt: new Date().toISOString(),
        encryptedUserRef: 'sealed-identity',
      };

      complaints.set(id, complaint);

      return res.status(201).json({
        success: true,
        message: 'Grievance successfully deposited. Your identity is sealed.',
        data: complaint,
      });
    }

    // GET /api/complaints - List complaints
    if (pathname === '/api/complaints' && req.method === 'GET') {
      return res.status(200).json({
        success: true,
        count: complaints.size,
        data: Array.from(complaints.values()),
      });
    }

    // GET /api/complaints/:id
    if (pathname.startsWith('/api/complaints/') && req.method === 'GET') {
      const id = pathname.split('/')[3];
      const complaint = complaints.get(id);

      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      return res.status(200).json({
        success: true,
        data: complaint,
      });
    }

    // Default
    return res.status(404).json({
      error: 'Not found',
      path: pathname,
    });
  } catch (error) {
    console.error('[Handler Error]', error);
    return res.status(500).json({
      error: 'Server error',
      message: error?.message,
    });
  }
}
