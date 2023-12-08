import { createClient } from "@supabase/supabase-js";
import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import { format, startOfMonth, endOfMonth } from "date-fns";
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.use(cors());

import OpenAI from "openai";
const openai = new OpenAI();

const supabase = createClient(
  "https://jtvdkdhziojophcpguoh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dmRrZGh6aW9qb3BoY3BndW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDE5NTQ0NjQsImV4cCI6MjAxNzUzMDQ2NH0.4s6tvqydGuBebJYayxK1PtQ4yatrUva_D00Z2dbchCo"
);

type Log = {
  id: string;
  date: string;
  foodInput: string[];
  alcohol: boolean;
  bowelMovements: string;
  stress: number;
  pain: boolean;
  nausea: boolean;
};

app.get("/logs", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("Logs")
      .select()
      .order("date", { ascending: false }); // Assuming 'date' is the field name

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error in /logs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/rapports", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("Rapports")
      .select()
      .order("date", { ascending: false }); // Orders by the 'date' field in descending order

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error in /rapports:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/add-log", async (req: Request, res: Response) => {
  const { date, foodInput, alcohol, bowelMovements, stress, pain, nausea } =
    req.body;

  try {
    const { data, error } = await supabase
      .from("Logs")
      .insert([
        { date, foodInput, alcohol, bowelMovements, stress, pain, nausea },
      ]);
    if (error) {
      console.error("Supabase error in /add-log:", error);
      // Determine if it's a client error (4xx) or server error (5xx)
      const statusCode = error.code.startsWith("22") ? 400 : 500; // Example, adjust as needed
      res.status(statusCode).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch (error) {
    console.error("Error in /add-log:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

async function getRecordsForCurrentMonth() {
  // Get the first and last day of the current month
  const firstDayOfMonth = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const lastDayOfMonth = format(endOfMonth(new Date()), "yyyy-MM-dd");

  try {
    let { data, error } = await supabase
      .from("Logs")
      .select("*")
      .gte("date", firstDayOfMonth)
      .lte("date", lastDayOfMonth);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

app.get("/openai", async (req, res) => {
  const dataFromThisMonth = await getRecordsForCurrentMonth();
  console.log(dataFromThisMonth);
  const currentDate = format(new Date(), "yyyy-MM-dd");
  const dataForChat = JSON.stringify(dataFromThisMonth);
  try {
    let data = "";
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Analyze IBS patient data to identify connections between dietary patterns, stress levels, alcohol consumption, and the severity and frequency of bowel movements and pain. Emphasize how alcohol, stress, and certain foods might influence IBS symptoms. Address the analysis directly to 'you,' providing a summarized view of your dietary habits over the past month and their correlation with your symptoms. Deliver your findings in a succinct manner, with no more than five to seven sentences, focusing on five primary insights or trends derived from the data. Refrain from suggesting general lifestyle changes or dietary advice, and avoid discussing the variability of IBS symptoms among individuals or the necessity for medical consultation. The objective is to present a targeted analysis of how your diet and stress levels are related to your IBS symptoms, based on the data provided, while maintaining a direct and personalized approach. ${dataForChat}`,
        },
      ],
      stream: true,
    });
    for await (const chunk of stream) {
      data += chunk.choices[0]?.delta?.content || "";
    }
    console.log(data);

    const { error: rapportError } = await supabase.from("Rapports").insert([
      {
        date: currentDate,
        result: data,
      },
    ]);

    if (rapportError) {
      throw rapportError;
    }
    res.json({ data });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("An unknown error occurred");
    }
  }
});
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
