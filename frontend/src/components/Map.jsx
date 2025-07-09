import React, { useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import { getCategoryColor, getCategoryEmoji } from './CategoryIcons';

const Map = forwardRef(({ onPlaceClick, onMapClick, selectedLocation, searchResults, searchResultsData }, ref) => {
  const mapDiv = useRef(null);
  const mapView = useRef(null);
  const graphicsLayer = useRef(null);
  const circleGraphic = useRef(null);
  const markersGraphics = useRef([]);
  const trafficLayer = useRef(null);

  // Initialize ArcGIS modules
  useEffect(() => {
    let mounted = true;

    const initializeMap = async () => {
      try {
        const [
          Map,
          MapView,
          GraphicsLayer,
          Graphic,
          Point,
          Polygon,
          SimpleMarkerSymbol,
          SimpleFillSymbol,
          SimpleLineSymbol,
          TextSymbol,
          PictureMarkerSymbol
        ] = await Promise.all([
          import('@arcgis/core/Map'),
          import('@arcgis/core/views/MapView'),
          import('@arcgis/core/layers/GraphicsLayer'),
          import('@arcgis/core/Graphic'),
          import('@arcgis/core/geometry/Point'),
          import('@arcgis/core/geometry/Polygon'),
          import('@arcgis/core/symbols/SimpleMarkerSymbol'),
          import('@arcgis/core/symbols/SimpleFillSymbol'),
          import('@arcgis/core/symbols/SimpleLineSymbol'),
          import('@arcgis/core/symbols/TextSymbol'),
          import('@arcgis/core/symbols/PictureMarkerSymbol')
        ]);

        if (!mounted) return;

        // Create graphics layer
        graphicsLayer.current = new GraphicsLayer.default();

        // Create map
        const map = new Map.default({
          basemap: 'gray-vector', // Default to light gray basemap
          layers: [graphicsLayer.current]
        });

        // Create map view
        mapView.current = new MapView.default({
          container: mapDiv.current,
          map: map,
          center: [4.3517, 50.8503], // Brussels coordinates [lng, lat]
          zoom: 10,
          ui: {
            components: ["attribution"]
          }
        });

        // Handle map clicks
        mapView.current.on('click', (event) => {
          const { longitude, latitude } = event.mapPoint;
          
          // Check if we clicked on a marker
          mapView.current.hitTest(event).then((response) => {
            if (response.results.length > 0) {
              const graphic = response.results[0].graphic;
              if (graphic.attributes && graphic.attributes.place_id && onPlaceClick) {
                onPlaceClick(graphic.attributes.place_id);
                return;
              }
            }
            
            // If no marker was clicked, treat as map click
            // Clear existing circle when new location is selected
            if (circleGraphic.current) {
              graphicsLayer.current.remove(circleGraphic.current);
              circleGraphic.current = null;
            }

            if (onMapClick) {
              onMapClick(latitude, longitude);
            }
          });
        });

        console.log('ArcGIS Map initialized successfully');

      } catch (error) {
        console.error('Error initializing ArcGIS Map:', error);
      }
    };

    initializeMap();

    return () => {
      mounted = false;
      if (mapView.current) {
        mapView.current.destroy();
      }
    };
  }, [onMapClick]);

  // Expose methods to the parent component
  useImperativeHandle(ref, () => ({
    async addCircle(center, radius) {
      if (!mapView.current || !graphicsLayer.current) return;

      try {
        const [Graphic, Point, Polygon, SimpleFillSymbol, SimpleLineSymbol] = await Promise.all([
          import('@arcgis/core/Graphic'),
          import('@arcgis/core/geometry/Point'),
          import('@arcgis/core/geometry/Polygon'),
          import('@arcgis/core/symbols/SimpleFillSymbol'),
          import('@arcgis/core/symbols/SimpleLineSymbol')
        ]);

        // Remove existing circle
        if (circleGraphic.current) {
          graphicsLayer.current.remove(circleGraphic.current);
        }

        // Create circle geometry (approximation using polygon)
        const centerPoint = new Point.default({
          longitude: center.lng,
          latitude: center.lat,
          spatialReference: mapView.current.spatialReference
        });

        // Create circle polygon
        const circle = await createCirclePolygon(centerPoint, radius);

        // Create circle symbol
        const circleSymbol = new SimpleFillSymbol.default({
          color: [255, 0, 0, 0.15],
          outline: new SimpleLineSymbol.default({
            color: [255, 0, 0, 0.8],
            width: 2
          })
        });

        // Create circle graphic
        circleGraphic.current = new Graphic.default({
          geometry: circle,
          symbol: circleSymbol
        });

        graphicsLayer.current.add(circleGraphic.current);

      } catch (error) {
        console.error('Error adding circle:', error);
      }
    },

    clearCircle() {
      if (circleGraphic.current && graphicsLayer.current) {
        graphicsLayer.current.remove(circleGraphic.current);
        circleGraphic.current = null;
      }
    },

    async toggleTraffic(show = true) {
      // Note: Traffic layer implementation would require additional ArcGIS services
      // This is a placeholder for traffic functionality
      console.log('Traffic toggle:', show);
    }
  }));

  // Helper function to create circle polygon
  const createCirclePolygon = async (centerPoint, radiusMeters) => {
    const [Polygon, Point] = await Promise.all([
      import('@arcgis/core/geometry/Polygon'),
      import('@arcgis/core/geometry/Point')
    ]);

    const points = [];
    const numberOfPoints = 60;
    
    // Convert radius from meters to degrees (approximate)
    const radiusDegrees = radiusMeters / 111320; // roughly 111,320 meters per degree

    for (let i = 0; i < numberOfPoints; i++) {
      const angle = (i / numberOfPoints) * 2 * Math.PI;
      const x = centerPoint.longitude + radiusDegrees * Math.cos(angle);
      const y = centerPoint.latitude + radiusDegrees * Math.sin(angle);
      points.push([x, y]);
    }
    
    // Close the polygon
    points.push(points[0]);

    return new Polygon.default({
      rings: [points],
      spatialReference: centerPoint.spatialReference
    });
  };

  // Clear all markers
  const clearMarkers = () => {
    if (graphicsLayer.current && markersGraphics.current.length > 0) {
      markersGraphics.current.forEach(graphic => {
        graphicsLayer.current.remove(graphic);
      });
      markersGraphics.current = [];
    }
  };

  // Add marker for selected location
  const addSelectedLocationMarker = async (location) => {
    if (!mapView.current || !graphicsLayer.current) return;

    try {
      const [Graphic, Point, SimpleMarkerSymbol] = await Promise.all([
        import('@arcgis/core/Graphic'),
        import('@arcgis/core/geometry/Point'),
        import('@arcgis/core/symbols/SimpleMarkerSymbol')
      ]);

      const point = new Point.default({
        longitude: location.lng,
        latitude: location.lat,
        spatialReference: mapView.current.spatialReference
      });

      const markerSymbol = new SimpleMarkerSymbol.default({
        color: [0, 123, 255, 1],
        outline: {
          color: [255, 255, 255, 1],
          width: 3
        },
        size: 16
      });

      const graphic = new Graphic.default({
        geometry: point,
        symbol: markerSymbol,
        attributes: {
          type: 'selected-location',
          title: 'Selected Location'
        }
      });

      graphicsLayer.current.add(graphic);
      markersGraphics.current.push(graphic);

    } catch (error) {
      console.error('Error adding selected location marker:', error);
    }
  };

  // Add markers for search results
  const addSearchResultMarkers = async (placesData) => {
    if (!mapView.current || !graphicsLayer.current || !placesData?.length) return;

    try {
      const [Graphic, Point, SimpleMarkerSymbol, TextSymbol] = await Promise.all([
        import('@arcgis/core/Graphic'),
        import('@arcgis/core/geometry/Point'),
        import('@arcgis/core/symbols/SimpleMarkerSymbol'),
        import('@arcgis/core/symbols/TextSymbol')
      ]);

      for (let i = 0; i < placesData.length; i++) {
        const place = placesData[i];
        const position = place.coordinates;
        
        // Get category color and emoji
        const markerColor = getCategoryColor(place.search_type);
        const emoji = getCategoryEmoji(place.search_type);
        
        const point = new Point.default({
          longitude: position.lng,
          latitude: position.lat,
          spatialReference: mapView.current.spatialReference
        });

        // Create marker symbol with category color
        const markerSymbol = new SimpleMarkerSymbol.default({
          color: hexToRgb(markerColor).concat([1]),
          outline: {
            color: [255, 255, 255, 1],
            width: 2
          },
          size: place.rating ? Math.max(12, place.rating * 3) : 12
        });

        // Create text symbol for emoji
        const textSymbol = new TextSymbol.default({
          text: emoji,
          color: "white",
          haloColor: "black",
          haloSize: 1,
          font: {
            size: 10,
            family: "Arial"
          }
        });

        // Create main marker graphic
        const markerGraphic = new Graphic.default({
          geometry: point,
          symbol: markerSymbol,
          attributes: {
            place_id: place.place_id,
            name: place.name,
            type: place.search_type,
            rating: place.rating,
            title: `${place.name || 'Place'}${place.rating ? ` (⭐${place.rating})` : ''}${place.search_type ? ` [${place.search_type}]` : ''}`
          }
        });

        // Create text graphic for emoji overlay
        const textGraphic = new Graphic.default({
          geometry: point,
          symbol: textSymbol
        });

        graphicsLayer.current.add(markerGraphic);
        graphicsLayer.current.add(textGraphic);
        markersGraphics.current.push(markerGraphic, textGraphic);
      }

    } catch (error) {
      console.error('Error adding search result markers:', error);
    }
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [127, 140, 141]; // Default gray
  };

  // Update markers when data changes
  useEffect(() => {
    const updateMarkers = async () => {
      clearMarkers();
      
      if (selectedLocation) {
        await addSelectedLocationMarker(selectedLocation);
      }
      
      if (searchResultsData && searchResultsData.length > 0) {
        await addSearchResultMarkers(searchResultsData);
      }
    };

    updateMarkers();
  }, [selectedLocation, searchResultsData, onPlaceClick]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearMarkers();
      if (circleGraphic.current && graphicsLayer.current) {
        graphicsLayer.current.remove(circleGraphic.current);
      }
    };
  }, []);

  return (
    <div 
      ref={mapDiv} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative'
      }}
    >
      {/* Loading indicator */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        fontSize: '14px',
        display: mapView.current ? 'none' : 'block'
      }}>
        Loading ArcGIS Map...
      </div>
    </div>
  );
});

export default Map;