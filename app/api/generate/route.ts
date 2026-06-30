import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getExactStylePresetById, stylePresets, type StylePreset } from "@/lib/stylePresets";

export const runtime = "nodejs";
export const maxDuration = 300;

const OUTPUT_FORMAT = "jpeg";
const DEFAULT_MAX_STYLE_REFERENCE_IMAGES = 2;
const STYLE_REFERENCE_IMAGE_LIMITS: Record<string, number> = {
  "quirky-flat": 4
};
const SUPPORTED_REFERENCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const DEFAULT_CHARACTER_DESCRIPTION =
  "Design the character freely based on the character name and selected style. Make it friendly, memorable, expressive, and suitable as a recurring WeChat sticker character.";
const CHINESE_SLOT_NUMBERS = ["一", "二", "三", "四", "五"];
const EMOTION_LANES = [
  "high-energy positive emotion",
  "low-key confident or smug emotion",
  "strong negative emotion",
  "vulnerable or embarrassed emotion",
  "surprised, confused, or absurd emotion",
  "tired, speechless, or resigned emotion",
  "dramatic refusal or disagreement",
  "focused thinking or plotting"
];
const ACTION_LANES = [
  "big upper-body gesture or hand/paw movement",
  "strong head or body tilt",
  "leaning, shrinking, hiding, or retreating",
  "stretching, jumping, celebrating, or expanding",
  "turning sideways or looking away",
  "interacting with one required accessory or simple prop-like accent",
  "still pose with exaggerated internal tension",
  "off-balance or diagonal posture"
];
const COMPOSITION_LANES = [
  "close crop",
  "looser crop with more negative space",
  "off-center placement",
  "diagonal composition",
  "side-facing or three-quarter angle",
  "low or high placement in the canvas",
  "large silhouette change",
  "minimal icon-like composition"
];
const DIVERSITY_RULE = `
Pack diversity rule:
- Across the 5 generated stickers, keep the same character identity and same visual style, but make the emotional content and physical acting noticeably different.
- If the user did not specify per-image effects, freely vary emotion families, intensity, body/head angle, gesture, posture, crop, facial acting, and small situational acting.
- Avoid near-duplicate outputs where only the mouth, eyebrow, tear, or tiny facial mark changes.
- Each sticker should differ from the others in at least two major ways: emotion family, action/gesture, head or body angle, crop distance, silhouette, composition, or interaction with a required accessory.
- Do not reuse the same front-facing head pose with minor facial edits across the set.
- Prefer one clear acting idea per image, not five mild variants of the same face.
- A big pose/action change is allowed and encouraged when it fits the selected style: leaning, turning, shrinking, stretching, hiding, jumping, pointing, waving, slumping, celebrating, panicking, refusing, thinking, sleeping, or other clear acting choices.
- For head-only or abstract styles, create diversity through silhouette, tilt, crop, negative space, shape placement, facial layout, accessory placement, and graphic rhythm.
- Do not change the character's species/type, core face/head shape, colors, markings, outfit, required accessories, or rendering style just to create variety.
`.trim();
const BIOLOGICAL_STRUCTURE_RULE = `
Biological structure rule:
- The character may be cute, chibi, simplified, or exaggerated, but it must still respect the normal body structure of the intended species or object type.
- Different style presets may simplify the body in different ways. It is acceptable to crop to a head, face, bust, or abstract mascot symbol when the selected style calls for it.
- A cropped or abstract character may omit limbs entirely; omission is better than adding confusing extra limbs.
- If the character is an animal, keep the correct biological structure for that animal: one head, one torso, correct ears, correct eyes, correct mouth or muzzle, and the correct number of legs, paws, wings, fins, and tail for that species.
- Do not add decorative animal features from another species, such as bear ears on a non-bear, rabbit ears on a non-rabbit, hedgehog spikes on a non-hedgehog, horns, shell bumps, dorsal bumps, or monster-like back lumps.
- If the character is a dog or cat, it must never have more than four limbs total. In a full-body front-facing seated sticker, show exactly two front paws and exactly two hind feet; in an abstract or head-only style, show no limbs or only clearly intentional simple paw symbols.
- If a tail is visible, draw it clearly as a tail behind or beside the body, not as another leg or paw.
- If the character is a human, keep normal human body structure: one head, two arms, two hands, two legs, two feet, normal face layout. Cute proportions are allowed, but extra arms, extra legs, duplicated hands, misplaced facial features, or body-horror anatomy are not allowed.
- If the character is a fantasy creature or object mascot, keep one coherent, intentional body plan and do not accidentally add duplicated limbs or malformed parts.
- Avoid uncanny, grotesque, body-horror, mutant, melted, tangled, or anatomically confusing results.
`.trim();
const CHARACTER_IDENTITY_HINTS = [
  {
    patterns: [/小?金毛/i, /金毛寻回犬/i, /golden retriever/i],
    hint:
      "The character is a golden retriever puppy. Keep warm golden or light yellow fur, floppy retriever ears, friendly retriever puppy face, soft dog muzzle, and golden retriever proportions. It must not become a white Maltese, bichon, poodle, samoyed, generic white puppy, bear, rabbit, or cat."
  },
  {
    patterns: [/布偶猫/i, /ragdoll/i],
    hint:
      "The character is a ragdoll cat. Keep cat identity, ragdoll-like soft long fur, cat ears, cat face, and cat proportions. It must not become a dog, bear, rabbit, or generic puppy-like mascot."
  },
  {
    patterns: [/柯基/i, /corgi/i],
    hint:
      "The character is a corgi dog. Keep short legs, long body, large upright ears, corgi face, and corgi proportions. It must not become another dog breed or a generic puppy."
  },
  {
    patterns: [/柴犬/i, /shiba/i],
    hint:
      "The character is a shiba inu dog. Keep curled tail, pointed ears, shiba face, and shiba proportions. It must not become another dog breed or a generic puppy."
  },
  {
    patterns: [/马尔济斯/i, /maltese/i],
    hint:
      "The character is a Maltese dog. Keep small white Maltese identity only when the user explicitly asks for Maltese."
  },
  {
    patterns: [/比熊/i, /bichon/i],
    hint:
      "The character is a bichon frise dog. Keep rounded white bichon identity only when the user explicitly asks for bichon."
  },
  {
    patterns: [/萨摩耶/i, /samoyed/i],
    hint:
      "The character is a samoyed dog. Keep white fluffy samoyed identity, smiling face, and triangular ears only when the user explicitly asks for samoyed."
  },
  {
    patterns: [/哈士奇/i, /husky/i],
    hint:
      "The character is a husky dog. Keep husky mask markings, upright ears, and husky identity. It must not become another dog breed."
  },
  {
    patterns: [/橘猫/i, /orange cat/i],
    hint:
      "The character is an orange tabby cat. Keep cat identity, orange fur, cat ears, cat face, and tabby feeling. It must not become a dog or bear."
  },
  {
    patterns: [/小?猪/i, /piglet/i, /pig\b/i],
    hint:
      "The character is a pig or piglet. Keep a clear pig identity: round snout with nostrils, pig ears, compact pig body or pig-face silhouette, and pig colors if specified. It must not become a dog, bear, rabbit, or realistic farm-animal rendering unless the user explicitly asks for realism."
  },
  {
    patterns: [/仓鼠/i, /hamster/i],
    hint:
      "The character is a hamster. Keep a clear small rodent identity: compact round hamster body, short tiny limbs, small rounded ears, tiny black bead eyes, small pink or dark nose, soft cheek pouches, short muzzle, and no visible long tail. It must not become a bear cub, teddy bear, puppy, rabbit, squirrel, guinea pig, hedgehog, deer, fawn, dinosaur, or generic monster. Do not add antlers, deer ears, dorsal bumps, back spikes, extra ears, horns, shell-like lumps, or creature bumps; any roundness should read as cheek pouches or a soft hamster body."
  },
  {
    patterns: [/大头儿子/i],
    hint:
      "The character is Datou Erzi, a human boy character with a large round human head, short black hair, human ears, human face, and childlike human identity. It must not become a cat, dog, animal, pet mascot, animal-eared character, or furry creature, even if style references show animals."
  },
  {
    patterns: [/男孩/i, /小男孩/i, /儿子/i, /小孩/i, /孩子/i, /人类/i, /human/i, /boy/i, /child/i],
    hint:
      "The character is human. Keep human identity: human head, human ears, human hair, human facial structure, and no animal ears, fur, muzzle, whiskers, paws, or pet body."
  }
];
const STYLE_SPECIFIC_RULES: Record<string, string> = {
  "wechat-cute": `
WeChat-cute preset hard rules:
- This style must always look like a tiny soft WeChat reaction sticker: rounded, pastel, low-detail, healing, and immediately usable in chat.
- Prefer a compact mochi-like bean body, head-heavy chibi body, soft rounded bust, or curled-up dumpling silhouette. Avoid realistic animal proportions.
- Use tiny dot eyes, tiny nose and mouth, pale blush, soft fuzzy crayon or pencil edge texture, flat pastel fills, and a clean white or very pale background.
- The sticker must not be only a polite cute pet pose. Give it a clear young chat reaction through body language: peeking, shrinking into a ball, puffing cheeks, pretending to be calm, speechless staring, sulking, panic-hiding, shy retreating, refusing gently, tired slumping, secretly observing, or similar.
- Make the emotional acting readable at thumbnail size. Use head tilt, crop, silhouette, tiny reaction marks, and simple body pose changes more than detailed facial features.
- Keep limbs short, simple, and few. If the pose could create confusing anatomy, simplify to a face, bust, curled body, or bean body with no visible limbs.
- Do not add default collars, clothes, props, captions, or decorative backgrounds unless the user explicitly asks.
- Do not render detailed fur, realistic paws, plush-toy volume, glossy eyes, 3D shading, semi-realistic animal anatomy, or polite generic pet illustration.
`.trim(),
  "minimal-line": `
Minimal-line preset hard rules:
- This style must always look like a minimal black-line WeChat reaction doodle: pure white background, lots of empty space, sparse loose linework, and almost no fill color.
- Use rounded casual black outlines, tiny dot eyes, tiny mouth, and only the fewest contour cues needed to identify the user's character.
- In principle, aim for the emotional tension of Korean-style simple line puppy stickers without copying any specific character: very simple drawing, but strong feeling through posture, eye direction, tiny mouth shape, and stress marks.
- Preserve the user's species or object identity with minimal signals only: head shape, ears, snout, tail, one key marking, or a simple body blob. Do not fully render fur, body volume, or detailed anatomy.
- The sticker must feel like a young chat reaction with personality, not a complete polished cartoon pet. Use readable acting such as holding head in collapse, stepping back in shock, lying flat, pointing, refusing, eye-dead silence, tiny panic, sulking, crying quietly, confused freeze, exhausted slump, side-eye suspicion, stubborn silence, or similar.
- Let the body squash, shrink, lean, curl, stretch, wobble, or go limp to carry emotion. A simple line pose with strong emotional tension is better than a neatly drawn cute pose.
- Use one or two tiny accent colors only when helpful, such as pink blush, one blue tear, one tiny stress mark, or one small star. Keep accents sparse and secondary to the black line.
- Keep the drawing airy and readable at thumbnail size. More white space and fewer lines are better than a crowded cute illustration.
- Do not add default collars, clothes, props, captions, or decorative backgrounds unless the user explicitly asks.
- Do not use full-color cartoon fills, gradients, fur texture, heavy shadows, painterly texture, polished mascot rendering, crayon texture, thick flat graphic blocks, or detailed body anatomy.
`.trim(),
  "quirky-flat": `
Quirky-flat preset hard rules:
- This style must always look like a flat geometric illustration avatar, niche profile icon, editorial graphic, poster-style character mark, or geometric animal-face logo. It must not look like a cute pet reaction sticker, soft plush illustration, children's drawing, or emoji pack.
- Transform the user's character into a flat graphic face design. Prefer head-only, face-only, cropped bust, or abstract mascot-symbol composition.
- Do not draw a complete body, arms, legs, paws, jumping poses, hugging props, ordinary sticker acting, seated puppy bodies, running pet bodies, or paw-focused poses.
- Use only 3 to 5 large matte flat color shapes: one dominant head shape, one or two ear/silhouette blocks, one oversized nose block or eye block, and one small mouth mark if needed.
- Build the image from blunt geometry, hard shape language, off-center balance, odd proportions, asymmetry, and bold negative space. Avoid soft round mochi-body construction.
- Eyes must be geometric blocks, slits, offset ovals, almond shapes, mismatched marks, droopy marks, or suspicious graphic shapes. Do not use cute dot eyes.
- Nose should be a bold graphic block when the species allows it. Mouth should be crooked, tiny, flat, or abstract.
- The face should feel stylish, weird, adult, dry-humored, ugly-cute, deadpan, suspicious, cool, unimpressed, or low-key rebellious. Avoid sweet healing expressions and rounded children's-book cuteness.
- Preserve the user-specified character only through broad cream color, floppy ear silhouette, large nose cue, face outline, and one key marking. Do not preserve identity by drawing detailed fur, realistic muzzle, full anatomy, visible paws, or many pet features.
- Avoid the cheap template: symmetric face, matching oval eyes, paired eyebrows, blush circles, freckles, cute dog mouth, clean emoji expressions, and polished commercial mascot finish.
- User-specified accessories are mandatory. If the user asks for sunglasses, show them clearly as simple black geometric lens blocks or one connected dark visor shape.
- Reduce fur, anatomy, paws, muzzle, ears, facial details, and expression details aggressively. Do not draw individual fur strokes, fluffy outlines, paw pads, clothing, bandanas, realistic shading, gradients, or polished mascot details.
- Add subtle matte paper or print softness if possible, but keep it flat. No gloss, no plastic, no 3D volume.
- Keep the character non-realistic, non-plush, low-detail, slightly strange, asymmetrical, graphic, artistic, and attitude-driven.
`.trim()
};

