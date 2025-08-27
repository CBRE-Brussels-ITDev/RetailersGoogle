import React, { useState } from 'react';
import { getCategoryColor, getCategoryEmoji } from './CategoryIcons';
import logo from '../assets/CBRE_white.svg';

// Catchment colors matching JSReport template
const getCatchmentColor = (index) => {
  const colors = [
    'rgb(114, 151, 153)', // First catchment
    'rgb(139, 169, 171)', // Second catchment  
    'rgb(176, 195, 196)'  // Third catchment
  ];
  return colors[index] || colors[0];
};

const CatchmentSidebar = ({ 
  visible, 
  places, 
  onPlaceClick, 
  onClose, 
  selectedLocation, 
  isLoading,
  currentLayer,
  onSearch,
  onCatchmentCalculate,
  resultsCount,
  showCatchmentMode,
  catchmentData,
  onClearAll,
  onToggleMode,
  onShowCommerceAnalysis  // New prop for commerce analysis
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterByType, setFilterByType] = useState('all');
  
  // Places search form state
  const [radius, setRadius] = useState('1000');
  const [category, setCategory] = useState('restaurant');
  const [getAllSectors, setGetAllSectors] = useState(false);

  // Catchment form state
  const [travelMode, setTravelMode] = useState('driving');
  const [driveTimes, setDriveTimes] = useState([10, 20, 30]); // Max 3 catchments
  const [customTime, setCustomTime] = useState('');
  const [showDemographics, setShowDemographics] = useState(true);

  // Radius options
  const getCategoryEmoji = (category) => {
  const emojiMap = {
    'restaurant': '🍽️',
    'store': '🏪', 
    'shopping_mall': '🛍️',
    'gas_station': '⛽',
    'bank': '🏦',
    'hospital': '🏥',
    'pharmacy': '💊',
    'school': '🎓',
    'gym': '💪',
    'beauty_salon': '💄',
    'car_dealer': '🚗',
    'electronics_store': '📱',
    'clothing_store': '👕',
    'supermarket': '🛒',
    'bakery': '🥖',
    'cafe': '☕',
    'bar': '🍺',
    'tourist_attraction': '🎯',
    'park': '🌳',
    'hotel': '🏨'
  };
  return emojiMap[category] || '📍';
};

const radiusOptions = [
    { value: '500', label: '500m' },
    { value: '1000', label: '1KM' },
    { value: '2000', label: '2KM' },
    { value: '5000', label: '5KM' },
    { value: '10000', label: '10KM' }
  ];

  // Categories for places search
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

  // Travel mode options
  const travelModeOptions = [
    { value: 'driving', label: 'Driving', icon: '🚗' },
    { value: 'walking', label: 'Walking', icon: '🚶' },
    { value: 'bicycling', label: 'Bicycling', icon: '🚴' },
    { value: 'transit', label: 'Transit', icon: '🚌' }
  ];

  // Handle places search submission
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

  // Handle catchment calculation submission
  const handleCatchmentSubmit = (e) => {
    e.preventDefault();
    if (onCatchmentCalculate) {
      onCatchmentCalculate({
        travelMode,
        driveTimes,
        showDemographics
      });
    }
  };

  // Add custom time to drive times
  const addCustomTime = () => {
    const time = parseInt(customTime);
    if (time > 0 && time <= 60 && !driveTimes.includes(time) && driveTimes.length < 3) {
      setDriveTimes([...driveTimes, time].sort((a, b) => a - b));
      setCustomTime('');
    } else if (driveTimes.length >= 3) {
      alert('Maximum 3 catchment areas allowed');
    }
  };

  // Remove time from drive times
  const removeTime = (timeToRemove) => {
    if (driveTimes.length > 1) {
      setDriveTimes(driveTimes.filter(time => time !== timeToRemove));
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
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <img src={logo} alt="CBRE" style={styles.logo} />
            <div style={styles.titleContainer}>
                <h4 style={styles.title}>
                  {showCatchmentMode ? 'CATCHMENT ANALYSIS' : 'PLACES SEARCH'}
                </h4>
            </div>
          </div>
          <div style={styles.headerButtons}>
            <button style={styles.closeButton} onClick={onClose}>
          ✕
            </button>
          </div>
        </div>

        {/* Toggle Mode Button at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={onToggleMode}
            style={{
          ...styles.toggleModeButton,
          backgroundColor: showCatchmentMode ? '#28a745' : '#dc3545',
          width: '90%'
            }}
          >
            {showCatchmentMode ? '🔍 Switch to Places' : '📊 Switch to Catchment'}
          </button>
        </div>

        {/* Location Status */}
      <div style={styles.locationSection}>
        {selectedLocation ? (
          <div style={styles.locationStatus}>
            📍 Location: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
          </div>
        ) : (
          <div style={styles.locationWarning}>
            ⚠️ Click on the map to select a location
          </div>
        )}
      </div>

      {/* Content based on mode */}
      {showCatchmentMode ? (
        // CATCHMENT MODE
        <div style={styles.searchSection}>
          <h5 style={styles.sectionTitle}>
            🎯 Catchment Parameters
          </h5>

          <form onSubmit={handleCatchmentSubmit} style={styles.searchForm}>
            {/* Travel Mode Selection */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Travel Mode:</label>
              <div style={styles.travelModeGrid}>
                {travelModeOptions.map(mode => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setTravelMode(mode.value)}
                    style={{
                      ...styles.travelModeButton,
                      ...(travelMode === mode.value ? styles.travelModeButtonActive : {})
                    }}
                  >
                    <span style={styles.modeIcon}>{mode.icon}</span>
                    <span style={styles.modeLabel}>{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Drive Times */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Drive Times (minutes) - Max 3:</label>
              <div style={styles.timeChips}>
                {driveTimes.map((time, index) => (
                  <div key={time} style={{
                    ...styles.timeChip,
                    backgroundColor: getCatchmentColor(index)
                  }}>
                    <span>{time}min</span>
                    {driveTimes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTime(time)}
                        style={styles.removeTimeButton}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div style={styles.addTimeContainer}>
                <input
                  type="number"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  placeholder={driveTimes.length >= 3 ? "Max 3 areas" : "Add time (1-60)"}
                  min="1"
                  max="60"
                  style={{
                    ...styles.timeInput,
                    opacity: driveTimes.length >= 3 ? 0.5 : 1
                  }}
                  disabled={driveTimes.length >= 3}
                />
                <button
                  type="button"
                  onClick={addCustomTime}
                  disabled={!customTime || customTime < 1 || customTime > 60 || driveTimes.length >= 3}
                  style={{
                    ...styles.addTimeButton,
                    opacity: (driveTimes.length >= 3) ? 0.5 : 1
                  }}
                >
                  {driveTimes.length >= 3 ? 'Max' : 'Add'}
                </button>
              </div>
            </div>

            {/* Demographics Option */}
            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={showDemographics}
                  onChange={(e) => setShowDemographics(e.target.checked)}
                  style={styles.checkbox}
                />
                Include demographic data
              </label>
            </div>

            {/* Calculate Button */}
            <button
              type="submit"
              disabled={!selectedLocation || isLoading || driveTimes.length === 0}
              style={{
                ...styles.calculateButton,
                ...((!selectedLocation || isLoading || driveTimes.length === 0) ? styles.disabledButton : {})
              }}
            >
              {isLoading ? 'Calculating...' : 'Calculate Catchment'}
            </button>
          </form>

          {/* Results Summary */}
          {catchmentData && catchmentData.length > 0 && (
            <div style={styles.resultsInfo}>
              ✅ Generated {catchmentData.length} catchment area{catchmentData.length !== 1 ? 's' : ''}
            </div>
          )}

          {/* Clear Button - Only show if there's data to clear */}
          {(catchmentData?.length > 0 || selectedLocation) && (
            <button
              onClick={onClearAll}
              style={styles.clearButton}
            >
              🗑️ Clear All
            </button>
          )}
        </div>
      ) : (
        // PLACES MODE - ENHANCED USER INTERFACE
        <div style={styles.searchSection}>
          <h5 style={styles.sectionTitle}>
            🔍 Smart Place Discovery
          </h5>

          {/* Quick Search Tips */}
          <div style={styles.searchTips}>
            <div style={styles.tipHeader}>💡 Quick Tips:</div>
            <div style={styles.tips}>
              • Select location first, then choose search options
              • Use "All Sectors" for comprehensive analysis
              • Smaller radius = more focused results
            </div>
          </div>

          {/* Welcome Message for New Users */}
          {!selectedLocation && (
            <div style={styles.welcomeMessage}>
              <div style={styles.welcomeIcon}>🎯</div>
              <h4 style={styles.welcomeTitle}>Ready to Discover?</h4>
              <p style={styles.welcomeText}>
                Click on the map to select your analysis location and unlock powerful business insights!
              </p>
              <div style={styles.welcomeSteps}>
                <div style={styles.step}>
                  <span style={styles.stepNumber}>1</span>
                  <span style={styles.stepText}>Select location on map</span>
                </div>
                <div style={styles.step}>
                  <span style={styles.stepNumber}>2</span>
                  <span style={styles.stepText}>Choose search radius & type</span>
                </div>
                <div style={styles.step}>
                  <span style={styles.stepNumber}>3</span>
                  <span style={styles.stepText}>Analyze & export results</span>
                </div>
              </div>
            </div>
          )}

          {/* Selected Location Display */}
          {selectedLocation && (
            <div style={styles.selectedLocationInfo}>
              <div style={styles.locationHeader}>
                <span style={styles.locationIcon}>✅</span>
                <div style={styles.locationDetails}>
                  <div style={styles.locationTitle}>Analysis Location Selected</div>
                  <div style={styles.locationCoords}>
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </div>
                </div>
                <button 
                  onClick={onClearAll}
                  style={styles.changeLocationBtn}
                  title="Change location"
                >
                  🔄
                </button>
              </div>
            </div>
          )}

          {/* Search Form - Enhanced */}
          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            {/* Search Radius with Visual Indicator */}
            <div style={styles.formGroup}>
              <label style={styles.enhancedLabel}>
                <span style={styles.labelIcon}>📍</span>
                Search Radius: <strong>{radius}m</strong>
                <span style={styles.labelHint}>({(parseInt(radius)/1000).toFixed(1)}km circle)</span>
              </label>
              <div style={styles.radiusSelector}>
                {radiusOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRadius(option.value)}
                    style={{
                      ...styles.radiusButton,
                      ...(radius === option.value ? styles.radiusButtonActive : {})
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Mode Selection */}
            <div style={styles.formGroup}>
              <label style={styles.enhancedLabel}>
                <span style={styles.labelIcon}>🎯</span>
                Search Strategy:
              </label>
              <div style={styles.strategyButtons}>
                <button
                  type="button"
                  onClick={() => setGetAllSectors(true)}
                  style={{
                    ...styles.strategyButton,
                    ...(getAllSectors ? styles.strategyButtonActive : {})
                  }}
                >
                  <div style={styles.strategyTitle}>🌐 Complete Market Scan</div>
                  <div style={styles.strategyDesc}>Find all business types (Recommended for analysis)</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setGetAllSectors(false)}
                  style={{
                    ...styles.strategyButton,
                    ...(!getAllSectors ? styles.strategyButtonActive : {})
                  }}
                >
                  <div style={styles.strategyTitle}>🔍 Targeted Search</div>
                  <div style={styles.strategyDesc}>Focus on specific business category</div>
                </button>
              </div>
            </div>

            {/* Category Selection - Only for targeted search */}
            {!getAllSectors && (
              <div style={styles.formGroup}>
                <label style={styles.enhancedLabel}>
                  <span style={styles.labelIcon}>🏪</span>
                  Business Category:
                </label>
                <div style={styles.categoryGrid}>
                  {categories.slice(0, 8).map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      style={{
                        ...styles.categoryButton,
                        ...(category === cat.value ? styles.categoryButtonActive : {})
                      }}
                    >
                      <span style={styles.categoryEmoji}>{getCategoryEmoji(cat.value)}</span>
                      <span style={styles.categoryLabel}>{cat.label}</span>
                    </button>
                  ))}
                </div>
                
                {/* Full category dropdown for all options */}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={styles.categoryDropdown}
                >
                  <option value="">Choose from all categories...</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {getCategoryEmoji(cat.value)} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Enhanced Search Button */}
            <button
              type="submit"
              disabled={!selectedLocation || isLoading}
              style={{
                ...styles.enhancedSearchButton,
                ...((!selectedLocation || isLoading) ? styles.disabledButton : {})
              }}
            >
              {isLoading ? (
                <span>
                  <span style={styles.spinner}>⟳</span> Searching Places...
                </span>
              ) : (
                <span>
                  🚀 {getAllSectors ? 'Discover All Businesses' : `Find ${categories.find(c => c.value === category)?.label || 'Places'}`}
                </span>
              )}
            </button>
          </form>

          {/* Enhanced Results Summary */}
          {resultsCount > 0 && (
            <div style={styles.enhancedResultsInfo}>
              <div style={styles.resultsHeader}>
                <span style={styles.resultsIcon}>✅</span>
                <div style={styles.resultsText}>
                  <div style={styles.resultsMain}>
                    Found <strong>{resultsCount}</strong> business{resultsCount !== 1 ? 'es' : ''}
                  </div>
                  <div style={styles.resultsDetail}>
                    Within {radius}m of selected location
                  </div>
                </div>
              </div>
              
              <div style={styles.actionButtons}>
                <button
                  onClick={onShowCommerceAnalysis}
                  style={styles.primaryActionButton}
                  disabled={!selectedLocation || resultsCount === 0}
                  title="Analyze this location for commerce potential"
                >
                  📊 Start Analysis
                </button>
              </div>
            </div>
          )}

          {/* Progress Indicator for Loading */}
          {isLoading && (
            <div style={styles.loadingProgress}>
              <div style={styles.progressBar}>
                <div style={styles.progressFill}></div>
              </div>
              <div style={styles.loadingText}>
                {getAllSectors ? 'Scanning all business types...' : 'Searching for places...'}
              </div>
            </div>
          )}

          {/* Clear Button - Enhanced */}
          {(resultsCount > 0 || selectedLocation) && (
            <button
              onClick={onClearAll}
              style={styles.enhancedClearButton}
            >
              <span style={styles.clearIcon}>🗑️</span>
              Clear Search & Start Over
            </button>
          )}
        </div>
      )}

      {/* Places List - Only show in places mode */}
      {!showCatchmentMode && places && places.length > 0 && (
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
    </div>
  );
};

const styles = {
  sidebar: {
    width: '380px',
    height: '100vh',
    backgroundColor: '#032842',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Arial, sans-serif',
    zIndex: 1500, // Higher z-index to appear above map
    position: 'fixed', // Fixed positioning to overlay the map
    top: 0,
    left: 0,
    overflow: 'hidden',
    boxShadow: '2px 0 10px rgba(0,0,0,0.3)' // Add shadow for better visual separation
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
    gap: '10px',
    flex: 1
  },
  titleContainer: {
    flex: 1
  },
  logo: {
    height: '20px'
  },
  title: {
    margin: '0 0 5px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white'
  },
  toggleModeButton: {
    padding: '4px 8px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  },
  headerButtons: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '5px'
  },
  locationSection: {
    padding: '15px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.1)'
  },
  locationStatus: {
    fontSize: '12px',
    color: '#17E88F',
    padding: '8px 12px',
    backgroundColor: 'rgba(23, 232, 143, 0.1)',
    borderRadius: '4px',
    border: '1px solid rgba(23, 232, 143, 0.3)'
  },
  locationWarning: {
    fontSize: '12px',
    color: '#f39c12',
    padding: '8px 12px',
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    borderRadius: '4px',
    border: '1px solid rgba(243, 156, 18, 0.3)'
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
  searchForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
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
  travelModeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px'
  },
  travelModeButton: {
    padding: '10px 6px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '6px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  travelModeButtonActive: {
    borderColor: '#17E88F',
    backgroundColor: 'rgba(23, 232, 143, 0.2)'
  },
  modeIcon: {
    fontSize: '18px'
  },
  modeLabel: {
    fontSize: '11px',
    fontWeight: '500'
  },
  timeChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '10px'
  },
  timeChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    backgroundColor: '#17E88F',
    color: '#032842',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  removeTimeButton: {
    background: 'none',
    border: 'none',
    color: '#032842',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addTimeContainer: {
    display: 'flex',
    gap: '6px'
  },
  timeInput: {
    flex: 1,
    padding: '6px 8px',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '4px',
    fontSize: '12px',
    outline: 'none',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white'
  },
  addTimeButton: {
    padding: '6px 10px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
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
  calculateButton: {
    padding: '12px 20px',
    backgroundColor: '#28a745',
    color: 'white',
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
    marginTop: '15px',
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
  clearButton: {
    padding: '10px 16px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    marginTop: '15px',
    width: '100%',
    transition: 'background-color 0.2s'
  },
  commerceAnalysisButton: {
    padding: '8px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    marginLeft: '15px',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 6px rgba(0,123,255,0.3)'
  },

  // Enhanced UI styles for improved Places search
  searchTips: {
    background: '#e8f4f8',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #b3e5fc'
  },
  tipHeader: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0277bd',
    marginBottom: '6px'
  },
  tips: {
    fontSize: '12px',
    color: '#01579b',
    lineHeight: '1.4'
  },
  enhancedLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  labelIcon: {
    fontSize: '16px'
  },
  labelHint: {
    fontSize: '12px',
    color: '#6c757d',
    fontWeight: '400'
  },
  radiusSelector: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px'
  },
  radiusButton: {
    padding: '10px 12px',
    border: '2px solid #dee2e6',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    textAlign: 'center'
  },
  radiusButtonActive: {
    borderColor: '#007acc',
    background: '#007acc',
    color: 'white',
    transform: 'translateY(-1px)',
    boxShadow: '0 3px 6px rgba(0, 122, 204, 0.2)'
  },
  strategyButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  strategyButton: {
    padding: '15px',
    border: '2px solid #dee2e6',
    borderRadius: '10px',
    background: 'white',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease'
  },
  strategyButtonActive: {
    borderColor: '#007acc',
    background: '#f0f8ff',
    transform: 'translateY(-1px)',
    boxShadow: '0 3px 8px rgba(0, 122, 204, 0.15)'
  },
  strategyTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '4px'
  },
  strategyDesc: {
    fontSize: '12px',
    color: '#6c757d',
    lineHeight: '1.3'
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginBottom: '10px'
  },
  categoryButton: {
    padding: '10px 8px',
    border: '2px solid #dee2e6',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  categoryButtonActive: {
    borderColor: '#28a745',
    background: '#f8fff8',
    transform: 'translateY(-1px)'
  },
  categoryEmoji: {
    fontSize: '16px'
  },
  categoryLabel: {
    fontSize: '11px',
    fontWeight: '500'
  },
  categoryDropdown: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '2px solid #dee2e6',
    fontSize: '14px',
    outline: 'none',
    background: 'white'
  },
  enhancedSearchButton: {
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #007acc 0%, #0056b3 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    marginTop: '15px',
    boxShadow: '0 4px 12px rgba(0, 122, 204, 0.3)',
    position: 'relative',
    overflow: 'hidden'
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite'
  },
  loadingProgress: {
    marginTop: '15px',
    padding: '15px',
    background: '#fff3cd',
    borderRadius: '8px',
    border: '1px solid #ffeaa7'
  },
  progressBar: {
    height: '4px',
    background: '#dee2e6',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #007acc, #28a745)',
    width: '100%',
    animation: 'progress 2s ease-in-out infinite'
  },
  loadingText: {
    fontSize: '12px',
    color: '#856404',
    textAlign: 'center',
    fontWeight: '500'
  },
  enhancedResultsInfo: {
    marginTop: '20px',
    padding: '16px',
    background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
    borderRadius: '10px',
    border: '2px solid #28a745',
    boxShadow: '0 3px 10px rgba(40, 167, 69, 0.2)'
  },
  resultsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  resultsIcon: {
    fontSize: '20px'
  },
  resultsText: {
    flex: 1
  },
  resultsMain: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#155724',
    marginBottom: '2px'
  },
  resultsDetail: {
    fontSize: '12px',
    color: '#6c757d'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px'
  },
  primaryActionButton: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 3px 8px rgba(40, 167, 69, 0.3)'
  },
  enhancedClearButton: {
    marginTop: '15px',
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 3px 8px rgba(220, 53, 69, 0.3)'
  },
  clearIcon: {
    fontSize: '16px'
  },
  disabledButton: {
    background: '#6c757d !important',
    cursor: 'not-allowed !important',
    boxShadow: 'none !important'
  },

  // Welcome message styles
  welcomeMessage: {
    background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
    padding: '20px',
    borderRadius: '12px',
    margin: '15px 0',
    border: '2px solid #28a745',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.15)'
  },
  welcomeIcon: {
    fontSize: '32px',
    marginBottom: '10px'
  },
  welcomeTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#155724',
    margin: '0 0 8px 0'
  },
  welcomeText: {
    fontSize: '13px',
    color: '#155724',
    margin: '0 0 15px 0',
    lineHeight: '1.4'
  },
  welcomeSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textAlign: 'left'
  },
  stepNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#28a745',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0
  },
  stepText: {
    fontSize: '12px',
    color: '#155724',
    fontWeight: '500'
  },

  // Selected location info styles
  selectedLocationInfo: {
    background: 'linear-gradient(135deg, #cceeff 0%, #e6f3ff 100%)',
    padding: '15px',
    borderRadius: '10px',
    margin: '15px 0',
    border: '2px solid #007acc',
    boxShadow: '0 3px 10px rgba(0, 122, 204, 0.15)'
  },
  locationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  locationIcon: {
    fontSize: '18px'
  },
  locationDetails: {
    flex: 1
  },
  locationTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0056b3',
    marginBottom: '2px'
  },
  locationCoords: {
    fontSize: '11px',
    color: '#6c757d',
    fontFamily: 'monospace'
  },
  changeLocationBtn: {
    padding: '6px 10px',
    background: 'transparent',
    border: '1px solid #007acc',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s ease'
  }
};

// CSS for spinner and progress animations
const animationKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes progress {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(0%); }
    100% { transform: translateX(100%); }
  }
  
  .enhanced-search-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 122, 204, 0.4) !important;
  }
  
  .primary-action-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4) !important;
  }
  
  .enhanced-clear-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4) !important;
  }
`;

// Inject CSS for animations
if (typeof document !== 'undefined') {
  const existingStyle = document.querySelector('#catchment-animations');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = 'catchment-animations';
    style.textContent = animationKeyframes;
    document.head.appendChild(style);
  }
}

export default CatchmentSidebar;