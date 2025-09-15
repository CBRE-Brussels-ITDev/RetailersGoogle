import React, { useState, useRef, useEffect } from 'react';
import Map from './Map';

const ResidentialView = ({ onBack }) => {
  const [selectedRadius, setSelectedRadius] = useState(null);
  const [buildingsInRadius, setBuildingsInRadius] = useState([]);
  const [radiusCenter, setRadiusCenter] = useState(null);
  const [calculations, setCalculations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef(null);

  // Export market analysis to Excel
  const exportToExcel = async () => {
    if (!calculations || !buildingsInRadius.length) {
      alert('No data available to export');
      return;
    }

    try {
      const originalLoading = isLoading;
      setIsLoading(true);
      
      // Prepare data for export
      const exportData = {
        marketAnalysis: calculations,
        buildings: buildingsInRadius,
        location: radiusCenter,
        radius: selectedRadius
      };

      // Send to backend for Excel generation
      const response = await fetch('http://localhost:8080/api/residential/export-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `residential_analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting to Excel. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle map click to create 1km radius and fetch buildings
  const handleMapClick = async (lat, lng) => {
    if (!lat || !lng) return;

    const radiusKm = 1.0; // Fixed 1km radius

    setIsLoading(true);
    setRadiusCenter({ lat, lng });

    try {
      console.log(`Fetching buildings within ${radiusKm}km of ${lat}, ${lng}`);
      
      // Fetch buildings within radius from backend
      const response = await fetch('http://localhost:8080/api/residential/buildings-in-radius', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat,
          lng,
          radius_km: radiusKm
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received building data:', data);
      setBuildingsInRadius(data.buildings || []);
      setCalculations(data.calculations || null);

      // Add radius circle and building markers to map
      if (mapRef.current) {
        console.log('Map ref is available, adding graphics...');
        // Clear previous graphics
        mapRef.current.clearAll();
        
        // Add radius circle
        console.log('Adding radius circle at:', { lat, lng }, 'radius:', radiusKm * 1000, 'meters');
        mapRef.current.addRadiusCircle({ lat, lng }, radiusKm * 1000); // Convert to meters
        
        // Add building markers
        if (data.buildings && data.buildings.length > 0) {
          console.log('Adding building markers, count:', data.buildings.length);
          mapRef.current.addBuildingMarkers(data.buildings);
        } else {
          console.log('No buildings to add as markers');
        }
      } else {
        console.error('Map ref is not available');
      }

      setSelectedRadius({ center: { lat, lng }, radius: radiusKm });

    } catch (error) {
      console.error('Error fetching buildings:', error);
      alert('Error fetching building data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <button
              onClick={onBack}
              style={styles.backButton}
              title="Back to Main View"
            >
              ← Back
            </button>
            <h2 style={styles.title}>Residential Analysis</h2>
          </div>
          <p style={styles.subtitle}>Click on the map to analyze buildings within 1km radius</p>
        </div>

        {isLoading && (
          <div style={styles.loadingSection}>
            <div style={styles.loading}>Loading buildings...</div>
          </div>
        )}

        {selectedRadius && !isLoading && (
          <div style={styles.resultsSection}>
            <div style={styles.radiusInfo}>
              <h3 style={styles.sectionTitle}>Selected Area</h3>
              <p style={styles.infoText}>
                Center: {radiusCenter.lat.toFixed(4)}, {radiusCenter.lng.toFixed(4)}
              </p>
              <p style={styles.infoText}>Radius: {selectedRadius.radius}km</p>
              <p style={styles.infoText}>Buildings found: {buildingsInRadius.length}</p>
            </div>

            {calculations && (
              <div style={styles.calculationsSection}>
                <div style={styles.sectionHeader}>
                  <h3 style={styles.sectionTitle}>Market Analysis</h3>
                  <button
                    onClick={exportToExcel}
                    style={styles.exportButton}
                    disabled={isLoading}
                    title="Export to Excel"
                  >
                    📊 Export Excel
                  </button>
                </div>
                <div style={styles.statGrid}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Average Price:</span>
                    <span style={styles.statValue}>€{calculations.averagePrice?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Median Price:</span>
                    <span style={styles.statValue}>€{calculations.medianPrice?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Price per m²:</span>
                    <span style={styles.statValue}>€{calculations.avgPricePerSqm?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Average Size:</span>
                    <span style={styles.statValue}>{calculations.avgSize?.toLocaleString() || 'N/A'}m²</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Total Value:</span>
                    <span style={styles.statValue}>€{(calculations.totalValue/1000000)?.toFixed(1) || 'N/A'}M</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Average Rooms:</span>
                    <span style={styles.statValue}>{calculations.averageRooms || 'N/A'}</span>
                  </div>
                </div>
                
                {calculations.propertyTypes && (
                  <div style={styles.propertyTypeSection}>
                    <h4 style={styles.subSectionTitle}>Property Types</h4>
                    <div style={styles.typeGrid}>
                      <div style={styles.typeItem}>
                        <span style={styles.typeLabel}>For Sale:</span>
                        <span style={styles.typeValue}>{calculations.propertyTypes.forSale}</span>
                      </div>
                      <div style={styles.typeItem}>
                        <span style={styles.typeLabel}>Houses:</span>
                        <span style={styles.typeValue}>{calculations.propertyTypes.houses}</span>
                      </div>
                      <div style={styles.typeItem}>
                        <span style={styles.typeLabel}>For Rent:</span>
                        <span style={styles.typeValue}>{calculations.propertyTypes.forRent}</span>
                      </div>
                      <div style={styles.typeItem}>
                        <span style={styles.typeLabel}>Apartments:</span>
                        <span style={styles.typeValue}>{calculations.propertyTypes.apartments}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {buildingsInRadius.length > 0 && (
              <div style={styles.buildingsSection}>
                <h3 style={styles.sectionTitle}>Buildings ({buildingsInRadius.length})</h3>
                <div style={styles.buildingsList}>
                  {buildingsInRadius.slice(0, 10).map((building, index) => (
                    <div key={building.id || index} style={styles.buildingItem}>
                      <div style={styles.buildingInfo}>
                        <div style={styles.buildingAddress}>
                          {building.address || `Building ${index + 1}`}
                        </div>
                        <div style={styles.buildingDetails}>
                          {building.price && (
                            <span style={styles.price}>€{building.price.toLocaleString()}</span>
                          )}
                          {building.size && (
                            <span style={styles.size}>{building.size}m²</span>
                          )}
                          {building.unitValue && (
                            <span style={styles.unitPrice}>€{Math.round(building.unitValue)}/m²</span>
                          )}
                          {building.rooms && (
                            <span style={styles.rooms}>{building.rooms} rooms</span>
                          )}
                          {building.energyLabel && (
                            <span style={styles.energy}>Energy: {building.energyLabel}</span>
                          )}
                          {building.distance && (
                            <span style={styles.distance}>{Math.round(building.distance)}m</span>
                          )}
                        </div>
                        <div style={styles.buildingMeta}>
                          {building.cityName && building.postalCode && (
                            <span style={styles.location}>{building.cityName} {building.postalCode}</span>
                          )}
                          {building.constructionYear && (
                            <span style={styles.year}>Built: {building.constructionYear}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {buildingsInRadius.length > 10 && (
                    <div style={styles.moreResults}>
                      ... and {buildingsInRadius.length - 10} more buildings
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={styles.mapContainer}>
        <Map
          ref={mapRef}
          onMapClick={handleMapClick}
          selectedLocation={radiusCenter}
          residentialMode={true}
          searchResultsData={[]}
          onClearAll={() => {}}
        />
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f5f5f5'
  },
  sidebar: {
    width: '400px',
    backgroundColor: '#032842',
    color: 'white',
    padding: '20px',
    overflowY: 'auto'
  },
  header: {
    marginBottom: '20px'
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px'
  },
  backButton: {
    padding: '6px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: 0
  },
  loadingSection: {
    padding: '20px 0'
  },
  loading: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#17E88F'
  },
  resultsSection: {
    marginTop: '20px'
  },
  radiusInfo: {
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    color: '#17E88F'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  exportButton: {
    padding: '6px 12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s ease'
  },
  infoText: {
    fontSize: '14px',
    margin: '5px 0',
    color: 'rgba(255, 255, 255, 0.9)'
  },
  calculationsSection: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px'
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  statLabel: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)'
  },
  statValue: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#17E88F'
  },
  propertyTypeSection: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid rgba(255, 255, 255, 0.2)'
  },
  subSectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: 'rgba(255, 255, 255, 0.9)'
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px'
  },
  typeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px'
  },
  typeLabel: {
    color: 'rgba(255, 255, 255, 0.7)'
  },
  typeValue: {
    color: '#17E88F',
    fontWeight: 'bold'
  },
  buildingsSection: {
    marginTop: '20px'
  },
  buildingsList: {
    maxHeight: '400px',
    overflowY: 'auto'
  },
  buildingItem: {
    padding: '10px',
    marginBottom: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  buildingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  buildingAddress: {
    fontSize: '14px',
    fontWeight: 'bold'
  },
  buildingDetails: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    flexWrap: 'wrap'
  },
  price: {
    color: '#17E88F',
    fontWeight: 'bold'
  },
  size: {
    color: 'rgba(255, 255, 255, 0.8)'
  },
  unitPrice: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '11px'
  },
  rooms: {
    color: 'rgba(255, 255, 255, 0.8)'
  },
  energy: {
    color: '#FFD700',
    fontSize: '11px'
  },
  distance: {
    color: 'rgba(255, 255, 255, 0.6)'
  },
  buildingMeta: {
    display: 'flex',
    gap: '8px',
    fontSize: '11px',
    marginTop: '4px'
  },
  location: {
    color: 'rgba(255, 255, 255, 0.6)'
  },
  year: {
    color: 'rgba(255, 255, 255, 0.5)'
  },
  moreResults: {
    textAlign: 'center',
    padding: '10px',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)'
  },
  mapContainer: {
    flex: 1,
    position: 'relative'
  }
};

export default ResidentialView;
