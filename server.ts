import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Initialize Gemini lazily/safely
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Health endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      system: "APEX TUNING ENGINE — FH5",
      version: "1.0.0",
      aiAvailable: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Contextual Engineering AI Assistant endpoint
  app.post("/api/gemini/assistant", async (req, res) => {
    try {
      const { prompt, context } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "El mensaje es obligatorio." });
      }

      const ai = getGeminiClient();
      if (!ai) {
        // Deterministic fallback response when API key is not configured in preview environment
        return res.json({
          reply: `[APEX INGENIERÍA MOTORSPORT - MODO REGLAS DETERMINISTAS]
Analizando tu consulta técnica sobre el vehículo "${context?.vehicle?.model || "Vehículo actual"}":
${generateFallbackAdvice(prompt, context)}`,
          source: "engine_fallback",
        });
      }

      const systemInstruction = `Eres el Ingeniero Jefe de Pista y Dinámica Vehicular de "APEX INGENIERÍA MOTORSPORT" para Forza Horizon 5 (FH5).
Tu objetivo es explicar y guiar al piloto basándote ESTRICTAMENTE en la física y mecánica de FH5:
- Filosofía de ingeniería: "No solo decir qué ajustar. Explicar qué estamos intentando conseguir, por qué y qué hacer si el resultado no es el esperado".
- Sé preciso, analítico, profesional, directo y conciso.
- Utiliza siempre las escalas y unidades exactas de FH5 (Presiones en psi, Barras estabilizadoras en escala 1.0-65.0, Muelles en kgf/mm, Amortiguadores rebote/compresión en escala 1.0-20.0, Camber en grados negativos, Diferencial en %).
- NUNCA inventes piezas o parámetros que el vehículo no tenga instalados según el contexto proporcionado.
- Si el piloto reporta un síntoma, recomienda UNA ÚNICA intervención primaria prioritaria antes de alterar otros sistemas.
- Responde siempre en español formal y técnico de motorsport.`;

      const userContent = `DATOS DE TELEMETRÍA Y CONTEXTO DEL VEHÍCULO:
${JSON.stringify(context || {}, null, 2)}

CONSULTA DEL PILOTO:
"${prompt}"

Proporciona tu diagnóstico técnico de ingeniería explicando qué buscar, el por qué físico del ajuste y la acción concreta en FH5.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: userContent,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      });

      const reply = response.text || "No se pudo generar respuesta del asistente.";
      return res.json({ reply, source: "gemini" });
    } catch (err: any) {
      console.error("Gemini assistant error:", err);
      // Return a robust technical fallback instead of breaking the UX
      return res.json({
        reply: `[APEX INGENIERÍA MOTORSPORT]
Recomendación de ingeniería de pista:
${generateFallbackAdvice(req.body?.prompt || "", req.body?.context)}`,
        source: "engine_fallback",
      });
    }
  });

  // Helper fallback when offline or no API key
  function generateFallbackAdvice(prompt: string, context: any): string {
    const p = prompt.toLowerCase();
    const veh = context?.vehicle?.model || "el vehículo";
    const drivetrain = context?.vehicle?.drivetrain || "AWD";
    const discipline = context?.tune?.discipline || "Road Racing";

    if (p.includes("subvira") || p.includes("understeer") || p.includes("de frente")) {
      return `Para mitigar el subviraje en ${veh} (${drivetrain} en ${discipline}):
1. Causa primaria probable: Rigidez excesiva en el tren delantero respecto al trasero.
2. Intervención prioritaria: Reducir la Barra Estabilizadora Delantera (ARB) entre 2.0 y 4.0 puntos, o aumentar ligeramente la ARB trasera (+1.5 puntos).
3. Neumáticos: Asegurar presión delantera entre 28.0 y 29.5 psi para asfalto, evitando que el neumático colapse o se sobre-infle.
4. Regla: Haz UNA sola modificación en la barra delantera y vuelve a dar 2 vueltas de prueba.`;
    }
    if (p.includes("sobrevira") || p.includes("oversteer") || p.includes("trompo") || p.includes("se va de cola")) {
      return `Para estabilizar la parte trasera de ${veh} (${drivetrain}):
1. Causa primaria probable: Barra estabilizadora trasera demasiado rígida o diferencial de aceleración trasero excesivamente bloqueado.
2. Intervención prioritaria: Suavizar la Barra Estabilizadora Trasera (ARB) bajando 3.0 a 5.0 puntos.
3. Si el sobreviraje ocurre al acelerar en salida (Power Oversteer): Reducir el Diferencial de Aceleración Trasero al 55%-65%.
4. Si tiene alerón de competición: Aumentar 10-15 kgf de downforce trasero.`;
    }
    if (p.includes("frena") || p.includes("frenos") || p.includes("inestable al frenar")) {
      return `Diagnóstico para estabilidad en frenada:
1. Si el auto se descoloca de atrás en frenadas fuertes: El reparto de frenada tiene demasiada carga trasera. Ajustar el balance al 52%-54% delantero.
2. Compresión delantera (Bump): Si hace tope, subir 0.5 a 1.0 puntos de Bump delantero para sostener la transferencia de masas longitudinal.
3. Deceleración de diferencial: Un 15%-25% de decel trasero ayuda a estabilizar la retención sin bloquear el giro en entrada.`;
    }
    if (p.includes("rebota") || p.includes("saltos") || p.includes("suspens") || p.includes("baches")) {
      return `Diagnóstico del conjunto amortiguador-muelle:
1. Relación de oro FH5: La amortiguación de Compresión (Bump) debe situarse entre el 50% y el 70% del valor de Extensión (Rebound). Si el Rebound está en 10.0, el Bump debe rondar 5.5 - 6.5.
2. Si rebota continuamente: El Rebound está demasiado duro o el muelle está sobre-comprimido.
3. En Cross Country / Dirt: La altura debe ser generosa y los muelles 30-40% más suaves que en circuito.`;
    }
    return `Análisis técnico para ${veh}:
- Los ajustes de baseline respetan la distribución de masa y la física de tracción (${drivetrain}).
- Cada modificación debe hacerse en incrementos controlados.
- Recuerda registrar el síntoma exacto en el módulo "TEST & DIAGNÓSTICO" para obtener la probabilidad de causa calculada por la matriz de ingeniería.`;
  }

  // Vite middleware in dev, static files in prod
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`APEX TUNING ENGINE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
