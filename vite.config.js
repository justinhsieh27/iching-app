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

            // Dynamically discover the correct model name from Ollama (Qwen 3.5 distill model)
            let modelName = 'RogerBen/qwen3.5-35b-opus-distill:latest';
            try {
              const tagsResponse = await fetch('http://mac-studio:11434/api/tags');
              if (tagsResponse.ok) {
                const tagsData = await tagsResponse.json();
                const matchedModel = tagsData.models?.find(m => 
                  m.name.toLowerCase().includes('qwen') || 
                  m.model.toLowerCase().includes('qwen') ||
                  m.details?.family?.toLowerCase().includes('qwen') ||
                  m.details?.families?.some(f => f.toLowerCase().includes('qwen'))
                );
                if (matchedModel) {
                  modelName = matchedModel.name;
                } else if (tagsData.models && tagsData.models.length > 0) {
                  modelName = tagsData.models[0].name;
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
            let aiText = typeof ollamaData.response === 'string' ? ollamaData.response : '';

            if (!aiText) {
              throw new Error('Empty response from Ollama.');
            }

            // Strip <think>...</think> tags and content if present
            aiText = aiText.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '').trim();

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
