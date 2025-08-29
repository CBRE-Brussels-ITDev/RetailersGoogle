require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const XLSX = require('xlsx'); // Add xlsx for Excel export

const app = express();
const PORT = process.env.PORT || 8080; // Use port 8080 or environment variable

app.use(cors());
// Increase body parser limit to handle large payloads (map screenshots)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Move API key to environment variable for security
const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyA1r8V5FSaYFvmS8FwnGxA6DwXhnHUvHUc";

console.log('🔑 API Key loaded:', API_KEY ? 'Yes ✅' : 'No ❌');
console.log('🔑 API Key first 10 chars:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'Not found');

// Get place details by ID with comprehensive information
app.get('/google-maps/place/:id', async (req, res) => {
    const { id } = req.params;
    console.log('Received placeId:', id);

    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json`,
            {
                params: {
                    place_id: id,
                    fields: [
                        // Basic Information
                        'place_id', 'name', 'formatted_address', 'vicinity',
                        // Contact Information
                        'formatted_phone_number', 'international_phone_number', 'website', 'url',
                        // Location & Geography
                        'geometry', 'plus_code', 'utc_offset',
                        // Business Information
                        'business_status', 'opening_hours', 'current_opening_hours', 'secondary_opening_hours',
                        'price_level', 'rating', 'user_ratings_total', 'types',
                        // Media & Reviews
                        'photos', 'reviews',
                        // Additional Details
                        'wheelchair_accessible_entrance', 'delivery', 'dine_in', 'takeout',
                        'reservable', 'serves_beer', 'serves_breakfast', 'serves_brunch',
                        'serves_dinner', 'serves_lunch', 'serves_vegetarian_food', 'serves_wine',
                        // Address Components
                        'address_components', 'adr_address',
                        // Editorial Summary
                        'editorial_summary'
                    ].join(','),
                    key: API_KEY,
                },
            }
        );
        
        // Enhance the response with additional computed data
        const placeData = response.data.result;
        const enhancedData = {
            ...response.data,
            result: {
                ...placeData,
                // Add computed fields
                coordinates: placeData.geometry ? {
                    lat: placeData.geometry.location.lat,
                    lng: placeData.geometry.location.lng
                } : null,
                // Parse opening hours for better display
                opening_hours_parsed: placeData.opening_hours ? {
                    open_now: placeData.opening_hours.open_now,
                    periods: placeData.opening_hours.periods,
                    weekday_text: placeData.opening_hours.weekday_text
                } : null,
                // Categorize types
                primary_type: placeData.types ? placeData.types[0] : null,
                all_types: placeData.types || [],
                // Format photos URLs
                photo_urls: placeData.photos ? placeData.photos.map(photo => 
                    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${API_KEY}`
                ) : [],
                // Process reviews for better display
                formatted_reviews: placeData.reviews ? placeData.reviews.map(review => ({
                    ...review,
                    relative_time_description: review.relative_time_description,
                    formatted_time: new Date(review.time * 1000).toLocaleDateString(),
                    rating_stars: '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)
                })) : []
            }
        };
        
        res.json(enhancedData);
    } catch (error) {
        console.error('Error fetching place details:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Error fetching place details',
            details: error.message
        });
    }
});

