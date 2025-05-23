const fs = require('fs-extra');

function unescapeHtml(str) {
  return str
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function validateOutput() {
  console.log('🔍 Validating generated output...');
  
  try {
    // Read the generated HTML
    let generatedHtml = await fs.readFile('./test-output/index.html', 'utf8');
    const houstonData = await fs.readJson('./data/generated/houston-tx.json');
    
    // Unescape HTML for better matching
    const unescapedHtml = unescapeHtml(generatedHtml);
    
    const checks = [
      {
        name: 'Title contains Houston',
        test: () => generatedHtml.includes('Best Financial Advisors in Houston'),
        expected: true
      },
      {
        name: 'Meta description is present',
        test: () => generatedHtml.includes(houstonData.metaDescription),
        expected: true
      },
      {
        name: 'Hero description is rendered',
        test: () => generatedHtml.includes(houstonData.heroDescription),
        expected: true
      },
      {
        name: 'Stats are populated',
        test: () => generatedHtml.includes(houstonData.registeredAdvisors) && 
                   generatedHtml.includes(houstonData.averagePortfolio),
        expected: true
      },
      {
        name: 'Landscape description is present',
        test: () => unescapedHtml.includes(houstonData.landscapeDescription),
        expected: true
      },
      {
        name: 'All advisors are rendered',
        test: () => houstonData.advisors.every(advisor => 
          generatedHtml.includes(advisor.name) && 
          generatedHtml.includes(advisor.firm)
        ),
        expected: true
      },
      {
        name: 'Advisor specializations are rendered',
        test: () => generatedHtml.includes('Retirement') && 
                   generatedHtml.includes('Tax Planning'),
        expected: true
      },
      {
        name: 'Nearby locations are rendered',
        test: () => houstonData.nearbyLocations.some(location => 
          generatedHtml.includes(location)
        ),
        expected: true
      },
      {
        name: 'No unreplaced template variables',
        test: () => !generatedHtml.includes('{{') && !generatedHtml.includes('}}'),
        expected: true
      },
      {
        name: 'Market insights are rendered',
        test: () => generatedHtml.includes('Market Insights') && 
                   generatedHtml.includes('Energy Sector Influence'),
        expected: true
      }
    ];
    
    console.log('\n📋 Validation Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let passedCount = 0;
    let totalCount = checks.length;
    
    checks.forEach((check, index) => {
      const result = check.test();
      const status = result === check.expected ? '✅' : '❌';
      const statusText = result === check.expected ? 'PASS' : 'FAIL';
      
      console.log(`${status} ${check.name}: ${statusText}`);
      
      if (result === check.expected) {
        passedCount++;
      }
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Results: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      console.log('🎉 All validation tests passed! Template rendering is working correctly.');
    } else {
      console.log(`⚠️  ${totalCount - passedCount} test(s) failed. Please check the template or data.`);
    }
    
    // File size comparison
    const originalStats = await fs.stat('./index.html');
    const generatedStats = await fs.stat('./test-output/index.html');
    
    console.log(`\n📏 Size Comparison:`);
    console.log(`   Original HTML: ${(originalStats.size / 1024).toFixed(1)} KB`);
    console.log(`   Generated HTML: ${(generatedStats.size / 1024).toFixed(1)} KB`);
    console.log(`   Difference: ${((generatedStats.size - originalStats.size) / 1024).toFixed(1)} KB`);
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  validateOutput().catch(console.error);
}

module.exports = { validateOutput }; 