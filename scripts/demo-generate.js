const fs = require('fs-extra');

// Mock AI content generation functions for demo purposes
function mockGenerateAdvisors(cityName, state, count = 5) {
  console.log(`🤖 Generating ${count} advisor profiles for ${cityName}, ${state}...`);
  
  const advisors = [
    {
      name: "Sarah Johnson",
      firm: "Morgan Stanley Wealth Management",
      rating: "4.8",
      specializations: ["Retirement Planning", "Tax Planning", "Estate Planning"],
      bio: `With over 20 years of experience, Sarah specializes in comprehensive financial planning for ${cityName} professionals. She holds CFP and CFA designations and focuses on helping clients achieve long-term financial security.`
    },
    {
      name: "Michael Rodriguez",
      firm: "Edward Jones",
      rating: "4.7",
      specializations: ["Wealth Management", "Investment Strategies", "Portfolio Management"],
      bio: `Michael brings 18 years of investment expertise to ${cityName} clients. He specializes in portfolio optimization and risk management, helping high-net-worth individuals grow and preserve their wealth.`
    },
    {
      name: "Jennifer Chen",
      firm: "Charles Schwab",
      rating: "4.9",
      specializations: ["Financial Planning", "Retirement", "Risk Management"],
      bio: `Jennifer is a veteran financial advisor with 25 years of experience serving ${cityName} families. She excels at creating personalized retirement strategies and comprehensive financial plans.`
    },
    {
      name: "David Thompson",
      firm: "Fidelity Investments",
      rating: "4.8",
      specializations: ["Estate Planning", "Wealth Transfer", "Tax Planning"],
      bio: `David has 22 years of experience helping ${cityName} business owners and executives with complex estate planning needs. He specializes in wealth transfer strategies and tax optimization.`
    },
    {
      name: "Amanda Williams",
      firm: "Raymond James",
      rating: "4.7",
      specializations: ["Investment Strategies", "Portfolio Management", "Financial Planning"],
      bio: `Amanda brings 19 years of investment management experience to her ${cityName} practice. She focuses on evidence-based investing and helping clients achieve their financial goals through disciplined portfolio management.`
    }
  ];
  
  return advisors.slice(0, count);
}

function mockGenerateCityStats(cityName, state, population) {
  console.log(`📊 Generating stats for ${cityName}, ${state}...`);
  
  // Scale stats based on population
  const advisorCount = Math.floor(population / 300); // Rough ratio
  const portfolioSize = population > 1000000 ? "$1.3M" : population > 500000 ? "$1.1M" : "$950K";
  const fee = population > 1000000 ? "0.92%" : "0.98%";
  const rating = (4.5 + Math.random() * 0.3).toFixed(1);
  
  return {
    registeredAdvisors: `${advisorCount.toLocaleString()}+`,
    averagePortfolio: portfolioSize,
    averageAumFee: fee,
    averageRating: `${rating}/5.0`
  };
}

function mockGenerateLandscapeData(cityName, state, population) {
  console.log(`🏙️ Generating landscape data for ${cityName}, ${state}...`);
  
  const templates = {
    'Dallas': {
      landscapeDescription: `Dallas is a major economic hub in Texas and home to numerous Fortune 500 companies. The city's diverse economy spans technology, finance, telecommunications, and defense. Dallas financial advisors often specialize in executive compensation packages and serve clients across various high-growth industries.`,
      majorIndustries: "Technology, Finance, Telecommunications, Defense",
      population: "1.3 million (metro: 7.6 million)",
      medianIncome: "$54,747",
      uniqueNeeds: "Executive compensation planning, tech stock management, business succession planning",
      citySpecificRiskAdvice: "Given Dallas's exposure to severe weather including tornadoes and hail, ensure your advisor incorporates property protection and disaster preparedness into your financial plan."
    },
    'Austin': {
      landscapeDescription: `Austin is Texas's capital and a thriving tech hub known as "Silicon Hills." The city attracts young professionals and entrepreneurs with its vibrant startup ecosystem. Austin financial advisors frequently work with tech employees managing stock options and RSUs from rapidly growing companies.`,
      majorIndustries: "Technology, Government, Healthcare, Education",
      population: "975,000 (metro: 2.3 million)",
      medianIncome: "$73,800",
      uniqueNeeds: "Stock option planning, startup equity strategies, young professional wealth building",
      citySpecificRiskAdvice: "With Austin's rapid growth and real estate appreciation, advisors should address housing affordability and concentrated tech sector exposure in financial plans."
    }
  };
  
  return templates[cityName] || {
    landscapeDescription: `${cityName} is a growing city in ${state} with a diverse economy and expanding financial services sector. Local financial advisors serve a mix of professionals, business owners, and retirees with varying investment needs and goals.`,
    majorIndustries: "Healthcare, Manufacturing, Education, Services",
    population: `${Math.floor(population / 1000)}K`,
    medianIncome: "$62,500",
    uniqueNeeds: "Retirement planning, education funding, small business financial strategies",
    citySpecificRiskAdvice: `Consider local economic factors and regional risks when planning your financial strategy in ${cityName}.`
  };
}