// Enhanced endpoint to get places with flexible category options
app.post('/get-places-in-radius', async (req, res) => {
    const { lat, lng, radius, category, getAllSectors = false } = req.body;

    if (!lat || !lng || !radius) {
        return res.status(400).json({ 
            error: 'lat, lng, and radius are required',
            received: { lat, lng, radius, category, getAllSectors }
        });
    }

    try {
        let allPlaces = [];

        if (getAllSectors || category === 'all') {
            console.log('Fetching all sectors for location:', { lat, lng, radius });
            
            // Get all types of places by making multiple requests
            const commonTypes = [
                'restaurant', 'gas_station', 'bank', 'hospital', 'pharmacy',
                'grocery_or_supermarket', 'shopping_mall', 'school', 'park',
                'tourist_attraction', 'lodging', 'store', 'car_repair',
                'gym', 'beauty_salon', 'church', 'library', 'post_office',
                'bakery', 'bicycle_store', 'book_store', 'clothing_store',
                'convenience_store', 'department_store', 'drugstore',
                'electronics_store', 'florist', 'furniture_store',
                'hardware_store', 'home_goods_store', 'jewelry_store',
                'liquor_store', 'pet_store', 'shoe_store', 'supermarket'
            ];

            // Make requests for each type with delay to avoid rate limiting
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            
            for (let i = 0; i < commonTypes.length; i++) {
                const type = commonTypes[i];
                try {
                    console.log(`Fetching ${type} (${i + 1}/${commonTypes.length})`);
                    
                    // Get all pages of results for each type (no limit)
                    let allTypeResults = [];
                    let nextPageToken = null;
                    let pageCount = 0;
                    const maxPages = 3; // Google allows max 3 pages (60 results per type)
                    
                    do {
                        const params = {
                            location: `${lat},${lng}`,
                            radius,
                            type: type,
                            key: API_KEY,
                        };
                        
                        if (nextPageToken) {
                            params.pagetoken = nextPageToken;
                        }
                        
                        const response = await axios.get(
                            `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
                            { params }
                        );
                        
                        if (response.data.results) {
                            const placesWithType = response.data.results.map(place => ({
                                ...place,
                                search_type: type
                            }));
                            allTypeResults.push(...placesWithType);
                        }
                        
                        nextPageToken = response.data.next_page_token;
                        pageCount++;
                        
                        // Wait for next page token to become valid (required by Google)
                        if (nextPageToken && pageCount < maxPages) {
                            await delay(2000); // 2 second delay for next page token
                        }
                        
                    } while (nextPageToken && pageCount < maxPages);
                    
                    allPlaces.push(...allTypeResults);
                    console.log(`Found ${allTypeResults.length} places for ${type}`);
                    
                    // Add delay between different types
                    if (i < commonTypes.length - 1) {
                        await delay(200);
                    }
                } catch (error) {
                    console.error(`Error fetching ${type}:`, error.message);
                    // Continue with other types even if one fails
                }
            }

            // Remove duplicates based on place_id
            const uniquePlaces = allPlaces.filter((place, index, self) =>
                index === self.findIndex(p => p.place_id === place.place_id)
            );

            // Extract coordinates and create enhanced place data
            const placesWithCoords = uniquePlaces.map(place => ({
                place_id: place.place_id,
                name: place.name,
                rating: place.rating,
                user_ratings_total: place.user_ratings_total,
                types: place.types,
                search_type: place.search_type,
                coordinates: {
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng
                },
                vicinity: place.vicinity,
                price_level: place.price_level,
                business_status: place.business_status
            }));

            const placeIds = uniquePlaces.map(place => place.place_id);
            
            console.log(`Found ${uniquePlaces.length} unique places across ${commonTypes.length} categories`);
            
            res.json({ 
                placeIds,
                places: placesWithCoords,
                totalFound: uniquePlaces.length,
                searchTypes: commonTypes,
                searchParams: { lat, lng, radius, getAllSectors: true }
            });

        } else if (category) {
            console.log('Fetching single category:', category);
            
            // Single category search - get all pages
            let allCategoryResults = [];
            let nextPageToken = null;
            let pageCount = 0;
            const maxPages = 3; // Google allows max 3 pages
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            
            do {
                const params = {
                    location: `${lat},${lng}`,
                    radius,
                    type: category,
                    key: API_KEY,
                };
                
                if (nextPageToken) {
                    params.pagetoken = nextPageToken;
                }
                
                const response = await axios.get(
                    `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
                    { params }
                );
                
                if (response.data.results) {
                    allCategoryResults.push(...response.data.results);
                }
                
                nextPageToken = response.data.next_page_token;
                pageCount++;
                
                // Wait for next page token to become valid
                if (nextPageToken && pageCount < maxPages) {
                    await delay(2000);
                }
                
            } while (nextPageToken && pageCount < maxPages);

            // Extract coordinates and create enhanced place data
            const placesWithCoords = allCategoryResults.map(place => ({
                place_id: place.place_id,
                name: place.name,
                rating: place.rating,
                user_ratings_total: place.user_ratings_total,
                types: place.types,
                search_type: category,
                coordinates: {
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng
                },
                vicinity: place.vicinity,
                price_level: place.price_level,
                business_status: place.business_status
            }));

            const placeIds = allCategoryResults.map(place => place.place_id);
            
            console.log(`Found ${allCategoryResults.length} places for category ${category}`);
            
            res.json({ 
                placeIds,
                places: placesWithCoords,
                totalFound: allCategoryResults.length,
                searchParams: { lat, lng, radius, category }
            });
        } else {
            return res.status(400).json({ 
                error: 'Either category or getAllSectors=true is required',
                received: { category, getAllSectors }
            });
        }

    } catch (error) {
        console.error('Error fetching places:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Error fetching places',
            details: error.message 
        });
    }
});

// Enhanced catchment calculation endpoint
app.post('/calculate-catchment', async (req, res) => {
    const { location, travelMode, driveTimes, showDemographics } = req.body;

    if (!location || !location.lat || !location.lng || !driveTimes || !Array.isArray(driveTimes)) {
        return res.status(400).json({ 
            error: 'location (with lat/lng) and driveTimes array are required',
            received: { location, travelMode, driveTimes, showDemographics }
        });
    }

    // Limit to maximum 3 catchment areas
    const limitedDriveTimes = driveTimes.slice(0, 3);
    if (driveTimes.length > 3) {
        console.log(`Drive times limited from ${driveTimes.length} to 3 catchments`);
    }

    try {
        console.log('Calculating catchment for:', { location, travelMode, driveTimes: limitedDriveTimes });
        
        // Simulate processing time for realistic experience
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate enhanced catchment results (max 3)
        const catchmentResults = limitedDriveTimes.map((driveTime, index) => {
            // More sophisticated population calculation based on drive time and location
            const basePopulation = calculatePopulationForArea(location, driveTime, travelMode);
            const demographics = generateDemographicData(basePopulation, location);
            
            return {
                name: `${driveTime} minutes`,
                driveTime,
                travelMode,
                totalPopulation: basePopulation,
                ...demographics,
                // Generate more realistic geometry
                geometry: generateAdvancedCatchmentGeometry(location, driveTime, travelMode),
                // Add travel mode specific metadata
                metadata: {
                    calculatedAt: new Date().toISOString(),
                    averageSpeed: getAverageSpeed(travelMode),
                    accessibility: calculateAccessibility(travelMode, driveTime),
                    catchmentIndex: index // For color mapping
                }
            };
        });

        console.log(`Generated ${catchmentResults.length} catchment areas`);
        console.log('BACKEND: Catchment data structure:', JSON.stringify(catchmentResults, null, 2));
        
        res.json({ 
            catchmentResults,
            searchParams: { location, travelMode, driveTimes, showDemographics },
            calculationInfo: {
                method: 'drive_time_analysis',
                timestamp: new Date().toISOString(),
                totalAreas: catchmentResults.length
            }
        });

    } catch (error) {
        console.error('Error calculating catchment:', error);
        res.status(500).json({ 
            error: 'Error calculating catchment',
            details: error.message 
        });
    }
});

// Helper function to format numbers with dots (German style)
function numberWithDot(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Function to process catchment data like the original getGlobalsVariables
function getGlobalsVariables(currentCatchment) {
    let name = `${currentCatchment.number || currentCatchment.driveTime} minutes`;
    let totalPopulation = parseInt(currentCatchment.totalMale + currentCatchment.totalFemale);
    let pourcentWomen = parseFloat(((currentCatchment.totalFemale / totalPopulation) * 100).toFixed(0));
    let pourcentMan = parseFloat(((currentCatchment.totalMale / totalPopulation) * 100).toFixed(0));

    let pourcentAge0014 = parseFloat(((currentCatchment.totalAGE0014 / totalPopulation) * 100).toFixed(0));
    let pourcentAge1529 = parseFloat(((currentCatchment.totalAGE1529 / totalPopulation) * 100).toFixed(0));
    let pourcentAge3044 = parseFloat(((currentCatchment.totalAGE3044 / totalPopulation) * 100).toFixed(0));
    let pourcentAge4559 = parseFloat(((currentCatchment.totalAGE4559 / totalPopulation) * 100).toFixed(0));
    let pourcentAge60PL = parseFloat(((currentCatchment.totalAGE60PL / totalPopulation) * 100).toFixed(0));

    let householdsMember = numberWithDot(parseFloat((totalPopulation / currentCatchment.totalHH_T).toFixed(1)));
    let totalHouseHolds = numberWithDot(parseFloat(currentCatchment.totalHH_T.toFixed(0)));
    let totalMIO = new Intl.NumberFormat("de-DE").format(parseFloat(currentCatchment.totalPP_MIO.toFixed(0)));
    let purchasePowerPerson = numberWithDot(((currentCatchment.totalPP_MIO * 1000000) / totalPopulation).toFixed(0));

    const catchementData = {
        name,
        totalPopulation,
        pourcentMan,
        pourcentWomen,
        pourcentAge0014,
        pourcentAge1529,
        pourcentAge3044,
        pourcentAge4559,
        pourcentAge60PL,
        totalHouseHolds,
        householdsMember,
        totalMIO,
        purchasePowerPerson,
    };
    return catchementData;
}

// NEW: Commerce Analysis Report Generation endpoint
app.post('/generate-commerce-report', async (req, res) => {
    console.log('Commerce Report Generation endpoint called');
    
    const { 
        reportData, 
        commerceType, 
        location, 
        reportType = 'comprehensive',
        includeCharts = true 
    } = req.body;

    if (!reportData) {
        return res.status(400).json({ 
            error: 'Report data is required' 
        });
    }

    try {
        console.log('Generating commerce analysis report:', reportType);
        
        // Transform data for JSReport template
        const templateData = {
            // Basic Information
            reportTitle: `${commerceType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Location Analysis Report`,
            location: location || 'Selected Location',
            generatedDate: new Date().toLocaleDateString('en-GB'),
            
            // Executive Summary
            overallScore: reportData.finalRanking?.finalScore || 0,
            overallRating: reportData.finalRanking?.overallRating || 'N/A',
            recommendation: reportData.finalRanking?.investmentRecommendation || 'N/A',
            confidenceLevel: reportData.finalRanking?.confidenceLevel || 'Medium',
            
            // Key Metrics
            keyMetrics: reportData.executiveSummary?.keyMetrics || {},
            
            // Market Analysis
            marketSaturation: reportData.marketSaturation ? {
                saturationIndex: reportData.marketSaturation.saturationIndex,
                level: reportData.marketSaturation.level,
                competitorCount: reportData.marketSaturation.competitorCount,
                density: reportData.marketSaturation.density
            } : null,
            
            // Competition Analysis
            competition: reportData.competitorAnalysis ? {
                averageRating: reportData.competitorAnalysis.averageRating,
                competitiveAdvantage: reportData.competitorAnalysis.competitiveAdvantage,
                topCompetitors: reportData.competitorAnalysis.topRatedCompetitors?.slice(0, 5) || [],
                marketGaps: reportData.competitorAnalysis.competitorGaps?.slice(0, 3) || []
            } : null,
            
            // Customer Potential
            customerPotential: reportData.customerPotential ? {
                potentialCustomers: reportData.customerPotential.potentialCustomers,
                monthlyRevenue: reportData.customerPotential.monthlyRevenuePotential,
                annualRevenue: reportData.customerPotential.annualRevenuePotential,
                acquisitionScore: reportData.customerPotential.acquisitionScore
            } : null,
            
            // ROI Projections
            roiProjections: reportData.roiProjections && !reportData.roiProjections.error ? {
                paybackPeriod: reportData.roiProjections.paybackPeriod,
                firstYearROI: reportData.roiProjections.firstYearROI,
                breakEvenMonths: reportData.roiProjections.breakEvenMonths,
                projections: reportData.roiProjections.projections?.slice(0, 5) || []
            } : null,
            
            // Foot Traffic
            footTraffic: reportData.footTraffic ? {
                score: reportData.footTraffic.footTrafficScore,
                level: reportData.footTraffic.level,
                topSources: reportData.footTraffic.trafficSources?.slice(0, 3) || []
            } : null,
            
            // Opportunities
            opportunities: reportData.opportunities?.slice(0, 6) || [],
            
            // Executive Summary Content
            highlights: reportData.executiveSummary?.highlights || [],
            concerns: reportData.executiveSummary?.concerns || [],
            nextSteps: reportData.executiveSummary?.nextSteps || []
        };

        // Prepare JSReport request
        const jsReportData = {
            template: { shortid: "commerce-analysis-template" }, // Would need to create this template
            data: templateData
        };

        console.log('Sending commerce report request to JSReport');
        
        // For now, generate a simple PDF with the available catchment template
        // In production, you would create a specific commerce analysis template
        const fallbackData = {
            template: { shortid: "4HTixpM" }, // Using existing catchment template as fallback
            data: {
                date: templateData.generatedDate,
                url: "https://via.placeholder.com/800x400/007bff/ffffff?text=Commerce+Analysis+Location",
                defaultBreaks: [{
                    name: `${commerceType} Analysis`,
                    totalPopulation: templateData.customerPotential?.potentialCustomers || 1000,
                    pourcentMan: 49,
                    pourcentWomen: 51,
                    pourcentAge0014: 15,
                    pourcentAge1529: 20,
                    pourcentAge3044: 25,
                    pourcentAge4559: 22,
                    pourcentAge60PL: 18,
                    totalHouseHolds: Math.floor((templateData.customerPotential?.potentialCustomers || 1000) / 2.3),
                    householdsMember: 2.3,
                    totalMIO: templateData.customerPotential?.annualRevenue ? (templateData.customerPotential.annualRevenue / 1000000) : 2.5,
                    purchasePowerPerson: "25000"
                }]
            }
        };

        const response = await axios.post("https://cbrereport.jsreportonline.net/api/report", fallbackData, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic YmUtaXRkZXZAY2JyZS5jb206V2F0ZXJsb28xNio=`,
            },
            responseType: 'arraybuffer',
            timeout: 30000
        });

        if (response.status !== 200) {
            throw new Error(`JSReport error! status: ${response.status}`);
        }

        // Set response headers for PDF download
        const filename = `CBRE_Commerce_Analysis_${commerceType}_${new Date().toISOString().slice(0, 10)}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Send the PDF data
        res.send(Buffer.from(response.data));
        
        console.log('Commerce analysis PDF generated successfully');
        
    } catch (error) {
        console.error('Error generating commerce analysis PDF:', error.message);
        res.status(500).json({ 
            error: 'Error generating commerce analysis report',
            details: error.message
        });
    }
});

// NEW: JSReport PDF Generation endpoint
app.post('/generate-catchment-report', async (req, res) => {
    console.log('PDF Generation endpoint called');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { catchmentData, address, imageUrl, timestamp, timeOfDay } = req.body;

    if (!catchmentData || !Array.isArray(catchmentData) || catchmentData.length === 0) {
        console.log('Invalid catchmentData:', catchmentData);
        return res.status(400).json({ 
            error: 'catchmentData array is required and must not be empty' 
        });
    }

    try {
        console.log('Generating PDF using JSReport for catchment data:', catchmentData.length, 'areas');
        console.log('Sample catchment area data:', JSON.stringify(catchmentData[0], null, 2));
        
        // Transform catchment data to match the expected JSReport structure
        const defaultBreaks = catchmentData.map((area, index) => {
            console.log(`Processing area ${index}:`, JSON.stringify(area, null, 2));
            
            // Ensure we have all required fields with proper defaults
            const totalPopulation = area.totalPopulation || 0;
            const pourcentMan = area.pourcentMan || 49;
            const pourcentWomen = area.pourcentWomen || 51;
            const pourcentAge0014 = area.pourcentAge0014 || 14;
            const pourcentAge1529 = area.pourcentAge1529 || 17;
            const pourcentAge3044 = area.pourcentAge3044 || 18;
            const pourcentAge4559 = area.pourcentAge4559 || 22; // Add missing age group
            const pourcentAge60PL = area.pourcentAge60PL || 28;
            const totalHouseHolds = area.totalHouseHolds || Math.floor(totalPopulation / 2.3);
            const householdsMember = parseFloat(area.householdsMember) || 2.3;
            const totalMIO = area.totalMIO || ((area.purchasePowerPerson || 21621) * totalPopulation) / 1000000;
            const purchasePowerPerson = area.purchasePowerPerson || 21621;

            const processedBreak = {
                name: `${area.driveTime || area.number || 15} minutes`,
                totalPopulation: totalPopulation,
                pourcentMan: Math.round(pourcentMan),
                pourcentWomen: Math.round(pourcentWomen),
                pourcentAge0014: Math.round(pourcentAge0014),
                pourcentAge1529: Math.round(pourcentAge1529),
                pourcentAge3044: Math.round(pourcentAge3044),
                pourcentAge4559: Math.round(pourcentAge4559), // Include the missing age group
                pourcentAge60PL: Math.round(pourcentAge60PL),
                totalHouseHolds: totalHouseHolds,
                householdsMember: householdsMember,
                totalMIO: totalMIO,
                purchasePowerPerson: purchasePowerPerson.toString()
            };
            
            console.log(`Processed break ${index}:`, JSON.stringify(processedBreak, null, 2));
            return processedBreak;
        });

        // Format the date properly
        const formattedDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Prepare request body for JSReport with exact structure
        const requestBody = {
            template: { shortid: "4HTixpM" },
            data: {
                date: formattedDate, // Format: "15/09/2022"
                url: imageUrl || "https://media.wired.com/photos/59269cd37034dc5f91bec0f1/191:100/w_1280,c_limit/GoogleMapTA.jpg", // Map image URL
                defaultBreaks: defaultBreaks
            }
        };

        console.log('Sending request to JSReport with structured data:', JSON.stringify(requestBody, null, 2));

        // Make request to JSReport Online
        const response = await axios.post("https://cbrereport.jsreportonline.net/api/report", requestBody, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic YmUtaXRkZXZAY2JyZS5jb206V2F0ZXJsb28xNio=`,
            },
            responseType: 'arraybuffer',
            timeout: 30000 // 30 second timeout
        });

        if (response.status !== 200) {
            throw new Error(`JSReport error! status: ${response.status}`);
        }

        // Set response headers for PDF download
        const filename = `CBRE_CATCHMENT_${new Date().toISOString().slice(0, 10)}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Send the PDF data
        res.send(Buffer.from(response.data));
        
        console.log('PDF generated successfully using JSReport');
        
    } catch (error) {
        console.error('Error generating PDF with JSReport:');
        console.error('Error message:', error.message);
        console.error('Error response:', error.response?.data?.toString() || 'No response data');
        console.error('Error status:', error.response?.status || 'No status');
        
        res.status(500).json({ 
            error: 'Error generating PDF report',
            details: error.message,
            jsreportError: error.response?.data?.toString() || null
        });
    }
});

// Enhanced Excel export endpoint for places data with detailed commerce analysis
app.post('/export-places-excel', async (req, res) => {
    const { places, searchParams } = req.body;

    if (!places || !Array.isArray(places) || places.length === 0) {
        return res.status(400).json({ 
            error: 'Places array is required and must not be empty' 
        });
    }

    try {
        console.log('Exporting comprehensive analysis to Excel:', places.length, 'places');
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // 1. EXECUTIVE SUMMARY SHEET
        const executiveSummary = [
            ['🏆 COMMERCE LOCATION ANALYSIS - EXECUTIVE SUMMARY'],
            [''],
            ['Analysis Date:', new Date().toISOString().slice(0, 19).replace('T', ' ')],
            ['Location:', searchParams?.location ? `${searchParams.location.lat?.toFixed(6)}, ${searchParams.location.lng?.toFixed(6)}` : 'N/A'],
            ['Search Radius:', searchParams?.radius ? `${searchParams.radius}m` : 'N/A'],
            ['Category Filter:', searchParams?.category || (searchParams?.getAllSectors ? 'All Sectors' : 'N/A')],
            ['Total Places Analyzed:', places.length],
            [''],
            ['🎯 KEY FINDINGS'],
            ['High-Rating Places (4.0+):', places.filter(p => p.rating >= 4.0).length],
            ['Medium-Rating Places (3.0-3.9):', places.filter(p => p.rating >= 3.0 && p.rating < 4.0).length],
            ['Lower-Rating Places (<3.0):', places.filter(p => p.rating < 3.0).length],
            ['Places with Price Info:', places.filter(p => p.price_level != null).length],
            ['Premium Price Level ($$$$):', places.filter(p => p.price_level === 4).length],
            ['Mid-Range Price Level ($$-$$$):', places.filter(p => p.price_level === 2 || p.price_level === 3).length],
            ['Budget Price Level ($):', places.filter(p => p.price_level === 1).length],
            [''],
            ['📊 MARKET OVERVIEW'],
            ['Average Rating:', places.length > 0 ? (places.reduce((sum, p) => sum + (p.rating || 0), 0) / places.filter(p => p.rating).length).toFixed(2) : 'N/A'],
            ['Total Customer Reviews:', places.reduce((sum, p) => sum + (p.user_ratings_total || 0), 0)],
            ['Most Common Category:', getMostCommonCategory(places)],
            ['Currently Open Places:', places.filter(p => p.business_status === 'OPERATIONAL' || p.opening_hours?.open_now).length],
            [''],
            ['💡 RECOMMENDATIONS'],
            ['• Focus on areas with high-rating competitors for quality benchmarking'],
            ['• Consider locations with moderate competition for better market entry'],
            ['• Analyze price levels to position your business competitively'],
            ['• Review customer feedback patterns for service improvement opportunities']
        ];
        
        const summarySheet = XLSX.utils.aoa_to_sheet(executiveSummary);
        summarySheet['!cols'] = [{ width: 25 }, { width: 35 }];
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Executive Summary');
        
        // 2. DETAILED PLACES DATA SHEET
        const placesData = places.map((place, index) => ({
            'Rank': index + 1,
            'Place ID': place.place_id || '',
            'Business Name': place.name || '',
            'Primary Category': getPrimaryCategory(place.types || []),
            'All Categories': Array.isArray(place.types) ? place.types.join(', ') : '',
            'Rating': place.rating || 'N/A',
            'Total Reviews': place.user_ratings_total || 0,
            'Price Level': place.price_level ? '$'.repeat(place.price_level) : 'N/A',
            'Price Range': getPriceRange(place.price_level),
            'Business Status': place.business_status || 'N/A',
            'Currently Open': place.opening_hours?.open_now ? 'Yes' : 'No',
            'Phone': place.formatted_phone_number || 'N/A',
            'Website': place.website || 'N/A',
            'Address': place.formatted_address || place.vicinity || '',
            'Latitude': place.geometry?.location?.lat || place.coordinates?.lat || '',
            'Longitude': place.geometry?.location?.lng || place.coordinates?.lng || '',
            'Distance from Center': place.distance ? `${place.distance}m` : 'N/A'
        }));

        const placesSheet = XLSX.utils.json_to_sheet(placesData);
        placesSheet['!cols'] = [
            {wch: 6}, {wch: 25}, {wch: 30}, {wch: 20}, {wch: 25}, 
            {wch: 8}, {wch: 12}, {wch: 12}, {wch: 15}, {wch: 15}, 
            {wch: 12}, {wch: 15}, {wch: 25}, {wch: 40}, {wch: 12}, 
            {wch: 12}, {wch: 15}
        ];
        XLSX.utils.book_append_sheet(wb, placesSheet, 'Detailed Places Data');

        // 3. MARKET ANALYSIS SHEET
        const categoryAnalysis = analyzeCategoriesDistribution(places);
        const marketData = [
            ['📊 MARKET ANALYSIS BY CATEGORY'],
            [''],
            ['Category', 'Count', 'Percentage', 'Avg Rating', 'Avg Reviews', 'Price Range', 'Market Density'],
            ...categoryAnalysis.map(cat => [
                cat.category,
                cat.count,
                `${cat.percentage.toFixed(1)}%`,
                cat.avgRating.toFixed(1),
                Math.round(cat.avgReviews),
                cat.priceRange,
                cat.density
            ]),
            [''],
            ['📈 RATING DISTRIBUTION'],
            ['Rating Range', 'Count', 'Percentage'],
            ['5.0 Stars', places.filter(p => p.rating === 5.0).length, `${(places.filter(p => p.rating === 5.0).length / places.length * 100).toFixed(1)}%`],
            ['4.0 - 4.9 Stars', places.filter(p => p.rating >= 4.0 && p.rating < 5.0).length, `${(places.filter(p => p.rating >= 4.0 && p.rating < 5.0).length / places.length * 100).toFixed(1)}%`],
            ['3.0 - 3.9 Stars', places.filter(p => p.rating >= 3.0 && p.rating < 4.0).length, `${(places.filter(p => p.rating >= 3.0 && p.rating < 4.0).length / places.length * 100).toFixed(1)}%`],
            ['2.0 - 2.9 Stars', places.filter(p => p.rating >= 2.0 && p.rating < 3.0).length, `${(places.filter(p => p.rating >= 2.0 && p.rating < 3.0).length / places.length * 100).toFixed(1)}%`],
            ['Below 2.0 Stars', places.filter(p => p.rating < 2.0).length, `${(places.filter(p => p.rating < 2.0).length / places.length * 100).toFixed(1)}%`]
        ];

        const marketSheet = XLSX.utils.aoa_to_sheet(marketData);
        marketSheet['!cols'] = [
            {wch: 25}, {wch: 8}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 15}, {wch: 15}
        ];
        XLSX.utils.book_append_sheet(wb, marketSheet, 'Market Analysis');

        // 4. COMPETITION INTELLIGENCE SHEET
        const competitionData = [
            ['🎯 COMPETITION INTELLIGENCE'],
            [''],
            ['Business Name', 'Category', 'Rating', 'Reviews', 'Price', 'Competitive Strength', 'Market Position', 'Customer Satisfaction']
        ];

        places.forEach(place => {
            const competitiveStrength = calculateCompetitiveStrength(place);
            const marketPosition = determineMarketPosition(place, places);
            const customerSatisfaction = assessCustomerSatisfaction(place);

            competitionData.push([
                place.name || 'N/A',
                getPrimaryCategory(place.types || []),
                place.rating || 'N/A',
                place.user_ratings_total || 0,
                place.price_level ? '$'.repeat(place.price_level) : 'N/A',
                competitiveStrength,
                marketPosition,
                customerSatisfaction
            ]);
        });

        const competitionSheet = XLSX.utils.aoa_to_sheet(competitionData);
        competitionSheet['!cols'] = [
            {wch: 30}, {wch: 20}, {wch: 8}, {wch: 10}, {wch: 8}, {wch: 18}, {wch: 15}, {wch: 20}
        ];
        XLSX.utils.book_append_sheet(wb, competitionSheet, 'Competition Intelligence');

        // 5. LOCATION INSIGHTS SHEET
        const locationData = [
            ['📍 LOCATION INSIGHTS & PATTERNS'],
            [''],
            ['Business Name', 'Address', 'Coordinate Cluster', 'Accessibility Score', 'Visibility Potential', 'Area Characteristics']
        ];

        places.forEach(place => {
            const lat = place.geometry?.location?.lat || place.coordinates?.lat || 0;
            const lng = place.geometry?.location?.lng || place.coordinates?.lng || 0;
            
            locationData.push([
                place.name || 'N/A',
                place.formatted_address || place.vicinity || 'N/A',
                getCoordinateCluster(lat, lng),
                calculateAccessibilityScore(place),
                assessVisibilityPotential(place),
                determineAreaCharacteristics(place.types || [])
            ]);
        });

        const locationSheet = XLSX.utils.aoa_to_sheet(locationData);
        locationSheet['!cols'] = [
            {wch: 30}, {wch: 40}, {wch: 20}, {wch: 18}, {wch: 18}, {wch: 25}
        ];
        XLSX.utils.book_append_sheet(wb, locationSheet, 'Location Insights');

        // 6. FINANCIAL PROJECTIONS SHEET
        const financialData = [
            ['💰 BUSINESS OPPORTUNITY ASSESSMENT'],
            [''],
            ['Business Name', 'Market Tier', 'Revenue Potential', 'Competition Level', 'Investment Risk', 'ROI Estimate', 'Market Entry Difficulty']
        ];

        places.forEach(place => {
            const marketTier = determineMarketTier(place);
            const revenuePotential = estimateRevenuePotential(place);
            const competitionLevel = assessCompetitionLevel(place, places);
            const investmentRisk = calculateInvestmentRisk(place);
            const roiEstimate = estimateROI(place);
            const entryDifficulty = assessMarketEntryDifficulty(place, places);

            financialData.push([
                place.name || 'N/A',
                marketTier,
                revenuePotential,
                competitionLevel,
                investmentRisk,
                roiEstimate,
                entryDifficulty
            ]);
        });

        const financialSheet = XLSX.utils.aoa_to_sheet(financialData);
        financialSheet['!cols'] = [
            {wch: 30}, {wch: 12}, {wch: 18}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 20}
        ];
        XLSX.utils.book_append_sheet(wb, financialSheet, 'Business Opportunities');

        // 7. SEARCH PARAMETERS SHEET
        const searchData = [{
            'Export Date': new Date().toISOString().slice(0, 19).replace('T', ' '),
            'Search Location (Lat)': searchParams?.location?.lat || searchParams?.lat || 'N/A',
            'Search Location (Lng)': searchParams?.location?.lng || searchParams?.lng || 'N/A',
            'Search Radius (meters)': searchParams?.radius || 'N/A',
            'Category Filter': searchParams?.category || (searchParams?.getAllSectors ? 'All Sectors' : 'N/A'),
            'Total Places Found': places.length,
            'Data Source': 'Google Places API',
            'Analysis Type': 'Comprehensive Commerce Analysis',
            'Report Version': '2.0',
            'Generated By': 'CBRE Commerce Intelligence Platform'
        }];
        
        const searchSheet = XLSX.utils.json_to_sheet(searchData);
        searchSheet['!cols'] = [{wch: 25}, {wch: 25}];
        XLSX.utils.book_append_sheet(wb, searchSheet, 'Search Parameters');

        // Generate Excel file
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        // Set response headers
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `CBRE_Commerce_Intelligence_${timestamp}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Send the Excel file
        res.send(excelBuffer);
        
        console.log('Comprehensive Excel analysis generated successfully');
        
    } catch (error) {
        console.error('Error generating comprehensive Excel analysis:', error.message);
        res.status(500).json({ 
            error: 'Error generating Excel analysis',
            details: error.message 
        });
    }
});

// Helper functions for enhanced Excel analysis
function getMostCommonCategory(places) {
    const categories = {};
    places.forEach(place => {
        if (place.types && Array.isArray(place.types)) {
            place.types.forEach(type => {
                categories[type] = (categories[type] || 0) + 1;
            });
        }
    });
    
    const mostCommon = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    return mostCommon ? mostCommon[0].replace(/_/g, ' ') : 'N/A';
}

function getPrimaryCategory(types) {
    if (!Array.isArray(types) || types.length === 0) return 'N/A';
    
    // Priority order for business categories
    const priorityTypes = ['restaurant', 'store', 'shopping_mall', 'gas_station', 'bank', 'hospital', 'pharmacy', 'school'];
    
    for (const priority of priorityTypes) {
        if (types.includes(priority)) {
            return priority.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    }
    
    return types[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getPriceRange(priceLevel) {
    const ranges = {
        1: 'Budget ($)',
        2: 'Mid-Range ($$)',
        3: 'Expensive ($$$)',
        4: 'Very Expensive ($$$$)'
    };
    return ranges[priceLevel] || 'N/A';
}

function analyzeCategoriesDistribution(places) {
    const categories = {};
    
    places.forEach(place => {
        const primary = getPrimaryCategory(place.types || []);
        if (!categories[primary]) {
            categories[primary] = {
                count: 0,
                ratings: [],
                reviews: [],
                prices: []
            };
        }
        
        categories[primary].count++;
        if (place.rating) categories[primary].ratings.push(place.rating);
        if (place.user_ratings_total) categories[primary].reviews.push(place.user_ratings_total);
        if (place.price_level) categories[primary].prices.push(place.price_level);
    });
    
    return Object.entries(categories).map(([category, data]) => ({
        category,
        count: data.count,
        percentage: (data.count / places.length) * 100,
        avgRating: data.ratings.length > 0 ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length : 0,
        avgReviews: data.reviews.length > 0 ? data.reviews.reduce((a, b) => a + b, 0) / data.reviews.length : 0,
        priceRange: data.prices.length > 0 ? `$${Math.min(...data.prices)}-$${Math.max(...data.prices)}` : 'N/A',
        density: data.count > places.length * 0.1 ? 'High' : data.count > places.length * 0.05 ? 'Medium' : 'Low'
    })).sort((a, b) => b.count - a.count);
}

function calculateCompetitiveStrength(place) {
    const rating = place.rating || 0;
    const reviews = place.user_ratings_total || 0;
    
    let score = 0;
    if (rating >= 4.5) score += 30;
    else if (rating >= 4.0) score += 20;
    else if (rating >= 3.5) score += 10;
    
    if (reviews >= 1000) score += 30;
    else if (reviews >= 500) score += 20;
    else if (reviews >= 100) score += 10;
    
    if (place.price_level >= 3) score += 20; // Premium pricing can indicate strong brand
    if (place.business_status === 'OPERATIONAL') score += 20;
    
    if (score >= 70) return 'Very Strong';
    if (score >= 50) return 'Strong';
    if (score >= 30) return 'Moderate';
    return 'Weak';
}

function determineMarketPosition(place, allPlaces) {
    const rating = place.rating || 0;
    const avgRating = allPlaces.reduce((sum, p) => sum + (p.rating || 0), 0) / allPlaces.filter(p => p.rating).length;
    
    if (rating > avgRating + 0.5) return 'Market Leader';
    if (rating > avgRating) return 'Above Average';
    if (rating === avgRating) return 'Average';
    return 'Below Average';
}

function assessCustomerSatisfaction(place) {
    const rating = place.rating || 0;
    const reviews = place.user_ratings_total || 0;
    
    if (rating >= 4.5 && reviews >= 100) return 'Excellent';
    if (rating >= 4.0 && reviews >= 50) return 'Good';
    if (rating >= 3.5) return 'Fair';
    return 'Poor';
}

function getCoordinateCluster(lat, lng) {
    // Simple clustering based on coordinate ranges
    const latCluster = Math.floor(lat * 100) / 100;
    const lngCluster = Math.floor(lng * 100) / 100;
    return `Cluster_${latCluster}_${lngCluster}`;
}

function calculateAccessibilityScore(place) {
    let score = 5; // Base score
    
    if (place.types && place.types.includes('transit_station')) score += 2;
    if (place.vicinity && place.vicinity.includes('Street')) score += 1;
    
    return `${score}/10`;
}

function assessVisibilityPotential(place) {
    const types = place.types || [];
    
    if (types.includes('shopping_mall') || types.includes('store')) return 'High';
    if (types.includes('restaurant') || types.includes('gas_station')) return 'Medium';
    return 'Standard';
}

function determineAreaCharacteristics(types) {
    if (types.includes('shopping_mall')) return 'Commercial Hub';
    if (types.includes('hospital') || types.includes('school')) return 'Service District';
    if (types.includes('restaurant') || types.includes('cafe')) return 'Dining District';
    if (types.includes('bank') || types.includes('store')) return 'Business District';
    return 'Mixed Use';
}

function determineMarketTier(place) {
    const rating = place.rating || 0;
    const price = place.price_level || 1;
    
    if (rating >= 4.5 && price >= 3) return 'Premium';
    if (rating >= 4.0 && price >= 2) return 'High';
    if (rating >= 3.5) return 'Mid';
    return 'Budget';
}

function estimateRevenuePotential(place) {
    const rating = place.rating || 0;
    const reviews = place.user_ratings_total || 0;
    const price = place.price_level || 1;
    
    const score = (rating * 20) + (Math.min(reviews / 10, 50)) + (price * 10);
    
    if (score >= 120) return 'Very High';
    if (score >= 90) return 'High';
    if (score >= 60) return 'Medium';
    return 'Low';
}

function assessCompetitionLevel(place, allPlaces) {
    const similarPlaces = allPlaces.filter(p => 
        p.types && place.types && 
        p.types.some(type => place.types.includes(type))
    );
    
    const ratio = similarPlaces.length / allPlaces.length;
    
    if (ratio > 0.3) return 'High';
    if (ratio > 0.15) return 'Medium';
    return 'Low';
}

function calculateInvestmentRisk(place) {
    const rating = place.rating || 0;
    const reviews = place.user_ratings_total || 0;
    
    let riskScore = 0;
    
    if (rating < 3.5) riskScore += 3;
    if (reviews < 50) riskScore += 2;
    if (place.business_status !== 'OPERATIONAL') riskScore += 3;
    
    if (riskScore >= 6) return 'High Risk';
    if (riskScore >= 3) return 'Medium Risk';
    return 'Low Risk';
}

function estimateROI(place) {
    const rating = place.rating || 0;
    const reviews = place.user_ratings_total || 0;
    const price = place.price_level || 1;
    
    // Simple ROI estimation based on performance indicators
    const baseROI = 15; // Base ROI percentage
    let modifier = 0;
    
    if (rating >= 4.5) modifier += 5;
    if (reviews >= 500) modifier += 3;
    if (price >= 3) modifier += 2;
    
    const estimatedROI = baseROI + modifier;
    return `${estimatedROI}% annually`;
}

function assessMarketEntryDifficulty(place, allPlaces) {
    const competition = assessCompetitionLevel(place, allPlaces);
    const strength = calculateCompetitiveStrength(place);
    
    if (competition === 'High' && strength === 'Very Strong') return 'Very Difficult';
    if (competition === 'High') return 'Difficult';
    if (competition === 'Medium') return 'Moderate';
    return 'Easy';
}

// Excel export endpoint for catchment data
app.post('/export-catchment-excel', async (req, res) => {
    const { catchmentData, selectedLocation, placesData } = req.body;

    if (!catchmentData || !Array.isArray(catchmentData) || catchmentData.length === 0) {
        return res.status(400).json({ 
            error: 'Catchment data array is required and must not be empty' 
        });
    }

    try {
        console.log('Exporting catchment data to Excel:', catchmentData.length, 'areas');
        console.log('Places data received:', placesData ? placesData.length : 'null', 'places');
        
        // Function to check if a point is within a catchment polygon
        const isPointInCatchment = (point, catchmentGeometry) => {
            if (!catchmentGeometry || !catchmentGeometry.coordinates || !catchmentGeometry.coordinates[0]) {
                return false;
            }
            
            const polygon = catchmentGeometry.coordinates[0];
            const x = point.lng;
            const y = point.lat;
            
            let inside = false;
            for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                const xi = polygon[i][0], yi = polygon[i][1];
                const xj = polygon[j][0], yj = polygon[j][1];
                
                if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                    inside = !inside;
                }
            }
            return inside;
        };

        // Function to get layer features within catchment (NO GOOGLE PLACES - ONLY LAYER DATA)
        const getLayerFeaturesInCatchment = async (catchmentArea, catchmentIndex) => {
            console.log('Processing catchment for layer features:', catchmentArea.driveTime, 'minutes (index:', catchmentIndex + ')');
            
            // Calculate the estimated radius for this specific catchment
            const estimatedRadius = (catchmentArea.driveTime / 60) * getAverageSpeed(catchmentArea.travelMode || 'driving') * 1000;
            console.log(`Catchment ${catchmentArea.driveTime}min - Estimated radius:`, Math.round(estimatedRadius), 'meters');
            
            // Generate mock layer features within the catchment area
            // This simulates features from an ArcGIS layer with MICROCODE and NAME fields
            const generateLayerFeatures = (centerLat, centerLng, radiusMeters, catchmentTime) => {
                // Base microcodes for different areas - simulate real geographic sectors
                const baseMicrocodes = [
                    'BE015292', 'BE015294', 'BE015296', 'BE015298', 'BE015300',
                    'BE015302', 'BE015304', 'BE015306', 'BE015308', 'BE015310',
                    'BE015312', 'BE015314', 'BE015316', 'BE015318', 'BE015320',
                    'BE015322', 'BE015324', 'BE015326', 'BE015328', 'BE015330'
                ];
                
                // Base sector names corresponding to microcodes
                const baseSectorNames = [
                    'Brussels Central', 'Brussels North', 'Brussels East', 'Brussels South', 'Antwerp Center',
                    'Antwerp Port', 'Ghent Historic', 'Ghent Industrial', 'Bruges Old Town', 'Bruges West',
                    'Leuven University', 'Leuven Industrial', 'Mechelen Center', 'Mechelen South', 'Hasselt Center',
                    'Hasselt East', 'Mons Center', 'Mons Industrial', 'Namur Center', 'Namur South'
                ];
                
                const features = [];
                
                // Number of features increases with catchment radius
                const featureCount = Math.floor((radiusMeters / 1000) * 0.8) + Math.floor(catchmentTime / 5);
                const maxFeatures = Math.min(featureCount, baseMicrocodes.length);
                
                for (let i = 0; i < maxFeatures; i++) {
                    // Generate random coordinates within the radius
                    const angle = Math.random() * 2 * Math.PI;
                    const distance = Math.random() * radiusMeters;
                    
                    // Convert to lat/lng offset
                    const deltaLat = (distance * Math.cos(angle)) / 111000; // Rough conversion
                    const deltaLng = (distance * Math.sin(angle)) / (111000 * Math.cos(centerLat * Math.PI / 180));
                    
                    const featureLat = centerLat + deltaLat;
                    const featureLng = centerLng + deltaLng;
                    
                    features.push({
                        microcode: baseMicrocodes[i],
                        name: baseSectorNames[i],
                        coordinates: {
                            lat: featureLat,
                            lng: featureLng
                        },
                        // Add some additional layer attributes
                        objectid: 1000 + i,
                        ctrycode: 'BE',
                        area_km2: Math.round((Math.random() * 5 + 1) * 100) / 100,
                        population: Math.floor(Math.random() * 10000 + 1000)
                    });
                }
                
                return features;
            };
            
            const layerFeatures = generateLayerFeatures(
                selectedLocation.lat, 
                selectedLocation.lng, 
                estimatedRadius, 
                catchmentArea.driveTime
            );
            
            console.log(`Generated ${layerFeatures.length} layer features for ${catchmentArea.driveTime}min catchment`);
            console.log('Sample features:', layerFeatures.slice(0, 3).map(f => ({
                microcode: f.microcode,
                name: f.name
            })));
            
            // Extract microcodes and names for Excel export
            const microcodes = layerFeatures.map(feature => feature.microcode);
            const sectorNames = layerFeatures.map(feature => feature.name);
            
            console.log(`Catchment ${catchmentArea.driveTime}min: Found ${layerFeatures.length} layer features`);
            console.log('Microcodes:', microcodes.slice(0, 5));
            console.log('Sector Names:', sectorNames.slice(0, 5));
            
            return { 
                // Return microcodes instead of Google Place IDs
                sectorIds: microcodes.join(', '),
                sectorNames: sectorNames.join(', '),
                layerFeatures: layerFeatures // Return the actual layer features for analysis
            };
        };
        
        // Prepare catchment summary data with layer feature information and geographic data
        const summaryData = [];
        const allCatchmentFeatures = []; // Store all layer features for sector analysis sheet
        
        for (let i = 0; i < catchmentData.length; i++) {
            const area = catchmentData[i];
            console.log(`Processing summary for catchment ${i}:`, area.driveTime, 'minutes');
            const layerInfo = await getLayerFeaturesInCatchment(area, i);
            console.log('Layer info for catchment:', {
                microcodes: layerInfo.sectorIds.split(', ').length,
                sectorNames: layerInfo.sectorNames.split(', ').length,
                featuresCount: layerInfo.layerFeatures?.length || 0
            });
            
            // Store layer features for sector analysis
            if (layerInfo.layerFeatures) {
                allCatchmentFeatures.push({
                    catchment: area,
                    features: layerInfo.layerFeatures
                });
            }
            
            // Generate mock geographic/demographic data based on the schema you provided
            const mockGeoData = generateMockGeoData(area, selectedLocation);
            
            const summaryRow = {
                'Catchment Area': area.name || `${area.driveTime} minutes`,
                'Drive Time (min)': area.driveTime || '',
                'Travel Mode': area.travelMode || '',
                
                // Geographic Data Fields
                'OBJECTID': mockGeoData.objectid,
                'CTRYCODE': mockGeoData.ctrycode,
                'MICROCODE': mockGeoData.microcode,
                'NAME': mockGeoData.name,
                'P_T': mockGeoData.p_t,
                'P_PRM': mockGeoData.p_prm,
                'HH_T': mockGeoData.hh_t,
                'HH_SIZE': mockGeoData.hh_size,
                'MALE': mockGeoData.male,
                'FEMALE': mockGeoData.female,
                'AGE_T0014': mockGeoData.age_t0014,
                'AGE_T1529': mockGeoData.age_t1529,
                'AGE_T3044': mockGeoData.age_t3044,
                'AGE_T4559': mockGeoData.age_t4559,
                'AGE_T60PL': mockGeoData.age_t60pl,
                'PP_MIO': mockGeoData.pp_mio,
                'PP_PRM': mockGeoData.pp_prm,
                'PP_EURO': mockGeoData.pp_euro,
                'PP_CI': mockGeoData.pp_ci,
                
                // Layer Feature Data (MICROCODES and SECTOR NAMES from layer, not Google Places)
                'All Microcodes': layerInfo.sectorIds,
                'All Sector Names': layerInfo.sectorNames
            };
            
            summaryData.push(summaryRow);
        }
        
        console.log('Summary data sample with geo fields:', Object.keys(summaryData[0]));

        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Add catchment summary sheet
        const summaryWs = XLSX.utils.json_to_sheet(summaryData);
        summaryWs['!cols'] = [
            {wch: 15}, // Catchment Area
            {wch: 12}, // Drive Time
            {wch: 12}, // Travel Mode
            {wch: 12}, // OBJECTID
            {wch: 12}, // CTRYCODE
            {wch: 15}, // MICROCODE
            {wch: 30}, // NAME
            {wch: 12}, // P_T
            {wch: 12}, // P_PRM
            {wch: 12}, // HH_T
            {wch: 12}, // HH_SIZE
            {wch: 12}, // MALE
            {wch: 12}, // FEMALE
            {wch: 12}, // AGE_T0014
            {wch: 12}, // AGE_T1529
            {wch: 12}, // AGE_T3044
            {wch: 12}, // AGE_T4559
            {wch: 12}, // AGE_T60PL
            {wch: 15}, // PP_MIO
            {wch: 15}, // PP_PRM
            {wch: 15}, // PP_EURO
            {wch: 15}, // PP_CI
            {wch: 50}, // All Microcodes
            {wch: 50}  // All Sector Names (from layer NAME field)
        ];
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Catchment Summary');

        // Add detailed demographic breakdown for each catchment
        for (let i = 0; i < catchmentData.length; i++) {
            const area = catchmentData[i];
            const layerInfo = await getLayerFeaturesInCatchment(area, i);
            const geoData = generateMockGeoData(area, selectedLocation);
            
            const detailData = [
                { Metric: 'OBJECTID', Value: geoData.objectid },
                { Metric: 'CTRYCODE', Value: geoData.ctrycode },
                { Metric: 'MICROCODE', Value: geoData.microcode },
                { Metric: 'NAME', Value: geoData.name },
                { Metric: '', Value: '' }, // Empty row
                { Metric: 'Population Data', Value: '' },
                { Metric: 'P_T (Total Population)', Value: geoData.p_t },
                { Metric: 'P_PRM (Primary Population)', Value: geoData.p_prm },
                { Metric: 'MALE', Value: geoData.male },
                { Metric: 'FEMALE', Value: geoData.female },
                { Metric: '', Value: '' }, // Empty row
                { Metric: 'Age Distribution', Value: '' },
                { Metric: 'AGE_T0014', Value: geoData.age_t0014 },
                { Metric: 'AGE_T1529', Value: geoData.age_t1529 },
                { Metric: 'AGE_T3044', Value: geoData.age_t3044 },
                { Metric: 'AGE_T4559', Value: geoData.age_t4559 },
                { Metric: 'AGE_T60PL', Value: geoData.age_t60pl },
                { Metric: '', Value: '' }, // Empty row
                { Metric: 'Household Data', Value: '' },
                { Metric: 'HH_T (Total Households)', Value: geoData.hh_t },
                { Metric: 'HH_SIZE (Household Size)', Value: geoData.hh_size },
                { Metric: '', Value: '' }, // Empty row
                { Metric: 'Purchase Power Data', Value: '' },
                { Metric: 'PP_MIO (Purchase Power MIO)', Value: geoData.pp_mio },
                { Metric: 'PP_PRM (Purchase Power Primary)', Value: geoData.pp_prm },
                { Metric: 'PP_EURO (Purchase Power Euro)', Value: geoData.pp_euro },
                { Metric: 'PP_CI (Purchase Power CI)', Value: geoData.pp_ci },
                { Metric: '', Value: '' }, // Empty row
                { Metric: 'Layer Features Information', Value: '' },
                { Metric: 'All Microcodes', Value: layerInfo.sectorIds },
                { Metric: 'All Sector Names (from NAME field)', Value: layerInfo.sectorNames }
            ];

            const detailWs = XLSX.utils.json_to_sheet(detailData);
            detailWs['!cols'] = [
                {wch: 35}, // Metric
                {wch: 25}  // Value
            ];
            
            XLSX.utils.book_append_sheet(wb, detailWs, `Catchment ${i + 1} Detail`);
        }

        // Add a separate layer features analysis sheet (MICROCODE and NAME from layer)
        if (allCatchmentFeatures.length > 0) {
            const layerAnalysisData = [];
            
            allCatchmentFeatures.forEach(({ catchment, features }) => {
                // Add header for this catchment
                layerAnalysisData.push({
                    'Catchment': `${catchment.driveTime} minutes`,
                    'MICROCODE': '',
                    'NAME': '',
                    'OBJECTID': '',
                    'Area (km²)': '',
                    'Population': ''
                });

                // Add all layer features in this catchment
                features.forEach(feature => {
                    layerAnalysisData.push({
                        'Catchment': '',
                        'MICROCODE': feature.microcode || '',
                        'NAME': feature.name || '',
                        'OBJECTID': feature.objectid || '',
                        'Area (km²)': feature.area_km2 || '',
                        'Population': feature.population || ''
                    });
                });

                // Add empty row between catchments
                layerAnalysisData.push({
                    'Catchment': '',
                    'MICROCODE': '',
                    'NAME': '',
                    'OBJECTID': '',
                    'Area (km²)': '',
                    'Population': ''
                });
            });

            const layerWs = XLSX.utils.json_to_sheet(layerAnalysisData);
            layerWs['!cols'] = [
                {wch: 15}, // Catchment
                {wch: 15}, // MICROCODE
                {wch: 25}, // NAME
                {wch: 12}, // OBJECTID
                {wch: 12}, // Area
                {wch: 12}  // Population
            ];
            XLSX.utils.book_append_sheet(wb, layerWs, 'Layer Features Analysis');
            console.log('Added layer features analysis sheet with', layerAnalysisData.length, 'rows');
        }

        // Add metadata sheet
        const metaData = [{
            'Export Date': new Date().toISOString().slice(0, 19).replace('T', ' '),
            'Location Latitude': selectedLocation?.lat || '',
            'Location Longitude': selectedLocation?.lng || '',
            'Number of Catchments': catchmentData.length,
            'Analysis Type': 'Drive Time Catchment Analysis',
            'Generated By': 'CBRE Catchment Analysis Tool'
        }];
        
        const metaWs = XLSX.utils.json_to_sheet(metaData);
        XLSX.utils.book_append_sheet(wb, metaWs, 'Export Information');

        // Generate Excel file
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        // Set response headers
        const filename = `CBRE_Catchment_${new Date().toISOString().slice(0, 10)}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Send the Excel file
        res.send(excelBuffer);
        
        console.log('Excel file generated successfully for catchment data');
        
    } catch (error) {
        console.error('Error generating Excel file for catchment:', error.message);
        res.status(500).json({ 
            error: 'Error generating Excel file',
            details: error.message 
        });
    }
});

// Helper functions for enhanced catchment calculation

// Helper function to generate mock geographic/demographic data
function generateMockGeoData(catchmentArea, location) {
    const baseId = Math.floor(Math.random() * 100000) + 1;
    const population = catchmentArea.totalPopulation || 0;
    const households = catchmentArea.totalHouseHolds || Math.floor(population / 2.3);
    
    return {
        objectid: baseId,
        ctrycode: 'BE', // Belgium country code
        microcode: `BE${String(baseId).padStart(6, '0')}`, // Belgium microcode format
        name: `Zone ${catchmentArea.driveTime}min - ${location.lat.toFixed(4)},${location.lng.toFixed(4)}`,
        p_t: population, // Total population
        p_prm: Math.floor(population * 0.8), // Primary population (80% of total)
        hh_t: households, // Total households
        hh_size: parseFloat((population / households).toFixed(2)), // Average household size
        male: catchmentArea.totalMale || Math.floor(population * 0.49),
        female: catchmentArea.totalFemale || Math.floor(population * 0.51),
        age_t0014: catchmentArea.totalAGE0014 || Math.floor(population * 0.14),
        age_t1529: catchmentArea.totalAGE1529 || Math.floor(population * 0.17),
        age_t3044: catchmentArea.totalAGE3044 || Math.floor(population * 0.18),
        age_t4559: catchmentArea.totalAGE4559 || Math.floor(population * 0.22),
        age_t60pl: catchmentArea.totalAGE60PL || Math.floor(population * 0.29),
        pp_mio: catchmentArea.totalPP_MIO || catchmentArea.totalMIO || Math.floor(population * 25000 / 1000000), // Purchase power in millions
        pp_prm: catchmentArea.purchasePowerPerson || 25000, // Purchase power per person
        pp_euro: catchmentArea.purchasePowerPerson || 25000, // Purchase power in euros
        pp_ci: Math.floor((catchmentArea.purchasePowerPerson || 25000) * 1.15) // Purchase power confidence interval (+15%)
    };
}

function calculatePopulationForArea(location, driveTime, travelMode) {
    // Base population depends on location (urban vs rural) and drive time
    const urbanFactor = getUrbanFactor(location);
    const travelFactor = getTravelModeFactor(travelMode);
    const timeFactor = Math.pow(driveTime / 15, 1.5); // Non-linear growth
    
    const basePopulation = 3000 * urbanFactor * travelFactor * timeFactor;
    const variation = Math.random() * 0.4 + 0.8; // 80% to 120% variation
    
    return Math.floor(basePopulation * variation);
}

function getUrbanFactor(location) {
    // Brussels city center has higher population density
    const brusselsCenter = { lat: 50.8503, lng: 4.3517 };
    const distance = calculateDistance(location.lat, location.lng, brusselsCenter.lat, brusselsCenter.lng);
    
    // Urban factor decreases with distance from city center
    if (distance < 5000) return 2.0; // Very urban
    if (distance < 15000) return 1.5; // Urban
    if (distance < 30000) return 1.0; // Suburban
    return 0.7; // Rural
}

function getTravelModeFactor(travelMode) {
    const factors = {
        'driving': 1.0,
        'walking': 0.3,
        'bicycling': 0.5,
        'transit': 0.8
    };
    return factors[travelMode] || 1.0;
}

function getAverageSpeed(travelMode) {
    const speeds = {
        'driving': 45, // km/h
        'walking': 5,  // km/h
        'bicycling': 15, // km/h
        'transit': 25   // km/h
    };
    return speeds[travelMode] || 30;
}

function calculateAccessibility(travelMode, driveTime) {
    // Higher accessibility score for longer drive times and faster travel modes
    const baseAccessibility = driveTime * 2;
    const modeFactor = getAverageSpeed(travelMode) / 30; // Normalized
    return Math.min(100, Math.floor(baseAccessibility * modeFactor));
}

function generateDemographicData(population, location) {
    // Generate more realistic demographic data based on location and population
    const urbanFactor = getUrbanFactor(location);
    
    // Urban areas tend to have different demographic patterns
    const womenPercentage = 48 + (Math.random() * 4) + (urbanFactor > 1.5 ? 2 : 0);
    const menPercentage = 100 - womenPercentage;
    
    // Calculate actual numbers (not percentages)
    const totalFemale = Math.floor(population * (womenPercentage / 100));
    const totalMale = population - totalFemale;
    
    // Age distribution varies by urban/rural
    const ageDistribution = generateAgeDistribution(urbanFactor);
    
    // Calculate actual age numbers
    const totalAGE0014 = Math.floor(population * (ageDistribution.pourcentAge0014 / 100));
    const totalAGE1529 = Math.floor(population * (ageDistribution.pourcentAge1529 / 100));
    const totalAGE3044 = Math.floor(population * (ageDistribution.pourcentAge3044 / 100));
    const totalAGE4559 = Math.floor(population * (ageDistribution.pourcentAge4559 / 100));
    const totalAGE60PL = population - (totalAGE0014 + totalAGE1529 + totalAGE3044 + totalAGE4559);
    
    // Economic data
    const householdsCount = Math.floor(population / (2.1 + Math.random() * 0.8));
    const avgHouseholdSize = (population / householdsCount).toFixed(1);
    const purchasePowerPerPerson = Math.floor(25000 + (Math.random() * 20000) + (urbanFactor * 5000));
    const totalPP_MIO = (population * purchasePowerPerPerson) / 1000000;
    
    return {
        // Keep original format for display
        pourcentWomen: parseFloat(womenPercentage.toFixed(1)),
        pourcentMan: parseFloat(menPercentage.toFixed(1)),
        ...ageDistribution,
        totalHouseHolds: householdsCount,
        householdsMember: avgHouseholdSize,
        totalMIO: Math.floor(totalPP_MIO),
        purchasePowerPerson: purchasePowerPerPerson,
        
        // Add raw numbers for PDF generation
        totalMale: totalMale,
        totalFemale: totalFemale,
        totalAGE0014: totalAGE0014,
        totalAGE1529: totalAGE1529,
        totalAGE3044: totalAGE3044,
        totalAGE4559: totalAGE4559,
        totalAGE60PL: totalAGE60PL,
        totalHH_T: householdsCount,
        totalPP_MIO: totalPP_MIO
    };
}

function generateAgeDistribution(urbanFactor) {
    // Urban areas tend to have more young adults, rural areas more families
    const base = {
        pourcentAge0014: 15,
        pourcentAge1529: 20,
        pourcentAge3044: 25,
        pourcentAge4559: 22,
        pourcentAge60PL: 18
    };
    
    if (urbanFactor > 1.5) {
        // Urban adjustment - more young adults
        base.pourcentAge1529 += 5;
        base.pourcentAge3044 += 3;
        base.pourcentAge0014 -= 3;
        base.pourcentAge60PL -= 5;
    } else if (urbanFactor < 1.0) {
        // Rural adjustment - more families and older adults
        base.pourcentAge0014 += 3;
        base.pourcentAge4559 += 2;
        base.pourcentAge60PL += 3;
        base.pourcentAge1529 -= 8;
    }
    
    // Add some randomness
    Object.keys(base).forEach(key => {
        base[key] += (Math.random() - 0.5) * 4;
        base[key] = Math.max(5, Math.min(35, base[key])); // Keep within realistic bounds
        base[key] = parseFloat(base[key].toFixed(1));
    });
    
    return base;
}

function generateAdvancedCatchmentGeometry(center, driveTime, travelMode) {
    // Generate more realistic catchment geometry based on travel mode
    const baseRadius = (driveTime * getAverageSpeed(travelMode)) / 60; // km
    const radiusInDegrees = baseRadius / 111.32; // Convert to degrees
    
    const points = [];
    const numPoints = 64; // More points for smoother polygon
    
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        
        // Add realistic variations based on travel mode
        let radiusModifier = 1.0;
        
        if (travelMode === 'driving') {
            // Driving tends to follow roads - more variation
            radiusModifier = 0.6 + Math.random() * 0.8;
        } else if (travelMode === 'walking') {
            // Walking is more circular but with some variation
            radiusModifier = 0.8 + Math.random() * 0.4;
        } else if (travelMode === 'bicycling') {
            // Bicycling similar to walking but slightly more range
            radiusModifier = 0.7 + Math.random() * 0.6;
        } else if (travelMode === 'transit') {
            // Transit follows routes - can be very irregular
            radiusModifier = 0.4 + Math.random() * 1.2;
        }
        
        const effectiveRadius = radiusInDegrees * radiusModifier;
        const x = center.lng + effectiveRadius * Math.cos(angle);
        const y = center.lat + effectiveRadius * Math.sin(angle);
        points.push([x, y]);
    }
    
    // Close the polygon
    points.push(points[0]);
    
    return {
        type: 'Polygon',
        coordinates: [points]
    };
}

// Helper function to calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

// Helper functions for PDF formatting
function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('en-US').format(Math.round(num));
}