type ImageGenerationResponse = {
  data?: Array<{
    b64_json?: string;
  }>;
  error?: {
    message?: string;
    code?: string;
  };
};

type StyleReferenceImage = {
  bytes: Buffer;
  fileName: string;
  mimeType: string;
};

function cleanInput(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStickerIndex(value: unknown) {
  const stickerIndex = Number(value);

  if (!Number.isInteger(stickerIndex)) {
    return null;
  }

  if (stickerIndex < 1 || stickerIndex > 5) {
    return null;
  }

  return stickerIndex;
}

function stripPresetHint(value: string, selectedStyle: StylePreset | null) {
  return value
    .split("\n")
    .map((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine.startsWith("风格方向：")) {
        return line;
      }

      const presetHint = [selectedStyle, ...stylePresets]
        .filter((style): style is StylePreset => Boolean(style))
        .find((style) => trimmedLine.includes(style.promptHint));

      if (!presetHint) {
        return "";
      }

      return trimmedLine.replace(`风格方向：${presetHint.promptHint}`, "").replace(/^，/, "").trim();
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function buildCharacterIdentityBrief(characterName: string, characterDescription: string) {
  const source = `${characterName}\n${characterDescription}`;
  const matchedHints = CHARACTER_IDENTITY_HINTS.filter((entry) =>
    entry.patterns.some((pattern) => pattern.test(source))
  ).map((entry) => entry.hint);

  const baseRule =
    "Resolve the user's intended character identity from the Chinese or English character name and description before applying any style preset. The resolved species, breed, fur color, markings, ears, face shape, body type, clothing, and accessories are mandatory constraints. Literal user description wins over style references, style names, preset examples, and generic cuteness. Do not reinterpret shape words such as round, soft, mochi, fluffy, cute, or tiny as permission to change the species or add features from another animal.";

  return [baseRule, ...matchedHints].join("\n");
}

function shuffleItems<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function hasPerImageInstructions(characterDescription: string) {
  return /第\s*[一二三四五1-5]\s*张|第\s*[一二三四五1-5]\s*个|image\s*[1-5]|sticker\s*[1-5]/i.test(
    characterDescription
  );
}

function buildStickerSlotInstructions(characterDescription: string) {
  const hasExplicitPerImageInstructions = hasPerImageInstructions(characterDescription);
  const emotionLanes = shuffleItems(EMOTION_LANES).slice(0, 5);
  const actionLanes = shuffleItems(ACTION_LANES).slice(0, 5);
  const compositionLanes = shuffleItems(COMPOSITION_LANES).slice(0, 5);

  return [1, 2, 3, 4, 5].map((index) => {
    const slotNumber = CHINESE_SLOT_NUMBERS[index - 1];
    const userInstructionRule = `If the user explicitly specified what image ${index} / 第${index}张 / 第${slotNumber}张 should look like, follow that exact per-image request.`;

    if (hasExplicitPerImageInstructions) {
      return `Sticker ${index} of 5. ${userInstructionRule} If this sticker number is not specified by the user, freely choose a strongly distinct expression, action, pose, silhouette, or composition that does not duplicate the specified stickers.`;
    }

    return [
      `Sticker ${index} of 5.`,
      userInstructionRule,
      "The user did not specify per-image effects, so use this generated diversity direction for this sticker.",
      `Emotional lane: ${emotionLanes[index - 1]}.`,
      `Acting lane: ${actionLanes[index - 1]}.`,
      `Composition lane: ${compositionLanes[index - 1]}.`,
      "Choose the exact expression and action freely within these lanes. Do not copy the other stickers' face, pose, crop, or composition."
    ].join(" ");
  });
}

function getReferenceImageMimeType(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "image/png";
}

async function readStyleReferenceImages(selectedStyle: StylePreset | null) {
  if (!selectedStyle) {
    return [];
  }

  const publicDirectory = path.join(process.cwd(), "public");
  const referenceImageLimit = STYLE_REFERENCE_IMAGE_LIMITS[selectedStyle.id] ?? DEFAULT_MAX_STYLE_REFERENCE_IMAGES;
  const referenceImagePaths = selectedStyle.referenceImages
    .filter((imagePath) => imagePath.startsWith("/style-library/"))
    .filter((imagePath) => SUPPORTED_REFERENCE_EXTENSIONS.has(path.extname(imagePath).toLowerCase()))
    .slice(0, referenceImageLimit);

  try {
    return Promise.all(
      referenceImagePaths.map(async (imagePath) => {
        const fileName = path.basename(imagePath);

        return {
          bytes: await readFile(path.join(publicDirectory, imagePath)),
          fileName,
          mimeType: getReferenceImageMimeType(fileName)
        };
      })
    );
  } catch (error) {
    console.warn(`Style reference library missing or unreadable: ${selectedStyle.id}`, error);
    return [];
  }
}

function extractImages(result: ImageGenerationResponse) {
  return (
    result.data
      ?.map((image) => image.b64_json)
      .filter((image): image is string => Boolean(image))
      .map((image) => `data:image/${OUTPUT_FORMAT};base64,${image}`) ?? []
  );
}

function dataUrlToReferenceImage(dataUrl: string): StyleReferenceImage | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    return null;
  }

  return {
    bytes: Buffer.from(match[2], "base64"),
    fileName: "locked-character-reference.jpeg",
    mimeType: match[1]
  };
}

function buildPrompt(
  characterName: string,
  characterDescription: string,
  characterIdentityBrief: string,
  selectedStyle: StylePreset | null,
  stickerSlotInstruction: string,
  styleReferenceImageCount: number,
  hasLockedCharacterReference: boolean
) {
  const identityReferenceInstruction = hasLockedCharacterReference
    ? `
Input image priority:
- The FIRST input image is the locked character identity reference generated from the user's instructions.
- Preserve the exact same character identity from the first input image: same species or breed, head shape, ear shape, face shape, markings, colors, proportions, outfit, and accessories.
- Preserve the same rendering style from the first input image: same line thickness, simplification level, texture, palette, background treatment, and sticker feeling.
- Use the first input image only as a character identity sheet, not as a pose, expression, crop, or composition reference.
- Actively avoid repeating the first input image's facial expression, head/body angle, crop, and silhouette unless the user explicitly requested the same one.
- Change the expression, action, pose, body/head angle, crop, and composition substantially according to this sticker slot's diversity direction. Do not change the character into another animal, object, or generic mascot.`
    : "";

  const styleReferenceInstruction =
    styleReferenceImageCount > 0
      ? `
- ${hasLockedCharacterReference ? "The remaining input images are" : "All input images are"} style reference image${styleReferenceImageCount === 1 ? "" : "s"} from this preset library.
- Style reference images are ONLY a style baseline and mood board. They define the visual DNA: linework, shape simplification, color palette, texture, edge treatment, detail density, background treatment, and overall sticker feeling.
- Style reference images are NOT content templates and NOT character references. Never reproduce, trace, imitate, or transfer their animal species, breed, face shape, body shape, clothing, props, pose, composition, or text.
- Do not make the output look like a modified copy of any reference image. The generated character must be a new image based on the user's character instructions, rendered in the same broad style family.
- If any style reference image conflicts with the user's character name or description, ignore the reference image content and obey the user's character instructions.`
      : "";

  const styleInstruction = selectedStyle
    ? `
Visual style direction:
- The optional selected preset is "${selectedStyle.name}".
${identityReferenceInstruction}
${styleReferenceInstruction}
- Treat this preset as a rendering direction, not as the character identity.
- Preset examples are a visual style baseline only. They are not templates to copy and they must never override user-provided character identity.
- The character name and character description have absolute highest priority for species, breed, body shape, facial details, clothing, props, colors, and accessories.
- Render the user-described character in this selected visual direction.
- Style consistency is mandatory across all 5 generated stickers.
- Reuse the exact same rendering recipe in every sticker: same line thickness, same color palette, same flatness or texture, same detail level, same background treatment, and same artist hand.
- Do not let the required expression or action change the visual style.
- Style specification: ${selectedStyle.prompt}
- Avoid: ${selectedStyle.negativePrompt}
${selectedStyle.id in STYLE_SPECIFIC_RULES ? STYLE_SPECIFIC_RULES[selectedStyle.id] : ""}
`
    : `
Visual style direction:
- No preset is selected.
${identityReferenceInstruction}
- Create a coherent WeChat sticker illustration style based primarily on the character description.
`;

  return `
Create one square WeChat sticker image of the same original character.
This request should produce exactly one single sticker image.
This image is one member of a five-sticker pack. All pack members must look like they were drawn by the same artist in the same session.

Character name: ${characterName}
Character description: ${characterDescription}
Resolved character identity:
${characterIdentityBrief}
Instruction for this sticker slot: ${stickerSlotInstruction}
${styleInstruction}

Requirements:
- PER-IMAGE REQUEST RULE: do not impose preset emotion/action templates. If the user explicitly says what each image should do, such as "第一张开心，第二张难过", follow the matching instruction for this sticker number. If the user did not specify this sticker number, freely invent a strongly distinct expression, action, pose, or composition.
- ${DIVERSITY_RULE}
- CHARACTER IDENTITY RULE: the character name and description are mandatory constraints, not suggestions.
- The resolved character identity above outranks every style reference image and every style preset instruction.
- If the user names a specific species, breed, object type, costume, marking, or color in Chinese or English, preserve it exactly in every image.
- If the user names a species or breed, generating a different species is a failed result. Do not substitute a visually similar animal because it seems cuter, simpler, rounder, or closer to a reference image.
- Shape and mood words in the user's description, such as round, soft, fluffy, mochi-like, cute, healing, energetic, or sleepy, modify the specified character only. They must never change the species or add unrelated animal traits.
- Example of strict behavior: if the user says "小金毛" or "golden retriever puppy", every output must be a golden retriever puppy with golden or light yellow retriever identity. Never generate a white Maltese, bichon, poodle, samoyed, bear, rabbit, cat, or generic white puppy.
- Example of strict behavior: if the user says "布偶猫" or "Ragdoll cat", every output must be a ragdoll cat. Never generate a dog, bear, rabbit, generic puppy-like mascot, or another animal just because a style reference contains one.
- Example of strict behavior: if the user says "仓鼠" or "hamster", every output must be a hamster. Never generate a bear, deer, rabbit, squirrel, hedgehog, dog, monster, or any animal with antlers, spikes, dorsal bumps, horns, or shell-like lumps.
- Example of strict behavior: if the user names a human character, every output must remain human. Never generate a cat, dog, animal mascot, animal ears, fur, muzzle, whiskers, or paws just because a style reference contains an animal.
- If the selected style reference shows a different animal or character, use only its drawing style and ignore its identity.
- This image must use the exact character identity described above.
- Before drawing, internally lock one fixed character design for the pack, then reuse that same design.
- Keep the same species or breed, same body shape, same face shape, same ears, same fur or skin colors, same markings, same outfit, and same accessories in every image.
- Facial expression, action, pose, body/head angle, crop, and composition may change substantially between stickers in the pack; the species, core proportions, colors, markings, outfit, required accessories, medium, linework, and rendering style must not change.
- Do not redesign the character, do not switch breeds, do not change color patterns, and do not add/remove accessories between images.
- Do not make any sticker more realistic, more detailed, more 3D, or more polished than the others.
- HARD COMPOSITION RULE: each generated image must contain exactly one character, one face, and one single sticker pose.
- The character should be centered and large in the canvas.
- Follow the selected preset's composition language. Some presets use full-body stickers; quirky-flat should use a head, face, bust, or abstract symbol composition with strong shape language.
- Do not draw multiple copies of the character in the same image.
- Do not draw five expressions inside one image.
- Do not create a collage, grid, contact sheet, sticker sheet, sticker pack preview, multi-panel layout, or multiple small stickers inside one image.
- ${BIOLOGICAL_STRUCTURE_RULE}
- Anatomy must be clean and intentional. Do not draw extra limbs, duplicate paws, five legs, tangled legs, floating paws, or malformed body parts.
- Make this sticker's freely chosen or user-specified expression/action visually obvious and different from the other stickers in the pack.
- Use a simple light background.
- Do not include captions, watermarks, UI, logos, or extra text.
- The images should be suitable for daily WeChat conversations.
`.trim();
}

async function generateWithTextOnly(apiKey: string, model: string, prompt: string) {
  const response = await fetchWithRetry("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "low",
      output_format: OUTPUT_FORMAT,
      output_compression: 70
    })
  });

  const result = (await response.json()) as ImageGenerationResponse;

  if (!response.ok) {
    throw new Error(result.error?.message || "OpenAI 图片生成失败。");
  }

  return extractImages(result);
}

