import { createClient } from "@supabase/supabase-js";
import express, { Request, Response } from "express";

const app = express();
const port = process.env.PORT || 3000;

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

app.get("/logs", (req: Request, res: Response) => {
  res.send("Hello, TypeScript Express!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
