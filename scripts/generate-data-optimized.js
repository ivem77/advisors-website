const fs = require('fs-extra');
const { generateAllCityContent, validateDataStructure, RATE_LIMIT_DELAY } = require('./ai-content-optimized');

function getNearbyLocations(state) {
  const locationList = fs.readJsonSync('./data/cities.json');
  const stateCitiesByPopulationDesc = locationList.filter(location => location.state === state).sort((a, b) => b.population - a.population);
  return stateCitiesByPopulationDesc.slice(0, 8);
}

async function generateCityDataOptimized(city) {
  console.log(`\n🏙️ Generating optimized data for ${city.name}, ${city.state}...`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    console.log('🚀 Starting SINGLE API call for all content...');
    
    // Generate ALL content in a single API call (massive cost savings!)
    const allContent = await generateAllCityContent(city.name, city.state, city.population);
    
    console.log('🔍 Validating data consistency...');
    
    // Validate that we got all required data
    if (!allContent.landscape || !allContent.insights) {
      throw new Error('Missing required data sections from API response');
    }
    
    // Quick validation of critical fields
    const requiredLandscapeFields = ['heroDescription', 'landscapeDescription', 'majorIndustries', 'population', 'medianIncome', 'uniqueNeeds', 'citySpecificRiskAdvice'];
    if (!validateDataStructure(allContent.landscape, requiredLandscapeFields)) {
      throw new Error('Landscape data validation failed');
    }

    const nearbyLocations = getNearbyLocations(city.state);

    // Combine all data into city object
    const cityData = {
      cityName: city.name,
      state: city.state,
      slug: city.slug,
      population: city.population,
      
      // SEO
      pageTitle: `Best Financial Advisors in ${city.name}`,
      metaDescription: `Find top-rated financial advisors in ${city.name}. Expert guidance for retirement planning, wealth management, and investment strategies.`,
      
      // From single API call
      advisors: allContent.advisors,
      ...allContent.landscape,
      insights: allContent.insights.insights || allContent.insights,
      ...allContent.stats,
      nearbyLocations
    };

    // Save generated data
    await fs.ensureDir('./data/generated');
    await fs.writeJson(`./data/generated/${city.slug}.json`, cityData, { spaces: 2 });
    
    console.log(`✅ Generated optimized data for ${city.name}`);
    console.log(`📊 Stats: ${allContent.stats.registeredAdvisors} advisors, ${allContent.stats.averagePortfolio} avg portfolio`);
    console.log(`👥 Advisors: ${allContent.advisors.length} profiles created`);
    console.log(`🔍 Validation: All consistency checks passed`);
    console.log(`💾 Saved to: data/generated/${city.slug}.json`);
    console.log(`💰 Cost: 1 API call instead of 4-12!`);
    
    return cityData;
    
  } catch (error) {
    console.error(`❌ Error generating optimized data for ${city.name}:`, error.message);
    throw error;
  }
}

async function generateAllCityDataOptimized() {
  console.log('🤖 OPTIMIZED AI Financial Advisor Data Generator');
  console.log('💰 Uses GPT-4o mini + single calls for 95%+ cost savings');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is required');
    console.log('💡 Set it with: export OPENAI_API_KEY="your-api-key-here"');
    process.exit(1);
  }
  
  try {
    const cities = (await fs.readJson('./data/cities.json'));
    console.log(`📋 Found ${cities.length} cities to process`);
    console.log(`💰 Estimated cost reduction: ${cities.length * 3} fewer API calls vs original method\n`);
    
    let processedCount = 0;
    let skippedCount = 0;
    const startTime = Date.now();
    
    for (const city of cities) {
      const existingDataPath = `./data/generated/${city.slug}.json`;
      
      if (await fs.pathExists(existingDataPath)) {
        console.log(`⏭️ Skipping ${city.name} (data already exists)`);
        skippedCount++;
        continue;
      }
      
      await generateCityDataOptimized(city);
      processedCount++;
      
      // Enhanced rate limiting with progress tracking
      if (processedCount < cities.length - skippedCount) {
        const remaining = cities.length - skippedCount - processedCount;
        const elapsed = (Date.now() - startTime) / 1000;
        const estimatedTimeRemaining = (elapsed / processedCount) * remaining;
        
        console.log(`⏳ Rate limiting... waiting ${RATE_LIMIT_DELAY/1000}s (${remaining} cities remaining, ~${Math.round(estimatedTimeRemaining/60)}min left)`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    const avgTimePerCity = totalTime / processedCount;
    
    console.log('\n🎉 Optimized Generation Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Processed: ${processedCount} cities`);
    console.log(`⏭️ Skipped: ${skippedCount} cities (already existed)`);
    console.log(`⏱️ Total time: ${Math.round(totalTime/60)}m ${Math.round(totalTime%60)}s`);
    console.log(`📊 Average: ${avgTimePerCity.toFixed(1)}s per city`);
    console.log(`💰 API calls saved: ~${processedCount * 3} calls (75-90% cost reduction)`);
    console.log(`📁 Data files saved in: ./data/generated/`);
    console.log('\n💡 Next step: Run "npm run build" to generate static sites');
    
  } catch (error) {
    console.error('\n❌ Optimized generation failed:', error.message);
    process.exit(1);
  }
}

// Handle single city generation
async function generateSingleCityOptimized(citySlug) {
  try {
    const cities = await fs.readJson('./data/cities.json');
    const city = cities.find(c => c.slug === citySlug);
    
    if (!city) {
      console.error(`❌ City "${citySlug}" not found in cities.json`);
      process.exit(1);
    }
    
    await generateCityDataOptimized(city);
    console.log('\n🎉 Single city optimized generation complete!');
    
  } catch (error) {
    console.error('\n❌ Optimized generation failed:', error.message);
    process.exit(1);
  }
}

// Run the appropriate function based on command line args
if (require.main === module) {
  const citySlug = process.argv[2];
  if (citySlug) {
    generateSingleCityOptimized(citySlug);
  } else {
    generateAllCityDataOptimized();
  }
}

module.exports = {
  generateCityDataOptimized,
  generateAllCityDataOptimized,
  generateSingleCityOptimized
}; 