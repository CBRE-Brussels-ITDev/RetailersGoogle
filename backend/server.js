const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5001; // Change this to your desired port

app.use(cors()); // Enable CORS for all routes
const API_KEY ="AIzaSyA1r8V5FSaYFvmS8FwnGxA6DwXhnHUvHUc"
app.get('/google-maps/place/:id', async (req, res) => {
    const { id } = req.params;
    console.log('Received placeId:', id); // Debug log

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

app.post('/get-places-in-radius', express.json(), async (req, res) => {
    const { lat, lng, radius, category } = req.body;

    if (!lat || !lng || !radius || !category) {
        return res.status(400).send('lat, lng, radius, and category are required');
    }

    try {
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
        res.json({ placeIds });
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