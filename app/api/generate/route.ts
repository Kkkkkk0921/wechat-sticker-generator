import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const STICKER_COUNT = 5;
const OUTPUT_FORMAT = "jpeg";

type ImageGenerationResponse = {
  data?: Array<{
    b64_json?: string;
  }>;
  error?: {
    message?: string;
    code?: string;
  };
};

function cleanInput(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildPrompt(characterName: string, characterDescription: string) {
  return `
Create a WeChat sticker pack with ${STICKER_COUNT} square images of the same original character.

Character name: ${characterName}
Character description: ${characterDescription}

Requirements:
- Make each image a different expressive chat sticker.
- Cover moods like happy, shocked, angry, crying, proud, confused, tired, cheering, pleading, and speechless.
- Keep the character visually consistent across all images.
- Use a cute, expressive, clean sticker illustration style.
- Use a simple light background.
- Do not include captions, watermarks, UI, logos, or extra text.
- The images should be suitable for daily WeChat conversations.
`.trim();
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "缺少 OPENAI_API_KEY，请先在 .env.local 中配置。" },
      { status: 500 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const characterName = cleanInput(payload.characterName);
  const characterDescription = cleanInput(payload.characterDescription);

  if (!characterName || !characterDescription) {
    return NextResponse.json({ error: "请填写角色名字和角色描述。" }, { status: 400 });
  }

  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
  const prompt = buildPrompt(characterName.slice(0, 80), characterDescription.slice(0, 1200));

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        prompt,
        n: STICKER_COUNT,
        size: "1024x1024",
        quality: "low",
        output_format: OUTPUT_FORMAT,
        output_compression: 70
      })
    });

    const result = (await response.json()) as ImageGenerationResponse;

    if (!response.ok) {
      return NextResponse.json(
        { error: result.error?.message || "OpenAI 图片生成失败。" },
        { status: response.status }
      );
    }

    const images =
      result.data
        ?.map((image) => image.b64_json)
        .filter((image): image is string => Boolean(image))
        .map((image) => `data:image/${OUTPUT_FORMAT};base64,${image}`) ?? [];

    if (images.length === 0) {
      return NextResponse.json({ error: "没有收到可用图片，请重试。" }, { status: 502 });
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Image generation failed", error);
    return NextResponse.json({ error: "生成请求失败，请检查网络或稍后重试。" }, { status: 500 });
  }
}
