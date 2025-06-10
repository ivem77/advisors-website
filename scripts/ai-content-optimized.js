require('dotenv').config();
const OpenAI = require('openai');
const getAdvisors = require('./advisor-fetcher');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Use GPT-4o mini for optimal cost/quality balance
const MODEL = "gpt-4o-mini";
const MAX_RETRIES = 2; // Reduced from 3
const RATE_LIMIT_DELAY = 3000; // 3 seconds between calls

// Rate limiting helper
async function rateLimitedApiCall(apiCall, delay = RATE_LIMIT_DELAY) {
  const result = await apiCall();
  await new Promise(resolve => setTimeout(resolve, delay));
  return result;
}

// Validation functions (keeping existing ones)
function validateCrossCityData(cityName, businessDescription) {
  const fortunePattern = /(\d+)\s+Fortune\s+500\s+companies/i;
  const match = businessDescription.match(fortunePattern);
  
  if (match) {
    const count = parseInt(match[1]);
    console.log(`🔍 ${cityName} Fortune 500 count detected: ${count}`);
    
    const correctCounts = {
      'Dallas': 21,
      'Houston': 26,
      'Austin': 3
    };
    
    if (correctCounts[cityName] && count !== correctCounts[cityName]) {
      console.error(`❌ ${cityName} Fortune 500 count incorrect: expected ${correctCounts[cityName]}, got ${count}`);
      throw new Error(`Fortune 500 count for ${cityName} must be ${correctCounts[cityName]}, not ${count}`);
    }
  }
  
  return true;
}

function validateDataStructure(data, requiredFields) {
  for (const field of requiredFields) {
    if (!data[field] || data[field].trim() === '') {
      console.error(`❌ Missing or empty required field: ${field}`);
      return false;
    }
  }
  return true;
}

