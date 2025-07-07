const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json()); // Add this middleware for parsing JSON bodies

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
            'POST /get-all-places-text-search'
        ]
    });
});
app.post('/calculate-catchment', async (req, res) => {
    const { lat, lng, distances, departTime, travelMode } = req.body;

    if (!lat || !lng || !distances) {
        return res.status(400).json({ 
            error: 'lat, lng, and distances are required' 
        });
    }

    try {
        // Mock catchment calculation
        // Replace with actual service area calculation using Google Maps or ArcGIS
        const catchmentResults = distances.map((distance, index) => {
            // Generate mock demographic data
            const totalPopulation = Math.floor(Math.random() * 50000) + 10000;
            const pourcentWomen = Math.floor(Math.random() * 10) + 45;
            const pourcentMan = 100 - pourcentWomen;
            
            return {
                name: `${distance} minutes`,
                totalPopulation,
                pourcentWomen,
                pourcentMan,
                pourcentAge0014: Math.floor(Math.random() * 20) + 10,
                pourcentAge1529: Math.floor(Math.random() * 20) + 15,
                pourcentAge3044: Math.floor(Math.random() * 20) + 20,
                pourcentAge4559: Math.floor(Math.random() * 20) + 15,
                pourcentAge60PL: Math.floor(Math.random() * 20) + 10,
                totalHouseHolds: Math.floor(Math.random() * 20000) + 5000,
                householdsMember: (Math.random() * 2 + 2).toFixed(1),
                totalMIO: Math.floor(Math.random() * 500) + 100,
                purchasePowerPerson: Math.floor(Math.random() * 10000) + 25000,
                // Add geometry data for drawing on map
                geometry: generateMockPolygon(lat, lng, distance)
            };
        });

        res.json({ 
            catchmentResults,
            searchParams: { lat, lng, distances, departTime, travelMode }
        });

    } catch (error) {
        console.error('Error calculating catchment:', error);
        res.status(500).json({ 
            error: 'Error calculating catchment',
            details: error.message 
        });
    }
});

function generateMockPolygon(centerLat, centerLng, radiusMinutes) {
    // Convert minutes to approximate radius in degrees
    const radius = (radiusMinutes * 0.001);
    const points = [];
    const numPoints = 20;
    
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        const lat = centerLat + radius * Math.cos(angle);
        const lng = centerLng + radius * Math.sin(angle);
        points.push([lng, lat]);
    }
    
    // Close the polygon
    points.push(points[0]);
    
    return {
        type: 'Polygon',
        coordinates: [points]
    };
}

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
});