function mockGenerateMarketInsights(cityName, state) {
  console.log(`💡 Generating market insights for ${cityName}, ${state}...`);
  
  return {
    insights: [
      {
        category: "Market Insights",
        sections: [
          {
            title: "Local Wealth Demographics",
            description: `${cityName} has a growing population of high-net-worth individuals, creating demand for sophisticated financial planning services and wealth management expertise.`
          },
          {
            title: "Fee Structure Trends",
            description: `Most ${cityName} advisors charge between 0.85% to 1.25% of assets under management, with competitive rates for larger portfolios and comprehensive planning services.`
          },
          {
            title: "Advisor Specializations",
            description: `${cityName} advisors often specialize in serving specific industries or demographics, offering targeted expertise in areas like executive compensation and retirement planning.`
          }
        ]
      },
      {
        category: "Local Considerations",
        sections: [
          {
            title: "Cost of Living",
            description: `${cityName}'s cost of living impacts retirement planning strategies and investment goals, with advisors helping clients optimize for local economic conditions.`
          },
          {
            title: "Real Estate Market",
            description: `Local advisors provide expertise in ${cityName}'s real estate market, helping clients integrate property investments into their overall wealth management strategy.`
          },
          {
            title: "Economic Growth",
            description: `${cityName}'s economic development creates opportunities for wealth building, with advisors helping clients capitalize on local growth trends and market conditions.`
          }
        ]
      }
    ]
  };
}

function getNearbyLocations(cityName, state) {
  const locationMap = {
    'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi'],
    'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Fresno'],
    // Add more states as needed
  };
  
  const stateCities = locationMap[state] || [];
  return stateCities.filter(city => city !== cityName).slice(0, 8);
}

async function generateCityData(city) {
  console.log(`\n🏙️ Generating DEMO data for ${city.name}, ${city.state}...`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Generate all mock content
    console.log('🚀 Starting mock content generation...');
    const advisors = mockGenerateAdvisors(city.name, city.state);
    const stats = mockGenerateCityStats(city.name, city.state, city.population);
    const landscape = mockGenerateLandscapeData(city.name, city.state, city.population);
    const insights = mockGenerateMarketInsights(city.name, city.state);

    // Combine all data into city object
    const cityData = {
      cityName: city.name,
      state: city.state,
      slug: city.slug,
      
      // SEO
      pageTitle: `Best Financial Advisors in ${city.name}`,
      metaDescription: `Find top-rated financial advisors in ${city.name}. Expert guidance for retirement planning, wealth management, and investment strategies.`,
      
      // Hero
      heroDescription: `Find top-rated local financial advisors who can help you achieve your financial goals with personalized strategies and expert guidance.`,
      
      // Stats (from mock)
      ...stats,
      
      // Landscape (from mock)
      ...landscape,
      
      // Insights (from mock)
      ...insights,
      
      // Advisors (from mock)
      advisors,
      
      // Nearby locations
      nearbyLocations: getNearbyLocations(city.name, city.state)
    };

    // Save generated data
    await fs.ensureDir('./data/generated');
    await fs.writeJson(`./data/generated/${city.slug}.json`, cityData, { spaces: 2 });
    
    console.log(`✅ Generated DEMO data for ${city.name}`);
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
  console.log('🎭 DEMO Financial Advisor Data Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 Note: This demo uses mock data instead of AI generation');
  console.log('🔑 For real AI generation, set OPENAI_API_KEY and use: npm run generate\n');
  
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
      
      // Small delay for demo effect
      if (processedCount < cities.length - skippedCount) {
        console.log('⏳ Simulating rate limiting... waiting 1 second');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n🎉 DEMO Generation Complete!');
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

async function generateSingleCity(citySlug) {
  try {
    const cities = await fs.readJson('./data/cities.json');
    const city = cities.find(c => c.slug === citySlug);
    
    if (!city) {
      console.error(`❌ City "${citySlug}" not found in cities.json`);
      process.exit(1);
    }
    
    await generateCityData(city);
    console.log('\n🎉 Single city DEMO generation complete!');
    
  } catch (error) {
    console.error('\n❌ Generation failed:', error.message);
    process.exit(1);
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    generateSingleCity(args[0]);
  } else {
    generateAllCityData();
  }
}

module.exports = { generateCityData, generateAllCityData, generateSingleCity }; 