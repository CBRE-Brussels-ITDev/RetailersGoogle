import React, { useState } from 'react';

const SearchPanel = ({ onSearch, isLoading, selectedLocation, resultsCount, mapRef }) => {
  const [radius, setRadius] = useState(1000);
  const [category, setCategory] = useState('restaurant');
  const [getAllSectors, setGetAllSectors] = useState(false);
  const [showTraffic, setShowTraffic] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({
      radius: parseInt(radius),
      category: getAllSectors ? null : category,
      getAllSectors
    });
  };

  const toggleTraffic = () => {
    const newShowTraffic = !showTraffic;
    setShowTraffic(newShowTraffic);
    if (mapRef?.current) {
      mapRef.current.toggleTraffic(newShowTraffic);
    }
  };

  const categories = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'gas_station', label: 'Gas Station' },
    { value: 'bank', label: 'Bank' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'grocery_or_supermarket', label: 'Grocery/Supermarket' },
    { value: 'shopping_mall', label: 'Shopping Mall' },
    { value: 'school', label: 'School' },
    { value: 'park', label: 'Park' },
    { value: 'tourist_attraction', label: 'Tourist Attraction' },
    { value: 'lodging', label: 'Lodging' },
    { value: 'store', label: 'Store' },
    { value: 'car_repair', label: 'Car Repair' },
    { value: 'gym', label: 'Gym' },
    { value: 'beauty_salon', label: 'Beauty Salon' },
    { value: 'church', label: 'Church' },
    { value: 'library', label: 'Library' },
    { value: 'post_office', label: 'Post Office' },
    { value: 'bakery', label: 'Bakery' },
    { value: 'bicycle_store', label: 'Bicycle Store' },
    { value: 'book_store', label: 'Book Store' },
    { value: 'clothing_store', label: 'Clothing Store' },
    { value: 'convenience_store', label: 'Convenience Store' },
    { value: 'department_store', label: 'Department Store' },
    { value: 'drugstore', label: 'Drugstore' },
    { value: 'electronics_store', label: 'Electronics Store' },
    { value: 'florist', label: 'Florist' },
    { value: 'furniture_store', label: 'Furniture Store' },
    { value: 'hardware_store', label: 'Hardware Store' },
    { value: 'home_goods_store', label: 'Home Goods Store' },
    { value: 'jewelry_store', label: 'Jewelry Store' },
    { value: 'liquor_store', label: 'Liquor Store' },
    { value: 'pet_store', label: 'Pet Store' },
    { value: 'shoe_store', label: 'Shoe Store' },
    { value: 'supermarket', label: 'Supermarket' },
    { value: 'lawyer', label: 'Lawyer' }
  ];

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>Place Search</h3>
        {selectedLocation && (
          <div style={styles.locationInfo}>
            📍 Selected: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
          </div>
        )}
        {resultsCount > 0 && (
          <div style={styles.resultsInfo}>
            Found {resultsCount} places
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Search Radius (meters):</label>
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            min="100"
            max="50000"
            step="100"
            style={styles.input}
            placeholder="e.g., 1000"
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={getAllSectors}
              onChange={(e) => setGetAllSectors(e.target.checked)}
              style={styles.checkbox}
            />
            Get All Sectors (all types of places)
          </label>
        </div>

        {!getAllSectors && (
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.select}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedLocation || isLoading}
          style={{
            ...styles.searchButton,
            ...((!selectedLocation || isLoading) ? styles.disabledButton : {})
          }}
        >
          {isLoading ? 'Searching...' : 'Search Places'}
        </button>

        <button
          type="button"
          onClick={toggleTraffic}
          style={{
            ...styles.trafficButton,
            backgroundColor: showTraffic ? '#28a745' : '#6c757d'
          }}
        >
          {showTraffic ? '🚦 Traffic ON' : '🚦 Traffic OFF'}
        </button>
      </form>

      <div style={styles.instructions}>
        {!selectedLocation ? (
          <p style={styles.instructionText}>
            📍 Click on the map to select a search location
          </p>
        ) : (
          <p style={styles.instructionText}>
            🔍 Configure your search parameters and click "Search Places"
          </p>
        )}
      </div>
    </div>
  );
};

const styles = {
  panel: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    width: '320px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    padding: '20px',
    zIndex: 1000,
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    marginBottom: '20px'
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333'
  },
  locationInfo: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px',
    padding: '4px 8px',
    backgroundColor: '#f0f8ff',
    borderRadius: '4px'
  },
  resultsInfo: {
    fontSize: '12px',
    color: '#4CAF50',
    fontWeight: 'bold',
    padding: '4px 8px',
    backgroundColor: '#f0fff0',
    borderRadius: '4px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  checkboxLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    ':focus': {
      borderColor: '#007bff'
    }
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  checkbox: {
    cursor: 'pointer'
  },
  searchButton: {
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  trafficButton: {
    padding: '10px 16px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '5px'
  },
  instructions: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    borderLeft: '4px solid #007bff'
  },
  instructionText: {
    margin: 0,
    fontSize: '12px',
    color: '#666'
  }
};

export default SearchPanel;