async function fetchWithRetry(url: string, init: RequestInit) {
  try {
    return await fetch(url, init);
  } catch (error) {
    console.warn("OpenAI image request failed once, retrying", error);
    return fetch(url, init);
  }
}

async function generateWithImageReferences(
  apiKey: string,
  model: string,
  prompt: string,
  referenceImages: StyleReferenceImage[]
) {
  const formData = new FormData();
  formData.append("model", model);
  formData.append("prompt", prompt);
  formData.append("size", "1024x1024");
  formData.append("quality", "low");
  formData.append("output_format", OUTPUT_FORMAT);
  formData.append("output_compression", "70");

  referenceImages.forEach((image) => {
    const blob = new Blob([new Uint8Array(image.bytes)], { type: image.mimeType });
    formData.append("image[]", blob, image.fileName);
  });

  const response = await fetchWithRetry("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  });

  const result = (await response.json()) as ImageGenerationResponse;

  if (!response.ok) {
    throw new Error(result.error?.message || "OpenAI 图片参考生成失败。");
  }

  return extractImages(result);
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
  const styleId = cleanInput(payload.styleId);
  const singleImage = payload.singleImage === true;
  const stickerIndex = cleanStickerIndex(payload.stickerIndex);

  if (!characterName) {
    return NextResponse.json({ error: "请填写角色名字。" }, { status: 400 });
  }

  if (singleImage && !stickerIndex) {
    return NextResponse.json({ error: "单张生成需要提供 1-5 的图片序号。" }, { status: 400 });
  }

  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
  const selectedStyle = styleId ? getExactStylePresetById(styleId) : null;
  const userCharacterDescription = stripPresetHint(characterDescription, selectedStyle);
  const finalCharacterDescription = userCharacterDescription || DEFAULT_CHARACTER_DESCRIPTION;
  const characterNameForPrompt = characterName.slice(0, 80);
  const characterDescriptionForPrompt = finalCharacterDescription.slice(0, 1200);
  const characterIdentityBrief = buildCharacterIdentityBrief(
    characterNameForPrompt,
    characterDescriptionForPrompt
  ).slice(0, 1600);

  try {
    const stickerSlotInstructions = buildStickerSlotInstructions(characterDescriptionForPrompt);
    const generateTextOnlySticker = async (stickerSlotInstruction: string) => {
      const prompt = buildPrompt(
        characterNameForPrompt,
        characterDescriptionForPrompt,
        characterIdentityBrief,
        selectedStyle,
        stickerSlotInstruction,
        0,
        false
      );

      return generateWithTextOnly(apiKey, model, prompt);
    };

    if (singleImage && stickerIndex) {
      const images = await generateTextOnlySticker(stickerSlotInstructions[stickerIndex - 1]);

      if (images.length === 0) {
        return NextResponse.json({ error: "没有收到可用图片，请重试。" }, { status: 502 });
      }

      return NextResponse.json({ images });
    }

    const styleReferenceImages = await readStyleReferenceImages(selectedStyle);
    const shouldUseStyleReferencesForFirstImage = false;
    const generateSticker = async (
      stickerSlotInstruction: string,
      lockedCharacterReference: StyleReferenceImage | null,
      includeStyleReferences: boolean
    ) => {
      const imageReferences = [
        ...(lockedCharacterReference ? [lockedCharacterReference] : []),
        ...(includeStyleReferences ? styleReferenceImages : [])
      ];
      const prompt = buildPrompt(
        characterNameForPrompt,
        characterDescriptionForPrompt,
        characterIdentityBrief,
        selectedStyle,
        stickerSlotInstruction,
        includeStyleReferences ? styleReferenceImages.length : 0,
        Boolean(lockedCharacterReference)
      );

      const generatedImages =
        imageReferences.length > 0
          ? await generateWithImageReferences(apiKey, model, prompt, imageReferences)
          : await generateWithTextOnly(apiKey, model, prompt);

      return generatedImages;
    };

    const firstImages = await generateSticker(stickerSlotInstructions[0], null, shouldUseStyleReferencesForFirstImage);
    const lockedCharacterReference = firstImages[0] ? dataUrlToReferenceImage(firstImages[0]) : null;
    const remainingGroups = await Promise.all(
      stickerSlotInstructions
        .slice(1)
        .map((stickerSlotInstruction) => generateSticker(stickerSlotInstruction, lockedCharacterReference, true))
    );
    const images = [...firstImages, ...remainingGroups.flat()];

    if (images.length === 0) {
      return NextResponse.json({ error: "没有收到可用图片，请重试。" }, { status: 502 });
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Image generation failed", error);
    const message = error instanceof Error ? error.message : "生成请求失败，请检查网络或稍后重试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
