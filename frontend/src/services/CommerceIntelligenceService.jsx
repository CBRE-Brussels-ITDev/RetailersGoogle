// Enhanced Commerce Intelligence Service
import GooglePlacesService from './GooglePlaces';

const CommerceIntelligenceService = {
    // MARKET ANALYSIS METHODS

    /**
     * Calculate Market Saturation Index for a specific commerce type
     * Returns 0-100 where 100 = oversaturated, 0 = no competition
     */
    calculateMarketSaturation(places, commerceType, searchRadius) {
        const competitors = this.filterCompetitors(places, commerceType);
        const areaKm2 = Math.PI * Math.pow(searchRadius / 1000, 2);
        const density = competitors.length / areaKm2;
        
        // Industry benchmarks (competitors per km²)
        const benchmarks = {
            restaurant: 15,
            retail_store: 8,
            grocery_or_supermarket: 2,
            pharmacy: 3,
            bank: 5,
            bakery: 4,
            clothing_store: 10,
            beauty_salon: 12,
            gym: 6,
            gas_station: 2
        };
        
        const benchmark = benchmarks[commerceType] || 6;
        const saturationIndex = Math.min(100, (density / benchmark) * 100);
        
        return {
            saturationIndex: Math.round(saturationIndex),
            competitorCount: competitors.length,
            density: density.toFixed(2),
            benchmark: benchmark,
            level: this.getSaturationLevel(saturationIndex)
        };
    },

    /**
     * Analyze competitor quality and positioning
     */
    analyzeCompetitorLandscape(places, commerceType, selectedLocation) {
        const competitors = this.filterCompetitors(places, commerceType);
        
        if (competitors.length === 0) {
            return {
                averageRating: 0,
                topRatedCompetitors: [],
                weakCompetitors: [],
                priceDistribution: {},
                competitorGaps: ['No direct competition - first mover advantage'],
                competitiveAdvantage: 'High - No established competition'
            };
        }

        // Calculate distances and sort by proximity
        const competitorsWithDistance = competitors.map(comp => ({
            ...comp,
            distance: this.calculateDistance(
                selectedLocation.lat, selectedLocation.lng,
                comp.coordinates.lat, comp.coordinates.lng
            )
        })).sort((a, b) => a.distance - b.distance);

        // Quality analysis
        const ratingsData = competitors
            .filter(c => c.rating && c.rating > 0)
            .map(c => c.rating);
            
        const averageRating = ratingsData.length > 0 ? 
            (ratingsData.reduce((sum, r) => sum + r, 0) / ratingsData.length).toFixed(1) : 0;

        const topRated = competitorsWithDistance
            .filter(c => c.rating >= 4.0)
            .slice(0, 5);

        const weakCompetitors = competitorsWithDistance
            .filter(c => c.rating && c.rating < 3.5)
            .slice(0, 5);

        // Price level distribution
        const priceDistribution = this.analyzePriceDistribution(competitors);

        // Identify competitive gaps
        const competitorGaps = this.identifyMarketGaps(competitors, commerceType);

        return {
            averageRating: parseFloat(averageRating),
            topRatedCompetitors: topRated.map(c => ({
                name: c.name,
                rating: c.rating,
                distance: Math.round(c.distance),
                userRatings: c.user_ratings_total || 0
            })),
            weakCompetitors: weakCompetitors.map(c => ({
                name: c.name,
                rating: c.rating,
                distance: Math.round(c.distance),
                userRatings: c.user_ratings_total || 0
            })),
            priceDistribution,
            competitorGaps,
            competitiveAdvantage: this.assessCompetitiveAdvantage(competitors, averageRating),
            nearestCompetitor: competitorsWithDistance[0] ? {
                name: competitorsWithDistance[0].name,
                distance: Math.round(competitorsWithDistance[0].distance),
                rating: competitorsWithDistance[0].rating
            } : null
        };
    },

    /**
     * Calculate Customer Acquisition Potential
     */
    calculateCustomerAcquisitionPotential(catchmentData, places, commerceType) {
        if (!catchmentData || catchmentData.length === 0) {
            return {
                estimatedCustomers: 'N/A - No catchment data',
                customerSegments: {},
                acquisitionScore: 50,
                marketPenetration: 'Unknown'
            };
        }

        // Use the largest catchment for comprehensive analysis
        const primaryCatchment = catchmentData.reduce((largest, current) => 
            current.totalPopulation > largest.totalPopulation ? current : largest
        );

        const totalPopulation = primaryCatchment.totalPopulation || 0;
        
        // Industry-specific customer conversion rates and frequency
        const industryMetrics = {
            restaurant: { conversionRate: 0.15, avgVisitsPerMonth: 4, avgSpendPerVisit: 25 },
            retail_store: { conversionRate: 0.08, avgVisitsPerMonth: 2, avgSpendPerVisit: 45 },
            grocery_or_supermarket: { conversionRate: 0.25, avgVisitsPerMonth: 8, avgSpendPerVisit: 35 },
            pharmacy: { conversionRate: 0.12, avgVisitsPerMonth: 3, avgSpendPerVisit: 15 },
            bakery: { conversionRate: 0.18, avgVisitsPerMonth: 6, avgSpendPerVisit: 12 },
            clothing_store: { conversionRate: 0.06, avgVisitsPerMonth: 1.5, avgSpendPerVisit: 65 },
            beauty_salon: { conversionRate: 0.08, avgVisitsPerMonth: 1.2, avgSpendPerVisit: 55 },
            gym: { conversionRate: 0.03, avgVisitsPerMonth: 12, avgSpendPerVisit: 45 },
            bank: { conversionRate: 0.05, avgVisitsPerMonth: 2, avgSpendPerVisit: 0 }, // Service fees
            gas_station: { conversionRate: 0.20, avgVisitsPerMonth: 6, avgSpendPerVisit: 40 }
        };

        const metrics = industryMetrics[commerceType] || industryMetrics.retail_store;
        
        // Demographic adjustments
        const demographicMultiplier = this.calculateDemographicMultiplier(primaryCatchment, commerceType);
        
        // Competition adjustment
        const competitors = this.filterCompetitors(places, commerceType);
        const competitionMultiplier = Math.max(0.3, 1 - (competitors.length * 0.15));

        // Calculate customer potential
        const potentialCustomers = Math.round(
            totalPopulation * metrics.conversionRate * demographicMultiplier * competitionMultiplier
        );

        const monthlyRevenuePotential = Math.round(
            potentialCustomers * metrics.avgVisitsPerMonth * metrics.avgSpendPerVisit
        );

        const annualRevenuePotential = monthlyRevenuePotential * 12;

        return {
            potentialCustomers,
            monthlyRevenuePotential,
            annualRevenuePotential,
            demographicMultiplier: demographicMultiplier.toFixed(2),
            competitionMultiplier: competitionMultiplier.toFixed(2),
            marketMetrics: metrics,
            customerSegments: this.analyzeCustomerSegments(primaryCatchment, commerceType),
            acquisitionScore: this.calculateAcquisitionScore(potentialCustomers, totalPopulation, competitors.length)
        };
    },

    /**
     * Foot Traffic Analysis based on surrounding businesses
     */
    analyzeFootTraffic(places, selectedLocation, radius = 500) {
        // High foot traffic generators
        const trafficGenerators = places.filter(place => {
            if (!place.types) return false;
            return place.types.some(type => 
                ['shopping_mall', 'supermarket', 'department_store', 'school', 'hospital', 
                 'university', 'train_station', 'subway_station', 'bus_station'].includes(type)
            );
        });

        // Calculate distance-weighted foot traffic score
        let trafficScore = 0;
        const trafficSources = [];

        trafficGenerators.forEach(generator => {
            const distance = this.calculateDistance(
                selectedLocation.lat, selectedLocation.lng,
                generator.coordinates.lat, generator.coordinates.lng
            );

            if (distance <= radius) {
                // Weight decreases with distance
                const weight = Math.max(0, 1 - (distance / radius));
                const generatorScore = this.getTrafficGeneratorScore(generator.types) * weight;
                trafficScore += generatorScore;

                trafficSources.push({
                    name: generator.name,
                    type: generator.types[0],
                    distance: Math.round(distance),
                    trafficScore: Math.round(generatorScore),
                    weight: weight.toFixed(2)
                });
            }
        });

        // Normalize score to 0-100
        const normalizedScore = Math.min(100, trafficScore);

        return {
            footTrafficScore: Math.round(normalizedScore),
            level: this.getTrafficLevel(normalizedScore),
            trafficSources: trafficSources.sort((a, b) => b.trafficScore - a.trafficScore).slice(0, 10),
            nearbyGenerators: trafficGenerators.length,
            recommendations: this.getTrafficRecommendations(normalizedScore, trafficSources)
        };
    },

    /**
     * Site Selection Scoring Algorithm
     * Comprehensive scoring considering all factors
     */
    calculateSiteScore(analysisData) {
        const {
            demographics,
            competition,
            accessibility,
            marketPotential,
            locationFactors,
            customerPotential,
            footTraffic
        } = analysisData;

        // Weighted scoring
        const weights = {
            demographics: 0.25,
            competition: 0.20,
            accessibility: 0.15,
            marketPotential: 0.15,
            locationFactors: 0.10,
            customerPotential: 0.10,
            footTraffic: 0.05
        };

        let totalScore = 0;
        let maxPossibleScore = 0;

        Object.entries(weights).forEach(([factor, weight]) => {
            const factorData = analysisData[factor];
            if (factorData && factorData.totalScore !== undefined) {
                totalScore += (factorData.totalScore / 100) * weight * 100;
                maxPossibleScore += weight * 100;
            }
        });

        const finalScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

        return {
            finalScore: Math.round(finalScore),
            rating: this.getOverallRating(finalScore),
            recommendation: this.getInvestmentRecommendation(finalScore),
            confidenceLevel: this.calculateConfidenceLevel(analysisData),
            riskLevel: this.calculateRiskLevel(finalScore, analysisData)
        };
    },

    /**
     * Generate Investment ROI Projections
     */
    calculateROIProjections(customerPotential, commerceType, investmentAmount = 100000) {
        if (!customerPotential.annualRevenuePotential) {
            return {
                error: 'Insufficient data for ROI calculation'
            };
        }

        const annualRevenue = customerPotential.annualRevenuePotential;
        
        // Industry-specific cost structures (% of revenue)
        const costStructures = {
            restaurant: { cogs: 0.32, labor: 0.28, rent: 0.08, other: 0.22 },
            retail_store: { cogs: 0.55, labor: 0.15, rent: 0.10, other: 0.15 },
            grocery_or_supermarket: { cogs: 0.75, labor: 0.12, rent: 0.06, other: 0.05 },
            pharmacy: { cogs: 0.65, labor: 0.18, rent: 0.08, other: 0.07 },
            bakery: { cogs: 0.35, labor: 0.25, rent: 0.10, other: 0.20 },
            clothing_store: { cogs: 0.50, labor: 0.20, rent: 0.12, other: 0.13 },
            beauty_salon: { cogs: 0.20, labor: 0.40, rent: 0.12, other: 0.18 },
            gym: { cogs: 0.10, labor: 0.35, rent: 0.15, other: 0.25 }
        };

        const costs = costStructures[commerceType] || costStructures.retail_store;
        
        const totalCostPercentage = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
        const grossMargin = 1 - totalCostPercentage;
        const netProfit = annualRevenue * grossMargin;

        const paybackPeriod = investmentAmount / netProfit;
        const roi = (netProfit / investmentAmount) * 100;

        // 5-year projections with growth assumptions
        const projections = [];
        const growthRates = [0, 0.15, 0.12, 0.10, 0.08]; // Year-over-year growth
        
        for (let year = 1; year <= 5; year++) {
            const yearlyGrowth = growthRates[year - 1];
            const yearRevenue = annualRevenue * Math.pow(1 + yearlyGrowth, year - 1);
            const yearProfit = yearRevenue * grossMargin;
            const cumulativeProfit = projections.reduce((sum, p) => sum + p.profit, 0) + yearProfit;
            
            projections.push({
                year,
                revenue: Math.round(yearRevenue),
                profit: Math.round(yearProfit),
                cumulativeProfit: Math.round(cumulativeProfit),
                roi: Math.round((cumulativeProfit / investmentAmount) * 100)
            });
        }

        return {
            initialInvestment: investmentAmount,
            annualRevenue: Math.round(annualRevenue),
            annualProfit: Math.round(netProfit),
            grossMargin: Math.round(grossMargin * 100),
            paybackPeriod: paybackPeriod.toFixed(1),
            firstYearROI: Math.round(roi),
            projections,
            breakEvenMonths: Math.round(paybackPeriod * 12),
            riskAdjustedROI: Math.round(roi * 0.8) // Conservative estimate
        };
    },

    /**
     * Generate Market Opportunities Report
     */
    identifyMarketOpportunities(places, catchmentData, selectedLocation, radius = 2000) {
        const opportunities = [];

        // 1. Underserved Market Segments
        const marketGaps = this.identifyMarketGaps(places);
        marketGaps.forEach(gap => {
            opportunities.push({
                type: 'Market Gap',
                category: gap.category,
                opportunity: gap.description,
                potential: gap.potential,
                priority: gap.priority
            });
        });

        // 2. Demographic Opportunities
        if (catchmentData && catchmentData.length > 0) {
            const demographics = catchmentData[0]; // Use primary catchment
            const demoOpportunities = this.analyzeDemographicOpportunities(demographics);
            opportunities.push(...demoOpportunities);
        }

        // 3. Location-Based Opportunities
        const locationOpportunities = this.analyzeLocationOpportunities(places, selectedLocation);
        opportunities.push(...locationOpportunities);

        // 4. Seasonal and Trend Opportunities
        const trendOpportunities = this.identifyTrendOpportunities(places, catchmentData);
        opportunities.push(...trendOpportunities);

        // Sort by potential and priority
        return opportunities.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        });
    },

    // HELPER METHODS

    filterCompetitors(places, commerceType) {
        const competitorMappings = {
            'restaurant': ['restaurant', 'food', 'meal_takeaway', 'meal_delivery', 'cafe'],
            'retail_store': ['store', 'clothing_store', 'electronics_store', 'furniture_store', 'home_goods_store'],
            'grocery_or_supermarket': ['grocery_or_supermarket', 'supermarket', 'convenience_store'],
            'bakery': ['bakery', 'food'],
            'clothing_store': ['clothing_store', 'shoe_store', 'department_store', 'jewelry_store'],
            'pharmacy': ['pharmacy', 'drugstore', 'health'],
            'bank': ['bank', 'atm', 'finance'],
            'gas_station': ['gas_station', 'car_repair'],
            'beauty_salon': ['beauty_salon', 'hair_care', 'spa'],
            'gym': ['gym', 'health']
        };

        const competitorTypes = competitorMappings[commerceType] || [commerceType];
        
        return places.filter(place => {
            if (!place.types) return false;
            return place.types.some(type => 
                competitorTypes.some(compType => type.includes(compType))
            );
        });
    },

    calculateDistance(lat1, lng1, lat2, lng2) {
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
    },

    getSaturationLevel(index) {
        if (index >= 80) return 'Oversaturated';
        if (index >= 60) return 'High Competition';
        if (index >= 40) return 'Moderate Competition';
        if (index >= 20) return 'Light Competition';
        return 'Low Competition';
    },

    analyzePriceDistribution(competitors) {
        const priceLevels = competitors.filter(c => c.price_level !== undefined);
        const distribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
        
        priceLevels.forEach(c => distribution[c.price_level]++);
        
        const total = priceLevels.length;
        return {
            budget: Math.round((distribution[0] + distribution[1]) / total * 100) || 0,
            moderate: Math.round((distribution[2]) / total * 100) || 0,
            upscale: Math.round((distribution[3] + distribution[4]) / total * 100) || 0,
            averageLevel: total > 0 ? (priceLevels.reduce((sum, c) => sum + c.price_level, 0) / total).toFixed(1) : 'N/A'
        };
    },

    identifyMarketGaps(competitors, commerceType) {
        const gaps = [];
        
        // Price point gaps
        const priceDist = this.analyzePriceDistribution(competitors);
        if (priceDist.budget < 30) gaps.push('Budget-friendly options lacking');
        if (priceDist.upscale < 20) gaps.push('Premium market underserved');
        
        // Quality gaps
        const highQuality = competitors.filter(c => c.rating >= 4.5).length;
        if (highQuality < 2) gaps.push('High-quality service gap');
        
        // Service gaps based on commerce type
        const serviceGaps = {
            'restaurant': ['Delivery service', 'Late-night dining', 'Healthy options', 'Family dining'],
            'retail_store': ['Online presence', 'Personal shopping', 'Extended hours', 'Custom orders'],
            'beauty_salon': ['Online booking', 'Male grooming', 'Eco-friendly products', 'Group services']
        };
        
        if (serviceGaps[commerceType]) {
            gaps.push(...serviceGaps[commerceType].slice(0, 2));
        }
        
        return gaps.length > 0 ? gaps : ['Opportunity for differentiation exists'];
    },

    assessCompetitiveAdvantage(competitors, averageRating) {
        if (competitors.length === 0) return 'High - First mover advantage';
        if (competitors.length <= 2) return 'High - Limited competition';
        if (averageRating < 3.5) return 'Medium - Quality gap exists';
        if (competitors.length >= 8) return 'Low - Saturated market';
        return 'Medium - Balanced competitive environment';
    },

    calculateDemographicMultiplier(catchment, commerceType) {
        // Demographic preferences by commerce type
        const preferences = {
            'restaurant': {
                youngAdults: 1.3, // 18-35
                families: 1.1,    // 30-50
                seniors: 0.8,     // 60+
                highIncome: 1.2
            },
            'clothing_store': {
                youngAdults: 1.5,
                families: 1.0,
                seniors: 0.6,
                highIncome: 1.4
            },
            'pharmacy': {
                youngAdults: 0.8,
                families: 1.2,
                seniors: 1.6,
                highIncome: 0.9
            }
        };

        const prefs = preferences[commerceType] || {
            youngAdults: 1.0, families: 1.0, seniors: 1.0, highIncome: 1.0
        };

        // Calculate demographic composition
        const youngPct = (catchment.pourcentAge1529 + catchment.pourcentAge3044) / 100;
        const seniorsPct = catchment.pourcentAge60PL / 100;
        const familiesPct = (catchment.pourcentAge3044 + catchment.pourcentAge4559) / 100;
        
        // Income factor (simplified)
        const incomeFactor = (catchment.purchasePowerPerson || 25000) / 25000;
        const highIncomePct = Math.min(1, incomeFactor);

        // Calculate weighted multiplier
        const multiplier = 
            (youngPct * prefs.youngAdults) * 0.3 +
            (familiesPct * prefs.families) * 0.3 +
            (seniorsPct * prefs.seniors) * 0.2 +
            (highIncomePct * prefs.highIncome) * 0.2;

        return Math.max(0.5, Math.min(2.0, multiplier)); // Cap between 0.5 and 2.0
    },

    analyzeCustomerSegments(catchment, commerceType) {
        const segments = {};
        const total = catchment.totalPopulation;

        // Age segments
        segments.youngAdults = {
            population: Math.round((catchment.pourcentAge1529 + catchment.pourcentAge3044) / 100 * total),
            percentage: catchment.pourcentAge1529 + catchment.pourcentAge3044,
            relevance: this.getSegmentRelevance('youngAdults', commerceType)
        };

        segments.families = {
            population: Math.round(catchment.pourcentAge3044 / 100 * total),
            percentage: catchment.pourcentAge3044,
            relevance: this.getSegmentRelevance('families', commerceType)
        };

        segments.seniors = {
            population: Math.round(catchment.pourcentAge60PL / 100 * total),
            percentage: catchment.pourcentAge60PL,
            relevance: this.getSegmentRelevance('seniors', commerceType)
        };

        return segments;
    },

    getSegmentRelevance(segment, commerceType) {
        const relevanceMatrix = {
            'restaurant': { youngAdults: 'High', families: 'High', seniors: 'Medium' },
            'clothing_store': { youngAdults: 'Very High', families: 'High', seniors: 'Low' },
            'pharmacy': { youngAdults: 'Low', families: 'Medium', seniors: 'Very High' },
            'grocery_or_supermarket': { youngAdults: 'Medium', families: 'Very High', seniors: 'High' }
        };

        return relevanceMatrix[commerceType]?.[segment] || 'Medium';
    },

    calculateAcquisitionScore(potentialCustomers, totalPopulation, competitorCount) {
        if (totalPopulation === 0) return 50;
        
        const marketPenetration = (potentialCustomers / totalPopulation) * 100;
        const competitionPenalty = Math.min(30, competitorCount * 3);
        
        let score = marketPenetration * 3; // Base score
        score -= competitionPenalty; // Subtract competition penalty
        
        return Math.max(0, Math.min(100, Math.round(score)));
    },

    getTrafficGeneratorScore(types) {
        const scores = {
            'shopping_mall': 25,
            'department_store': 20,
            'supermarket': 15,
            'hospital': 20,
            'university': 18,
            'school': 12,
            'train_station': 22,
            'subway_station': 20,
            'bus_station': 10
        };

        return Math.max(...types.map(type => scores[type] || 5));
    },

    getTrafficLevel(score) {
        if (score >= 75) return 'Very High';
        if (score >= 50) return 'High';
        if (score >= 30) return 'Moderate';
        if (score >= 15) return 'Low';
        return 'Very Low';
    },

    getTrafficRecommendations(score, sources) {
        const recommendations = [];
        
        if (score < 30) {
            recommendations.push('Consider marketing to increase foot traffic');
            recommendations.push('Partner with nearby businesses for cross-promotion');
        }
        
        if (sources.length > 0) {
            recommendations.push(`Leverage proximity to ${sources[0].name} for visibility`);
        }
        
        if (score >= 70) {
            recommendations.push('Excellent foot traffic - focus on conversion');
        }

        return recommendations;
    },

    getOverallRating(score) {
        if (score >= 85) return 'Excellent';
        if (score >= 70) return 'Very Good';
        if (score >= 55) return 'Good';
        if (score >= 40) return 'Fair';
        if (score >= 25) return 'Poor';
        return 'Very Poor';
    },

    getInvestmentRecommendation(score) {
        if (score >= 80) return 'Strong Buy - Prime location with excellent potential';
        if (score >= 65) return 'Buy - Good location with solid fundamentals';
        if (score >= 50) return 'Hold/Consider - Moderate potential, requires analysis';
        if (score >= 35) return 'Avoid - Below average potential';
        return 'Strong Avoid - Poor investment opportunity';
    },

    calculateConfidenceLevel(analysisData) {
        // More data sources = higher confidence
        let dataPoints = 0;
        let totalPoints = 0;

        Object.values(analysisData).forEach(data => {
            if (data && typeof data === 'object' && data.totalScore !== undefined) {
                dataPoints++;
                totalPoints += data.totalScore;
            }
        });

        if (dataPoints === 0) return 'Low';
        
        const avgScore = totalPoints / dataPoints;
        const dataCompleteness = (dataPoints / 7) * 100; // Assuming 7 max data categories
        
        if (dataCompleteness >= 80 && avgScore >= 40) return 'High';
        if (dataCompleteness >= 60 && avgScore >= 30) return 'Medium';
        return 'Low';
    },

    calculateRiskLevel(score, analysisData) {
        let riskFactors = 0;
        
        if (analysisData.competition?.totalScore < 40) riskFactors++;
        if (analysisData.demographics?.totalScore < 30) riskFactors++;
        if (analysisData.accessibility?.totalScore < 30) riskFactors++;
        
        if (score < 40) riskFactors += 2;
        
        if (riskFactors >= 4) return 'Very High';
        if (riskFactors >= 3) return 'High';
        if (riskFactors >= 2) return 'Medium';
        if (riskFactors >= 1) return 'Low';
        return 'Very Low';
    },

    analyzeDemographicOpportunities(demographics) {
        const opportunities = [];
        
        if (demographics.pourcentAge1529 > 25) {
            opportunities.push({
                type: 'Demographic Opportunity',
                category: 'Young Adults',
                opportunity: 'High concentration of young adults - ideal for trendy retail/dining',
                potential: 'High',
                priority: 'high'
            });
        }
        
        if (demographics.purchasePowerPerson > 30000) {
            opportunities.push({
                type: 'Economic Opportunity',
                category: 'High Income',
                opportunity: 'Above-average purchasing power supports premium positioning',
                potential: 'High',
                priority: 'medium'
            });
        }
        
        return opportunities;
    },

    analyzeLocationOpportunities(places, selectedLocation) {
        const opportunities = [];
        
        // Check for anchor tenants
        const anchors = places.filter(p => 
            p.types && p.types.some(t => ['shopping_mall', 'supermarket', 'department_store'].includes(t))
        );
        
        if (anchors.length > 0) {
            opportunities.push({
                type: 'Location Opportunity',
                category: 'Anchor Tenants',
                opportunity: `Proximity to major retailers drives consistent foot traffic`,
                potential: 'High',
                priority: 'high'
            });
        }
        
        return opportunities;
    },

    identifyTrendOpportunities(places, catchmentData) {
        const opportunities = [];
        
        // Health & wellness trend
        const healthPlaces = places.filter(p => 
            p.types && p.types.some(t => ['gym', 'health', 'pharmacy'].includes(t))
        );
        
        if (healthPlaces.length < 3) {
            opportunities.push({
                type: 'Trend Opportunity',
                category: 'Health & Wellness',
                opportunity: 'Growing health consciousness with limited local options',
                potential: 'Medium',
                priority: 'medium'
            });
        }
        
        return opportunities;
    }
};

export default CommerceIntelligenceService;
