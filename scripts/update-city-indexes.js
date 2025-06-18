const fs = require('fs');
const path = require('path');

// Path to the cities.json file
const citiesPath = path.join(__dirname, '../data/cities.json');

// Read the cities data
const citiesData = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));

// Update each city with index property
const updatedCities = citiesData.map((city, index) => ({
  ...city,
  index: index < 100  // true for first 100 cities, false for the rest
}));

// Write the updated data back to the file
fs.writeFileSync(
  citiesPath,
  JSON.stringify(updatedCities, null, 2) + '\n',  // Add newline at end of file
  'utf8'
);

console.log(`Updated ${updatedCities.length} cities. First 100 have index: true, the rest have index: false.`);
