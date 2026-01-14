/**
 * LocationTab Component
 *
 * Display interactive map and property address
 */

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HiLocationMarker } from 'react-icons/hi';
import type { LocationTabProps } from './LocationTab.types';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const LocationTab: React.FC<LocationTabProps> = ({
  lat,
  lng,
  address,
  propertyName,
}) => {
  const hasValidCoordinates = lat !== null && lng !== null;
  const mapRef = useRef<L.Map | null>(null);

  // Default to a reasonable zoom level
  const defaultCenter: [number, number] = hasValidCoordinates
    ? [lat, lng]
    : [-25.7461, 28.1881]; // Pretoria, South Africa as fallback

  useEffect(() => {
    // Invalidate map size after component mounts to ensure proper rendering
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Map */}
      {hasValidCoordinates ? (
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '400px', width: '100%' }}
            scrollWheelZoom={false}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={defaultCenter}>
              <Popup>{propertyName}</Popup>
            </Marker>
          </MapContainer>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border bg-gray-100 dark:bg-dark-hover h-[400px] flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <HiLocationMarker className="w-12 h-12 mx-auto mb-2" />
            <p>Map not available</p>
          </div>
        </div>
      )}

      {/* Address */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          Address
        </h3>
        <div className="flex items-start gap-3">
          <HiLocationMarker className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
          <div>
            <p className="text-gray-700 dark:text-gray-300">{address}</p>
          </div>
        </div>
      </div>

      {/* Contact Note */}
      <div className="bg-gray-50 dark:bg-dark-card rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          For detailed directions and specific location information, please contact the property after booking.
        </p>
      </div>
    </div>
  );
};
