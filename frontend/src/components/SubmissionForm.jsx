import React, { useState, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { microTap, instantFade } from '../motion/tokens';
import { Upload, X, FileText, AlertCircle, CheckCircle2, Image as ImageIcon, Video as VideoIcon, Lock, ArrowRight, Info } from 'lucide-react';
import { CAMPUS_BUILDINGS, HOSTELS, OTHER_LOCATION } from '../constants/locations';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase/config';
const CATEGORIES = [
    'Infrastructure',
    'Mess/Food',
    'Harassment',
    'WiFi/Internet',
    'Hygiene',
    'Other'
];
// Quick-select chips shown under the location dropdown (subset of the presets).
const QUICK_LOCATIONS = [
    'Aryabhatta Block',
    'Ramanujan Block',
    'Business Block',
    'Vivekanand Bhavan',
    'Chanakya Bhavan',
    'Kasturba Bhavan',
];
/**
 * Stable sandbox submitter identity.
 *
 * When the app runs WITHOUT real Firebase client credentials (sandbox/dev mode),
 * there are no verified accounts to seal server-side. We mint one persistent
 * local demo uid per browser and send it through the `x-sage-uid` header so the
 * backend's dev-mode authentication treats it as a verified developer identity
 * and seals it exactly like a real account. A real (non-anonymous) Firebase
 * sign-in always takes precedence when it exists.
 */
const SANDBOX_UID_KEY = 'sage_sandbox_submitter_uid';
function getSandboxUid() {
    let uid = localStorage.getItem(SANDBOX_UID_KEY);
    if (!uid) {
        uid = `sandbox_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(SANDBOX_UID_KEY, uid);
    }
    return uid;
}
// Staggered entrance for the form fields (top to bottom). Uses a calm easeOut
// so the form eases into view rather than snapping in or bouncing.
const formContainerVariants = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
};
const formFieldVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 260, damping: 28, mass: 1 },
    },
};
export const SubmissionForm = ({ onSubmitSuccess, onCancelToFeed }) => {
    const { activeRole, user, token, openAuthModal } = useAuth();
    const prefersReduced = useReducedMotion();
    const [category, setCategory] = useState('Infrastructure');
    const [locationPreset, setLocationPreset] = useState('Aryabhatta Block');
    const [customLocation, setCustomLocation] = useState('');
    const [description, setDescription] = useState('');
    const [photoDataUrl, setPhotoDataUrl] = useState(undefined);
    const [photoName, setPhotoName] = useState('');
    const [photoSizeMb, setPhotoSizeMb] = useState('');
    const [videoDataUrl, setVideoDataUrl] = useState(undefined);
    const [videoName, setVideoName] = useState('');
    const [videoSizeMb, setVideoSizeMb] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isVideoDragging, setIsVideoDragging] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState({});
    const fileInputRef = useRef(null);
    const videoFileInputRef = useRef(null);
    // Validate and handle photo selection (Max 5MB, JPG/PNG only)
    const handleFile = (file) => {
        if (!file)
            return;
        const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const lowerName = file.name.toLowerCase();
        const isValidExtension = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png');
        if (!validMimeTypes.includes(file.type) && !isValidExtension) {
            setErrorMsg('Invalid file format. Please upload JPG or PNG images only.');
            return;
        }
        const maxSizeBytes = 5 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            setErrorMsg('File exceeds 5MB size limit. Please upload a smaller image.');
            return;
        }
        setErrorMsg('');
        setPhotoName(file.name);
        setPhotoSizeMb((file.size / (1024 * 1024)).toFixed(2) + ' MB');
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setPhotoDataUrl(e.target.result);
            }
        };
        reader.readAsDataURL(file);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    };
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const removePhoto = () => {
        setPhotoDataUrl(undefined);
        setPhotoName('');
        setPhotoSizeMb('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    // Validate and handle video selection (Max 25MB, MP4/WebM/MOV only)
    const handleVideoFile = (file) => {
        if (!file)
            return;
        const validMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
        const lowerName = file.name.toLowerCase();
        const isValidExtension = lowerName.endsWith('.mp4') || lowerName.endsWith('.webm') || lowerName.endsWith('.mov') || lowerName.endsWith('.mkv');
        if (!validMimeTypes.includes(file.type) && !isValidExtension) {
            setErrorMsg('Invalid video format. Please upload MP4, WebM, or MOV clips only.');
            return;
        }
        const maxSizeBytes = 25 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            setErrorMsg('Video exceeds 25MB size limit. Please upload a shorter clip.');
            return;
        }
        setErrorMsg('');
        setVideoName(file.name);
        setVideoSizeMb((file.size / (1024 * 1024)).toFixed(2) + ' MB');
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setVideoDataUrl(e.target.result);
            }
        };
        reader.readAsDataURL(file);
    };
    const handleVideoDrop = (e) => {
        e.preventDefault();
        setIsVideoDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleVideoFile(e.dataTransfer.files[0]);
        }
    };
    const handleVideoDragOver = (e) => {
        e.preventDefault();
        setIsVideoDragging(true);
    };
    const handleVideoDragLeave = (e) => {
        e.preventDefault();
        setIsVideoDragging(false);
    };
    const removeVideo = () => {
        setVideoDataUrl(undefined);
        setVideoName('');
        setVideoSizeMb('');
        if (videoFileInputRef.current) {
            videoFileInputRef.current.value = '';
        }
    };
    const effectiveLocation = locationPreset === OTHER_LOCATION
        ? customLocation.trim()
        : (customLocation.trim() ? `${locationPreset} - ${customLocation.trim()}` : locationPreset);
    const charCount = description.length;
    const isLocationValid = effectiveLocation.length > 0;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (!category) {
            setErrorMsg('Please select a grievance category.');
            return;
        }
        if (!isLocationValid) {
            setErrorMsg('Please specify your campus location.');
            return;
        }
        if (charCount < 20) {
            setErrorMsg(`Description must contain at least 20 characters (currently ${charCount}).`);
            return;
        }
        if (charCount > 1000) {
            setErrorMsg(`Description cannot exceed 1000 characters (currently ${charCount}).`);
            return;
        }
        // Sealed anonymous submission: the backend refuses to seal anonymous or
        // missing uids. Only a real (non-anonymous) Firebase sign-in can be sealed
        // server-side under SAGE_MASTER_KEY. When the Firebase client is NOT
        // configured (sandbox/dev mode) there are no real accounts at all, so the
        // backend's dev-mode authentication seals our persistent local demo uid —
        // keeping the ledger deposit working without real credentials.
        const isVerifiedUser = !!user && !user.isAnonymous && !!user.uid;
        if (!isFirebaseConfigured) {
            // Sandbox mode: deposit is sealed with the persistent local demo identity.
        }
        else if (!isVerifiedUser) {
            setErrorMsg('A verified student sign-in is required - anonymous demo sessions cannot be sealed. Please sign in to continue.');
            openAuthModal();
            return;
        }
        const submitterUid = isVerifiedUser ? user.uid : getSandboxUid();
        setIsSubmitting(true);
        try {
            // Submit to live Firestore / Backend with AES encrypted identity
            const newComplaint = await ApiService.createComplaint({
                category: category.toLowerCase().replace('/', '_'),
                hostelOrLocation: effectiveLocation,
                location: effectiveLocation,
                description: description.trim(),
                photoUrl: photoDataUrl,
                videoUrl: videoDataUrl,
            }, activeRole, submitterUid, isVerifiedUser ? token : null);
            setIsSubmitting(false);
            onSubmitSuccess(newComplaint);
        }
        catch (err) {
            setIsSubmitting(false);
            setErrorMsg(err?.message || 'Failed to submit grievance. Please try again.');
        }
    };
    return (<motion.div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6" initial="hidden" animate="show" exit={{
            opacity: 0,
            scale: 0.98,
            transition: { type: 'spring', stiffness: 260, damping: 28, mass: 1 },
        }} variants={formContainerVariants}>
      {/* Editorial Confidentiality Warning Banner */}
      <motion.div variants={formFieldVariants} className="mb-8 bg-surface border border-line-strong rounded-xl p-5 sm:p-6 shadow-soft flex items-start gap-4">
        <div className="p-2.5 bg-accent text-white shrink-0 mt-0.5 rounded-lg">
          <Lock className="w-4 h-4"/>
        </div>
        <div className="text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-mono font-bold uppercase tracking-wider text-ink">
              Sealed Identity Guarantee
            </h3>
            <span className="bg-bronze text-ink text-[9px] font-mono uppercase px-1.5 py-0.5 font-bold rounded-full">
              Server-Sealed
            </span>
          </div>
          <p className="text-ink-soft leading-relaxed font-sans text-sm">
            Your real identity never reaches the ledger. The server seals your verified account reference into ciphertext (<span className="font-mono font-bold text-bronze-deep">SAGE-XXXX</span>), and no plaintext identity ever appears in any API response or in Firebase. Only the Head Admin can decrypt it, with a mandatory written justification, and every reveal is permanently written to the immutable revealLogs audit ledger.
          </p>
        </div>
      </motion.div>

      {/* Main Submission Form Card */}
      <motion.div variants={formFieldVariants} className="bg-surface border border-line-strong rounded-2xl p-7 sm:p-12 shadow-lift paper-grain relative">
        {/* Header */}
        <div className="mb-10 border-b border-line pb-6">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-ink-soft mb-2">
            <FileText className="w-3.5 h-3.5"/>
            <span>Form Reference — SAGE-ENTRY</span>
          </div>
          <h1 className="font-sans text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
            Lodge Student Grievance
          </h1>
          <p className="font-sans text-sm text-ink-soft mt-2 italic">
            Complete the deposition fields below to escalate campus concerns to public oversight.
          </p>
        </div>

        {/* Error Alert: shakes slightly on appear so it's noticed, without feeling alarming */}
        {errorMsg && (<motion.div key={errorMsg} initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }} transition={prefersReduced ? instantFade : { duration: 0.4, ease: 'easeOut' }} className="mb-6 p-4 bg-clay-soft border border-clay/40 text-clay-deep text-xs font-mono flex items-start gap-3 rounded-lg" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 text-clay-deep mt-0.5"/>
            <div>
              <p className="font-bold uppercase tracking-wider">Validation Error</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </motion.div>)}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Field 1: Category Dropdown */}
          <motion.div variants={formFieldVariants} id="field-category" className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="category-select" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink">
                1. Grievance Category <span className="text-bronze-deep">*</span>
              </label>
              <span className="text-[10px] font-mono text-ink-faint uppercase">Mandatory</span>
            </div>

            <div className="relative">
              <select id="category-select" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-surface border border-line-strong rounded-lg p-3 text-sm text-ink font-mono focus:outline-none focus:border-bronze focus:ring-2 focus:ring-bronze/20 cursor-pointer shadow-inset-soft" required>
                {CATEGORIES.map((cat) => (<option key={cat} value={cat}>
                    {cat}
                  </option>))}
              </select>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CATEGORIES.map((cat) => (<button key={cat} type="button" onClick={() => setCategory(cat)} className={`text-[11px] font-mono uppercase px-2.5 py-1 rounded-full border transition-all cursor-pointer ${category === cat
                ? 'bg-bronze text-ink border-bronze font-bold shadow-soft'
                : 'bg-surface-soft text-ink border-line-strong hover:bg-bronze-soft hover:border-bronze/40'}`}>
                  {cat}
                </button>))}
            </div>
          </motion.div>

          {/* Field 2: Description Textarea (Min 20, Max 1000, Live Count) */}
          <motion.div variants={formFieldVariants} id="field-description" className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="description-textarea" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink">
                2. Statement &amp; Evidence Description <span className="text-bronze-deep">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold ${charCount < 20 || charCount > 1000 ? 'text-bronze-deep' : 'text-ink'}`}>
                  {charCount} / 1000 CHARS
                </span>
                {charCount >= 20 && charCount <= 1000 && (<CheckCircle2 className="w-3.5 h-3.5 text-accent-deep"/>)}
              </div>
            </div>

            <div className="relative">
              <textarea id="description-textarea" rows={7} value={description} maxLength={1000} onBlur={() => setTouched((prev) => ({ ...prev, description: true }))} onChange={(e) => setDescription(e.target.value)} placeholder="State the grievance clearly (minimum 20 characters). Specify details, timelines, repeated offenses, or required remedy. Do NOT include personal identifying information..." className={`w-full bg-surface border p-3.5 text-sm text-ink font-sans leading-relaxed placeholder:font-sans placeholder:text-ink-faint focus:outline-none shadow-inset-soft ${touched.description && charCount < 20
            ? 'border-bronze focus:border-bronze focus:ring-2 focus:ring-bronze/20'
            : 'border-line-strong focus:border-bronze focus:ring-2 focus:ring-bronze/20'}`} required/>
            </div>

            {/* Requirement live status */}
            <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
              <div>
                {charCount < 20 ? (<span className="text-bronze-deep flex items-center gap-1">
                    <Info className="w-3 h-3 text-bronze-deep"/>
                    Minimum 20 characters required ({20 - charCount} remaining)
                  </span>) : (<span className="text-accent-deep flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-accent-deep"/>
                    Valid Statement Length (urgency scored automatically)
                  </span>)}
              </div>
              <div className="w-28 bg-line h-1.5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${charCount < 20 ? 'bg-bronze' : charCount > 900 ? 'bg-clay' : 'bg-accent'}`} style={{ width: `${Math.min(100, (charCount / 1000) * 100)}%` }}/>
              </div>
            </div>
          </motion.div>
          {/* Field 3: Location Dropdown or Text Input */}
          <motion.div variants={formFieldVariants} id="field-location" className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="location-select" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink">
                3. Campus Location <span className="text-bronze-deep">*</span>
              </label>
              <span className="text-[10px] font-mono text-ink-faint uppercase">Where Located</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="location-select" className="sr-only">Location Preset</label>
                <select id="location-select" value={locationPreset} onChange={(e) => setLocationPreset(e.target.value)} className="w-full bg-surface border border-line-strong rounded-lg p-3 text-xs font-mono text-ink focus:outline-none focus:border-bronze focus:ring-2 focus:ring-bronze/20 cursor-pointer shadow-inset-soft">
                  <optgroup label="Campus Buildings">
                    {CAMPUS_BUILDINGS.map((loc) => (<option key={loc} value={loc}>
                        {loc}
                      </option>))}
                  </optgroup>
                  <optgroup label="Hostels">
                    {HOSTELS.map((loc) => (<option key={loc} value={loc}>
                        {loc}
                      </option>))}
                  </optgroup>
                  <optgroup label="Other">
                    <option value={OTHER_LOCATION}>{OTHER_LOCATION}</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <input id="custom-location-input" type="text" value={customLocation} onChange={(e) => setCustomLocation(e.target.value)} placeholder={locationPreset === OTHER_LOCATION
            ? 'e.g. Mechanical Lab 3, Library 2nd Floor'
            : 'Wing, floor, or room (e.g. Room 302, 2nd Floor)'} className="w-full bg-surface border border-line-strong rounded-lg p-3 text-xs font-mono text-ink placeholder:text-ink-faint focus:outline-none focus:border-bronze focus:ring-2 focus:ring-bronze/20 shadow-inset-soft"/>
              </div>
            </div>

            {/* Quick selector buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase text-ink-faint mr-1">Quick Select:</span>
              {QUICK_LOCATIONS.map((loc) => (<button key={loc} type="button" onClick={() => setLocationPreset(loc)} className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border transition-all cursor-pointer ${locationPreset === loc
                ? 'bg-ink text-surface border-ink'
                : 'bg-surface text-ink border-line-strong hover:bg-surface-soft'}`}>
                  {loc}
                </button>))}
            </div>
          </motion.div>

          {/* Field 4: Optional Photo Upload (Max 5MB, JPG/PNG only) */}
          <motion.div variants={formFieldVariants} id="field-photo" className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink">
                4. Photographic Evidence <span className="text-[10px] font-normal text-ink-faint">(Optional — Max 5MB, JPG/PNG)</span>
              </label>
              {photoDataUrl && (<button type="button" onClick={removePhoto} className="text-xs font-mono font-bold text-bronze-deep hover:underline cursor-pointer">
                  [Remove Attachment]
                </button>)}
            </div>

            <input ref={fileInputRef} type="file" id="photo-file-input" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="hidden" onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        }}/>

            {!photoDataUrl ? (<div id="photo-dropzone" onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => fileInputRef.current?.click()} className={`border border-dashed border-line-strong rounded-xl p-6 text-center cursor-pointer transition-all ${isDragging ? 'bg-bronze-soft border-bronze' : 'bg-surface hover:bg-surface-soft hover:border-bronze/50'}`}>
                <div className="w-8 h-8 bg-ink text-surface flex items-center justify-center mx-auto mb-2 rounded-lg">
                  <Upload className="w-4 h-4"/>
                </div>
                <p className="text-xs font-mono font-bold text-ink uppercase tracking-wider">
                  Select or Drop Photo Attachment
                </p>
                <p className="text-[10px] font-mono text-ink-faint mt-0.5">
                  JPG or PNG format · Maximum size 5MB · EXIF headers stripped
                </p>
              </div>) : (<div className="border border-line rounded-lg bg-surface-soft/70 p-3 flex items-center gap-4 shadow-soft">
                <img src={photoDataUrl} alt="Upload preview" className="w-14 h-14 object-cover rounded-lg border border-line shrink-0 bg-surface"/>
                <div className="flex-1 min-w-0 font-mono text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-ink truncate">
                    <ImageIcon className="w-3.5 h-3.5 text-ink"/>
                    <span className="truncate">{photoName || 'attachment.jpg'}</span>
                  </div>
                  <p className="text-[10px] text-ink-faint mt-0.5">
                    {photoSizeMb} · <span className="text-accent-deep font-bold">READY TO SUBMIT</span>
                  </p>
                </div>
                <button type="button" onClick={removePhoto} className="p-1 text-ink hover:text-bronze-deep cursor-pointer rounded" title="Remove attachment">
                  <X className="w-4 h-4"/>
                </button>
              </div>)}
          </motion.div>

          {/* Field 5: Optional Video Upload (Max 25MB, MP4/WebM/MOV only) */}
          <motion.div variants={formFieldVariants} id="field-video" className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink">
                5. Video Evidence <span className="text-[10px] font-normal text-ink-faint">(Optional — Max 25MB, MP4/WebM/MOV)</span>
              </label>
              {videoDataUrl && (<button type="button" onClick={removeVideo} className="text-xs font-mono font-bold text-bronze-deep hover:underline cursor-pointer">
                  [Remove Video]
                </button>)}
            </div>

            <input ref={videoFileInputRef} type="file" id="video-file-input" accept=".mp4,.webm,.mov,.mkv,video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleVideoFile(e.target.files[0]);
            }
        }}/>

            {!videoDataUrl ? (<div id="video-dropzone" onDrop={handleVideoDrop} onDragOver={handleVideoDragOver} onDragLeave={handleVideoDragLeave} onClick={() => videoFileInputRef.current?.click()} className={`border border-dashed border-line-strong rounded-xl p-6 text-center cursor-pointer transition-all ${isVideoDragging ? 'bg-bronze-soft border-bronze' : 'bg-surface hover:bg-surface-soft hover:border-bronze/50'}`}>
                <div className="w-8 h-8 bg-ink text-surface flex items-center justify-center mx-auto mb-2 rounded-lg">
                  <VideoIcon className="w-4 h-4"/>
                </div>
                <p className="text-xs font-mono font-bold text-ink uppercase tracking-wider">
                  Select or Drop Video Attachment
                </p>
                <p className="text-[10px] font-mono text-ink-faint mt-0.5">
                  MP4, WebM or MOV · Maximum size 25MB · shorter clips recommended
                </p>
              </div>) : (<div className="border border-line rounded-lg bg-surface-soft/70 p-3 flex items-center gap-4 shadow-soft">
                <video src={videoDataUrl} controls preload="metadata" className="w-20 h-14 object-cover rounded-lg border border-line shrink-0 bg-surface"/>
                <div className="flex-1 min-w-0 font-mono text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-ink truncate">
                    <VideoIcon className="w-3.5 h-3.5 text-ink"/>
                    <span className="truncate">{videoName || 'attachment.mp4'}</span>
                  </div>
                  <p className="text-[10px] text-ink-faint mt-0.5">
                    {videoSizeMb} · <span className="text-accent-deep font-bold">READY TO SUBMIT</span>
                  </p>
                </div>
                <button type="button" onClick={removeVideo} className="p-1 text-ink hover:text-bronze-deep cursor-pointer rounded" title="Remove video">
                  <X className="w-4 h-4"/>
                </button>
              </div>)}
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={formFieldVariants} className="pt-8 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
            <motion.button id="cancel-btn" type="button" onClick={onCancelToFeed} whileTap={prefersReduced ? {} : { scale: 0.97, transition: microTap }} className="w-full sm:w-auto px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider text-ink border border-line-strong rounded-xl bg-surface hover:bg-bronze-soft/60 transition-colors cursor-pointer text-center">
              ← Back to Ledger
            </motion.button>

            <motion.button id="submit-complaint-btn" type="submit" disabled={isSubmitting || charCount < 20 || charCount > 1000 || !isLocationValid} whileTap={prefersReduced ? {} : { scale: 0.97, transition: microTap }} className="w-full sm:w-auto px-8 py-3.5 bg-bronze hover:opacity-90 disabled:bg-line disabled:text-ink-faint disabled:border-line disabled:cursor-not-allowed text-ink text-xs font-mono font-bold uppercase tracking-widest border border-bronze rounded-xl transition-all shadow-soft hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2">
              {isSubmitting ? (<>
                  <div className="w-3.5 h-3.5 border border-ink/30 border-t-ink rounded-full animate-spin"/>
                  <span>Recording to Ledger...</span>
                </>) : (<>
                  <span>Sealed Anonymous Deposition</span>
                  <ArrowRight className="w-4 h-4"/>
                </>)}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>);
};
