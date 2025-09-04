// Updated src/services/GooglePlaces.jsx
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://coral-app-adar7.ondigitalocean.app';

const GooglePlacesService = {
    // Existing methods...

    // ArcGIS catchment calculation (drive-time polygons) - MULTIPLE catchments in one call
    async getArcgisCatchment(center, breakTimes, travelMode = 'Driving Time') {
        // Always send travelMode as a valid ArcGIS travel mode name
        const validModes = [
            "Driving Time", "Walking Time"
        ];
        let modeToSend = validModes.includes(travelMode) ? travelMode : 'Driving Time';
        console.log('Requesting ArcGIS catchment:', { center, breakTimes, travelMode: modeToSend });
        try {
            const response = await axios.post(`${BASE_URL}/arcgis-catchment`, {
                center, 
                breakTimes,
                travelMode: modeToSend
            });
            console.log('ArcGIS catchment response:', response.data);
            // Return the data as-is for display
            return response.data;
        } catch (error) {
            console.error('Error fetching ArcGIS catchment:', error);
            throw error;
        }
    },

    // NEW: ArcGIS single catchment calculation - ONE catchment per call (more accurate)
    async getArcgisSingleCatchment(center, breakTime, travelMode = 'Driving Time') {
        const validModes = ["Driving Time", "Walking Time"];
        let modeToSend = validModes.includes(travelMode) ? travelMode : 'Driving Time';
        console.log(`🎯 Requesting SINGLE ArcGIS catchment: ${breakTime} minutes`, { center, travelMode: modeToSend });
        
        try {
            const response = await axios.post(`${BASE_URL}/arcgis-single-catchment`, {
                center, 
                breakTime,
                travelMode: modeToSend
            });
            console.log(`✅ Single catchment response for ${breakTime} minutes:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching single catchment for ${breakTime} minutes:`, error);
            throw error;
        }
    },

    // NEW: Multiple independent catchment calls (most accurate method)
    async getMultipleIndependentCatchments(center, breakTimes, travelMode = 'Driving Time') {
        console.log(`🎯 Making ${breakTimes.length} INDEPENDENT catchment calls:`, { center, breakTimes, travelMode });
        
        try {
            // Make separate API calls for each break time
            const catchmentPromises = breakTimes.map(breakTime => 
                this.getArcgisSingleCatchment(center, breakTime, travelMode)
            );
            
            // Wait for all calls to complete
            const results = await Promise.all(catchmentPromises);
            
            // Extract catchment data and combine
            const polygons = results.map(result => result.catchment);
            
            console.log(`✅ Got ${polygons.length} independent catchments:`, 
                polygons.map(p => `${p.breakTime}min: ${p.totalPopulation} pop, ${p.totalMIO} PP`)
            );
            
            return {
                success: true,
                polygons: polygons,
                travelMode: travelMode
            };
        } catch (error) {
            console.error('❌ Error in multiple independent catchments:', error);
            throw error;
        }
    },
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
        console.log('🔄 GooglePlacesService.getPlaceDetails called with:', placeId);
        console.log('🌐 Making request to:', `${BASE_URL}/google-maps/place/${placeId}`);
        try {
            const response = await axios.get(`${BASE_URL}/google-maps/place/${placeId}`);
            console.log('✅ API Response received:');
            console.log('📊 Response status:', response.status);
            console.log('📦 Response headers:', response.headers);
            console.log('🗂️ Response data keys:', response.data ? Object.keys(response.data) : 'No data');
            console.log('🏢 Place name from response:', response.data?.result?.name || 'No name in response');
            console.log('🔗 Full response data:', JSON.stringify(response.data, null, 2));
            return response.data;
        } catch (error) {
            console.error('❌ Error in GooglePlacesService.getPlaceDetails:', error);
            console.error('🌐 Request URL was:', `${BASE_URL}/google-maps/place/${placeId}`);
            console.error('📊 Error status:', error.response?.status);
            console.error('📄 Error data:', error.response?.data);
            throw error;
        }
    },

    // FIXED: Catchment calculation method with correct parameters including colors
    async calculateCatchment(location, travelMode, driveTimes, showDemographics, colors = null) {
        console.log('Calculating catchment:', { location, travelMode, driveTimes, showDemographics, colors });
        try {
            const response = await axios.post(`${BASE_URL}/calculate-catchment`, {
                location,
                travelMode,
                driveTimes,
                showDemographics,
                colors // Pass colors to backend
            });
            
            console.log('Catchment response:', response.data);
            return {
                catchmentResults: response.data.catchmentResults || [],
                searchParams: response.data.searchParams || {},
                calculationInfo: response.data.calculationInfo || {},
                colors: colors // Include colors in response for map rendering
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
    },

    // Reverse geocoding to get address from coordinates
    async reverseGeocode(lat, lng) {
        console.log('Reverse geocoding coordinates:', { lat, lng });
        try {
            const response = await axios.post(`${BASE_URL}/api/reverse-geocode`, {
                lat,
                lng
            });
            
            if (response.data && response.data.address) {
                console.log('Reverse geocoding result:', response.data.address);
                return response.data.address;
            } else {
                console.warn('No address found for coordinates');
                return null;
            }
        } catch (error) {
            console.error('Error in reverse geocoding:', error);
            return null;
        }
    },

    // Address autocomplete suggestions
    async getAddressSuggestions(input) {
        if (!input || input.trim().length < 3) {
            return [];
        }
        
        console.log('Getting address suggestions for:', input);
        try {
            const response = await axios.post(`${BASE_URL}/api/autocomplete`, {
                input
            });
            
            if (response.data && response.data.predictions) {
                console.log('Address suggestions:', response.data.predictions);
                return response.data.predictions;
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error getting address suggestions:', error);
            return [];
        }
    },

    // Get place details from place_id
    async getPlaceDetails(placeId) {
        console.log('🔄 GooglePlacesService.getPlaceDetails called with:', placeId);
        console.log('🌐 Making request to:', `${BASE_URL}/google-maps/place/${placeId}`);
        try {
            const response = await axios.get(`${BASE_URL}/google-maps/place/${placeId}`);
            console.log('✅ API Response received:');
            console.log('📊 Response status:', response.status);
            console.log('📦 Response headers:', response.headers);
            console.log('🗂️ Response data keys:', response.data ? Object.keys(response.data) : 'No data');
            console.log('🏢 Place name from response:', response.data?.result?.name || 'No name in response');
            console.log('🔗 Full response data:', JSON.stringify(response.data, null, 2));
            return response.data;
        } catch (error) {
            console.error('❌ Error in GooglePlacesService.getPlaceDetails:', error);
            console.error('🌐 Request URL was:', `${BASE_URL}/google-maps/place/${placeId}`);
            console.error('📊 Error status:', error.response?.status);
            console.error('📄 Error data:', error.response?.data);
            throw error;
        }
    }
};

export default GooglePlacesService;