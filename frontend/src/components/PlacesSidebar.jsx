import React, { useState, useMemo } from 'react';

const PlacesSidebar = ({ visible, places, onPlaceClick, onClose, selectedLocation, isLoading }) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, rating, distance, type
  const [filterByType, setFilterByType] = useState('all');

  // Get unique place types for filter dropdown
  const placeTypes = useMemo(() => {
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
  const filteredAndSortedPlaces = useMemo(() => {
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
            a.geometry.location.lat, a.geometry.location.lng
          );
          const distB = calculateDistance(
            selectedLocation.lat, selectedLocation.lng,
            b.geometry.location.lat, b.geometry.location.lng
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
      place.geometry.location.lat, place.geometry.location.lng
    );
    return distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(1)}km`;
  };

  // Get type color
  const getTypeColor = (type) => {
    const colors = {
      restaurant: '#ff6b6b',
      gas_station: '#4ecdc4',
      bank: '#45b7d1',
      hospital: '#96ceb4',
      pharmacy: '#ffeaa7',
      shopping_mall: '#fd79a8',
      school: '#6c5ce7',
      park: '#a29bfe',
      store: '#fd7f6f',
      default: '#7bed9f'
    };
    return colors[type] || colors.default;
  };

  if (!visible) return null;

  return (
    <div style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>
          Found Places ({filteredAndSortedPlaces.length})
        </h3>
        <button style={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        {/* Search Filter */}
        <input
          type="text"
          placeholder="Search places..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          style={styles.searchInput}
        />

        {/* Sort Dropdown */}
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

        {/* Type Filter */}
        <select
          value={filterByType}
          onChange={(e) => setFilterByType(e.target.value)}
          style={styles.select}
        >
          <option value="all">All Types</option>
          {placeTypes.map(type => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
            {/* Place Type Indicator */}
            <div 
              style={{
                ...styles.typeIndicator,
                backgroundColor: getTypeColor(place.search_type)
              }}
            />

            {/* Place Info */}
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
                {place.business_status && place.business_status !== 'OPERATIONAL' && (
                  <span style={styles.businessStatus}>
                    {place.business_status === 'CLOSED_TEMPORARILY' ? '⏰ Temporarily Closed' : 
                     place.business_status === 'CLOSED_PERMANENTLY' ? '❌ Permanently Closed' : 
                     place.business_status}
                  </span>
                )}
              </div>
            </div>

            {/* Click indicator */}
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

        {/* Empty state */}
        {!isLoading && places.length === 0 && (
          <div style={styles.emptyState}>
            <p>No places found</p>
            <p style={styles.emptyStateHint}>
              Try selecting a location on the map and searching for places
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: '400px',
    height: '100vh',
    backgroundColor: 'white',
    borderLeft: '1px solid #e0e0e0', // Changed from borderRight to borderLeft
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Arial, sans-serif',
    zIndex: 1000,
    position: 'relative'
  },
  header: {
    padding: '15px 20px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#666',
    padding: '5px'
  },
  controls: {
    padding: '15px 20px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  searchInput: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none'
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white'
  },
  loading: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#666'
  },
  spinner: {
    width: '30px',
    height: '30px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 15px'
  },
  placesList: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px'
  },
  placeItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '12px',
    margin: '8px 0',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative'
  },
  typeIndicator: {
    width: '4px',
    height: '60px',
    borderRadius: '2px',
    marginRight: '12px',
    flexShrink: 0
  },
  placeInfo: {
    flex: 1,
    minWidth: 0
  },
  placeName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
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
    color: '#666',
    textTransform: 'capitalize'
  },
  rating: {
    fontSize: '12px',
    color: '#ff9500',
    fontWeight: 'bold'
  },
  ratingsCount: {
    color: '#999',
    fontWeight: 'normal'
  },
  placeAddress: {
    fontSize: '11px',
    color: '#888',
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
    color: '#007bff',
    fontWeight: 'bold'
  },
  priceLevel: {
    fontSize: '11px'
  },
  businessStatus: {
    fontSize: '10px',
    color: '#e74c3c',
    fontWeight: 'bold'
  },
  clickIndicator: {
    fontSize: '12px',
    color: '#007bff',
    marginLeft: '8px',
    flexShrink: 0
  },
  noResults: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#666'
  },
  clearFiltersButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999'
  },
  emptyStateHint: {
    fontSize: '12px',
    marginTop: '10px'
  }
};

// Add CSS animation for spinner
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

export default PlacesSidebar;