import React, { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const CatchmentResultsSidebar = ({ 
  isOpen, 
  onClose, 
  catchmentData, 
  selectedLocation, 
  onGeneratePDF, 
  isGeneratingPDF 
}) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!isOpen || !catchmentData || catchmentData.length === 0) return null;

  const formatNumber = (num) => {
    if (num === undefined || num === null) return 'N/A';
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const formatCurrency = (num) => {
    if (num === undefined || num === null) return 'N/A';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatPercentage = (num) => {
    if (num === undefined || num === null) return 'N/A';
    return `${parseFloat(num).toFixed(1)}%`;
  };

  const getTimeColor = (index) => {
    const colors = ['#007bff', '#ffc107', '#dc3545', '#28a745', '#6f42c1', '#fd7e14'];
    return colors[index % colors.length];
  };

  const currentCatchment = catchmentData[activeTab];

  // Create chart data for gender distribution
  const createGenderChartData = (data) => {
    return {
      labels: ['Women', 'Men'],
      datasets: [{
        data: [data.pourcentWomen || 0, data.pourcentMan || 0],
        backgroundColor: ['#FF6384', '#36A2EB'],
        borderColor: ['#FF6384', '#36A2EB'],
        borderWidth: 2,
      }]
    };
  };

  // Create chart data for age distribution
  const createAgeChartData = (data) => {
    return {
      labels: ['0-14', '15-29', '30-44', '45-59', '60+'],
      datasets: [{
        label: 'Population %',
        data: [
          data.pourcentAge0014 || 0,
          data.pourcentAge1529 || 0,
          data.pourcentAge3044 || 0,
          data.pourcentAge4559 || 0,
          data.pourcentAge60PL || 0
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
      },
      title: {
        display: false
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

  const doughnutOptions = {
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
    }
  };

  return (
    <div style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h3 style={styles.headerTitle}>🎯 Catchment Analysis</h3>
          <div style={styles.locationInfo}>
            📍 {selectedLocation ? 
              `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}` : 
              'Selected Location'
            }
          </div>
        </div>
        <div style={styles.headerActions}>
          <button 
            onClick={onGeneratePDF}
            disabled={isGeneratingPDF}
            style={{
              ...styles.pdfButton,
              opacity: isGeneratingPDF ? 0.6 : 1
            }}
          >
            {isGeneratingPDF ? '📄 Generating...' : '📄 PDF'}
          </button>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabHeaders}>
          {catchmentData.map((catchment, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              style={{
                ...styles.tabButton,
                ...(activeTab === index ? styles.tabButtonActive : {}),
                borderBottomColor: getTimeColor(index)
              }}
            >
              {catchment.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Summary Stats */}
        <div style={styles.summarySection}>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryValue}>
                {formatNumber(currentCatchment.totalPopulation)}
              </div>
              <div style={styles.summaryLabel}>Total Population</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryValue}>
                {formatNumber(currentCatchment.totalHouseHolds)}
              </div>
              <div style={styles.summaryLabel}>Households</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryValue}>
                {currentCatchment.householdsMember || 'N/A'}
              </div>
              <div style={styles.summaryLabel}>Avg. Household Size</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryValue}>
                {formatCurrency(currentCatchment.purchasePowerPerson)}
              </div>
              <div style={styles.summaryLabel}>Purchase Power/Person</div>
            </div>
          </div>
        </div>

        {/* Economic Information */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>💰 Economic Profile</h4>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Total Purchase Power:</span>
              <span style={styles.infoValue}>
                {currentCatchment.totalMIO ? `€${formatNumber(currentCatchment.totalMIO)}M` : 'N/A'}
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Purchase Power per Person:</span>
              <span style={styles.infoValue}>
                {formatCurrency(currentCatchment.purchasePowerPerson)}
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Average Household Size:</span>
              <span style={styles.infoValue}>
                {currentCatchment.householdsMember || 'N/A'} people
              </span>
            </div>
          </div>
        </div>

        {/* Demographics Charts */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>👥 Demographics</h4>
          
          {/* Gender Distribution */}
          <div style={styles.chartSection}>
            <h5 style={styles.chartTitle}>Gender Distribution</h5>
            <div style={styles.chartWrapper}>
              <Doughnut 
                data={createGenderChartData(currentCatchment)} 
                options={doughnutOptions} 
              />
            </div>
            <div style={styles.chartStats}>
              <span>Women: {formatPercentage(currentCatchment.pourcentWomen)}</span>
              <span>Men: {formatPercentage(currentCatchment.pourcentMan)}</span>
            </div>
          </div>

          {/* Age Distribution */}
          <div style={styles.chartSection}>
            <h5 style={styles.chartTitle}>Age Distribution</h5>
            <div style={styles.chartWrapper}>
              <Bar 
                data={createAgeChartData(currentCatchment)} 
                options={chartOptions} 
              />
            </div>
            <div style={styles.ageStats}>
              <div style={styles.ageStatItem}>
                <span style={styles.ageLabel}>0-14:</span>
                <span style={styles.ageValue}>
                  {formatPercentage(currentCatchment.pourcentAge0014)}
                </span>
              </div>
              <div style={styles.ageStatItem}>
                <span style={styles.ageLabel}>15-29:</span>
                <span style={styles.ageValue}>
                  {formatPercentage(currentCatchment.pourcentAge1529)}
                </span>
              </div>
              <div style={styles.ageStatItem}>
                <span style={styles.ageLabel}>30-44:</span>
                <span style={styles.ageValue}>
                  {formatPercentage(currentCatchment.pourcentAge3044)}
                </span>
              </div>
              <div style={styles.ageStatItem}>
                <span style={styles.ageLabel}>45-59:</span>
                <span style={styles.ageValue}>
                  {formatPercentage(currentCatchment.pourcentAge4559)}
                </span>
              </div>
              <div style={styles.ageStatItem}>
                <span style={styles.ageLabel}>60+:</span>
                <span style={styles.ageValue}>
                  {formatPercentage(currentCatchment.pourcentAge60PL)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Travel Information */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>🚗 Travel Information</h4>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Drive Time:</span>
              <span style={styles.infoValue}>
                {currentCatchment.driveTime || currentCatchment.name}
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Travel Mode:</span>
              <span style={styles.infoValue}>
                {currentCatchment.travelMode || 'Driving'}
              </span>
            </div>
            {currentCatchment.metadata && (
              <>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Average Speed:</span>
                  <span style={styles.infoValue}>
                    {currentCatchment.metadata.averageSpeed} km/h
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Accessibility Score:</span>
                  <span style={styles.infoValue}>
                    {currentCatchment.metadata.accessibility}/100
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Calculation Info */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>ℹ️ Calculation Details</h4>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Calculated:</span>
              <span style={styles.infoValue}>
                {currentCatchment.metadata?.calculatedAt ? 
                  new Date(currentCatchment.metadata.calculatedAt).toLocaleString() : 
                  'Just now'
                }
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Method:</span>
              <span style={styles.infoValue}>Drive Time Analysis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: '400px',
    height: '100vh',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    position: 'fixed',
    right: 0,
    top: 0,
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa'
  },
  headerContent: {
    flex: 1
  },
  headerTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333'
  },
  locationInfo: {
    fontSize: '12px',
    color: '#666',
    backgroundColor: '#e8f5e8',
    padding: '4px 8px',
    borderRadius: '4px',
    display: 'inline-block'
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  pdfButton: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#666',
    padding: '8px'
  },
  tabsContainer: {
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f8f9fa'
  },
  tabHeaders: {
    display: 'flex',
    overflowX: 'auto'
  },
  tabButton: {
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#666',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    minWidth: 'max-content'
  },
  tabButtonActive: {
    color: '#007bff',
    backgroundColor: 'white'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '20px'
  },
  summarySection: {
    marginBottom: '25px'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px'
  },
  summaryCard: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #e9ecef'
  },
  summaryValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: '4px'
  },
  summaryLabel: {
    fontSize: '11px',
    color: '#666',
    fontWeight: '500'
  },
  section: {
    marginBottom: '25px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '15px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e0e0e0'
  },
  infoGrid: {
    display: 'grid',
    gap: '10px'
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  infoLabel: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '500'
  },
  infoValue: {
    fontSize: '13px',
    color: '#333',
    fontWeight: '600'
  },
  chartSection: {
    marginBottom: '25px'
  },
  chartTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '12px'
  },
  chartWrapper: {
    height: '200px',
    marginBottom: '12px',
    position: 'relative'
  },
  chartStats: {
    display: 'flex',
    justifyContent: 'space-around',
    fontSize: '12px',
    color: '#666'
  },
  ageStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  ageStatItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px'
  },
  ageLabel: {
    fontSize: '11px',
    color: '#666',
    fontWeight: '500'
  },
  ageValue: {
    fontSize: '13px',
    color: '#333',
    fontWeight: 'bold'
  }
};

export default CatchmentResultsSidebar;