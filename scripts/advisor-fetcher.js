const fetch = require('node-fetch');
require('dotenv').config();

const API_KEY = process.env.GOOGLE_API_KEY;

async function getAdvisors(city, state) {
  const query = `financial advisor in ${city}, ${state}`;
  const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`);

  if (!res.ok) {
    console.error(`HTTP error ${res.status} for city: ${city}`);
    return [];
  }

  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    console.error(`No results found for city: ${city}`);
    return [];
  }

  console.log("Advisors found: ", data.results.length);

  const topPlaces = data.results.sort((a, b) => b.rating - a.rating).slice(0, 5);
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
      stars: Array.from({ length: place.rating })
    });
  }

  return output;
}

module.exports = getAdvisors;