const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080; // Use port 8080 or environment variable

app.use(cors());
// Increase body parser limit to handle large payloads (map screenshots)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Move API key to environment variable for security
const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyA1r8V5FSaYFvmS8FwnGxA6DwXhnHUvHUc";

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

// Helper functions for enhanced catchment calculation
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
});