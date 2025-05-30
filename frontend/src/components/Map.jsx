import React, { useImperativeHandle, forwardRef, useRef } from 'react';
import { APIProvider, Map as GoogleMap } from '@vis.gl/react-google-maps';

const Map = forwardRef(({ apiKey, onPlaceClick }, ref) => {
  const mapInstance = useRef(null);

  // Expose the addCircle method to the parent component
  useImperativeHandle(ref, () => ({
    addCircle(center, radius) {
      if (mapInstance.current) {
        new window.google.maps.Circle({
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0.35,
          map: mapInstance.current,
          center,
          radius,
        });
      }
    },
  }));

  const handleMapClick = async (event) => {
    const lat = event.detail.latLng.lat;
    const lng = event.detail.latLng.lng;
    console.log('Clicked coordinates:', lat, lng);
    console.log('Clicked event:', event); 

    try {
      const placeId = event.detail.placeId;
      console.log('Clicked Place ID:', placeId);
      if (onPlaceClick) {
        onPlaceClick(placeId); // Pass the placeId to the parent component
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  return (
    <APIProvider apiKey={apiKey} libraries={['places']}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <GoogleMap
          ref={(map) => (mapInstance.current = map)}
          style={{ width: '100%', height: '100%' }}
          defaultCenter={{ lat: 50.8503, lng: 4.3517 }}
          defaultZoom={8}
          gestureHandling="greedy"
          disableDefaultUI={true}
          onClick={handleMapClick} // Handle map clicks
        />
      </div>
    </APIProvider>
  );
});

export default Map;