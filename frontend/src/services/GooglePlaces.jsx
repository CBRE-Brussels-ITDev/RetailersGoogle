import axios from 'axios';


const BASE_URL = 'http://localhost:5001';

const GooglePlacesService = {
    async getPlacesInRadius(lat, lng, radius, category) {
        console.log('Fetching places in radius:', { lat, lng, radius, category });
        try {
            const response = await axios.post(`${BASE_URL}/get-places-in-radius`, {
                lat,
                lng,
                radius,
                category,
            });
            return response.data.placeIds; // Return only the place IDs
        } catch (error) {
            console.error('Error fetching places in radius:', error);
            throw error;
        }
    },

    async getPlaceDetails(placeId) {
        console.log('Fetching place details for:', placeId);
        console.log("BASE_URL",`${BASE_URL}/google-maps/place/${placeId}`)
        try {
            const response = await axios.get(`${BASE_URL}/google-maps/place/${placeId}`, {
            });
            return response;
        } catch (error) {
            console.error('Error fetching place details:', error);
            throw error;
        }
    },

   
};

export default GooglePlacesService;