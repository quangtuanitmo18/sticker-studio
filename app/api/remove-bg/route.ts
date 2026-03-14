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

    // 2. Try Fal.ai
    try {
      console.log("Trying Fal.ai...");
      const falKey = process.env.FAL_API_KEY;
      if (falKey) {
        const response = await fetch("https://fal.run/fal-ai/bria-rmbg", {
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

    return NextResponse.json({ error: "Background removal is temporarily unavailable. Your original image will be used instead." }, { status: 500 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Something went wrong with background removal. Please try again." }, { status: 500 });
  }
}
