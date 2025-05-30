import React, { useRef, useState } from 'react';
import './index.css'; // Import your CSS file
import Map from './components/Map';
import Modal from './components/Modal';
import GooglePlacesService from './services/GooglePlaces';

function App() {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Load API key from environment variables
  const mapRef = useRef(null); // Reference to the Map component
  const [placeDetails, setPlaceDetails] = useState(null); // State to store the place details response
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

  const handlePlaceClick = async (placeId) => {
    try {
      const response = await GooglePlacesService.getPlaceDetails(placeId);
      console.log('Place Details Response:', response);
      setPlaceDetails(response); // Store the place details in state
      setIsModalOpen(true); // Open the modal
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
      {/* Map */}
      <div style={{ width: '100%', height: '100%' }}>
        <Map
          apiKey={API_KEY}
          ref={mapRef}
          onPlaceClick={handlePlaceClick} // Pass the click handler to the Map component
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={placeDetails}
      />
      {/* Dropdown Menu */}
      <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
        <select
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: '#fff',
          }}
          onChange={(e) => console.log('Selected category:', e.target.value)}
        >
          <option value="bakery">Bakery</option>
          <option value="bicycle_store">Bicycle Store</option>
          <option value="book_store">Book Store</option>
          <option value="clothing_store">Clothing Store</option>
          <option value="convenience_store">Convenience Store</option>
          <option value="department_store">Department Store</option>
          <option value="drugstore">Drugstore</option>
          <option value="electronics_store">Electronics Store</option>
          <option value="florist">Florist</option>
          <option value="furniture_store">Furniture Store</option>
          <option value="hardware_store">Hardware Store</option>
          <option value="home_goods_store">Home Goods Store</option>
          <option value="jewelry_store">Jewelry Store</option>
          <option value="liquor_store">Liquor Store</option>
          <option value="pet_store">Pet Store</option>
          <option value="pharmacy">Pharmacy</option>
          <option value="shoe_store">Shoe Store</option>
          <option value="shopping_mall">Shopping Mall</option>
          <option value="store">Store</option>
          <option value="supermarket">Supermarket</option>
          <option value="lawyer">Lawyer</option>
        </select>
      </div>
    </div>
  );
}

export default App;