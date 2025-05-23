const fs = require('fs-extra');
const path = require('path');
const mustache = require('mustache');

async function buildCitySite(citySlug) {
  console.log(`🏗️ Building site for ${citySlug}...`);
  
  try {
    // Read template files
    const htmlTemplate = await fs.readFile('./templates/index.html', 'utf8');
    const cssContent = await fs.readFile('./templates/styles.css', 'utf8');
    const jsContent = await fs.readFile('./templates/script.js', 'utf8');
    
    // Load city data
    const cityDataPath = `./data/generated/${citySlug}.json`;
    if (!await fs.pathExists(cityDataPath)) {
      throw new Error(`City data not found: ${cityDataPath}`);
    }
    
    const cityData = await fs.readJson(cityDataPath);
    
    // Process HTML template with Mustache
    const processedHtml = mustache.render(htmlTemplate, cityData);
    
    // Create output directory
    const outputDir = `./build/${citySlug}`;
    await fs.ensureDir(outputDir);
    
    // Write processed files
    await fs.writeFile(`${outputDir}/index.html`, processedHtml);
    await fs.writeFile(`${outputDir}/styles.css`, cssContent);
    await fs.writeFile(`${outputDir}/script.js`, jsContent);
    
    // Copy assets directory
    await fs.copy('./assets', `${outputDir}/assets`);
    
    console.log(`✅ Built ${citySlug} → build/${citySlug}/`);
    
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
      const cityData = await fs.readJson(`./data/generated/${slug}.json`);
      cities.push({
        name: cityData.cityName,
        state: cityData.state,
        slug: cityData.slug,
        population: cityData.population,
        advisorCount: cityData.registeredAdvisors
      });
    } catch (error) {
      console.warn(`⚠️ Could not read data for ${slug}, skipping from index`);
    }
  }
  
  // Sort cities by state then name
  cities.sort((a, b) => {
    if (a.state !== b.state) return a.state.localeCompare(b.state);
    return a.name.localeCompare(b.name);
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

  ${Object.entries(
    cities.reduce((acc, city) => {
      if (!acc[city.state]) acc[city.state] = [];
      acc[city.state].push(city);
      return acc;
    }, {})
  ).map(([state, stateCities]) => `
  <div class="state-section">
    <div class="state-header">${state}</div>
    <div class="cities-grid">
      ${stateCities.map(city => `
      <a href="${city.slug}/" class="city-card">
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
  console.log('🏗️ Financial Advisor Static Site Builder');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Clean and create build directory
    await fs.remove('./build');
    await fs.ensureDir('./build');
    console.log('🧹 Cleaned build directory');
    
    // Get list of generated city data files
    const generatedDir = './data/generated';
    if (!await fs.pathExists(generatedDir)) {
      console.error('❌ No generated data found. Run "npm run generate:demo" or "npm run generate" first.');
      process.exit(1);
    }
    
    const generatedFiles = await fs.readdir(generatedDir);
    const citySlugs = generatedFiles
      .filter(file => file.endsWith('.json'))
      .map(file => path.basename(file, '.json'));
    
    if (citySlugs.length === 0) {
      console.error('❌ No city data files found in ./data/generated/');
      console.log('💡 Run "npm run generate:demo" to create demo data');
      process.exit(1);
    }
    
    console.log(`📋 Found ${citySlugs.length} cities to build:`);
    citySlugs.forEach(slug => console.log(`   • ${slug}`));
    console.log('');
    
    // Build all city sites
    let successCount = 0;
    for (const citySlug of citySlugs) {
      try {
        await buildCitySite(citySlug);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to build ${citySlug}: ${error.message}`);
      }
    }
    
    // Generate index page
    await generateIndexPage(citySlugs);
    
    console.log('\n🎉 Build Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successfully built: ${successCount}/${citySlugs.length} cities`);
    console.log(`📁 Static sites saved in: ./build/`);
    console.log(`🌐 Index page: ./build/index.html`);
    console.log('\n💡 Next step: Run "npm run dev" to preview sites locally');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
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