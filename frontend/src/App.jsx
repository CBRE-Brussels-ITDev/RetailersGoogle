import React, { useRef, useState } from 'react';
import './index.css';
import Map from './components/Map';
import PlaceDetailsSidebar from './components/PlaceDetailsSidebar';
import CatchmentSidebar from './components/CatchmentSidebar';
import CatchmentResultsSidebar from './components/CatchmentResultsSidebar';
import GooglePlacesService from './services/GooglePlaces';

function App() {
  const mapRef = useRef(null);
  
  // Existing state
  const [placeDetails, setPlaceDetails] = useState(null);
  const [isPlaceDetailsSidebarOpen, setIsPlaceDetailsSidebarOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchResultsData, setSearchResultsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(false); // Start with sidebar hidden for cleaner UI
  
  // Catchment-related state
  const [currentLayer, setCurrentLayer] = useState('catchment');
  const [showCatchmentMode, setShowCatchmentMode] = useState(true);
  const [catchmentData, setCatchmentData] = useState([]);
  const [showCatchmentResults, setShowCatchmentResults] = useState(false);

  const handlePlaceClick = async (placeId) => {
    try {
      const response = await GooglePlacesService.getPlaceDetails(placeId);
      console.log('Place Details Response:', response);
      setPlaceDetails(response);
      setIsPlaceDetailsSidebarOpen(true);
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const handleMapClick = (lat, lng) => {
    setSelectedLocation({ lat, lng });
    console.log('Map clicked at:', { lat, lng });
    
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
        mapRef.current.addCircle(selectedLocation, searchParams.radius);
      }

      console.log('Search results:', results);
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
      
      const response = await GooglePlacesService.calculateCatchment(
        selectedLocation,
        params.travelMode,
        params.driveTimes,
        params.showDemographics
      );
      
      console.log('Catchment calculation response:', response);
      
      setCatchmentData(response.catchmentResults || []);
      setShowCatchmentResults(true);
      
      // Add catchment polygons to map
      if (mapRef.current && response.catchmentResults && response.catchmentResults.length > 0) {
        console.log('Adding catchment polygons to map');
        mapRef.current.addCatchmentPolygons(response.catchmentResults);
      }
      
    } catch (error) {
      console.error('Error calculating catchment:', error);
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
    // Clear existing data when switching modes
    setSearchResults([]);
    setSearchResultsData([]);
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
    setCatchmentData([]);
    setShowCatchmentResults(false);
    if (mapRef.current) {
      mapRef.current.clearCircle();
      mapRef.current.clearCatchments();
    }
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
          style={{ width: '100%', height: '100%' }}
        />

        {/* Search Bar - Adjusts position when sidebar is open */}
        <div style={{
          ...styles.searchContainer,
          left: leftSidebarVisible ? '400px' : '20px' // Move right when sidebar is open
        }}>
          <input
            type="text"
            placeholder="Search for a location..."
            style={styles.searchInput}
            className="search-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleLocationSearch(e.target.value);
              }
            }}
          />
        </div>

        {/* Add CSS to remove browser's clear button and improve button interactions */}
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
        `}</style>

        {/* Menu Button - Adjusts position when sidebar is open */}
        <div style={{
          ...styles.menuContainer,
          left: leftSidebarVisible ? '700px' : '320px' // Increased gap from search bar
        }}>
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

        {/* Search Results Counter - Only in places mode */}
        {!showCatchmentMode && searchResultsData.length > 0 && (
          <div style={styles.resultsCounter}>
            <span style={styles.resultsText}>
              📍 {searchResultsData.length} place{searchResultsData.length !== 1 ? 's' : ''} found
            </span>
          </div>
        )}

        {/* Catchment Results Counter - Only in catchment mode */}
        {showCatchmentMode && catchmentData.length > 0 && (
          <div style={styles.resultsCounter}>
            <span style={styles.resultsText}>
              🎯 {catchmentData.length} catchment area{catchmentData.length !== 1 ? 's' : ''} calculated
            </span>
          </div>
        )}
      </div>

      {/* Left Sidebar - Overlays the map */}
      {leftSidebarVisible && (
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
          onGeneratePDF={handleGeneratePDF}
        />
      )}

      {/* Right Sidebar for Place Details - Only in places mode */}
      {!showCatchmentMode && isPlaceDetailsSidebarOpen && (
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
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingContent}>
            <div style={styles.spinner}></div>
            <h3 style={styles.loadingText}>
              {showCatchmentMode ? 'Calculating Catchment...' : 'Loading...'}
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
  menuContainer: {
    position: 'absolute',
    top: '20px',
    // left position will be set dynamically
    zIndex: 1600, // Higher than sidebar z-index (1500)
    transition: 'left 0.3s ease' // Smooth transition when moving
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
  resultsText: {
    backgroundColor: 'rgba(40, 167, 69, 0.9)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
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
  spinner: {
    width: '60px',
    height: '60px',
    border: '6px solid #f3f3f3',
    borderTop: '6px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px'
  },
  loadingText: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0
  }
};

export default App;