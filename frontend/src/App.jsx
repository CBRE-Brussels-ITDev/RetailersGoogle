import React, { useRef, useState } from 'react';
import './index.css';
import Map from './components/Map';
import PlaceDetailsSidebar from './components/PlaceDetailsSidebar';
import CatchmentSidebar from './components/CatchmentSidebar';
import CatchmentAnalysis from './components/CatchmentAnalysis';
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
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
  
  // New catchment-related state
  const [currentLayer, setCurrentLayer] = useState('catchment');
  const [showCatchmentMode, setShowCatchmentMode] = useState(true); // Default to catchment mode
  const [catchmentData, setCatchmentData] = useState([]);

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

  // NEW: Handle catchment calculation
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

  const handleLayerChange = () => {
    setCurrentLayer(prev => prev === 'catchment' ? 'commune' : 'catchment');
  };

  const toggleCatchmentMode = () => {
    setShowCatchmentMode(prev => !prev);
    // Clear existing data when switching modes
    setSearchResults([]);
    setSearchResultsData([]);
    setCatchmentData([]);
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
    if (mapRef.current) {
      mapRef.current.clearCircle();
      mapRef.current.clearCatchments();
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', display: 'flex' }}>
      {/* Left Sidebar - Show different sidebars based on mode */}
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
        />
      )}

      {/* Map Container - Full screen */}
      <div style={{ 
        flex: 1, 
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
          style={{ width: '100%', height: '100%' }}
        />

        {/* Control Panel - Only show mode toggle and clear */}
        <div style={styles.controlPanel}>
          {/* Mode Toggle Button */}
          <button
            onClick={toggleCatchmentMode}
            style={{
              ...styles.modeButton,
              backgroundColor: showCatchmentMode ? '#28a745' : '#dc3545'
            }}
          >
            {showCatchmentMode ? '📊 Catchment Mode' : '🔍 Places Mode'}
          </button>

          {/* Clear Search Button */}
          {(searchResults.length > 0 || selectedLocation || catchmentData.length > 0) && (
            <button
              onClick={clearSearch}
              style={styles.clearButton}
            >
              🗑️ Clear
            </button>
          )}

          {/* Left Sidebar Toggle */}
          <button
            onClick={() => setLeftSidebarVisible(!leftSidebarVisible)}
            style={styles.sidebarToggle}
          >
            {leftSidebarVisible ? '◀' : '▶'} Menu
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

      {/* Right Sidebar for Place Details - Only in places mode */}
      {!showCatchmentMode && isPlaceDetailsSidebarOpen && (
        <PlaceDetailsSidebar
          isOpen={isPlaceDetailsSidebarOpen}
          onClose={() => setIsPlaceDetailsSidebarOpen(false)}
          data={placeDetails}
        />
      )}
    </div>
  );
}

const styles = {
  controlPanel: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    zIndex: 1001
  },
  modeButton: {
    padding: '12px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    transition: 'all 0.2s ease',
    minWidth: '150px'
  },
  clearButton: {
    padding: '10px 16px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
  },
  sidebarToggle: {
    padding: '10px 12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
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
  }
};

export default App;