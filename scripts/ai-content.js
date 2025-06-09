const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Validation functions
function validateCrossCityData(cityName, businessDescription) {
  // Check for suspicious Fortune 500 counts that are identical between cities
  const fortunePattern = /(\d+)\s+Fortune\s+500\s+companies/i;
  const match = businessDescription.match(fortunePattern);
  
  if (match) {
    const count = parseInt(match[1]);
    console.log(`🔍 ${cityName} Fortune 500 count detected: ${count}`);
    
    // Validate against known correct counts
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

function validateSuspiciousData(cityName, data) {
  const text = JSON.stringify(data).toLowerCase();
  
  // Check for overly precise fabricated-looking statistics
  const suspiciousPatterns = [
    /gdp was \$[\d,]+\.[\d] billion/i, // Overly precise GDP
    /growth.*of.*[\d]+\.[\d]{2,}%/i,   // Overly precise percentages
    /increased.*by.*[\d]+\.[\d]{2,}%/i, // Overly precise increases
    /[\d]+\.[\d]{3,}%/i,               // Numbers with 3+ decimal places
  ];
  
  const foundSuspicious = [];
  for (const pattern of suspiciousPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      foundSuspicious.push(matches[0]);
    }
  }
  
  if (foundSuspicious.length > 0) {
    console.warn(`⚠️ ${cityName}: Suspicious overly-precise data detected: ${foundSuspicious.join(', ')}`);
    // Don't throw error, just warn for now
  }
  
  return true;
}

function validateEconomicClaims(cityName, insights) {
  for (const category of insights) {
    for (const section of category.sections) {
      const desc = section.description;
      
      // Check for unrealistic economic claims
      const unrealisticPatterns = [
        /gdp.*\$[\d,]+\.[\d] billion.*growth.*[\d]+\.[\d]{2,}%/i, // Overly specific GDP + growth
        /home.*value.*\$[\d,]+,[\d]{3}/i, // Overly precise home values
        /median.*\$[\d,]+,[\d]{3}/i,      // Overly precise medians (not income)
      ];
      
      for (const pattern of unrealisticPatterns) {
        if (desc.match(pattern)) {
          console.warn(`⚠️ ${cityName}: Potentially unrealistic economic claim in ${section.title}: ${desc.substring(0, 100)}...`);
        }
      }
    }
  }
  
  return true;
}

function validateSourceCitation(text, requiredSources = []) {
  // Accept both "According to" and "Based on" patterns, with flexible punctuation
  const citationPattern = /(According to|Based on).+ \(\d{4}\)[,.]?\s*/;
  const hasProperCitation = citationPattern.test(text);
  
  if (!hasProperCitation) {
    console.warn(`⚠️ Citation format issue in: ${text.substring(0, 100)}...`);
    console.warn(`⚠️ Expected: "According to [Source] (YEAR)" or "Based on [Source] (YEAR)"`);
    return false;
  }
  return true;
}

function validateMedianIncomeConsistency(landscapeData, insightsData) {
  const landscapeIncome = landscapeData.medianIncome;
  const insightsText = JSON.stringify(insightsData);
  
  // Extract income from landscape data (remove "According to..." prefix if present)
  const incomeMatch = landscapeIncome.match(/\$[\d,]+/);
  if (!incomeMatch) {
    console.error(`❌ Invalid median income format: ${landscapeIncome}`);
    return false;
  }
  
  const incomeValue = incomeMatch[0];
  
  // Check if the same income appears in insights
  if (insightsText.includes('median household income') && !insightsText.includes(incomeValue)) {
    console.error(`❌ Median income inconsistency: Landscape has ${incomeValue} but insights don't match`);
    return false;
  }
  
  console.log(`✅ Median income consistent: ${incomeValue}`);
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

function validateInsightsStructure(insights) {
  if (!insights || !insights.insights || !Array.isArray(insights.insights)) {
    console.error(`❌ Invalid insights structure`);
    return false;
  }
  
  const requiredCategories = ['Market Insights', 'Local Considerations'];
  const requiredMarketSections = ['Economic Growth', 'Wealth Demographics', 'Advisor Specializations'];
  const requiredLocalSections = ['Cost of Living', 'Real Estate Market', 'Business Environment'];
  
  for (const category of insights.insights) {
    if (!requiredCategories.includes(category.category)) {
      console.error(`❌ Missing required category: ${category.category}`);
      return false;
    }
    
    const expectedSections = category.category === 'Market Insights' ? requiredMarketSections : requiredLocalSections;
    const actualSections = category.sections.map(s => s.title);
    
    for (const expectedSection of expectedSections) {
      if (!actualSections.includes(expectedSection)) {
        console.error(`❌ Missing required section: ${expectedSection} in ${category.category}`);
        return false;
      }
    }
    
    // Validate source citations in each section
    for (const section of category.sections) {
      if (!validateSourceCitation(section.description)) {
        console.error(`❌ Invalid citation in ${section.title}: ${section.description}`);
        return false;
      }
    }
  }
  
  console.log(`✅ Insights structure validation passed`);
  return true;
}

async function generateAdvisors(cityName, state, count = 5) {
  console.log(`🤖 Generating ${count} advisor profiles for ${cityName}, ${state}...`);
  
  const prompt = `Generate ${count} realistic financial advisor profiles for ${cityName}, ${state}. 

Requirements:
- Realistic names (mix of ethnicities appropriate for the city)
- Real financial advisory firms (Morgan Stanley, Edward Jones, Charles Schwab, Fidelity, Wells Fargo Advisors, Raymond James, etc.)
- Ratings between 4.7-4.9 (no decimals beyond tenths)
- 2-3 specializations each from: Retirement Planning, Tax Planning, Estate Planning, Wealth Management, Investment Strategies, Portfolio Management, Financial Planning, Risk Management, etc.
- Professional 40-80 word bio mentioning years of experience (15-35 years) and key expertise
- Make them sound like real, credible professionals

Return as valid JSON array with exactly this structure:
[
  {
    "name": "First Last",
    "firm": "Firm Name",
    "rating": "4.8",
    "specializations": ["Specialty1", "Specialty2", "Specialty3"],
    "bio": "Professional bio here..."
  }
]`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content.trim();
    
    // Extract JSON from response (handle code blocks)
    let jsonStr = content;
    if (content.includes('```')) {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error(`❌ Error generating advisors for ${cityName}:`, error.message);
    throw error;
  }
}

async function generateCityStats(cityName, state, population) {
  console.log(`📊 Generating city statistics for ${cityName}, ${state}...`);
  
  const prompt = `Generate realistic financial advisor statistics for ${cityName}, ${state} using current industry standards and most recent verified sources.

REQUIRED APPROACH:
- Use most recent market characteristics and city size for scaling (2023-2024 data when available)
- Base estimates on verified recent industry reports and market analysis
- Ensure numbers are realistic and proportional to ${cityName}'s current economic profile

SCALING GUIDELINES based on ${cityName}'s verified recent market size:
1. registeredAdvisors: Scale based on most recent population and wealth demographics
   - Research actual advisor density in similar markets from recent data
   - Format: "2,100+" or "1,850+"

2. averagePortfolio: Base on most recent median income and wealth data for ${cityName}
   - Use realistic ranges based on verified recent demographic data
   - Format: "$1.2M" (typical range: $800K-$2.5M)

3. averageAumFee: Use standard current industry rates from verified recent sources
   - Reference actual current market competition levels in ${cityName}
   - Format: "0.95%" (typical range: 0.75%-1.25%)

4. averageRating: Use realistic advisor rating distributions from recent platforms
   - Base on actual recent review platform data patterns
   - Format: "4.6/5.0" (typical range: 4.3-4.8/5.0)

Research ${cityName}'s most recent market characteristics, current competition levels, and recent wealth demographics to provide realistic 2023-2024 estimates.

Return ONLY valid JSON:
{
  "registeredAdvisors": "string",
  "averagePortfolio": "string", 
  "averageAumFee": "string",
  "averageRating": "string"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const statsData = JSON.parse(response.choices[0].message.content);
    console.log(`✅ Generated city statistics for ${cityName}`);
    return statsData;
  } catch (error) {
    console.error(`❌ Error generating city statistics:`, error);
    // Fallback with reasonable defaults
    return {
      registeredAdvisors: "1,200+",
      averagePortfolio: "$1.1M",
      averageAumFee: "0.95%",
      averageRating: "4.5/5.0"
    };
  }
}

async function generateLandscapeData(cityName, state, population) {
  console.log(`🏙️ Generating landscape data for ${cityName}, ${state}...`);
  
  let attempt = 1;
  const maxAttempts = 3;
  
  const prompt = `Generate FACTUAL, REAL data for ${cityName}, ${state} using ONLY the most recent available data from specified sources.

REQUIRED SOURCES (use ONLY the newest data available):
- Population: U.S. Census Bureau Vintage 2024 estimates (July 1, 2024) - USE EXACT OFFICIAL FIGURES
- Median Income: U.S. Census Bureau American Community Survey 2022-2023 (use the MOST RECENT year available)
- GDP/Economic: Bureau of Economic Analysis 2023 data (most recent available)
- Industries: Bureau of Labor Statistics 2023-2024 employment data
- Cost of Living: Bureau of Labor Statistics 2023-2024 Consumer Price Index
- Real Estate: Zillow 2024 data or most current available

IMPORTANT: Use the EXACT SAME median income value throughout ALL sections. Always specify the MOST RECENT year available for each source.

CITATION FORMAT: Always format as "According to [Source] ([MOST RECENT YEAR]), [specific data]"

Generate data using this EXACT structure:

1. heroDescription: 1-2 professional sentences about finding financial advisors in ${cityName}

2. landscapeDescription: 2-3 sentences about ${cityName}'s actual economy using verified major employers and most recent economic facts
   VERIFIED MAJOR EMPLOYERS (use only these confirmed ones):
   - Dallas: AT&T, Texas Health Resources, American Airlines, Lockheed Martin
   - Houston: ExxonMobil, Phillips 66, MD Anderson, Shell, Chevron
   - Austin: Dell Technologies, University of Texas, State of Texas, IBM, Apple

3. majorIndustries: Top 3-4 actual industries from most recent BLS employment data (format: "Industry1, Industry2, Industry3, Industry4")

4. population: Most recent Census data (format: "1,234,567 (metro: 2.3M)")
   VERIFIED 2024 POPULATION DATA:
   - Dallas: 1,288,457 (metro: 7.8M)
   - Houston: 2,288,250 (metro: 7.3M) 
   - Austin: 964,177 (metro: 2.4M)
   USE THESE EXACT VERIFIED FIGURES

5. medianIncome: Most recent ACS data 2022-2023 (format: "$67,462") - THIS NUMBER MUST BE USED CONSISTENTLY IN ALL SECTIONS

6. uniqueNeeds: 1-2 concise sentences (STRICTLY MAX 200 characters - count characters carefully) based on most recent economic data
   CRITICAL: Must be under 200 characters including punctuation and spaces. Be very concise.

Use THE MOST RECENT DATA AVAILABLE for ${cityName}, ${state}. Prioritize 2023-2024 data when available, fall back to 2022 for older sources.

Return ONLY valid JSON:
{
  "heroDescription": "string",
  "landscapeDescription": "string", 
  "majorIndustries": "string",
  "population": "string",
  "medianIncome": "string",
  "uniqueNeeds": "string"
}`;

  while (attempt <= maxAttempts) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 800
      });

      const content = response.choices[0].message.content.trim();
      let jsonStr = content;
      if (content.includes('```')) {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }
      }

      const landscapeData = JSON.parse(jsonStr);
      
      // Validate structure
      const requiredFields = ['heroDescription', 'landscapeDescription', 'majorIndustries', 'population', 'medianIncome', 'uniqueNeeds'];
      if (!validateDataStructure(landscapeData, requiredFields)) {
        throw new Error('Landscape data validation failed - missing required fields');
      }
      
      // Validate character limits - reject if too long instead of truncating
      if (landscapeData.uniqueNeeds.length > 200) {
        if (attempt < maxAttempts) {
          console.warn(`⚠️ Attempt ${attempt}: Unique needs too long (${landscapeData.uniqueNeeds.length} chars), retrying...`);
          attempt++;
          continue;
        } else {
          console.error(`❌ Unique needs still too long after ${maxAttempts} attempts (${landscapeData.uniqueNeeds.length} chars): "${landscapeData.uniqueNeeds}"`);
          throw new Error(`Unique needs text exceeds 200 characters after ${maxAttempts} attempts. Manual intervention required.`);
        }
      }
      
      console.log(`✅ Landscape data validation passed for ${cityName} (attempt ${attempt})`);
      return landscapeData;
    } catch (error) {
      if (error.message.includes('Unique needs text exceeds 200 characters') && attempt < maxAttempts) {
        attempt++;
        continue;
      }
      console.error(`❌ Error generating landscape data for ${cityName}:`, error.message);
      throw error;
    }
  }
}

