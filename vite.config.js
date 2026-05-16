import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import { GoogleGenerativeAI } from '@google/generative-ai'

function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/gemini', (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }

        let body = '';
        let settled = false;
        const maxBodySize = 16 * 1024;

        const sendJson = (statusCode, payload) => {
          if (settled || res.writableEnded) return;
          settled = true;
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        };

        req.on('aborted', () => {
          settled = true;
        });

        req.on('error', err => {
          console.error("Gemini API Proxy Request Error:", err);
          sendJson(400, { error: 'Request stream failed.' });
        });

        req.on('data', chunk => {
          body += chunk.toString();
          if (body.length > maxBodySize) {
            sendJson(413, { error: 'Prompt is too large.' });
            req.destroy();
          }
        });

        req.on('end', async () => {
          if (settled) return;

          try {
            const data = JSON.parse(body || '{}');
            if (typeof data.prompt !== 'string' || data.prompt.trim().length === 0) {
              sendJson(400, { error: 'A non-empty prompt is required.' });
              return;
            }

            let apiKey = '';
            try {
              apiKey = fs.readFileSync('./API_Key', 'utf-8').trim();
            } catch {
              sendJson(500, { error: 'Gemini API key file is missing.' });
              return;
            }

            if (!apiKey) {
              sendJson(500, { error: 'Gemini API key is empty.' });
              return;
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const result = await model.generateContent(data.prompt);
            const aiText = result.response.text();

            sendJson(200, { text: aiText });
          } catch (err) {
            const message = err instanceof SyntaxError ? 'Invalid JSON request body.' : err.message;
            console.error("Gemini API Proxy Error:", err);
            sendJson(err instanceof SyntaxError ? 400 : 500, { error: message });
          }
        });
      });


    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
})
