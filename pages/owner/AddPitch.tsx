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
  Smartphone
} from 'lucide-react';
import { pitchService } from '../../services/pitchService';
import { collection, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LocationPicker } from '../../components/LocationPicker';
import { optimizeAndUploadPitchPhoto } from '../../utils/imageOptimizer';

// Preset High Quality Turf Gallery Images for instant selection & testing
const PRESET_TURF_IMAGES = [
  {
    title: 'Night Floodlit Arena',
    category: 'Night Match',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Daylight 3G AstroTurf',
    category: 'Full Pitch',
    url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Modern Sports Complex',
    category: 'Aerial View',
    url: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Goalmouth & Goal Net',
    category: 'Pitch Detail',
    url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Indoor Futsal & Training',
    category: 'Indoor Court',
    url: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&auto=format&fit=crop&q=80',
  }
];

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
    coverImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=1200&auto=format&fit=crop&q=80'
    ] as string[],
  });

  const [newRuleInput, setNewRuleInput] = useState('');
  const [newImageInput, setNewImageInput] = useState('');

  // Image Upload States
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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
              depositPercentage: pitch.depositPercentage ?? 50,
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
              coverImage: pitch.images?.[0] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
              additionalImages: pitch.images?.slice(1) || []
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
    if (formData.additionalImages.includes(cleanUrl) || formData.coverImage === cleanUrl) return;
    setFormData(prev => ({
      ...prev,
      additionalImages: [...prev.additionalImages, cleanUrl]
    }));
    setNewImageInput('');
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, i) => i !== index)
    }));
  };

  const handleSetAsCover = (index: number) => {
    const selectedImg = formData.additionalImages[index];
    const oldCover = formData.coverImage;
    if (!selectedImg) return;
    setFormData(prev => ({
      ...prev,
      coverImage: selectedImg,
      additionalImages: oldCover
        ? [oldCover, ...prev.additionalImages.filter((_, i) => i !== index)]
        : prev.additionalImages.filter((_, i) => i !== index)
    }));
  };

  const handleCoverFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const url = await optimizeAndUploadPitchPhoto(file, user?.uid);
      setFormData(prev => ({ ...prev, coverImage: url }));
    } catch (err: any) {
      console.error('Failed to process cover photo:', err);
      setError('Could not process cover photo. Please choose another image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleGalleryFilesUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    try {
      const newUrls: string[] = [];
      for (const file of files) {
        const url = await optimizeAndUploadPitchPhoto(file, user?.uid);
        newUrls.push(url);
      }

      setFormData(prev => {
        if (!prev.coverImage && newUrls.length > 0) {
          return {
            ...prev,
            coverImage: newUrls[0],
            additionalImages: [...prev.additionalImages, ...newUrls.slice(1)]
          };
        }
        return {
          ...prev,
          additionalImages: [...prev.additionalImages, ...newUrls]
        };
      });
    } catch (err: any) {
      console.error('Failed to process gallery photos:', err);
      setError('Could not process some photos. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
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
    if (formData.pitchFormats.length === 0) {
      return 'Please select at least one match format (e.g. 5-a-side, 7-a-side).';
    }
    if (!formData.coverImage.trim()) {
      return 'Please provide a primary cover photo for your pitch.';
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

    // Combine cover and additional images into unified images array
    const allImages = [formData.coverImage, ...formData.additionalImages].filter(Boolean);

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
          isVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          formattedAddress: formData.formattedAddress || formData.location,
        });

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
                    <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                      Facility / Pitch Name <span className="text-primary-lime">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Bukoto Astro Arena, Kampala"
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-lime outline-none transition-all placeholder:text-text-tertiary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                        <Phone size={12} className="text-primary-lime" />
                        <span>Direct Contact Phone</span> <span className="text-primary-lime">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contactPhone"
                        required
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                        placeholder="e.g. +256 700 123456"
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-lime outline-none transition-all placeholder:text-text-tertiary"
                      />
                      <span className="text-[10px] text-text-tertiary mt-1 block">Players can call this number for game inquiries</span>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                        <Mail size={12} className="text-[#38BDF8]" />
                        <span>Contact Email (Optional)</span>
                      </label>
                      <input
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                        placeholder="e.g. bookings@bukotoarena.ug"
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-lime outline-none transition-all placeholder:text-text-tertiary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                      Facility Description & Highlights
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Tell players about the turf quality, night lighting, spectator stands, tournaments hosted, and atmosphere..."
                      rows={3}
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl p-4 text-sm font-medium text-text-primary focus:border-primary-lime outline-none transition-all resize-none placeholder:text-text-tertiary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                      <Compass size={12} className="text-[#FACC15]" />
                      <span>Landmark & Driving Directions</span>
                    </label>
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleInputChange}
                      placeholder="e.g. Opposite Shell Bukoto, 100m past Acacia Avenue junction"
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-lime outline-none transition-all placeholder:text-text-tertiary"
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
                    <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                      Pitch Dimensions (Optional)
                    </label>
                    <input
                      type="text"
                      name="dimensions"
                      value={formData.dimensions}
                      onChange={handleInputChange}
                      placeholder="e.g. 42m x 25m"
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-lime outline-none transition-all placeholder:text-text-tertiary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                      Number of Available Pitches
                    </label>
                    <select
                      name="numberOfPitches"
                      value={formData.numberOfPitches}
                      onChange={handleInputChange}
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-lime outline-none transition-all cursor-pointer"
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
                      <span className="text-xs text-text-secondary block mb-1.5 font-bold">Earliest Opening Time</span>
                      <select
                        name="openingHour"
                        value={formData.openingHour}
                        onChange={handleInputChange}
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-lime outline-none transition-all cursor-pointer"
                      >
                        {hoursList.map(h => (
                          <option key={h} value={h}>{h} ({parseInt(h) < 12 ? 'Morning' : 'Evening'})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-xs text-text-secondary block mb-1.5 font-bold">Latest Closing Time</span>
                      <select
                        name="closingHour"
                        value={formData.closingHour}
                        onChange={handleInputChange}
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-lime outline-none transition-all cursor-pointer"
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
                    <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                      Standard Hourly Rate (UGX) <span className="text-primary-lime">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="pricePerHour"
                        required
                        min="1000"
                        step="1000"
                        value={formData.pricePerHour}
                        onChange={handleInputChange}
                        placeholder="70000"
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-lime outline-none transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-tertiary">
                        UGX / Hour
                      </span>
                    </div>
                    <span className="text-[10px] text-text-tertiary mt-1 block">Default daytime rate per 1-hour slot</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                      Peak / Floodlight Night Rate (UGX, Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="peakPricePerHour"
                        min="1000"
                        step="1000"
                        value={formData.peakPricePerHour}
                        onChange={handleInputChange}
                        placeholder="90000"
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-lime outline-none transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-tertiary">
                        UGX / Hour
                      </span>
                    </div>
                    <span className="text-[10px] text-text-tertiary mt-1 block">Rate for high-demand evening / night games</span>
                  </div>
                </div>

                {/* Deposit & Advance Payment Policy */}
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">
                    Advance Deposit Requirement
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { val: 0, label: '0% (Pay on Pitch)', desc: 'Pay cash on arrival' },
                      { val: 50, label: '50% Half Deposit', desc: 'Secure slot with 50%' },
                      { val: 100, label: '100% Full Payment', desc: 'Prepaid upfront' }
                    ].map(dep => (
                      <button
                        key={dep.val}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, depositPercentage: dep.val }))}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          formData.depositPercentage === dep.val
                            ? 'bg-primary-lime/10 border-primary-lime text-text-primary'
                            : 'bg-surface-raised border-border-subtle text-text-secondary'
                        }`}
                      >
                        <span className="text-xs font-extrabold block text-text-primary">{dep.label}</span>
                        <span className="text-[10px] text-text-secondary font-medium">{dep.desc}</span>
                      </button>
                    ))}
                  </div>
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
                    <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                      Merchant MoMo / Payout Phone
                    </label>
                    <input
                      type="text"
                      name="paymentPhone"
                      value={formData.paymentPhone}
                      onChange={handleInputChange}
                      placeholder="e.g. 0770 000000 or Merchant Code: 123456"
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-lime outline-none transition-all placeholder:text-text-tertiary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                      Account / Registered Merchant Name
                    </label>
                    <input
                      type="text"
                      name="paymentAccountName"
                      value={formData.paymentAccountName}
                      onChange={handleInputChange}
                      placeholder="e.g. Bukoto Arena Ltd"
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-lime outline-none transition-all placeholder:text-text-tertiary"
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
                  <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                    Footwear Guideline & Policy
                  </label>
                  <input
                    type="text"
                    name="footwearPolicy"
                    value={formData.footwearPolicy}
                    onChange={handleInputChange}
                    placeholder="e.g. Turf trainers (TF) or Multi-ground boots (AG/MG). Metal studs forbidden."
                    className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-lime outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2 block">
                    Cancellation & Reschedule Window
                  </label>
                  <input
                    type="text"
                    name="cancellationPolicy"
                    value={formData.cancellationPolicy}
                    onChange={handleInputChange}
                    placeholder="e.g. Free cancellation or slot reschedule up to 4 hours before kickoff."
                    className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-lime outline-none transition-all"
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
                        className="flex-1 bg-surface-raised border border-border-subtle rounded-xl px-4 py-2.5 text-xs font-bold text-text-primary focus:border-primary-lime outline-none transition-all"
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
                    <input
                      type="url"
                      name="coverImage"
                      value={formData.coverImage}
                      onChange={handleInputChange}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-xs font-bold text-text-primary focus:border-primary-lime outline-none transition-all placeholder:text-text-tertiary"
                    />
                  )}

                  {/* Cover Photo Dropzone / Upload Area */}
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
                        <img
                          src={formData.coverImage}
                          alt="Cover preview"
                          className="w-full h-56 sm:h-64 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800';
                          }}
                        />
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
                              className={`px-3.5 py-2 bg-primary-lime hover:bg-primary-lime/90 text-black rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 shadow transition-all ${
                                isUploadingImage ? 'opacity-70 pointer-events-none' : ''
                              }`}
                            >
                              {isUploadingImage ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  <span>Uploading...</span>
                                </>
                              ) : (
                                <>
                                  <Camera size={14} />
                                  <span>Replace from Gallery</span>
                                </>
                              )}
                            </label>
                            <input
                              id="cover-photo-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={isUploadingImage}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleCoverFileUpload(file);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, coverImage: '' }))}
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
                            className={`px-4 py-2.5 bg-primary-lime hover:bg-primary-lime/90 text-black rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-2 shadow transition-all ${
                              isUploadingImage ? 'opacity-70 pointer-events-none' : ''
                            }`}
                          >
                            {isUploadingImage ? (
                              <>
                                <Loader2 size={15} className="animate-spin" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Smartphone size={15} />
                                <span>Select Photo from Gallery</span>
                              </>
                            )}
                          </label>
                          <input
                            id="cover-photo-upload-empty"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingImage}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCoverFileUpload(file);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
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
                        className={`px-3.5 py-2 bg-surface-raised hover:bg-border-subtle border border-primary-lime/40 text-text-primary rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 transition-all ${
                          isUploadingImage ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 size={14} className="animate-spin text-primary-lime" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Camera size={14} className="text-primary-lime" />
                            <span>Add from Gallery</span>
                          </>
                        )}
                      </label>
                      <input
                        id="gallery-photos-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={isUploadingImage}
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

                  {/* Gallery Photos Grid */}
                  {formData.additionalImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                      {formData.additionalImages.map((imgUrl, i) => (
                        <div
                          key={i}
                          className="relative h-32 rounded-xl overflow-hidden border border-border-subtle group bg-surface-raised"
                        >
                          <img
                            src={imgUrl}
                            alt={`Gallery ${i}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800';
                            }}
                          />
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
                      ))}
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
                          className="flex-1 bg-surface-raised border border-border-subtle rounded-xl px-4 py-2 text-xs font-bold text-text-primary focus:border-primary-lime outline-none transition-all"
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

                {/* 3. QUICK TURF PRESET LIBRARY */}
                <div className="space-y-2 pt-4 border-t border-border-subtle">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">
                      Quick Preset Turf Library (Tap to Add to Gallery)
                    </span>
                    <span className="text-[10px] text-text-tertiary">Sample images for instant setup</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {PRESET_TURF_IMAGES.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (!formData.coverImage) {
                            setFormData(prev => ({ ...prev, coverImage: preset.url }));
                          } else {
                            handleAddGalleryImage(preset.url);
                          }
                        }}
                        className="relative rounded-xl overflow-hidden border border-border-subtle h-24 cursor-pointer group hover:scale-[1.02] transition-transform"
                      >
                        <img
                          src={preset.url}
                          alt={preset.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                          <span className="text-[10px] font-bold text-white leading-tight truncate">{preset.title}</span>
                          <span className="text-[9px] text-primary-lime font-extrabold">{preset.category}</span>
                        </div>
                      </div>
                    ))}
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
                      <p className="text-xs text-text-secondary">How your turf will appear to thousands of players in FootLink</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-primary-lime/15 text-primary-lime text-[10px] font-black uppercase tracking-wider border border-primary-lime/30">
                    Live Preview
                  </span>
                </div>

                {/* Simulated Player Card */}
                <div className="max-w-md mx-auto bg-surface-card rounded-2xl border border-border-subtle overflow-hidden shadow-lg">
                  <div className="relative h-48">
                    <img
                      src={formData.coverImage || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'}
                      alt={formData.name || 'Pitch'}
                      className="w-full h-full object-cover"
                    />
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
                <span>By submitting, you agree to FootLink's facility quality standards and terms.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-primary-lime hover:bg-[#96E600] text-accent-text font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary-lime/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
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
