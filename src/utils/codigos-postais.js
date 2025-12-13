import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { runQuery } from '../helpers/db.js';

// Load environment variables
dotenv.config({
  path: process.cwd() + '/../../.env'
});

console.log("Starting codigos-postais utility...");
console.log(process.env.GEOCODING_API_KEY)

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: node codigos-postais.js <command> [options]");
  console.log("Commands:");
  console.log("  update-lat-lng       Update Latitude and Longitude for postal codes");
  process.exit(1);
}

const command = args[0];

switch (command) {
  case "update-lat-lng":
    updateLatLng();
    break;
  default:
    console.log(`Unknown command: ${command}`);
    process.exit(1);
}

async function updateLatLng() {
  try {
    const sqlAlter = `
      ALTER TABLE codigos_postais
        ADD COLUMN IF NOT EXISTS lat double precision,
        ADD COLUMN IF NOT EXISTS lng double precision;
    `;

    await runQuery(sqlAlter);

    const sqlSelect = `
      SELECT *
      FROM codigos_postais
      WHERE lat IS NULL OR lng IS NULL
      LIMIT 1000;
    `;

    const data = await runQuery(sqlSelect);
    const rows = data.rows;

    for (const row of rows) {
      const fullPostalCode = `${String(row.num_cod_postal).padStart(4, '0')}-${String(row.ext_cod_postal).padStart(3, '0')}`;
      const address = [
        row.tipo_arteria || '',
        row.prep1 || '',
        row.titulo_arteria || '',
        row.prep2 || '',
        row.nome_arteria || '',
        fullPostalCode,
        row.desig_postal || ''
      ].join(' ').trim().replace(/\s+/g, ' ');

      const geoData = await geocodeAddress(address);

      if (geoData) {
        const sqlUpdate = `
          UPDATE codigos_postais
          SET lat = $1, lng = $2
          WHERE cod_arteria = $3;
        `;
        await runQuery(sqlUpdate, [geoData.lat, geoData.lng, row.cod_arteria]);
        console.log(`Updated Código Arteria ${row.cod_arteria} with lat: ${geoData.lat}, lng: ${geoData.lng}`);
      } else {
        console.log(`Geocoding failed for Código Arteria ${row.cod_arteria}, address: ${address}`);
      }
    }

    console.log("Latitude and Longitude update completed.");
    process.exit(0);
  } catch (err) {
    console.error("Error updating Latitude and Longitude:", err);
    process.exit(1);
  }

  async function geocodeAddress(address) {
    const apiKey = process.env.GEOCODING_API_KEY;
    if (!apiKey) {
      throw new Error("GEOCODING_API_KEY is not set in environment variables.");
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      } else {
        return null;
      }
    } catch (err) {
      console.error("Geocoding API error:", err);
      return null;
    }
  }
}

export default {};
