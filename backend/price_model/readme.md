We will have to test the model first.
For all existing prices, we will calculate the relation with other variables, like nearby prices, salaries, apartment charactyeristics.

For example.
Pi=β0+β1⋅Size&Rooms+β2⋅Terrace&Garden+β3⋅Age+β4⋅Priceofnearbycomparables+β5⋅LocationScore+β6⋅EPC+ β7⋅AverageSalaryofStatSector+ εi

For selecting nearby comparables, we can maybe intersect with statisticalsector?
In arcgis pro, I can use shortcuts like intersect, within a dsiatnce or spatial join.

But python code could be the following, based onlat/lon.

import pandas as pd
import numpy as np
from math import radians, cos, sin, asin, sqrt
# --- Step 1: Load your dataset ---
# Replace this with your actual data loading step
data = {
	'id': [1, 2, 3, 4, 5],
	'latitude': [50.8503, 50.8467, 50.8450, 50.8600, 50.8700],
	'longitude': [4.3517, 4.3524, 4.3600, 4.3700, 4.3800],
	'price': [300000, 320000, 310000, 330000, 340000]
}
df = pd.DataFrame(data)
# --- Step 2: Define reference point and radius ---
ref_lat = 50.8500  # Latitude of reference point
ref_lon = 4.3520   # Longitude of reference point
radius_km = 1.0    # Radius in kilometers
# --- Step 3: Haversine distance function ---
def haversine(lat1, lon1, lat2, lon2):
	lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
	dlat = lat2 - lat1
	dlon = lon2 - lon1
	a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
	c = 2 * asin(sqrt(a))
	r = 6371  # Radius of Earth in kilometers
	return c * r
# --- Step 4: Compute distances and filter nearby points ---
df['distance_km'] = df.apply(lambda row: haversine(ref_lat, ref_lon, row['latitude'], row['longitude']), axis=1)
nearby_df = df[df['distance_km'] <= radius_km]
# --- Step 5: Output nearby points ---
print(f"Nearby points within {radius_km} km of ({ref_lat}, {ref_lon}):")
print(nearby_df)


Once this is done, we need a upload function, where we can upload thousands of addresses.
Each address will have its price calculated by the model.
And the result will be a html environment OR excel, with prices for each line + location scores.
