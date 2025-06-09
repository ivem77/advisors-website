const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
  
  const prompt = `Generate realistic financial advisor statistics for ${cityName}, ${state}. Base these on actual market characteristics and city size.

Use real industry knowledge and realistic scaling based on ${cityName}'s actual size and economic profile:

1. registeredAdvisors: Scale appropriately for ${cityName}'s market size (format: "2,100+" or "850+")
   - Austin (~950k): ~1,200-1,800 advisors
   - Dallas (~1.3M): ~2,000-3,000 advisors  
   - Houston (~2.3M): ~3,000-4,500 advisors

2. averagePortfolio: Use realistic ranges based on ${cityName}'s wealth demographics (format: "$1.2M")
   - Typical range: $800K-$2M depending on city wealth levels

3. averageAumFee: Use standard industry rates (format: "0.95%")
   - Typical range: 0.85%-1.25% (competitive markets may be lower)

4. averageRating: Use realistic advisor rating ranges (format: "4.6/5.0")
   - Typical range: 4.3-4.8/5.0

Base numbers on ${cityName}'s actual economic characteristics and market competitiveness.

Return only valid JSON:
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
      temperature: 0.7,
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
  
  const prompt = `Generate FACTUAL, REAL data for ${cityName}, ${state}. Use only verifiable information from reliable sources.

IMPORTANT: Use actual, real data that can be fact-checked. Do not make up numbers or statistics.

1. heroDescription: 1-2 sentences that would appear under "Best Financial Advisors in ${cityName}" - describe finding top-rated local advisors for financial goals (keep it general and professional)

2. landscapeDescription: 2-3 sentences about ${cityName}'s actual economy, real major employers, and financial advisory landscape. Use factual information about the city.

3. majorIndustries: The actual top 3-4 industries for ${cityName} based on real economic data (research what ${cityName} is actually known for)

4. population: Use real population data for ${cityName} with actual metro area numbers (format: "950,000 (metro: 2.2M)")

5. medianIncome: Use the EXACT SAME actual median household income data for ${cityName} from the most recent U.S. Census Bureau American Community Survey (format: "$67,462"). This number MUST match exactly in all other sections.

6. uniqueNeeds: 1-2 concise sentences (MAX 200 characters) about specific financial planning needs based on ${cityName}'s actual economic characteristics and demographics

Research and use real data for ${cityName}, ${state}. Be factual and accurate.

Return only valid JSON:
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
      temperature: 0.6,
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

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error(`❌ Error generating landscape data for ${cityName}:`, error.message);
    throw error;
  }
}

async function generateMarketInsights(cityName, state, medianIncome) {
  console.log(`💡 Generating market insights for ${cityName}, ${state}...`);
  
  const prompt = `Generate REAL, FACTUAL market insights for ${cityName}, ${state}. Use only verifiable data and statistics.

CRITICAL: Use actual, real data that can be fact-checked. Do not fabricate numbers or statistics.

IMPORTANT: The median household income for ${cityName} is ${medianIncome}. If you reference median income anywhere, use EXACTLY this number and year.

Create insights in this structure with REAL data for ${cityName}:

Market Insights:
- Economic Growth: Real GDP data, economic growth rates, or major economic developments for ${cityName}
- Wealth Demographics: Actual data about high-net-worth individuals, median household income (use ${medianIncome} if mentioned), or wealth concentration  
- Advisor Specializations: Real information about what financial advisors in ${cityName} actually specialize in based on the local economy

Local Considerations:
- Cost of Living: Actual cost of living data, housing costs, or comparison to national averages for ${cityName}
- Real Estate Market: Real data about ${cityName}'s housing market, home values, market trends
- Business Environment: Factual information about major employers, business growth, startup activity in ${cityName}

Research and use verifiable data sources. Be specific to ${cityName}, ${state}. Ensure ALL numbers are consistent and factual.

Return as valid JSON:
{
  "insights": [
    {
      "category": "Market Insights",
      "sections": [
        {"title": "Economic Growth", "description": "Real economic data"},
        {"title": "Wealth Demographics", "description": "Actual demographic data - if mentioning median income, use exactly ${medianIncome}"},
        {"title": "Advisor Specializations", "description": "Real advisor specialization info"}
      ]
    },
    {
      "category": "Local Considerations", 
      "sections": [
        {"title": "Cost of Living", "description": "Real cost data"},
        {"title": "Real Estate Market", "description": "Actual market data"},
        {"title": "Business Environment", "description": "Real business data"}
      ]
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content.trim();
    let jsonStr = content;
    if (content.includes('```')) {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error(`❌ Error generating insights for ${cityName}:`, error.message);
    throw error;
  }
}

module.exports = {
  generateAdvisors,
  generateCityStats,
  generateLandscapeData,
  generateMarketInsights
}; 