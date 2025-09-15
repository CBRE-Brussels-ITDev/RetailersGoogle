# Data Files

This directory contains the building data files required for the residential analysis feature.

## Required Files

You need to place the following data files in this directory:

- `data1.json` - Building data file 1
- `data2.json` - Building data file 2

## File Format

Each JSON file should contain an array of building objects with the following structure:

```json
{
  "Id": "100022",
  "Usage": "h",
  "Operation": "s", 
  "Address": "rue Julien Marsille 123 | 1480 Saintes",
  "ProvinceName": "Waals-Brabant",
  "CityName": "Saintes",
  "PostalCode": "1480",
  "Surface": "160",
  "Value": "529950",
  "UnitValue": "3312.1875",
  "ConstructionYear": "",
  "Latitude": "50.7158629",
  "Longitude": "4.163456",
  "Rooms": "3",
  "Bathrooms": "1",
  "EnergyLabel": "A+",
  "PlotSurface": "1194",
  "Date": "15/08/2023"
}
```

## Note

These data files are excluded from git tracking due to their large size (100MB+ limit on GitHub).
Make sure to keep backup copies of these files separately.
