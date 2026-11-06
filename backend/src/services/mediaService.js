import { bucket } from '../config/firebaseAdmin.js';

/**
 * MediaService: Firebase Storage media upload handler
 * Handles video/photo uploads with signed URL generation
 */
export class MediaService {
  /**
   * Upload media to Firebase Storage and generate signed URL
   * @param {string} complaintId - Complaint ID for folder structure
   * @param {Buffer|string} mediaData - base64 or buffer data
   * @param {string} mediaType - 'video' or 'photo'
   * @param {string} mimeType - MIME type (video/mp4, image/jpeg, etc.)
   * @returns {Promise<string>} Signed URL for the uploaded media
   */
  static async uploadMedia(complaintId, mediaData, mediaType = 'video', mimeType = 'video/mp4') {
    if (!bucket) {
      throw new Error('Firebase Storage not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY in environment.');
    }

    try {
      // Convert base64 to buffer if needed
      let buffer;
      if (typeof mediaData === 'string') {
        // Assume it's base64
        buffer = Buffer.from(mediaData, 'base64');
      } else {
        buffer = mediaData;
      }

      // Create unique file path
      const fileName = `complaints/${complaintId}/${mediaType}-${Date.now()}`;
      const file = bucket.file(fileName);

      // Upload with metadata
      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            complaintId,
            uploadedAt: new Date().toISOString(),
            mediaType,
          },
        },
      });

      // Generate signed URL (valid for 90 days)
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
      });

      return signedUrl;
    } catch (error) {
      console.error(`[MediaService] Upload failed for ${mediaType}:`, error);
      throw new Error(`Failed to upload ${mediaType}: ${error?.message}`);
    }
  }

  /**
   * Upload video to Firebase Storage
   * @param {string} complaintId - Complaint ID
   * @param {string|Buffer} videoData - base64 or buffer video data
   * @param {string} mimeType - Video MIME type (default: video/mp4)
   * @returns {Promise<string>} Signed URL for video
   */
  static async uploadVideo(complaintId, videoData, mimeType = 'video/mp4') {
    return this.uploadMedia(complaintId, videoData, 'video', mimeType);
  }

  /**
   * Upload photo to Firebase Storage
   * @param {string} complaintId - Complaint ID
   * @param {string|Buffer} photoData - base64 or buffer photo data
   * @param {string} mimeType - Photo MIME type (default: image/jpeg)
   * @returns {Promise<string>} Signed URL for photo
   */
  static async uploadPhoto(complaintId, photoData, mimeType = 'image/jpeg') {
    return this.uploadMedia(complaintId, photoData, 'photo', mimeType);
  }

  /**
   * Delete media from Firebase Storage
   * @param {string} complaintId - Complaint ID
   * @param {string} mediaType - 'video' or 'photo'
   * @returns {Promise<void>}
   */
  static async deleteMedia(complaintId, mediaType = 'video') {
    if (!bucket) {
      console.warn('[MediaService] Storage not configured, skipping delete');
      return;
    }

    try {
      // Find and delete all media of this type for the complaint
      const [files] = await bucket.getFiles({
        prefix: `complaints/${complaintId}/${mediaType}-`,
      });

      for (const file of files) {
        await file.delete();
      }
    } catch (error) {
      console.warn(`[MediaService] Delete failed for ${mediaType}:`, error?.message);
      // Don't throw on delete failure - doesn't block complaint operations
    }
  }
}
