import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { useUser } from '../../context/UserContext';
import { PitchStatus } from '../../types';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Loader2, 
  Upload, 
  MapPin, 
  DollarSign, 
  Users, 
  Info, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Lightbulb, 
  Check, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  FileText, 
  Phone, 
  Mail, 
  Compass, 
  Eye, 
  Layers, 
  CheckCircle2, 
  Zap, 
  Car, 
  Coffee, 
  Wifi, 
  HelpCircle,
  CreditCard,
  Building2,
  Camera,
  Star,
  RefreshCw,
  Smartphone,
  ImageOff
} from 'lucide-react';
import { pitchService } from '../../services/pitchService';
import { storageService } from '../../services/storageService';
import { collection, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LocationPicker } from '../../components/LocationPicker';
import { Toggle } from '../../components/ui/Toggle';

// Preset High Quality Turf Gallery Images for instant selection & testing

const AVAILABLE_AMENITIES = [
  { id: 'Floodlights', label: 'Floodlights (Night Games)', icon: Lightbulb },
  { id: 'Security', label: '24/7 Security & CCTV', icon: ShieldCheck },
  { id: 'Parking', label: 'Dedicated Free Parking', icon: Car },
  { id: 'Changing Rooms', label: 'Changing Rooms & Lockers', icon: Users },
  { id: 'Showers', label: 'Hot / Cold Showers', icon: Zap },
  { id: 'Cafe/Refreshments', label: 'Cafe & Refreshment Bar', icon: Coffee },
  { id: 'WiFi', label: 'High-Speed Free WiFi', icon: Wifi },
  { id: 'Spectator Seating', label: 'Spectator Seating / Dugouts', icon: Building2 },
  { id: 'Bibs & Balls', label: 'Match Bibs & Balls Included', icon: CheckCircle2 },
  { id: 'First Aid', label: 'First Aid Station', icon: Plus },
  { id: 'Restrooms', label: 'Clean Restrooms / Toilets', icon: CheckCircle2 },
  { id: 'Sound System', label: 'PA System / Commentary Mic', icon: Sparkles },
];

const SURFACE_OPTIONS = [
  { id: 'FIFA Quality 3G AstroTurf', label: 'FIFA Quality 3G AstroTurf', desc: 'Premium synthetic turf with shock pad' },
  { id: '4G Artificial Grass', label: '4G Artificial Grass', desc: 'Non-infill modern long-pile artificial turf' },
  { id: 'Natural Grass Pitch', label: 'Natural Grass', desc: 'Well-manicured natural lawn football field' },
  { id: 'Indoor Futsal Court', label: 'Indoor Futsal (Rubber / Hardwood)', desc: 'Fast-paced indoor court surface' },
  { id: 'Hybrid Turf', label: 'Hybrid Turf', desc: 'Natural grass reinforced with synthetic fibers' }
];

const FORMAT_OPTIONS = ['5-a-side', '7-a-side', '8-a-side', '9-a-side', '11-a-side'];

// Critical fields that trigger admin re-verification when modified on an approved pitch
// Note: depositPercentage and allowUnpaidReservations are non-critical policy settings and do NOT trigger re-approval
export const CRITICAL_FIELDS = [
  'name',
  'location',
  'pricePerHour',
  'latitude',
  'longitude',
  'formattedAddress',
  'coverImage'
] as const;