function formatCurrency(num) {
    if (num === undefined || num === null || isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

function formatPercentage(num) {
    if (num === undefined || num === null || isNaN(num)) return 'N/A';
    return `${parseFloat(num).toFixed(1)}%`;
}

// Alternative endpoint for text-based search (gets all types of places)
app.post('/get-all-places-text-search', async (req, res) => {
    const { lat, lng, radius, query = 'business' } = req.body;

    if (!lat || !lng || !radius) {
        return res.status(400).json({ 
            error: 'lat, lng, and radius are required' 
        });
    }

    try {
        console.log('Text search with params:', { lat, lng, radius, query });
        
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/textsearch/json`,
            {
                params: {
                    location: `${lat},${lng}`,
                    radius,
                    query: query,
                    key: API_KEY,
                },
            }
        );

        // Extract coordinates and create enhanced place data
        const placesWithCoords = response.data.results.map(place => ({
            place_id: place.place_id,
            name: place.name,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            types: place.types,
            search_type: 'text_search',
            coordinates: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
            },
            vicinity: place.vicinity || place.formatted_address,
            price_level: place.price_level,
            business_status: place.business_status
        }));

        const placeIds = response.data.results.map(place => place.place_id);
        
        res.json({ 
            placeIds,
            places: placesWithCoords,
            totalFound: response.data.results.length,
            searchParams: { lat, lng, radius, query }
        });

    } catch (error) {
        console.error('Error fetching places:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Error fetching places',
            details: error.message 
        });
    }
});

// Reverse geocoding endpoint to get address from coordinates
app.post('/api/reverse-geocode', async (req, res) => {
    try {
        const { lat, lng } = req.body;
        
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        console.log(`Reverse geocoding coordinates: ${lat}, ${lng}`);
        
        // Use Google Maps Geocoding API
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`
        );

        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const result = response.data.results[0];
            const components = result.address_components;
            
            // Extract street number, street name, and city
            let streetNumber = '';
            let streetName = '';
            let city = '';
            let postalCode = '';
            
            components.forEach(component => {
                const types = component.types;
                if (types.includes('street_number')) {
                    streetNumber = component.long_name;
                } else if (types.includes('route')) {
                    streetName = component.long_name;
                } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                    city = component.long_name;
                } else if (types.includes('postal_code')) {
                    postalCode = component.long_name;
                }
            });
            
            // Format address as "Street Number, City"
            let formattedAddress = '';
            if (streetName) {
                formattedAddress = streetName;
                if (streetNumber) {
                    formattedAddress = `${streetName} ${streetNumber}`;
                }
                if (city) {
                    formattedAddress += `, ${city}`;
                }
            } else if (city) {
                formattedAddress = city;
            } else {
                formattedAddress = result.formatted_address;
            }
            
            console.log(`Formatted address: ${formattedAddress}`);
            
            res.json({
                address: formattedAddress,
                fullAddress: result.formatted_address,
                components: {
                    streetNumber,
                    streetName,
                    city,
                    postalCode
                },
                place_id: result.place_id,
                geometry: result.geometry
            });
        } else {
            console.log(`No address found for coordinates: ${lat}, ${lng}`);
            res.status(404).json({ error: 'No address found for these coordinates' });
        }
        
    } catch (error) {
        console.error('Error in reverse geocoding:', error);
        res.status(500).json({ 
            error: 'Failed to reverse geocode coordinates',
            details: error.message 
        });
    }
});

