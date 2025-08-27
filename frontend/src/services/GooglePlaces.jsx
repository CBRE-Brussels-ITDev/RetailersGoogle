// Updated src/services/GooglePlaces.jsx
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://coral-app-adar7.ondigitalocean.app';

const GooglePlacesService = {
    // Existing methods...
    async getPlacesInRadius(lat, lng, radius, category = null, getAllSectors = false) {
        console.log('Fetching places in radius:', { lat, lng, radius, category, getAllSectors });
        try {
            const requestBody = {
                lat,
                lng,
                radius,
            };

            if (getAllSectors) {
                requestBody.getAllSectors = true;
            } else if (category) {
                requestBody.category = category;
            } else {
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

    // FIXED: Catchment calculation method with correct parameters
    async calculateCatchment(location, travelMode, driveTimes, showDemographics) {
        console.log('Calculating catchment:', { location, travelMode, driveTimes, showDemographics });
        try {
            const response = await axios.post(`${BASE_URL}/calculate-catchment`, {
                location,
                travelMode,
                driveTimes,
                showDemographics
            });
            
            console.log('Catchment response:', response.data);
            return {
                catchmentResults: response.data.catchmentResults || [],
                searchParams: response.data.searchParams || {},
                calculationInfo: response.data.calculationInfo || {}
            };
        } catch (error) {
            console.error('Error calculating catchment:', error);
            throw error;
        }
    },

    // Get demographic data for a specific area
    async getDemographicData(geometry) {
        console.log('Fetching demographic data for geometry:', geometry);
        try {
            const response = await axios.post(`${BASE_URL}/get-demographic-data`, {
                geometry
            });
            
            return response.data;
        } catch (error) {
            console.error('Error fetching demographic data:', error);
            throw error;
        }
    },

    // Generate PDF report
    async generateCatchmentReport(catchmentData, address, imageUrl) {
        console.log('Generating catchment report:', { catchmentData, address });
        try {
            const response = await axios.post(`${BASE_URL}/generate-catchment-report`, {
                catchmentData,
                address,
                imageUrl,
                timestamp: new Date().toISOString()
            }, {
                responseType: 'blob' // Important for PDF download
            });
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `CBRE_Catchment_${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            return { success: true };
        } catch (error) {
            console.error('Error generating report:', error);
            throw error;
        }
    },

    // Export places data to Excel
    async exportPlacesToExcel(places, searchParams) {
        console.log('Exporting places to Excel:', { placesCount: places?.length, searchParams });
        try {
            const response = await axios.post(`${BASE_URL}/export-places-excel`, {
                places,
                searchParams
            }, {
                responseType: 'blob' // Important for Excel download
            });
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `CBRE_Places_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            return { success: true };
        } catch (error) {
            console.error('Error exporting places to Excel:', error);
            throw error;
        }
    },

    // Export catchment data to Excel
    async exportCatchmentToExcel(catchmentData, selectedLocation, placesData = null) {
        console.log('Exporting catchment to Excel:', { catchmentCount: catchmentData?.length, selectedLocation, placesCount: placesData?.length });
        try {
            const response = await axios.post(`${BASE_URL}/export-catchment-excel`, {
                catchmentData,
                selectedLocation,
                placesData
            }, {
                responseType: 'blob' // Important for Excel download
            });
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `CBRE_Catchment_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            return { success: true };
        } catch (error) {
            console.error('Error exporting catchment to Excel:', error);
            throw error;
        }
    },

    // Generate commerce analysis report
    async generateCommerceReport(reportData, commerceType, location) {
        console.log('Generating commerce analysis report:', { commerceType, location });
        try {
            const response = await axios.post(`${BASE_URL}/generate-commerce-report`, {
                reportData,
                commerceType,
                location,
                reportType: 'comprehensive',
                includeCharts: true
            }, {
                responseType: 'blob'
            });
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `CBRE_Commerce_Analysis_${commerceType}_${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            return { success: true };
        } catch (error) {
            console.error('Error generating commerce report:', error);
            throw error;
        }
    },

    // Helper method for existing search functionality
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