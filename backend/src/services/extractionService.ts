import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "qwen/qwen3.8-27b";

const buildPrompt = (
  today: string,
) => `Extract information from this photo of a document, bill, flyer, screenshot or note. The user wants to remember it, so focus on what they need to act on.

Today is ${today}. Return ONLY valid JSON in this exact shape:
{
  "category": { "value": "bill" | "school" | "work" | "promo" | "receipt" | "other", "confidence": number },
  "title": { "value": string, "confidence": number },
  "deadline": { "value": "YYYY-MM-DD" or null, "confidence": number },
  "fields": { "snake_case_key": { "value": string, "confidence": number } }
}

Rules:
- title: short and specific (max 60 chars). Name the thing, e.g. "Meralco bill - January", not "Bill".
- deadline: the date the user must act by (due date, submission date, closing date, promo expiry). Not the issue date. If several, pick the nearest upcoming one. If the year is missing, use the next occurrence on or after today. Resolve relative dates like "until Friday" against today. If there is no deadline, use null (confidence = how sure you are there is none).
- fields: up to 8 useful details (e.g. amount_due, biller, account_number, company, position, promo_code). Don't repeat title or deadline. Copy text as written, never invent values.
- confidence is 0 to 1 for EVERY value: 0.95+ clear and printed, 0.8 to 0.94 readable, 0.6 to 0.79 blurry or ambiguous, below 0.6 mostly a guess. Lower it for blur, glare, cropping, handwriting and anything inferred.
- If the image is unreadable: category "other", title "Unreadable photo", deadline null, fields {}.`;

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 3000;
const MAX_RETRY_WAIT_MS = 30_000;
const RETRYABLE_STATUS = [429, 500, 503];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type GroqError = { status?: number; headers?: Record<string, string> };

const isRetryable = (err: unknown) => {
  const e = err as GroqError;
  if (!RETRYABLE_STATUS.includes(e?.status ?? 0)) return false;
  const retryAfter = parseFloat(e.headers?.["retry-after"] ?? "");
  return !(!Number.isNaN(retryAfter) && retryAfter * 1000 > MAX_RETRY_WAIT_MS);
};

export async function extractDataFromImage(
  buffer: Buffer,
  mimeType: string,
  today: string = new Date().toISOString().slice(0, 10),
) {
  const base64Image = buffer.toString("base64");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: buildPrompt(today) },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Image}` },
              },
            ],
          },
        ],
      });

      const text = completion.choices[0]?.message?.content ?? "";
      const data = JSON.parse(text.replace(/```json|```/g, "").trim());

      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.deadline?.value ?? "")) {
        data.deadline = {
          value: null,
          confidence: data.deadline?.confidence ?? 0,
        };
      }
      return data;
    } catch (err) {
      if (!isRetryable(err) || attempt === MAX_ATTEMPTS) throw err;
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
      console.log(
        `failed: retrying (attempt ${attempt}/${MAX_ATTEMPTS}) in ${delay}ms`,
      );
      await sleep(delay);
    }
  }
  throw new Error("Extraction failed");
}
