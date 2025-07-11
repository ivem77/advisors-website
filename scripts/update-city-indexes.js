const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Paths
const dataDir = path.join(__dirname, '..', 'data');
const citiesPath = path.join(dataDir, 'cities.json');
const generatedDir = path.join(dataDir, 'generated');

// Read cities data and create a map of slug to index
async function getCityIndexMap() {
  const citiesData = JSON.parse(await readFile(citiesPath, 'utf8'));
  const cityMap = new Map();
  
  citiesData.forEach(city => {
    // Create a key using state abbreviation and city slug
    const key = `${city.stateAbbreviation.toLowerCase()}/${city.slug}`;
    cityMap.set(key, city.index === true);
  });
  
  return cityMap;
}

// Recursively find all JSON files in a directory
async function findJsonFiles(dir) {
  const files = await readdir(dir, { withFileTypes: true });
  let jsonFiles = [];
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      const subFiles = await findJsonFiles(fullPath);
      jsonFiles = jsonFiles.concat(subFiles);
    } else if (file.name.endsWith('.json') && !file.name.startsWith('_')) {
      jsonFiles.push(fullPath);
    }
  }
  
  return jsonFiles;
}

// Update index property in a city file
async function updateCityFile(filePath, shouldIndex) {
  try {
    const content = await readFile(filePath, 'utf8');
    let data = JSON.parse(content);
    
    // Only update if the index property is different
    if (data.index !== shouldIndex) {
      data.index = shouldIndex;
      await writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`Updated: ${filePath} (index: ${shouldIndex})`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('Starting city index update...');
    const cityIndexMap = await getCityIndexMap();
    const jsonFiles = await findJsonFiles(generatedDir);
    let updatedCount = 0;
    
    console.log(`Found ${jsonFiles.length} city files to process`);
    
    for (const filePath of jsonFiles) {
      // Extract state and city name from path (e.g., 'al/montgomery.json')
      const relativePath = path.relative(generatedDir, filePath);
      const key = path.join(
        path.dirname(relativePath),  // state directory
        path.basename(relativePath, '.json')  // city name without .json
      );
      
      const shouldIndex = cityIndexMap.get(key) || false;
      const wasUpdated = await updateCityFile(filePath, shouldIndex);
      if (wasUpdated) updatedCount++;
    }
    
    console.log(`\nUpdate complete!`);
    console.log(`Processed ${jsonFiles.length} files, updated ${updatedCount} files`);
    
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

// Run the script
main();
