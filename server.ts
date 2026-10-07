import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI Chat / Insights
  app.post('/api/ai', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: "Gemini API key is not configured. Add GEMINI_API_KEY or GOOGLE_API_KEY in the server environment." });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const contents = (req.body.messages || []).map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: req.body.model === 'claude-sonnet-4-20250514' ? 'gemini-3.6-flash' : (req.body.model || 'gemini-3.6-flash'),
        contents,
        config: {
            systemInstruction: req.body.system,
        }
      });

      res.json({ content: [{ text: response.text }] });
    } catch (error: any) {
      console.error('Server AI Route Error:', error);
      if (error.message?.includes('API_KEY_INVALID') || error.status === 400 || error.message?.includes('API key')) {
        return res.status(401).json({ error: "Gemini API key is invalid or not allowed for the Generative Language API." });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Serve the PWA Service Worker with appropriate headers
  app.get('/sw.js', (req, res) => {
    const swPath = process.env.NODE_ENV === 'production' 
      ? path.join(process.cwd(), 'dist', 'sw.js')
      : path.join(process.cwd(), 'public', 'sw.js');
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(swPath);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          port: 24680,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support SPA routing in Express v5
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
