import React, { useState, useEffect } from 'react';
import CommerceIntelligenceService from '../services/CommerceIntelligenceService';

const CommerceRankingReport = ({ 
  selectedLocation, 
  places, 
  catchmentData,
  analysisResults,
  onExportReport 
}) => {
  const [rankingData, setRankingData] = useState(null);
  const [selectedCommerce, setSelectedCommerce] = useState('restaurant');
  const [isCalculating, setIsCalculating] = useState(false);
  const [reportSections, setReportSections] = useState({
    marketSaturation: true,
    competitorAnalysis: true,
    customerPotential: true,
    footTraffic: true,
    roiProjections: true,
    opportunities: true
  });

  // Commerce types for comprehensive analysis
  const commerceTypes = [
    { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
    { value: 'retail_store', label: 'Retail Store', icon: '🛍️' },
    { value: 'grocery_or_supermarket', label: 'Grocery/Supermarket', icon: '🛒' },
    { value: 'bakery', label: 'Bakery', icon: '🥖' },
    { value: 'clothing_store', label: 'Clothing Store', icon: '👕' },
    { value: 'pharmacy', label: 'Pharmacy', icon: '💊' },
    { value: 'bank', label: 'Bank', icon: '🏦' },
    { value: 'gas_station', label: 'Gas Station', icon: '⛽' },
    { value: 'beauty_salon', label: 'Beauty Salon', icon: '💅' },
    { value: 'gym', label: 'Gym/Fitness', icon: '💪' }
  ];

  // Auto-initialize report when analysisResults are provided from direct navigation
  useEffect(() => {
    console.log('CommerceRankingReport: useEffect triggered');
    console.log('CommerceRankingReport: analysisResults:', analysisResults);
    console.log('CommerceRankingReport: catchmentData prop:', catchmentData);
    console.log('CommerceRankingReport: analysisResults.catchmentData:', analysisResults?.catchmentData);
    
    if (analysisResults && analysisResults.businessCategory) {
      // Set the commerce type based on the analysis results
      const categoryMapping = {
        'restaurant': 'restaurant',
        'food': 'restaurant', 
        'meal_takeaway': 'restaurant',
        'bakery': 'bakery',
        'store': 'retail_store',
        'clothing_store': 'clothing_store',
        'grocery_or_supermarket': 'grocery_or_supermarket',
        'pharmacy': 'pharmacy',
        'bank': 'bank',
        'gas_station': 'gas_station',
        'beauty_salon': 'beauty_salon',
        'gym': 'gym'
      };

      const mappedCategory = categoryMapping[analysisResults.businessCategory] || 'retail_store';
      setSelectedCommerce(mappedCategory);

      // Auto-generate the report
      setTimeout(() => {
        generateRankingReport();
      }, 500); // Small delay to ensure state is updated
      
      console.log('Auto-initializing commerce report for category:', analysisResults.businessCategory);
    }
  }, [analysisResults]);

  // Generate comprehensive ranking report
  const generateRankingReport = async () => {
    if (!selectedLocation || !places) {
      alert('Please select a location and search for places first');
      return;
    }

    setIsCalculating(true);
    try {
      console.log('Generating comprehensive ranking report for:', selectedCommerce);

      const reportData = {};
      
      // Enhanced analysis using catchment data if available
      const usingEnhancedData = analysisResults?.dataSource === 'catchment_intersection' || 
                               analysisResults?.dataSource === 'radius_catchment_intersection';
      const enhancedCatchmentData = analysisResults?.catchmentData || catchmentData;
      
      console.log('Using enhanced catchment data:', usingEnhancedData, enhancedCatchmentData?.length || 0, 'catchments');
      console.log('Data source:', analysisResults?.dataSource);

      // 1. Market Saturation Analysis
      if (reportSections.marketSaturation) {
        reportData.marketSaturation = CommerceIntelligenceService.calculateMarketSaturation(
          places, selectedCommerce, 1000
        );
        
        // Add enhanced insights if using catchment data
        if (usingEnhancedData && enhancedCatchmentData?.length > 0) {
          reportData.marketSaturation.enhancedInsights = {
            catchmentCoverage: enhancedCatchmentData.length,
            intersectionAnalysis: true,
            detailLevel: 'enhanced'
          };
        }
      }

      // 2. Competitor Landscape Analysis
      if (reportSections.competitorAnalysis) {
        reportData.competitorAnalysis = CommerceIntelligenceService.analyzeCompetitorLandscape(
          places, selectedCommerce, selectedLocation
        );
      }

      // 2.5. Demographic Fit Analysis (NEW)
      if (analysisResults?.catchmentData && analysisResults.catchmentData.length > 0) {
        reportData.demographicFit = CommerceIntelligenceService.calculateDemographicFit(
          selectedCommerce, analysisResults.catchmentData
        );
        console.log('Demographic fit analysis:', reportData.demographicFit);
      }

      // 2.6. Revenue Projections with Demographics (NEW) 
      if (analysisResults?.catchmentData && analysisResults.catchmentData.length > 0) {
        reportData.revenueProjections = CommerceIntelligenceService.calculateRevenueProjections(
          selectedCommerce, analysisResults.catchmentData, reportData.competitorAnalysis
        );
        console.log('Revenue projections:', reportData.revenueProjections);
      }

      // 3. Customer Acquisition Potential (Enhanced with catchment intersection)
      if (reportSections.customerPotential) {
        reportData.customerPotential = CommerceIntelligenceService.calculateCustomerAcquisitionPotential(
          enhancedCatchmentData || catchmentData, places, selectedCommerce
        );
        
        // Add enhanced metrics when using catchment intersection data
        if (usingEnhancedData) {
          reportData.customerPotential.dataSource = 'catchment_intersection';
          reportData.customerPotential.enhancedMetrics = true;
        }
      }

      // 4. Foot Traffic Analysis
      if (reportSections.footTraffic) {
        reportData.footTraffic = CommerceIntelligenceService.analyzeFootTraffic(
          places, selectedLocation, 500
        );
      }

      // 5. ROI Projections (Enhanced with catchment data)
      if (reportSections.roiProjections && reportData.customerPotential) {
        reportData.roiProjections = CommerceIntelligenceService.calculateROIProjections(
          reportData.customerPotential, selectedCommerce
        );
        
        // Enhanced ROI calculations when using catchment intersection
        if (usingEnhancedData) {
          reportData.roiProjections.enhancedCalculations = true;
          reportData.roiProjections.dataConfidence = 'high'; // Higher confidence with catchment data
        }
      }

      // 6. Market Opportunities (Enhanced with catchment intersection)
      if (reportSections.opportunities) {
        reportData.opportunities = CommerceIntelligenceService.identifyMarketOpportunities(
          places, enhancedCatchmentData || catchmentData, selectedLocation
        );
        
        if (usingEnhancedData) {
          reportData.opportunities.enhancedAnalysis = true;
          reportData.opportunities.intersectionBased = true;
        }
      }

      // 7. Overall Site Score
      reportData.siteScore = CommerceIntelligenceService.calculateSiteScore({
        demographics: analysisResults?.breakdown?.demographics,
        competition: analysisResults?.breakdown?.competition,
        accessibility: analysisResults?.breakdown?.accessibility,
        marketPotential: analysisResults?.breakdown?.marketPotential,
        locationFactors: analysisResults?.breakdown?.locationFactors,
        customerPotential: reportData.customerPotential,
        footTraffic: reportData.footTraffic
      });

      // 8. Generate Final Ranking and Recommendations
      reportData.finalRanking = generateFinalRanking(reportData);
      reportData.executiveSummary = generateExecutiveSummary(reportData);
      
      setRankingData(reportData);

    } catch (error) {
      console.error('Error generating ranking report:', error);
      alert('Error generating ranking report. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Generate final ranking based on all analysis factors
  const generateFinalRanking = (data) => {
    const factors = [];

    // Market Saturation (Lower is better)
    if (data.marketSaturation) {
      const saturationScore = 100 - data.marketSaturation.saturationIndex;
      factors.push({
        name: 'Market Saturation',
        score: saturationScore,
        weight: 0.20,
        status: data.marketSaturation.level
      });
    }

    // Customer Potential
    if (data.customerPotential && data.customerPotential.acquisitionScore) {
      factors.push({
        name: 'Customer Potential',
        score: data.customerPotential.acquisitionScore,
        weight: 0.25,
        status: getCustomerPotentialStatus(data.customerPotential.acquisitionScore)
      });
    }

    // Foot Traffic
    if (data.footTraffic) {
      factors.push({
        name: 'Foot Traffic',
        score: data.footTraffic.footTrafficScore,
        weight: 0.15,
        status: data.footTraffic.level
      });
    }

    // Competition Quality (Inverse of competitor strength)
    if (data.competitorAnalysis) {
      const competitionScore = Math.max(0, 100 - (data.competitorAnalysis.averageRating * 20));
      factors.push({
        name: 'Competition Gap',
        score: competitionScore,
        weight: 0.15,
        status: getCompetitionStatus(data.competitorAnalysis.averageRating)
      });
    }

    // Site Quality (from analysis results)
    if (data.siteScore) {
      factors.push({
        name: 'Site Quality',
        score: data.siteScore.finalScore,
        weight: 0.25,
        status: data.siteScore.rating
      });
    }

    // Calculate weighted final score
    const totalWeightedScore = factors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0
    );
    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
    const finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    return {
      finalScore: Math.round(finalScore),
      factors,
      overallRating: getOverallRating(finalScore),
      investmentRecommendation: getInvestmentRecommendation(finalScore),
      confidenceLevel: calculateConfidenceLevel(factors.length)
    };
  };

  // Generate executive summary
  const generateExecutiveSummary = (data) => {
    const summary = {
      highlights: [],
      concerns: [],
      keyMetrics: {},
      recommendation: '',
      nextSteps: []
    };

    // Key Metrics
    if (data.customerPotential) {
      summary.keyMetrics.potentialCustomers = data.customerPotential.potentialCustomers;
      summary.keyMetrics.annualRevenuePotential = data.customerPotential.annualRevenuePotential;
    }
    
    if (data.marketSaturation) {
      summary.keyMetrics.competitorCount = data.marketSaturation.competitorCount;
      summary.keyMetrics.marketSaturation = `${data.marketSaturation.saturationIndex}%`;
    }

    if (data.roiProjections) {
      summary.keyMetrics.firstYearROI = `${data.roiProjections.firstYearROI}%`;
      summary.keyMetrics.paybackPeriod = `${data.roiProjections.paybackPeriod} years`;
    }

    // Highlights
    if (data.finalRanking?.finalScore >= 70) {
      summary.highlights.push('Strong overall location score indicates good investment potential');
    }
    
    if (data.customerPotential?.potentialCustomers > 1000) {
      summary.highlights.push(`Large customer base potential with ${data.customerPotential.potentialCustomers} estimated customers`);
    }

    if (data.footTraffic?.footTrafficScore >= 60) {
      summary.highlights.push('High foot traffic from nearby anchors and attractions');
    }

    if (data.marketSaturation?.saturationIndex < 50) {
      summary.highlights.push('Low market saturation provides room for growth');
    }

    // Concerns
    if (data.competitorAnalysis?.topRatedCompetitors?.length >= 3) {
      summary.concerns.push('Multiple high-rated competitors in proximity');
    }

    if (data.marketSaturation?.saturationIndex > 80) {
      summary.concerns.push('Market appears oversaturated with existing competition');
    }

    if (data.footTraffic?.footTrafficScore < 30) {
      summary.concerns.push('Limited foot traffic generators in the area');
    }

    if (data.roiProjections?.firstYearROI < 15) {
      summary.concerns.push('Below-average ROI projections may impact profitability');
    }

    // Overall Recommendation
    const score = data.finalRanking?.finalScore || 0;
    if (score >= 80) {
      summary.recommendation = 'HIGHLY RECOMMENDED - This location shows excellent potential across all key metrics.';
    } else if (score >= 65) {
      summary.recommendation = 'RECOMMENDED - Good location with strong fundamentals, minor areas for consideration.';
    } else if (score >= 50) {
      summary.recommendation = 'CONDITIONAL - Moderate potential requiring strategic planning and risk mitigation.';
    } else if (score >= 35) {
      summary.recommendation = 'NOT RECOMMENDED - Below-average potential with significant challenges.';
    } else {
      summary.recommendation = 'STRONGLY NOT RECOMMENDED - Poor location choice with high risk factors.';
    }

    // Next Steps
    if (score >= 65) {
      summary.nextSteps = [
        'Conduct detailed financial modeling',
        'Negotiate lease terms with landlord',
        'Develop marketing and launch strategy',
        'Finalize store design and layout plans'
      ];
    } else if (score >= 50) {
      summary.nextSteps = [
        'Address identified weaknesses in business plan',
        'Consider alternative locations for comparison',
        'Develop risk mitigation strategies',
        'Reassess investment budget and expectations'
      ];
    } else {
      summary.nextSteps = [
        'Explore alternative locations',
        'Reconsider target market and business model',
        'Conduct broader market research',
        'Consult with retail real estate experts'
      ];
    }

    return summary;
  };

  // Helper functions for status determination
  const getCustomerPotentialStatus = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getCompetitionStatus = (avgRating) => {
    if (avgRating >= 4.5) return 'Strong Competition';
    if (avgRating >= 4.0) return 'Moderate Competition';
    if (avgRating >= 3.5) return 'Weak Competition';
    return 'Limited Competition';
  };

  const getOverallRating = (score) => {
    if (score >= 85) return 'A+ Excellent';
    if (score >= 75) return 'A Good';
    if (score >= 65) return 'B+ Above Average';
    if (score >= 55) return 'B Average';
    if (score >= 45) return 'C+ Below Average';
    if (score >= 35) return 'C Poor';
    return 'D Very Poor';
  };

  const getInvestmentRecommendation = (score) => {
    if (score >= 80) return 'Strong Buy';
    if (score >= 65) return 'Buy';
    if (score >= 50) return 'Hold/Consider';
    if (score >= 35) return 'Avoid';
    return 'Strong Avoid';
  };

  const calculateConfidenceLevel = (factorCount) => {
    if (factorCount >= 5) return 'High';
    if (factorCount >= 3) return 'Medium';
    return 'Low';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#28a745';
    if (score >= 65) return '#17a2b8';
    if (score >= 50) return '#ffc107';
    if (score >= 35) return '#fd7e14';
    return '#dc3545';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (!selectedLocation) {
    return (
      <div style={styles.container}>
        <div style={styles.placeholder}>
          <h3>📊 Commerce Ranking Report</h3>
          <p>Please select a location on the map to begin comprehensive analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          📊 {analysisResults?.analysisType === 'comprehensive_commerce' ? 
               'Comprehensive Commerce Ranking' : 
               'Commerce Location Ranking Report'}
        </h2>
        {analysisResults?.businessCategory && (
          <div style={styles.categoryBadge}>
            {analysisResults.summary?.primaryCategory || 'Business Analysis'}
          </div>
        )}
        {analysisResults?.dataSource && (
          <div style={styles.dataSourceIndicator}>
            📊 Data Source: {
              analysisResults.dataSource === 'catchment_intersection' ? '🎯 Enhanced Catchment Analysis' :
              analysisResults.dataSource === 'places_search' ? '🔍 Places Search' :
              '📍 Location Analysis'
            }
            {analysisResults.dataSource === 'catchment_intersection' && (
              <span style={styles.enhancedBadge}> • Enhanced Data</span>
            )}
          </div>
        )}
        <div style={styles.controls}>
          <select 
            value={selectedCommerce}
            onChange={(e) => setSelectedCommerce(e.target.value)}
            style={styles.select}
          >
            {commerceTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={generateRankingReport}
            disabled={isCalculating || !places || places.length === 0}
            style={{
              ...styles.generateButton,
              ...(isCalculating ? styles.disabledButton : {})
            }}
          >
            {isCalculating ? '🔄 Analyzing...' : '🚀 Generate Report'}
          </button>
        </div>
      </div>

      {/* Report Sections Configuration */}
      <div style={styles.configSection}>
        <h4 style={styles.configTitle}>Report Sections:</h4>
        <div style={styles.checkboxGrid}>
          {Object.entries(reportSections).map(([key, enabled]) => (
            <label key={key} style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setReportSections(prev => ({
                  ...prev,
                  [key]: e.target.checked
                }))}
                style={styles.checkbox}
              />
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
          ))}
        </div>
      </div>

      {rankingData && (
        <div style={styles.report}>
          {/* Executive Summary */}
          {rankingData.executiveSummary && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>📋 Executive Summary</h3>
              
              {/* Final Score and Recommendation */}
              <div style={styles.summaryHeader}>
                <div style={styles.finalScoreCard}>
                  <div style={styles.scoreCircle}>
                    <span style={styles.scoreLarge}>{rankingData.finalRanking.finalScore}</span>
                    <span style={styles.scoreOutOf}>/100</span>
                  </div>
                  <div style={styles.ratingInfo}>
                    <div style={{
                      ...styles.overallRating,
                      color: getScoreColor(rankingData.finalRanking.finalScore)
                    }}>
                      {rankingData.finalRanking.overallRating}
                    </div>
                    <div style={styles.investment}>
                      {rankingData.finalRanking.investmentRecommendation}
                    </div>
                  </div>
                </div>
                
                <div style={styles.keyMetrics}>
                  <h4>Key Metrics:</h4>
                  <div style={styles.metricsGrid}>
                    {Object.entries(rankingData.executiveSummary.keyMetrics).map(([key, value]) => (
                      <div key={key} style={styles.metricItem}>
                        <span style={styles.metricLabel}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                        </span>
                        <span style={styles.metricValue}>
                          {typeof value === 'number' && value > 10000 ? formatNumber(value) : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div style={styles.recommendationBox}>
                <h4>🎯 Recommendation:</h4>
                <p style={styles.recommendationText}>
                  {rankingData.executiveSummary.recommendation}
                </p>
              </div>

              {/* Highlights and Concerns */}
              <div style={styles.highlightsConcerns}>
                <div style={styles.highlights}>
                  <h4 style={styles.positiveTitle}>✅ Key Highlights:</h4>
                  <ul style={styles.bulletList}>
                    {rankingData.executiveSummary.highlights.map((highlight, index) => (
                      <li key={index} style={styles.positiveItem}>{highlight}</li>
                    ))}
                  </ul>
                </div>
                
                <div style={styles.concerns}>
                  <h4 style={styles.concernTitle}>⚠️ Key Concerns:</h4>
                  <ul style={styles.bulletList}>
                    {rankingData.executiveSummary.concerns.map((concern, index) => (
                      <li key={index} style={styles.concernItem}>{concern}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Next Steps */}
              <div style={styles.nextSteps}>
                <h4>🎯 Recommended Next Steps:</h4>
                <ol style={styles.orderedList}>
                  {rankingData.executiveSummary.nextSteps.map((step, index) => (
                    <li key={index} style={styles.stepItem}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* Market Saturation Analysis */}
          {rankingData.marketSaturation && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>📈 Market Saturation Analysis</h3>
              <div style={styles.saturationContent}>
                <div style={styles.saturationScore}>
                  <div style={styles.saturationMeter}>
                    <div 
                      style={{
                        ...styles.saturationFill,
                        width: `${rankingData.marketSaturation.saturationIndex}%`,
                        backgroundColor: rankingData.marketSaturation.saturationIndex > 70 ? '#dc3545' : 
                                       rankingData.marketSaturation.saturationIndex > 40 ? '#ffc107' : '#28a745'
                      }}
                    />
                  </div>
                  <div style={styles.saturationLabel}>
                    {rankingData.marketSaturation.saturationIndex}% Saturated - {rankingData.marketSaturation.level}
                  </div>
                </div>
                
                <div style={styles.saturationDetails}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Total Competitors:</span>
                    <span style={styles.detailValue}>{rankingData.marketSaturation.competitorCount}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Density per km²:</span>
                    <span style={styles.detailValue}>{rankingData.marketSaturation.density}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Industry Benchmark:</span>
                    <span style={styles.detailValue}>{rankingData.marketSaturation.benchmark}/km²</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Competitor Analysis */}
          {rankingData.competitorAnalysis && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>🏪 Competitor Analysis</h3>
              <div style={styles.competitorContent}>
                <div style={styles.competitorOverview}>
                  <div style={styles.overviewItem}>
                    <h4>Average Competitor Rating</h4>
                    <div style={styles.ratingDisplay}>
                      {'⭐'.repeat(Math.floor(rankingData.competitorAnalysis.averageRating))}
                      <span style={styles.ratingNumber}>
                        {rankingData.competitorAnalysis.averageRating}/5.0
                      </span>
                    </div>
                  </div>
                  
                  <div style={styles.overviewItem}>
                    <h4>Competitive Advantage</h4>
                    <span style={styles.advantage}>
                      {rankingData.competitorAnalysis.competitiveAdvantage}
                    </span>
                  </div>
                </div>

                {rankingData.competitorAnalysis.topCompetitors && rankingData.competitorAnalysis.topCompetitors.length > 0 && (
                  <div style={styles.competitorList}>
                    <h4>🏆 Top Competitors Nearby:</h4>
                    {rankingData.competitorAnalysis.topRatedCompetitors.map((competitor, index) => (
                      <div key={index} style={styles.competitorItem}>
                        <span style={styles.competitorName}>{competitor.name}</span>
                        <span style={styles.competitorRating}>⭐ {competitor.rating}</span>
                        <span style={styles.competitorDistance}>{competitor.distance}m away</span>
                        <span style={styles.competitorReviews}>({formatNumber(competitor.userRatings)} reviews)</span>
                      </div>
                    ))}
                  </div>
                )}

                {rankingData.competitorAnalysis.competitorGaps && rankingData.competitorAnalysis.competitorGaps.length > 0 && (
                  <div style={styles.marketGaps}>
                    <h4>💡 Market Gaps & Opportunities:</h4>
                    <ul style={styles.gapsList}>
                      {rankingData.competitorAnalysis.competitorGaps.map((gap, index) => (
                        <li key={index} style={styles.gapItem}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Potential */}
          {rankingData.customerPotential && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>👥 Customer Acquisition Potential</h3>
              <div style={styles.customerContent}>
                <div style={styles.customerMetrics}>
                  <div style={styles.metricCard}>
                    <h4>Potential Customers</h4>
                    <div style={styles.bigNumber}>
                      {formatNumber(rankingData.customerPotential.potentialCustomers)}
                    </div>
                  </div>
                  
                  <div style={styles.metricCard}>
                    <h4>Monthly Revenue Potential</h4>
                    <div style={styles.bigNumber}>
                      {formatCurrency(rankingData.customerPotential.monthlyRevenuePotential)}
                    </div>
                  </div>
                  
                  <div style={styles.metricCard}>
                    <h4>Annual Revenue Potential</h4>
                    <div style={styles.bigNumber}>
                      {formatCurrency(rankingData.customerPotential.annualRevenuePotential)}
                    </div>
                  </div>
                </div>

                {rankingData.customerPotential.customerSegments && (
                  <div style={styles.customerSegments}>
                    <h4>🎯 Customer Segments:</h4>
                    {Object.entries(rankingData.customerPotential.customerSegments).map(([segment, data]) => (
                      <div key={segment} style={styles.segmentItem}>
                        <span style={styles.segmentName}>
                          {segment.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                        </span>
                        <span style={styles.segmentData}>
                          {formatNumber(data.population)} people ({data.percentage}%) - Relevance: {data.relevance}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Demographics Analysis */}
          {analysisResults?.catchmentData && analysisResults.catchmentData.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                📊 {analysisResults.dataSource === 'radius_catchment_intersection' ? 'Search Radius Demographics' : 'Market Demographics Analysis'}
              </h3>
              <div style={styles.demographicsContent}>
                {analysisResults.catchmentData.map((catchment, index) => (
                  <div key={index} style={styles.catchmentDemographics}>
                    <h4 style={styles.catchmentTitle}>
                      {catchment.isRadiusSearch ? 
                        `🎯 ${catchment.name} Search Area - ${formatNumber(catchment.totalPopulation)} Total Population` :
                        `🎯 ${catchment.name} Drive Time - ${formatNumber(catchment.totalPopulation)} Total Population`
                      }
                    </h4>
                    
                    <div style={styles.demographicsGrid}>
                      {/* Gender Distribution */}
                      <div style={styles.demoCard}>
                        <h5>Gender Distribution</h5>
                        <div style={styles.genderStats}>
                          <div style={styles.genderItem}>
                            <span>👩 Women: </span>
                            <strong>{formatNumber(catchment.totalFemale)} ({catchment.pourcentWomen}%)</strong>
                          </div>
                          <div style={styles.genderItem}>
                            <span>👨 Men: </span>
                            <strong>{formatNumber(catchment.totalMale)} ({catchment.pourcentMan}%)</strong>
                          </div>
                        </div>
                      </div>

                      {/* Age Distribution */}
                      <div style={styles.demoCard}>
                        <h5>Age Groups</h5>
                        <div style={styles.ageStats}>
                          <div style={styles.ageItem}>
                            <span>0-14: </span>
                            <strong>{formatNumber(catchment.totalAGE0014)} ({catchment.pourcentAge0014}%)</strong>
                          </div>
                          <div style={styles.ageItem}>
                            <span>15-29: </span>
                            <strong>{formatNumber(catchment.totalAGE1529)} ({catchment.pourcentAge1529}%)</strong>
                          </div>
                          <div style={styles.ageItem}>
                            <span>30-44: </span>
                            <strong>{formatNumber(catchment.totalAGE3044)} ({catchment.pourcentAge3044}%)</strong>
                          </div>
                          <div style={styles.ageItem}>
                            <span>45-59: </span>
                            <strong>{formatNumber(catchment.totalAGE4559)} ({catchment.pourcentAge4559}%)</strong>
                          </div>
                          <div style={styles.ageItem}>
                            <span>60+: </span>
                            <strong>{formatNumber(catchment.totalAGE60PL)} ({catchment.pourcentAge60pl}%)</strong>
                          </div>
                        </div>
                      </div>

                      {/* Household & Economic Data */}
                      <div style={styles.demoCard}>
                        <h5>Economic Profile</h5>
                        <div style={styles.economicStats}>
                          <div style={styles.economicItem}>
                            <span>🏠 Total Households: </span>
                            <strong>{formatNumber(catchment.totalHouseHolds)}</strong>
                          </div>
                          <div style={styles.economicItem}>
                            <span>👥 Avg Household Size: </span>
                            <strong>{catchment.householdsMember} members</strong>
                          </div>
                          <div style={styles.economicItem}>
                            <span>💰 Purchase Power/Person: </span>
                            <strong>{formatCurrency(catchment.purchasePowerPerson)}</strong>
                          </div>
                          <div style={styles.economicItem}>
                            <span>💳 Total Purchase Power: </span>
                            <strong>{formatCurrency(catchment.totalPP_MIO * 1000000)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Combined Demographics Summary */}
                <div style={styles.combinedDemographics}>
                  <h4 style={styles.summaryTitle}>📈 Combined Market Summary</h4>
                  <div style={styles.combinedStats}>
                    <div style={styles.combinedItem}>
                      <span>Total Market Population: </span>
                      <strong>{formatNumber(analysisResults.catchmentData.reduce((sum, c) => sum + c.totalPopulation, 0))}</strong>
                    </div>
                    <div style={styles.combinedItem}>
                      <span>Total Households: </span>
                      <strong>{formatNumber(analysisResults.catchmentData.reduce((sum, c) => sum + c.totalHouseHolds, 0))}</strong>
                    </div>
                    <div style={styles.combinedItem}>
                      <span>Combined Purchase Power: </span>
                      <strong>{formatCurrency(analysisResults.catchmentData.reduce((sum, c) => sum + (c.totalPP_MIO * 1000000), 0))}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Demographic-Business Fit Analysis */}
          {rankingData.demographicFit && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>🎯 Business-Market Fit Analysis</h3>
              <div style={styles.demographicFitContent}>
                <div style={styles.fitScoreCard}>
                  <h4>Market Fit Score</h4>
                  <div style={styles.fitScore}>
                    <span style={{...styles.bigNumber, color: rankingData.demographicFit.fitScore >= 70 ? '#28a745' : rankingData.demographicFit.fitScore >= 50 ? '#ffc107' : '#dc3545'}}>
                      {rankingData.demographicFit.fitScore}/100
                    </span>
                    <div style={styles.fitLevel}>{rankingData.demographicFit.level}</div>
                  </div>
                </div>

                <div style={styles.fitInsights}>
                  <h4>📊 Market Analysis Insights:</h4>
                  {rankingData.demographicFit.insights?.map((insight, index) => (
                    <div key={index} style={styles.insightItem}>
                      <span>✓ {insight}</span>
                    </div>
                  ))}
                </div>

                <div style={styles.populationInsights}>
                  <h4>👥 Population Profile:</h4>
                  {rankingData.demographicFit.populationInsights?.map((insight, index) => (
                    <div key={index} style={styles.insightItem}>
                      <span>• {insight}</span>
                    </div>
                  ))}
                </div>

                {rankingData.demographicFit.ageSegmentAnalysis && (
                  <div style={styles.ageSegmentAnalysis}>
                    <h4>🎂 Age Segment Analysis:</h4>
                    <div style={styles.segmentGrid}>
                      {rankingData.demographicFit.ageSegmentAnalysis.map((segment, index) => (
                        <div key={index} style={styles.segmentCard}>
                          <div style={styles.segmentName}>{segment.name}</div>
                          <div style={styles.segmentPercentage}>{segment.percentage.toFixed(1)}%</div>
                          <div style={styles.segmentRelevance}>Relevance: {segment.relevance}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rankingData.demographicFit.purchasingPowerAnalysis && (
                  <div style={styles.purchasingPowerSection}>
                    <h4>💰 Purchasing Power Analysis:</h4>
                    <div style={styles.powerStats}>
                      <div style={styles.powerItem}>
                        <span>Income Level: </span>
                        <strong>{rankingData.demographicFit.purchasingPowerAnalysis.level}</strong>
                      </div>
                      <div style={styles.powerItem}>
                        <span>Est. Annual Spending: </span>
                        <strong>{formatCurrency(rankingData.demographicFit.purchasingPowerAnalysis.annualSpending)}</strong>
                      </div>
                      <div style={styles.powerItem}>
                        <span>Business Relevance: </span>
                        <strong>{rankingData.demographicFit.purchasingPowerAnalysis.businessRelevance}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Revenue Projections */}
          {rankingData.revenueProjections && !rankingData.revenueProjections.error && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>💹 Market-Based Revenue Projections</h3>
              <div style={styles.revenueProjectionsContent}>
                <div style={styles.revenueOverview}>
                  <div style={styles.revenueCard}>
                    <h4>Total Market Potential</h4>
                    <div style={styles.revenueNumber}>{formatCurrency(rankingData.revenueProjections.totalMarketPotential)}</div>
                  </div>
                  
                  <div style={styles.revenueCard}>
                    <h4>Capturable Market</h4>
                    <div style={styles.revenueNumber}>{formatCurrency(rankingData.revenueProjections.captureableMarket)}</div>
                  </div>
                  
                  <div style={styles.revenueCard}>
                    <h4>Est. Annual Revenue</h4>
                    <div style={{...styles.revenueNumber, color: '#28a745'}}>{formatCurrency(rankingData.revenueProjections.estimatedAnnualRevenue)}</div>
                  </div>
                  
                  <div style={styles.revenueCard}>
                    <h4>Monthly Revenue</h4>
                    <div style={styles.revenueNumber}>{formatCurrency(rankingData.revenueProjections.monthlyRevenue)}</div>
                  </div>
                </div>

                <div style={styles.customerProjections}>
                  <h4>📈 Customer Base Projections:</h4>
                  <div style={styles.customerStats}>
                    <div style={styles.customerItem}>
                      <span>Projected Customer Base: </span>
                      <strong>{formatNumber(rankingData.revenueProjections.projectedCustomerBase)} customers</strong>
                    </div>
                    <div style={styles.customerItem}>
                      <span>Revenue per Customer: </span>
                      <strong>{formatCurrency(rankingData.revenueProjections.revenuePerCustomer)}/year</strong>
                    </div>
                    <div style={styles.customerItem}>
                      <span>Confidence Level: </span>
                      <strong style={{color: rankingData.revenueProjections.confidence === 'High' ? '#28a745' : rankingData.revenueProjections.confidence === 'Moderate' ? '#ffc107' : '#dc3545'}}>
                        {rankingData.revenueProjections.confidence}
                      </strong>
                    </div>
                  </div>
                </div>

                <div style={styles.projectionFactors}>
                  <h4>🔍 Calculation Factors:</h4>
                  <div style={styles.factorGrid}>
                    <div style={styles.factorItem}>
                      <span>Population Base: </span>
                      <strong>{formatNumber(rankingData.revenueProjections.factors.populationBase)}</strong>
                    </div>
                    <div style={styles.factorItem}>
                      <span>Household Base: </span>
                      <strong>{formatNumber(rankingData.revenueProjections.factors.householdBase)}</strong>
                    </div>
                    <div style={styles.factorItem}>
                      <span>Avg Purchase Power: </span>
                      <strong>{formatCurrency(rankingData.revenueProjections.factors.avgPurchasePower)}</strong>
                    </div>
                    <div style={styles.factorItem}>
                      <span>Competitors: </span>
                      <strong>{rankingData.revenueProjections.factors.competitorCount}</strong>
                    </div>
                    <div style={styles.factorItem}>
                      <span>Purchase Power Factor: </span>
                      <strong>{rankingData.revenueProjections.factors.purchasePowerFactor}</strong>
                    </div>
                    <div style={styles.factorItem}>
                      <span>Competition Impact: </span>
                      <strong>{rankingData.revenueProjections.factors.competitionFactor}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ROI Projections */}
          {rankingData.roiProjections && !rankingData.roiProjections.error && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>💰 ROI Projections</h3>
              <div style={styles.roiContent}>
                <div style={styles.roiOverview}>
                  <div style={styles.roiCard}>
                    <h4>Payback Period</h4>
                    <div style={styles.roiNumber}>{rankingData.roiProjections.paybackPeriod} years</div>
                  </div>
                  
                  <div style={styles.roiCard}>
                    <h4>First Year ROI</h4>
                    <div style={styles.roiNumber}>{rankingData.roiProjections.firstYearROI}%</div>
                  </div>
                  
                  <div style={styles.roiCard}>
                    <h4>Break-Even</h4>
                    <div style={styles.roiNumber}>{rankingData.roiProjections.breakEvenMonths} months</div>
                  </div>
                </div>

                {rankingData.roiProjections.projections && (
                  <div style={styles.projectionsTable}>
                    <h4>📊 5-Year Revenue Projections:</h4>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th>Year</th>
                          <th>Revenue</th>
                          <th>Profit</th>
                          <th>Cumulative Profit</th>
                          <th>ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankingData.roiProjections.projections.map((year, index) => (
                          <tr key={index}>
                            <td>{year.year}</td>
                            <td>{formatCurrency(year.revenue)}</td>
                            <td>{formatCurrency(year.profit)}</td>
                            <td>{formatCurrency(year.cumulativeProfit)}</td>
                            <td>{year.roi}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Foot Traffic Analysis */}
          {rankingData.footTraffic && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>🚶‍♂️ Foot Traffic Analysis</h3>
              <div style={styles.trafficContent}>
                <div style={styles.trafficScore}>
                  <h4>Foot Traffic Score: {rankingData.footTraffic.footTrafficScore}/100</h4>
                  <div style={styles.trafficLevel}>
                    Level: <span style={{
                      color: getScoreColor(rankingData.footTraffic.footTrafficScore)
                    }}>
                      {rankingData.footTraffic.level}
                    </span>
                  </div>
                </div>

                {rankingData.footTraffic.trafficSources && rankingData.footTraffic.trafficSources.length > 0 && (
                  <div style={styles.trafficSources}>
                    <h4>🎯 Traffic Generators:</h4>
                    {rankingData.footTraffic.trafficSources.slice(0, 5).map((source, index) => (
                      <div key={index} style={styles.sourceItem}>
                        <span style={styles.sourceName}>{source.name}</span>
                        <span style={styles.sourceDistance}>{source.distance}m</span>
                        <span style={styles.sourceScore}>Score: {source.trafficScore}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Market Opportunities */}
          {rankingData.opportunities && rankingData.opportunities.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>💡 Market Opportunities</h3>
              <div style={styles.opportunitiesGrid}>
                {rankingData.opportunities.slice(0, 6).map((opportunity, index) => (
                  <div key={index} style={{
                    ...styles.opportunityCard,
                    borderLeftColor: (opportunity.priority === 'high') ? '#28a745' : 
                                   (opportunity.priority === 'medium') ? '#ffc107' : '#17a2b8'
                  }}>
                    <div style={styles.opportunityHeader}>
                      <span style={styles.opportunityType}>{opportunity.type || 'Opportunity'}</span>
                      <span style={{
                        ...styles.opportunityPriority,
                        backgroundColor: (opportunity.priority === 'high') ? '#28a745' : 
                                       (opportunity.priority === 'medium') ? '#ffc107' : 
                                       (opportunity.priority === 'low') ? '#dc3545' : '#17a2b8'
                      }}>
                        {opportunity.priority ? opportunity.priority.toUpperCase() : 'MEDIUM'}
                      </span>
                    </div>
                    <h5 style={styles.opportunityCategory}>{opportunity.category || 'General'}</h5>
                    <p style={styles.opportunityDescription}>{opportunity.opportunity || 'No description available'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Options */}
          <div style={styles.exportSection}>
            <h4 style={styles.exportTitle}>📄 Export Options</h4>
            <div style={styles.exportButtons}>
              <button
                onClick={() => onExportReport && onExportReport('pdf', rankingData)}
                style={styles.exportButton}
              >
                📄 Export PDF Report
              </button>
              <button
                onClick={() => onExportReport && onExportReport('excel', rankingData)}
                style={styles.exportButton}
              >
                📊 Export Excel Analysis
              </button>
              <button
                onClick={() => onExportReport && onExportReport('presentation', rankingData)}
                style={styles.exportButton}
              >
                📽️ Create Presentation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh'
  },
  placeholder: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6c757d'
  },
  header: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    color: '#032842',
    marginBottom: '20px',
    fontSize: '28px',
    fontWeight: 'bold'
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '15px',
    border: '1px solid #bbdefb'
  },
  dataSourceIndicator: {
    display: 'inline-block',
    padding: '8px 14px',
    backgroundColor: '#f0f8ff',
    color: '#1976d2',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '15px',
    border: '1px solid #e3f2fd',
    marginLeft: '10px'
  },
  enhancedBadge: {
    color: '#2e7d32',
    fontWeight: '600'
  },
  controls: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  select: {
    padding: '10px 15px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    minWidth: '200px'
  },
  generateButton: {
    padding: '12px 25px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed'
  },
  configSection: {
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  configTitle: {
    marginBottom: '15px',
    color: '#032842'
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px'
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
  report: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  section: {
    marginBottom: '40px',
    paddingBottom: '30px',
    borderBottom: '1px solid #e9ecef'
  },
  sectionTitle: {
    color: '#032842',
    marginBottom: '25px',
    fontSize: '22px',
    fontWeight: 'bold',
    borderLeft: '4px solid #007bff',
    paddingLeft: '15px'
  },
  summaryHeader: {
    display: 'flex',
    gap: '40px',
    marginBottom: '30px',
    alignItems: 'flex-start'
  },
  finalScoreCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  scoreCircle: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  scoreLarge: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#032842'
  },
  scoreOutOf: {
    fontSize: '14px',
    color: '#6c757d'
  },
  ratingInfo: {
    textAlign: 'left'
  },
  overallRating: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  investment: {
    fontSize: '16px',
    color: '#495057',
    fontWeight: '500'
  },
  keyMetrics: {
    flex: 1
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  metricLabel: {
    fontSize: '14px',
    color: '#6c757d',
    fontWeight: '500'
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#032842'
  },
  recommendationBox: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '25px'
  },
  recommendationText: {
    fontSize: '16px',
    margin: 0,
    lineHeight: '1.5'
  },
  highlightsConcerns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    marginBottom: '25px'
  },
  highlights: {},
  concerns: {},
  positiveTitle: {
    color: '#28a745',
    marginBottom: '15px'
  },
  concernTitle: {
    color: '#dc3545',
    marginBottom: '15px'
  },
  bulletList: {
    paddingLeft: '20px'
  },
  positiveItem: {
    marginBottom: '8px',
    color: '#495057'
  },
  concernItem: {
    marginBottom: '8px',
    color: '#495057'
  },
  nextSteps: {},
  orderedList: {
    paddingLeft: '20px'
  },
  stepItem: {
    marginBottom: '8px',
    color: '#495057'
  },
  saturationContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  saturationScore: {
    textAlign: 'center'
  },
  saturationMeter: {
    width: '100%',
    height: '30px',
    backgroundColor: '#e9ecef',
    borderRadius: '15px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  saturationFill: {
    height: '100%',
    transition: 'width 0.5s ease'
  },
  saturationLabel: {
    fontSize: '16px',
    fontWeight: 'bold'
  },
  saturationDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px'
  },
  detailLabel: {
    fontWeight: '500'
  },
  detailValue: {
    fontWeight: 'bold',
    color: '#032842'
  },
  competitorContent: {},
  competitorOverview: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    marginBottom: '25px'
  },
  overviewItem: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  ratingDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '18px'
  },
  ratingNumber: {
    fontSize: '16px',
    fontWeight: 'bold'
  },
  advantage: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#032842'
  },
  competitorList: {
    marginBottom: '25px'
  },
  competitorItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '10px 15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    marginBottom: '10px'
  },
  competitorName: {
    flex: 1,
    fontWeight: '500'
  },
  competitorRating: {
    color: '#ff9500',
    fontWeight: 'bold'
  },
  competitorDistance: {
    color: '#6c757d',
    fontSize: '14px'
  },
  competitorReviews: {
    color: '#6c757d',
    fontSize: '12px'
  },
  marketGaps: {},
  gapsList: {
    paddingLeft: '20px'
  },
  gapItem: {
    marginBottom: '8px',
    color: '#495057'
  },
  customerContent: {},
  customerMetrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  metricCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center'
  },
  bigNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#032842',
    marginTop: '10px'
  },
  customerSegments: {},
  segmentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    marginBottom: '10px'
  },
  segmentName: {
    fontWeight: '500'
  },
  segmentData: {
    color: '#6c757d'
  },
  roiContent: {},
  roiOverview: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  roiCard: {
    padding: '20px',
    backgroundColor: '#e7f3ff',
    borderRadius: '8px',
    textAlign: 'center'
  },
  roiNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#0066cc',
    marginTop: '10px'
  },
  projectionsTable: {},
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px'
  },
  trafficContent: {},
  trafficScore: {
    marginBottom: '25px'
  },
  trafficLevel: {
    fontSize: '16px',
    marginTop: '10px'
  },
  trafficSources: {},
  sourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '10px 15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    marginBottom: '10px'
  },
  sourceName: {
    flex: 1,
    fontWeight: '500'
  },
  sourceDistance: {
    color: '#6c757d',
    fontSize: '14px'
  },
  sourceScore: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  opportunitiesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  opportunityCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '4px solid',
    position: 'relative'
  },
  opportunityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  opportunityType: {
    fontSize: '12px',
    color: '#6c757d',
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  opportunityPriority: {
    padding: '4px 8px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold'
  },
  opportunityCategory: {
    margin: '10px 0',
    color: '#032842'
  },
  opportunityDescription: {
    margin: 0,
    color: '#495057',
    lineHeight: '1.4'
  },
  exportSection: {
    marginTop: '40px',
    padding: '30px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center'
  },
  exportTitle: {
    marginBottom: '20px',
    color: '#032842'
  },
  exportButtons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  exportButton: {
    padding: '12px 25px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  // Demographics styles
  demographicsContent: {
    gap: '20px'
  },
  catchmentDemographics: {
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '25px',
    backgroundColor: '#fafafa'
  },
  catchmentTitle: {
    color: '#2c5530',
    marginBottom: '15px',
    fontSize: '16px',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '10px'
  },
  demographicsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '15px',
    marginTop: '15px'
  },
  demoCard: {
    backgroundColor: '#ffffff',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  },
  genderStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  genderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0'
  },
  ageStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  ageItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '3px 0',
    fontSize: '13px'
  },
  economicStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  economicItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0'
  },
  combinedDemographics: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#e8f4f8',
    borderRadius: '10px',
    border: '2px solid #b8daff'
  },
  summaryTitle: {
    color: '#0066cc',
    marginBottom: '15px',
    fontSize: '16px'
  },
  combinedStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '10px'
  },
  combinedItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '1px solid #cce7ff'
  },
  // Demographic Fit Analysis styles
  demographicFitContent: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '20px'
  },
  fitScoreCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center',
    border: '2px solid #e0e0e0'
  },
  fitScore: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  fitLevel: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#495057'
  },
  fitInsights: {
    backgroundColor: '#e8f5e8',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #c3e6cb'
  },
  populationInsights: {
    backgroundColor: '#e7f3ff',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #b8daff'
  },
  insightItem: {
    padding: '5px 0',
    fontSize: '14px',
    lineHeight: '1.4'
  },
  ageSegmentAnalysis: {
    backgroundColor: '#fff3cd',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #ffeeba'
  },
  segmentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
    marginTop: '10px'
  },
  segmentCard: {
    backgroundColor: '#ffffff',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
    textAlign: 'center'
  },
  segmentName: {
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  segmentPercentage: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: '3px'
  },
  segmentRelevance: {
    fontSize: '11px',
    color: '#6c757d'
  },
  purchasingPowerSection: {
    backgroundColor: '#f0fff0',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #d4edda'
  },
  powerStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
    marginTop: '10px'
  },
  powerItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '1px solid #d4edda'
  },
  // Revenue Projections styles
  revenueProjectionsContent: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '20px'
  },
  revenueOverview: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  revenueCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #dee2e6'
  },
  revenueNumber: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#0066cc',
    marginTop: '10px'
  },
  customerProjections: {
    backgroundColor: '#e8f4f8',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #b8daff'
  },
  customerStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '10px',
    marginTop: '10px'
  },
  customerItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '1px solid #cce7ff'
  },
  projectionFactors: {
    backgroundColor: '#fff8dc',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #ffeaa7'
  },
  factorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '8px',
    marginTop: '10px'
  },
  factorItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '13px'
  }
};

// Add table styles
const tableStyle = `
  table th, table td {
    padding: 12px;
    text-align: center;
    border-bottom: 1px solid #dee2e6;
  }
  table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #495057;
  }
  table tbody tr:hover {
    background-color: #f8f9fa;
  }
`;

// Inject table styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = tableStyle;
  document.head.appendChild(style);
}

export default CommerceRankingReport;
