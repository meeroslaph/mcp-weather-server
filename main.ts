import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

type GeocodingResult = {
    latitude: number;
    longitude: number;
    name: string;
};

type GeocodingResponse = {
    results?: GeocodingResult[];
};

type WeatherResponse = {
    current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        [key: string]: unknown;
    };
    [key: string]: unknown;
};

const server = new McpServer({
    name: 'Weather Server',
    version: '1.0.0',
});

server.tool(
    'get-weather',
    'Tool to get weather information for a city',
    {
        city: z.string().describe('City name'),
    },
    async ({ city }) => {
        try {
            const geoUrl = `${GEOCODING_API}?name=${encodeURIComponent(city)}`;
            const response = await fetch(geoUrl);
            const data: GeocodingResponse = await response.json();

            if (!data || !Array.isArray(data.results) || data.results.length === 0) {
                return {
                    content: [
                        { type: 'text', text: `Could not find weather information for ${city}.` },
                    ],
                };
            }

            const { latitude, longitude, name } = data.results[0];
            const weatherUrl = `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&current=temperature_2m,relative_humidity_2m`;

            try {
                const weatherResponse = await fetch(weatherUrl);
                const weatherData: WeatherResponse = await weatherResponse.json();

                const temp = weatherData.current?.temperature_2m;
                const humidity = weatherData.current?.relative_humidity_2m;
                let summary = `Weather for ${name} (lat: ${latitude}, lon: ${longitude}):\n`;
                if (typeof temp === 'number') {
                    summary += `Temperature: ${temp}°C\n`;
                }
                if (typeof humidity === 'number') {
                    summary += `Relative Humidity: ${humidity}%\n`;
                }
                if (typeof temp !== 'number' && typeof humidity !== 'number') {
                    summary += 'No current weather data available.';
                }

                return {
                    content: [
                        { type: 'text', text: summary },
                    ],
                };
            } catch (weatherErr) {
                console.error('[Weather Fetch Error]', weatherErr);
                return {
                    content: [
                        { type: 'text', text: `Weather fetch failed: ${weatherErr instanceof Error ? weatherErr.message : String(weatherErr)}` },
                    ],
                };
            }
        } catch (geoErr) {
            console.error('[Geocoding Fetch Error]', geoErr);
            return {
                content: [
                    { type: 'text', text: `Geocoding fetch failed: ${geoErr instanceof Error ? geoErr.message : String(geoErr)}` },
                ],
            };
        }
    }
);

const transport = new StdioServerTransport();
server.connect(transport);