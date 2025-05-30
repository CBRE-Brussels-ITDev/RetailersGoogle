import axios from 'axios';

const BASE_URL = 'http://localhost:5001';

const GooglePlacesService = {
    async getPlacesInRadius(lat, lng, radius, category = null, getAllSectors = false) {
        console.log('Fetching places in radius:', { lat, lng, radius, category, getAllSectors });
        try {
            const requestBody = {
                lat,
                lng,
                radius,
            };

            // Add appropriate parameters based on search type
            if (getAllSectors) {
                requestBody.getAllSectors = true;
            } else if (category) {
                requestBody.category = category;
            } else {
                // Default to getting all sectors if no category specified
                requestBody.getAllSectors = true;
            }

            const response = await axios.post(`${BASE_URL}/get-places-in-radius`, requestBody);
            
            console.log('Places response:', response.data);
            return {
                placeIds: response.data.placeIds || [],
                places: response.data.places || [],
                totalFound: response.data.totalFound || 0,
                searchTypes: response.data.searchTypes || [],
                searchParams: response.data.searchParams || {}
            };
        } catch (error) {
            console.error('Error fetching places in radius:', error);
            throw error;
        }
    },

    async getPlacesTextSearch(lat, lng, radius, query = '') {
        console.log('Fetching places via text search:', { lat, lng, radius, query });
        try {
            const response = await axios.post(`${BASE_URL}/get-all-places-text-search`, {
                lat,
                lng,
                radius,
                query
            });
            
            console.log('Text search response:', response.data);
            return {
                placeIds: response.data.placeIds || [],
                places: response.data.places || [],
                totalFound: response.data.totalFound || 0,
                searchParams: response.data.searchParams || {}
            };
        } catch (error) {
            console.error('Error fetching places via text search:', error);
            throw error;
        }
    },

    async getPlaceDetails(placeId) {
        console.log('Fetching place details for:', placeId);
        try {
            const response = await axios.get(`${BASE_URL}/google-maps/place/${placeId}`);
            return response;
        } catch (error) {
            console.error('Error fetching place details:', error);
            throw error;
        }
    },

    // Helper method to get places with different search strategies
    async searchPlaces(lat, lng, radius, options = {}) {
        const { 
            category = null, 
            getAllSectors = false, 
            useTextSearch = false, 
            query = 'business' 
        } = options;

        try {
            if (useTextSearch) {
                return await this.getPlacesTextSearch(lat, lng, radius, query);
            } else {
                return await this.getPlacesInRadius(lat, lng, radius, category, getAllSectors);
            }
        } catch (error) {
            console.error('Error in searchPlaces:', error);
            throw error;
        }
    }
};

export default GooglePlacesService;