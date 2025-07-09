import React, { useState } from 'react';
import { getCategoryColor, getCategoryEmoji } from './CategoryIcons';

const CatchmentSidebar = ({ 
  visible, 
  places, 
  onPlaceClick, 
  onClose, 
  selectedLocation, 
  isLoading,
  currentLayer,
  onSearch,
  resultsCount
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterByType, setFilterByType] = useState('all');
  
  // Search form state
  const [radius, setRadius] = useState('1000');
  const [category, setCategory] = useState('restaurant');
  const [getAllSectors, setGetAllSectors] = useState(false);

  // Radius options
  const radiusOptions = [
    { value: '500', label: '500m' },
    { value: '1000', label: '1KM' },
    { value: '2000', label: '2KM' },
    { value: '5000', label: '5KM' },
    { value: '10000', label: '10KM' }
  ];

  // Categories for search
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
    { value: 'convenience_store', label: 'Convenience Store' },
    { value: 'department_store', label: 'Department Store' },
    { value: 'clothing_store', label: 'Clothing Store' },
    { value: 'electronics_store', label: 'Electronics Store' },
    { value: 'supermarket', label: 'Supermarket' }
  ];

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({
        radius: parseInt(radius),
        category: getAllSectors ? null : category,
        getAllSectors
      });
    }
  };

  // Get unique place types for filter dropdown
  const placeTypes = React.useMemo(() => {
    const types = new Set();
    places.forEach(place => {
      if (place.search_type) {
        types.add(place.search_type);
      }
    });
    return Array.from(types).sort();
  }, [places]);

  // Calculate distance between two coordinates (in meters)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Filter and sort places
  const filteredAndSortedPlaces = React.useMemo(() => {
    let filtered = places.filter(place => {
      const matchesSearch = !searchFilter || 
        place.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        place.vicinity?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        place.search_type?.toLowerCase().includes(searchFilter.toLowerCase());
      
      const matchesType = filterByType === 'all' || place.search_type === filterByType;
      
      return matchesSearch && matchesType;
    });

    // Sort places
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'distance':
          if (!selectedLocation) return 0;
          const distA = calculateDistance(
            selectedLocation.lat, selectedLocation.lng,
            a.coordinates.lat, a.coordinates.lng
          );
          const distB = calculateDistance(
            selectedLocation.lat, selectedLocation.lng,
            b.coordinates.lat, b.coordinates.lng
          );
          return distA - distB;
        case 'type':
          return (a.search_type || '').localeCompare(b.search_type || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [places, searchFilter, sortBy, filterByType, selectedLocation]);

  // Format distance
  const formatDistance = (place) => {
    if (!selectedLocation) return '';
    const distance = calculateDistance(
      selectedLocation.lat, selectedLocation.lng,
      place.coordinates.lat, place.coordinates.lng
    );
    return distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(1)}km`;
  };

  if (!visible) return null;

  return (
    <div style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <img src="/img/CBRE_white.svg" alt="CBRE" style={styles.logo} />
          <h4 style={styles.title}>
            {currentLayer === 'catchment' ? 'CATCHMENT' : 'COMMUNE'}
          </h4>
        </div>
        <button style={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Search Section */}
      <div style={styles.searchSection}>
        <h5 style={styles.sectionTitle}>
          🔍 Place Search
        </h5>
        
        {/* Location Status */}
        {selectedLocation ? (
          <div style={styles.locationStatus}>
            📍 Location: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
          </div>
        ) : (
          <div style={styles.locationWarning}>
            ⚠️ Click on the map to select a location
          </div>
        )}

        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Search Radius:</label>
            <select
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              style={styles.select}
            >
              {radiusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={getAllSectors}
                onChange={(e) => setGetAllSectors(e.target.checked)}
                style={styles.checkbox}
              />
              Get All Sectors
            </label>
          </div>

          {!getAllSectors && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={styles.select}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {getCategoryEmoji(cat.value)} {cat.label}
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
        </form>

        {/* Results Summary */}
        {resultsCount > 0 && (
          <div style={styles.resultsInfo}>
            Found {resultsCount} place{resultsCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Places Section (when places are available) */}
      {places && places.length > 0 && (
        <div style={styles.placesSection}>
          <h5 style={styles.sectionTitle}>
            <span style={styles.placesIcon}>📍</span>
            Places ({filteredAndSortedPlaces.length})
          </h5>

          {/* Controls */}
          <div style={styles.controls}>
            <input
              type="text"
              placeholder="Filter places..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={styles.searchInput}
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.select}
            >
              <option value="name">Sort by Name</option>
              <option value="rating">Sort by Rating</option>
              <option value="distance">Sort by Distance</option>
              <option value="type">Sort by Type</option>
            </select>

            <select
              value={filterByType}
              onChange={(e) => setFilterByType(e.target.value)}
              style={styles.select}
            >
              <option value="all">All Types</option>
              {placeTypes.map(type => (
                <option key={type} value={type}>
                  {getCategoryEmoji(type)} {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div style={styles.loading}>
              <div style={styles.spinner}></div>
              <p>Loading places...</p>
            </div>
          )}

          {/* Places List */}
          <div style={styles.placesList}>
            {filteredAndSortedPlaces.map((place, index) => (
              <div
                key={place.place_id}
                style={styles.placeItem}
                onClick={() => onPlaceClick(place.place_id)}
              >
                <div style={styles.placeIconContainer}>
                  <div 
                    style={{
                      ...styles.categoryIcon,
                      backgroundColor: getCategoryColor(place.search_type)
                    }}
                  >
                    <span style={styles.categoryEmoji}>
                      {getCategoryEmoji(place.search_type)}
                    </span>
                  </div>
                </div>

                <div style={styles.placeInfo}>
                  <div style={styles.placeName}>
                    {place.name || 'Unnamed Place'}
                  </div>
                  
                  <div style={styles.placeDetails}>
                    <span style={styles.placeType}>
                      {place.search_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                    </span>
                    {place.rating && (
                      <span style={styles.rating}>
                        ⭐ {place.rating.toFixed(1)}
                        {place.user_ratings_total && (
                          <span style={styles.ratingsCount}>
                            ({place.user_ratings_total})
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <div style={styles.placeAddress}>
                    {place.vicinity || 'No address available'}
                  </div>

                  <div style={styles.placeExtras}>
                    {selectedLocation && (
                      <span style={styles.distance}>
                        📍 {formatDistance(place)}
                      </span>
                    )}
                    {place.price_level !== undefined && (
                      <span style={styles.priceLevel}>
                        {'💰'.repeat(place.price_level + 1)}
                      </span>
                    )}
                  </div>
                </div>

                <div style={styles.clickIndicator}>
                  ➤
                </div>
              </div>
            ))}

            {/* No results message */}
            {!isLoading && filteredAndSortedPlaces.length === 0 && places.length > 0 && (
              <div style={styles.noResults}>
                <p>No places match your filters</p>
                <button 
                  style={styles.clearFiltersButton}
                  onClick={() => {
                    setSearchFilter('');
                    setFilterByType('all');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Legend (when places are visible) */}
      {places && places.length > 0 && placeTypes.length > 1 && (
        <div style={styles.legendSection}>
          <h5 style={styles.sectionTitle}>Category Legend:</h5>
          <div style={styles.legendGrid}>
            {placeTypes.slice(0, 8).map(type => (
              <div key={type} style={styles.legendItem}>
                <div 
                  style={{
                    ...styles.legendIcon,
                    backgroundColor: getCategoryColor(type)
                  }}
                >
                  <span style={styles.legendEmoji}>
                    {getCategoryEmoji(type)}
                  </span>
                </div>
                <span style={styles.legendLabel}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            ))}
            {placeTypes.length > 8 && (
              <div style={styles.legendItem}>
                <span style={styles.legendMore}>
                  +{placeTypes.length - 8} more
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  sidebar: {
    width: '350px',
    height: '100vh',
    backgroundColor: '#032842',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Arial, sans-serif',
    zIndex: 1000,
    position: 'relative',
    overflow: 'hidden'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  logo: {
    height: '20px'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '5px'
  },
  searchSection: {
    padding: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '15px',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  placesIcon: {
    fontSize: '16px'
  },
  locationStatus: {
    fontSize: '12px',
    color: '#17E88F',
    marginBottom: '15px',
    padding: '8px 12px',
    backgroundColor: 'rgba(23, 232, 143, 0.1)',
    borderRadius: '4px',
    border: '1px solid rgba(23, 232, 143, 0.3)'
  },
  locationWarning: {
    fontSize: '12px',
    color: '#f39c12',
    marginBottom: '15px',
    padding: '8px 12px',
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    borderRadius: '4px',
    border: '1px solid rgba(243, 156, 18, 0.3)'
  },
  searchForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'white'
  },
  checkboxLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  select: {
    padding: '8px 12px',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '4px',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white'
  },
  checkbox: {
    cursor: 'pointer'
  },
  searchButton: {
    padding: '12px 20px',
    backgroundColor: '#17E88F',
    color: '#032842',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  disabledButton: {
    backgroundColor: '#666',
    cursor: 'not-allowed'
  },
  resultsInfo: {
    fontSize: '12px',
    color: '#17E88F',
    fontWeight: 'bold',
    marginTop: '10px',
    padding: '8px 12px',
    backgroundColor: 'rgba(23, 232, 143, 0.1)',
    borderRadius: '4px',
    textAlign: 'center'
  },
  placesSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: '20px'
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px'
  },
  searchInput: {
    padding: '8px 12px',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '4px',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white'
  },
  loading: {
    padding: '40px 20px',
    textAlign: 'center',
    color: 'white'
  },
  spinner: {
    width: '30px',
    height: '30px',
    border: '3px solid rgba(255,255,255,0.3)',
    borderTop: '3px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 15px'
  },
  placesList: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: '5px'
  },
  placeItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '12px',
    margin: '8px 0',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  placeIconContainer: {
    marginRight: '12px',
    flexShrink: 0
  },
  categoryIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(255,255,255,0.3)'
  },
  categoryEmoji: {
    fontSize: '16px'
  },
  placeInfo: {
    flex: 1,
    minWidth: 0
  },
  placeName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  placeDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  placeType: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'capitalize'
  },
  rating: {
    fontSize: '12px',
    color: '#ff9500',
    fontWeight: 'bold'
  },
  ratingsCount: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 'normal'
  },
  placeAddress: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '6px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  placeExtras: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  distance: {
    fontSize: '11px',
    color: '#17E88F',
    fontWeight: 'bold'
  },
  priceLevel: {
    fontSize: '11px'
  },
  clickIndicator: {
    fontSize: '12px',
    color: '#17E88F',
    marginLeft: '8px',
    flexShrink: 0
  },
  noResults: {
    textAlign: 'center',
    padding: '40px 20px',
    color: 'rgba(255,255,255,0.7)'
  },
  clearFiltersButton: {
    padding: '8px 16px',
    backgroundColor: '#17E88F',
    color: '#032842',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    marginTop: '10px'
  },
  legendSection: {
    padding: '15px 20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  legendGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  legendIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  legendEmoji: {
    fontSize: '10px'
  },
  legendLabel: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  legendMore: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic'
  }
};

// CSS for spinner animation
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject CSS for spinner animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinKeyframes;
  document.head.appendChild(style);
}

export default CatchmentSidebar;