import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, CheckCircle, Navigation, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  formattedAddress: string;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

// Default center for Kampala, Uganda
const KAMPALA_DEFAULT: [number, number] = [0.3476, 32.5825];

// Custom Leaflet Marker Icon to ensure consistent rendering without missing asset PNGs
const customMarkerIcon = L.divIcon({
  className: 'custom-pitchly-leaflet-pin',
  html: `<div style="background-color: #A8FF00; width: 34px; height: 34px; border-radius: 50%; border: 3px solid #0D0D0D; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.4); transform: translate(-50%, -50%);">
           <div style="background-color: #0D0D0D; width: 12px; height: 12px; border-radius: 50%;"></div>
         </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// Helper component to handle map click events
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      console.log('[LocationPicker react-leaflet] Map click event fired at:', e.latlng);
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Helper component to recenter map when center changes
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.setView(center, Math.max(map.getZoom(), 14));
    }
  }, [center[0], center[1], map]);
  return null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  formattedAddress,
  onLocationChange,
}) => {
  const currentLat = latitude ?? KAMPALA_DEFAULT[0];
  const currentLng = longitude ?? KAMPALA_DEFAULT[1];

  const [searchQuery, setSearchQuery] = useState(formattedAddress || 'Kampala, Uganda');
  const [searchResults, setSearchResults] = useState<Array<{ lat: string; lon: string; display_name: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [manualLat, setManualLat] = useState(String(currentLat));
  const [manualLng, setManualLng] = useState(String(currentLng));
  const [manualAddress, setManualAddress] = useState(formattedAddress || 'Kampala, Uganda');

  const markerRef = useRef<L.Marker>(null);
  const lastGeocodeTimeRef = useRef<number>(0);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  console.log('[LocationPicker render]', {
    latitude,
    longitude,
    formattedAddress,
    currentLat,
    currentLng,
  });

  // Initial auto-propagation if props are null
  useEffect(() => {
    if (latitude === null || longitude === null) {
      onLocationChange(KAMPALA_DEFAULT[0], KAMPALA_DEFAULT[1], formattedAddress || 'Kampala, Uganda');
    }
  }, []);

  // Sync internal state when external props update
  useEffect(() => {
    if (latitude !== null && latitude !== undefined) setManualLat(String(latitude));
    if (longitude !== null && longitude !== undefined) setManualLng(String(longitude));
    if (formattedAddress) {
      setManualAddress(formattedAddress);
      setSearchQuery(formattedAddress);
    }
  }, [latitude, longitude, formattedAddress]);

  // Throttled reverse geocoding via Nominatim
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    const now = Date.now();
    const elapsed = now - lastGeocodeTimeRef.current;
    if (elapsed < 1000) {
      await new Promise((r) => setTimeout(r, 1000 - elapsed));
    }
    lastGeocodeTimeRef.current = Date.now();

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      console.log('[LocationPicker] Fetching reverse geocode from Nominatim:', url);
      const res = await fetch(url, { headers: { 'User-Agent': 'PitchlyApp/1.0 (contact@pitchly.app)' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const address = data.display_name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      console.log('[LocationPicker] Reverse geocode result:', address);
      onLocationChange(lat, lng, address);
      setSearchQuery(address);
      setManualAddress(address);
    } catch (err) {
      console.error('[LocationPicker] Reverse geocode error:', err);
      const fallbackAddress = `Kampala Area (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      onLocationChange(lat, lng, fallbackAddress);
      setSearchQuery(fallbackAddress);
    } finally {
      setIsGeocoding(false);
    }
  }, [onLocationChange]);

  // Map click handler
  const handleMapClick = useCallback((lat: number, lng: number) => {
    console.log('[LocationPicker] handleMapClick fired with:', lat, lng);
    setManualLat(String(lat));
    setManualLng(String(lng));
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  // Marker drag end handler
  const markerEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          console.log('[LocationPicker] handleMarkerDragEnd fired with:', latLng.lat, latLng.lng);
          setManualLat(String(latLng.lat));
          setManualLng(String(latLng.lng));
          reverseGeocode(latLng.lat, latLng.lng);
        }
      },
    }),
    [reverseGeocode]
  );

  // Search input change with debounce for Nominatim search suggestions
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ug&limit=5`;
        console.log('[LocationPicker] Searching Nominatim:', searchUrl);
        const res = await fetch(searchUrl, { headers: { 'User-Agent': 'PitchlyApp/1.0 (contact@pitchly.app)' } });
        if (res.ok) {
          const data = await res.json();
          console.log('[LocationPicker] Search results count:', data.length);
          setSearchResults(data);
          setShowDropdown(data.length > 0);
        }
      } catch (err) {
        console.error('[LocationPicker] Nominatim search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  };

  // Select place from search dropdown
  const handleSelectPlace = (item: { lat: string; lon: string; display_name: string }) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const address = item.display_name;

    console.log('[LocationPicker] Place selected from search:', { lat, lng, address });
    setSearchQuery(address);
    setManualAddress(address);
    setManualLat(String(lat));
    setManualLng(String(lng));
    setShowDropdown(false);

    onLocationChange(lat, lng, address);
  };

  // Manual input submit button handler
  const handleManualSync = () => {
    const latNum = parseFloat(manualLat);
    const lngNum = parseFloat(manualLng);
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      onLocationChange(latNum, lngNum, manualAddress.trim() || 'Kampala, Uganda');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input Box with Nominatim Autocomplete */}
      <div className="relative">
        <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-3 block">
          Search Location / Venue Address (OpenStreetMap)
        </label>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
            placeholder="Search place e.g. Bukoto, Lugogo, Kampala..."
            className="w-full bg-surface-raised border border-transparent rounded-[16px] pl-12 pr-10 min-h-[56px] text-text-primary font-bold focus:border-accent/40 outline-none transition-all placeholder-text-secondary text-sm"
          />
          {isSearching && (
            <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-lime animate-spin" />
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-[1000] left-0 right-0 mt-2 bg-surface-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPlace(item)}
                className="w-full text-left px-4 py-3 hover:bg-surface-raised transition-colors border-b border-border-subtle last:border-none flex items-center gap-2.5 text-xs text-text-primary font-medium"
              >
                <MapPin size={16} className="text-primary-lime shrink-0 mt-0.5" />
                <span className="line-clamp-2">{item.display_name}</span>
              </button>
            ))}
          </div>
        )}

        <p className="text-[10px] text-text-secondary font-medium mt-2 leading-relaxed">
          Search place above, click on suggestions, drag the pin, or click anywhere on the map to set location.
        </p>
      </div>

      {/* Interactive Leaflet Map */}
      <div className="relative h-[320px] w-full rounded-2xl overflow-hidden border border-border-subtle bg-surface-raised z-0">
        <MapContainer
          center={[currentLat, currentLng]}
          zoom={14}
          scrollWheelZoom={false}
          style={{ width: '100%', height: '100%', zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <MapRecenter center={[currentLat, currentLng]} />
          <Marker
            position={[currentLat, currentLng]}
            draggable={true}
            eventHandlers={markerEventHandlers}
            ref={markerRef}
            icon={customMarkerIcon}
          />
        </MapContainer>

        {/* Selected Location Overlay Badge */}
        <div className="absolute bottom-3 left-3 right-3 z-[400] bg-surface-card/90 backdrop-blur-md border border-border-subtle p-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 truncate mr-2">
            <MapPin size={14} className="text-primary-lime shrink-0" />
            <span className="text-text-primary truncate">{searchQuery || 'Pin Positioned'}</span>
          </div>
          <span className="text-[10px] bg-primary-lime/10 border border-primary-lime/30 text-primary-lime px-2 py-0.5 rounded shrink-0 font-mono">
            {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Backup Manual Input Section */}
      <div className="bg-surface-raised p-4 rounded-2xl border border-border-subtle space-y-3">
        <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] block">
          Manual Coordinate & Address Backup
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1 block">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              className="w-full bg-surface-card border border-transparent rounded-xl px-3 h-10 text-xs text-text-primary font-bold focus:border-accent/40 outline-none"
            />
          </div>
          <div>
            <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1 block">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              className="w-full bg-surface-card border border-transparent rounded-xl px-3 h-10 text-xs text-text-primary font-bold focus:border-accent/40 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1 block">
            Formatted Address
          </label>
          <input
            type="text"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            className="w-full bg-surface-card border border-transparent rounded-xl px-3 h-10 text-xs text-text-primary font-bold focus:border-accent/40 outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleManualSync}
          className="w-full bg-primary-lime text-accent-text py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#96E600] active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Navigation size={14} /> Update Coordinates
        </button>
      </div>

      {latitude !== null && longitude !== null && (
        <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle size={14} />
          <span>Location selected: {latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
        </div>
      )}
    </div>
  );
};
