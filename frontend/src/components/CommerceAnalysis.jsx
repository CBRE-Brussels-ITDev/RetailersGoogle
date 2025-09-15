import React, { useState, useEffect } from 'react';
import GooglePlacesService from '../services/GooglePlaces';

const CommerceAnalysis = ({ 
  selectedLocation, 
  places, 
  catchmentData, 
  onGenerateReport 
}) => {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCommerceType, setSelectedCommerceType] = useState('restaurant');
  const [analysisRadius, setAnalysisRadius] = useState(1000);

  // Commerce types for analysis
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

  // Analysis weights for different factors
  const analysisWeights = {
    demographics: 0.3,        // 30% - Population, age groups, purchasing power
    competition: 0.25,        // 25% - Number and quality of competitors
    accessibility: 0.2,       // 20% - Public transport, parking, walkability  
    marketPotential: 0.15,    // 15% - Market size, growth potential
    locationFactors: 0.1      // 10% - Visibility, foot traffic, proximity to anchors
  };

  // Perform comprehensive commerce analysis
  const performCommerceAnalysis = async () => {
    if (!selectedLocation || !places) {
      alert('Please select a location and search for places first');
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('Starting commerce analysis for:', selectedCommerceType);
      
      // 1. DEMOGRAPHIC ANALYSIS
      const demographicScore = analyzeDemographics();
      
      // 2. COMPETITION ANALYSIS  
      const competitionScore = analyzeCompetition();
      
      // 3. ACCESSIBILITY ANALYSIS
      const accessibilityScore = analyzeAccessibility();
      
      // 4. MARKET POTENTIAL ANALYSIS
      const marketPotentialScore = analyzeMarketPotential();
      
      // 5. LOCATION FACTORS ANALYSIS
      const locationFactorsScore = analyzeLocationFactors();

      // 6. CALCULATE OVERALL SCORE
      const overallScore = calculateOverallScore({
        demographics: demographicScore,
        competition: competitionScore, 
        accessibility: accessibilityScore,
        marketPotential: marketPotentialScore,
        locationFactors: locationFactorsScore
      });

      // 7. GENERATE RECOMMENDATIONS
      const recommendations = generateRecommendations(overallScore);

      // 8. RISK ASSESSMENT
      const riskAssessment = performRiskAssessment({
        demographics: demographicScore,
        competition: competitionScore,
        accessibility: accessibilityScore,
        marketPotential: marketPotentialScore,
        locationFactors: locationFactorsScore
      });

      setAnalysisResults({
        overallScore,
        breakdown: {
          demographics: demographicScore,
          competition: competitionScore,
          accessibility: accessibilityScore,
          marketPotential: marketPotentialScore,
          locationFactors: locationFactorsScore
        },
        recommendations,
        riskAssessment,
        analysisParams: {
          commerceType: selectedCommerceType,
          location: selectedLocation,
          radius: analysisRadius,
          analysisDate: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error performing commerce analysis:', error);
      alert('Error performing analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 1. DEMOGRAPHIC ANALYSIS
  const analyzeDemographics = () => {
    if (!catchmentData || catchmentData.length === 0) {
      console.log('No catchment data available, using estimated demographics');
      return estimateDemographicsFromLocation();
    }

    // Use the largest catchment area for comprehensive demographic analysis
    const primaryCatchment = catchmentData.reduce((largest, current) => 
      current.totalPopulation > largest.totalPopulation ? current : largest
    );

    const totalPop = primaryCatchment.totalPopulation || 0;
    const purchasePower = primaryCatchment.purchasePowerPerson || 25000;

    let score = 0;
    let details = {};

    // Population density score (0-25 points)
    const populationScore = Math.min(25, (totalPop / 1000) * 5);
    score += populationScore;
    details.population = {
      total: totalPop,
      score: populationScore,
      rating: getScoreRating(populationScore, 25)
    };

    // Age group relevance for commerce type (0-25 points)
    const ageScore = calculateAgeRelevanceScore(primaryCatchment, selectedCommerceType);
    score += ageScore;
    details.ageGroups = {
      score: ageScore,
      rating: getScoreRating(ageScore, 25),
      distribution: {
        young: primaryCatchment.pourcentAge1529 || 17,
        adults: (primaryCatchment.pourcentAge3044 || 18) + (primaryCatchment.pourcentAge4559 || 22),
        seniors: primaryCatchment.pourcentAge60PL || 28
      }
    };

    // Purchasing power score (0-25 points)  
    const purchasePowerScore = Math.min(25, (purchasePower / 1000));
    score += purchasePowerScore;
    details.purchasingPower = {
      perPerson: purchasePower,
      score: purchasePowerScore,
      rating: getScoreRating(purchasePowerScore, 25)
    };

    // Household composition score (0-25 points)
    const householdScore = calculateHouseholdScore(primaryCatchment, selectedCommerceType);
    score += householdScore;
    details.households = {
      total: primaryCatchment.totalHouseHolds || 0,
      avgSize: primaryCatchment.householdsMember || 2.3,
      score: householdScore,
      rating: getScoreRating(householdScore, 25)
    };

    return {
      totalScore: Math.round(score),
      maxScore: 100,
      rating: getScoreRating(score, 100),
      details
    };
  };

  // 2. COMPETITION ANALYSIS
  const analyzeCompetition = () => {
    const competitors = places.filter(place => 
      isCompetitor(place, selectedCommerceType)
    );

    const competitorsByDistance = competitors.map(competitor => ({
      ...competitor,
      distance: calculateDistance(
        selectedLocation.lat, selectedLocation.lng,
        competitor.coordinates.lat, competitor.coordinates.lng
      )
    })).sort((a, b) => a.distance - b.distance);

    let score = 100; // Start with perfect score, deduct for competition
    let details = {};

    // Direct competitors within 200m (high impact)
    const veryCloseCompetitors = competitorsByDistance.filter(c => c.distance <= 200);
    score -= veryCloseCompetitors.length * 15; // -15 points each
    
    // Competitors within 500m (medium impact)
    const closeCompetitors = competitorsByDistance.filter(c => c.distance > 200 && c.distance <= 500);
    score -= closeCompetitors.length * 8; // -8 points each
    
    // Competitors within 1km (low impact)
    const nearbyCompetitors = competitorsByDistance.filter(c => c.distance > 500 && c.distance <= 1000);
    score -= nearbyCompetitors.length * 3; // -3 points each

    // Quality adjustment - high-rated competitors are more threatening
    const highRatedCompetitors = competitors.filter(c => (c.rating || 0) >= 4.0);
    score -= highRatedCompetitors.length * 5; // Additional penalty for high-rated competitors

    // Market saturation assessment
    const competitionDensity = competitors.length / (Math.PI * Math.pow(analysisRadius / 1000, 2));
    const saturationPenalty = Math.min(20, competitionDensity * 10);
    score -= saturationPenalty;

    score = Math.max(0, Math.round(score)); // Ensure non-negative

    details = {
      totalCompetitors: competitors.length,
      veryClose: veryCloseCompetitors.length,
      close: closeCompetitors.length,
      nearby: nearbyCompetitors.length,
      highRated: highRatedCompetitors.length,
      averageRating: competitors.length > 0 ? 
        (competitors.reduce((sum, c) => sum + (c.rating || 0), 0) / competitors.length).toFixed(1) : 'N/A',
      competitionDensity: competitionDensity.toFixed(2),
      topCompetitors: competitorsByDistance.slice(0, 5).map(c => ({
        name: c.name,
        distance: Math.round(c.distance),
        rating: c.rating || 'N/A'
      }))
    };

    return {
      totalScore: score,
      maxScore: 100,
      rating: getScoreRating(score, 100),
      details
    };
  };

  // 3. ACCESSIBILITY ANALYSIS
  const analyzeAccessibility = () => {
    let score = 0;
    let details = {};

    // Public transport accessibility (0-30 points)
    const transitStops = places.filter(place => 
      place.types && (
        place.types.includes('bus_station') ||
        place.types.includes('subway_station') ||
        place.types.includes('train_station') ||
        place.types.includes('transit_station')
      )
    );

    const nearbyTransit = transitStops.filter(stop => {
      const distance = calculateDistance(
        selectedLocation.lat, selectedLocation.lng,
        stop.coordinates.lat, stop.coordinates.lng
      );
      return distance <= 500; // Within 500m
    });

    const transitScore = Math.min(30, nearbyTransit.length * 10);
    score += transitScore;

    details.publicTransport = {
      nearbyStops: nearbyTransit.length,
      score: transitScore,
      rating: getScoreRating(transitScore, 30)
    };

    // Parking facilities (0-25 points)
    const parkingFacilities = places.filter(place =>
      place.types && place.types.includes('parking')
    );

    const nearbyParking = parkingFacilities.filter(parking => {
      const distance = calculateDistance(
        selectedLocation.lat, selectedLocation.lng,
        parking.coordinates.lat, parking.coordinates.lng
      );
      return distance <= 200; // Within 200m
    });

    const parkingScore = Math.min(25, nearbyParking.length * 8);
    score += parkingScore;

    details.parking = {
      nearbyFacilities: nearbyParking.length,
      score: parkingScore,
      rating: getScoreRating(parkingScore, 25)
    };

    // Walkability factors (0-25 points)
    const walkabilityFactors = places.filter(place => 
      place.types && (
        place.types.includes('grocery_or_supermarket') ||
        place.types.includes('bank') ||
        place.types.includes('pharmacy') ||
        place.types.includes('school') ||
        place.types.includes('hospital')
      )
    );

    const walkabilityScore = Math.min(25, walkabilityFactors.length * 2);
    score += walkabilityScore;

    details.walkability = {
      nearbyServices: walkabilityFactors.length,
      score: walkabilityScore,
      rating: getScoreRating(walkabilityScore, 25)
    };

    // Major roads and highways (0-20 points)
    // This would ideally use actual road data, but we'll estimate based on location
    const roadAccessScore = 15; // Placeholder - would need road network data
    score += roadAccessScore;

    details.roadAccess = {
      score: roadAccessScore,
      rating: getScoreRating(roadAccessScore, 20)
    };

    return {
      totalScore: Math.round(score),
      maxScore: 100,
      rating: getScoreRating(score, 100),
      details
    };
  };

  // 4. MARKET POTENTIAL ANALYSIS
  const analyzeMarketPotential = () => {
    let score = 0;
    let details = {};

    // Target demographic concentration (0-30 points)
    const targetScore = calculateTargetDemographicScore(selectedCommerceType);
    score += targetScore;

    details.targetDemographic = {
      score: targetScore,
      rating: getScoreRating(targetScore, 30)
    };

    // Economic indicators (0-25 points)
    const economicScore = calculateEconomicScore();
    score += economicScore;

    details.economic = {
      score: economicScore,
      rating: getScoreRating(economicScore, 25)
    };

    // Market gaps and opportunities (0-25 points)
    const gapScore = calculateMarketGapScore(selectedCommerceType);
    score += gapScore;

    details.marketGaps = {
      score: gapScore,
      rating: getScoreRating(gapScore, 25)
    };

    // Growth potential (0-20 points)
    const growthScore = calculateGrowthPotential();
    score += growthScore;

    details.growthPotential = {
      score: growthScore,
      rating: getScoreRating(growthScore, 20)
    };

    return {
      totalScore: Math.round(score),
      maxScore: 100,
      rating: getScoreRating(score, 100),
      details
    };
  };

  // 5. LOCATION FACTORS ANALYSIS
  const analyzeLocationFactors = () => {
    let score = 0;
    let details = {};

    // Anchor businesses and foot traffic generators (0-35 points)
    const anchors = places.filter(place => 
      place.types && (
        place.types.includes('shopping_mall') ||
        place.types.includes('department_store') ||
        place.types.includes('supermarket') ||
        place.types.includes('hospital') ||
        place.types.includes('school') ||
        place.types.includes('university')
      )
    );

    const nearbyAnchors = anchors.filter(anchor => {
      const distance = calculateDistance(
        selectedLocation.lat, selectedLocation.lng,
        anchor.coordinates.lat, anchor.coordinates.lng
      );
      return distance <= 500;
    });

    const anchorScore = Math.min(35, nearbyAnchors.length * 12);
    score += anchorScore;

    details.anchors = {
      nearbyAnchors: nearbyAnchors.length,
      score: anchorScore,
      rating: getScoreRating(anchorScore, 35),
      topAnchors: nearbyAnchors.slice(0, 3).map(a => a.name)
    };

    // Visibility and street presence (0-25 points)
    const visibilityScore = 20; // Placeholder - would need street view data
    score += visibilityScore;

    details.visibility = {
      score: visibilityScore,
      rating: getScoreRating(visibilityScore, 25)
    };

    // Complementary businesses (0-25 points)
    const complementaryScore = calculateComplementaryBusinessScore(selectedCommerceType);
    score += complementaryScore;

    details.complementary = {
      score: complementaryScore,
      rating: getScoreRating(complementaryScore, 25)
    };

    // Safety and area quality (0-15 points)
    const safetyScore = 12; // Placeholder - would need crime data
    score += safetyScore;

    details.safety = {
      score: safetyScore,
      rating: getScoreRating(safetyScore, 15)
    };

    return {
      totalScore: Math.round(score),
      maxScore: 100,
      rating: getScoreRating(score, 100),
      details
    };
  };

  // Calculate overall weighted score
  const calculateOverallScore = (scores) => {
    const weightedScore = 
      (scores.demographics.totalScore * analysisWeights.demographics) +
      (scores.competition.totalScore * analysisWeights.competition) +
      (scores.accessibility.totalScore * analysisWeights.accessibility) +
      (scores.marketPotential.totalScore * analysisWeights.marketPotential) +
      (scores.locationFactors.totalScore * analysisWeights.locationFactors);

    return {
      score: Math.round(weightedScore),
      maxScore: 100,
      rating: getScoreRating(weightedScore, 100),
      recommendation: getOverallRecommendation(weightedScore)
    };
  };

  // Helper functions for analysis calculations
  
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth's radius in meters
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

  const isCompetitor = (place, commerceType) => {
    if (!place.types) return false;
    
    const competitorMappings = {
      'restaurant': ['restaurant', 'food', 'meal_takeaway', 'meal_delivery'],
      'retail_store': ['store', 'clothing_store', 'electronics_store', 'furniture_store'],
      'grocery_or_supermarket': ['grocery_or_supermarket', 'supermarket', 'convenience_store'],
      'bakery': ['bakery', 'food'],
      'clothing_store': ['clothing_store', 'shoe_store', 'department_store'],
      'pharmacy': ['pharmacy', 'drugstore', 'health'],
      'bank': ['bank', 'atm', 'finance'],
      'gas_station': ['gas_station', 'car_repair'],
      'beauty_salon': ['beauty_salon', 'hair_care', 'spa'],
      'gym': ['gym', 'health']
    };

    const competitorTypes = competitorMappings[commerceType] || [commerceType];
    return place.types.some(type => 
      competitorTypes.some(compType => type.includes(compType))
    );
  };

  const getScoreRating = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good'; 
    if (percentage >= 40) return 'Fair';
    if (percentage >= 20) return 'Poor';
    return 'Very Poor';
  };

  const getOverallRecommendation = (score) => {
    if (score >= 80) return 'Highly Recommended - Excellent location for new commerce';
    if (score >= 65) return 'Recommended - Good potential with some considerations';
    if (score >= 50) return 'Conditional - Requires careful planning and strategy';
    if (score >= 35) return 'Not Recommended - High risk, major challenges';
    return 'Strongly Discourage - Poor location choice';
  };

  const calculateAgeRelevanceScore = (catchment, commerceType) => {
    // Age group preferences by commerce type
    const agePreferences = {
      'restaurant': { young: 0.3, adults: 0.5, seniors: 0.2 },
      'retail_store': { young: 0.4, adults: 0.4, seniors: 0.2 },
      'grocery_or_supermarket': { young: 0.2, adults: 0.4, seniors: 0.4 },
      'bakery': { young: 0.2, adults: 0.3, seniors: 0.5 },
      'clothing_store': { young: 0.5, adults: 0.4, seniors: 0.1 },
      'pharmacy': { young: 0.1, adults: 0.3, seniors: 0.6 },
      'bank': { young: 0.2, adults: 0.5, seniors: 0.3 },
      'gas_station': { young: 0.3, adults: 0.6, seniors: 0.1 },
      'beauty_salon': { young: 0.4, adults: 0.5, seniors: 0.1 },
      'gym': { young: 0.6, adults: 0.3, seniors: 0.1 }
    };

    const prefs = agePreferences[commerceType] || { young: 0.33, adults: 0.33, seniors: 0.34 };
    
    const youngPct = (catchment.pourcentAge1529 || 17) / 100;
    const adultPct = ((catchment.pourcentAge3044 || 18) + (catchment.pourcentAge4559 || 22)) / 100;
    const seniorPct = (catchment.pourcentAge60PL || 28) / 100;
    
    const relevanceScore = (youngPct * prefs.young + adultPct * prefs.adults + seniorPct * prefs.seniors) * 100;
    
    return Math.min(25, relevanceScore);
  };

  const calculateHouseholdScore = (catchment, commerceType) => {
    const avgHouseholdSize = parseFloat(catchment.householdsMember) || 2.3;
    const totalHouseholds = catchment.totalHouseHolds || 0;
    
    // Different commerce types benefit from different household compositions
    const householdPreferences = {
      'restaurant': { idealSize: 2.5, sizeWeight: 0.4, countWeight: 0.6 },
      'grocery_or_supermarket': { idealSize: 3.2, sizeWeight: 0.7, countWeight: 0.3 },
      'clothing_store': { idealSize: 2.8, sizeWeight: 0.3, countWeight: 0.7 },
      'pharmacy': { idealSize: 2.5, sizeWeight: 0.2, countWeight: 0.8 }
    };
    
    const prefs = householdPreferences[commerceType] || { idealSize: 2.5, sizeWeight: 0.5, countWeight: 0.5 };
    
    const sizeScore = Math.max(0, 15 - Math.abs(avgHouseholdSize - prefs.idealSize) * 5) * prefs.sizeWeight;
    const countScore = Math.min(15, totalHouseholds / 100) * prefs.countWeight;
    
    return sizeScore + countScore;
  };

  const estimateDemographicsFromLocation = () => {
    // Basic demographic estimation based on location
    // This is a simplified version when catchment data is not available
    return {
      totalScore: 60,
      maxScore: 100,
      rating: 'Fair',
      details: {
        population: { total: 'Estimated', score: 15, rating: 'Fair' },
        ageGroups: { score: 15, rating: 'Fair' },
        purchasingPower: { perPerson: 'Estimated', score: 15, rating: 'Fair' },
        households: { score: 15, rating: 'Fair' }
      }
    };
  };

  const calculateTargetDemographicScore = (commerceType) => {
    // Placeholder - would need more detailed demographic data
    return 20;
  };

  const calculateEconomicScore = () => {
    // Placeholder - would need economic indicators
    return 18;
  };

  const calculateMarketGapScore = (commerceType) => {
    const competitors = places.filter(place => isCompetitor(place, commerceType));
    const gap = Math.max(0, 5 - competitors.length);
    return Math.min(25, gap * 5);
  };

  const calculateGrowthPotential = () => {
    // Placeholder - would need development data
    return 15;
  };

  const calculateComplementaryBusinessScore = (commerceType) => {
    const complementaryMappings = {
      'restaurant': ['grocery_or_supermarket', 'bank', 'shopping_mall'],
      'retail_store': ['parking', 'bank', 'restaurant'],
      'grocery_or_supermarket': ['pharmacy', 'bank', 'restaurant'],
      'bakery': ['grocery_or_supermarket', 'restaurant', 'school'],
      'pharmacy': ['hospital', 'grocery_or_supermarket', 'bank']
    };

    const complementaryTypes = complementaryMappings[commerceType] || [];
    const complementaryPlaces = places.filter(place =>
      place.types && complementaryTypes.some(type =>
        place.types.some(placeType => placeType.includes(type))
      )
    );

    return Math.min(25, complementaryPlaces.length * 3);
  };

  const generateRecommendations = (overallScore) => {
    const recommendations = [];
    const score = overallScore.score;

    // General recommendations based on score
    if (score >= 80) {
      recommendations.push({
        type: 'positive',
        title: 'Prime Location',
        message: 'This location shows excellent potential for your commerce type.',
        priority: 'high'
      });
    } else if (score >= 65) {
      recommendations.push({
        type: 'caution', 
        title: 'Good Potential with Considerations',
        message: 'Location has good potential but consider addressing weak areas.',
        priority: 'medium'
      });
    } else if (score < 50) {
      recommendations.push({
        type: 'warning',
        title: 'High Risk Location',
        message: 'This location presents significant challenges for new commerce.',
        priority: 'high'
      });
    }

    // Specific recommendations based on analysis components
    // Add specific recommendations based on weak areas

    return recommendations;
  };

  const performRiskAssessment = (scores) => {
    const risks = [];

    if (scores.competition.totalScore < 50) {
      risks.push({
        level: 'high',
        factor: 'High Competition',
        impact: 'Market saturation may limit customer acquisition',
        mitigation: 'Consider differentiation strategy or alternative location'
      });
    }

    if (scores.demographics.totalScore < 40) {
      risks.push({
        level: 'medium',
        factor: 'Poor Demographics',
        impact: 'Target market may not be sufficient for sustained business',
        mitigation: 'Expand target demographic or enhance value proposition'
      });
    }

    if (scores.accessibility.totalScore < 40) {
      risks.push({
        level: 'medium',
        factor: 'Poor Accessibility',
        impact: 'Customers may have difficulty reaching location',
        mitigation: 'Improve signage and consider delivery options'
      });
    }

    return risks;
  };

  // Format score for display
  const formatScore = (score, maxScore) => {
    return `${score}/${maxScore}`;
  };

  const getScoreColor = (rating) => {
    const colors = {
      'Excellent': '#28a745',
      'Good': '#17a2b8', 
      'Fair': '#ffc107',
      'Poor': '#fd7e14',
      'Very Poor': '#dc3545'
    };
    return colors[rating] || '#6c757d';
  };

  if (!selectedLocation) {
    return (
      <div style={styles.container}>
        <div style={styles.placeholder}>
          <h3>📊 Commerce Location Analysis</h3>
          <p>Please select a location on the map to begin analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>📊 Commerce Location Analysis</h3>
        <div style={styles.controls}>
          <select 
            value={selectedCommerceType}
            onChange={(e) => setSelectedCommerceType(e.target.value)}
            style={styles.select}
          >
            {commerceTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
          
          <select
            value={analysisRadius}
            onChange={(e) => setAnalysisRadius(parseInt(e.target.value))}
            style={styles.select}
          >
            <option value={500}>500m radius</option>
            <option value={1000}>1km radius</option>
            <option value={2000}>2km radius</option>
          </select>

          <button
            onClick={performCommerceAnalysis}
            disabled={isAnalyzing || !places || places.length === 0}
            style={{
              ...styles.analyzeButton,
              ...(isAnalyzing ? styles.disabledButton : {})
            }}
          >
            {isAnalyzing ? '🔄 Analyzing...' : '🚀 Analyze Location'}
          </button>
        </div>
      </div>

      {analysisResults && (
        <div style={styles.results}>
          {/* Overall Score */}
          <div style={styles.overallScore}>
            <div style={styles.scoreCircle}>
              <div style={styles.scoreNumber}>
                {analysisResults.overallScore.score}
              </div>
              <div style={styles.scoreMax}>/ 100</div>
            </div>
            <div style={styles.scoreDetails}>
              <div 
                style={{
                  ...styles.scoreRating,
                  color: getScoreColor(analysisResults.overallScore.rating)
                }}
              >
                {analysisResults.overallScore.rating}
              </div>
              <div style={styles.recommendation}>
                {analysisResults.overallScore.recommendation}
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div style={styles.breakdown}>
            <h4 style={styles.sectionTitle}>📈 Analysis Breakdown</h4>
            
            {Object.entries(analysisResults.breakdown).map(([category, result]) => (
              <div key={category} style={styles.categoryRow}>
                <div style={styles.categoryInfo}>
                  <span style={styles.categoryName}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span style={styles.categoryWeight}>
                    ({Math.round(analysisWeights[category] * 100)}% weight)
                  </span>
                </div>
                <div style={styles.categoryScore}>
                  <div style={styles.scoreBar}>
                    <div 
                      style={{
                        ...styles.scoreBarFill,
                        width: `${result.totalScore}%`,
                        backgroundColor: getScoreColor(result.rating)
                      }}
                    />
                  </div>
                  <span style={styles.scoreText}>
                    {formatScore(result.totalScore, result.maxScore)}
                  </span>
                  <span 
                    style={{
                      ...styles.ratingBadge,
                      backgroundColor: getScoreColor(result.rating)
                    }}
                  >
                    {result.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {analysisResults.recommendations.length > 0 && (
            <div style={styles.recommendations}>
              <h4 style={styles.sectionTitle}>💡 Recommendations</h4>
              {analysisResults.recommendations.map((rec, index) => (
                <div 
                  key={index}
                  style={{
                    ...styles.recommendationItem,
                    borderLeft: `4px solid ${
                      rec.type === 'positive' ? '#28a745' :
                      rec.type === 'caution' ? '#ffc107' : '#dc3545'
                    }`
                  }}
                >
                  <div style={styles.recTitle}>{rec.title}</div>
                  <div style={styles.recMessage}>{rec.message}</div>
                </div>
              ))}
            </div>
          )}

          {/* Risk Assessment */}
          {analysisResults.riskAssessment.length > 0 && (
            <div style={styles.risks}>
              <h4 style={styles.sectionTitle}>⚠️ Risk Assessment</h4>
              {analysisResults.riskAssessment.map((risk, index) => (
                <div key={index} style={styles.riskItem}>
                  <div style={styles.riskHeader}>
                    <span 
                      style={{
                        ...styles.riskLevel,
                        backgroundColor: risk.level === 'high' ? '#dc3545' : '#ffc107'
                      }}
                    >
                      {risk.level.toUpperCase()} RISK
                    </span>
                    <span style={styles.riskFactor}>{risk.factor}</span>
                  </div>
                  <div style={styles.riskImpact}>{risk.impact}</div>
                  <div style={styles.riskMitigation}>
                    <strong>Mitigation:</strong> {risk.mitigation}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Export Options */}
          <div style={styles.exportSection}>
            <button
              onClick={() => onGenerateReport && onGenerateReport(analysisResults)}
              style={styles.exportButton}
            >
              📄 Generate Detailed Report
            </button>
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
    marginBottom: '30px'
  },
  title: {
    color: '#032842',
    marginBottom: '20px',
    fontSize: '24px'
  },
  controls: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '150px'
  },
  analyzeButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed'
  },
  results: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  overallScore: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  scoreCircle: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '30px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  scoreNumber: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#032842'
  },
  scoreMax: {
    fontSize: '14px',
    color: '#6c757d'
  },
  scoreDetails: {
    flex: 1
  },
  scoreRating: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  recommendation: {
    fontSize: '16px',
    color: '#495057',
    lineHeight: '1.4'
  },
  breakdown: {
    marginBottom: '30px'
  },
  sectionTitle: {
    color: '#032842',
    marginBottom: '20px',
    fontSize: '18px',
    borderBottom: '2px solid #e9ecef',
    paddingBottom: '10px'
  },
  categoryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 0',
    borderBottom: '1px solid #e9ecef'
  },
  categoryInfo: {
    flex: 1
  },
  categoryName: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#032842'
  },
  categoryWeight: {
    fontSize: '12px',
    color: '#6c757d',
    marginLeft: '10px'
  },
  categoryScore: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  scoreBar: {
    width: '100px',
    height: '8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  scoreBarFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  scoreText: {
    fontSize: '14px',
    fontWeight: 'bold',
    minWidth: '50px'
  },
  ratingBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    minWidth: '70px',
    textAlign: 'center'
  },
  recommendations: {
    marginBottom: '30px'
  },
  recommendationItem: {
    padding: '15px',
    marginBottom: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px'
  },
  recTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  recMessage: {
    fontSize: '14px',
    color: '#495057'
  },
  risks: {
    marginBottom: '30px'
  },
  riskItem: {
    padding: '15px',
    marginBottom: '15px',
    backgroundColor: '#fff3cd',
    borderRadius: '4px',
    border: '1px solid #ffeaa7'
  },
  riskHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px'
  },
  riskLevel: {
    padding: '4px 8px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    marginRight: '15px'
  },
  riskFactor: {
    fontSize: '16px',
    fontWeight: 'bold'
  },
  riskImpact: {
    fontSize: '14px',
    marginBottom: '8px'
  },
  riskMitigation: {
    fontSize: '14px',
    color: '#495057'
  },
  exportSection: {
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: '1px solid #e9ecef'
  },
  exportButton: {
    padding: '12px 30px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  }
};

export default CommerceAnalysis;
