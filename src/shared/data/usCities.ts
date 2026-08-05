// Curated major-US-cities dataset for the job map.
//
// Coordinates are decimal degrees (WGS84) for each city's civic center,
// rounded to 4 dp (~11 m). Values are well-known public-domain geographic
// facts (as published by the US Census Bureau / GNIS and mirrored by
// SimpleMaps' free US Cities basic set); they are hand-transcribed here, not
// generated at runtime. Roughly the largest cities per state plus every state
// capital, so every state has at least a couple of selectable dots.
//
// `state` is the USPS 2-letter code and matches Job.locationState.

export interface UsCity {
  readonly name: string;
  readonly state: string;
  readonly lat: number;
  readonly lng: number;
}

export const US_CITIES: readonly UsCity[] = [
  // AL
  { name: "Birmingham", state: "AL", lat: 33.5207, lng: -86.8025 },
  { name: "Montgomery", state: "AL", lat: 32.3668, lng: -86.3 },
  { name: "Huntsville", state: "AL", lat: 34.7304, lng: -86.5861 },
  { name: "Mobile", state: "AL", lat: 30.6944, lng: -88.0431 },
  // AK
  { name: "Anchorage", state: "AK", lat: 61.2181, lng: -149.9003 },
  { name: "Juneau", state: "AK", lat: 58.3019, lng: -134.4197 },
  { name: "Fairbanks", state: "AK", lat: 64.8378, lng: -147.7164 },
  // AZ
  { name: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.074 },
  { name: "Tucson", state: "AZ", lat: 32.2226, lng: -110.9747 },
  { name: "Mesa", state: "AZ", lat: 33.4152, lng: -111.8315 },
  { name: "Scottsdale", state: "AZ", lat: 33.4942, lng: -111.9261 },
  // AR
  { name: "Little Rock", state: "AR", lat: 34.7465, lng: -92.2896 },
  { name: "Fayetteville", state: "AR", lat: 36.0626, lng: -94.1574 },
  { name: "Fort Smith", state: "AR", lat: 35.3859, lng: -94.3985 },
  // CA
  { name: "Los Angeles", state: "CA", lat: 34.0522, lng: -118.2437 },
  { name: "San Diego", state: "CA", lat: 32.7157, lng: -117.1611 },
  { name: "San Jose", state: "CA", lat: 37.3382, lng: -121.8863 },
  { name: "San Francisco", state: "CA", lat: 37.7749, lng: -122.4194 },
  { name: "Sacramento", state: "CA", lat: 38.5816, lng: -121.4944 },
  { name: "Fresno", state: "CA", lat: 36.7378, lng: -119.7871 },
  { name: "Oakland", state: "CA", lat: 37.8044, lng: -122.2712 },
  // CO
  { name: "Denver", state: "CO", lat: 39.7392, lng: -104.9903 },
  { name: "Colorado Springs", state: "CO", lat: 38.8339, lng: -104.8214 },
  { name: "Aurora", state: "CO", lat: 39.7294, lng: -104.8319 },
  { name: "Boulder", state: "CO", lat: 40.015, lng: -105.2705 },
  // CT
  { name: "Hartford", state: "CT", lat: 41.7658, lng: -72.6734 },
  { name: "New Haven", state: "CT", lat: 41.3083, lng: -72.9279 },
  { name: "Stamford", state: "CT", lat: 41.0534, lng: -73.5387 },
  // DE
  { name: "Wilmington", state: "DE", lat: 39.7391, lng: -75.5398 },
  { name: "Dover", state: "DE", lat: 39.1582, lng: -75.5244 },
  // DC
  { name: "Washington", state: "DC", lat: 38.9072, lng: -77.0369 },
  // FL
  { name: "Miami", state: "FL", lat: 25.7617, lng: -80.1918 },
  { name: "Jacksonville", state: "FL", lat: 30.3322, lng: -81.6557 },
  { name: "Tampa", state: "FL", lat: 27.9506, lng: -82.4572 },
  { name: "Orlando", state: "FL", lat: 28.5383, lng: -81.3792 },
  { name: "Tallahassee", state: "FL", lat: 30.4383, lng: -84.2807 },
  // GA
  { name: "Atlanta", state: "GA", lat: 33.749, lng: -84.388 },
  { name: "Savannah", state: "GA", lat: 32.0809, lng: -81.0912 },
  { name: "Augusta", state: "GA", lat: 33.4735, lng: -82.0105 },
  // HI
  { name: "Honolulu", state: "HI", lat: 21.3069, lng: -157.8583 },
  { name: "Hilo", state: "HI", lat: 19.7071, lng: -155.0885 },
  // ID
  { name: "Boise", state: "ID", lat: 43.615, lng: -116.2023 },
  { name: "Idaho Falls", state: "ID", lat: 43.4917, lng: -112.0339 },
  // IL
  { name: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298 },
  { name: "Springfield", state: "IL", lat: 39.7817, lng: -89.6501 },
  { name: "Naperville", state: "IL", lat: 41.7508, lng: -88.1535 },
  // IN
  { name: "Indianapolis", state: "IN", lat: 39.7684, lng: -86.1581 },
  { name: "Fort Wayne", state: "IN", lat: 41.0793, lng: -85.1394 },
  // IA
  { name: "Des Moines", state: "IA", lat: 41.5868, lng: -93.625 },
  { name: "Cedar Rapids", state: "IA", lat: 41.9779, lng: -91.6656 },
  // KS
  { name: "Wichita", state: "KS", lat: 37.6872, lng: -97.3301 },
  { name: "Topeka", state: "KS", lat: 39.0473, lng: -95.6752 },
  { name: "Kansas City", state: "KS", lat: 39.1155, lng: -94.6268 },
  // KY
  { name: "Louisville", state: "KY", lat: 38.2527, lng: -85.7585 },
  { name: "Lexington", state: "KY", lat: 38.0406, lng: -84.5037 },
  { name: "Frankfort", state: "KY", lat: 38.2009, lng: -84.8733 },
  // LA
  { name: "New Orleans", state: "LA", lat: 29.9511, lng: -90.0715 },
  { name: "Baton Rouge", state: "LA", lat: 30.4515, lng: -91.1871 },
  { name: "Shreveport", state: "LA", lat: 32.5252, lng: -93.7502 },
  // ME
  { name: "Portland", state: "ME", lat: 43.6591, lng: -70.2568 },
  { name: "Augusta", state: "ME", lat: 44.3106, lng: -69.7795 },
  // MD
  { name: "Baltimore", state: "MD", lat: 39.2904, lng: -76.6122 },
  { name: "Annapolis", state: "MD", lat: 38.9784, lng: -76.4922 },
  // MA
  { name: "Boston", state: "MA", lat: 42.3601, lng: -71.0589 },
  { name: "Worcester", state: "MA", lat: 42.2626, lng: -71.8023 },
  { name: "Cambridge", state: "MA", lat: 42.3736, lng: -71.1097 },
  // MI
  { name: "Detroit", state: "MI", lat: 42.3314, lng: -83.0458 },
  { name: "Grand Rapids", state: "MI", lat: 42.9634, lng: -85.6681 },
  { name: "Lansing", state: "MI", lat: 42.7325, lng: -84.5555 },
  // MN
  { name: "Minneapolis", state: "MN", lat: 44.9778, lng: -93.265 },
  { name: "Saint Paul", state: "MN", lat: 44.9537, lng: -93.09 },
  { name: "Rochester", state: "MN", lat: 44.0121, lng: -92.4802 },
  // MS
  { name: "Jackson", state: "MS", lat: 32.2988, lng: -90.1848 },
  { name: "Gulfport", state: "MS", lat: 30.3674, lng: -89.0928 },
  // MO
  { name: "Kansas City", state: "MO", lat: 39.0997, lng: -94.5786 },
  { name: "St. Louis", state: "MO", lat: 38.627, lng: -90.1994 },
  { name: "Jefferson City", state: "MO", lat: 38.5767, lng: -92.1735 },
  // MT
  { name: "Billings", state: "MT", lat: 45.7833, lng: -108.5007 },
  { name: "Helena", state: "MT", lat: 46.5891, lng: -112.0391 },
  { name: "Bozeman", state: "MT", lat: 45.6769, lng: -111.0429 },
  // NE
  { name: "Omaha", state: "NE", lat: 41.2565, lng: -95.9345 },
  { name: "Lincoln", state: "NE", lat: 40.8136, lng: -96.7026 },
  // NV
  { name: "Las Vegas", state: "NV", lat: 36.1699, lng: -115.1398 },
  { name: "Reno", state: "NV", lat: 39.5296, lng: -119.8138 },
  { name: "Carson City", state: "NV", lat: 39.1638, lng: -119.7674 },
  // NH
  { name: "Manchester", state: "NH", lat: 42.9956, lng: -71.4548 },
  { name: "Concord", state: "NH", lat: 43.2081, lng: -71.5376 },
  // NJ
  { name: "Newark", state: "NJ", lat: 40.7357, lng: -74.1724 },
  { name: "Jersey City", state: "NJ", lat: 40.7178, lng: -74.0431 },
  { name: "Trenton", state: "NJ", lat: 40.2206, lng: -74.7597 },
  // NM
  { name: "Albuquerque", state: "NM", lat: 35.0844, lng: -106.6504 },
  { name: "Santa Fe", state: "NM", lat: 35.687, lng: -105.9378 },
  { name: "Las Cruces", state: "NM", lat: 32.3199, lng: -106.7637 },
  // NY
  { name: "New York", state: "NY", lat: 40.7128, lng: -74.006 },
  { name: "Buffalo", state: "NY", lat: 42.8864, lng: -78.8784 },
  { name: "Rochester", state: "NY", lat: 43.1566, lng: -77.6088 },
  { name: "Albany", state: "NY", lat: 42.6526, lng: -73.7562 },
  // NC
  { name: "Charlotte", state: "NC", lat: 35.2271, lng: -80.8431 },
  { name: "Raleigh", state: "NC", lat: 35.7796, lng: -78.6382 },
  { name: "Greensboro", state: "NC", lat: 36.0726, lng: -79.792 },
  // ND
  { name: "Fargo", state: "ND", lat: 46.8772, lng: -96.7898 },
  { name: "Bismarck", state: "ND", lat: 46.8083, lng: -100.7837 },
  // OH
  { name: "Columbus", state: "OH", lat: 39.9612, lng: -82.9988 },
  { name: "Cleveland", state: "OH", lat: 41.4993, lng: -81.6944 },
  { name: "Cincinnati", state: "OH", lat: 39.1031, lng: -84.512 },
  // OK
  { name: "Oklahoma City", state: "OK", lat: 35.4676, lng: -97.5164 },
  { name: "Tulsa", state: "OK", lat: 36.154, lng: -95.9928 },
  // OR
  { name: "Portland", state: "OR", lat: 45.5152, lng: -122.6784 },
  { name: "Salem", state: "OR", lat: 44.9429, lng: -123.0351 },
  { name: "Eugene", state: "OR", lat: 44.0521, lng: -123.0868 },
  // PA
  { name: "Philadelphia", state: "PA", lat: 39.9526, lng: -75.1652 },
  { name: "Pittsburgh", state: "PA", lat: 40.4406, lng: -79.9959 },
  { name: "Harrisburg", state: "PA", lat: 40.2732, lng: -76.8867 },
  // RI
  { name: "Providence", state: "RI", lat: 41.824, lng: -71.4128 },
  // SC
  { name: "Columbia", state: "SC", lat: 34.0007, lng: -81.0348 },
  { name: "Charleston", state: "SC", lat: 32.7765, lng: -79.9311 },
  // SD
  { name: "Sioux Falls", state: "SD", lat: 43.5446, lng: -96.7311 },
  { name: "Pierre", state: "SD", lat: 44.3683, lng: -100.351 },
  // TN
  { name: "Nashville", state: "TN", lat: 36.1627, lng: -86.7816 },
  { name: "Memphis", state: "TN", lat: 35.1495, lng: -90.049 },
  { name: "Knoxville", state: "TN", lat: 35.9606, lng: -83.9207 },
  // TX
  { name: "Houston", state: "TX", lat: 29.7604, lng: -95.3698 },
  { name: "San Antonio", state: "TX", lat: 29.4241, lng: -98.4936 },
  { name: "Dallas", state: "TX", lat: 32.7767, lng: -96.797 },
  { name: "Austin", state: "TX", lat: 30.2672, lng: -97.7431 },
  { name: "Fort Worth", state: "TX", lat: 32.7555, lng: -97.3308 },
  { name: "El Paso", state: "TX", lat: 31.7619, lng: -106.485 },
  // UT
  { name: "Salt Lake City", state: "UT", lat: 40.7608, lng: -111.891 },
  { name: "Provo", state: "UT", lat: 40.2338, lng: -111.6585 },
  // VT
  { name: "Burlington", state: "VT", lat: 44.4759, lng: -73.2121 },
  { name: "Montpelier", state: "VT", lat: 44.2601, lng: -72.5754 },
  // VA
  { name: "Virginia Beach", state: "VA", lat: 36.8529, lng: -75.978 },
  { name: "Richmond", state: "VA", lat: 37.5407, lng: -77.436 },
  { name: "Arlington", state: "VA", lat: 38.8816, lng: -77.091 },
  // WA
  { name: "Seattle", state: "WA", lat: 47.6062, lng: -122.3321 },
  { name: "Spokane", state: "WA", lat: 47.6588, lng: -117.426 },
  { name: "Tacoma", state: "WA", lat: 47.2529, lng: -122.4443 },
  { name: "Olympia", state: "WA", lat: 47.0379, lng: -122.9007 },
  // WV
  { name: "Charleston", state: "WV", lat: 38.3498, lng: -81.6326 },
  { name: "Morgantown", state: "WV", lat: 39.6295, lng: -79.9559 },
  // WI
  { name: "Milwaukee", state: "WI", lat: 43.0389, lng: -87.9065 },
  { name: "Madison", state: "WI", lat: 43.0731, lng: -89.4012 },
  { name: "Green Bay", state: "WI", lat: 44.5133, lng: -88.0133 },
  // WY
  { name: "Cheyenne", state: "WY", lat: 41.14, lng: -104.8202 },
  { name: "Casper", state: "WY", lat: 42.8666, lng: -106.3131 },
];
