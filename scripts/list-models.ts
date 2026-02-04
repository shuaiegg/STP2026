import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function list() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

list();
