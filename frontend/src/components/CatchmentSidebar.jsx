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

  // Format distance
  const formatDistance = (place) => {
    if (!selectedLocation) return '';
    const distance = calculateDistance(
      selectedLocation.lat, selectedLocation.lng,
      place.coordinates.lat, place.coordinates.lng
    );
    return distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(1)}km`;
  };

  // Remove the visibility check to ensure sidebar always renders
  // if (!visible) return null;

  return (
    <div style={{
      ...styles.sidebar,
      transform: visible ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.3s ease-in-out'
    }}>
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

          {/* Enhanced Commerce Analysis Option when catchment data is available */}
          {catchmentData && catchmentData.length > 0 && onShowCommerceAnalysis && (
            <div style={styles.enhancedAnalysisSection}>
              <div style={styles.enhancedAnalysisHeader}>
                🎯 Enhanced Analysis Available
              </div>
              <div style={styles.enhancedAnalysisDescription}>
                Your catchment areas contain rich business data. Get detailed commerce insights using intersection analysis.
              </div>
              <button
                onClick={() => onShowCommerceAnalysis()}
                style={styles.enhancedCommerceBtn}
                className="enhanced-commerce-btn"
              >
                🏪 ⭐ Enhanced Commerce Analysis
              </button>
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
        <div style={styles.searchSection} className="search-section">
          <h5 style={styles.sectionTitle}>
            🔍 Smart Place Discovery
          </h5>

          {/* Selected Location Display - removed */}

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
                    className="radius-button"
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
                  className="strategy-button"
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
                  className="strategy-button"
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
              className="enhanced-search-button"
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

          {/* Results Summary with Auto-Analysis */}
          {places && places.length > 0 && !isLoading && (
            <div style={styles.resultsAnalysis}>
              <div style={styles.analysisHeader}>
                <h6 style={styles.analysisTitle}>
                  📊 Quick Analysis ({places.length} places found)
                </h6>
              </div>
              
              <div style={styles.analysisGrid}>
                <div style={styles.analysisStat}>
                  <div style={styles.statValue}>{places.length}</div>
                  <div style={styles.statLabel}>Total Found</div>
                </div>
                
                <div style={styles.analysisStat}>
                  <div style={styles.statValue}>
                    {[...new Set(places.map(p => p.search_type))].length}
                  </div>
                  <div style={styles.statLabel}>Categories</div>
                </div>
                
                <div style={styles.analysisStat}>
                  <div style={styles.statValue}>
                    {places.filter(p => p.rating >= 4.0).length}
                  </div>
                  <div style={styles.statLabel}>High Rated</div>
                </div>
              </div>

              {/* Direct Export Actions */}
              {onShowCommerceAnalysis && (
                <div style={styles.directActions}>
                  <button
                    onClick={() => onShowCommerceAnalysis()}
                    style={styles.commerceAnalysisBtn}
                  >
                    🏪 Full Commerce Analysis
                  </button>
                </div>
              )}
            </div>
          )}
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
    overflow: 'hidden',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 1500 // Higher z-index to appear above map
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
  searchSection: {
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: '6px',
    margin: '6px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease',
    transform: 'translateX(0)',
    backdropFilter: 'blur(5px)'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
    borderBottom: '2px solid rgba(255,255,255,0.2)',
    paddingBottom: '4px'
  },
  placesIcon: {
    fontSize: '16px'
  },
  searchForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
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
  enhancedAnalysisSection: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: 'rgba(23, 162, 184, 0.1)',
    border: '2px solid rgba(23, 162, 184, 0.3)',
    borderRadius: '8px',
    textAlign: 'center'
  },
  enhancedAnalysisHeader: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#17a2b8',
    marginBottom: '8px'
  },
  enhancedAnalysisDescription: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '12px',
    lineHeight: '1.4'
  },
  enhancedCommerceBtn: {
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 6px rgba(23, 162, 184, 0.3)',
    width: '100%'
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

  // Results Analysis Styles
  resultsAnalysis: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: 'rgba(23, 232, 143, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(23, 232, 143, 0.3)',
    backdropFilter: 'blur(10px)'
  },
  analysisHeader: {
    marginBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    paddingBottom: '8px'
  },
  analysisTitle: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '600',
    color: '#17E88F',
    textAlign: 'center'
  },
  analysisGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '10px',
    marginBottom: '15px'
  },
  analysisStat: {
    textAlign: 'center',
    padding: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  statValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#17E88F',
    marginBottom: '2px'
  },
  statLabel: {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  directActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px'
  },
  commerceAnalysisBtn: {
    padding: '10px 20px',
    backgroundColor: '#17E88F',
    color: '#032842',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    boxShadow: '0 3px 10px rgba(23, 232, 143, 0.3)'
  },

  // Enhanced UI styles for improved Places search
  searchTips: {
    background: 'rgba(232, 244, 248, 0.1)',
    padding: '8px',
    borderRadius: '6px',
    marginBottom: '10px',
    border: '1px solid rgba(179, 229, 252, 0.3)',
    backdropFilter: 'blur(10px)'
  },
  tipHeader: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#17E88F',
    marginBottom: '4px'
  },
  tips: {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: '1.3'
  },
  enhancedLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '4px'
  },
  labelIcon: {
    fontSize: '12px'
  },
  labelHint: {
    fontSize: '9px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400'
  },
  radiusSelector: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
    marginTop: '8px'
  },
  radiusButton: {
    padding: '6px 8px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    color: 'white',
    backdropFilter: 'blur(10px)'
  },
  radiusButtonActive: {
    borderColor: '#17E88F',
    background: 'rgba(23, 232, 143, 0.2)',
    color: '#17E88F',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 6px rgba(23, 232, 143, 0.3)'
  },
  strategyButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  strategyButton: {
    padding: '10px 12px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    color: 'white',
    backdropFilter: 'blur(10px)'
  },
  strategyButtonActive: {
    borderColor: '#17E88F',
    background: 'rgba(23, 232, 143, 0.15)',
    transform: 'translateY(-1px)',
    boxShadow: '0 3px 8px rgba(23, 232, 143, 0.2)'
  },
  strategyTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '3px'
  },
  strategyDesc: {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: '1.2'
  },
  categoryDropdown: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    fontSize: '12px',
    outline: 'none',
    background: '#2563eb',
    color: 'white',
    backdropFilter: 'blur(10px)',
    marginTop: '4px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  enhancedSearchButton: {
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #17E88F 0%, #0ea370 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    marginTop: '12px',
    boxShadow: '0 3px 10px rgba(23, 232, 143, 0.3)',
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
    marginTop: '12px',
    padding: '12px',
    background: 'rgba(23, 232, 143, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(23, 232, 143, 0.3)',
    boxShadow: '0 2px 8px rgba(23, 232, 143, 0.15)',
    backdropFilter: 'blur(10px)'
  },
  resultsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px'
  },
  resultsIcon: {
    fontSize: '18px'
  },
  resultsText: {
    flex: 1
  },
  resultsMain: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '2px'
  },
  resultsDetail: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.8)'
  },
  actionButtons: {
    display: 'flex',
    gap: '6px'
  },
  primaryActionButton: {
    padding: '8px 14px',
    background: 'linear-gradient(135deg, #17E88F 0%, #0ea370 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 6px rgba(23, 232, 143, 0.3)'
  },
  enhancedClearButton: {
    marginTop: '10px',
    padding: '8px 14px',
    background: 'rgba(220, 53, 69, 0.2)',
    color: '#ffffff',
    border: '1px solid rgba(220, 53, 69, 0.4)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)'
  },
  clearIcon: {
    fontSize: '14px'
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
  }
};

// CSS for enhanced animations and slide effects
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
  
  @keyframes slideInLeft {
    0% { transform: translateX(-100%); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes fadeIn {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  .search-section {
    animation: fadeIn 0.5s ease-out;
  }
  
  .radius-button:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(23, 232, 143, 0.4) !important;
  }
  
  .strategy-button:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(23, 232, 143, 0.3) !important;
  }
  
  .category-button:hover {
    transform: translateY(-2px) scale(1.05) !important;
    box-shadow: 0 3px 8px rgba(23, 232, 143, 0.3) !important;
  }
  
  .enhanced-search-button:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 16px rgba(23, 232, 143, 0.5) !important;
  }
  
  .primary-action-button:hover {
    transform: translateY(-1px) scale(1.02) !important;
    box-shadow: 0 4px 12px rgba(23, 232, 143, 0.4) !important;
  }
  
  .enhanced-clear-button:hover {
    transform: translateY(-1px) !important;
    background: rgba(220, 53, 69, 0.3) !important;
    border-color: rgba(220, 53, 69, 0.6) !important;
  }
  
  .search-section:hover {
    transform: translateX(2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
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