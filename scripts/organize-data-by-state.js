const fs = require('fs-extra');
const path = require('path');

async function organizeDataByState() {
  console.log('📂 Organizing generated data files by state...');
  
  const generatedDir = path.join(__dirname, '../data/generated');
  const files = await fs.readdir(generatedDir);
  
  let movedCount = 0;
  let errorCount = 0;
  
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    try {
      // Extract state code from filename (e.g., 'houston-tx.json' -> 'tx')
      const stateCode = file.split('-').pop().replace('.json', '').toLowerCase();
      const stateDir = path.join(generatedDir, stateCode);
      
      // Create state directory if it doesn't exist
      await fs.ensureDir(stateDir);
      
      // Move file to state directory
      const sourcePath = path.join(generatedDir, file);
      const destPath = path.join(stateDir, file);
      
      // Skip if file is already in the correct location
      if (sourcePath !== destPath) {
        await fs.move(sourcePath, destPath, { overwrite: true });
        movedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`✅ Organized ${movedCount} files into state directories.`);
  if (errorCount > 0) {
    console.log(`⚠️  Encountered ${errorCount} errors.`);
  }
}

// Run the function
organizeDataByState().catch(console.error);
