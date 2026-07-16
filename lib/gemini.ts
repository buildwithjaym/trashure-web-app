import { GoogleGenerativeAI } from "@google/generative-ai";


const apiKey = process.env.GEMINI_API_KEY;


if (!apiKey) {

    throw new Error(
        "Missing GEMINI_API_KEY"
    );

}


export const gemini =
    new GoogleGenerativeAI(apiKey);