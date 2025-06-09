const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Validation functions
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
  
  const prompt = `Generate realistic financial advisor statistics for ${cityName}, ${state} using industry standards and verified sources.

REQUIRED APPROACH:
- Use actual market characteristics and city size for scaling
- Base estimates on verified industry reports and market analysis
- Ensure numbers are realistic and proportional to ${cityName}'s economic profile

SCALING GUIDELINES based on ${cityName}'s verified market size:
1. registeredAdvisors: Scale based on population and wealth demographics
   - Research actual advisor density in similar markets
   - Format: "2,100+" or "1,850+"

2. averagePortfolio: Base on actual median income and wealth data for ${cityName}
   - Use realistic ranges based on verified demographic data
   - Format: "$1.2M" (typical range: $800K-$2.5M)

3. averageAumFee: Use standard industry rates from verified sources
   - Reference actual market competition levels in ${cityName}
   - Format: "0.95%" (typical range: 0.75%-1.25%)

4. averageRating: Use realistic advisor rating distributions
   - Base on actual review platform data patterns
   - Format: "4.6/5.0" (typical range: 4.3-4.8/5.0)

Research ${cityName}'s actual market characteristics, competition levels, and wealth demographics to provide realistic estimates.

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
  
  const prompt = `Generate FACTUAL, REAL data for ${cityName}, ${state} using ONLY the specified sources below.

REQUIRED SOURCES (use ONLY these):
- Population: U.S. Census Bureau 2020 estimates
- Median Income: U.S. Census Bureau American Community Survey (most recent available year)
- GDP/Economic: Bureau of Economic Analysis (BEA) most recent data
- Industries: Bureau of Labor Statistics (BLS) employment data
- Cost of Living: Bureau of Labor Statistics Consumer Price Index
- Real Estate: Zillow Home Value Index or similar verified source

IMPORTANT: Use the EXACT SAME median income value throughout ALL sections. This number MUST be consistent everywhere.

CITATION FORMAT: Always format as "According to [Source] ([Year]), [specific data]"

Generate data using this EXACT structure:

1. heroDescription: 1-2 professional sentences about finding financial advisors in ${cityName}

2. landscapeDescription: 2-3 sentences about ${cityName}'s actual economy using verified major employers and economic facts

3. majorIndustries: Top 3-4 actual industries from BLS employment data (format: "Industry1, Industry2, Industry3, Industry4")

4. population: Real Census data (format: "1,234,567 (metro: 2.3M)")

5. medianIncome: Exact ACS data (format: "$67,462") - THIS NUMBER MUST BE USED CONSISTENTLY IN ALL SECTIONS

6. uniqueNeeds: 1-2 concise sentences (MAX 200 characters) based on actual economic data

Research ${cityName}, ${state} and use verified data from the required sources.

Return ONLY valid JSON:
{
  "heroDescription": "string",
  "landscapeDescription": "string", 
  "majorIndustries": "string",
  "population": "string",
  "medianIncome": "string",
  "uniqueNeeds": "string"
}`;

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
    
    // Validate character limits
    if (landscapeData.uniqueNeeds.length > 200) {
      console.warn(`⚠️ Unique needs too long (${landscapeData.uniqueNeeds.length} chars), truncating to 200`);
      landscapeData.uniqueNeeds = landscapeData.uniqueNeeds.substring(0, 197) + '...';
    }
    
    console.log(`✅ Landscape data validation passed for ${cityName}`);
    return landscapeData;
  } catch (error) {
    console.error(`❌ Error generating landscape data for ${cityName}:`, error.message);
    throw error;
  }
}

async function generateMarketInsights(cityName, state, medianIncome) {
  console.log(`💡 Generating market insights for ${cityName}, ${state}...`);
  
  const prompt = `Generate REAL, FACTUAL market insights for ${cityName}, ${state} using ONLY verified sources.

REQUIRED SOURCES (use ONLY these and cite them):
- Economic Data: Bureau of Economic Analysis (BEA) for GDP/growth data  
- Demographics: U.S. Census Bureau for population/income data
- Real Estate: Zillow Home Value Index for housing market data
- Cost of Living: Bureau of Labor Statistics (BLS) Consumer Price Index
- Business: Fortune 500 lists, verified company headquarters data
- Employment: Bureau of Labor Statistics employment statistics

CRITICAL CONSISTENCY RULE: The median household income for ${cityName} is ${medianIncome}. 
If you mention median income ANYWHERE, use EXACTLY this number and cite the same source.

CITATION REQUIREMENT: Every description must start with EXACTLY this format: "According to [Source] (YEAR), [data]..." or "Based on [Source] (YEAR), [data]..."
EXAMPLES:
- "According to Bureau of Economic Analysis (2021), Houston's GDP was..."
- "Based on U.S. Census Bureau (2020), the median household income..."

Generate insights with this EXACT structure and required sources:

Market Insights:
- Economic Growth: Use BEA data for GDP, growth rates, economic developments
- Wealth Demographics: Use Census data - if mentioning median income, use EXACTLY ${medianIncome} from same source/year
- Advisor Specializations: Use employment data to infer advisor specialization needs

Local Considerations:  
- Cost of Living: Use BLS Consumer Price Index data with specific numbers
- Real Estate Market: Use Zillow data with specific home values and trends
- Business Environment: Use verified Fortune 500 data, major employer facts

Return as valid JSON with consistent source citations:
{
  "insights": [
    {
      "category": "Market Insights",
      "sections": [
        {
          "title": "Economic Growth", 
          "description": "According to Bureau of Economic Analysis (YEAR), [specific data]..."
        },
        {
          "title": "Wealth Demographics", 
          "description": "According to U.S. Census Bureau (YEAR), the median household income in ${cityName} is ${medianIncome}. [Additional verified data]..."
        },
        {
          "title": "Advisor Specializations", 
          "description": "Based on BLS employment data, [specific info]..."
        }
      ]
    },
    {
      "category": "Local Considerations",
      "sections": [
        {
          "title": "Cost of Living", 
          "description": "According to Bureau of Labor Statistics (YEAR), [specific data]..."
        },
        {
          "title": "Real Estate Market", 
          "description": "According to Zillow (YEAR), [specific data]..."
        },
        {
          "title": "Business Environment", 
          "description": "According to Fortune 500/verified sources, [specific data]..."
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
  validateInsightsStructure
}; 