import React, { useRef, useState, useEffect } from 'react';
import './index.css';
import Map from './components/Map';
import PlaceDetailsSidebar from './components/PlaceDetailsSidebar';
import CatchmentSidebar from './components/CatchmentSidebar';
import CatchmentResultsSidebar from './components/CatchmentResultsSidebar';
import CommerceAnalysis from './components/CommerceAnalysis';
import CommerceRankingReport from './components/CommerceRankingReport';
import GooglePlacesService from './services/GooglePlaces';

function App() {
  // Add animated dots component
  const JumpingDots = () => {
    const [activeDot, setActiveDot] = useState(0);
    
    useEffect(() => {
      const interval = setInterval(() => {
        setActiveDot(prev => (prev + 1) % 3);
      }, 300);
      
      return () => clearInterval(interval);
    }, []);
    
    return (
      <div style={styles.jumpingDots}>
        {[0, 1, 2].map(index => (
          <div
            key={index}
            style={{
              ...styles.dot,
              transform: activeDot === index ? 'scale(1.3)' : 'scale(0.8)',
              opacity: activeDot === index ? 1 : 0.6,
              transition: 'all 0.3s ease'
            }}
          ></div>
        ))}
      </div>
    );
  };
  const mapRef = useRef(null);
  
  // Existing state
  const [placeDetails, setPlaceDetails] = useState(null);
  const [isPlaceDetailsSidebarOpen, setIsPlaceDetailsSidebarOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchResultsData, setSearchResultsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(''); // New state for address
  const [addressSuggestions, setAddressSuggestions] = useState([]); // Autocomplete suggestions
  const [showSuggestions, setShowSuggestions] = useState(false); // Show/hide suggestions
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true); // Show sidebar by default
  
  // Catchment-related state
  const [currentLayer, setCurrentLayer] = useState('catchment');
  const [showCatchmentMode, setShowCatchmentMode] = useState(true);
  const [catchmentData, setCatchmentData] = useState([]);
  const [showCatchmentResults, setShowCatchmentResults] = useState(false);

  // Commerce Analysis state
  const [showCommerceAnalysis, setShowCommerceAnalysis] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [showRankingReport, setShowRankingReport] = useState(false);

    // Track last place click to prevent reverse geocoding on marker click
    const lastPlaceClickRef = useRef(null);

    const handlePlaceClick = async (placeId) => {
      lastPlaceClickRef.current = Date.now();
      setIsPlaceDetailsSidebarOpen(false); // Close sidebar before loading new details
      setIsLoading(true);
      try {
        const response = await GooglePlacesService.getPlaceDetails(placeId);
        setPlaceDetails(response); // Always pass the full details object to the sidebar
        setIsPlaceDetailsSidebarOpen(true);
      } catch (error) {
        console.error('❌ Error fetching place details:', error);
      } finally {
        setIsLoading(false);
      }
    };

  const handleMapClick = async (lat, lng) => {
    // Prevent reverse geocoding if a place marker was just clicked
    if (lastPlaceClickRef.current && Date.now() - lastPlaceClickRef.current < 300) {
      console.log('Map click ignored due to recent place marker click');
      return;
    }
    setSelectedLocation({ lat, lng });
    console.log('Map clicked at:', { lat, lng });
    // Get address from coordinates using reverse geocoding
    try {
      const address = await GooglePlacesService.reverseGeocode(lat, lng);
      if (address) {
        setSelectedAddress(address);
        console.log('Address found:', address);
      } else {
        // Fallback to coordinates if no address found
        setSelectedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Error getting address:', error);
      // Fallback to coordinates if reverse geocoding fails
      setSelectedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
    // Only clear search results in places mode
    if (!showCatchmentMode) {
      setSearchResults([]);
      setSearchResultsData([]);
      // Clear existing circle when new location is selected
      if (mapRef.current) {
        mapRef.current.clearCircle();
      }
    }
  };

  const handleSearch = async (searchParams) => {
    if (!selectedLocation) {
      alert('Please click on the map to select a location first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Searching with params:', searchParams);
      
      let results;
      if (searchParams.getAllSectors) {
        results = await GooglePlacesService.getPlacesInRadius(
          selectedLocation.lat,
          selectedLocation.lng,
          searchParams.radius,
          null,
          true
        );
      } else {
        results = await GooglePlacesService.getPlacesInRadius(
          selectedLocation.lat,
          selectedLocation.lng,
          searchParams.radius,
          searchParams.category
        );
      }

      setSearchResults(results.placeIds || []);
      setSearchResultsData(results.places || []);
      setLeftSidebarVisible(true);
      
      if (mapRef.current) {
        // Clear any existing circle first
        mapRef.current.clearCircle();
        // Add new circle with correct radius
        mapRef.current.addCircle(selectedLocation, searchParams.radius);
      }

      // Generate demographic catchment data for the search radius circle
      console.log('Generating demographic data for search radius:', searchParams.radius);
      try {
        const catchmentResponse = await GooglePlacesService.calculateCatchment(
          selectedLocation,
          'driving', // Default travel mode for radius search
          [Math.ceil(searchParams.radius / 1000 * 2)], // Convert radius to approximate drive time
          true // Show demographics
        );
        
        if (catchmentResponse.catchmentResults && catchmentResponse.catchmentResults.length > 0) {
          // Create catchment data with the search radius information
          const radiusCatchmentData = [{
            ...catchmentResponse.catchmentResults[0],
            name: `${searchParams.radius}m radius`,
            searchRadius: searchParams.radius,
            isRadiusSearch: true,
            driveTime: Math.ceil(searchParams.radius / 1000 * 2) // Approximate drive time
          }];
          
          setCatchmentData(radiusCatchmentData);
          console.log('Generated radius catchment data:', radiusCatchmentData);
        }
      } catch (catchmentError) {
        console.error('Error generating catchment data for radius search:', catchmentError);
        // Continue without catchment data if it fails
      }

      console.log('Search results:', results);

      // Automatically trigger commerce analysis after search
      if (results.places && results.places.length > 0) {
        console.log('Auto-triggering commerce analysis...');
        handleShowCommerceAnalysis();
      }

    } catch (error) {
      console.error('Error searching places:', error);
      alert('Error searching places. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced catchment calculation
  const handleCatchmentCalculation = async (params) => {
    if (!selectedLocation) {
      alert('Please click on the map to select a location first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Calculating catchment with params:', params);
      console.log('FRONTEND: Sending ArcGIS catchment request to server...');

      // Map frontend travel modes to ArcGIS travel modes
      const travelModeMapping = {
        'driving': 'Driving Time',
        'walking': 'Walking Time'
      };
      const arcgisTravelMode = travelModeMapping[params.travelMode] || 'Driving Time';
      console.log('Mapped travel mode:', params.travelMode, '->', arcgisTravelMode);

      // Call ArcGIS catchment function instead of legacy
      const arcgisResponse = await GooglePlacesService.getArcgisCatchment(
        selectedLocation,
        params.driveTimes,
        arcgisTravelMode
      );
      console.log('ArcGIS catchment response:', arcgisResponse);

      // Set polygons to state and map
      if (arcgisResponse.polygons && arcgisResponse.polygons.length > 0) {
        setCatchmentData(arcgisResponse.polygons);
        setShowCatchmentResults(true);
        if (mapRef.current) {
          mapRef.current.addCatchmentPolygons(arcgisResponse.polygons, params.colors);
        }
      } else {
        alert('No catchment polygons returned from ArcGIS.');
      }
    } catch (error) {
      console.error('Error calculating ArcGIS catchment:', error);
      alert('Error calculating catchment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle location search
  const handleLocationSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      console.log('Searching for location:', searchQuery);

      // Use Nominatim for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        setSelectedLocation({ lat, lng });
        setSelectedAddress(result.display_name); // Set the address from search result
        console.log('Found location:', { lat, lng, name: result.display_name });

        // Center map on the found location
        if (mapRef.current && mapRef.current.getMapView) {
          const mapView = mapRef.current.getMapView();
          if (mapView) {
            mapView.goTo({
              center: [lng, lat],
              zoom: 14
            });
          }
        }
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Error searching for location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLayerChange = () => {
    setCurrentLayer(prev => prev === 'catchment' ? 'commune' : 'catchment');
  };

  const toggleCatchmentMode = () => {
    setShowCatchmentMode(prev => !prev);
    // Clear catchment-specific data when switching modes, but keep place search results
    setCatchmentData([]);
    setShowCatchmentResults(false);
    if (mapRef.current) {
      mapRef.current.clearCircle();
      mapRef.current.clearCatchments();
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
    setSearchResultsData([]);
    setSelectedLocation(null);
    setSelectedAddress(''); // Clear the address as well
    setCatchmentData([]);
    setShowCatchmentResults(false);
    if (mapRef.current) {
      mapRef.current.clearCircle();
      mapRef.current.clearCatchments();
    }
  };

  // Handle address input changes and get suggestions
  const handleAddressChange = async (value) => {
    setSelectedAddress(value);
    
    if (value.trim().length >= 3) {
      try {
        const suggestions = await GooglePlacesService.getAddressSuggestions(value);
        setAddressSuggestions(suggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error getting address suggestions:', error);
        setAddressSuggestions([]);
      }
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion) => {
    try {
      const placeDetails = await GooglePlacesService.getPlaceDetails(suggestion.place_id);
      if (placeDetails) {
        setSelectedLocation({ lat: placeDetails.lat, lng: placeDetails.lng });
        setSelectedAddress(suggestion.description);
        setShowSuggestions(false);
        setAddressSuggestions([]);
        
        // Center map on selected location
        if (mapRef.current && mapRef.current.getMapView) {
          const mapView = mapRef.current.getMapView();
          if (mapView) {
            mapView.goTo({
              center: [placeDetails.lng, placeDetails.lat],
              zoom: 14
            });
          }
        }
        
        console.log('Selected address:', suggestion.description);
        console.log('Coordinates:', { lat: placeDetails.lat, lng: placeDetails.lng });
      }
    } catch (error) {
      console.error('Error selecting suggestion:', error);
    }
  };

  // Hide suggestions when clicking outside
  const handleInputBlur = () => {
    // Delay hiding to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Generate PDF report
  const handleGeneratePDF = async () => {
    if (!catchmentData || catchmentData.length === 0) {
      alert('No catchment data available to generate PDF');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get map image URL with optimized quality
      let mapImageUrl = null;
      if (mapRef.current && mapRef.current.getMapView) {
        const mapView = mapRef.current.getMapView();
        if (mapView) {
          try {
            const screenshot = await mapView.takeScreenshot({
              format: 'jpg', // Use JPG for better compression
              quality: 75,   // Reduce quality to decrease size
              width: 600,    // Reduce dimensions
              height: 400
            });
            mapImageUrl = screenshot.dataUrl;
            console.log('Map screenshot captured successfully');
            
            // Log the approximate size of the image data
            const imageSizeKB = Math.round((mapImageUrl.length * 0.75) / 1024);
            console.log(`Map image size: ~${imageSizeKB} KB`);
            
            // If image is still too large, compress further
            if (imageSizeKB > 200) {
              console.log('Image too large, taking smaller screenshot');
              const smallerScreenshot = await mapView.takeScreenshot({
                format: 'jpg',
                quality: 60,
                width: 400,
                height: 300
              });
              mapImageUrl = smallerScreenshot.dataUrl;
            }
          } catch (error) {
            console.warn('Could not capture map screenshot:', error);
          }
        }
      }

      // Get location name from reverse geocoding or use coordinates
      let locationName = selectedLocation ? `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}` : 'Selected Location';
      
      // Try to get address from reverse geocoding
      if (selectedLocation) {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedLocation.lat}&lon=${selectedLocation.lng}&addressdetails=1`);
          const geocodeData = await response.json();
          if (geocodeData && geocodeData.display_name) {
            locationName = geocodeData.display_name;
            console.log('Location name from geocoding:', locationName);
          }
        } catch (error) {
          console.warn('Could not get location name from geocoding:', error);
        }
      }

      await GooglePlacesService.generateCatchmentReport(
        catchmentData,
        locationName,
        mapImageUrl
      );
      
      console.log('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Excel Export Handlers
  const handleExportPlacesExcel = async () => {
    if (!searchResultsData || searchResultsData.length === 0) {
      alert('No places data available to export');
      return;
    }

    try {
      setIsLoading(true);
      await GooglePlacesService.exportPlacesToExcel(searchResultsData);
    } catch (error) {
      console.error('Error exporting places to Excel:', error);
      alert('Error exporting places to Excel. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCatchmentExcel = async () => {
    if (!catchmentData || catchmentData.length === 0) {
      alert('No catchment data available to export');
      return;
    }

    console.log('Exporting catchment with places data:', {
      catchmentCount: catchmentData.length,
      placesCount: searchResultsData?.length,
      selectedLocation
    });

    try {
      setIsLoading(true);
      await GooglePlacesService.exportCatchmentToExcel(catchmentData, selectedLocation, searchResultsData);
    } catch (error) {
      console.error('Error exporting catchment to Excel:', error);
      alert('Error exporting catchment to Excel. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Commerce Analysis Handlers
  const handleShowCommerceAnalysis = () => {
    console.log('FRONTEND: handleShowCommerceAnalysis called');
    console.log('FRONTEND: selectedLocation:', selectedLocation);
    console.log('FRONTEND: searchResultsData:', searchResultsData);
    console.log('FRONTEND: catchmentData:', catchmentData);
    
    if (!selectedLocation) {
      alert('Please select a location first');
      return;
    }
    // Removed the alert for places search requirement
    // The analysis can work with or without places data

        // Determine analysis type based on available data
    const hasPlacesData = searchResultsData && searchResultsData.length > 0;
    const hasCatchmentData = catchmentData && catchmentData.length > 0;
    
    console.log('FRONTEND: hasPlacesData:', hasPlacesData, 'count:', searchResultsData?.length);
    console.log('FRONTEND: hasCatchmentData:', hasCatchmentData, 'count:', catchmentData?.length);
    
    // Use catchment data if available, otherwise use places data
    let analysisData = [];
    let dataSource = 'location_only';
    
    if (hasCatchmentData) {
      // For radius searches, we have both places and demographic catchment data
      console.log('FRONTEND: Using catchment data for analysis');
      if (hasPlacesData) {
        analysisData = searchResultsData;
        dataSource = 'radius_catchment_intersection'; // New data source type
      } else {
        analysisData = [];
        dataSource = 'catchment_only';
      }
    } else if (hasPlacesData) {
      console.log('FRONTEND: Using places data for analysis');
      analysisData = searchResultsData;
      dataSource = 'places_search';
    }

    console.log('FRONTEND: analysisData length:', analysisData.length);
    console.log('FRONTEND: dataSource:', dataSource);

    const isCompleteMarketScan = analysisData.length > 100 || 
                                (analysisData.some(place => !place.search_type) || 
                                 new Set(analysisData.map(p => p.search_type)).size > 10);
    
    // Get primary business category from analysis data
    const businessCategories = analysisData.map(place => place.search_type).filter(Boolean);
    const primaryCategory = businessCategories.length > 0 ? 
      businessCategories.reduce((a, b, i, arr) => 
        arr.filter(c => c === a).length >= arr.filter(c => c === b).length ? a : b
      ) : 'general_business';

    // Create analysis results object directly
    const directAnalysisResults = {
      analysisType: isCompleteMarketScan ? 'comprehensive_commerce' : 'commerce_location',
      businessCategory: primaryCategory,
      totalPlaces: analysisData.length,
      location: selectedLocation,
      places: analysisData,
      dataSource: dataSource, // Track where the data came from
      analysisDate: new Date().toISOString(),
      catchmentData: hasCatchmentData ? catchmentData : null, // Include catchment data if available
      summary: {
        totalBusinesses: analysisData.length,
        primaryCategory: primaryCategory?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        averageRating: analysisData.filter(p => p.rating).reduce((sum, p) => sum + p.rating, 0) / analysisData.filter(p => p.rating).length || 0,
        highRatedCount: analysisData.filter(p => p.rating >= 4.0).length,
        dataSource: dataSource,
        categoryBreakdown: businessCategories.reduce((acc, cat) => {
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {})
      }
    };

    // Set the analysis results and go directly to ranking report
    setAnalysisResults(directAnalysisResults);
    setShowRankingReport(true);
    
    console.log('FRONTEND: Direct commerce analysis created:', directAnalysisResults);
  };

  const handleCommerceAnalysisComplete = (results) => {
    setAnalysisResults(results);
    console.log('Commerce analysis completed:', results);
  };

  const handleShowRankingReport = () => {
    if (!analysisResults) {
      alert('Please complete the commerce analysis first');
      return;
    }
    setShowRankingReport(true);
  };

  const handleExportCommerceReport = async (exportType, reportData) => {
    if (!reportData) {
      alert('No report data available');
      return;
    }

    try {
      setIsLoading(true);
      
      // Determine commerce type from analysis results
      const commerceType = reportData.analysisType === 'comprehensive_commerce' ? 
        'comprehensive_commerce' : 'retail_commerce';
      
      if (exportType === 'pdf') {
        // Generate commerce analysis PDF report with correct type
        await GooglePlacesService.generateCommerceReport(
          reportData, 
          commerceType,
          selectedLocation ? `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}` : 'Selected Location'
        );
      } else if (exportType === 'excel') {
        // Export detailed analysis to Excel - use data from report instead of searchResultsData
        const exportData = reportData.places || searchResultsData || [];
        await GooglePlacesService.exportPlacesToExcel(exportData, {
          location: selectedLocation,
          analysisResults: reportData,
          analysisType: commerceType,
          dataSource: reportData.dataSource || 'places_search',
          catchmentData: reportData.catchmentData || null
        });
      }
      
      console.log(`${exportType.toUpperCase()} export completed successfully for ${commerceType}`);
    } catch (error) {
      console.error(`Error exporting ${exportType}:`, error);
      alert(`Error exporting ${exportType}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
      
      {/* Map Container - Full screen */}
      <div style={{ 
        width: '100%',
        height: '100%',
        position: 'relative',
        margin: 0,
        padding: 0
      }}>
        <Map
          ref={mapRef}
          onPlaceClick={handlePlaceClick}
          onMapClick={handleMapClick}
          selectedLocation={selectedLocation}
          searchResults={searchResults}
          searchResultsData={searchResultsData}
          catchmentData={catchmentData}
          onClearAll={clearSearch}
          style={{ width: '100%', height: '100%' }}
        />

        {/* Search Bar with Autocomplete - Adjusts position when sidebar is open */}
        <div style={{
          ...styles.searchContainer,
          left: leftSidebarVisible ? '400px' : '20px' // Move right when sidebar is open
        }}>
          <div style={styles.searchInputContainer}>
            <input
              type="text"
              placeholder="Type a street address..."
              value={selectedAddress}
              onChange={(e) => handleAddressChange(e.target.value)}
              onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
              onBlur={handleInputBlur}
              style={styles.searchInput}
              className="search-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (addressSuggestions.length > 0) {
                    handleSuggestionSelect(addressSuggestions[0]);
                  } else {
                    handleLocationSearch(e.target.value);
                  }
                }
              }}
            />
            
            {/* Autocomplete Suggestions Dropdown */}
            {showSuggestions && addressSuggestions.length > 0 && (
              <div style={styles.suggestionsDropdown}>
                {addressSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.place_id}
                    style={styles.suggestionItem}
                    onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div style={styles.suggestionMain}>{suggestion.main_text}</div>
                    <div style={styles.suggestionSecondary}>{suggestion.secondary_text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Menu Button - Inside search container for proper alignment */}
          <button
            onClick={() => setLeftSidebarVisible(!leftSidebarVisible)}
            style={{
              ...styles.menuButton,
              ...(leftSidebarVisible ? styles.menuButtonActive : {})
            }}
            className="menu-button"
            title={leftSidebarVisible ? 'Hide Menu' : 'Show Menu'}
          >
            ☰
          </button>
        </div>

        {/* Add CSS for button interactions */}
        <style>{`
          input[type="text"]::-webkit-search-cancel-button,
          input[type="text"]::-webkit-search-decoration,
          input[type="text"]::-webkit-search-results-button,
          input[type="text"]::-webkit-search-results-decoration {
            -webkit-appearance: none;
          }
          input[type="text"]::-ms-clear,
          input[type="text"]::-ms-reveal {
            display: none;
            width: 0;
            height: 0;
          }
          .menu-button:hover {
            background-color: rgba(255, 255, 255, 1) !important;
            transform: scale(1.05);
            box-shadow: 0 4px 15px rgba(0,0,0,0.25) !important;
          }
          .search-input:focus {
            transform: scale(1.02);
            box-shadow: 0 4px 15px rgba(0,123,255,0.3) !important;
          }
          button:hover {
            transform: translateY(-1px);
          }
          .analysis-button:hover, .ranking-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,123,255,0.4) !important;
          }
          .export-button:hover {
            background-color: rgba(255, 255, 255, 0.3) !important;
            transform: translateY(-1px);
            border-color: rgba(255, 255, 255, 0.5) !important;
          }
        `}</style>

      {/* Search Results Counter - Only in places mode with enhanced analysis */}
      {!showCatchmentMode && searchResultsData.length > 0 && (
        <div style={styles.resultsCounter}>
          <div style={styles.resultsInfo}>
            <span style={styles.resultsText}>
              📍 {searchResultsData.length} place{searchResultsData.length !== 1 ? 's' : ''} found
            </span>
            <div style={styles.quickExportActions}>
              <button
                onClick={() => handleExportCommerceReport('pdf', analysisResults || { places: searchResultsData, location: selectedLocation })}
                style={styles.exportButton}
                title="Export PDF Report"
              >
                📄 PDF
              </button>
              <button
                onClick={() => handleExportCommerceReport('excel', analysisResults || { places: searchResultsData, location: selectedLocation })}
                style={styles.exportButton}
                title="Export Excel Analysis"
              >
                📊 Excel
              </button>
            </div>
          </div>
        </div>
      )}        {/* Catchment Results Counter - Only in catchment mode */}
        {showCatchmentMode && catchmentData.length > 0 && (
          <div style={styles.resultsCounter}>
            <span style={styles.resultsText}>
              🎯 {catchmentData.length} catchment area{catchmentData.length !== 1 ? 's' : ''} calculated
            </span>
          </div>
        )}
      </div>

      {/* Left Sidebar - Always visible */}
      <CatchmentSidebar
        visible={leftSidebarVisible}
        places={showCatchmentMode ? [] : searchResultsData}
        onPlaceClick={handlePlaceClick}
        onClose={() => setLeftSidebarVisible(false)}
        selectedLocation={selectedLocation}
        isLoading={isLoading}
        currentLayer={currentLayer}
        onSearch={showCatchmentMode ? null : handleSearch}
        onCatchmentCalculate={showCatchmentMode ? handleCatchmentCalculation : null}
        resultsCount={searchResults.length}
        showCatchmentMode={showCatchmentMode}
        catchmentData={catchmentData}
        onClearAll={clearSearch}
        onToggleMode={toggleCatchmentMode}
        onShowCommerceAnalysis={!showCatchmentMode ? handleShowCommerceAnalysis : null}
      />

      {/* Right Sidebar for Place Details - Available in both modes */}
      {isPlaceDetailsSidebarOpen && (
        <PlaceDetailsSidebar
          isOpen={isPlaceDetailsSidebarOpen}
          onClose={() => setIsPlaceDetailsSidebarOpen(false)}
          data={placeDetails}
        />
      )}

      {/* Right Sidebar for Catchment Results - Only in catchment mode */}
      {showCatchmentMode && showCatchmentResults && catchmentData.length > 0 && (
        <CatchmentResultsSidebar
          isOpen={showCatchmentResults}
          onClose={() => setShowCatchmentResults(false)}
          catchmentData={catchmentData}
          selectedLocation={selectedLocation}
          onGeneratePDF={handleGeneratePDF}
          isGeneratingPDF={isLoading}
          onExportCatchmentExcel={handleExportCatchmentExcel}
          onExportPlacesExcel={handleExportPlacesExcel}
          placesData={searchResultsData}
        />
      )}

      {/* Commerce Analysis Modal - Only in places mode */}
      {!showCatchmentMode && showCommerceAnalysis && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>🏪 Commerce Location Analysis</h3>
              <button 
                onClick={() => setShowCommerceAnalysis(false)}
                style={styles.modalCloseButton}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <CommerceAnalysis
                selectedLocation={selectedLocation}
                places={searchResultsData}
                catchmentData={catchmentData}
                onGenerateReport={handleCommerceAnalysisComplete}
              />
              {analysisResults && (
                <div style={styles.analysisActions}>
                  <button
                    onClick={handleShowRankingReport}
                    style={styles.rankingButton}
                  >
                    📈 View Detailed Ranking Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Commerce Ranking Report Modal */}
      {showRankingReport && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>📊 Comprehensive Commerce Ranking</h3>
              <button 
                onClick={() => setShowRankingReport(false)}
                style={styles.modalCloseButton}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <CommerceRankingReport
                selectedLocation={selectedLocation}
                places={searchResultsData}
                catchmentData={catchmentData}
                analysisResults={analysisResults}
                onExportReport={handleExportCommerceReport}
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingContent}>
            <JumpingDots />
            <h3 style={styles.loadingText}>
              {showCatchmentMode ? 'Calculating Catchment...' : ''}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  searchContainer: {
    position: 'absolute',
    top: '20px',
    // left position will be set dynamically
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
    zIndex: 1600, // Higher than sidebar z-index (1500)
    transition: 'left 0.3s ease' // Smooth transition when moving
  },
  searchInput: {
    padding: '12px 18px',
    border: 'none',
    borderRadius: '25px',
    fontSize: '14px',
    outline: 'none',
    boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
    width: '260px',
    backgroundColor: 'white',
    transition: 'all 0.3s ease',
    // Remove browser's default clear button
    WebkitAppearance: 'none',
    MozAppearance: 'textfield',
    fontWeight: '400',
    color: '#333'
  },
  searchInputContainer: {
    position: 'relative',
    display: 'inline-block'
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    zIndex: 1001,
    maxHeight: '300px',
    overflowY: 'auto',
    marginTop: '5px'
  },
  suggestionItem: {
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.2s ease',
    ':hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  suggestionMain: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '2px'
  },
  suggestionSecondary: {
    fontSize: '12px',
    color: '#666'
  },
  menuButton: {
    width: '40px',    // Reduced from 48px
    height: '40px',   // Reduced from 48px
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    color: '#333',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '16px',  // Reduced from 18px
    fontWeight: 'bold',
    boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)'
  },
  menuButtonActive: {
    backgroundColor: '#007bff',
    color: 'white',
    boxShadow: '0 4px 15px rgba(0,123,255,0.4)'
  },
  resultsCounter: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    zIndex: 1000
  },
  resultsInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(40, 167, 69, 0.9)',
    padding: '12px 20px',
    borderRadius: '25px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    gap: '15px'
  },
  quickExportActions: {
    display: 'flex',
    gap: '8px'
  },
  exportButton: {
    padding: '6px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    backdropFilter: 'blur(5px)'
  },
  resultsText: {
    color: 'white',
    fontSize: '13px',
    fontWeight: '600'
  },
  analysisButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 6px rgba(0,123,255,0.3)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2500,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    maxWidth: '95vw',
    maxHeight: '95vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
    borderBottom: '1px solid #e9ecef',
    backgroundColor: '#f8f9fa'
  },
  modalCloseButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6c757d',
    padding: '5px'
  },
  modalBody: {
    flex: 1,
    overflow: 'auto',
    padding: '0'
  },
  analysisActions: {
    padding: '20px',
    borderTop: '1px solid #e9ecef',
    backgroundColor: '#f8f9fa',
    textAlign: 'center'
  },
  rankingButton: {
    padding: '12px 30px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    boxShadow: '0 3px 10px rgba(40,167,69,0.3)'
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000
  },
  loadingContent: {
    textAlign: 'center',
    color: 'white'
  },
  jumpingDots: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px'
  },
  dot: {
    width: '12px',
    height: '12px',
    margin: '0 5px',
    backgroundColor: '#007bff',
    borderRadius: '50%',
    display: 'inline-block'
  },
  loadingText: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0
  }
};

export default App;