export const AddPitch: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadingPitch, setLoadingPitch] = useState(false);
  const [originalPitch, setOriginalPitch] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'location' | 'specs' | 'pricing' | 'amenities' | 'rules' | 'media' | 'preview'>('info');

  const [formData, setFormData] = useState({
    // Basic Info & Contact
    name: '',
    location: 'Kampala, Uganda',
    contactPhone: '',
    contactEmail: '',
    description: '',
    landmark: '',

    // Geolocation & Address
    latitude: 0.3476 as number | null,
    longitude: 32.5825 as number | null,
    formattedAddress: 'Kampala, Uganda',

    // Specs & Formats
    surfaceType: 'FIFA Quality 3G AstroTurf',
    pitchFormats: ['5-a-side', '7-a-side'] as string[],
    dimensions: '40m x 25m',
    numberOfPitches: 1,
    openingHour: '06:00',
    closingHour: '23:00',

    // Pricing & Payments
    pricePerHour: '70000',
    peakPricePerHour: '90000',
    depositPercentage: 50,
    allowUnpaidReservations: true,
    acceptedPaymentMethods: ['MTN', 'AIRTEL', 'CASH'],
    paymentPhone: '',
    paymentAccountName: '',

    // Amenities
    amenities: ['Floodlights', 'Security', 'Parking', 'Changing Rooms', 'Restrooms', 'Bibs & Balls'] as string[],

    // Rules & Policies
    footwearPolicy: 'Turf trainers (TF) or Multi-ground boots (AG/MG). Metal studs strictly prohibited.',
    cancellationPolicy: 'Free cancellation or reschedule up to 4 hours before match kickoff.',
    rules: [
      'Arrive 10 minutes before your reserved kickoff time',
      'No smoking or alcohol on the artificial playing surface',
      'Respect the facility caretaker and other scheduled players'
    ] as string[],

    // Photos
    coverImage: '',
    additionalImages: [] as string[],
  });

  const [newRuleInput, setNewRuleInput] = useState('');
  const [newImageInput, setNewImageInput] = useState('');

  // Image Upload Queue State
  interface UploadingItem {
    id: string;
    file: File;
    previewUrl: string;
    progress: number;
    status: 'queued' | 'uploading' | 'error';
    error?: string;
    target: 'cover' | 'gallery';
  }

  const [uploadQueue, setUploadQueue] = useState<UploadingItem[]>([]);
  const isAnyPhotoUploading = uploadQueue.some(item => item.status === 'uploading' || item.status === 'queued');
  const coverUploadItem = uploadQueue.find(item => item.target === 'cover');
  const galleryUploadItems = uploadQueue.filter(item => item.target === 'gallery');

  const [failedCoverUrl, setFailedCoverUrl] = useState<string>('');
  const isCoverFailed = Boolean(formData.coverImage && formData.coverImage === failedCoverUrl);
  const [failedGalleryUrls, setFailedGalleryUrls] = useState<Set<string>>(new Set());
  const [hasLegacyPhotosNotice, setHasLegacyPhotosNotice] = useState(false);
  const abortControllersRef = React.useRef<Map<string, AbortController>>(new Map());
  const startedUploadsRef = React.useRef<Set<string>>(new Set());

  const [showCoverUrlInput, setShowCoverUrlInput] = useState(false);
  const [showGalleryUrlInput, setShowGalleryUrlInput] = useState(false);
  const [isCoverDragging, setIsCoverDragging] = useState(false);
  const [isGalleryDragging, setIsGalleryDragging] = useState(false);

  // Load existing pitch if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const loadPitch = async () => {
        setLoadingPitch(true);
        try {
          const pitch = await pitchService.getById(id);
          if (pitch) {
            setOriginalPitch(pitch);

            const rawCover = pitch.images?.[0] || '';
            const rawAdditional = pitch.images?.slice(1) || [];

            const hasCoverData = typeof rawCover === 'string' && rawCover.startsWith('data:');
            const hasAdditionalData = rawAdditional.some((img: string) => typeof img === 'string' && img.startsWith('data:'));
            if (hasCoverData || hasAdditionalData) {
              setHasLegacyPhotosNotice(true);
            }

            setFormData({
              name: pitch.name || '',
              location: pitch.location || '',
              contactPhone: pitch.contactPhone || '',
              contactEmail: pitch.contactEmail || '',
              description: pitch.description || '',
              landmark: pitch.landmark || '',
              latitude: pitch.latitude ?? null,
              longitude: pitch.longitude ?? null,
              formattedAddress: pitch.formattedAddress || pitch.location || '',
              surfaceType: pitch.surfaceType || 'FIFA Quality 3G AstroTurf',
              pitchFormats: pitch.pitchFormats && pitch.pitchFormats.length > 0 ? pitch.pitchFormats : ['5-a-side'],
              dimensions: pitch.dimensions || '40m x 25m',
              numberOfPitches: pitch.numberOfPitches || 1,
              openingHour: pitch.openingHour || '06:00',
              closingHour: pitch.closingHour || '23:00',
              pricePerHour: String(pitch.pricePerHour || '70000'),
              peakPricePerHour: pitch.peakPricePerHour ? String(pitch.peakPricePerHour) : '',
              depositPercentage: (pitch.depositPercentage && pitch.depositPercentage >= 10) ? pitch.depositPercentage : 50,
              allowUnpaidReservations: pitch.allowUnpaidReservations !== false,
              acceptedPaymentMethods: pitch.acceptedPaymentMethods || ['MTN', 'AIRTEL', 'CASH'],
              paymentPhone: pitch.paymentPhone || '',
              paymentAccountName: pitch.paymentAccountName || '',
              amenities: pitch.amenities || [],
              footwearPolicy: pitch.footwearPolicy || 'Turf trainers (TF) or Multi-ground boots (AG/MG). Metal studs strictly prohibited.',
              cancellationPolicy: pitch.cancellationPolicy || 'Free cancellation or reschedule up to 4 hours before match kickoff.',
              rules: pitch.rules || [
                'Arrive 10 minutes before your reserved kickoff time',
                'No smoking or alcohol on the artificial playing surface'
              ],
              coverImage: rawCover,
              additionalImages: rawAdditional
            });
          } else {
            setError('Pitch not found.');
          }
        } catch (err: any) {
          console.error("Error loading pitch:", err);
          setError('Failed to load pitch details.');
        } finally {
          setLoadingPitch(false);
        }
      };
      loadPitch();
    }
  }, [id, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormatToggle = (format: string) => {
    setFormData(prev => {
      const exists = prev.pitchFormats.includes(format);
      let updated: string[];
      if (exists) {
        if (prev.pitchFormats.length === 1) return prev; // Keep at least one
        updated = prev.pitchFormats.filter(f => f !== format);
      } else {
        updated = [...prev.pitchFormats, format];
      }
      return { ...prev, pitchFormats: updated };
    });
  };

  const handleAmenityToggle = (amenityId: string) => {
    setFormData(prev => {
      const amenities = prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId];
      return { ...prev, amenities };
    });
  };

  const handlePaymentMethodToggle = (method: string) => {
    setFormData(prev => {
      const methods = prev.acceptedPaymentMethods.includes(method)
        ? prev.acceptedPaymentMethods.filter(m => m !== method)
        : [...prev.acceptedPaymentMethods, method];
      return { ...prev, acceptedPaymentMethods: methods };
    });
  };

  const handleAddRule = () => {
    if (!newRuleInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, newRuleInput.trim()]
    }));
    setNewRuleInput('');
  };

  const handleRemoveRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const handleAddGalleryImage = (url: string) => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    if (cleanUrl.startsWith('data:')) {
      setError('Gallery photos cannot be image data. Please provide a secure link starting with https://.');
      return;
    }
    if (!cleanUrl.startsWith('https://')) {
      setError('Gallery photo links must start with https://.');
      return;
    }
    if (formData.additionalImages.includes(cleanUrl) || formData.coverImage === cleanUrl) return;
    setFormData(prev => ({
      ...prev,
      additionalImages: [...prev.additionalImages, cleanUrl]
    }));
    setNewImageInput('');
    setError('');
  };

  const handleRemoveGalleryImage = (index: number) => {
    const removedUrl = formData.additionalImages[index];
    if (removedUrl) {
      setFailedGalleryUrls(prev => {
        const next = new Set(prev);
        next.delete(removedUrl);
        return next;
      });
    }
    setFormData(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, i) => i !== index)
    }));
  };

  const handleSetAsCover = (index: number) => {
    const selectedImg = formData.additionalImages[index];
    const oldCover = formData.coverImage;
    if (!selectedImg) return;
    setFailedCoverUrl('');
    setFormData(prev => ({
      ...prev,
      coverImage: selectedImg,
      additionalImages: oldCover
        ? [oldCover, ...prev.additionalImages.filter((_, i) => i !== index)]
        : prev.additionalImages.filter((_, i) => i !== index)
    }));
  };

  // Upload at most 2 gallery photos at a time
  useEffect(() => {
    if (!user?.uid) return;
    const activeGalleryCount = uploadQueue.filter(
      it => it.target === 'gallery' && it.status === 'uploading'
    ).length;

    if (activeGalleryCount < 2) {
      const nextQueuedItem = uploadQueue.find(
        it => it.target === 'gallery' && it.status === 'queued' && !startedUploadsRef.current.has(it.id)
      );
      if (nextQueuedItem) {
        startedUploadsRef.current.add(nextQueuedItem.id);
        uploadFileItem(nextQueuedItem);
      }
    }
  }, [uploadQueue, user?.uid]);

  const uploadFileItem = async (item: UploadingItem) => {
    if (!user?.uid) {
      setError('You must be logged in as an owner to upload photos.');
      setUploadQueue(prev => prev.map(it => it.id === item.id ? { ...it, status: 'error', error: 'Authentication required' } : it));
      return;
    }

    const controller = new AbortController();
    abortControllersRef.current.set(item.id, controller);
    startedUploadsRef.current.add(item.id);

    setUploadQueue(prev => prev.map(it => it.id === item.id ? { ...it, status: 'uploading', progress: 0, error: undefined } : it));

    try {
      const downloadUrl = await storageService.uploadPitchPhoto(
        user.uid,
        item.file,
        (percent) => {
          setUploadQueue(prev => prev.map(it => it.id === item.id ? { ...it, progress: percent } : it));
        },
        controller.signal
      );

      // Discard result if user removed/cancelled the item while uploading
      if (!abortControllersRef.current.has(item.id)) {
        try { URL.revokeObjectURL(item.previewUrl); } catch {}
        return;
      }

      if (!downloadUrl.startsWith('https://')) {
        throw new Error('Upload did not return a valid secure URL.');
      }

      if (item.target === 'cover') {
        setFormData(prev => ({ ...prev, coverImage: downloadUrl }));
        setFailedCoverUrl('');
      } else {
        setFormData(prev => ({
          ...prev,
          additionalImages: [...prev.additionalImages, downloadUrl]
        }));
      }

      setUploadQueue(prev => prev.filter(it => it.id !== item.id));
      try { URL.revokeObjectURL(item.previewUrl); } catch {}
    } catch (err: any) {
      // If upload was aborted by user removal, don't keep an error item
      if (controller.signal.aborted) {
        return;
      }
      console.error('Photo upload error:', err);
      setUploadQueue(prev => prev.map(it => it.id === item.id ? { ...it, status: 'error', error: err.message || 'Upload failed' } : it));
    } finally {
      abortControllersRef.current.delete(item.id);
      startedUploadsRef.current.delete(item.id);
    }
  };

  const handleCoverFileUpload = (file: File) => {
    if (!file) return;
    const id = 'cover-' + Date.now();
    const previewUrl = URL.createObjectURL(file);
    const newItem: UploadingItem = {
      id,
      file,
      previewUrl,
      progress: 0,
      status: 'uploading',
      target: 'cover'
    };
    setFailedCoverUrl('');
    setUploadQueue(prev => [...prev.filter(it => it.target !== 'cover'), newItem]);
    uploadFileItem(newItem);
  };

  const handleGalleryFilesUpload = (files: File[]) => {
    if (!files || files.length === 0) return;
    const newItems: UploadingItem[] = files.map((file, i) => ({
      id: `gallery-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: 'queued',
      target: 'gallery'
    }));

    setUploadQueue(prev => [...prev, ...newItems]);
  };

  const retryUpload = (id: string) => {
    startedUploadsRef.current.delete(id);
    const item = uploadQueue.find(it => it.id === id);
    if (!item) return;
    if (item.target === 'cover') {
      uploadFileItem(item);
    } else {
      setUploadQueue(prev =>
        prev.map(it => it.id === id ? { ...it, status: 'queued', progress: 0, error: undefined } : it)
      );
    }
  };

  const removeUploadQueueItem = (id: string) => {
    startedUploadsRef.current.delete(id);
    const controller = abortControllersRef.current.get(id);
    if (controller) {
      try {
        controller.abort();
      } catch {}
      abortControllersRef.current.delete(id);
    }
    setUploadQueue(prev => {
      const item = prev.find(it => it.id === id);
      if (item?.previewUrl) {
        try { URL.revokeObjectURL(item.previewUrl); } catch {}
      }
      return prev.filter(it => it.id !== id);
    });
  };

  const isCriticalFieldChanged = (original: any, current: typeof formData): boolean => {
    if (original.name !== current.name) return true;
    if (original.location !== current.location) return true;
    if (Number(original.pricePerHour) !== Number(current.pricePerHour)) return true;
    if (original.latitude !== current.latitude) return true;
    if (original.longitude !== current.longitude) return true;
    if (original.formattedAddress !== current.formattedAddress) return true;
    const originalImage = original.images?.[0] || '';
    if (originalImage !== current.coverImage) return true;
    return false;
  };

  const validateForm = () => {
    if (isCoverFailed) {
      return 'The cover photo could not load. Please choose or upload a valid photo before submitting.';
    }
    if (!formData.name.trim()) {
      return 'Facility Name is required.';
    }
    if (!formData.contactPhone.trim()) {
      return 'Direct Contact Phone number is required.';
    }
    if (formData.latitude === null || formData.longitude === null) {
      return 'Please pin your pitch location on the map.';
    }
    if (!formData.pricePerHour || Number(formData.pricePerHour) <= 0) {
      return 'Please enter a valid standard hourly booking rate.';
    }
    const depositPct = Number(formData.depositPercentage);
    if (isNaN(depositPct) || depositPct < 10 || depositPct > 100) {
      return 'Advance deposit requirement must be between 10% and 100%.';
    }
    if (!formData.pitchFormats.length) {
      return 'Please select at least one match format (e.g. 5-a-side, 7-a-side).';
    }
    if (!formData.coverImage.trim()) {
      return 'Please upload a cover photo of your pitch.';
    }
    if (formData.coverImage.startsWith('data:')) {
      return 'Cover photo cannot be image data. Please upload a photo or provide a secure link (https://).';
    }
    if (!formData.coverImage.startsWith('https://')) {
      return 'Cover photo must be a valid secure image URL starting with https://.';
    }
    for (let i = 0; i < formData.additionalImages.length; i++) {
      const img = formData.additionalImages[i];
      if (img.startsWith('data:')) {
        return `Gallery photo #${i + 1} cannot be image data. Please upload photos or use secure links (https://).`;
      }
      if (!img.startsWith('https://')) {
        return `Gallery photo #${i + 1} must be a valid secure image URL starting with https://.`;
      }
    }
    if (!formData.paymentPhone.trim()) {
      return 'Mobile Money Payment Phone is required for players to pay deposits.';
    }
    if (!formData.paymentAccountName.trim()) {
      return 'Payment Registered Account Name is required for payment verification.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in as an owner to submit a pitch.');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Combine cover and additional images into unified images array, excluding any legacy data: URLs
    const cleanCover = (formData.coverImage && !formData.coverImage.startsWith('data:')) ? formData.coverImage : '';
    const cleanAdditional = formData.additionalImages.filter(img => typeof img === 'string' && !img.startsWith('data:'));
    const allImages = [cleanCover, ...cleanAdditional].filter(Boolean);

    try {
      if (isEditMode && id && originalPitch) {
        const isApproved = originalPitch.status === 'ACTIVE' || originalPitch.status === 'approved';
        const hasCriticalChange = isCriticalFieldChanged(originalPitch, formData);

        let newStatus = originalPitch.status;
        let triggeredReReview = false;

        if (isApproved) {
          if (hasCriticalChange) {
            newStatus = PitchStatus.PENDING_APPROVAL;
            triggeredReReview = true;
          }
        } else {
          newStatus = PitchStatus.PENDING_APPROVAL;
          triggeredReReview = true;
        }

        const updatedData = {
          name: formData.name.trim(),
          location: formData.location.trim(),
          contactPhone: formData.contactPhone.trim(),
          contactEmail: formData.contactEmail.trim() || '',
          description: formData.description.trim(),
          landmark: formData.landmark.trim() || '',
          pricePerHour: Number(formData.pricePerHour),
          ...(formData.peakPricePerHour ? { peakPricePerHour: Number(formData.peakPricePerHour) } : {}),
          depositPercentage: Number(formData.depositPercentage),
          allowUnpaidReservations: Boolean(formData.allowUnpaidReservations),
          acceptedPaymentMethods: formData.acceptedPaymentMethods,
          paymentPhone: formData.paymentPhone.trim() || '',
          paymentAccountName: formData.paymentAccountName.trim() || '',
          images: allImages,
          amenities: formData.amenities,
          surfaceType: formData.surfaceType,
          pitchFormats: formData.pitchFormats,
          dimensions: formData.dimensions,
          numberOfPitches: Number(formData.numberOfPitches),
          openingHour: formData.openingHour,
          closingHour: formData.closingHour,
          footwearPolicy: formData.footwearPolicy,
          cancellationPolicy: formData.cancellationPolicy,
          rules: formData.rules,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          formattedAddress: formData.formattedAddress || formData.location,
        };

        await pitchService.update(id, updatedData);

        navigate('/owner/pitches', {
          state: {
            showReReviewBanner: triggeredReReview,
            showUpdateSuccess: !triggeredReReview
          }
        });
      } else {
        // Create Mode
        const newId = doc(collection(db, 'pitches')).id;
        await pitchService.create({
          id: newId,
          ownerId: user.uid,
          name: formData.name.trim(),
          location: formData.location.trim(),
          contactPhone: formData.contactPhone.trim(),
          contactEmail: formData.contactEmail.trim() || '',
          description: formData.description.trim(),
          landmark: formData.landmark.trim() || '',
          pricePerHour: Number(formData.pricePerHour),
          ...(formData.peakPricePerHour ? { peakPricePerHour: Number(formData.peakPricePerHour) } : {}),
          depositPercentage: Number(formData.depositPercentage),
          allowUnpaidReservations: Boolean(formData.allowUnpaidReservations),
          acceptedPaymentMethods: formData.acceptedPaymentMethods,
          paymentPhone: formData.paymentPhone.trim() || '',
          paymentAccountName: formData.paymentAccountName.trim() || '',
          images: allImages,
          amenities: formData.amenities,
          surfaceType: formData.surfaceType,
          pitchFormats: formData.pitchFormats,
          dimensions: formData.dimensions,
          numberOfPitches: Number(formData.numberOfPitches),
          openingHour: formData.openingHour,
          closingHour: formData.closingHour,
          footwearPolicy: formData.footwearPolicy,
          cancellationPolicy: formData.cancellationPolicy,
          rules: formData.rules,
          status: PitchStatus.PENDING_APPROVAL,
          rating: 0,
          reviewCount: 0,
          isVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          formattedAddress: formData.formattedAddress || formData.location,
        } as any);

        navigate('/owner/pitches', {
          state: { showUpdateSuccess: true }
        });
      }
    } catch (err: any) {
      console.error("Error saving pitch:", err);
      setError(err.message || 'Failed to save pitch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingPitch) {
    return (
      <Layout>
        <div className="bg-background min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-primary-lime" size={40} />
        </div>
      </Layout>
    );
  }

  const hoursList = [
    '05:00', '06:00', '07:00', '08:00', '09:00', '10:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00'
  ];

  return (
    <Layout>
      <div className="bg-app-base min-h-screen font-sans pb-32 text-text-primary">
        <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
          {/* Header Navigation */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => navigate('/owner/pitches')}
              className="inline-flex items-center text-xs font-bold text-text-secondary hover:text-text-primary transition-colors mb-3 cursor-pointer"
            >
              <ArrowLeft size={14} className="mr-1.5" /> Back to My Pitches
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                  {isEditMode ? 'Edit Pitch Facility' : 'List a New Turf Pitch'}
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-2xl">
                  {isEditMode
                    ? 'Update your facility specifications, hourly rates, and playing schedules. Critical edits will undergo quick admin verification.'
                    : 'Provide complete details about your football turf facility to get certified and start receiving online match bookings.'}
                </p>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 flex items-center gap-2 bg-surface-raised px-3 py-1.5 rounded-xl border border-border-subtle">
                <span className="w-2 h-2 rounded-full bg-primary-lime animate-pulse" />
                <span className="text-xs font-extrabold text-text-primary">
                  {isEditMode ? 'Editing Mode' : 'New Pitch Listing'}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-error p-4 rounded-2xl mb-6 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step Progress / Section Quick Links */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-6 border-b border-border-subtle">
            {[
              { id: 'info', label: '1. Facility & Contact', icon: Info },
              { id: 'location', label: '2. Location & Map', icon: MapPin },
              { id: 'specs', label: '3. Specs & Hours', icon: Layers },
              { id: 'pricing', label: '4. Pricing & MoMo', icon: DollarSign },
              { id: 'amenities', label: '5. Amenities', icon: Sparkles },
              { id: 'rules', label: '6. Pitch Rules', icon: FileText },
              { id: 'media', label: '7. Photo Gallery', icon: ImageIcon },
              { id: 'preview', label: '8. Player Preview', icon: Eye }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary-lime text-accent-text shadow-sm shadow-primary-lime/20'
                      : 'bg-surface-raised text-text-secondary hover:text-text-primary border border-border-subtle/50'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1: BASIC INFO & CONTACT */}
            {(activeTab === 'info' || activeTab === 'preview') && (
              <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-primary-lime/10 text-primary-lime rounded-xl border border-primary-lime/30">
                      <Building2 size={18} />
                    </span>
                    <div>
                      <h2 className="text-base font-extrabold text-text-primary">Facility Information & Contact</h2>
                      <p className="text-xs text-text-secondary">Core identity and direct booking contact details</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="pitch-name" className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                      Facility / Pitch Name <span className="text-primary-lime">*</span>
                    </label>
                    <input
                      id="pitch-name"
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Bukoto Astro Arena, Kampala"
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all placeholder:text-text-tertiary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pitch-contactPhone" className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                        <Phone size={12} className="text-primary-lime" />
                        <span>Direct Contact Phone</span> <span className="text-primary-lime">*</span>
                      </label>
                      <input
                        id="pitch-contactPhone"
                        type="tel"
                        name="contactPhone"
                        required
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                        placeholder="e.g. +256 700 123456"
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all placeholder:text-text-tertiary"
                      />
                      <span className="text-[10px] text-text-tertiary mt-1 block">Players can call this number for game inquiries</span>
                    </div>

                    <div>
                      <label htmlFor="pitch-contactEmail" className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                        <Mail size={12} className="text-[#38BDF8]" />
                        <span>Contact Email (Optional)</span>
                      </label>
                      <input
                        id="pitch-contactEmail"
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                        placeholder="e.g. bookings@bukotoarena.ug"
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all placeholder:text-text-tertiary"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="pitch-description" className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                      Facility Description & Highlights
                    </label>
                    <textarea
                      id="pitch-description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Tell players about the turf quality, night lighting, spectator stands, tournaments hosted, and atmosphere..."
                      rows={3}
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl p-4 text-base min-h-11 font-medium text-text-primary focus:border-primary-lime outline-none transition-all resize-none placeholder:text-text-tertiary"
                    />
                  </div>

                  <div>
                    <label htmlFor="pitch-landmark" className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                      <Compass size={12} className="text-[#FACC15]" />
                      <span>Landmark & Driving Directions</span>
                    </label>
                    <input
                      id="pitch-landmark"
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleInputChange}
                      placeholder="e.g. Opposite Shell Bukoto, 100m past Acacia Avenue junction"
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all placeholder:text-text-tertiary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: LOCATION & MAP PICKER */}
            {(activeTab === 'location' || activeTab === 'preview') && (
              <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-[#38BDF8]/10 text-[#38BDF8] rounded-xl border border-[#38BDF8]/30">
                      <MapPin size={18} />
                    </span>
                    <div>
                      <h2 className="text-base font-extrabold text-text-primary">Geographic Location & Map Pin</h2>
                      <p className="text-xs text-text-secondary">Search or drag the pin to set your exact pitch coordinates</p>
                    </div>
                  </div>
                </div>

                <LocationPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  formattedAddress={formData.formattedAddress}
                  onLocationChange={(lat, lng, address) => {
                    setFormData(prev => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng,
                      formattedAddress: address,
                      location: address || prev.location
                    }));
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-surface-raised p-3 rounded-xl border border-border-subtle flex items-center gap-2.5">
                    <MapPin size={16} className="text-primary-lime shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold text-text-tertiary uppercase block">Latitude / Longitude</span>
                      <span className="text-xs font-bold text-text-primary truncate block">
                        {formData.latitude?.toFixed(5)}, {formData.longitude?.toFixed(5)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface-raised p-3 rounded-xl border border-border-subtle flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold text-text-tertiary uppercase block">Geocoded Address</span>
                      <span className="text-xs font-bold text-text-primary truncate block">
                        {formData.formattedAddress || formData.location}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: PITCH SPECS & OPERATING SCHEDULE */}
            {(activeTab === 'specs' || activeTab === 'preview') && (
              <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-[#FACC15]/10 text-[#FACC15] rounded-xl border border-[#FACC15]/30">
                      <Layers size={18} />
                    </span>
                    <div>
                      <h2 className="text-base font-extrabold text-text-primary">Pitch Specifications & Operating Hours</h2>
                      <p className="text-xs text-text-secondary">Surface materials, supported player formats, and daily booking schedule</p>
                    </div>
                  </div>
                </div>

                {/* Surface Type Selection */}
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">
                    Surface Type Material
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SURFACE_OPTIONS.map((surf) => {
                      const isSelected = formData.surfaceType === surf.id;
                      return (
                        <div
                          key={surf.id}
                          onClick={() => setFormData(prev => ({ ...prev, surfaceType: surf.id }))}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2 ${
                            isSelected
                              ? 'bg-primary-lime/10 border-primary-lime text-text-primary'
                              : 'bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-extrabold block text-text-primary">{surf.label}</span>
                            <span className="text-[11px] text-text-secondary font-medium">{surf.desc}</span>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'bg-primary-lime border-primary-lime text-accent-text' : 'border-border-subtle'
                          }`}>
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Match Formats Multi-select */}
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">
                    Supported Match Formats (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FORMAT_OPTIONS.map(fmt => {
                      const isSelected = formData.pitchFormats.includes(fmt);
                      return (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => handleFormatToggle(fmt)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-primary-lime text-accent-text shadow-sm shadow-primary-lime/20'
                              : 'bg-surface-raised text-text-secondary hover:text-text-primary border border-border-subtle'
                          }`}
                        >
                          <Users size={13} />
                          <span>{fmt}</span>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dimensions & Number of Sub-fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pitch-dimensions" className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                      Pitch Dimensions (Optional)
                    </label>
                    <input
                      id="pitch-dimensions"
                      type="text"
                      name="dimensions"
                      value={formData.dimensions}
                      onChange={handleInputChange}
                      placeholder="e.g. 42m x 25m"
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all placeholder:text-text-tertiary"
                    />
                  </div>

                  <div>
                    <label htmlFor="pitch-numberOfPitches" className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                      Number of Available Pitches
                    </label>
                    <select
                      id="pitch-numberOfPitches"
                      name="numberOfPitches"
                      value={formData.numberOfPitches}
                      onChange={handleInputChange}
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all cursor-pointer"
                    >
                      <option value={1}>1 Single Pitch</option>
                      <option value={2}>2 Pitches (Sub-fields)</option>
                      <option value={3}>3 Pitches</option>
                      <option value={4}>4+ Pitches Complex</option>
                    </select>
                  </div>
                </div>

                {/* Operating Schedule */}
                <div className="space-y-2 pt-2 border-t border-border-subtle">
                  <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block flex items-center gap-1.5">
                    <Clock size={14} className="text-primary-lime" />
                    <span>Daily Operating Hours (Slots will be generated for booking)</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pitch-openingHour" className="text-xs text-text-secondary block mb-1.5 font-bold">Earliest Opening Time</label>
                      <select
                        id="pitch-openingHour"
                        name="openingHour"
                        value={formData.openingHour}
                        onChange={handleInputChange}
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all cursor-pointer"
                      >
                        {hoursList.map(h => (
                          <option key={h} value={h}>{h} ({parseInt(h) < 12 ? 'Morning' : 'Evening'})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="pitch-closingHour" className="text-xs text-text-secondary block mb-1.5 font-bold">Latest Closing Time</label>
                      <select
                        id="pitch-closingHour"
                        name="closingHour"
                        value={formData.closingHour}
                        onChange={handleInputChange}
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all cursor-pointer"
                      >
                        {hoursList.map(h => (
                          <option key={h} value={h}>{h} ({parseInt(h) >= 20 || parseInt(h) < 5 ? 'Night' : 'Late Evening'})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: PRICING & PAYMENT SETTINGS */}
            {(activeTab === 'pricing' || activeTab === 'preview') && (
              <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-[#22C55E]/10 text-[#22C55E] rounded-xl border border-[#22C55E]/30">
                      <DollarSign size={18} />
                    </span>
                    <div>
                      <h2 className="text-base font-extrabold text-text-primary">Pricing & Mobile Money Payout Settings</h2>
                      <p className="text-xs text-text-secondary">Set standard and peak hourly rates and player payment instructions</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pitch-pricePerHour" className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                      Standard Hourly Rate (UGX) <span className="text-primary-lime">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="pitch-pricePerHour"
                        type="number"
                        name="pricePerHour"
                        required
                        min="1000"
                        step="1000"
                        value={formData.pricePerHour}
                        onChange={handleInputChange}
                        placeholder="70000"
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-tertiary">
                        UGX / Hour
                      </span>
                    </div>
                    <span className="text-[10px] text-text-tertiary mt-1 block">Default daytime rate per 1-hour slot</span>
                  </div>

                  <div>
                    <label htmlFor="pitch-peakPricePerHour" className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                      Peak / Floodlight Night Rate (UGX, Optional)
                    </label>
                    <div className="relative">
                      <input
                        id="pitch-peakPricePerHour"
                        type="number"
                        name="peakPricePerHour"
                        min="1000"
                        step="1000"
                        value={formData.peakPricePerHour}
                        onChange={handleInputChange}
                        placeholder="90000"
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-tertiary">
                        UGX / Hour
                      </span>
                    </div>
                    <span className="text-[10px] text-text-tertiary mt-1 block">Rate for high-demand evening / night games</span>
                  </div>
                </div>

                {/* Deposit Requirement (Required Number Input 10-100%) */}
                <div className="space-y-1.5">
                  <label htmlFor="pitch-depositPercentage" className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">
                    Advance Deposit Requirement (%) <span className="text-primary-lime font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="pitch-depositPercentage"
                      name="depositPercentage"
                      type="number"
                      min={10}
                      max={100}
                      step={5}
                      required
                      value={formData.depositPercentage}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setFormData(prev => ({
                          ...prev,
                          depositPercentage: isNaN(val) ? ('' as any) : val
                        }));
                      }}
                      placeholder="50"
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-tertiary">
                      % Deposit
                    </span>
                  </div>
                  <span className="text-[11px] text-text-tertiary mt-1 block">
                    Players pay this share to secure their slot. The rest is paid at the pitch.
                  </span>
                </div>

                {/* Allow Unpaid Reservations Toggle */}
                <div className="bg-surface-raised/60 border border-border-subtle rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <label htmlFor="allowUnpaidReservations" className="text-xs font-extrabold text-text-primary block cursor-pointer">
                      Allow unpaid reservations (pay at the pitch)
                    </label>
                    <p className="text-[11px] text-text-tertiary">
                      When enabled, players can reserve slots with zero deposit. Other players paying a deposit can preempt these holds.
                    </p>
                  </div>
                  <Toggle
                    id="allowUnpaidReservations"
                    checked={formData.allowUnpaidReservations}
                    onChange={(checked) => setFormData(prev => ({ ...prev, allowUnpaidReservations: checked }))}
                  />
                </div>

                {/* Accepted Payment Methods */}
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">
                    Accepted Player Payment Methods
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'MTN', label: 'MTN Mobile Money' },
                      { id: 'AIRTEL', label: 'Airtel Money' },
                      { id: 'CASH', label: 'Cash on Arrival' },
                      { id: 'CARD', label: 'Visa / Mastercard' }
                    ].map(pm => {
                      const isSelected = formData.acceptedPaymentMethods.includes(pm.id);
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => handlePaymentMethodToggle(pm.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#22C55E]'
                              : 'bg-surface-raised text-text-secondary border border-border-subtle'
                          }`}
                        >
                          <CreditCard size={13} />
                          <span>{pm.label}</span>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Merchant Payment Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-subtle">
                  <div>
                    <label htmlFor="pitch-paymentPhone" className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                      Merchant MoMo / Payout Phone <span className="text-primary-lime">*</span>
                    </label>
                    <input
                      id="pitch-paymentPhone"
                      type="text"
                      name="paymentPhone"
                      required
                      value={formData.paymentPhone}
                      onChange={handleInputChange}
                      placeholder="e.g. 0770 000000 or Merchant Code: 123456"
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all placeholder:text-text-tertiary"
                    />
                  </div>
                  <div>
                    <label htmlFor="pitch-paymentAccountName" className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                      Account / Registered Merchant Name <span className="text-primary-lime">*</span>
                    </label>
                    <input
                      id="pitch-paymentAccountName"
                      type="text"
                      name="paymentAccountName"
                      required
                      value={formData.paymentAccountName}
                      onChange={handleInputChange}
                      placeholder="e.g. Bukoto Arena Ltd"
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all placeholder:text-text-tertiary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: AMENITIES & FACILITIES */}
            {(activeTab === 'amenities' || activeTab === 'preview') && (
              <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-primary-lime/10 text-primary-lime rounded-xl border border-primary-lime/30">
                      <Sparkles size={18} />
                    </span>
                    <div>
                      <h2 className="text-base font-extrabold text-text-primary">Amenities & Facility Perks</h2>
                      <p className="text-xs text-text-secondary">Highlight the equipment and conveniences players can enjoy</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {AVAILABLE_AMENITIES.map(item => {
                    const Icon = item.icon;
                    const isSelected = formData.amenities.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAmenityToggle(item.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-primary-lime/15 border-primary-lime/50 text-text-primary'
                            : 'bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={16} className={isSelected ? 'text-primary-lime' : 'text-text-tertiary'} />
                          <span className="text-xs font-bold">{item.label}</span>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-primary-lime border-primary-lime text-accent-text' : 'border-border-subtle'
                        }`}>
                          {isSelected && <Check size={11} strokeWidth={3.5} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 6: PITCH RULES & POLICIES */}
            {(activeTab === 'rules' || activeTab === 'preview') && (
              <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-[#FB923C]/10 text-[#FB923C] rounded-xl border border-[#FB923C]/30">
                      <FileText size={18} />
                    </span>
                    <div>
                      <h2 className="text-base font-extrabold text-text-primary">Pitch Rules & Cancellation Policies</h2>
                      <p className="text-xs text-text-secondary">Set player expectations regarding footwear, arrival, and reschedule cutoffs</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="pitch-footwearPolicy" className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                    Footwear Guideline & Policy
                  </label>
                  <input
                    id="pitch-footwearPolicy"
                    type="text"
                    name="footwearPolicy"
                    value={formData.footwearPolicy}
                    onChange={handleInputChange}
                    placeholder="e.g. Turf trainers (TF) or Multi-ground boots (AG/MG). Metal studs forbidden."
                    className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="pitch-cancellationPolicy" className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                    Cancellation & Reschedule Window
                  </label>
                  <input
                    id="pitch-cancellationPolicy"
                    type="text"
                    name="cancellationPolicy"
                    value={formData.cancellationPolicy}
                    onChange={handleInputChange}
                    placeholder="e.g. Free cancellation or slot reschedule up to 4 hours before kickoff."
                    className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all"
                  />
                </div>

                {/* Custom House Rules List */}
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">
                    Facility House Rules
                  </label>
                  <div className="space-y-2">
                    {formData.rules.map((r, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 bg-surface-raised p-3 rounded-xl border border-border-subtle">
                        <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
                          <CheckCircle2 size={14} className="text-primary-lime shrink-0" />
                          <span>{r}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRule(i)}
                          className="text-text-tertiary hover:text-error transition-colors p-1 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}

                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={newRuleInput}
                        onChange={(e) => setNewRuleInput(e.target.value)}
                        placeholder="Add a house rule (e.g. No metal studs, Please return balls)"
                        className="flex-1 bg-surface-raised border border-border-subtle rounded-xl px-4 py-2.5 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddRule();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddRule}
                        className="px-3.5 py-2.5 bg-surface-raised hover:bg-border-subtle text-text-primary border border-border-subtle rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Plus size={14} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 7: PHOTO GALLERY & MEDIA */}
            {(activeTab === 'media' || activeTab === 'preview') && (
              <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-2xl shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-[#A78BFA]/10 text-[#A78BFA] rounded-xl border border-[#A78BFA]/30">
                      <ImageIcon size={18} />
                    </span>
                    <div>
                      <h2 className="text-base font-extrabold text-text-primary">Photo Gallery & Facility Showcase</h2>
                      <p className="text-xs text-text-secondary">High quality pitch photos attract more match bookings</p>
                    </div>
                  </div>
                </div>

                {/* Legacy Photos Notice in Edit Mode */}
                {hasLegacyPhotosNotice && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2.5">
                    <AlertCircle size={16} className="shrink-0 text-amber-400" />
                    <span>Some photos were saved in an old format. Please upload them again.</span>
                  </div>
                )}

                {/* 1. PRIMARY COVER PHOTO */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">
                        Primary Cover Photo <span className="text-primary-lime">*</span>
                      </label>
                      <span className="text-[10px] text-text-tertiary">The main photo displayed in player search and card banners</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCoverUrlInput(!showCoverUrlInput)}
                      className="text-[11px] text-primary-lime font-bold hover:underline cursor-pointer"
                    >
                      {showCoverUrlInput ? 'Hide URL input' : 'Paste photo URL instead'}
                    </button>
                  </div>

                  {/* Manual URL input toggle */}
                  {showCoverUrlInput && (
                    <div className="space-y-1">
                      <input
                        type="url"
                        name="coverImage"
                        value={formData.coverImage}
                        onChange={(e) => {
                          handleInputChange(e);
                          setFailedCoverUrl('');
                          if (e.target.value.startsWith('data:')) {
                            setError('Cover photo cannot be image data. Please provide a secure link (https://).');
                          } else if (e.target.value && !e.target.value.startsWith('https://')) {
                            setError('Cover image link must start with https://.');
                          } else {
                            setError('');
                          }
                        }}
                        placeholder="Paste an image link (https://...)"
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all placeholder:text-text-tertiary"
                      />
                    </div>
                  )}

                  {/* Cover Photo Dropzone / Upload Area */}
                  {coverUploadItem ? (
                    <div className="relative rounded-2xl overflow-hidden border border-border-subtle bg-surface-raised min-h-[220px] sm:min-h-[260px] flex flex-col items-center justify-center p-4">
                      <img
                        src={coverUploadItem.previewUrl}
                        alt="Cover preview"
                        className="absolute inset-0 w-full h-full object-cover opacity-30 blur-xs"
                      />
                      <div className="relative z-10 flex flex-col items-center gap-3 bg-black/85 backdrop-blur-md p-5 rounded-2xl border border-white/10 max-w-xs w-full text-center shadow-xl">
                        {coverUploadItem.status === 'uploading' ? (
                          <>
                            <Loader2 size={24} className="animate-spin text-primary-lime" />
                            <div className="space-y-1.5 w-full">
                              <div className="flex justify-between text-xs font-bold text-white">
                                <span>Uploading cover photo...</span>
                                <span className="font-mono text-primary-lime">{coverUploadItem.progress}%</span>
                              </div>
                              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-primary-lime h-full transition-all duration-200"
                                  style={{ width: `${coverUploadItem.progress}%` }}
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeUploadQueueItem(coverUploadItem.id)}
                              className="text-xs text-text-tertiary hover:text-error underline mt-1 cursor-pointer"
                            >
                              Cancel upload
                            </button>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={26} className="text-error" />
                            <span className="text-xs font-bold text-white">Cover photo upload failed</span>
                            <p className="text-[11px] text-text-secondary">{coverUploadItem.error || 'Connection timed out or failed.'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => retryUpload(coverUploadItem.id)}
                                className="px-3 py-1.5 bg-primary-lime hover:bg-[#96E600] text-accent-text rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                              >
                                <RefreshCw size={12} />
                                <span>Retry</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => removeUploadQueueItem(coverUploadItem.id)}
                                className="px-3 py-1.5 bg-surface-raised border border-border-subtle text-text-secondary hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                              >
                                <Trash2 size={12} />
                                <span>Remove</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsCoverDragging(true);
                      }}
                      onDragLeave={() => setIsCoverDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsCoverDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleCoverFileUpload(file);
                      }}
                      className={`relative rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
                        isCoverDragging
                          ? 'border-primary-lime bg-primary-lime/10'
                          : 'border-border-subtle bg-surface-raised hover:border-primary-lime/50'
                      }`}
                    >
                      {formData.coverImage ? (
                        <div className="relative group min-h-[220px] sm:min-h-[260px]">
                          {isCoverFailed ? (
                            <div className="w-full h-56 sm:h-64 bg-surface-raised border border-border-subtle rounded-xl flex flex-col items-center justify-center text-text-muted gap-2 p-4 text-center">
                              <ImageOff size={32} className="text-text-muted" />
                              <span className="text-xs font-bold text-text-secondary">Photo could not load</span>
                              <p className="text-[11px] text-text-muted">Please replace this photo or upload a new one.</p>
                              <button
                                type="button"
                                onClick={() => setFailedCoverUrl('')}
                                className="mt-1 px-3 py-1.5 bg-surface-card hover:bg-surface-raised border border-border-subtle hover:border-primary-lime text-text-primary rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <RefreshCw size={12} className="text-primary-lime" />
                                <span>Reload photo</span>
                              </button>
                            </div>
                          ) : (
                            <img
                              src={formData.coverImage}
                              alt="Cover preview"
                              className="w-full h-56 sm:h-64 object-cover"
                              onLoad={() => {
                                if (failedCoverUrl === formData.coverImage) {
                                  setFailedCoverUrl('');
                                }
                              }}
                              onError={() => {
                                setFailedCoverUrl(formData.coverImage);
                              }}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-4">
                            <div className="flex items-center justify-between">
                              <span className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-[11px] font-extrabold text-white flex items-center gap-1.5 border border-white/20">
                                <Sparkles size={12} className="text-primary-lime" />
                                <span>Primary Cover</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                              <label
                                htmlFor="cover-photo-upload"
                                className="px-3.5 py-2 bg-primary-lime hover:bg-primary-lime/90 text-black rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 shadow transition-all"
                              >
                                <Camera size={14} />
                                <span>Replace from Gallery</span>
                              </label>
                              <input
                                id="cover-photo-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleCoverFileUpload(file);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, coverImage: '' }));
                                  setFailedCoverUrl('');
                                }}
                                className="p-2 bg-black/70 hover:bg-error text-white rounded-xl transition-colors cursor-pointer"
                                title="Remove cover"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-primary-lime/10 border border-primary-lime/30 text-primary-lime flex items-center justify-center">
                            <Camera size={26} />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-extrabold text-text-primary">Add Your Pitch Cover Photo</h3>
                            <p className="text-xs text-text-secondary max-w-sm mx-auto">
                              Upload a photo from your gallery or drag and drop here.
                            </p>
                          </div>
                          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                            <label
                              htmlFor="cover-photo-upload-empty"
                              className="px-4 py-2.5 bg-primary-lime hover:bg-primary-lime/90 text-black rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-2 shadow transition-all"
                            >
                              <Smartphone size={15} />
                              <span>Select Photo from Gallery</span>
                            </label>
                            <input
                              id="cover-photo-upload-empty"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleCoverFileUpload(file);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. ADDITIONAL GALLERY PHOTOS */}
                <div className="space-y-3 pt-4 border-t border-border-subtle">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">
                        Additional Gallery Photos ({formData.additionalImages.length})
                      </label>
                      <span className="text-[10px] text-text-tertiary">Select photos from your device gallery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="gallery-photos-upload"
                        className="px-3.5 py-2 bg-surface-raised hover:bg-border-subtle border border-primary-lime/40 text-text-primary rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 transition-all"
                      >
                        <Camera size={14} className="text-primary-lime" />
                        <span>Add from Gallery</span>
                      </label>
                      <input
                        id="gallery-photos-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) handleGalleryFilesUpload(files);
                        }}
                      />
                    </div>
                  </div>

                  {/* Multi-Dropzone for Gallery */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsGalleryDragging(true);
                    }}
                    onDragLeave={() => setIsGalleryDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsGalleryDragging(false);
                      const files = Array.from(e.dataTransfer.files || []);
                      if (files.length > 0) handleGalleryFilesUpload(files);
                    }}
                    className={`p-4 rounded-xl border-2 border-dashed text-center transition-all ${
                      isGalleryDragging
                        ? 'border-primary-lime bg-primary-lime/10'
                        : 'border-border-subtle bg-surface-raised/40 hover:border-border-strong'
                    }`}
                  >
                    <p className="text-[11px] text-text-secondary font-medium">
                      Drag and drop multiple photos here or tap <span className="font-extrabold text-primary-lime">Add from Gallery</span> above.
                    </p>
                  </div>

                  {/* Gallery Photos Grid (Uploading items + Confirmed Images) */}
                  {(formData.additionalImages.length > 0 || galleryUploadItems.length > 0) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                      {/* Active / In-Progress / Failed Gallery Uploads */}
                      {galleryUploadItems.map((item) => (
                        <div
                          key={item.id}
                          className="relative h-32 rounded-xl overflow-hidden border border-border-subtle group bg-surface-raised flex flex-col items-center justify-center p-2"
                        >
                          <img
                            src={item.previewUrl}
                            alt="Gallery uploading"
                            className="absolute inset-0 w-full h-full object-cover opacity-30 blur-xs"
                          />
                          <div className="relative z-10 w-full flex flex-col items-center text-center gap-1.5 bg-black/75 backdrop-blur-sm p-2 rounded-lg">
                            {item.status === 'uploading' ? (
                              <>
                                <Loader2 size={18} className="animate-spin text-primary-lime" />
                                <span className="text-[10px] font-mono font-bold text-white">{item.progress}%</span>
                                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-primary-lime h-full transition-all duration-200"
                                    style={{ width: `${item.progress}%` }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeUploadQueueItem(item.id)}
                                  className="text-[9px] text-text-tertiary hover:text-error underline mt-0.5 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : item.status === 'queued' ? (
                              <>
                                <Clock size={16} className="text-amber-400" />
                                <span className="text-[10px] font-bold text-amber-300">In queue...</span>
                                <button
                                  type="button"
                                  onClick={() => removeUploadQueueItem(item.id)}
                                  className="text-[9px] text-text-tertiary hover:text-error underline mt-0.5 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <AlertCircle size={16} className="text-error" />
                                <span className="text-[9px] font-bold text-white truncate max-w-full">Upload Failed</span>
                                <div className="flex items-center gap-1.5 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => retryUpload(item.id)}
                                    className="px-2 py-0.5 bg-primary-lime text-black rounded text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                                    title="Retry"
                                  >
                                    <RefreshCw size={10} />
                                    <span>Retry</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeUploadQueueItem(item.id)}
                                    className="px-2 py-0.5 bg-surface-card border border-border-subtle text-text-secondary hover:text-error rounded text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                                    title="Remove"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Confirmed Gallery Photos */}
                      {formData.additionalImages.map((imgUrl, i) => {
                        const isFailed = failedGalleryUrls.has(imgUrl);
                        return (
                          <div
                            key={i}
                            className="relative h-32 rounded-xl overflow-hidden border border-border-subtle group bg-surface-raised"
                          >
                            {isFailed ? (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-surface-raised text-text-muted gap-1">
                                <ImageOff size={20} className="text-text-muted" />
                                <span className="text-[10px] font-bold text-text-secondary">Photo could not load</span>
                              </div>
                            ) : (
                              <img
                                src={imgUrl}
                                alt={`Gallery ${i}`}
                                className="w-full h-full object-cover"
                                onError={() => {
                                  setFailedGalleryUrls(prev => new Set(prev).add(imgUrl));
                                }}
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                              <div className="flex justify-between items-center">
                                <span className="bg-black/60 backdrop-blur-sm text-[9px] font-extrabold text-white px-1.5 py-0.5 rounded">
                                  Photo {i + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGalleryImage(i)}
                                  className="w-6 h-6 rounded-lg bg-black/80 text-white hover:text-error flex items-center justify-center cursor-pointer transition-colors"
                                  title="Remove photo"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSetAsCover(i)}
                                className="w-full py-1 bg-primary-lime hover:bg-primary-lime/90 text-black text-[10px] font-extrabold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all shadow"
                              >
                                <Star size={11} fill="currentColor" />
                                <span>Set as Cover</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Paste URL for additional photo (collapsible) */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowGalleryUrlInput(!showGalleryUrlInput)}
                      className="text-[10px] text-text-tertiary hover:text-primary-lime font-bold cursor-pointer"
                    >
                      {showGalleryUrlInput ? 'Hide photo URL input' : '+ Or add via image link'}
                    </button>
                    {showGalleryUrlInput && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="url"
                          value={newImageInput}
                          onChange={(e) => setNewImageInput(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 bg-surface-raised border border-border-subtle rounded-xl px-4 py-2 text-base min-h-11 font-bold text-text-primary focus:border-primary-lime outline-none transition-all"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddGalleryImage(newImageInput);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddGalleryImage(newImageInput)}
                          className="px-3.5 py-2 bg-surface-raised hover:bg-border-subtle text-text-primary border border-border-subtle rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Plus size={13} />
                          <span>Add</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* SECTION 8: LIVE PLAYER CARD PREVIEW */}
            {activeTab === 'preview' && (
              <div className="bg-surface-card border-2 border-primary-lime/40 p-5 sm:p-6 rounded-2xl shadow-xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-primary-lime/20 text-primary-lime rounded-xl">
                      <Eye size={18} />
                    </span>
                    <div>
                      <h2 className="text-base font-extrabold text-text-primary">Live Player Listing Preview</h2>
                      <p className="text-xs text-text-secondary">How your turf will appear to thousands of players in Pitchly</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-primary-lime/15 text-primary-lime text-[10px] font-black uppercase tracking-wider border border-primary-lime/30">
                    Live Preview
                  </span>
                </div>

                {/* Simulated Player Card */}
                <div className="max-w-md mx-auto bg-surface-card rounded-2xl border border-border-subtle overflow-hidden shadow-lg">
                  <div className="relative h-48 bg-surface-raised flex items-center justify-center">
                    {!formData.coverImage || isCoverFailed ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-text-muted gap-1">
                        <ImageOff size={24} className="text-text-muted" />
                        <span className="text-[10px] font-bold text-text-secondary">
                          {isCoverFailed ? 'Photo could not load' : 'No photo yet'}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={formData.coverImage}
                        alt={formData.name || 'Pitch'}
                        className="w-full h-full object-cover"
                        onLoad={() => {
                          if (failedCoverUrl === formData.coverImage) {
                            setFailedCoverUrl('');
                          }
                        }}
                        onError={() => setFailedCoverUrl(formData.coverImage)}
                      />
                    )}
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black text-white flex items-center gap-1 border border-white/20">
                      <Sparkles size={11} className="text-primary-lime" />
                      <span>{formData.surfaceType}</span>
                    </div>

                    <div className="absolute bottom-3 right-3 bg-surface-card/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-right border border-border-subtle shadow-md">
                      <span className="text-[9px] font-bold text-text-tertiary uppercase block">From</span>
                      <span className="text-xs font-black text-primary-lime">
                        UGX {Number(formData.pricePerHour || 70000).toLocaleString()} / hr
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-base font-extrabold text-text-primary truncate">
                        {formData.name || 'Your Facility Name'}
                      </h3>
                      <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-primary-lime shrink-0" />
                        <span className="truncate">{formData.formattedAddress || formData.location}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {formData.pitchFormats.map(fmt => (
                        <span key={fmt} className="px-2 py-0.5 bg-surface-raised rounded-md text-[10px] font-bold text-text-secondary border border-border-subtle">
                          {fmt}
                        </span>
                      ))}
                      <span className="px-2 py-0.5 bg-primary-lime/10 text-primary-lime rounded-md text-[10px] font-bold border border-primary-lime/30">
                        {formData.openingHour} – {formData.closingHour}
                      </span>
                    </div>

                    {formData.amenities.length > 0 && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border-subtle text-xs text-text-secondary">
                        <span className="text-[11px] font-bold text-text-tertiary">Perks:</span>
                        <span className="text-[11px] font-medium truncate">
                          {formData.amenities.slice(0, 4).join(' · ')}
                          {formData.amenities.length > 4 ? ` +${formData.amenities.length - 4} more` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Action Submit Button */}
            <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-text-secondary">
                <span>By submitting, you agree to Pitchly's facility quality standards and terms.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isAnyPhotoUploading}
                className="w-full sm:w-auto px-8 py-3.5 bg-primary-lime hover:bg-[#96E600] text-accent-text font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary-lime/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnyPhotoUploading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} strokeWidth={3} />
                    <span>Uploading photos...</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} strokeWidth={3} />
                    <span>{isEditMode ? 'SAVING PITCH...' : 'SUBMITTING PITCH...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>{isEditMode ? 'SAVE FACILITY CHANGES' : 'SUBMIT PITCH FOR REVIEW'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};
