const fs = require('fs-extra');
const path = require('path');

async function verifyIndexedCities() {
  try {
    const indexedCities = [];
    
    // Read all state directories
    const stateDirs = await fs.readdir('./data/generated');
    
    for (const stateDir of stateDirs) {
      const statePath = path.join('./data/generated', stateDir);
      const stat = await fs.stat(statePath);
      
      if (stat.isDirectory()) {
        const cityFiles = await fs.readdir(statePath);
        
        for (const cityFile of cityFiles) {
          if (cityFile.endsWith('.json')) {
            const cityPath = path.join(statePath, cityFile);
            const cityData = JSON.parse(await fs.readFile(cityPath, 'utf8'));
            
            if (cityData.index === true) {
              indexedCities.push({
                name: cityData.cityName,
                state: cityData.state,
                path: path.relative(process.cwd(), cityPath)
              });
            }
          }
        }
      }
    }
    
    // Sort by state, then by city name
    indexedCities.sort((a, b) => {
      if (a.state === b.state) {
        return a.name.localeCompare(b.name);
      }
      return a.state.localeCompare(b.state);
    });
    
    // Display results
    console.log(`✅ Found ${indexedCities.length} cities with index: true\n`);
    
    console.log('INDEXED CITIES:');
    console.log('===============');
    
    let currentState = '';
    indexedCities.forEach(city => {
      if (city.state !== currentState) {
        currentState = city.state;
        console.log(`\n${currentState}:`);
        console.log(''.padEnd(currentState.length + 1, '-'));
      }
      console.log(`- ${city.name}`);
    });
    
    console.log(`\nTotal: ${indexedCities.length} cities`);
    
  } catch (error) {
    console.error('❌ Error verifying indexed cities:', error);
    process.exit(1);
  }
}

// Run the verification
verifyIndexedCities();
