const fetch = require('node-fetch');
require('dotenv').config();

const API_KEY = process.env.GOOGLE_API_KEY;

async function getAdvisors(city, state) {
  const query = `financial advisor in ${city}, ${state}`;
  let allResults = [];
  let nextPageToken = null;

  do {
    const url = nextPageToken
      ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${API_KEY}`
      : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;

    const res = await fetch(url);

    if (!res.ok) {
      console.error(`HTTP error ${res.status} for city: ${city}`);
      break;
    }

    const data = await res.json();

    if (!data.results) {
      console.error(`No results found for city: ${city}`);
      break;
    }

    allResults = allResults.concat(data.results);
    nextPageToken = data.next_page_token;

    // Google requires a short delay before using next_page_token
    if (nextPageToken) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

  } while (nextPageToken);

  if (allResults.length === 0) {
    console.error(`No results found for city: ${city}`);
    return [];
  }

  console.log("Total advisors found across all pages: ", allResults.length);

  // Calculate average rating across all results
  const placesWithRatings = allResults.filter(place => place.rating);
  const ratingsSum = placesWithRatings.reduce((sum, place) => sum + place.rating, 0);
  const averageRating = placesWithRatings.length > 0 ? ratingsSum / placesWithRatings.length : 0;

  console.log(`Number of advisors found: ${allResults.length}`);
  console.log(`Average rating for ${city}, ${state}: ${averageRating.toFixed(2)}`);

  // Get top 5 highest rated places
  const topPlaces = allResults
    .filter(place => place.rating) // Only include places with ratings
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const output = [];

  for (const place of topPlaces) {
    const details = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${API_KEY}`);
    if (!details.ok) {
      console.error(`HTTP error ${details.status} for place: ${place.name}`);
      continue;
    }
    const detailsData = await details.json();
    output.push({
      name: place.name,
      url: detailsData.result.website || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      rating: place.rating,
      stars: Array.from({ length: place.rating }),
      reviewCount: place.user_ratings_total || 0
    });
  }

  return {
    advisors: output,
    totalFound: allResults.length,
    averageRating: parseFloat(averageRating.toFixed(1))
  };
}

module.exports = getAdvisors;