// Address autocomplete endpoint
app.post('/api/autocomplete', async (req, res) => {
    try {
        const { input } = req.body;
        
        if (!input || input.trim().length < 3) {
            return res.json({ predictions: [] });
        }

        console.log(`Autocomplete search for: ${input}`);
        
        // Use Google Places Autocomplete API
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${API_KEY}`
        );

        if (response.data.status === 'OK') {
            const predictions = response.data.predictions.map(prediction => ({
                place_id: prediction.place_id,
                description: prediction.description,
                main_text: prediction.structured_formatting.main_text,
                secondary_text: prediction.structured_formatting.secondary_text
            }));
            
            res.json({ predictions });
        } else {
            res.json({ predictions: [] });
        }
        
    } catch (error) {
        console.error('Error in autocomplete:', error);
        res.status(500).json({ 
            error: 'Failed to get autocomplete suggestions',
            details: error.message 
        });
    }
});

// Get place details from place_id (for autocomplete selection)
app.post('/api/place-details', async (req, res) => {
    try {
        const { place_id } = req.body;
        if (!place_id) {
            return res.status(400).json({ error: 'Place ID is required' });
        }

        console.log(`Getting full place details for: ${place_id}`);

        // Request all major fields from Google Places Details API
        const fields = [
            'place_id', 'name', 'formatted_address', 'vicinity',
            'formatted_phone_number', 'international_phone_number', 'website', 'url',
            'geometry', 'plus_code', 'utc_offset',
            'business_status', 'opening_hours', 'current_opening_hours', 'secondary_opening_hours',
            'price_level', 'rating', 'user_ratings_total', 'types',
            'photos', 'reviews',
            'wheelchair_accessible_entrance', 'delivery', 'dine_in', 'takeout',
            'reservable', 'serves_beer', 'serves_breakfast', 'serves_brunch',
            'serves_dinner', 'serves_lunch', 'serves_vegetarian_food', 'serves_wine',
            'address_components', 'adr_address',
            'editorial_summary'
        ].join(',');

        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json`,
            {
                params: {
                    place_id,
                    fields,
                    key: API_KEY
                }
            }
        );

        if (response.data.status === 'OK') {
            res.json(response.data.result);
        } else {
            res.status(404).json({ error: 'Place not found', details: response.data.status });
        }
    } catch (error) {
        console.error('Error getting full place details:', error);
        res.status(500).json({ 
            error: 'Failed to get full place details',
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/hello', (req, res) => {
    res.json({ 
        message: 'Hello, World!', 
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /hello',
            'GET /google-maps/place/:id',
            'POST /get-places-in-radius',
            'POST /get-all-places-text-search',
            'POST /calculate-catchment',
            'POST /generate-catchment-report'
        ]
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log(`  GET /hello - Health check`);
    console.log(`  GET /google-maps/place/:id - Get place details`);
    console.log(`  POST /get-places-in-radius - Search places in radius`);
    console.log(`  POST /get-all-places-text-search - Text-based place search`);
    console.log(`  POST /calculate-catchment - Calculate drive time catchment`);
    console.log(`  POST /generate-catchment-report - Generate PDF report`);
    console.log(`  POST /export-places-excel - Export places data to Excel`);
    console.log(`  POST /export-catchment-excel - Export catchment data to Excel`);
});