import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // AI Assistant Endpoint for Cloudflare Workers & Xray Android Architecture
  app.post("/api/gemini/assistant", async (req, res) => {
    try {
      const { prompt, context } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ 
          error: "کلید API جمینای تنظیم نشده است. لطفاً از پنل Secrets در AI Studio تنظیم کنید." 
        });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const systemInstruction = `شما یک معمار ارشد سیستم‌های اندروید (Jetpack Compose & Kotlin)، شبکه‌های ابری (Cloudflare Workers) و پروتکل‌های امنیتی (Xray-core / VLESS / WebSocket / TLS) هستید.
شما باید به زبان فارسی روان، دقیق و فنی به توسعه‌دهندگان پاسخ دهید.
اگر سوال درباره کد اندروید، پرمیژن‌های VpnService، بهینه‌سازی باتری، پیدا کردن آی‌پی تمیز کلودفلر (Clean IP)، یا ساختار Worker JS است، پاسخ کامل و حرفه‌ای همراه با نمونه کد تمیز ارائه دهید.
زمینه فعلی کاربر: ${JSON.stringify(context || {})}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "خطا در ارتباط با هوش مصنوعی" });
    }
  });

  // Cloudflare Worker Deployment Proxy / Simulator
  app.post("/api/cloudflare/deploy", async (req, res) => {
    try {
      const { accountId, apiToken, workerName, workerScript, simulationMode } = req.body;

      if (!workerName || !workerScript) {
        return res.status(400).json({ error: "نام ورکر و کد جاوااسکریپت ورکر الزامی است." });
      }

      // If in simulation mode or credentials missing, perform realistic step-by-step simulation
      if (simulationMode || !accountId || !apiToken) {
        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        const workerDomain = `${workerName}.${accountId ? accountId.substring(0, 8) : 'demo-user'}.workers.dev`;
        return res.json({
          success: true,
          mode: "SIMULATION",
          message: `ورکر با موفقیت (در حالت شبیه‌سازی) دیپلوی شد!`,
          workerUrl: `https://${workerDomain}`,
          details: {
            scriptSize: `${Math.round(workerScript.length / 1024 * 10) / 10} KB`,
            routes: [`*/*.workers.dev/*`],
            compatibilityDate: "2024-03-01",
            timestamp: new Date().toISOString()
          }
        });
      }

      // Real deployment to Cloudflare REST API v4
      const cfResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/javascript",
          },
          body: workerScript,
        }
      );

      const cfData = await cfResponse.json();

      if (!cfResponse.ok || !cfData.success) {
        return res.status(400).json({
          success: false,
          error: cfData.errors?.[0]?.message || "خطای نامشخص در API کلودفلر",
          rawErrors: cfData.errors,
        });
      }

      // Automatically enable workers.dev subdomain if needed
      try {
        await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}/subdomain`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ enabled: true }),
          }
        );
      } catch (subErr) {
        console.warn("Subdomain activation warning:", subErr);
      }

      res.json({
        success: true,
        mode: "LIVE",
        message: "ورکر با موفقیت روی حساب واقعی Cloudflare شما دیپلوی شد!",
        workerUrl: `https://${workerName}.workers.dev`,
        details: cfData.result
      });
    } catch (error: any) {
      console.error("Cloudflare Deploy Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite Middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
