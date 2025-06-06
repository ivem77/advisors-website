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
  
  const prompt = `Generate realistic financial advisor statistics for ${cityName}, ${state} (population: ${population}).

Base these on real industry averages and make them appropriate for a city of this size:

1. registeredAdvisors: Format like "2,100+" or "850+" (scale with population - larger cities have more advisors)
2. averagePortfolio: Format like "$1.2M" or "$890K" (typical range $800K-$2M, adjust slightly by city wealth)
3. averageAumFee: Format like "0.95%" (typical range 0.85%-1.25%)
4. averageRating: Format like "4.6/5.0" (range 4.3-4.8)

Use realistic numbers that would be appropriate for ${cityName}'s market size and demographics.

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
  
  const prompt = `Generate financial landscape information for ${cityName}, ${state} (population: ${population}).

Research the actual economic characteristics of this city and provide:

1. landscapeDescription: 2-3 sentences about the city's economy, major employers, and financial advisory landscape. Be factual and specific to this city.

2. majorIndustries: 3-4 main industries (comma separated) - research the actual top industries for this city

3. population: Current population with metro area (research actual numbers, format like "850,000 (metro: 1.2M)")

4. medianIncome: Realistic median household income (research actual data, format like "$67,500")

5. uniqueNeeds: 2-3 financial planning needs specific to this city's economy and demographics

6. citySpecificRiskAdvice: One sentence about financial risks specific to this city (natural disasters, economic factors, etc.)

Return as valid JSON:
{
  "landscapeDescription": "...",
  "majorIndustries": "Industry1, Industry2, Industry3, Industry4",
  "population": "...",
  "medianIncome": "$...",
  "uniqueNeeds": "...",
  "citySpecificRiskAdvice": "..."
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

async function generateMarketInsights(cityName, state) {
  console.log(`💡 Generating market insights for ${cityName}, ${state}...`);
  
  const prompt = `Generate market insights for financial advisors in ${cityName}, ${state}.

Create 2 insight categories, each with 3 sections:

Category 1: "Market Insights" 
- Focus on local economic factors, wealth demographics, advisor specializations

Category 2: "Local Considerations"
- Focus on cost of living, real estate, business environment

Each section should be:
- Title: 3-5 words
- Description: 1-2 sentences with specific, factual information about this city

Return as valid JSON:
{
  "insights": [
    {
      "category": "Market Insights",
      "sections": [
        {"title": "Title Here", "description": "Description here..."},
        {"title": "Title Here", "description": "Description here..."},
        {"title": "Title Here", "description": "Description here..."}
      ]
    },
    {
      "category": "Local Considerations", 
      "sections": [
        {"title": "Title Here", "description": "Description here..."},
        {"title": "Title Here", "description": "Description here..."},
        {"title": "Title Here", "description": "Description here..."}
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