const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5001;

app.use(cors());
const API_KEY = "AIzaSyA1r8V5FSaYFvmS8FwnGxA6DwXhnHUvHUc"; // Consider moving to environment variable

// Get place details by ID
app.get('/google-maps/place/:id', async (req, res) => {
    const { id } = req.params;
    console.log('Received placeId:', id);

    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json`,
            {
                params: {
                    place_id: id,
                    key: API_KEY,
                },
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching place details:', error.response?.data || error.message);
        res.status(500).send('Error fetching place details');
    }
});

// Enhanced endpoint to get places with flexible category options
app.post('/get-places-in-radius', express.json(), async (req, res) => {
    const { lat, lng, radius, category, getAllSectors = false } = req.body;

    if (!lat || !lng || !radius) {
        return res.status(400).send('lat, lng, and radius are required');
    }

    try {
        let allPlaces = [];

        if (getAllSectors || category === 'all') {
            // Get all types of places by making multiple requests
            const commonTypes = [
                'restaurant', 'gas_station', 'bank', 'hospital', 'pharmacy',
                'grocery_or_supermarket', 'shopping_mall', 'school', 'park',
                'tourist_attraction', 'lodging', 'store', 'car_repair',
                'gym', 'beauty_salon', 'church', 'library', 'post_office'
            ];

            // Make requests for each type
            const promises = commonTypes.map(async (type) => {
                try {
                    const response = await axios.get(
                        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
                        {
                            params: {
                                location: `${lat},${lng}`,
                                radius,
                                type: type,
                                key: API_KEY,
                            },
                        }
                    );
                    return response.data.results.map(place => ({
                        ...place,
                        search_type: type
                    }));
                } catch (error) {
                    console.error(`Error fetching ${type}:`, error.message);
                    return [];
                }
            });

            const results = await Promise.all(promises);
            allPlaces = results.flat();

            // Remove duplicates based on place_id
            const uniquePlaces = allPlaces.filter((place, index, self) =>
                index === self.findIndex(p => p.place_id === place.place_id)
            );

            const placeIds = uniquePlaces.map(place => place.place_id);
            res.json({ 
                placeIds, 
                places: uniquePlaces,
                totalFound: uniquePlaces.length,
                searchTypes: commonTypes 
            });

        } else if (category) {
            // Single category search (your original functionality)
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
                {
                    params: {
                        location: `${lat},${lng}`,
                        radius,
                        type: category,
                        key: API_KEY,
                    },
                }
            );

            const placeIds = response.data.results.map(place => place.place_id);
            res.json({ 
                placeIds, 
                places: response.data.results,
                totalFound: response.data.results.length 
            });
        } else {
            return res.status(400).send('Either category or getAllSectors=true is required');
        }

    } catch (error) {
        console.error('Error fetching places:', error.response?.data || error.message);
        res.status(500).send('Error fetching places');
    }
});

// Alternative endpoint for text-based search (gets all types of places)
app.post('/get-all-places-text-search', express.json(), async (req, res) => {
    const { lat, lng, radius, query = '' } = req.body;

    if (!lat || !lng || !radius) {
        return res.status(400).send('lat, lng, and radius are required');
    }

    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/textsearch/json`,
            {
                params: {
                    location: `${lat},${lng}`,
                    radius,
                    query: query || 'business', // Generic query to get various businesses
                    key: API_KEY,
                },
            }
        );

        const placeIds = response.data.results.map(place => place.place_id);
        res.json({ 
            placeIds, 
            places: response.data.results,
            totalFound: response.data.results.length 
        });

    } catch (error) {
        console.error('Error fetching places:', error.response?.data || error.message);
        res.status(500).send('Error fetching places');
    }
});

app.get('/hello', (req, res) => {
    res.send('Hello, World!');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});