async function generateMarketInsights(cityName, state, medianIncome) {
  console.log(`💡 Generating market insights for ${cityName}, ${state}...`);
  
  const prompt = `Generate REAL, FACTUAL market insights for ${cityName}, ${state} using ONLY the most recent verified sources available.

REQUIRED SOURCES (use ONLY the newest data available):
- Economic Data: Bureau of Economic Analysis 2023 GDP/growth data (most recent available)
- Demographics: U.S. Census Bureau American Community Survey 2022-2023 data 
- Real Estate: Zillow 2024 data or most current home value/market data available
- Cost of Living: Bureau of Labor Statistics 2023-2024 Consumer Price Index data
- Business: Fortune 500 2023-2024 lists, verified company headquarters data
VERIFIED FORTUNE 500 COUNTS (2024-2025):
   - Dallas-Fort Worth: 21 Fortune 500 companies
   - Houston: 26 Fortune 500 companies (ranks #3 nationally)
   - Austin: 3 Fortune 500 companies
   USE THESE EXACT VERIFIED COUNTS
- Employment: Bureau of Labor Statistics 2023-2024 employment statistics

CRITICAL CONSISTENCY RULE: The median household income for ${cityName} is ${medianIncome}. 
If you mention median income ANYWHERE, use EXACTLY this number and cite the same recent source.

CITATION REQUIREMENT: Every description must start with EXACTLY this format using the MOST RECENT YEAR available: "According to [Source] (RECENT YEAR), [data]..." or "Based on [Source] (RECENT YEAR), [data]..."
EXAMPLES:
- "According to Bureau of Economic Analysis (2023), ${cityName}'s GDP was..."
- "Based on U.S. Census Bureau (2023), the median household income..."
- "According to Zillow (2024), the median home value..."

GENERATE CONSERVATIVE, HIGH-CONFIDENCE DATA ONLY:

Market Insights:
- Economic Growth: Use BEA 2023 data for GENERAL economic trends and major industry presence. Avoid overly precise GDP numbers or growth percentages. Focus on directional trends and major sectors.
- Wealth Demographics: Use Census 2022-2023 data - MUST mention median income as EXACTLY ${medianIncome}. Avoid other overly precise demographic statistics.
- Advisor Specializations: Use BLS 2023-2024 employment data to identify major growing industries. Focus on broad industry trends, not specific job growth percentages.

Local Considerations:  
- Cost of Living: Use BLS 2023-2024 Consumer Price Index data. Report GENERAL cost trends (above/below national average) without overly precise index numbers.
- Real Estate Market: Use Zillow 2024 data for GENERAL market temperature (hot/warm/cool) and broad price ranges. Avoid overly precise dollar amounts.
- Business Environment: Use Fortune 500 2023-2024 data with verified company counts. Focus on major industry presence and business climate, not specific revenue figures.

IMPORTANT GUIDELINES FOR ACCURACY:
- Use phrases like "approximately", "around", "roughly" for numbers you're not 100% certain about
- Report ranges instead of precise values where appropriate (e.g., "between $400K-$500K" not "$437,500")
- Focus on verified trends and confirmed major employers
- Avoid fabricating specific percentages or growth rates
- When unsure, describe general economic health rather than specific metrics

Prioritize 2023-2024 data when available. Use the MOST RECENT verified data for ${cityName}, ${state}.

Return as valid JSON with consistent recent source citations:
{
  "insights": [
    {
      "category": "Market Insights",
      "sections": [
        {
          "title": "Economic Growth", 
          "description": "According to Bureau of Economic Analysis (2023), [specific recent data]..."
        },
        {
          "title": "Wealth Demographics", 
          "description": "According to U.S. Census Bureau (2022 or 2023), the median household income in ${cityName} is ${medianIncome}. [Additional recent verified data]..."
        },
        {
          "title": "Advisor Specializations", 
          "description": "Based on Bureau of Labor Statistics (2023 or 2024), [specific recent info]..."
        }
      ]
    },
    {
      "category": "Local Considerations",
      "sections": [
        {
          "title": "Cost of Living", 
          "description": "According to Bureau of Labor Statistics (2023 or 2024), [specific recent data]..."
        },
        {
          "title": "Real Estate Market", 
          "description": "According to Zillow (2024), [specific recent data]..."
        },
        {
          "title": "Business Environment", 
          "description": "According to Fortune 500 (2023 or 2024)/verified recent sources, [specific recent data]..."
        }
      ]
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1200
    });

    const content = response.choices[0].message.content.trim();
    let jsonStr = content;
    if (content.includes('```')) {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
    }

    const insightsData = JSON.parse(jsonStr);
    
    // Validate insights structure
    if (!validateInsightsStructure(insightsData)) {
      throw new Error('Insights data validation failed - invalid structure or missing citations');
    }
    
    // Validate cross-city data consistency
    for (const category of insightsData.insights) {
      for (const section of category.sections) {
        if (section.title === 'Business Environment') {
          validateCrossCityData(cityName, section.description);
        }
      }
    }
    
    // Additional validation checks
    validateSuspiciousData(cityName, insightsData);
    validateEconomicClaims(cityName, insightsData.insights);
    
    console.log(`✅ Market insights validation passed for ${cityName}`);
    return insightsData;
  } catch (error) {
    console.error(`❌ Error generating insights for ${cityName}:`, error.message);
    throw error;
  }
}

module.exports = {
  generateAdvisors,
  generateCityStats,
  generateLandscapeData,
  generateMarketInsights,
  validateMedianIncomeConsistency,
  validateSourceCitation,
  validateDataStructure,
  validateInsightsStructure,
  validateCrossCityData,
  validateSuspiciousData,
  validateEconomicClaims
}; 