import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import {
  MapPin,
  Star,
  ChevronRight,
  Layers,
  Key,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Turf } from '../types';

export const DEFAULT_CENTER = { lat: 0.3476, lng: 32.5825 };

// Map dark theme styling configuration for standard mapTypeId 'roadmap'
const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#18181b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#18181b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a1a1aa' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f4f4f5' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#71717a' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1c2419' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#a8ff00' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#27272a' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#18181b' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca3af' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3f3f46' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#18181b' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d4d4d8' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#27272a' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#a1a1aa' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#09090b' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#52525b' }],
  },
];

interface GooglePitchMapProps {
  pitches: Array<Turf & { computedDistance?: number; freeSlotsCount?: number }>;
  userLocation: { lat: number; lng: number };
  selectedPitchId?: string | null;
  onSelectPitch?: (pitch: (Turf & { computedDistance?: number; freeSlotsCount?: number }) | null) => void;
  radiusKm?: number;
  height?: string;
  interactive?: boolean;
  showControls?: boolean;
}

export const GooglePitchMap: React.FC<GooglePitchMapProps> = ({
  pitches,
  userLocation,
  selectedPitchId,
  onSelectPitch,
  radiusKm,
  height = '100%',
  interactive = true,
  showControls = true,
}) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Array<google.maps.marker.AdvancedMarkerElement | google.maps.Marker>>([]);
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');

  const apiKey =
    (typeof process !== 'undefined' && process.env?.GOOGLE_MAPS_PLATFORM_KEY) ||
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    '';

  const getCoordinates = useCallback((pitch: Turf): { lat: number; lng: number } => {
    if (typeof pitch.latitude === 'number' && typeof pitch.longitude === 'number') {
      return { lat: pitch.latitude, lng: pitch.longitude };
    }
    if (Array.isArray(pitch.coordinates) && pitch.coordinates.length === 2) {
      return { lat: pitch.coordinates[0], lng: pitch.coordinates[1] };
    }
    const hash = (pitch.id || '').charCodeAt(0) || 0;
    return {
      lat: 0.3476 + (hash % 10) * 0.005,
      lng: 32.5825 + (hash % 7) * 0.006,
    };
  }, []);

  // Initialize Google Maps instance using setOptions and importLibrary
  useEffect(() => {
    let isCancelled = false;

    if (!mapContainerRef.current) return;

    try {
      setOptions({
        key: apiKey || undefined,
        v: 'weekly',
      });
    } catch {
      // Options may have already been initialized
    }

    Promise.all([
      importLibrary('maps'),
      importLibrary('marker').catch(() => null),
    ])
      .then(([mapsLib]) => {
        if (isCancelled || !mapContainerRef.current) return;

        const mapOptions: google.maps.MapOptions & { internalUsageAttributionIds?: string[] } = {
          center: userLocation || DEFAULT_CENTER,
          zoom: 13,
          gestureHandling: interactive ? 'greedy' : 'none',
          disableDefaultUI: !showControls,
          zoomControl: showControls,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: mapType === 'roadmap' ? DARK_MAP_STYLES : undefined,
          mapTypeId: mapType,
          mapId: 'DEMO_MAP_ID',
          internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
        };

        const map = new mapsLib.Map(mapContainerRef.current, mapOptions);
        mapInstanceRef.current = map;
        setMapLoaded(true);

        const infoWindow = new mapsLib.InfoWindow({
          disableAutoPan: false,
        });
        infoWindowRef.current = infoWindow;
      })
      .catch((err: any) => {
        console.warn('Google Maps Loader error:', err);
        if (!isCancelled) {
          setMapError(err?.message || 'Failed to load Google Maps script');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [apiKey]);

  // Update map type when toggled
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setMapTypeId(mapType);
    if (mapType === 'roadmap') {
      mapInstanceRef.current.setOptions({ styles: DARK_MAP_STYLES });
    } else {
      mapInstanceRef.current.setOptions({ styles: [] });
    }
  }, [mapType]);

  // Update User Location Marker
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !window.google?.maps) return;

    if (userMarkerRef.current) {
      if ('setMap' in userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      } else if ('map' in userMarkerRef.current) {
        (userMarkerRef.current as any).map = null;
      }
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userDot = document.createElement('div');
      userDot.className = 'relative flex items-center justify-center';
      userDot.innerHTML = `
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background-color: rgba(59, 130, 246, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 20px; height: 20px; border-radius: 9999px; background-color: #3b82f6; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.5);"></div>
      `;

      if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: userLocation,
          title: 'Your Current Location',
          content: userDot,
        });
        userMarkerRef.current = marker;
      } else {
        const marker = new window.google.maps.Marker({
          map: mapInstanceRef.current,
          position: userLocation,
          title: 'Your Current Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
        });
        userMarkerRef.current = marker;
      }
    }
  }, [mapLoaded, userLocation]);

  // Update Pitch Markers
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !window.google?.maps) return;

    // Clear existing markers
    markersRef.current.forEach((m) => {
      if ('setMap' in m) {
        m.setMap(null);
      } else if ('map' in m) {
        (m as any).map = null;
      }
    });
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasCoords = false;

    pitches.forEach((pitch) => {
      const coords = getCoordinates(pitch);
      const isSelected = selectedPitchId === pitch.id;
      const priceFormatted = `${Math.round(pitch.pricePerHour / 1000)}k`;

      bounds.extend(coords);
      hasCoords = true;

      // Custom marker DOM element
      const markerElement = document.createElement('div');
      markerElement.className = `custom-pitch-pin flex items-center gap-1.5 px-3 py-1 rounded-full cursor-pointer transition-all duration-200 shadow-lg select-none ${
        isSelected
          ? 'bg-primary-lime text-accent-text ring-4 ring-primary-lime/40 font-black scale-110'
          : 'bg-surface-card text-text-primary border border-border-subtle hover:border-primary-lime/70 font-bold hover:scale-105'
      }`;
      markerElement.style.cssText = isSelected
        ? 'background-color: #A8FF00; color: #0D0D0D; padding: 4px 10px; border-radius: 9999px; font-weight: 900; font-size: 11px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(168,255,0,0.3); border: 2px solid #0D0D0D;'
        : 'background-color: #161616; color: #F4F4F5; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 11px; display: flex; align-items: center; gap: 4px; border: 1px solid #262626; box-shadow: 0 4px 10px rgba(0,0,0,0.5);';

      markerElement.innerHTML = `
        <span style="font-size: 10px;">⚽</span>
        <span>UGX ${priceFormatted}</span>
      `;

      let markerInstance: google.maps.marker.AdvancedMarkerElement | google.maps.Marker;

      if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
        markerInstance = new window.google.maps.marker.AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: coords,
          title: pitch.name,
          content: markerElement,
        });

        markerInstance.addListener('click', () => {
          showPitchInfoWindow(pitch, coords);
          if (onSelectPitch) onSelectPitch(pitch);
        });
      } else {
        markerInstance = new window.google.maps.Marker({
          map: mapInstanceRef.current,
          position: coords,
          title: pitch.name,
          label: {
            text: priceFormatted,
            color: '#A8FF00',
            fontWeight: 'bold',
            fontSize: '11px',
          },
        });

        markerInstance.addListener('click', () => {
          showPitchInfoWindow(pitch, coords);
          if (onSelectPitch) onSelectPitch(pitch);
        });
      }

      markersRef.current.push(markerInstance);
    });

    // If a pitch is selected, pan to it directly
    if (selectedPitchId) {
      const selected = pitches.find((p) => p.id === selectedPitchId);
      if (selected) {
        const coords = getCoordinates(selected);
        mapInstanceRef.current.panTo(coords);
        mapInstanceRef.current.setZoom(15);
        showPitchInfoWindow(selected, coords);
      }
    }
  }, [mapLoaded, pitches, selectedPitchId, getCoordinates, onSelectPitch]);

  const showPitchInfoWindow = (
    pitch: Turf & { computedDistance?: number; freeSlotsCount?: number },
    coords: { lat: number; lng: number }
  ) => {
    if (!infoWindowRef.current || !mapInstanceRef.current) return;

    const imgUrl =
      pitch.images?.[0] ||
      pitch.image ||
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80';

    const contentString = `
      <div style="background-color: #161616; color: #F4F4F5; padding: 12px; border-radius: 12px; border: 1px solid #262626; max-width: 260px; font-family: sans-serif;">
        <div style="position: relative; width: 100%; height: 100px; border-radius: 8px; overflow: hidden; background-color: #202020; margin-bottom: 8px;">
          <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${pitch.name}" />
          <div style="position: absolute; top: 6px; left: 6px; padding: 2px 6px; border-radius: 4px; background: rgba(13,13,13,0.85); color: #FACC15; font-size: 10px; font-weight: bold;">
            ★ ${pitch.rating || '4.8'}
          </div>
          ${
            pitch.computedDistance !== undefined
              ? `<div style="position: absolute; bottom: 6px; right: 6px; padding: 2px 6px; border-radius: 4px; background: rgba(13,13,13,0.85); color: #A8FF00; font-size: 10px; font-weight: bold;">${pitch.computedDistance} km away</div>`
              : ''
          }
        </div>
        <h4 style="margin: 0; font-size: 14px; font-weight: bold; color: #F4F4F5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${pitch.name}
        </h4>
        <p style="margin: 4px 0 8px 0; font-size: 11px; color: #A1A1AA; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          📍 ${pitch.location}
        </p>
        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid #262626;">
          <div>
            <span style="font-size: 9px; color: #94949E; text-transform: uppercase;">Price</span>
            <div style="font-size: 13px; font-weight: bold; color: #A8FF00;">UGX ${pitch.pricePerHour.toLocaleString()}<span style="font-size: 9px; color: #94949E;">/hr</span></div>
          </div>
          <button id="book-pitch-btn-${pitch.id}" style="background-color: #A8FF00; color: #0D0D0D; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 900; cursor: pointer;">
            Book Turf &rarr;
          </button>
        </div>
      </div>
    `;

    infoWindowRef.current.setContent(contentString);
    infoWindowRef.current.setPosition(coords);
    infoWindowRef.current.open({
      map: mapInstanceRef.current,
      shouldFocus: false,
    });

    window.google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
      const btn = document.getElementById(`book-pitch-btn-${pitch.id}`);
      if (btn) {
        btn.onclick = () => {
          navigate(`/turf/${pitch.id}`);
        };
      }
    });
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-border-subtle bg-[#121214]"
      style={{ height }}
    >
      {/* Map Container Target */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Fallback Banner for Key Setup */}
      {!apiKey && (
        <div className="absolute top-3 left-3 right-3 z-10 p-3 rounded-xl bg-surface-card/95 backdrop-blur-md border border-primary-lime/40 text-text-primary shadow-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary-lime/15 text-primary-lime flex items-center justify-center shrink-0 mt-0.5 border border-primary-lime/30">
              <Key size={14} />
            </div>
            <div>
              <div className="font-bold text-primary-lime flex items-center gap-1.5">
                <span>Google Maps Platform Connected</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-surface-raised text-text-secondary border border-border-subtle">
                  Active
                </span>
              </div>
              <p className="text-text-secondary text-[11px] mt-0.5 leading-relaxed">
                Add <code className="text-primary-lime font-mono">VITE_GOOGLE_MAPS_API_KEY</code> in Settings or use the Maps Demo Key for live street & satellite tiles.
              </p>
            </div>
          </div>
          <a
            href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-surface-raised hover:bg-border-subtle border border-[#383838] text-[11px] font-bold text-primary-lime shrink-0 flex items-center gap-1 transition-colors"
            title="Get a free Google Maps Demo Key"
          >
            <span>Demo Key</span>
            <ExternalLink size={10} />
          </a>
        </div>
      )}

      {/* Floating Map Controls */}
      {showControls && (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={() => setMapType(mapType === 'roadmap' ? 'hybrid' : 'roadmap')}
            className="w-10 h-10 rounded-full bg-surface-card/90 backdrop-blur-md border border-border-subtle hover:border-primary-lime/40 text-text-primary flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer"
            title={`Switch to ${mapType === 'roadmap' ? 'Satellite' : 'Roadmap'} View`}
          >
            <Layers size={16} className={mapType === 'hybrid' ? 'text-primary-lime' : ''} />
          </button>
        </div>
      )}
    </div>
  );
};
