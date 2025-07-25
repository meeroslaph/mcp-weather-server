import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
    name: 'Weather Server',
    version: '1.0.0',
});

server.tool('get-weather', 'Tool to get weather information for a city', {
    city: z.string().describe('City name'),
},
    async ({ city }) => {
        return {
            content: [
                { type: 'text', text: `The weather in ${city} is sunny with a temperature of 25°C.` },
            ]
        };
    }
);

const transport = new StdioServerTransport();
server.connect(transport);