import { useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import { getCategoryColor, getCategoryEmoji } from './CategoryIcons';

const Map = forwardRef(({ onPlaceClick, onMapClick, selectedLocation, searchResults, searchResultsData }, ref) => {
  const mapDiv = useRef(null);
  const mapView = useRef(null);
  const graphicsLayer = useRef(null);
  const circleGraphic = useRef(null);
  const selectedLocationGraphic = useRef(null);
  const markersGraphics = useRef([]);
  const catchmentGraphics = useRef([]);

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

        // Create map with minimal UI
        const map = new Map.default({
          basemap: 'dark-gray-vector', // Clean dark basemap
          layers: [graphicsLayer.current]
        });

        // Create map view with minimal UI
        mapView.current = new MapView.default({
          container: mapDiv.current,
          map: map,
          center: [4.3517, 50.8503], // Brussels coordinates [lng, lat]
          zoom: 10,
          ui: {
            components: [] // Remove all UI components
          },
          // Remove default padding
          padding: {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
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
            // Don't clear catchment polygons when clicking map - let user choose
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

  // Helper function to clear catchment polygons
  const clearCatchmentPolygons = () => {
    if (graphicsLayer.current && catchmentGraphics.current.length > 0) {
      console.log('Clearing catchment polygons:', catchmentGraphics.current.length);
      catchmentGraphics.current.forEach(graphic => {
        graphicsLayer.current.remove(graphic);
      });
      catchmentGraphics.current = [];
    }
  };

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

    async addCatchmentPolygons(catchmentData) {
      if (!mapView.current || !graphicsLayer.current) {
        console.error('Map view or graphics layer not available');
        return;
      }

      if (!catchmentData || catchmentData.length === 0) {
        console.warn('No catchment data provided');
        return;
      }

      try {
        console.log('Adding catchment polygons, count:', catchmentData.length);
        
        const [Graphic, Polygon, SimpleFillSymbol, SimpleLineSymbol, TextSymbol] = await Promise.all([
          import('@arcgis/core/Graphic'),
          import('@arcgis/core/geometry/Polygon'),
          import('@arcgis/core/symbols/SimpleFillSymbol'),
          import('@arcgis/core/symbols/SimpleLineSymbol'),
          import('@arcgis/core/symbols/TextSymbol')
        ]);

        // Clear existing catchment graphics
        clearCatchmentPolygons();

        // Colors for different drive times with better visibility
        const colors = [
          { fill: [0, 123, 255, 0.3], stroke: [0, 123, 255, 0.9] },      // Blue for first time
          { fill: [255, 193, 7, 0.3], stroke: [255, 193, 7, 0.9] },      // Amber for second time
          { fill: [220, 53, 69, 0.3], stroke: [220, 53, 69, 0.9] },      // Red for third time
          { fill: [40, 167, 69, 0.3], stroke: [40, 167, 69, 0.9] },      // Green for fourth time
          { fill: [102, 16, 242, 0.3], stroke: [102, 16, 242, 0.9] },    // Purple for fifth time
          { fill: [255, 99, 132, 0.3], stroke: [255, 99, 132, 0.9] }     // Pink for sixth time
        ];

        let addedCount = 0;

        for (let index = 0; index < catchmentData.length; index++) {
          const catchment = catchmentData[index];
          console.log(`Processing catchment ${index + 1}: ${catchment.name}`, catchment.geometry);
          
          if (catchment.geometry && catchment.geometry.coordinates && catchment.geometry.coordinates.length > 0) {
            try {
              // Create polygon from coordinates
              const polygon = new Polygon.default({
                rings: catchment.geometry.coordinates,
                spatialReference: mapView.current.spatialReference
              });

              console.log('Created polygon for:', catchment.name);

              const color = colors[index % colors.length];
              const fillSymbol = new SimpleFillSymbol.default({
                color: color.fill,
                outline: new SimpleLineSymbol.default({
                  color: color.stroke,
                  width: 3,
                  style: 'solid'
                })
              });

              const graphic = new Graphic.default({
                geometry: polygon,
                symbol: fillSymbol,
                attributes: {
                  driveTime: catchment.name,
                  population: catchment.totalPopulation,
                  type: 'catchment'
                }
              });

              graphicsLayer.current.add(graphic);
              catchmentGraphics.current.push(graphic);
              addedCount++;

              // Add label in the center of the polygon
              const centroid = polygon.centroid;
              if (centroid) {
                const labelSymbol = new TextSymbol.default({
                  color: "white",
                  haloColor: color.stroke,
                  haloSize: 2,
                  text: catchment.name,
                  xoffset: 0,
                  yoffset: 0,
                  font: {
                    size: 16,
                    family: "Arial",
                    weight: "bold"
                  }
                });

                const labelGraphic = new Graphic.default({
                  geometry: centroid,
                  symbol: labelSymbol,
                  attributes: {
                    type: 'catchment-label',
                    driveTime: catchment.name
                  }
                });

                graphicsLayer.current.add(labelGraphic);
                catchmentGraphics.current.push(labelGraphic);
              }

            } catch (error) {
              console.error('Error creating polygon for catchment:', catchment.name, error);
            }
          } else {
            console.warn('Invalid geometry for catchment:', catchment.name);
          }
        }

        console.log(`Successfully added ${addedCount} catchment polygons with ${catchmentGraphics.current.length} total graphics`);

        // Zoom to the extent of all catchment polygons
        if (catchmentGraphics.current.length > 0) {
          const polygonGraphics = catchmentGraphics.current.filter(g => g.attributes.type === 'catchment');
          if (polygonGraphics.length > 0) {
            const allGeometries = polygonGraphics.map(g => g.geometry);
            const extent = await mapView.current.extent;
            // You could add auto-zoom here if needed
          }
        }

      } catch (error) {
        console.error('Error adding catchment polygons:', error);
      }
    },

    clearCircle() {
      if (circleGraphic.current && graphicsLayer.current) {
        graphicsLayer.current.remove(circleGraphic.current);
        circleGraphic.current = null;
      }
    },

    clearCatchments() {
      clearCatchmentPolygons();
    },

    clearAll() {
      if (graphicsLayer.current) {
        graphicsLayer.current.removeAll();
        circleGraphic.current = null;
        selectedLocationGraphic.current = null;
        markersGraphics.current = [];
        catchmentGraphics.current = [];
      }
    },

    getMapView() {
      return mapView.current;
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

  // Clear selected location marker
  const clearSelectedLocation = () => {
    if (selectedLocationGraphic.current && graphicsLayer.current) {
      graphicsLayer.current.remove(selectedLocationGraphic.current);
      selectedLocationGraphic.current = null;
    }
  };

  // Add marker for selected location with improved visibility
  const addSelectedLocationMarker = async (location) => {
    if (!mapView.current || !graphicsLayer.current) return;

    try {
      const [Graphic, Point, SimpleMarkerSymbol] = await Promise.all([
        import('@arcgis/core/Graphic'),
        import('@arcgis/core/geometry/Point'),
        import('@arcgis/core/symbols/SimpleMarkerSymbol')
      ]);

      // Remove existing selected location marker
      clearSelectedLocation();

      const point = new Point.default({
        longitude: location.lng,
        latitude: location.lat,
        spatialReference: mapView.current.spatialReference
      });

      // Create a more visible marker for selected location
      const markerSymbol = new SimpleMarkerSymbol.default({
        color: [255, 0, 0, 1], // Bright red for better visibility
        outline: {
          color: [255, 255, 255, 1],
          width: 4
        },
        size: 20,
        style: 'circle'
      });

      const graphic = new Graphic.default({
        geometry: point,
        symbol: markerSymbol,
        attributes: {
          type: 'selected-location',
          title: 'Selected Location',
          coordinates: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
        }
      });

      graphicsLayer.current.add(graphic);
      selectedLocationGraphic.current = graphic;

      console.log('Added selected location marker at:', location);

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
      clearSelectedLocation();
      if (circleGraphic.current && graphicsLayer.current) {
        graphicsLayer.current.remove(circleGraphic.current);
      }
      clearCatchmentPolygons();
    };
  }, []);

  return (
    <div 
      ref={mapDiv} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        margin: 0,
        padding: 0
      }}
    >
      {/* Minimal loading indicator */}
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
        Loading Map...
      </div>
    </div>
  );
});

export default Map;