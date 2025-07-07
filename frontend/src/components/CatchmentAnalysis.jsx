import React, { useState, useRef, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Catchment Controls Component
const CatchmentControls = ({ onCalculate, isLoading, selectedLocation }) => {
  const [searchAddress, setSearchAddress] = useState('Brussels');
  const [distances, setDistances] = useState('15');
  const [departTime, setDepartTime] = useState('');
  const [travelMode, setTravelMode] = useState('Driving Time');

  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setDepartTime(now.toISOString().slice(0, 16));
  }, []);

  const handleCalculate = () => {
    onCalculate({
      address: searchAddress,
      distances: distances.split(',').map(d => parseInt(d.trim())),
      departTime,
      travelMode
    });
  };

  return (
    <div style={styles.topBar}>
      <div style={styles.inputGroup}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="#80BBAD">
          <path fillRule="evenodd" d="M11.291 21.706 12 21l-.709.706zM12 21l.708.706a1 1 0 0 1-1.417 0l-.006-.007-.017-.017-.062-.063a47.708 47.708 0 0 1-1.04-1.106 49.562 49.562 0 0 1-2.456-2.908c-.892-1.15-1.804-2.45-2.497-3.734C4.535 12.612 4 11.248 4 10c0-4.539 3.592-8 8-8 4.408 0 8 3.461 8 8 0 1.248-.535 2.612-1.213 3.87-.693 1.286-1.604 2.585-2.497 3.735a49.583 49.583 0 0 1-3.496 4.014l-.062.063-.017.017-.006.006L12 21zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          placeholder="Enter a location"
          style={styles.input}
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Distances (min):</label>
        <input
          type="text"
          value={distances}
          onChange={(e) => setDistances(e.target.value)}
          placeholder="15,30,45"
          style={styles.smallInput}
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Depart time:</label>
        <input
          type="datetime-local"
          value={departTime}
          onChange={(e) => setDepartTime(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Travel mode:</label>
        <select
          value={travelMode}
          onChange={(e) => setTravelMode(e.target.value)}
          style={styles.select}
        >
          <option value="Driving Time">Car</option>
          <option value="Trucking Time">Truck</option>
          <option value="Walking Time">Walk</option>
        </select>
      </div>

      <button
        onClick={handleCalculate}
        disabled={isLoading || !selectedLocation}
        style={{
          ...styles.button,
          ...(isLoading || !selectedLocation ? styles.buttonDisabled : {})
        }}
      >
        {isLoading ? 'Calculating...' : 'Calculate'}
      </button>
    </div>
  );
};

// Demographic Charts Component
const DemographicCharts = ({ data, uniqueId }) => {
  const genderData = {
    labels: ['Women', 'Men'],
    datasets: [{
      data: [data.pourcentWomen, data.pourcentMan],
      backgroundColor: ['rgba(136, 80, 115, 1)', 'rgba(62, 125, 166, 1)'],
      borderColor: ['rgba(136, 80, 115, 1)', 'rgba(62, 125, 166, 1)'],
      borderWidth: 2,
    }]
  };

  const ageData = {
    labels: ['0-14', '15-29', '30-44', '45-59', '59+'],
    datasets: [{
      label: 'Age range',
      data: [
        data.pourcentAge0014,
        data.pourcentAge1529,
        data.pourcentAge3044,
        data.pourcentAge4559,
        data.pourcentAge60PL
      ],
      backgroundColor: [
        'rgba(210, 120, 90, 1)',
        'rgba(31, 55, 101, 1)',
        'rgba(23, 232, 143, 1)',
        'rgba(219, 217, 154, 1)',
        'rgba(163, 136, 191, 1)'
      ],
      borderWidth: 2,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  return (
    <div style={styles.chartsContainer}>
      <div style={styles.chartSection}>
        <h4 style={styles.chartTitle}>Gender Distribution</h4>
        <div style={styles.chartWrapper}>
          <Doughnut data={genderData} options={chartOptions} />
        </div>
      </div>
      
      <hr style={styles.divider} />
      
      <div style={styles.chartSection}>
        <h4 style={styles.chartTitle}>Population by Age</h4>
        <div style={styles.chartWrapper}>
          <Bar data={ageData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

// Catchment Results Component
const CatchmentResults = ({ results, onClose, onDownload, onPrint }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!results || results.length === 0) return null;

  const formatNumber = (num) => {
    return new Intl.NumberFormat('de-DE').format(num);
  };

  return (
    <div style={styles.resultsPanel}>
      <div style={styles.resultsHeader}>
        <div style={styles.resultsTitle}>
          <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <span style={styles.titleText}>Catchment Details</span>
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
                ...(activeTab === index ? styles.tabButtonActive : {})
              }}
            >
              {result.name}
            </button>
          ))}
        </div>

        <div style={styles.tabContent}>
          {results[activeTab] && (
            <div style={styles.tabPane}>
              <table style={styles.dataTable}>
                <tbody>
                  <tr>
                    <td><b>Purchase Power</b></td>
                    <td>{results[activeTab].totalMIO} mio €</td>
                  </tr>
                  <tr>
                    <td><b>Purchase Power / person</b></td>
                    <td>{results[activeTab].purchasePowerPerson} €</td>
                  </tr>
                  <tr>
                    <td><b>Household Size</b></td>
                    <td>{results[activeTab].householdsMember}</td>
                  </tr>
                  <tr>
                    <td><b>Households</b></td>
                    <td>{results[activeTab].totalHouseHolds}</td>
                  </tr>
                  <tr>
                    <td><b>Population</b></td>
                    <td>{formatNumber(results[activeTab].totalPopulation)}</td>
                  </tr>
                </tbody>
              </table>

              <DemographicCharts 
                data={results[activeTab]} 
                uniqueId={`tab-${activeTab}`}
              />
            </div>
          )}
        </div>
      </div>

      <div style={styles.resultsFooter}>
        <button onClick={onDownload} style={styles.downloadButton}>
          Download PDF
        </button>
        <button onClick={onPrint} style={styles.printButton}>
          Print Map
        </button>
      </div>
    </div>
  );
};

// Layer Switcher Component
const LayerSwitcher = ({ currentLayer, onLayerChange }) => {
  return (
    <div style={styles.layerSwitcher}>
      <button
        onClick={onLayerChange}
        style={styles.layerButton}
      >
        {currentLayer === 'catchment' ? 'Switch to Commune' : 'Switch to Catchment'}
      </button>
    </div>
  );
};

// Basemap Selector Component
const BasemapSelector = ({ onBasemapChange }) => {
  const basemaps = [
    { id: 'light', name: 'Light Gray Canvas', image: '/img/thumbnail1607388219207.jpeg' },
    { id: 'dark', name: 'Dark Gray Canvas', image: '/img/thumbnail1607387673856.jpeg' },
    { id: 'satellite', name: 'Satellite', image: '/img/thumbnail1607389112065.jpeg' },
    { id: 'terrain', name: 'Terrain', image: '/img/thumbnail1607389307240.jpeg' }
  ];

  return (
    <div style={styles.basemapContainer}>
      <h4 style={styles.basemapTitle}>Basemap Options:</h4>
      {basemaps.map(basemap => (
        <div 
          key={basemap.id}
          style={styles.basemapOption}
          onClick={() => onBasemapChange(basemap.id)}
        >
          <img 
            src={basemap.image} 
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
  );
};

// Main Catchment Analysis Component
const CatchmentAnalysis = ({ map, selectedLocation, onLocationSelect }) => {
  const [currentLayer, setCurrentLayer] = useState('catchment');
  const [catchmentResults, setCatchmentResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleCalculate = async (params) => {
    setIsLoading(true);
    try {
      // Mock catchment calculation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock results based on distances
      const mockResults = params.distances.map((distance, index) => ({
        name: `${distance} minutes`,
        totalPopulation: Math.floor(Math.random() * 50000) + 10000,
        pourcentWomen: Math.floor(Math.random() * 10) + 45,
        pourcentMan: Math.floor(Math.random() * 10) + 45,
        pourcentAge0014: Math.floor(Math.random() * 20) + 10,
        pourcentAge1529: Math.floor(Math.random() * 20) + 15,
        pourcentAge3044: Math.floor(Math.random() * 20) + 20,
        pourcentAge4559: Math.floor(Math.random() * 20) + 15,
        pourcentAge60PL: Math.floor(Math.random() * 20) + 10,
        totalHouseHolds: Math.floor(Math.random() * 20000) + 5000,
        householdsMember: (Math.random() * 2 + 2).toFixed(1),
        totalMIO: Math.floor(Math.random() * 500) + 100,
        purchasePowerPerson: Math.floor(Math.random() * 10000) + 25000
      }));

      setCatchmentResults(mockResults);
      setShowResults(true);
    } catch (error) {
      console.error('Error calculating catchment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLayerChange = () => {
    setCurrentLayer(prev => prev === 'catchment' ? 'commune' : 'catchment');
  };

  const handleDownload = () => {
    alert('Download functionality would generate PDF report');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBasemapChange = (basemapId) => {
    console.log('Changing basemap to:', basemapId);
    // Implement basemap change logic
  };

  return (
    <div style={styles.container}>
      {/* Controls */}
      <CatchmentControls
        onCalculate={handleCalculate}
        isLoading={isLoading}
        selectedLocation={selectedLocation}
      />

      {/* Layer Switcher */}
      <LayerSwitcher
        currentLayer={currentLayer}
        onLayerChange={handleLayerChange}
      />

      {/* Results Panel */}
      {showResults && (
        <CatchmentResults
          results={catchmentResults}
          onClose={() => setShowResults(false)}
          onDownload={handleDownload}
          onPrint={handlePrint}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingContent}>
            <div style={styles.spinner}></div>
            <h2 style={styles.loadingText}>Calculating Catchment...</h2>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%'
  },
  topBar: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    right: '20px',
    display: 'flex',
    gap: '15px',
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    zIndex: 1000,
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    whiteSpace: 'nowrap'
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    minWidth: '150px'
  },
  smallInput: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    width: '80px'
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white',
    minWidth: '120px'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  layerSwitcher: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    zIndex: 1000
  },
  layerButton: {
    padding: '12px 20px',
    backgroundColor: '#032842',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  resultsPanel: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '400px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    zIndex: 1000,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column'
  },
  resultsHeader: {
    backgroundColor: '#032842',
    color: 'white',
    padding: '15px 20px',
    borderRadius: '8px 8px 0 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  resultsTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  titleText: {
    fontSize: '16px',
    fontWeight: '600'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '5px'
  },
  tabsContainer: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  tabHeaders: {
    display: 'flex',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e0e0e0'
  },
  tabButton: {
    flex: 1,
    padding: '10px 15px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    borderBottom: '3px solid transparent'
  },
  tabButtonActive: {
    backgroundColor: 'white',
    borderBottom: '3px solid #007bff'
  },
  tabContent: {
    flex: 1,
    overflow: 'auto',
    padding: '20px'
  },
  tabPane: {
    height: '100%'
  },
  dataTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px'
  },
  chartsContainer: {
    marginTop: '20px'
  },
  chartSection: {
    marginBottom: '20px'
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '15px',
    textAlign: 'center',
    color: '#333'
  },
  chartWrapper: {
    height: '250px',
    position: 'relative'
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e0e0e0',
    margin: '20px 0'
  },
  resultsFooter: {
    padding: '15px 20px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  downloadButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  printButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  basemapContainer: {
    padding: '20px'
  },
  basemapTitle: {
    fontSize: '16px',
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
    color: 'white'
  },
  basemapThumbnail: {
    width: '40px',
    height: '30px',
    objectFit: 'cover',
    borderRadius: '4px'
  },
  basemapName: {
    fontSize: '14px'
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px'
  },
  loadingText: {
    fontSize: '18px',
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

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinKeyframes;
  document.head.appendChild(style);
}

export default CatchmentAnalysis;