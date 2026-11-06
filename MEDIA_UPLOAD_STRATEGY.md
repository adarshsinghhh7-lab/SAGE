# S.A.G.E. Media Upload Strategy

## Problem
- Backend currently accepts **35 MB** uploads (base64 video data-URI)
- Vercel free tier caps requests at **~4.5 MB**
- Storing large files in Firestore is inefficient and costly

## Solution: Firebase Storage

### Architecture
```
Client Browser
    ↓ (upload video)
Firebase Storage (upload via signed URL)
    ↓ (store URL reference)
Firestore Document (complaintId → { evidenceVideoUrl: "gs://..." })
    ↓ (retrieve on demand)
Client Browser (loads video from Storage via public/authenticated access)
```

### Implementation Steps

#### 1. Enable Firebase Storage in GCP Console
- Go to GCP Console > Storage > Create bucket
- Bucket name: `{firebase-project}-complaints` (e.g., `sage-prod-complaints`)
- Region: same as Firestore region
- Set storage class: Standard (multi-region for availability)

#### 2. Update Backend Media Upload Endpoint
**File: `backend/src/controllers/complaintController.js`**

Replace base64 video handling with Firebase Storage signed URLs:

```javascript
import admin from 'firebase-admin';

const bucket = admin.storage().bucket();

export async function uploadEvidence(req, res) {
  const { complaintId } = req.params;
  const { videoData, mimeType } = req.body; // Still accept base64, but size-limit to 25MB

  // Reduce body limit for this endpoint or validate client-side
  if (videoData && videoData.length > 26_214_400) { // 25MB in bytes (base64)
    return res.status(413).json({ error: 'Video exceeds 25 MB' });
  }

  try {
    // 1. Create a unique file path
    const fileName = `complaints/${complaintId}/evidence-${Date.now()}`;
    const file = bucket.file(fileName);

    // 2. Convert base64 to Buffer and upload
    if (videoData) {
      const buffer = Buffer.from(videoData, 'base64');
      await file.save(buffer, {
        metadata: {
          contentType: mimeType || 'video/mp4',
          metadata: { complaintId },
        },
      });
    }

    // 3. Generate a permanent signed URL (readable for 90 days)
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
    });

    // 4. Store URL reference in Firestore (NOT the video data)
    await firestore.collection('complaints').doc(complaintId).update({
      evidenceVideoUrl: signedUrl,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, videoUrl: signedUrl });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}
```

#### 3. Update Frontend Form Handler
**File: `frontend/src/components/SubmissionForm.tsx`**

Video size limit enforced client-side:

```typescript
const handleVideoSelect = (file: File) => {
  const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25 MB

  if (file.size > MAX_VIDEO_SIZE) {
    setError(`Video must be under 25 MB (current: ${(file.size / 1024 / 1024).toFixed(1)} MB)`);
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    setVideoData(e.target?.result as string); // Store base64
  };
  reader.readAsDataURL(file);
};
```

#### 4. Update Firestore Security Rules
**File: `database/firestore.rules`**

Add storage bucket access rules:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /complaints/{complaintId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.authorId || isAdmin();
      // Allow all authenticated users to read evidenceVideoUrl field
      allow read: if request.auth != null;
    }
  }
}

// Storage rules (add to storage.rules in GCP)
service firebase.storage {
  match /b/{bucket}/o {
    match /complaints/{complaintId}/evidence-{fileName} {
      // Allow authenticated users to read evidence
      allow read: if request.auth != null;
      // Only the backend service account can write
      allow write: if false; // Backend uses Admin SDK (bypasses rules)
    }
  }
}
```

#### 5. Reduce Express Body Limit
**File: `backend/src/server.js`**

Change from 35MB to 30MB (safer margin):

```javascript
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
```

#### 6. Add Environment Variable
**File: `.env` (and deployment platforms)**

```env
FIREBASE_STORAGE_BUCKET="sage-prod-complaints"
```

### Benefits
✅ Scales to any video size (Storage has no request size limit)  
✅ Works on Vercel free tier (no payload size limit for Storage API)  
✅ Cheaper than Firestore document storage  
✅ Signed URLs expire automatically (security)  
✅ Metadata stays in Firestore (queryable)  
✅ CDN acceleration available via Signed URLs  

### Testing
```bash
# 1. Create a test bucket in GCP Console
# 2. Update .env with bucket name
# 3. Test upload with curl:
curl -X POST http://localhost:5000/api/complaints/test-id/upload-evidence \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-token>" \
  -d '{
    "videoData": "<base64-video>",
    "mimeType": "video/mp4"
  }'
# 4. Verify signed URL works in browser
```

### Production Checklist
- [ ] GCP Storage bucket created
- [ ] Bucket linked to Firestore project
- [ ] Signed URL expiry set to 90 days
- [ ] Storage Rules configured for authentication
- [ ] Backend upload endpoint implemented
- [ ] Frontend video size validation added
- [ ] Environment variable deployed to production
- [ ] Test with 20 MB+ video file
