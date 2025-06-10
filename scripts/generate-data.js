// Load environment variables from .env file
require('dotenv').config();

const fs = require('fs-extra');
const { generateAdvisors, generateCityStats, generateLandscapeData, generateMarketInsights } = require('./ai-content');

function getNearbyLocations(state) {
  const locationList = fs.readJsonSync('./data/location-map.json');
  const stateCities = locationList.filter(location => location.state === state).map(location => location.name);
  return stateCities.slice(0, 8);
}

async function generateCityData(city) {
  console.log(`\n🏙️ Generating data for ${city.name}, ${city.state}...`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Generate landscape data first to get consistent median income
    console.log('🚀 Starting AI content generation...');
    const landscape = await generateLandscapeData(city.name, city.state, city.population);
    
    // Generate other content in parallel, passing median income to ensure consistency
    const [advisors, insights, stats] = await Promise.all([
      generateAdvisors(city.name, city.state),
      generateMarketInsights(city.name, city.state, landscape.medianIncome),
      generateCityStats(city.name, city.state, city.population)
    ]);

    // Cross-validate data consistency
    console.log('🔍 Validating data consistency...');
    const { validateMedianIncomeConsistency } = require('./ai-content');
    
    if (!validateMedianIncomeConsistency(landscape, insights)) {
      throw new Error('Cross-validation failed: Median income inconsistency detected');
    }

    // Combine all data into city object
    const cityData = {
      cityName: city.name,
      state: city.state,
      slug: city.slug,
      population: city.population,
      advisors,
      ...landscape,
      insights: insights.insights || insights,
      ...stats
    };

    // Save generated data
    await fs.ensureDir('./data/generated');
    await fs.writeJson(`./data/generated/${city.slug}.json`, cityData, { spaces: 2 });
    
    console.log(`✅ Generated data for ${city.name}`);
    console.log(`📊 Stats: ${stats.registeredAdvisors} advisors, ${stats.averagePortfolio} avg portfolio`);
    console.log(`👥 Advisors: ${advisors.length} profiles created`);
    console.log(`🔍 Validation: All consistency checks passed`);
    console.log(`💾 Saved to: data/generated/${city.slug}.json`);
    
    return cityData;
    
  } catch (error) {
    console.error(`❌ Error generating data for ${city.name}:`, error.message);
    throw error;
  }
}

async function generateAllCityData() {
  console.log('🤖 AI Financial Advisor Data Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is required');
    console.log('💡 Set it with: export OPENAI_API_KEY="your-api-key-here"');
    process.exit(1);
  }
  
  try {
    const cities = await fs.readJson('./data/cities.json');
    console.log(`📋 Found ${cities.length} cities to process`);
    
    let processedCount = 0;
    let skippedCount = 0;
    
    for (const city of cities) {
      const existingDataPath = `./data/generated/${city.slug}.json`;
      
      if (await fs.pathExists(existingDataPath)) {
        console.log(`⏭️ Skipping ${city.name} (data already exists)`);
        skippedCount++;
        continue;
      }
      
      await generateCityData(city);
      processedCount++;
      
      // Rate limiting to avoid hitting OpenAI limits
      if (processedCount < cities.length - skippedCount) {
        console.log('⏳ Rate limiting... waiting 2 seconds');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n🎉 Generation Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Processed: ${processedCount} cities`);
    console.log(`⏭️ Skipped: ${skippedCount} cities (already existed)`);
    console.log(`📁 Data files saved in: ./data/generated/`);
    console.log('\n💡 Next step: Run "npm run build" to generate static sites');
    
  } catch (error) {
    console.error('\n❌ Generation failed:', error.message);
    process.exit(1);
  }
}

// Handle single city generation
async function generateSingleCity(citySlug) {
  try {
    const cities = await fs.readJson('./data/cities.json');
    const city = cities.find(c => c.slug === citySlug);
    
    if (!city) {
      console.error(`❌ City "${citySlug}" not found in cities.json`);
      process.exit(1);
    }
    
    await generateCityData(city);
    console.log('\n🎉 Single city generation complete!');
    
  } catch (error) {
    console.error('\n❌ Generation failed:', error.message);
    process.exit(1);
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Generate single city
    generateSingleCity(args[0]);
  } else {
    // Generate all cities
    generateAllCityData();
  }
}

module.exports = { generateCityData, generateAllCityData, generateSingleCity }; 