const fs = require('fs-extra');
const path = require('path');
const mustache = require('mustache');

async function buildCitySite(cityData) {
  console.log(`🏗️  Building site for ${cityData.name}, ${cityData.state}...`);
  
  // Read template files
  const htmlTemplate = await fs.readFile('./templates/index.html', 'utf8');
  const cssContent = await fs.readFile('./templates/styles.css', 'utf8');
  const jsContent = await fs.readFile('./templates/script.js', 'utf8');
  
  try {
    // Use stateAbbreviation from city data (e.g., 'TX')
    const stateCode = cityData.stateAbbreviation.toLowerCase();
    
    // Clean the slug by removing the state code if present (e.g., 'houston-tx' -> 'houston')
    const cityNameSlug = cityData.slug.replace(/\-\w{2}$/, '');
    
    // Add state code, city slug, and noindex flag for templates
    cityData.stateCode = stateCode;
    cityData.citySlug = cityNameSlug;
    cityData.noindex = !cityData.index;
    
    // Create output directory: build/{stateCode}/{cityNameSlug}
    const outputDir = `./build/${stateCode}/${cityNameSlug}`;
    await fs.ensureDir(outputDir);
    
    // Process HTML template with Mustache
    const processedHtml = mustache.render(htmlTemplate, cityData);
    
    // Write processed files
    await fs.writeFile(`${outputDir}/index.html`, processedHtml);
    await fs.writeFile(`${outputDir}/styles.css`, cssContent);
    await fs.writeFile(`${outputDir}/script.js`, jsContent);
    
    // Copy assets
    await fs.copy('./assets', `${outputDir}/assets`);
    
    console.log(`✅ Built ${cityData.name}, ${cityData.state} → /${stateCode}/${cityNameSlug}`);
    return `/${stateCode}/${cityNameSlug}`;
    
  } catch (error) {
    console.error(`❌ Error building ${cityData.name}, ${cityData.state}:`, error.message);
    throw error;
  }
}

