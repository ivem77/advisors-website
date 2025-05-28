const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateAdvisors(cityName, state, count = 5) {
  console.log(`🤖 Generating ${count} realistic advisor profiles for ${cityName}, ${state}...`);
  
  const prompt = `Create ${count} realistic financial advisor profiles for ${cityName}, ${state}. 

IMPORTANT: Since I don't have access to real-time advisor data, create realistic fictional profiles based on typical advisors in this market.

For each advisor, provide:
- Realistic names (not obviously fictional)
- Major firm names (Morgan Stanley, Edward Jones, Charles Schwab, Fidelity, Wells Fargo Advisors, Raymond James, UBS, Merrill Lynch, or legitimate regional firms)
- Use placeholder website URLs in this format: "https://example-firm-name.com/advisor-profile" 
- Use placeholder photo URLs: "https://via.placeholder.com/150/4A90E2/FFFFFF?text=FA"
- Realistic ratings between 4.6-4.9
- 2-3 specializations from: Retirement Planning, Tax Planning, Estate Planning, Wealth Management, Investment Strategies, Portfolio Management, Financial Planning, Risk Management
- Professional bio mentioning years of experience (15-35 years) and expertise

CRITICAL: Use clear placeholder URLs so users know this is sample data:
- Website: "https://example-[firmname].com/advisors/[lastname]"
- Photo: "https://via.placeholder.com/150/4A90E2/FFFFFF?text=[Initials]"

Return as valid JSON array:
[
  {
    "name": "First Last",
    "firm": "Major Firm Name", 
    "rating": "4.8",
    "website": "https://example-morganstanley.com/advisors/last",
    "photoUrl": "https://via.placeholder.com/150/4A90E2/FFFFFF?text=FL",
    "specializations": ["Specialty1", "Specialty2", "Specialty3"],
    "bio": "Professional bio here..."
  }
]

Make the profiles realistic for ${cityName}, ${state} market but use clear placeholder URLs.`;

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

async function generateLandscapeData(cityName, state, population) {
  console.log(`🏙️ Generating landscape data for ${cityName}, ${state}...`);
  
  const prompt = `Generate factual financial landscape information for ${cityName}, ${state} (population: ${population}).

Research the actual economic characteristics of this city and provide realistic information:

1. landscapeDescription: 2-3 sentences about the city's economy, major employers, and financial advisory landscape. Be factual and specific to this city's known characteristics.

2. majorIndustries: 3-4 main industries (comma separated) - use the actual top industries for this city (e.g., for Austin: Technology, Healthcare, Government, Education)

3. population: Use realistic population data with metro area (format like "850,000 (metro: 1.2M)")

4. medianIncome: Use realistic median household income based on known data for this city (format like "$67,500")

5. uniqueNeeds: 2-3 financial planning needs specific to this city's economy and demographics (e.g., stock options for tech workers, government benefits planning)

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
  generateLandscapeData,
  generateMarketInsights
}; 