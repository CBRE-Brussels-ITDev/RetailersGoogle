import React, { useRef, useState } from 'react';
import './index.css';
import Map from './components/Map';
import Modal from './components/Modal';
import SearchPanel from './components/SearchPanel';
import GooglePlacesService from './services/GooglePlacesService';

function App() {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

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

      setSearchResults(results);
      
      // Add circle to map to show search area
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

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
      {/* Map */}
      <div style={{ width: '100%', height: '100%' }}>
        <Map
          apiKey={API_KEY}
          ref={mapRef}
          onPlaceClick={handlePlaceClick}
          onMapClick={handleMapClick}
          selectedLocation={selectedLocation}
          searchResults={searchResults}
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