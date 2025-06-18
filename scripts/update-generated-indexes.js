const fs = require('fs-extra');
const path = require('path');

async function updateGeneratedIndexes() {
  try {
    // Read the cities data to get the index flags
    const citiesData = JSON.parse(fs.readFileSync('./data/cities.json', 'utf8'));
    
    // Create a map of city names to their index values
    const cityIndexMap = new Map();
    citiesData.forEach(city => {
      // Use the format 'cityname-st' as the key to match the generated filenames
      const key = `${city.slug}`.toLowerCase();
      cityIndexMap.set(key, city.index);
    });
    
    // Find all generated JSON files
    const generatedFiles = await fs.readdir('./data/generated');
    
    // Process each state directory
    for (const stateDir of generatedFiles) {
      const statePath = path.join('./data/generated', stateDir);
      const stat = await fs.stat(statePath);
      
      if (stat.isDirectory()) {
        const cityFiles = await fs.readdir(statePath);
        
        // Process each city file in the state directory
        for (const cityFile of cityFiles) {
          if (cityFile.endsWith('.json')) {
            const cityPath = path.join(statePath, cityFile);
            const citySlug = cityFile.replace(/\.json$/, '').toLowerCase();
            
            // Get the index value from our map
            const indexValue = cityIndexMap.get(citySlug);
            
            if (indexValue !== undefined) {
              // Read the existing city data
              const cityData = JSON.parse(await fs.readFile(cityPath, 'utf8'));
              
              // Only update if the index value is different or doesn't exist
              if (cityData.index !== indexValue) {
                cityData.index = indexValue;
                
                // Write the updated data back to the file
                await fs.writeFile(
                  cityPath,
                  JSON.stringify(cityData, null, 2) + '\n',
                  'utf8'
                );
                
                console.log(`✅ Updated ${citySlug} with index: ${indexValue}`);
              } else {
                console.log(`ℹ️  ${citySlug} already has index: ${indexValue}`);
              }
            } else {
              console.warn(`⚠️  No index found for ${citySlug} in cities.json`);
            }
          }
        }
      }
    }
    
    console.log('\n✅ All generated files have been updated with index flags');
  } catch (error) {
    console.error('❌ Error updating generated files:', error);
    process.exit(1);
  }
}

// Run the function
updateGeneratedIndexes();
