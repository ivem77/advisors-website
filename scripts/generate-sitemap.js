const fs = require('fs-extra');
const path = require('path');
const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');

// Base URL for all paths in the sitemap
const SITE_URL = 'https://www.mezzi.com/advisors';
const BUILD_DIR = './build';
const OUTPUT_FILE = path.join(BUILD_DIR, 'sitemap.xml');

// Ensure the output is a valid XML document
function formatXml(xml) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${xml}
</urlset>`;
}

async function generateSitemap() {
  console.log('🌐 Generating sitemap...');
  
  try {
    // Ensure build directory exists
    if (!(await fs.pathExists(BUILD_DIR))) {
      throw new Error(`Build directory does not exist: ${BUILD_DIR}. Please run 'npm run build' first.`);
    }

    // Get all state directories
    const states = (await fs.readdir(BUILD_DIR, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory() && dirent.name.length === 2) // Only 2-letter state codes
      .map(dirent => dirent.name);

    // Array to hold all URL entries for the sitemap
    const urlEntries = [];

    // Add the root URL with lower priority
    urlEntries.push(
      `<url>
        <loc>${SITE_URL}/</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>`
    );

    // Process each state directory
    for (const state of states) {
      const statePath = path.join(BUILD_DIR, state);
      const cities = (await fs.readdir(statePath, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      // Add each city page
      for (const city of cities) {
        const url = `${SITE_URL}/${state}/${city}/`;
        urlEntries.push(
          `<url>
            <loc>${url}</loc>
            <changefreq>weekly</changefreq>
            <priority>1.0</priority>
          </url>`
        );
      }
    }

    // Format the complete XML
    const xmlContent = formatXml(urlEntries.join('\n'));
    
    // Ensure build directory exists
    await fs.ensureDir(path.dirname(OUTPUT_FILE));
    
    // Write sitemap to file
    await fs.writeFile(OUTPUT_FILE, xmlContent);
    
    console.log(`✅ Sitemap generated successfully at ${OUTPUT_FILE}`);
    console.log(`📊 Total URLs in sitemap: ${urlEntries.length}`);
    return urlEntries.length;
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generateSitemap().catch(error => {
    console.error('Failed to generate sitemap:', error);
    process.exit(1);
  });
}

module.exports = generateSitemap;
