import React, { useState, useRef, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import GooglePlacesService from '../services/GooglePlaces';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Catchment Controls Component
const CatchmentControls = ({ onCalculate, isLoading, selectedLocation }) => {
  const [travelMode, setTravelMode] = useState('driving');
  const [driveTimes, setDriveTimes] = useState([15, 30, 45]);
  const [customTime, setCustomTime] = useState('');
  const [showDemographics, setShowDemographics] = useState(true);

  const handleCalculate = () => {
    if (!selectedLocation) {
      alert('Please click on the map to select a location first');
      return;
    }

    if (driveTimes.length === 0) {
      alert('Please add at least one drive time');
      return;
    }

    onCalculate({
      location: selectedLocation,
      travelMode,
      driveTimes,
      showDemographics
    });
  };

  const addCustomTime = () => {
    const time = parseInt(customTime);
    if (time > 0 && time <= 60 && !driveTimes.includes(time)) {
      setDriveTimes([...driveTimes, time].sort((a, b) => a - b));
      setCustomTime('');
    }
  };

  const removeTime = (timeToRemove) => {
    if (driveTimes.length > 1) {
      setDriveTimes(driveTimes.filter(time => time !== timeToRemove));
    }
  };

  const travelModeOptions = [
    { value: 'driving', label: '🚗 Driving', icon: '🚗' },
    { value: 'walking', label: '🚶 Walking', icon: '🚶' },
    { value: 'transit', label: '🚌 Transit', icon: '🚌' },
    { value: 'bicycling', label: '🚴 Bicycling', icon: '🚴' }
  ];

  return (
    <div style={styles.controlsPanel}>
      <div style={styles.controlsHeader}>
        <h3 style={styles.controlsTitle}>🕐 Drive Time Catchment Analysis</h3>
        {selectedLocation && (
          <div style={styles.locationDisplay}>
            📍 {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
          </div>
        )}
      </div>

      <div style={styles.controlsContent}>
        {/* Travel Mode Selection */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Travel Mode:</label>
          <div style={styles.travelModeGrid}>
            {travelModeOptions.map(mode => (
              <button
                key={mode.value}
                onClick={() => setTravelMode(mode.value)}
                style={{
                  ...styles.travelModeButton,
                  ...(travelMode === mode.value ? styles.travelModeButtonActive : {})
                }}
              >
                <span style={styles.modeIcon}>{mode.icon}</span>
                <span style={styles.modeLabel}>{mode.label.replace(/🚗|🚶|🚌|🚴/, '').trim()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Drive Times */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Drive Times (minutes):</label>
          <div style={styles.timeChips}>
            {driveTimes.map(time => (
              <div key={time} style={styles.timeChip}>
                <span>{time}min</span>
                {driveTimes.length > 1 && (
                  <button
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
              placeholder="Add time (1-60)"
              min="1"
              max="60"
              style={styles.timeInput}
            />
            <button
              onClick={addCustomTime}
              disabled={!customTime || customTime < 1 || customTime > 60}
              style={styles.addTimeButton}
            >
              Add
            </button>
          </div>
        </div>

        {/* Options */}
        <div style={styles.fieldGroup}>
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
          onClick={handleCalculate}
          disabled={isLoading || !selectedLocation || driveTimes.length === 0}
          style={{
            ...styles.calculateButton,
            ...(isLoading || !selectedLocation || driveTimes.length === 0 ? styles.calculateButtonDisabled : {})
          }}
        >
          {isLoading ? 'Calculating...' : 'Calculate Catchment'}
        </button>
      </div>
    </div>
  );
};

// Demographic Charts Component
const DemographicCharts = ({ data, driveTime }) => {
  if (!data) return null;

  const genderData = {
    labels: ['Women', 'Men'],
    datasets: [{
      data: [data.pourcentWomen, data.pourcentMan],
      backgroundColor: ['#FF6384', '#36A2EB'],
      borderColor: ['#FF6384', '#36A2EB'],
      borderWidth: 2,
    }]
  };

  const ageData = {
    labels: ['0-14', '15-29', '30-44', '45-59', '60+'],
    datasets: [{
      label: 'Population %',
      data: [
        data.pourcentAge0014,
        data.pourcentAge1529,
        data.pourcentAge3044,
        data.pourcentAge4559,
        data.pourcentAge60PL
      ],
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ],
      borderWidth: 1,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 11
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 10
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 10
          }
        }
      }
    }
  };

  return (
    <div style={styles.demographicSection}>
      <h4 style={styles.demographicTitle}>{driveTime} Drive Time Demographics</h4>
      <div style={styles.chartsGrid}>
        <div style={styles.chartContainer}>
          <h5 style={styles.chartTitle}>Gender Distribution</h5>
          <div style={styles.chartWrapper}>
            <Doughnut data={genderData} options={chartOptions} />
          </div>
        </div>
        
        <div style={styles.chartContainer}>
          <h5 style={styles.chartTitle}>Age Distribution</h5>
          <div style={styles.chartWrapper}>
            <Bar data={ageData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Catchment Results Component
const CatchmentResults = ({ results, onClose, onDownload }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!results || results.length === 0) return null;

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getTimeColor = (index) => {
    const colors = ['#007bff', '#ffc107', '#dc3545', '#28a745', '#6f42c1', '#fd7e14'];
    return colors[index % colors.length];
  };

  return (
    <div style={styles.resultsPanel}>
      <div style={styles.resultsHeader}>
        <div style={styles.resultsTitle}>
          <span style={styles.resultsIcon}>🎯</span>
          <span>Catchment Analysis Results</span>
        </div>
        <button onClick={onClose} style={styles.closeButton}>
          ✕
        </button>
      </div>

      <div style={styles.tabsContainer}>
        <div style={styles.tabHeaders}>
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              style={{
                ...styles.tabButton,
                ...(activeTab === index ? styles.tabButtonActive : {}),
                borderBottomColor: getTimeColor(index)
              }}
            >
              {result.name}
            </button>
          ))}
        </div>

        <div style={styles.tabContent}>
          {results[activeTab] && (
            <div style={styles.tabPane}>
              {/* Key Metrics */}
              <div style={styles.metricsGrid}>
                <div style={styles.metricCard}>
                  <div style={styles.metricValue}>{formatNumber(results[activeTab].totalPopulation)}</div>
                  <div style={styles.metricLabel}>Total Population</div>
                </div>
                <div style={styles.metricCard}>
                  <div style={styles.metricValue}>{formatNumber(results[activeTab].totalHouseHolds)}</div>
                  <div style={styles.metricLabel}>Households</div>
                </div>
                <div style={styles.metricCard}>
                  <div style={styles.metricValue}>{results[activeTab].householdsMember}</div>
                  <div style={styles.metricLabel}>Avg. Household Size</div>
                </div>
                <div style={styles.metricCard}>
                  <div style={styles.metricValue}>€{formatNumber(results[activeTab].purchasePowerPerson)}</div>
                  <div style={styles.metricLabel}>Purchase Power/Person</div>
                </div>
              </div>

              {/* Demographics Charts */}
              <DemographicCharts 
                data={results[activeTab]} 
                driveTime={results[activeTab].name}
              />
            </div>
          )}
        </div>
      </div>

      <div style={styles.resultsFooter}>
        <button onClick={onDownload} style={styles.downloadButton}>
          📊 Download Report
        </button>
      </div>
    </div>
  );
};

// Main Catchment Analysis Component
const CatchmentAnalysis = ({ map, selectedLocation, onLocationSelect }) => {
  const [catchmentResults, setCatchmentResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentParams, setCurrentParams] = useState(null);

  const handleCalculate = async (params) => {
    setIsLoading(true);
    setCurrentParams(params);
    
    try {
      console.log('Calculating catchment with params:', params);
      
      // Use the updated API call with correct parameters
      const response = await GooglePlacesService.calculateCatchment(
        params.location,
        params.travelMode,
        params.driveTimes,
        params.showDemographics
      );
      
      console.log('Catchment calculation response:', response);
      
      setCatchmentResults(response.catchmentResults || []);
      setShowResults(true);
      
      // Add catchment polygons to map
      if (map && response.catchmentResults && response.catchmentResults.length > 0) {
        console.log('Adding catchment polygons to map');
        if (map.addCatchmentPolygons) {
          map.addCatchmentPolygons(response.catchmentResults);
        } else {
          console.error('Map addCatchmentPolygons method not available');
        }
      }
      
    } catch (error) {
      console.error('Error calculating catchment:', error);
      alert('Error calculating catchment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    // Generate a simple CSV report
    const csvContent = generateCSVReport(catchmentResults, currentParams);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `catchment_analysis_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSVReport = (results, params) => {
    const headers = [
      'Drive Time (min)',
      'Total Population',
      'Households',
      'Avg Household Size',
      'Women (%)',
      'Men (%)',
      'Age 0-14 (%)',
      'Age 15-29 (%)',
      'Age 30-44 (%)',
      'Age 45-59 (%)',
      'Age 60+ (%)',
      'Purchase Power per Person (€)'
    ];

    const rows = results.map(result => [
      result.driveTime,
      result.totalPopulation,
      result.totalHouseHolds,
      result.householdsMember,
      result.pourcentWomen?.toFixed(1) || 0,
      result.pourcentMan?.toFixed(1) || 0,
      result.pourcentAge0014?.toFixed(1) || 0,
      result.pourcentAge1529?.toFixed(1) || 0,
      result.pourcentAge3044?.toFixed(1) || 0,
      result.pourcentAge4559?.toFixed(1) || 0,
      result.pourcentAge60PL?.toFixed(1) || 0,
      result.purchasePowerPerson
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const clearResults = () => {
    setShowResults(false);
    setCatchmentResults([]);
    if (map && map.clearCatchments) {
      map.clearCatchments();
    }
  };

  return (
    <div style={styles.container}>
      {/* Controls */}
      <CatchmentControls
        onCalculate={handleCalculate}
        isLoading={isLoading}
        selectedLocation={selectedLocation}
      />

      {/* Results Panel */}
      {showResults && (
        <CatchmentResults
          results={catchmentResults}
          onClose={clearResults}
          onDownload={handleDownload}
        />
      )}

      {/* Clear Results Button */}
      {showResults && (
        <button
          onClick={clearResults}
          style={styles.clearResultsButton}
        >
          🗑️ Clear Results
        </button>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingContent}>
            <div style={styles.spinner}></div>
            <h3 style={styles.loadingText}>Calculating Drive Time Catchment...</h3>
            <p style={styles.loadingSubText}>Analyzing demographic data and accessibility</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!selectedLocation && (
        <div style={styles.instructionsPanel}>
          <h3 style={styles.instructionsTitle}>📍 Get Started</h3>
          <p style={styles.instructionsText}>
            Click anywhere on the map to select a location for catchment analysis
          </p>
        </div>
      )}
    </div>
  );
};

// Styles (keeping the same styles as before)
const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%'
  },
  controlsPanel: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    width: '400px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    zIndex: 1000,
    overflow: 'hidden'
  },
  controlsHeader: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e9ecef'
  },
  controlsTitle: {
    margin: '0 0 10px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333'
  },
  locationDisplay: {
    fontSize: '12px',
    color: '#666',
    backgroundColor: '#e8f5e8',
    padding: '4px 8px',
    borderRadius: '4px',
    display: 'inline-block'
  },
  controlsContent: {
    padding: '20px'
  },
  fieldGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  travelModeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px'
  },
  travelModeButton: {
    padding: '12px 8px',
    border: '2px solid #e9ecef',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  travelModeButtonActive: {
    borderColor: '#007bff',
    backgroundColor: '#e7f3ff'
  },
  modeIcon: {
    fontSize: '20px'
  },
  modeLabel: {
    fontSize: '12px',
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
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },
  removeTimeButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addTimeContainer: {
    display: 'flex',
    gap: '8px'
  },
  timeInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  addTimeButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  checkbox: {
    cursor: 'pointer'
  },
  calculateButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  calculateButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  resultsPanel: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '450px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    zIndex: 1000,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  resultsHeader: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  resultsTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333'
  },
  resultsIcon: {
    fontSize: '20px'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#666',
    padding: '8px'
  },
  tabsContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  tabHeaders: {
    display: 'flex',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e9ecef'
  },
  tabButton: {
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s'
  },
  tabButtonActive: {
    backgroundColor: 'white',
    borderBottomColor: '#007bff'
  },
  tabContent: {
    flex: 1,
    overflow: 'auto'
  },
  tabPane: {
    padding: '20px'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '20px'
  },
  metricCard: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center'
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: '4px'
  },
  metricLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500'
  },
  demographicSection: {
    marginTop: '20px'
  },
  demographicTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  },
  chartContainer: {
    backgroundColor: '#f8f9fa',
    padding: '16px',
    borderRadius: '8px'
  },
  chartTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
    textAlign: 'center',
    color: '#333'
  },
  chartWrapper: {
    height: '200px',
    position: 'relative'
  },
  resultsFooter: {
    padding: '20px',
    borderTop: '1px solid #e9ecef',
    backgroundColor: '#f8f9fa'
  },
  downloadButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  clearResultsButton: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    padding: '12px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    zIndex: 1000
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000
  },
  loadingContent: {
    textAlign: 'center',
    color: 'white'
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '6px solid #f3f3f3',
    borderTop: '6px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px'
  },
  loadingText: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '10px'
  },
  loadingSubText: {
    fontSize: '14px',
    opacity: 0.8
  },
  instructionsPanel: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    textAlign: 'center',
    zIndex: 1000
  },
  instructionsTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  instructionsText: {
    margin: 0,
    fontSize: '14px',
    color: '#666'
  }
};

// CSS for spinner animation
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinKeyframes;
  document.head.appendChild(style);
}

export default CatchmentAnalysis;