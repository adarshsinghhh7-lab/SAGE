import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Image as ImageIcon,
  Lock,
  ArrowRight,
  Info
} from 'lucide-react';
import { Complaint, ComplaintCategory } from '../types';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface SubmissionFormProps {
  onSubmitSuccess: (newComplaint: Complaint) => void;
  onCancelToFeed: () => void;
}

const CATEGORIES: ComplaintCategory[] = [
  'Infrastructure',
  'Mess/Food',
  'Harassment',
  'WiFi/Internet',
  'Hygiene',
  'Other'
];

const PRESET_LOCATIONS = [
  'Hostel Block A',
  'Hostel Block B',
  'Hostel Block C',
  'Girls Hostel 1',
  'Girls Hostel 2',
  'Central Mess Hall',
  'Central Library',
  'Academic Complex Block 1',
  'Academic Complex Block 2',
  'Academic Complex Block 4',
  'Campus Sports Complex',
  'East Gate Campus Area',
  'Other / Custom Location'
];

export const SubmissionForm: React.FC<SubmissionFormProps> = ({
  onSubmitSuccess,
  onCancelToFeed
}) => {
  const { activeRole } = useAuth();
  const [category, setCategory] = useState<ComplaintCategory>('Infrastructure');
  const [locationPreset, setLocationPreset] = useState<string>('Hostel Block A');
  const [customLocation, setCustomLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [photoName, setPhotoName] = useState<string>('');
  const [photoSizeMb, setPhotoSizeMb] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate and handle photo selection (Max 5MB, JPG/PNG only)
  const handleFile = (file: File | null) => {
    if (!file) return;

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
        setPhotoDataUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
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

  const effectiveLocation = locationPreset === 'Other / Custom Location'
    ? customLocation.trim()
    : (customLocation.trim() ? `${locationPreset} - ${customLocation.trim()}` : locationPreset);

  const charCount = description.length;
  const isLocationValid = effectiveLocation.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!category) {
      setErrorMsg('Please select a grievance category.');
      return;
    }

    if (!isLocationValid) {
      setErrorMsg('Please specify your hostel or campus location.');
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

    setIsSubmitting(true);

    try {
      // Submit to live Firestore / Backend with AES encrypted identity
      const newComplaint = await ApiService.createComplaint(
        {
          category: category.toLowerCase().replace('/', '_'),
          hostelOrLocation: effectiveLocation,
          location: effectiveLocation,
          description: description.trim(),
          photoUrl: photoDataUrl,
        },
        activeRole
      );

      setIsSubmitting(false);
      onSubmitSuccess(newComplaint);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Failed to submit grievance. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      {/* Editorial Confidentiality Warning Banner */}
      <div className="mb-6 bg-white/60 backdrop-blur-md border border-indigo-100/50 rounded-xl p-4 sm:p-5 shadow-md flex items-start gap-4">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white shrink-0 mt-0.5 rounded-lg shadow-md shadow-indigo-200">
          <Lock className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-mono font-bold uppercase tracking-wider text-slate-900">
              Strict Anonymity Guarantee
            </h3>
            <span className="bg-indigo-600 text-white text-[9px] font-mono uppercase px-1.5 py-0.2 font-bold">
              Protected
            </span>
          </div>
          <p className="text-slate-900/80 leading-relaxed font-sans text-sm">
            Student names, emails, and device identifiers are stripped at point of ingress. You will receive an untraceable public ledger ID (<span className="font-mono font-bold text-indigo-600">SAGE-XXXX</span>) upon deposition.
          </p>
        </div>
      </div>

      {/* Main Submission Form Card */}
      <div className="bg-white/60 backdrop-blur-md border border-indigo-100/50 rounded-xl p-6 sm:p-10 shadow-lg relative">
        {/* Header */}
        <div className="mb-8 border-b border-indigo-100/50 pb-5">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-900/60 mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Form Reference · SAGE-ENTRY</span>
          </div>
          <h1 className="font-sans text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Lodge Student Grievance
          </h1>
          <p className="font-sans text-sm text-slate-900/70 mt-1 italic">
            Complete the deposition fields below to escalate campus concerns to public oversight.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-900 text-xs font-mono flex items-start gap-3 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider">Validation Error</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Field 1: Category Dropdown */}
          <div id="field-category" className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="category-select" className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                1. Grievance Category <span className="text-indigo-600">*</span>
              </label>
              <span className="text-[10px] font-mono text-slate-900/50 uppercase">Mandatory</span>
            </div>

            <div className="relative">
              <select
                id="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-900 font-mono focus:outline-none focus:bg-slate-50 cursor-pointer shadow-sm"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-[11px] font-mono uppercase px-2.5 py-1 border transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent font-bold'
                      : 'bg-indigo-50/50 text-slate-900 border-indigo-100/50 hover:bg-indigo-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Field 2: Description Textarea (Min 20, Max 1000, Live Count) */}
          <div id="field-description" className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="description-textarea" className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                2. Statement & Evidence Description <span className="text-indigo-600">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold ${
                  charCount < 20
                    ? 'text-amber-800'
                    : charCount > 1000
                    ? 'text-indigo-600'
                    : 'text-slate-900'
                }`}>
                  {charCount} / 1000 CHARS
                </span>
                {charCount >= 20 && charCount <= 1000 && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                )}
              </div>
            </div>

            <div className="relative">
              <textarea
                id="description-textarea"
                rows={5}
                value={description}
                maxLength={1000}
                onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="State the grievance clearly (minimum 20 characters). Specify details, timelines, repeated offenses, or required remedy. Do NOT include personal identifying information..."
                className={`w-full bg-white border p-3.5 text-sm text-slate-900 font-sans leading-relaxed placeholder:font-sans placeholder:text-slate-900/40 focus:outline-none shadow-sm ${
                  touched.description && charCount < 20
                    ? 'border-amber-700 focus:bg-amber-50/20'
                    : 'border-slate-300 focus:bg-slate-50'
                }`}
                required
              />
            </div>

            {/* Requirement live status */}
            <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
              <div>
                {charCount < 20 ? (
                  <span className="text-amber-800 flex items-center gap-1">
                    <Info className="w-3 h-3 text-amber-700" />
                    Minimum 20 characters required ({20 - charCount} remaining)
                  </span>
                ) : (
                  <span className="text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    Valid Statement Length (ML urgency evaluated automatically)
                  </span>
                )}
              </div>
              <div className="w-28 bg-slate-200 h-1.5 border border-slate-900/40 overflow-hidden">
                <div 
                  className={`h-full ${
                    charCount < 20
                      ? 'bg-amber-600'
                      : charCount > 900
                      ? 'bg-indigo-600'
                      : 'bg-slate-900'
                  }`}
                  style={{ width: `${Math.min(100, (charCount / 1000) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Field 3: Hostel / Location Dropdown or Text Input */}
          <div id="field-location" className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="location-select" className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                3. Hostel / Campus Location <span className="text-indigo-600">*</span>
              </label>
              <span className="text-[10px] font-mono text-slate-900/50 uppercase">Where Located</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="location-select" className="sr-only">Hostel Preset</label>
                <select
                  id="location-select"
                  value={locationPreset}
                  onChange={(e) => setLocationPreset(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-900 focus:outline-none focus:bg-slate-50 cursor-pointer shadow-sm"
                >
                  {PRESET_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  id="custom-location-input"
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder={
                    locationPreset === 'Other / Custom Location'
                      ? 'e.g. Mechanical Lab 3, Library 2nd Floor'
                      : 'Wing, floor, or room (e.g. Room 302, 2nd Floor)'
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-900 placeholder:text-slate-900/40 focus:outline-none focus:bg-slate-50 shadow-sm"
                />
              </div>
            </div>

            {/* Quick selector buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase text-slate-900/50 mr-1">Quick Select:</span>
              {['Hostel Block A', 'Hostel Block B', 'Girls Hostel 1', 'Central Mess Hall', 'Central Library'].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocationPreset(loc)}
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 border transition-all cursor-pointer ${
                    locationPreset === loc
                      ? 'bg-slate-900 text-white border-slate-300'
                      : 'bg-slate-100 text-slate-900 border-slate-900/30 hover:bg-slate-200'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Field 4: Optional Photo Upload (Max 5MB, JPG/PNG only) */}
          <div id="field-photo" className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                4. Photographic Evidence <span className="text-[10px] font-normal text-slate-900/60">(Optional · Max 5MB, JPG/PNG)</span>
              </label>
              {photoDataUrl && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="text-xs font-mono font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  [Remove Attachment]
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              id="photo-file-input"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            {!photoDataUrl ? (
              <div
                id="photo-dropzone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed border-slate-300 p-6 text-center cursor-pointer transition-all ${
                  isDragging ? 'bg-slate-200' : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-4 h-4" />
                </div>
                <p className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                  Select or Drop Photo Attachment
                </p>
                <p className="text-[10px] font-mono text-slate-900/60 mt-0.5">
                  JPG or PNG format · Maximum size 5MB · EXIF headers stripped
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg bg-slate-100 p-3 flex items-center gap-4 shadow-sm">
                <img
                  src={photoDataUrl}
                  alt="Upload preview"
                  className="w-14 h-14 object-cover border border-slate-300 shrink-0 bg-white"
                />
                <div className="flex-1 min-w-0 font-mono text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 truncate">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-900" />
                    <span className="truncate">{photoName || 'attachment.jpg'}</span>
                  </div>
                  <p className="text-[10px] text-slate-900/60 mt-0.5">
                    {photoSizeMb} · <span className="text-emerald-800 font-bold">READY TO SUBMIT</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="p-1 text-slate-900 hover:text-indigo-600 cursor-pointer"
                  title="Remove attachment"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              id="cancel-btn"
              type="button"
              onClick={onCancelToFeed}
              className="w-full sm:w-auto px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border border-indigo-100/50 rounded-xl bg-white hover:bg-indigo-50 transition-colors cursor-pointer text-center"
            >
              ← Back to Ledger
            </button>

            <button
              id="submit-complaint-btn"
              type="submit"
              disabled={isSubmitting || charCount < 20 || charCount > 1000 || !isLocationValid}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 disabled:bg-slate-300 disabled:text-slate-500 disabled:border-slate-400 disabled:cursor-not-allowed text-white text-xs font-mono font-bold uppercase tracking-widest border border-indigo-100/50 rounded-xl transition-all shadow-md shadow-indigo-200 hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border border-white/30/40 border-t-white rounded-full animate-spin" />
                  <span>Deposing to Ledger...</span>
                </>
              ) : (
                <>
                  <span>Depose Grievance Anonymously</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
