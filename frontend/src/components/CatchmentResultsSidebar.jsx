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
  isGeneratingPDF,
  onExportCatchmentExcel,
  onExportPlacesExcel,
  placesData
}) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!isOpen || !catchmentData || catchmentData.length === 0) return null;

  const formatNumber = (num) => {
    if (num === undefined || num === null) return 'N/A';
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const formatCurrency = (num) => {
    if (num === undefined || num === null) return 'N/A';
    // If it's already a formatted string (contains dots), return with € prefix
    if (typeof num === 'string' && num.includes('.')) {
      return `€${num}`;
    }
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
    <>
      <style>
        {`
          .results-sidebar-pdf-btn:hover {
            background-color: var(--color-main-hover, #17E88F) !important;
            color: var(--color-main, #032842) !important;
            transform: translateY(-1px);
          }
          .results-sidebar-excel-btn:hover {
            background-color: var(--color-main-hover, #17E88F) !important;
            color: var(--color-main, #032842) !important;
            transform: translateY(-1px);
          }
          .results-sidebar-close-btn:hover {
            background-color: #f0f0f0 !important;
            color: #333 !important;
          }
          .tab-button:hover {
            background-color: var(--color-main-hover, #17E88F) !important;
            color: var(--color-main, #032842) !important;
          }
          .tab-button.active {
            background-color: var(--color-main, #032842) !important;
            color: white !important;
            border: 1px solid var(--color-main, #032842) !important;
          }
          :root {
            --color-data-light-blue: #3E7CA6;
            --color-dark-grey: #435254;
            --color-sage: #538184;
            --color-celadon: #80BBAD;
            --color-celadon-tint: #C0D4CB;
            --color-data-purple: #885073;
            --color-midnight-tint: #778F9C;
            --color-midnight: #032842;
            --color-negative-red: #AD2A2A;
            --color-accent-green: #17E88F;
            --color-main: var(--color-midnight);
            --color-main-hover: var(--color-accent-green);
          }
        `}
      </style>
      <div style={styles.sidebar}>
      {/* Header - matching old design */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTExIDJMMTMuMDkgOC4yNkwyMCA5TDE0IDEyTDE2IDIwTDExIDEzTDYgMjBMOCAxMkwyIDlMOC45MSA4LjI2TDExIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K" alt="catchment-icon" style={styles.headerIcon} />
          <span style={styles.headerTitle}>Catchment Details</span>
        </div>
        <button 
          className="results-sidebar-close-btn"
          style={styles.closeButton} 
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Tabs - matching old nav-tabs style */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabHeaders}>
          {catchmentData.map((catchment, index) => (
            <button
              key={index}
              className={`tab-button ${activeTab === index ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
              style={{
                ...styles.tabButton,
                ...(activeTab === index ? styles.tabButtonActive : {})
              }}
            >
              {catchment.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Purchase Power Section */}
        <div style={styles.purchasePowerSection}>
          <div style={styles.purchasePowerGrid}>
            <div style={styles.purchasePowerItem}>
              <span style={styles.purchasePowerLabel}>Purchase Power</span>
              <span style={styles.purchasePowerValue}>
                {currentCatchment.totalMIO ? `${currentCatchment.totalMIO} € M` : 'N/A'}
              </span>
            </div>
            <div style={styles.purchasePowerItem}>
              <span style={styles.purchasePowerLabel}>Purchase Power / person</span>
              <span style={styles.purchasePowerValue}>
                {formatCurrency(currentCatchment.purchasePowerPerson)}
              </span>
            </div>
            <div style={styles.purchasePowerItem}>
              <span style={styles.purchasePowerLabel}>Household Size</span>
              <span style={styles.purchasePowerValue}>
                {currentCatchment.householdsMember || 'N/A'}
              </span>
            </div>
            <div style={styles.purchasePowerItem}>
              <span style={styles.purchasePowerLabel}>Households</span>
              <span style={styles.purchasePowerValue}>
                {formatNumber(currentCatchment.totalHouseHolds)}
              </span>
            </div>
            <div style={styles.purchasePowerItem}>
              <span style={styles.purchasePowerLabel}>Population</span>
              <span style={styles.purchasePowerValue}>
                {formatNumber(currentCatchment.totalPopulation)}
              </span>
            </div>
          </div>
        </div>

        {/* Gender Percentage Section */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Gender percentage:</h4>
          <div style={styles.legendContainer}>
            <div style={styles.legendItem}>
              <div style={{...styles.legendColor, backgroundColor: '#6b9bd1'}}></div>
              <span style={styles.legendLabel}>Men</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{...styles.legendColor, backgroundColor: '#a87ca8'}}></div>
              <span style={styles.legendLabel}>Women</span>
            </div>
          </div>
          <div style={styles.chartWrapper}>
            <Doughnut 
              data={createGenderChartData(currentCatchment)} 
              options={{
                ...doughnutOptions,
                plugins: {
                  ...doughnutOptions.plugins,
                  legend: {
                    display: false
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Population by Age Section */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Population by age:</h4>
          <div style={styles.chartWrapper}>
            <Bar 
              data={{
                labels: ['0-14', '15-29', '30-44', '45-59', '60+'],
                datasets: [{
                  data: [
                    currentCatchment.pourcentAge0014 || 0,
                    currentCatchment.pourcentAge1529 || 0,
                    currentCatchment.pourcentAge3044 || 0,
                    currentCatchment.pourcentAge4559 || 0,
                    currentCatchment.pourcentAge60PL || 0
                  ],
                  backgroundColor: [
                    '#CD853F', // Sandy brown for 0-14
                    '#032842', // CBRE navy for 15-29
                    '#1ABC9C', // Turquoise for 30-44
                    '#BDB76B', // Dark khaki for 45-59
                    '#9370DB'  // Medium purple for 60+
                  ],
                  borderWidth: 0,
                }]
              }}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    display: false
                  }
                },
                scales: {
                  ...chartOptions.scales,
                  y: {
                    ...chartOptions.scales.y,
                    max: 25,
                    ticks: {
                      ...chartOptions.scales.y.ticks,
                      stepSize: 5
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer - matching old design */}
      <div style={styles.footer}>
        <div style={styles.footerButtons}>
          <button 
            className="results-sidebar-excel-btn"
            onClick={() => onExportCatchmentExcel && onExportCatchmentExcel()}
            disabled={isGeneratingPDF}
            style={{
              ...styles.footerButton,
              opacity: isGeneratingPDF ? 0.6 : 1
            }}
          >
            <span style={styles.buttonIcon}>📊</span> Export CSV
          </button>
          <button 
            className="results-sidebar-pdf-btn"
            onClick={onGeneratePDF}
            disabled={isGeneratingPDF}
            style={{
              ...styles.footerButton,
              opacity: isGeneratingPDF ? 0.6 : 1
            }}
          >
            <span style={styles.buttonIcon}>📄</span> {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </button>
          {placesData && placesData.length > 0 && (
            <button
              className="results-sidebar-excel-btn"
              onClick={() => onExportPlacesExcel && onExportPlacesExcel()}
              disabled={isGeneratingPDF}
              style={{
                ...styles.footerButton,
                opacity: isGeneratingPDF ? 0.6 : 1
              }}
            >
              <span style={styles.buttonIcon}>📊</span> Export Places
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

const styles = {
  sidebar: {
    width: '420px',
    height: 'calc(100% - 95px)',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-2px 0 15px rgba(0,0,0,0.15)',
    zIndex: 1000,
    position: 'fixed',
    right: 0,
    bottom: '15px',
    overflow: 'hidden',
    fontFamily: 'Calibre, Arial, sans-serif',
    border: '1px solid #CFD3D4',
    borderRadius: '12px 0 0 12px'
  },
  header: {
    background: 'linear-gradient(135deg, #032842 0%, #2c5968 100%)',
    color: 'white',
    height: '50px',
    fontSize: '14px',
    fontWeight: 'bold',
    borderRadius: '12px 0 0 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 15px'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  headerIcon: {
    height: '13px',
    width: '13px'
  },
  headerTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'all 0.2s ease'
  },
  tabsContainer: {
    borderBottom: '1px solid #dee2e6',
    backgroundColor: '#f8f9fa'
  },
  tabHeaders: {
    display: 'flex',
    overflowX: 'auto',
    padding: '3px'
  },
  tabButton: {
    background: 'none',
    border: '1px solid #032842',
    color: '#032842',
    margin: '0 3px 3px 0',
    borderRadius: '0',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    minWidth: 'max-content'
  },
  tabButtonActive: {
    backgroundColor: '#032842 !important',
    color: 'white !important',
    border: '1px solid #032842 !important'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '15px'
  },
  purchasePowerSection: {
    marginBottom: '20px'
  },
  purchasePowerGrid: {
    display: 'grid',
    gap: '8px'
  },
  purchasePowerItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  purchasePowerLabel: {
    fontSize: '14px',
    color: '#333',
    fontWeight: '400'
  },
  purchasePowerValue: {
    fontSize: '14px',
    color: '#032842',
    fontWeight: '600'
  },
  section: {
    marginBottom: '25px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '15px'
  },
  legendContainer: {
    display: 'flex',
    gap: '15px',
    marginBottom: '10px',
    alignItems: 'center'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  legendColor: {
    width: '12px',
    height: '12px',
    borderRadius: '2px'
  },
  legendLabel: {
    fontSize: '12px',
    color: '#666'
  },
  chartWrapper: {
    height: '200px',
    marginBottom: '15px',
    position: 'relative'
  },
  footer: {
    borderTop: '1px solid #dee2e6',
    flexShrink: 0,
    padding: '15px',
    textAlign: 'right',
    position: 'relative'
  },
  footerButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'flex-end'
  },
  footerButton: {
    fontSize: '14px',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    backgroundColor: '#032842',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  buttonIcon: {
    fontSize: '12px'
  }
};

export default CatchmentResultsSidebar;