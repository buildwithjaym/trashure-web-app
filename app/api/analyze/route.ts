import { NextRequest, NextResponse } from "next/server";

import { gemini } from "@/lib/gemini";
import { trashurePrompt } from "@/lib/aiPrompt";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        {
          error: "Image URL is required.",
        },
        {
          status: 400,
        }
      );
    }

    // Download image
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error("Unable to download image.");
    }

    const imageBuffer = Buffer.from(
      await imageResponse.arrayBuffer()
    );

    const base64Image = imageBuffer.toString("base64");

    const model = gemini.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
    });

    const result = await model.generateContent([
      trashurePrompt,
      {
        inlineData: {
          mimeType: "image/webp",
          data: base64Image,
        },
      },
    ]);

    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Gemini did not return valid JSON.");
    }

    const data = JSON.parse(jsonMatch[0]);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: "AI analysis failed.",
        details: error.message,
      },
      {
        status: 500,
      }
    );
  }
}