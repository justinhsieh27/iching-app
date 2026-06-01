import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
          console.error("AI API Proxy Request Error:", err);
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

            // Dynamically discover the correct Gemma4 model name from Ollama
            let modelName = 'iaprofesseur/SuperGemma4-26b-uncensored-Q4:latest';
            try {
              const tagsResponse = await fetch('http://mac-studio:11434/api/tags');
              if (tagsResponse.ok) {
                const tagsData = await tagsResponse.json();
                const matchedModel = tagsData.models?.find(m => 
                  m.name.toLowerCase().includes('gemma4') || 
                  m.model.toLowerCase().includes('gemma4') ||
                  m.details?.family?.toLowerCase() === 'gemma4' ||
                  m.details?.families?.some(f => f.toLowerCase() === 'gemma4')
                );
                if (matchedModel) {
                  modelName = matchedModel.name;
                }
              }
            } catch (tagsErr) {
              console.warn("Failed to dynamically fetch Ollama tags:", tagsErr.message);
            }

            const ollamaUrl = 'http://mac-studio:11434/api/generate';
            const response = await fetch(ollamaUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: modelName,
                prompt: data.prompt,
                stream: false
              })
            });

            if (!response.ok) {
              throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            const ollamaData = await response.json();
            const aiText = typeof ollamaData.response === 'string' ? ollamaData.response : '';

            if (!aiText) {
              throw new Error('Empty response from Ollama.');
            }

            sendJson(200, { text: aiText });
          } catch (err) {
            const message = err instanceof SyntaxError ? 'Invalid JSON request body.' : err.message;
            console.error("Ollama API Proxy Error:", err);
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
