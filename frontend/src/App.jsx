import React, { useRef, useState } from 'react';
import './index.css';
import Map from './components/Map';
import Modal from './components/Modal';
import SearchPanel from './components/SearchPanel';
import CatchmentSidebar from './components/CatchmentSidebar'; // New enhanced sidebar
import CatchmentAnalysis from './components/CatchmentAnalysis'; // New catchment component
import GooglePlacesService from './services/GooglePlaces';

function App() {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef(null);
  
  // Existing state
  const [placeDetails, setPlaceDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchResultsData, setSearchResultsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true); // Changed to true by default
  
  // New catchment-related state
  const [currentLayer, setCurrentLayer] = useState('catchment'); // 'catchment' or 'commune'
  const [showCatchmentMode, setShowCatchmentMode] = useState(false);
  const [catchmentData, setCatchmentData] = useState([]);
  
  // Mock user data - replace with actual authentication
  const [user] = useState({
    firstName: 'John',
    lastName: 'Doe',
    location: 'Brussels, Belgium'
  });

  const handlePlaceClick = async (placeId) => {
    try {
      const response = await GooglePlacesService.getPlaceDetails(placeId);
      console.log('Place Details Response:', response);
      setPlaceDetails(response);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const handleMapClick = (lat, lng) => {
    setSelectedLocation({ lat, lng });
    console.log('Map clicked at:', { lat, lng });
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
      setSidebarVisible(true);
      
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

  const handleBasemapChange = (basemapType) => {
    console.log('Changing basemap to:', basemapType);
    // Implement basemap change logic for Google Maps
    // This would need to be implemented in your Map component
    if (mapRef.current && mapRef.current.changeBasemap) {
      mapRef.current.changeBasemap(basemapType);
    }
  };

  const handleLayerChange = () => {
    setCurrentLayer(prev => prev === 'catchment' ? 'commune' : 'catchment');
  };

  const toggleCatchmentMode = () => {
    setShowCatchmentMode(prev => !prev);
    // Clear existing data when switching modes
    if (!showCatchmentMode) {
      setSearchResults([]);
      setSearchResultsData([]);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', display: 'flex' }}>
      {/* Enhanced Sidebar */}
      <CatchmentSidebar
        visible={sidebarVisible}
        places={searchResultsData}
        onPlaceClick={handlePlaceClick}
        onClose={() => setSidebarVisible(false)}
        selectedLocation={selectedLocation}
        isLoading={isLoading}
        onBasemapChange={handleBasemapChange}
        currentLayer={currentLayer}
        user={user}
      />

      {/* Map Container */}
      <div style={{ 
        flex: 1, 
        width: sidebarVisible ? 'calc(100% - 320px)' : '100%',
        transition: 'width 0.3s ease',
        position: 'relative'
      }}>
        <Map
          apiKey={API_KEY}
          ref={mapRef}
          onPlaceClick={handlePlaceClick}
          onMapClick={handleMapClick}
          selectedLocation={selectedLocation}
          searchResults={searchResults}
          searchResultsData={searchResultsData}
          style={{ width: '100%', height: '100%' }}
        />

        {/* Mode Toggle Button */}
        <button
          onClick={toggleCatchmentMode}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '10px 20px',
            backgroundColor: showCatchmentMode ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            zIndex: 1001,
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {showCatchmentMode ? 'Exit Catchment Mode' : 'Enable Catchment Mode'}
        </button>

        {/* Conditional rendering based on mode */}
        {showCatchmentMode ? (
          // Catchment Analysis Mode
          <CatchmentAnalysis
            map={mapRef.current}
            selectedLocation={selectedLocation}
            onLocationSelect={handleMapClick}
          />
        ) : (
          // Regular Places Search Mode
          <SearchPanel 
            onSearch={handleSearch}
            isLoading={isLoading}
            selectedLocation={selectedLocation}
            resultsCount={searchResults.length}
            mapRef={mapRef}
          />
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={placeDetails}
      />
    </div>
  );
}

export default App;