// Optimized: Generate all content in a single API call
async function generateAllCityContent(cityName, state, population) {
  console.log(`🤖 Generating ALL content for ${cityName}, ${state} in single API call...`);
  
  // Condensed prompt that generates everything at once
  const prompt = `Generate complete landscape data for ${cityName}, ${state} in a single response.

REQUIREMENTS:
- Generate high-quality, structured JSON response
- Base on real, recent data (2023-2024)
- Keep descriptions concise but comprehensive (under 150 words each)
- Use exact population: ${population}
- Ensure all JSON fields are properly formatted

VERIFIED DATA TO USE:
Dallas: 1,288,457 population (metro: 7.8M), 21 Fortune 500 companies, major employers: AT&T, American Airlines
Houston: 2,288,250 population (metro: 7.3M), 26 Fortune 500 companies, major employers: ExxonMobil, Phillips 66  
Austin: 964,177 population (metro: 2.4M), 3 Fortune 500 companies, major employers: Dell, UT, Apple

SPECIFIC RISK MANAGEMENT REQUIREMENTS for citySpecificRiskAdvice field:
- 150-250 characters of comprehensive, location-specific risk advice
- Include specific industry concentration risks (tech, energy, finance)
- Address real estate/housing market risks and bubble concerns  
- Mention weather/natural disaster risks (hurricanes, tornadoes, flooding)
- Include economic diversification recommendations
- Use real data and specific local factors
- Examples: "Austin's tech concentration requires diversification beyond growth stocks. Rapid housing appreciation creates bubble risk - consider geographic investment spread."

POPULATION FORMATTING REQUIREMENTS:
- Format as "X.XM (metro: X.XM)" using verified data above
- Dallas: "1.3M (metro: 7.8M)"
- Houston: "2.3M (metro: 7.3M)" 
- Austin: "964K (metro: 2.4M)"
- Use proper abbreviations (M for millions, K for thousands under 1M)

Return ONLY this JSON structure:
{
  "stats": {
    "registeredAdvisors": "1,200+",
    "averageRating": "4.6/5.0"
  },  
"landscape": {
    "heroDescription": "Brief description",
    "landscapeDescription": "2-sentence economic overview",
    "majorIndustries": "Industry1, Industry2, Industry3",
    "population": "1.3M (metro: 7.8M)",
    "medianIncome": "$XX,XXX",
    "uniqueNeeds": "Under 200 chars",
    "citySpecificRiskAdvice": "150-200 character comprehensive risk advice specific to ${cityName}. Include: industry concentration risks, real estate risks, natural disaster risks, economic risks. Be specific and data-driven."
  },
  "insights": {
    "insights": [
      {
        "category": "Market Insights",
        "sections": [
          {
            "title": "Economic Growth",
            "description": "According to BEA (2023), brief economic data..."
          },
          {
            "title": "Wealth Demographics", 
            "description": "According to Census (2023), median income data..."
          },
          {
            "title": "Advisor Specializations",
            "description": "Based on BLS (2023), advisor trends..."
          }
        ]
      },
      {
        "category": "Local Considerations",
        "sections": [
          {
            "title": "Cost of Living",
            "description": "According to BLS (2024), cost trends..."
          },
          {
            "title": "Real Estate Market",
            "description": "According to Zillow (2024), market data..."
          },
          {
            "title": "Business Environment", 
            "description": "According to Fortune (2024), business climate..."
          }
        ]
      }
    ]
  }
}`;

  let attempt = 1;
  while (attempt <= MAX_RETRIES) {
    try {
      const response = await rateLimitedApiCall(() => 
        openai.chat.completions.create({
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 2500 // Increased for single comprehensive response
        })
      );

      const content = response.choices[0].message.content.trim();
      let jsonStr = content;
      
      // Extract JSON from response
      if (content.includes('```')) {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }
      }

      const allData = JSON.parse(jsonStr);
      
      // Validate structure
      if (!allData.landscape || !allData.insights) {
        throw new Error('Missing required data sections');
      }
      
      // Quick validation
      const requiredLandscapeFields = ['heroDescription', 'landscapeDescription', 'majorIndustries', 'population', 'medianIncome', 'uniqueNeeds', 'citySpecificRiskAdvice'];
      if (!validateDataStructure(allData.landscape, requiredLandscapeFields)) {
        throw new Error('Landscape data validation failed');
      }
      
      // Validate character limits
      if (allData.landscape.uniqueNeeds.length > 200) {
        if (attempt < MAX_RETRIES) {
          console.warn(`⚠️ Attempt ${attempt}: Unique needs too long, retrying...`);
          attempt++;
          continue;
        } else {
          // Truncate instead of failing
          allData.landscape.uniqueNeeds = allData.landscape.uniqueNeeds.substring(0, 197) + '...';
          console.warn(`⚠️ Truncated uniqueNeeds to fit 200 char limit`);
        }
      }
      
      if (allData.landscape.citySpecificRiskAdvice.length > 250) {
        if (attempt < MAX_RETRIES) {
          console.warn(`⚠️ Attempt ${attempt}: Risk advice too long, retrying...`);
          attempt++;
          continue;
        } else {
          // Truncate instead of failing
          allData.landscape.citySpecificRiskAdvice = allData.landscape.citySpecificRiskAdvice.substring(0, 250) + '...';
          console.warn(`⚠️ Truncated citySpecificRiskAdvice to fit 250 char limit`);
        }
      }
      
      // Validate cross-city data
      for (const category of allData.insights.insights) {
        for (const section of category.sections) {
          if (section.title === 'Business Environment') {
            validateCrossCityData(cityName, section.description);
          }
        }
      }

      console.log(`🤖 Fetching advisors for ${cityName}, ${state}...`);
      allData.advisors = await getAdvisors(cityName, state);
      console.log(`✅ Advisors fetched for ${cityName}, ${state}`);

      const numberOfAdvisorsEstimate = Math.max(
        Math.floor(population / 1000),
        allData.advisors.length
      );

      // Format number with commas
      const formatNumber = (num) => num.toLocaleString();

      const roundedEstimate =
        numberOfAdvisorsEstimate > 1000
          ? Math.floor(numberOfAdvisorsEstimate / 100) * 100
          : Math.floor(numberOfAdvisorsEstimate / 10) * 10;

      const prettyNumberOfAdvisorsEstimate = `${formatNumber(roundedEstimate)}+`;
      console.log("Setting number of advisors: " + prettyNumberOfAdvisorsEstimate);
      allData.stats.registeredAdvisors = prettyNumberOfAdvisorsEstimate;


      const averageAdvisorRating = allData.advisors.reduce((acc, advisor) => acc + advisor.rating, 0) / allData.advisors.length;
      console.log(" Setting average rating: " + averageAdvisorRating);
      allData.stats.averageRating = `${averageAdvisorRating.toFixed(1)}/5.0`;

      console.log(`✅ Generated all content for ${cityName} in single API call (attempt ${attempt})`);
      return allData;
      
    } catch (error) {
      console.log(allData);
      console.error(`❌ Attempt ${attempt} failed for ${cityName}:`, error.message);
      
      if (attempt >= MAX_RETRIES) {
        console.error(`❌ All attempts failed for ${cityName}`);
        throw error;
      }
      
      attempt++;
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY * attempt));
    }
  }
}

module.exports = {
  generateAllCityContent, // New optimized function
  validateDataStructure,
  validateCrossCityData,
  rateLimitedApiCall,
  MODEL,
  MAX_RETRIES,
  RATE_LIMIT_DELAY
}; 