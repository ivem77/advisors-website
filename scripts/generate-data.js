// Load environment variables from .env file
require('dotenv').config();

const fs = require('fs-extra');
const { generateAdvisors, generateCityStats, generateLandscapeData, generateMarketInsights } = require('./ai-content');

function getNearbyLocations(cityName, state) {
  // Logic to determine nearby cities based on geography
  const locationMap = {
    'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Lubbock', 'Irving', 'Laredo', 'Garland', 'Frisco', 'McKinney'],
    'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Fresno', 'Long Beach', 'Oakland', 'Anaheim', 'Santa Ana', 'Riverside', 'Stockton', 'Irvine', 'Fremont'],
    'Florida': ['Miami', 'Tampa', 'Orlando', 'Jacksonville', 'Fort Lauderdale', 'Tallahassee', 'St. Petersburg', 'Hialeah', 'Gainesville', 'Coral Springs', 'West Palm Beach'],
    'New York': ['New York City', 'Buffalo', 'Rochester', 'Syracuse', 'Albany', 'Yonkers', 'New Rochelle', 'Mount Vernon'],
    'Illinois': ['Chicago', 'Aurora', 'Springfield', 'Peoria', 'Rockford', 'Elgin', 'Joliet', 'Naperville'],
    'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem'],
    'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Canton'],
    'Georgia': ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens', 'Macon'],
    'North Carolina': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Asheville'],
    'Michigan': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Lansing', 'Ann Arbor'],
    'Tennessee': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville'],
    'Virginia': ['Virginia Beach', 'Norfolk', 'Richmond', 'Newport News', 'Alexandria'],
    'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue'],
    'Arizona': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Glendale', 'Scottsdale'],
    'Massachusetts': ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell'],
    'Indiana': ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend'],
    'Missouri': ['Kansas City', 'St. Louis', 'Springfield', 'Columbia'],
    'Maryland': ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg'],
    'Wisconsin': ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha'],
    'Colorado': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins'],
    'Minnesota': ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth'],
    'South Carolina': ['Charleston', 'Columbia', 'North Charleston', 'Greenville'],
    'Alabama': ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville'],
    'Louisiana': ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'],
    'Kentucky': ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro'],
    'Oregon': ['Portland', 'Salem', 'Eugene', 'Gresham'],
    'Oklahoma': ['Oklahoma City', 'Tulsa', 'Norman', 'Lawton'],
    'Connecticut': ['Bridgeport', 'New Haven', 'Hartford', 'Stamford'],
    'Utah': ['Salt Lake City', 'West Valley City', 'Provo', 'Ogden'],
    'Iowa': ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City'],
    'Nevada': ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas'],
    'Arkansas': ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale'],
    'Kansas': ['Wichita', 'Overland Park', 'Kansas City', 'Topeka'],
    'Mississippi': ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg'],
    'New Mexico': ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe'],
    'Nebraska': ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island'],
    'West Virginia': ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg'],
    'Idaho': ['Boise', 'Meridian', 'Nampa', 'Idaho Falls'],
    'Hawaii': ['Honolulu', 'Pearl City', 'Hilo', 'Kailua'],
    'New Hampshire': ['Manchester', 'Nashua', 'Concord', 'Rochester'],
    'Maine': ['Portland', 'Lewiston', 'Bangor', 'Auburn'],
    'Montana': ['Billings', 'Missoula', 'Great Falls', 'Bozeman'],
    'Rhode Island': ['Providence', 'Warwick', 'Cranston', 'Pawtucket'],
    'Delaware': ['Wilmington', 'Dover', 'Newark', 'Middletown'],
    'South Dakota': ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings'],
    'North Dakota': ['Fargo', 'Bismarck', 'Grand Forks', 'Minot'],
    'Alaska': ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka'],
    'Vermont': ['Burlington', 'Essex', 'South Burlington', 'Colchester'],
    'Wyoming': ['Cheyenne', 'Casper', 'Laramie', 'Gillette']
  };
  
  const stateCities = locationMap[state] || [];
  return stateCities.filter(city => city !== cityName).slice(0, 8);
}

async function generateCityData(city) {
  console.log(`\n🏙️ Generating data for ${city.name}, ${city.state}...`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Generate all AI content in parallel for speed
    console.log('🚀 Starting AI content generation...');
    const [advisors, landscape, insights, stats] = await Promise.all([
      generateAdvisors(city.name, city.state),
      generateLandscapeData(city.name, city.state, city.population),
      generateMarketInsights(city.name, city.state),
      generateCityStats(city.name, city.state, city.population)
    ]);

    // Combine all data into city object
    const cityData = {
      cityName: city.name,
      state: city.state,
      slug: city.slug,
      population: city.population,
      heroDescription: city.heroDescription,
      advisors,
      ...landscape,
      insights,
      ...stats
    };

    // Save generated data
    await fs.ensureDir('./data/generated');
    await fs.writeJson(`./data/generated/${city.slug}.json`, cityData, { spaces: 2 });
    
    console.log(`✅ Generated data for ${city.name}`);
    console.log(`📊 Stats: ${stats.registeredAdvisors} advisors, ${stats.averagePortfolio} avg portfolio`);
    console.log(`👥 Advisors: ${advisors.length} profiles created`);
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