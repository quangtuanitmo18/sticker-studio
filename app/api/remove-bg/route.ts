import { NextResponse } from "next/server";
import Replicate from "replicate";

async function fetchImageAsBase64(url: string) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const contentType = response.headers.get("content-type") || "image/png";
  return `data:${contentType};base64,${base64}`;
}

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    // 1. Try Remove.bg
    try {
      console.log("Trying Remove.bg...");
      const removeBgKey = process.env.REMOVE_BG_API_KEY;
      
      if (removeBgKey) {
        const isBase64 = imageUrl.startsWith('data:');
        const bodyPayload = isBase64 
          ? { image_file_b64: imageUrl.split(',')[1], size: "auto" }
          : { image_url: imageUrl, size: "auto" };

        const response = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: {
            "X-Api-Key": removeBgKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyPayload),
        });

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          console.log("Remove.bg succeeded");
          return NextResponse.json({ url: `data:image/png;base64,${base64}` });
        } else {
          console.error("Remove.bg failed:", await response.text());
        }
      } else {
         console.log("Skipping Remove.bg: no API key");
      }
    } catch (e) {
      console.error("Remove.bg error:", e);
    }

    // 2. Try Fal.ai (updated model: birefnet)
    try {
      console.log("Trying Fal.ai...");
      const falKey = process.env.FAL_API_KEY;
      if (falKey) {
        const response = await fetch("https://fal.run/fal-ai/birefnet", {
          method: "POST",
          headers: {
            "Authorization": `Key ${falKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: imageUrl,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.image && data.image.url) {
            console.log("Fal.ai succeeded");
            const base64Url = await fetchImageAsBase64(data.image.url);
            return NextResponse.json({ url: base64Url });
          }
        } else {
          console.error("Fal.ai failed:", await response.text());
        }
      } else {
         console.log("Skipping Fal.ai: no API key");
      }
    } catch (e) {
      console.error("Fal.ai error:", e);
    }

    // 3. Try Replicate
    try {
      console.log("Trying Replicate...");
      const replicateKey = process.env.REPLICATE_API_TOKEN;
      if (replicateKey) {
        const replicate = new Replicate({
          auth: replicateKey,
        });

        const output = await replicate.run(
          "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",
          {
            input: {
              image: imageUrl,
            }
          }
        );

        if (output) {
          console.log("Replicate succeeded");
          const base64Url = await fetchImageAsBase64(output as unknown as string);
          return NextResponse.json({ url: base64Url });
        }
      } else {
         console.log("Skipping Replicate: no API key");
      }
    } catch (e) {
      console.error("Replicate error:", e);
    }

    // 4. Try Gemini (free fallback)
    try {
      console.log("Trying Gemini for background removal...");
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: geminiKey });

        // Get image as base64
        let imageBase64: string;
        let mimeType: string;
        if (imageUrl.startsWith("data:")) {
          mimeType = imageUrl.split(";")[0].split(":")[1];
          imageBase64 = imageUrl.split(",")[1];
        } else {
          const imgResponse = await fetch(imageUrl);
          const buffer = Buffer.from(await imgResponse.arrayBuffer());
          imageBase64 = buffer.toString("base64");
          mimeType = imgResponse.headers.get("content-type") || "image/png";
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: [
            {
              parts: [
                {
                  text: "Remove the background from this image completely. Return ONLY the subject/foreground object with a transparent background. Output as a PNG image with transparency.",
                },
                {
                  inlineData: {
                    data: imageBase64,
                    mimeType,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            console.log("Gemini background removal succeeded");
            const resultMime = part.inlineData.mimeType || "image/png";
            return NextResponse.json({
              url: `data:${resultMime};base64,${part.inlineData.data}`,
            });
          }
        }
        console.log("Gemini returned no image data");
      } else {
        console.log("Skipping Gemini: no API key");
      }
    } catch (e) {
      console.error("Gemini error:", e);
    }

    return NextResponse.json({ error: "Background removal is temporarily unavailable. Your original image will be used instead." }, { status: 500 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Something went wrong with background removal. Please try again." }, { status: 500 });
  }
}