async function generateIndexPage(citiesData) {
  console.log(`📄 Generating index page for ${citiesData.length} cities...`);
  
  // Process city data for the index
  const cities = citiesData.map(cityData => {
    // Clean the slug by removing the state code if present (e.g., 'houston-tx' -> 'houston')
    const citySlug = cityData.slug.replace(/\-\w{2}$/, '');
    
    return {
      name: cityData.cityName || cityData.name,
      state: cityData.state,
      stateCode: cityData.stateAbbreviation || '',
      citySlug: citySlug,
      population: cityData.population || 0,
      advisorCount: cityData.registeredAdvisors || 0
    };
  });
  
  // Sort cities by state then name
  cities.sort((a, b) => {
    if (a.state !== b.state) return a.state.localeCompare(b.state);
    return a.name.localeCompare(b.name);
  });
  
  // Create a map of states to cities for better organization
  const citiesByState = {};
  cities.forEach(city => {
    if (!citiesByState[city.state]) {
      citiesByState[city.state] = [];
    }
    citiesByState[city.state].push(city);
  });

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Financial Advisor City Guides</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: #f8fafc;
    }
    .header {
      text-align: center;
      margin-bottom: 3rem;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header h1 {
      color: #1e293b;
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    .header p {
      color: #64748b;
      font-size: 1.1rem;
    }
    .cities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
    }
    .city-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
      text-decoration: none;
      color: inherit;
    }
    .city-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    .city-name {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .city-state {
      color: #64748b;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    .city-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-weight: 600;
      color: #059669;
      font-size: 0.9rem;
    }
    .stat-label {
      color: #64748b;
      font-size: 0.8rem;
    }
    .footer {
      text-align: center;
      margin-top: 3rem;
      padding: 2rem;
      color: #64748b;
      background: white;
      border-radius: 12px;
    }
    .state-section {
      margin-bottom: 2rem;
    }
    .state-header {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #059669;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏛️ Financial Advisor City Guides</h1>
    <p>Find top-rated financial advisors in major cities across the United States</p>
  </div>

  ${Object.entries(citiesByState)
    .sort(([stateA], [stateB]) => stateA.localeCompare(stateB))
    .map(([state, stateCities]) => `
  <div class="state-section">
    <h2>${state}</h2>
    <div class="cities-grid">
      ${stateCities.map(city => `
      <a href="/${city.stateCode}/${city.cityNameSlug}" class="city-card">
        <div class="city-name">${city.name}</div>
        <div class="city-state">${city.state}</div>
        <div class="city-meta">Population: ${city.population.toLocaleString()}</div>
        <div class="city-advisors">${city.advisorCount || 'Multiple'} advisors</div>
      </a>
      `).join('')}
    </div>
  </div>
  `).join('')}

  <div class="footer">
    <p>🤖 Generated with AI-powered Financial Advisor Generator</p>
    <p>Built with Mustache.js • Powered by OpenAI</p>
  </div>
</body>
</html>`;
  
  await fs.writeFile('./build/index.html', indexHtml);
  console.log(`✅ Generated index page with ${cities.length} cities`);
}

async function buildAllSites() {
  console.log('🏗️  Financial Advisor Static Site Builder');
  console.log('━'.repeat(60) + '\n');

  try {
    // Clean build directory
    console.log('🧹 Cleaning build directory...');
    try {
      await fs.remove('./build');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('⚠️  Warning: Could not fully clean build directory:', error.message);
      }
    }
    await fs.ensureDir('./build');
    
    // Read all state directories and collect city data
    const generatedDir = './data/generated';
    const stateDirs = (await fs.readdir(generatedDir, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (stateDirs.length === 0) {
      throw new Error('No state directories found in data/generated/');
    }

    // Read all city data from JSON files
    const allCityData = [];
    for (const stateDir of stateDirs) {
      const statePath = path.join(generatedDir, stateDir);
      const cityFiles = (await fs.readdir(statePath))
        .filter(file => file.endsWith('.json'));
      
      for (const file of cityFiles) {
        try {
          const cityData = await fs.readJson(path.join(statePath, file));
          
          // Ensure required fields exist
          if (!cityData.cityName) {
            console.warn(`⚠️ Missing cityName in ${file}, skipping...`);
            continue;
          }
          
          // Add/ensure standard field names
          cityData.name = cityData.cityName;
          cityData.stateAbbreviation = stateDir.toUpperCase();
          
          // Add state code (lowercase for URLs)
          cityData.stateCode = stateDir.toLowerCase();
          
          // Ensure slug exists (should already be cleaned by update-city-slugs.js)
          if (!cityData.slug) {
            cityData.slug = cityData.name.toLowerCase().replace(/\s+/g, '-');
          }
          
          allCityData.push(cityData);
        } catch (error) {
          console.error(`⚠️ Error reading ${file}:`, error.message);
        }
      }
    }

    if (allCityData.length === 0) {
      throw new Error('No valid city data files found');
    }

    console.log(`🔍 Found ${allCityData.length} cities to process\n`);

    // Build sites for all cities
    const results = [];
    const cityPaths = [];
    
    for (const cityData of allCityData) {
      try {
        const cityPath = await buildCitySite(cityData);
        cityPaths.push(cityPath);
        results.push({ 
          name: cityData.name, 
          state: cityData.state,
          success: true, 
          path: cityPath 
        });
      } catch (error) {
        console.error(`❌ Failed to build ${cityData.name}, ${cityData.state}:`, error.message);
        results.push({ 
          name: cityData.name,
          state: cityData.state,
          success: false, 
          error: error.message 
        });
      }
    }

    // Generate index page with all cities
    await generateIndexPage(allCityData);

    // Copy assets to root for the index page
    await fs.copy('./assets', './build/assets');

    // Print summary
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    console.log('\n' + '━'.repeat(60));
    console.log('🎉 Build Complete!');
    console.log('━'.repeat(60));
    console.log(`✅ Successfully built: ${successCount}/${results.length} cities`);
    console.log(`📁 Static sites saved in: ${path.resolve('./build/')}/`);
    console.log(`🌐 Index page: ${path.resolve('./build/index.html')}\n`);
    
    if (failCount > 0) {
      console.log(`❌ Failed to build ${failCount} cities. Check logs for details.`);
    }

    console.log('💡 Next step: Run "npm run dev" to preview sites locally');
    
    return results;
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Handle single city building
async function buildSingleCity(cityName, stateAbbr) {
  try {
    console.log(`🏗️ Building single city: ${cityName}, ${stateAbbr}`);
    
    // Create city data object
    const cityData = {
      name: cityName,
      state: stateAbbr, // This should be the full state name
      stateAbbreviation: stateAbbr.toUpperCase(),
      // Add other required fields with default values
      population: 0,
      registeredAdvisors: 0
    };
    
    await fs.ensureDir('./build');
    await buildCitySite(cityData);
    console.log('\n🎉 Single city build complete!');
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length >= 2) {
    // Build single city with name and state abbreviation
    // Example: node scripts/build-sites.js Houston TX
    const cityName = args[0];
    const stateAbbr = args[1];
    buildSingleCity(cityName, stateAbbr);
  } else if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) {
    // Show help
    console.log('Usage:');
    console.log('  Build all cities: node scripts/build-sites.js');
    console.log('  Build single city: node scripts/build-sites.js "City Name" STATE');
    console.log('  Example: node scripts/build-sites.js "New York" NY');
  } else {
    // Build all cities
    buildAllSites();
  }
}

module.exports = { buildCitySite, buildAllSites, buildSingleCity }; 