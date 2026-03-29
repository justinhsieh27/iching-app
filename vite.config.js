import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

function logPlugin() {
  return {
    name: 'log-plugin',
    configureServer(server) {
      server.middlewares.use('/api/log', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const { time, question, hexName, movingStr, aiResult } = data;
              const logEntry = `\n======================================\n時間: ${time}\n問題: ${question || '無'}\n本卦: ${hexName}\n變爻: ${movingStr}\nAI解析:\n${aiResult}\n======================================\n`;
              fs.appendFileSync('iching_history.log', logEntry, 'utf8');
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), logPlugin()],
  define: {
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(fs.readFileSync('./API_Key', 'utf-8').trim())
  }
})
