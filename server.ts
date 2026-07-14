import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase body size limit to support base64 encoded PDFs and images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API Route: Use Gemini to parse Mutation Application PDF or Image
  app.post("/api/gemini/parse-mutation", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        status: "error",
        message: "গুগল জেমিনি এপিআই কি (GEMINI_API_KEY) পাওয়া যায়নি। অনুগ্রহ করে AI Studio-এর Settings > Secrets প্যানেলে কি-টি সেট করুন।"
      });
    }

    const { fileData, mimeType } = req.body;
    if (!fileData) {
      return res.status(400).json({
        status: "error",
        message: "ফাইলের তথ্য পাওয়া যায়নি। অনুগ্রহ করে একটি সঠিক PDF বা ইমেজ ফাইল নির্বাচন করুন।"
      });
    }

    try {
      // Lazy initialization of GenAI SDK with mandated telemetry header
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      console.log(`Sending parsing request to Gemini for mimeType: ${mimeType}`);

      const promptText = `You are an expert in Bangladesh Land Mutation and Land Records.
Your task is to analyze the attached Mutation Application (মিউটেশন/জমাখারিজ/জমাএকত্রীকরণ এর আবেদন) document.
Please extract the following information and return it in structured JSON format.

FIELDS TO EXTRACT:
1. applicationNumber (আবেদন নম্বর): Find the text "আবেদন নং" or similar, extract the digits (e.g., "৯১৪৯৯৮৬" -> "9149986"). Always convert Bengali digits to English numbers for easy storage and consistency (e.g., "৯১৪৯৯৮৬" -> "9149986", "১" -> "1").
2. name (আবেদনকারীর নাম / দাতা): Extract the first Applicant/Recipient (গ্রহীতা - ১) full name, for example: "তাসমিন হুদা". Do not include titles like "নাম:".
3. mobile (মোবাইল নম্বর): Extract the applicant's mobile number. Convert any Bengali digits to English (e.g., "০১৭১৫১২০৯০২" -> "01715120902").
4. landAmount (জমির পরিমাণ শতাংশে): In the application table, the land amount is given in acres (একর) e.g., "0.094400" or "০.০৯৪৪০০".
   CRITICAL CONVERSION: In Bangladesh land system, 1 Acre = 100 শতাংশ (decimal).
   Convert the acre amount into decimals (শতাংশ) by multiplying by 100.
   For example: "0.094400" or "০.০৯৪৪০০" acres -> 9.44 শতাংশ.
   Please output the calculated numeric value as a string (e.g., "9.44"). Do not include the word "শতাংশ" or "একর", just the converted decimal value.
5. address (জমির ঠিকানা / মৌজা): Extract the Mouza (মৌজা) name and JL number (জে.এল নং), village, etc. e.g., "মৌজা রাধানগর, জে.এল নং ৮৩".
6. halDag (হাল দাগ নং): Extract the plot number (দাগ নম্বর) from the table, e.g., "19869" (or "১৯৮৬৯" converted to English digits).
7. sabekDag (সাবেক দাগ নং): Look for "সাবেক দাগ" or similar in the document. If not explicitly found, leave it empty.
8. applicationType (আবেদনের ধরণ): Set this to "মিউটেশন" or "নামজারি" based on the document heading.
9. uploadDate (আবেদনের তারিখ): Extract the "আবেদনের তারিখ" (e.g., "২৪/০৬/২০২৬" or "24/06/2026") and format it as YYYY-MM-DD (e.g., "2026-06-24").

You must respond ONLY with a valid JSON object matching the schema below. Do not include any markdown styling like \`\`\`json or explanations. Just return the raw JSON text.

JSON Schema:
{
  "applicationNumber": "string",
  "name": "string",
  "mobile": "string",
  "landAmount": "string",
  "address": "string",
  "halDag": "string",
  "sabekDag": "string",
  "applicationType": "মিউটেশন",
  "uploadDate": "string"
}`;

      const modelsToTry = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-1.5-flash"];
      let response = null;
      let lastError: any = null;
      let successfulModel = "";

      for (const modelName of modelsToTry) {
        try {
          console.log(`Attempting parsing with model: ${modelName}`);
          const resObj = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  mimeType: mimeType || "application/pdf",
                  data: fileData,
                },
              },
              {
                text: promptText,
              }
            ]
          });
          
          if (resObj && resObj.text) {
            response = resObj;
            successfulModel = modelName;
            console.log(`Successfully parsed document using model: ${modelName}`);
            break;
          }
        } catch (err: any) {
          const status = err.status || err.statusCode || (err.error && err.error.code);
          console.warn(`Model ${modelName} failed with status ${status}:`, err.message || err);
          lastError = err;
          // Continue to next model immediately for 503 or other failures
        }
      }

      if (!response || !response.text) {
        const errMsg = lastError?.message || (lastError && JSON.stringify(lastError)) || "Unknown error";
        console.error("All Gemini models failed parsing. Last error:", errMsg);

        let userFriendlyMsg = "জেমিনি AI সার্ভিস বর্তমানে অতিরিক্ত ট্রাফিকের কারণে সাময়িকভাবে ব্যস্ত আছে।";
        if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("demand") || errMsg.includes("overloaded")) {
          userFriendlyMsg = "গুগল জেমিনি AI সার্ভিস এই মুহূর্তে চরম ট্রাফিকের বা উচ্চ চাহিদার সম্মুখীন হচ্ছে (Error 503)। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার ফাইলটি আপলোড করুন অথবা সরাসরি ম্যানুয়ালি ফর্মটি টাইপ করে পূরণ করুন।";
        } else if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("limit")) {
          userFriendlyMsg = "এপিআই রিকোয়েস্ট লিমিট শেষ হয়েছে (Error 429)। অনুগ্রহ করে এক মিনিট পর আবার চেষ্টা করুন বা সরাসরি টাইপ করুন।";
        } else if (errMsg.includes("API_KEY") || errMsg.includes("API key")) {
          userFriendlyMsg = "জেমিনি এপিআই কি (GEMINI_API_KEY) কাজ করছে না। অনুগ্রহ করে AI Settings > Secrets প্যানেলে কি-টি সঠিক কিনা চেক করুন।";
        } else {
          userFriendlyMsg = `জেমিনি এআই দিয়ে ফাইল বিশ্লেষণ করতে ব্যর্থ হয়েছে। ত্রুটি: ${errMsg}`;
        }

        return res.status(503).json({
          status: "error",
          message: userFriendlyMsg,
          details: errMsg
        });
      }

      const responseText = response.text || "";
      console.log(`Raw Gemini response received from ${successfulModel}.`);
      
      // Clean any markdown formatting if present
      const cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      
      let parsedData;
      try {
        parsedData = JSON.parse(cleanText);
      } catch (parseErr) {
        console.error("JSON parsing error:", parseErr, "Raw response was:", responseText);
        return res.status(500).json({
          status: "error",
          message: "জেমিনি থেকে প্রাপ্ত তথ্য সঠিকভাবে পার্স করা যায়নি।",
          rawResponse: responseText
        });
      }

      res.json({
        status: "success",
        data: parsedData,
        modelUsed: successfulModel
      });

    } catch (err: any) {
      console.error("Gemini API Error in outer catch:", err);
      res.status(500).json({
        status: "error",
        message: err.message || "জেমিনি এপিআই প্রসেস করার সময় কোনো ইন্টারনাল এরর ঘটেছে।"
      });
    }
  });

  // API Route: Use Gemini to parse Index Plot Records from PDF or Image
  app.post("/api/gemini/parse-index-book", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        status: "error",
        message: "গুগল জেমিনি এপিআই কি (GEMINI_API_KEY) পাওয়া যায়নি।"
      });
    }

    const { fileData, mimeType } = req.body;
    if (!fileData) {
      return res.status(400).json({
        status: "error",
        message: "ফাইলের তথ্য পাওয়া যায়নি।"
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      const promptText = `You are an expert in Bangladesh Land Records. 
Your task is to analyze the attached "Index Book" (হাল ও সাবেক দাগের সূচী বই) which lists plots, owners, and land amounts.
Please extract all records into a structured JSON array.

FIELDS TO EXTRACT for each record:
1. halDag (হাল দাগ): The current plot number. Convert Bengali digits to English.
2. sabekDag (সাবেক দাগ): The previous plot number. Convert Bengali digits to English.
3. ownerName (মালিকের নাম): Full name of the owner/possessor (মালিক/জোতদার).
4. landAmount (জমির পরিমাণ): The amount of land, usually in decimals (শতাংশ). Extract the numeric value only. Convert Bengali digits to English.
5. address (ঠিকানা/মৌজা): The Mouza or address mentioned for the plot.
6. remarks (মন্তব্য): Any remarks or khatian numbers mentioned.

You must respond ONLY with a valid JSON array of objects. Do not include markdown styling or explanations.

JSON Schema:
[
  {
    "halDag": "string",
    "sabekDag": "string",
    "ownerName": "string",
    "landAmount": "string",
    "address": "string",
    "remarks": "string"
  }
]`;

      const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];
      let response = null;
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          const resObj = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  mimeType: mimeType || "application/pdf",
                  data: fileData,
                },
              },
              { text: promptText }
            ]
          });
          
          if (resObj && resObj.text) {
            response = resObj;
            break;
          }
        } catch (err: any) {
          lastError = err;
        }
      }

      if (!response || !response.text) {
        throw new Error(lastError?.message || "Failed to parse index book");
      }

      const cleanText = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedData = JSON.parse(cleanText);

      res.json({
        status: "success",
        data: Array.isArray(parsedData) ? parsedData : [parsedData]
      });

    } catch (err: any) {
      console.error("Gemini Index Book Error:", err);
      res.status(500).json({
        status: "error",
        message: "জেমিনি এআই দিয়ে সূচী বই বিশ্লেষণ করতে ব্যর্থ হয়েছে।"
      });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
