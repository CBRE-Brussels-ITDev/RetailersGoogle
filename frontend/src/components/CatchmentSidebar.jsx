import React, { useState } from 'react';

const CatchmentSidebar = ({ 
  visible, 
  places, 
  onPlaceClick, 
  onClose, 
  selectedLocation, 
  isLoading,
  onBasemapChange,
  currentLayer,
  user = null 
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterByType, setFilterByType] = useState('all');

  // Basemap options
  const basemaps = [
    { 
      id: 'light-gray', 
      name: 'Light Gray Canvas', 
      thumbnail: '/img/thumbnail1607388219207.jpeg',
      mapType: 'arcgis-light-gray'
    },
    { 
      id: 'dark-gray', 
      name: 'Dark Gray Canvas', 
      thumbnail: '/img/thumbnail1607387673856.jpeg',
      mapType: 'arcgis-dark-gray'
    },
    { 
      id: 'topographic', 
      name: 'Topographic', 
      thumbnail: '/img/thumbnail1607389112065.jpeg',
      mapType: 'arcgis-topographic'
    },
    { 
      id: 'streets', 
      name: 'Streets', 
      thumbnail: '/img/thumbnail1607389307240.jpeg',
      mapType: 'arcgis-streets'
    },
    { 
      id: 'streets-night', 
      name: 'Streets Night', 
      thumbnail: '/img/thumbnail1607388481562.jpeg',
      mapType: 'arcgis-streets-night'
    }
  ];

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

  const handleSignOut = () => {
    // Implement sign out logic
    alert('Sign out functionality would be implemented here');
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

      {/* Basemap Options */}
      <div style={styles.basemapSection}>
        <h5 style={styles.sectionTitle}>Basemap options:</h5>
        {basemaps.map(basemap => (
          <div 
            key={basemap.id}
            style={styles.basemapOption}
            onClick={() => onBasemapChange(basemap.mapType)}
          >
            <img 
              src={basemap.thumbnail} 
              alt={basemap.name}
              style={styles.basemapThumbnail}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span style={styles.basemapName}>{basemap.name}</span>
          </div>
        ))}
      </div>

      {/* Places Section (when places are available) */}
      {places && places.length > 0 && (
        <div style={styles.placesSection}>
          <h5 style={styles.sectionTitle}>
            Found Places ({filteredAndSortedPlaces.length})
          </h5>

          {/* Controls */}
          <div style={styles.controls}>
            <input
              type="text"
              placeholder="Search places..."
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
                <div 
                  style={{
                    ...styles.typeIndicator,
                    backgroundColor: getTypeColor(place.search_type)
                  }}
                />

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

      {/* User Section */}
      <div style={styles.userSection}>
        {user ? (
          <div style={styles.userInfo}>
            <div style={styles.userDetails}>
              <div style={styles.userName}>
                <strong>{user.firstName}</strong>, {user.lastName}
              </div>
              <div style={styles.userLocation}>
                {user.location}
              </div>
            </div>
            <button style={styles.signOutButton} onClick={handleSignOut}>
              <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
            </button>
          </div>
        ) : (
          <div style={styles.signInPrompt}>
            <button style={styles.signInButton}>
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: '320px',
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
  basemapSection: {
    padding: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '15px',
    color: 'white'
  },
  basemapOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'background-color 0.2s'
  },
  basemapThumbnail: {
    width: '40px',
    height: '30px',
    objectFit: 'cover',
    borderRadius: '4px',
    border: '1px solid rgba(255,255,255,0.2)'
  },
  basemapName: {
    fontSize: '13px',
    color: 'white'
  },
  placesSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
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
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white'
  },
  select: {
    padding: '8px 12px',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '4px',
    fontSize: '14px',
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
  userSection: {
    padding: '20px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: 'auto'
  },
  userInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontSize: '14px',
    color: 'white',
    marginBottom: '4px'
  },
  userLocation: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic'
  },
  signOutButton: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '50%',
    padding: '8px',
    cursor: 'pointer',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  signInPrompt: {
    textAlign: 'center'
  },
  signInButton: {
    padding: '10px 20px',
    backgroundColor: '#17E88F',
    color: '#032842',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
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