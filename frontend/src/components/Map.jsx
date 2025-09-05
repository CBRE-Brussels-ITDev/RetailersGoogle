import { useImperativeHandle, forwardRef, useRef, useEffect, useState } from 'react';
import { getCategoryColor, getCategoryEmoji } from './CategoryIcons';

const Map = forwardRef(({ onPlaceClick, onMapClick, selectedLocation, searchResults, searchResultsData, onClearAll }, ref) => {
  const mapDiv = useRef(null);
  const mapView = useRef(null);
  const graphicsLayer = useRef(null);
  const circleGraphic = useRef(null);
  const selectedLocationGraphic = useRef(null);
  const markersGraphics = useRef([]);
  const catchmentGraphics = useRef([]);
  const businessGraphics = useRef([]);
  const [currentBasemap, setCurrentBasemap] = useState('gray-vector');
  const [showBasemapGallery, setShowBasemapGallery] = useState(false);

  // Basemap options matching the old tool design
  const basemapOptions = [
    { id: 'gray-vector', name: 'Light Gray Canvas', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTAiIGhlaWdodD0iNjUiIHZpZXdCb3g9IjAgMCA5MCA2NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjkwIiBoZWlnaHQ9IjY1IiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg3MFY0NUgyMFYyMFoiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjx0ZXh0IHg9IjQ1IiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNjY2NjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5MaWdodCBHcmF5PC90ZXh0Pgo8L3N2Zz4K' },
    { id: 'dark-gray-vector', name: 'Black Canvas', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTAiIGhlaWdodD0iNjUiIHZpZXdCb3g9IjAgMCA5MCA2NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjkwIiBoZWlnaHQ9IjY1IiBmaWxsPSIjMzMzMzMzIi8+CjxwYXRoIGQ9Ik0yMCAyMEg3MFY0NUgyMFYyMFoiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjx0ZXh0IHg9IjQ1IiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTk5OTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5EYXJrPC90ZXh0Pgo8L3N2Zz4K' },
    { id: 'topo-vector', name: 'Topographic', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTAiIGhlaWdodD0iNjUiIHZpZXdCb3g9IjAgMCA5MCA2NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjkwIiBoZWlnaHQ9IjY1IiBmaWxsPSIjRjBGOEZGIi8+CjxjaXJjbGUgY3g9IjQ1IiBjeT0iMzIiIHI9IjE1IiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSI0NSIgY3k9IjMyIiByPSIxMCIgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz4KPHRleHQgeD0iNDUiIHk9IjUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlRvcG88L3RleHQ+Cjwvc3ZnPgo=' },
    { id: 'streets-vector', name: 'Streets', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTAiIGhlaWdodD0iNjUiIHZpZXdCb3g9IjAgMCA5MCA2NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjkwIiBoZWlnaHQ9IjY1IiBmaWxsPSIjRkZGRkZGIi8+CjxsaW5lIHgxPSIxMCIgeTE9IjMyIiB4Mj0iODAiIHkyPSIzMiIgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2Utd2lkdGg9IjMiLz4KPGxpbmUgeDE9IjQ1IiB5MT0iMTAiIHgyPSI0NSIgeTI9IjU1IiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMyIvPgo8dGV4dCB4PSI0NSIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3RyZWV0czwvdGV4dD4KPC9zdmc+Cg==' },
    { id: 'streets-night-vector', name: 'Streets Night', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTAiIGhlaWdodD0iNjUiIHZpZXdCb3g9IjAgMCA5MCA2NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjkwIiBoZWlnaHQ9IjY1IiBmaWxsPSIjMjIyMjIyIi8+CjxsaW5lIHgxPSIxMCIgeTE9IjMyIiB4Mj0iODAiIHkyPSIzMiIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjMiLz4KPGxpbmUgeDE9IjQ1IiB5MT0iMTAiIHgyPSI0NSIgeTI9IjU1IiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMyIvPgo8dGV4dCB4PSI0NSIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TmlnaHQ8L3RleHQ+Cjwvc3ZnPgo=' }
  ];

  // Change basemap function
  const changeBasemap = async (basemapId) => {
    if (mapView.current && mapView.current.map) {
      mapView.current.map.basemap = basemapId;
      setCurrentBasemap(basemapId);
      console.log('Changed basemap to:', basemapId);
    }
  };

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
        graphicsLayer.current = new GraphicsLayer.default({
          title: "Map Graphics"
        });

        // Create map with minimal UI
        const map = new Map.default({
          basemap: 'gray-vector', // Clean dark basemap
          layers: [graphicsLayer.current]
        });

        console.log('Graphics layer created and added to map');

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

        // Wait for map to load and then set up click handler
        mapView.current.when(() => {
          console.log('Map view loaded successfully');
          console.log('Map layers:', mapView.current.map.layers.length);
          console.log('Graphics layer in map:', mapView.current.map.layers.includes(graphicsLayer.current));
          
          // Set up click handler after map loads
          mapView.current.on('click', (event) => {
            const { longitude, latitude } = event.mapPoint;
            
            console.log('Map clicked - Raw coordinates:', longitude, latitude);
            
            // Check if we clicked on a marker
            mapView.current.hitTest(event).then((response) => {
              console.log('Hit test results:', response.results.length);
              
              if (response.results.length > 0) {
                const graphic = response.results[0].graphic;
                console.log('Graphic clicked:', graphic.attributes);
                
                if (graphic.attributes && graphic.attributes.place_id && onPlaceClick) {
                  console.log('Place clicked with ID:', graphic.attributes.place_id);
                  onPlaceClick(graphic.attributes.place_id);
                  return; // Exit early, don't call map click
                }
              }
              
              // If no marker was clicked, treat as map click
              console.log('No marker clicked, calling map click handler');
              if (onMapClick) {
                onMapClick(latitude, longitude);
              }
            }).catch((error) => {
              console.error('Hit test error:', error);
              // Fallback to map click if hit test fails
              if (onMapClick) {
                onMapClick(latitude, longitude);
              }
            });
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
  }, []); // Remove onMapClick dependency to prevent re-initialization

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

  // Helper function to clear business markers
  const clearBusinessMarkers = () => {
    if (graphicsLayer.current && businessGraphics.current.length > 0) {
      console.log('Clearing business markers:', businessGraphics.current.length);
      businessGraphics.current.forEach(graphic => {
        graphicsLayer.current.remove(graphic);
      });
      businessGraphics.current = [];
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
          spatialReference: {
            wkid: 4326 // WGS84 for decimal degree coordinates
          }
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

    async addCatchmentPolygons(catchmentData, colors = null) {
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
        console.log('Using custom colors:', colors);
        console.log('Graphics layer available:', !!graphicsLayer.current);
        console.log('Map view available:', !!mapView.current);
        console.log('Map view spatial reference:', mapView.current?.spatialReference?.wkid);
        
        const [Graphic, Polygon, SimpleFillSymbol, SimpleLineSymbol, TextSymbol] = await Promise.all([
          import('@arcgis/core/Graphic'),
          import('@arcgis/core/geometry/Polygon'),
          import('@arcgis/core/symbols/SimpleFillSymbol'),
          import('@arcgis/core/symbols/SimpleLineSymbol'),
          import('@arcgis/core/symbols/TextSymbol')
        ]);

        // Clear existing catchment graphics
        clearCatchmentPolygons();

        // Use custom colors from color picker or fallback to default colors
        const defaultColors = [
          { fill: [114, 151, 153, 0.25], stroke: [114, 151, 153, 0.8] },  // First catchment
          { fill: [139, 169, 171, 0.25], stroke: [139, 169, 171, 0.8] },  // Second catchment
          { fill: [176, 195, 196, 0.25], stroke: [176, 195, 196, 0.8] }   // Third catchment
        ];

        // Convert rgba colors to ArcGIS format if provided
        let finalColors = defaultColors;
        if (colors && Array.isArray(colors)) {
          finalColors = colors.map((color, index) => {
            if (typeof color === 'string' && color.includes('rgba')) {
              // Extract RGBA values from rgba string
              const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([^)]+)\)/);
              if (match) {
                const r = parseInt(match[1]);
                const g = parseInt(match[2]);
                const b = parseInt(match[3]);
                const a = parseFloat(match[4]);
                return { 
                  fill: [r, g, b, a * 0.3], // Fill with reduced opacity
                  stroke: [r, g, b, Math.min(a * 1.5, 1.0)] // Stroke with higher opacity
                };
              }
            }
            return defaultColors[index] || defaultColors[0];
          });
        }

        console.log('Final colors for polygons:', finalColors);

        let addedCount = 0;

        for (let index = 0; index < catchmentData.length; index++) {
          const catchment = catchmentData[index];
          console.log(`Processing catchment ${index + 1}: ${catchment.name}`, catchment.geometry);
          
          if (catchment.geometry && catchment.geometry.coordinates && catchment.geometry.coordinates.length > 0) {
            try {
              // Create polygon from coordinates - handle the specific format from your backend
              let coordinates = catchment.geometry.coordinates;
              
              console.log('Raw coordinates for', catchment.name, ':', coordinates);
              
              // Your coordinates are in format: [[[lng, lat], [lng, lat], ...]]
              // We need to ensure they're properly formatted for ArcGIS
              let rings;
              
              if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0]) && typeof coordinates[0][0][0] === 'number') {
                // Format: [[[lng, lat], [lng, lat], ...]] - this is what you have
                rings = coordinates;
                console.log('Using coordinates as rings directly');
              } else if (Array.isArray(coordinates[0]) && typeof coordinates[0][0] === 'number') {
                // Format: [[lng, lat], [lng, lat], ...] - wrap in array
                rings = [coordinates];
                console.log('Wrapping coordinates in array for rings');
              } else {
                console.error('Unexpected coordinate format:', coordinates);
                continue;
              }
              
              const polygon = new Polygon.default({
                rings: rings,
                spatialReference: {
                  wkid: 4326 // Your coordinates are in WGS84 decimal degrees
                }
              });

              console.log('Created polygon for:', catchment.name, 'with', rings.length, 'ring(s)', 'and', rings[0]?.length, 'points');

              // Validate the polygon
              if (!polygon || !polygon.extent) {
                console.error('Invalid polygon created for:', catchment.name);
                continue;
              }

              console.log('Polygon extent:', polygon.extent);

              const color = finalColors[index % finalColors.length];
              const fillSymbol = new SimpleFillSymbol.default({
                color: color.fill,
                outline: new SimpleLineSymbol.default({
                  color: color.stroke,
                  width: 2, // Thinner, more discrete outline
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
              
              console.log(`✅ Successfully added catchment polygon ${addedCount}: ${catchment.name}`);
              console.log('Graphic added to layer, total graphics on layer:', graphicsLayer.current.graphics.length);
              console.log('Graphic geometry:', graphic.geometry);
              console.log('Graphic symbol:', graphic.symbol);

              // Force map to refresh and recognize the new graphic
              mapView.current.requestUpdate();

              // Add label in the center of the polygon - REMOVED per user request
              // const centroid = polygon.centroid;
              // if (centroid) {
              //   const labelSymbol = new TextSymbol.default({
              //     color: "white",
              //     haloColor: color.stroke,
              //     haloSize: 2,
              //     text: catchment.name,
              //     xoffset: 0,
              //     yoffset: 0,
              //     font: {
              //       size: 12, // Smaller, more discrete text
              //       family: "Arial",
              //       weight: "normal" // Less bold
              //     }
              //   });

              //   const labelGraphic = new Graphic.default({
              //     geometry: centroid,
              //     symbol: labelSymbol,
              //     attributes: {
              //       type: 'catchment-label',
              //       driveTime: catchment.name
              //     }
              //   });

              //   graphicsLayer.current.add(labelGraphic);
              //   catchmentGraphics.current.push(labelGraphic);
              //   console.log(`Added label for: ${catchment.name} at:`, centroid.longitude, centroid.latitude);
              // } else {
              //   console.warn('Could not calculate centroid for:', catchment.name);
              // }

            } catch (error) {
              console.error('Error creating polygon for catchment:', catchment.name, error);
            }
          } else {
            console.warn('Invalid geometry for catchment:', catchment.name);
          }
        }

        console.log(`Successfully added ${addedCount} catchment polygons with ${catchmentGraphics.current.length} total graphics`);

        // Force layer visibility and map refresh
        if (graphicsLayer.current) {
          graphicsLayer.current.visible = true;
          console.log('Graphics layer visibility:', graphicsLayer.current.visible);
          console.log('Graphics layer opacity:', graphicsLayer.current.opacity);
        }

        // Force map view to update and redraw
        if (mapView.current) {
          mapView.current.requestUpdate();
          console.log('Requested map view update');
        }

        // Zoom to the extent of all catchment polygons for better visibility
        if (catchmentGraphics.current.length > 0) {
          const polygonGraphics = catchmentGraphics.current.filter(g => g.attributes.type === 'catchment');
          if (polygonGraphics.length > 0) {
            try {
              // Calculate extent of all polygons
              let combinedExtent = null;
              for (const graphic of polygonGraphics) {
                if (graphic.geometry && graphic.geometry.extent) {
                  if (combinedExtent === null) {
                    combinedExtent = graphic.geometry.extent.clone();
                  } else {
                    combinedExtent = combinedExtent.union(graphic.geometry.extent);
                  }
                }
              }
              
              // Zoom to the combined extent with some padding
              if (combinedExtent) {
                mapView.current.goTo({
                  target: combinedExtent.expand(1.2) // 20% padding around the extent
                }).catch(error => {
                  console.warn('Could not auto-zoom to catchment extent:', error);
                });
              }
            } catch (error) {
              console.warn('Error calculating catchment extent for auto-zoom:', error);
            }
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
        businessGraphics.current = [];
      }
    },

    async addBusinessMarkers(businesses) {
      if (!mapView.current || !graphicsLayer.current) {
        console.error('Map view or graphics layer not available');
        return;
      }

      if (!businesses || businesses.length === 0) {
        console.warn('No business data provided');
        return;
      }

      try {
        console.log('Adding business markers, count:', businesses.length);
        
        const [Graphic, Point, SimpleMarkerSymbol, TextSymbol] = await Promise.all([
          import('@arcgis/core/Graphic'),
          import('@arcgis/core/geometry/Point'),
          import('@arcgis/core/symbols/SimpleMarkerSymbol'),
          import('@arcgis/core/symbols/TextSymbol')
        ]);

        // Clear existing business markers
        clearBusinessMarkers();

        let addedCount = 0;

        for (const business of businesses) {
          console.log('Processing business:', business.name);
          console.log('Full business object:', business);
          
          // Handle different data structures - backend returns coordinates property
          let lat, lng;
          if (business.coordinates && business.coordinates.lat && business.coordinates.lng) {
            lat = business.coordinates.lat;
            lng = business.coordinates.lng;
            console.log('Found coordinates property:', lat, lng);
          } else if (business.geometry && business.geometry.location) {
            lat = business.geometry.location.lat;
            lng = business.geometry.location.lng;
            console.log('Found geometry.location:', lat, lng);
          } else if (business.lat && business.lng) {
            lat = business.lat;
            lng = business.lng;
            console.log('Found direct lat/lng:', lat, lng);
          } else if (business.geometry && business.geometry.lat && business.geometry.lng) {
            lat = business.geometry.lat;
            lng = business.geometry.lng;
            console.log('Found geometry.lat/lng:', lat, lng);
          } else if (business.location && business.location.lat && business.location.lng) {
            lat = business.location.lat;
            lng = business.location.lng;
            console.log('Found location.lat/lng:', lat, lng);
          }
          
          if (lat && lng) {
            try {
              // Create point geometry
              const point = new Point.default({
                longitude: lng,
                latitude: lat,
                spatialReference: {
                  wkid: 4326 // WGS84
                }
              });

              console.log('Created point for business:', business.name, 'at:', lat, lng);

              // Create marker symbol
              const markerSymbol = new SimpleMarkerSymbol.default({
                color: [255, 165, 0, 0.8], // Orange color for business markers
                size: 10,
                outline: {
                  color: [255, 255, 255, 0.8],
                  width: 1
                },
                style: "circle"
              });

              // Create marker graphic
              const markerGraphic = new Graphic.default({
                geometry: point,
                symbol: markerSymbol,
                attributes: {
                  type: 'business-marker',
                  businessId: business.place_id,
                  name: business.name,
                  rating: business.rating,
                  distance: business.distance
                }
              });

              graphicsLayer.current.add(markerGraphic);
              businessGraphics.current.push(markerGraphic);

              // Add text label with business name and rating
              const labelSymbol = new TextSymbol.default({
                color: [0, 0, 0, 0.9],
                haloColor: [255, 255, 255, 0.8],
                haloSize: 2,
                text: `${business.name}\n★${business.rating || 'N/A'}`,
                xoffset: 0,
                yoffset: 15, // Offset below the marker
                font: {
                  size: 10,
                  family: "Arial",
                  weight: "normal"
                }
              });

              const labelGraphic = new Graphic.default({
                geometry: point,
                symbol: labelSymbol,
                attributes: {
                  type: 'business-label',
                  businessId: business.place_id
                }
              });

              graphicsLayer.current.add(labelGraphic);
              businessGraphics.current.push(labelGraphic);
              addedCount++;

              console.log(`✅ Successfully added business marker: ${business.name}`);

            } catch (error) {
              console.error('Error creating marker for business:', business.name, error);
            }
          } else {
            console.warn('Invalid geometry for business:', business.name, 'No valid coordinates found');
          }
        }

        console.log(`Successfully added ${addedCount} business markers with ${businessGraphics.current.length} total graphics`);

        // Force map view to update
        if (mapView.current) {
          mapView.current.requestUpdate();
        }

      } catch (error) {
        console.error('Error adding business markers:', error);
      }
    },

    clearBusinessMarkers() {
      clearBusinessMarkers();
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
    
    // Earth's radius in meters
    const EARTH_RADIUS = 6378137;
    
    // Convert center point to radians
    const centerLat = centerPoint.latitude * Math.PI / 180;
    const centerLng = centerPoint.longitude * Math.PI / 180;
    
    // Calculate angular distance
    const angularDistance = radiusMeters / EARTH_RADIUS;

    for (let i = 0; i < numberOfPoints; i++) {
      const bearing = (i / numberOfPoints) * 2 * Math.PI;
      
      // Calculate geodesic point using spherical trigonometry
      const lat = Math.asin(
        Math.sin(centerLat) * Math.cos(angularDistance) +
        Math.cos(centerLat) * Math.sin(angularDistance) * Math.cos(bearing)
      );
      
      const lng = centerLng + Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(centerLat),
        Math.cos(angularDistance) - Math.sin(centerLat) * Math.sin(lat)
      );
      
      // Convert back to degrees
      const latDeg = lat * 180 / Math.PI;
      const lngDeg = lng * 180 / Math.PI;
      
      points.push([lngDeg, latDeg]);
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
        spatialReference: {
          wkid: 4326 // WGS84 since coordinates are in decimal degrees
        }
      });

      // Create a small discrete marker for selected location
      const markerSymbol = new SimpleMarkerSymbol.default({
        color: [255, 0, 0, 1], // Bright red for visibility
        outline: {
          color: [255, 255, 255, 1],
          width: 2
        },
        size: 8, // Small dot size
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
      console.log('Graphics layer now has', graphicsLayer.current.graphics.length, 'graphics');
      
      // Force map to refresh and show the marker
      mapView.current.requestUpdate();

    } catch (error) {
      console.error('Error adding selected location marker:', error);
    }
  };

  // Add markers for search results
  const addSearchResultMarkers = async (placesData) => {
    if (!mapView.current || !graphicsLayer.current || !placesData?.length) return;

    console.log('=== ADDING SEARCH RESULT MARKERS ===');
    console.log('Number of places to add:', placesData.length);
    console.log('Places data:', placesData);

    try {
      const [Graphic, Point, SimpleMarkerSymbol, TextSymbol] = await Promise.all([
        import('@arcgis/core/Graphic'),
        import('@arcgis/core/geometry/Point'),
        import('@arcgis/core/symbols/SimpleMarkerSymbol'),
        import('@arcgis/core/symbols/TextSymbol')
      ]);

      for (let i = 0; i < placesData.length; i++) {
        const place = placesData[i];
        console.log(`Adding marker for place ${i}:`, {
          name: place.name,
          place_id: place.place_id,
          coordinates: place.coordinates
        });
        
        const position = place.coordinates;
        
        // Get category color and emoji
        const markerColor = getCategoryColor(place.search_type);
        const emoji = getCategoryEmoji(place.search_type);
        
        const point = new Point.default({
          longitude: position.lng,
          latitude: position.lat,
          spatialReference: {
            wkid: 4326 // WGS84 for decimal degree coordinates
          }
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
          symbol: textSymbol,
          attributes: {
            place_id: place.place_id,
            name: place.name,
            type: place.search_type,
            isTextOverlay: true
          }
        });

        console.log(`Marker attributes for ${place.name}:`, markerGraphic.attributes);
        console.log(`Text attributes for ${place.name}:`, textGraphic.attributes);

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
  }, [selectedLocation, searchResultsData]);

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
      {/* Map Controls - Basemap Gallery and Clear All Button */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1500,
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start'
      }}>
        {/* Clear All Button */}
        {onClearAll && (selectedLocation || searchResultsData?.length > 0) && (
          <button
            onClick={onClearAll}
            style={{
              backgroundColor: 'rgba(243, 156, 18, 0.9)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: showBasemapGallery ? '10px 16px' : '12px',
              fontSize: showBasemapGallery ? '14px' : '16px',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
              opacity: 0.9,
              width: showBasemapGallery ? 'auto' : '50px',
              height: showBasemapGallery ? 'auto' : '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '45px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(243, 156, 18, 1)';
              e.target.style.opacity = '1';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(243, 156, 18, 0.9)';
              e.target.style.opacity = '0.9';
              e.target.style.transform = 'translateY(0)';
            }}
            title="Clear all data and selections"
          >
            {showBasemapGallery ? '🗑️ Clear' : '🗑️'}
          </button>
        )}
        {/* Basemap Gallery */}
        <div style={{
          backgroundColor: 'rgba(252, 252, 252, 0.9)',
          borderRadius: '8px',
          padding: showBasemapGallery ? '15px' : '8px',
          width: showBasemapGallery ? '280px' : '30px',
          height: showBasemapGallery ? 'auto' : '25px',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: showBasemapGallery ? 'space-between' : 'center',
            marginBottom: showBasemapGallery ? '12px' : '0',
            whiteSpace: 'nowrap',
            height: showBasemapGallery ? 'auto' : '24px'
          }}>
            {showBasemapGallery && (
              <h5 style={{
                margin: 0,
                color: '#333',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                Basemap options:
              </h5>
            )}
            <button
              onClick={() => setShowBasemapGallery(!showBasemapGallery)}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                fontSize: showBasemapGallery ? '14px' : '12px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                opacity: 0.7
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(0,0,0,0.1)';
                e.target.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.opacity = '0.7';
              }}
              title="Change basemap"
            >
              {showBasemapGallery ? '✕' : '🗺️'}
            </button>
          </div>

          {showBasemapGallery && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {basemapOptions.map(basemap => (
                <div key={basemap.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  backgroundColor: currentBasemap === basemap.id ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
                  border: currentBasemap === basemap.id ? '1px solid #007bff' : '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => changeBasemap(basemap.id)}
                onMouseEnter={(e) => {
                  if (currentBasemap !== basemap.id) {
                    e.target.style.backgroundColor = 'rgba(0,0,0,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentBasemap !== basemap.id) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
                >
                  <img
                    src={basemap.thumbnail}
                    alt={basemap.name}
                    style={{
                      width: '70px',
                      height: '50px',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      objectFit: 'cover'
                    }}
                  />
                  <label style={{
                    color: '#333',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textWrap: 'wrap',
                    lineHeight: '1.3'
                  }}>
                    {basemap.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default Map;