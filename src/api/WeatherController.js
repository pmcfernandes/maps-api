import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({
  path: process.cwd() + '/.env'
});

class WeatherController {
  static init(app) {
    const api = app.basePath('/api')
    api.get('/clima/gps', this.getWeather);
  }

  static async getWeather(c) {
    const { lat, lng } = await c.req.query();
    const apiKey = process.env.WEATHER_API_KEY;

    if (!apiKey) {
      return c.json({ error: 'Weather API key is not configured' }, 500);
    }

    if (!lat || !lng) {
      return c.json({ error: 'Latitude and Longitude are required' }, 400);
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      if (!response.ok) {
        return c.json({ error: 'Failed to fetch weather data' }, response.status);
      }

      const data = await response.json();

      const weatherInfo = {
        local: data.name,
        descricao: data.weather[0].description,
        temperatura: data.main.temp,
        humidade: data.main.humidity,
        vento_kmh: data.wind.speed,
        pressao_hPa: data.main.pressure
      };

      return c.json(weatherInfo, 200);
    } catch (error) {
      return c.json({ error: 'Error fetching weather data' }, 500);
    }
  }
}

export default WeatherController;
