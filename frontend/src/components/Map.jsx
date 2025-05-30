import React, { useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import { APIProvider, Map as GoogleMap } from '@vis.gl/react-google-maps';

const Map = forwardRef(({ apiKey, onPlaceClick, onMapClick, selectedLocation, searchResults }, ref) => {
  const mapInstance = useRef(null);
  const circleRef = useRef(null);
  const markersRef = useRef([]);
  const placeCirclesRef = useRef([]);
  const trafficLayerRef = useRef(null);

  // Expose methods to the parent component
  useImperativeHandle(ref, () => ({
    addCircle(center, radius) {
      // Remove existing circle
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }

      // Add new circle if map is available
      if (mapInstance.current && window.google?.maps) {
        circleRef.current = new window.google.maps.Circle({
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0.15,
          map: mapInstance.current,
          center,
          radius,
        });
      }
    },
    clearCircle() {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    },
    toggleTraffic(show = true) {
      if (!mapInstance.current || !window.google?.maps) return;
      
      if (show) {
        if (!trafficLayerRef.current) {
          trafficLayerRef.current = new window.google.maps.TrafficLayer();
        }
        trafficLayerRef.current.setMap(mapInstance.current);
      } else {
        if (trafficLayerRef.current) {
          trafficLayerRef.current.setMap(null);
        }
      }
    }
  }));

  // Clear all markers and their circles
  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
    
    // Clear place circles
    placeCirclesRef.current.forEach(circle => {
      circle.setMap(null);
    });
    placeCirclesRef.current = [];
  };

  // Add circle around a place marker
  const addPlaceCircle = (center, radius = 100, color = '#4CAF50') => {
    if (mapInstance.current && window.google?.maps) {
      const circle = new window.google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.6,
        strokeWeight: 1,
        fillColor: color,
        fillOpacity: 0.1,
        map: mapInstance.current,
        center,
        radius,
      });
      placeCirclesRef.current.push(circle);
      return circle;
    }
    return null;
  };

  // Add marker for selected location
  const addSelectedLocationMarker = (location) => {
    if (mapInstance.current && window.google?.maps) {
      const marker = new window.google.maps.Marker({
        position: location,
        map: mapInstance.current,
        title: 'Selected Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" fill="#007bff" stroke="white" stroke-width="3"/>
              <circle cx="16" cy="16" r="6" fill="white" opacity="0.8"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        }
      });
      
      // Add a larger circle around the selected location
      addPlaceCircle(location, 200, '#007bff');
      
      markersRef.current.push(marker);
    }
  };

  // Add markers for search results
  const addSearchResultMarkers = async (placeIds) => {
    if (!mapInstance.current || !window.google?.maps || !placeIds.length) return;

    const service = new window.google.maps.places.PlacesService(mapInstance.current);
    
    // Colors for different place types
    const placeColors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
      '#fd79a8', '#6c5ce7', '#a29bfe', '#fd7f6f', '#7bed9f'
    ];
    
    placeIds.forEach((placeId, index) => {
      // Add delay to avoid hitting rate limits
      setTimeout(() => {
        service.getDetails(
          {
            placeId: placeId,
            fields: ['geometry', 'name', 'place_id', 'types', 'rating']
          },
          (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
              const position = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              };
              
              // Get color based on place type or use cycling colors
              const colorIndex = index % placeColors.length;
              const markerColor = placeColors[colorIndex];
              
              // Create enhanced marker with rating info
              const marker = new window.google.maps.Marker({
                position: position,
                map: mapInstance.current,
                title: `${place.name || 'Place'}${place.rating ? ` (⭐${place.rating})` : ''}`,
                icon: {
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="${markerColor}" stroke="white" stroke-width="2"/>
                      <circle cx="12" cy="12" r="4" fill="white" opacity="0.9"/>
                      ${place.rating ? `<text x="12" y="16" text-anchor="middle" font-size="8" fill="black">★</text>` : ''}
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(24, 24),
                  anchor: new window.google.maps.Point(12, 12)
                }
              });

              // Add circle around each place
              const circleRadius = place.rating ? Math.max(50, place.rating * 20) : 75;
              addPlaceCircle(position, circleRadius, markerColor);

              // Add click listener
              marker.addListener('click', () => {
                if (onPlaceClick) {
                  onPlaceClick(place.place_id);
                }
              });

              // Add hover effects
              marker.addListener('mouseover', () => {
                marker.setIcon({
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
                      <circle cx="14" cy="14" r="12" fill="${markerColor}" stroke="white" stroke-width="3"/>
                      <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
                      ${place.rating ? `<text x="14" y="18" text-anchor="middle" font-size="10" fill="black">★</text>` : ''}
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(28, 28),
                  anchor: new window.google.maps.Point(14, 14)
                });
              });

              marker.addListener('mouseout', () => {
                marker.setIcon({
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="${markerColor}" stroke="white" stroke-width="2"/>
                      <circle cx="12" cy="12" r="4" fill="white" opacity="0.9"/>
                      ${place.rating ? `<text x="12" y="16" text-anchor="middle" font-size="8" fill="black">★</text>` : ''}
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(24, 24),
                  anchor: new window.google.maps.Point(12, 12)
                });
              });

              markersRef.current.push(marker);
            }
          }
        );
      }, index * 150); // 150ms delay between each request
    });
  };

  // Update markers when data changes
  useEffect(() => {
    clearMarkers();
    
    if (selectedLocation) {
      addSelectedLocationMarker(selectedLocation);
    }
    
    if (searchResults && searchResults.length > 0) {
      addSearchResultMarkers(searchResults);
      // Enable traffic layer when showing search results
      if (mapInstance.current && window.google?.maps) {
        if (!trafficLayerRef.current) {
          trafficLayerRef.current = new window.google.maps.TrafficLayer();
        }
        trafficLayerRef.current.setMap(mapInstance.current);
      }
    }
  }, [selectedLocation, searchResults]);

  const handleMapClick = async (event) => {
    const lat = event.detail.latLng.lat;
    const lng = event.detail.latLng.lng;
    
    // Clear existing circle when new location is selected
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }

    // Call the map click handler
    if (onMapClick) {
      onMapClick(lat, lng);
    }

    // Handle place clicks if there's a placeId
    try {
      const placeId = event.detail.placeId;
      if (placeId && onPlaceClick) {
        onPlaceClick(placeId);
      }
    } catch (error) {
      console.error('Error handling place click:', error);
    }
  };

  // Clear markers and circle when component unmounts
  useEffect(() => {
    return () => {
      clearMarkers();
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    };
  }, []);

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
          onClick={handleMapClick}
        />
      </div>
    </APIProvider>
  );
});

export default Map;