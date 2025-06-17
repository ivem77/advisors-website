const fs = require('fs-extra');
const path = require('path');
const mustache = require('mustache');

async function buildCitySite(citySlug) {
  console.log(`🏗️  Building site for ${citySlug}...`);
  
  try {
    // Extract state code from city slug (e.g., 'tx' from 'houston-tx')
    const stateCode = citySlug.split('-').pop().toLowerCase();
    const cityName = citySlug.substring(0, citySlug.lastIndexOf('-'));
    
    // Read template files
    const htmlTemplate = await fs.readFile('./templates/index.html', 'utf8');
    const cssContent = await fs.readFile('./templates/styles.css', 'utf8');
    const jsContent = await fs.readFile('./templates/script.js', 'utf8');
    
    // Load city data from state directory
    const cityDataPath = `./data/generated/${stateCode}/${citySlug}.json`;
    if (!await fs.pathExists(cityDataPath)) {
      throw new Error(`City data not found: ${cityDataPath}`);
    }
    
    const cityData = await fs.readJson(cityDataPath);
    
    // Add state code to city data for templates
    cityData.stateCode = stateCode.toUpperCase();
    
    // Process HTML template with Mustache
    const processedHtml = mustache.render(htmlTemplate, cityData);
    
    // Create output directory with state code
    const outputDir = `./build/${stateCode}/${citySlug}`;
    await fs.ensureDir(outputDir);
    
    // Write processed files
    await fs.writeFile(`${outputDir}/index.html`, processedHtml);
    await fs.writeFile(`${outputDir}/styles.css`, cssContent);
    await fs.writeFile(`${outputDir}/script.js`, jsContent);
    
    // Copy assets directory
    await fs.copy('./assets', `${outputDir}/assets`);
    
    console.log(`✅ Built ${citySlug} → build/${stateCode}/${citySlug}/`);
    
    return cityData;
    
  } catch (error) {
    console.error(`❌ Error building ${citySlug}:`, error.message);
    throw error;
  }
}

async function generateIndexPage(citySlugs) {
  console.log(`📄 Generating index page for ${citySlugs.length} cities...`);
  
  // Read city data for the index
  const cities = [];
  for (const slug of citySlugs) {
    try {
      // Extract state code from slug (e.g., 'houston-tx' -> 'tx')
      const stateCode = slug.split('-').pop().toLowerCase();
      const cityData = await fs.readJson(`./data/generated/${stateCode}/${slug}.json`);
      
      cities.push({
        name: cityData.cityName,
        state: cityData.state,
        slug: cityData.slug,
        population: cityData.population,
        advisorCount: cityData.registeredAdvisors || 0
      });
    } catch (error) {
      console.warn(`⚠️ Could not read data for ${slug}, skipping from index:`, error.message);
    }
  }
  
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
    // Add state code to city object for the link
    city.stateCode = city.slug.split('-').pop();
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
      <a href="/${city.stateCode}/${city.slug}" class="city-card">
        <div class="city-name">${city.name}</div>
        <div class="city-state">${city.state}</div>
        <div class="city-stats">
          <div class="stat">
            <div class="stat-value">${city.advisorCount}</div>
            <div class="stat-label">Advisors</div>
          </div>
          <div class="stat">
            <div class="stat-value">${city.population}</div>
            <div class="stat-label">Population</div>
          </div>
        </div>
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
    
    // Read all state directories and collect city JSON files
    const generatedDir = './data/generated';
    const stateDirs = (await fs.readdir(generatedDir, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (stateDirs.length === 0) {
      throw new Error('No state directories found in data/generated/');
    }

    // Get all city JSON files from state directories
    const citySlugs = [];
    for (const stateDir of stateDirs) {
      const statePath = path.join(generatedDir, stateDir);
      const cityFiles = await fs.readdir(statePath);
      
      cityFiles
        .filter(file => file.endsWith('.json'))
        .forEach(file => {
          const citySlug = file.replace(/\.json$/, '');
          citySlugs.push(citySlug);
        });
    }

    if (citySlugs.length === 0) {
      throw new Error('No city data files found in state directories');
    }

    console.log(`🔍 Found ${citySlugs.length} cities to process\n`);

    // Build sites for all cities
    const results = [];
    for (const slug of citySlugs) {
      try {
        const cityData = await buildCitySite(slug);
        results.push({ slug, success: true, data: cityData });
      } catch (error) {
        console.error(`❌ Failed to build ${slug}:`, error.message);
        results.push({ slug, success: false, error: error.message });
      }
    }

    // Generate index page with all cities
    await generateIndexPage(citySlugs);

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
async function buildSingleCity(citySlug) {
  try {
    console.log(`🏗️ Building single city: ${citySlug}`);
    await fs.ensureDir('./build');
    await buildCitySite(citySlug);
    console.log('\n🎉 Single city build complete!');
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Build single city
    buildSingleCity(args[0]);
  } else {
    // Build all cities
    buildAllSites();
  }
}

module.exports = { buildCitySite, buildAllSites, buildSingleCity }; 