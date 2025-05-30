import React, { useRef, useState } from 'react';
import './index.css';
import Map from './components/Map';
import Modal from './components/Modal';
import SearchPanel from './components/SearchPanel';
import PlacesSidebar from './components/PlacesSidebar';
import GooglePlacesService from './services/GooglePlaces';

function App() {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchResultsData, setSearchResultsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

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
        // Search for all sectors
        results = await GooglePlacesService.getPlacesInRadius(
          selectedLocation.lat,
          selectedLocation.lng,
          searchParams.radius,
          null, // No specific category
          true // getAllSectors = true
        );
      } else {
        // Search for specific category
        results = await GooglePlacesService.getPlacesInRadius(
          selectedLocation.lat,
          selectedLocation.lng,
          searchParams.radius,
          searchParams.category
        );
      }

      setSearchResults(results.placeIds || []);
      setSearchResultsData(results.places || []);
      setSidebarVisible(true); // Show sidebar when results are found
      
      // Add circle to map to show search area
      if (mapRef.current) {
        mapRef.current.addCircle(selectedLocation, searchParams.radius);
      }

      console.log('Search results:', results);
      console.log(`Found ${results.totalFound} places with coordinates`);
    } catch (error) {
      console.error('Error searching places:', error);
      alert('Error searching places. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', display: 'flex' }}>
      {/* Sidebar */}
      <PlacesSidebar
        visible={sidebarVisible}
        places={searchResultsData}
        onPlaceClick={handlePlaceClick}
        onClose={() => setSidebarVisible(false)}
        selectedLocation={selectedLocation}
        isLoading={isLoading}
      />

      {/* Map Container */}
      <div style={{ 
        flex: 1, 
        width: sidebarVisible ? 'calc(100% - 400px)' : '100%',
        transition: 'width 0.3s ease'
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
      </div>

      {/* Search Panel */}
      <SearchPanel 
        onSearch={handleSearch}
        isLoading={isLoading}
        selectedLocation={selectedLocation}
        resultsCount={searchResults.length}
        mapRef={mapRef}
      />

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