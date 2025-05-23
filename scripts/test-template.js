const fs = require('fs-extra');
const mustache = require('mustache');
const path = require('path');

async function testTemplate() {
  console.log('🧪 Testing template rendering...');
  
  try {
    // Read template files
    console.log('📖 Reading template files...');
    const htmlTemplate = await fs.readFile('./templates/index.html', 'utf8');
    const cssContent = await fs.readFile('./templates/styles.css', 'utf8');
    const jsContent = await fs.readFile('./templates/script.js', 'utf8');
    
    // Load Houston sample data
    console.log('📊 Loading Houston sample data...');
    const houstonData = await fs.readJson('./data/generated/houston-tx.json');
    
    // Process HTML template with Mustache
    console.log('🔄 Processing template with Mustache...');
    const processedHtml = mustache.render(htmlTemplate, houstonData);
    
    // Create test output directory
    const testDir = './test-output';
    await fs.ensureDir(testDir);
    
    // Write processed files
    console.log('💾 Writing test files...');
    await fs.writeFile(`${testDir}/index.html`, processedHtml);
    await fs.writeFile(`${testDir}/styles.css`, cssContent);
    await fs.writeFile(`${testDir}/script.js`, jsContent);
    
    // Copy assets
    if (await fs.pathExists('./assets')) {
      console.log('📁 Copying assets...');
      await fs.copy('./assets', `${testDir}/assets`);
    }
    
    console.log('✅ Test template generated successfully!');
    console.log('📂 Test output available in: ./test-output/');
    console.log('🌐 Open ./test-output/index.html in your browser to test');
    
    // Basic validation
    const htmlStats = await fs.stat(`${testDir}/index.html`);
    console.log(`📏 Generated HTML size: ${(htmlStats.size / 1024).toFixed(1)} KB`);
    
    // Check if city name was properly replaced
    if (processedHtml.includes('{{cityName}}')) {
      console.log('⚠️  Warning: Found unreplaced {{cityName}} placeholders');
    } else {
      console.log('✅ All city name placeholders replaced successfully');
    }
    
    // Check if advisors were properly rendered
    if (processedHtml.includes('Arturo Karakowsky')) {
      console.log('✅ Advisor data rendered successfully');
    } else {
      console.log('⚠️  Warning: Advisor data may not be rendering correctly');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  testTemplate().catch(console.error);
}

module.exports = { testTemplate }; 