export type StylePreset = {
  id: string;
  name: string;
  description: string;
  image: string;
  referenceImages: string[];
  referenceNote: string;
  promptHint: string;
  prompt: string;
  negativePrompt: string;
};

export const stylePresets: StylePreset[] = [
  {
    id: "wechat-cute",
    name: "微信萌宠",
    description: "圆润可爱，适合微信表情包",
    image: "/presets/wechat-cute.png",
    referenceImages: [
      "/style-library/wechat-cute/01.jpg",
      "/style-library/wechat-cute/02.jpg",
      "/style-library/wechat-cute/03.jpg",
      "/style-library/wechat-cute/04.jpg",
      "/style-library/wechat-cute/05.jpg"
    ],
    referenceNote: "只取小小只、软糯、圆润、粉彩、蜡笔毛边和治愈反应感，不复制素材里的角色或姿势",
    promptHint: "小小只软萌微信表情，像软糯团子，圆形身体或圆润大头，豆豆眼，小鼻子小嘴，淡腮红，软蜡笔毛边，柔和粉彩，白底，低细节；动作要像年轻人聊天反应表情：探头、委屈缩成一团、气鼓鼓、无语、害羞、装作镇定、偷偷观察；不要默认项圈或衣服",
    prompt:
      "tiny soft 2D kawaii WeChat reaction sticker style inspired by the preset style baseline only: compact mochi-like bean body, rounded head-heavy silhouette, soft chubby proportions, tiny dot eyes, tiny simple nose and mouth, pale blush cheeks, soft fuzzy hand-drawn crayon or pencil outer edges, flat soft pastel fills, low-detail cute icon, gentle healing feeling, white or very pale background, and only one or two tiny reaction marks when useful. Make it feel like a young chat sticker reaction, not a polite pet illustration: clear meme-like emotional acting such as peeking, shrinking into a ball, puffing cheeks, pretending to be calm, being speechless, sulking, panic-hiding, shy retreating, refusing gently, tired slumping, or secretly observing. Keep the character tiny, soft, simple, and huggable, but make the pose and emotion immediately readable. Use simple silhouette changes and cute exaggerated body language instead of detailed facial anatomy. Do not add collars, clothes, accessories, props, captions, or decorative backgrounds unless the user explicitly asks. The reference images define mood, linework, texture, simplification level, edge softness, palette, and healing sticker feeling only; never copy their character species, identity, pose, clothing, props, or composition",
    negativePrompt:
      "Do not use realistic rendering, semi-realistic plush toy style, 3D volume, airbrushed shading, realistic animal anatomy, realistic snout or paws, detailed fur, glossy large eyes, sharp vector icon style, minimalist line-only style, thick flat graphic blocks, complex backgrounds, hard shadows, dense decorations, default collars, default clothes, unnecessary props, text, watermarks, or collage layouts."
  },
  {
    id: "minimal-line",
    name: "极简线条",
    description: "黑线白底，少量点缀色",
    image: "/presets/minimal-line.png",
    referenceImages: [
      "/style-library/minimal-line/01.png",
      "/style-library/minimal-line/02.png",
      "/style-library/minimal-line/03.png",
      "/style-library/minimal-line/04.png",
      "/style-library/minimal-line/05.png"
    ],
    referenceNote: "只取白底、黑色松弛手绘线、大留白、极少点缀色和强情绪张力，不复制素材里的白色小狗",
    promptHint: "极简黑线微信表情，参考韩系线条小狗那种简单但情绪很足的感觉；纯白底，大量留白，松弛圆润粗黑线，几乎无填色，只保留豆豆眼、小嘴、关键轮廓和少量粉色腮红或蓝色眼泪；姿态要有张力：抱头崩溃、后退震惊、趴倒、无语凝视、委屈缩小、指指点点、拒绝营业、眼神死；不要完整精致卡通渲染",
    prompt:
      "minimal cute black-line WeChat reaction sticker style inspired by the preset style baseline only: pure white background, lots of empty space, sparse but confident black hand-drawn outline, rounded loose contour lines, almost no fill color, tiny dot eyes, tiny mouth, very low detail, and a single centered character. Aim for the feeling of Korean-style simple line puppy stickers in principle only: very simple drawing, but strong emotional tension, elastic posture, and instantly readable chat reactions. Use only the fewest contour cues needed to preserve the user's species or object identity: head outline, ears, snout, tail, body blob, or one key marking. Make it feel like a quick young chat reaction doodle with personality, not a generic cute cartoon: clear meme-like acting such as holding head in collapse, stepping back in shock, lying flat, pointing, refusing, eye-dead silence, tiny panic, sulking, crying quietly, confused freeze, exhausted slump, side-eye suspicion, or stubborn silence. Let the body squash, shrink, lean, curl, stretch, or wobble to carry emotion. Use one or two tiny accent colors only when useful, such as pink blush, one blue tear, one tiny stress mark, or one small star. Keep the linework casual, imperfect, airy, and readable at thumbnail size. The reference images define linework, white space, simplification level, and accent-color usage only; never copy their character species, identity, pose, clothing, props, or composition",
    negativePrompt:
      "Do not use full-color cartoon rendering, soft pastel plush style, furry texture, gradients, heavy shading, detailed backgrounds, realistic anatomy, polished vector mascot style, crayon texture, thick flat graphic blocks, complex props, default clothing, default collars, dense decorations, many accent colors, or multi-character sheets."
  },
  {
    id: "quirky-flat",
    name: "怪趣扁平",
    description: "艺术图形头像，大色块概括",
    image: "/presets/quirky-flat.png",
    referenceImages: [
      "/style-library/quirky-flat/01.png",
      "/style-library/quirky-flat/02.png",
      "/style-library/quirky-flat/03.png",
      "/style-library/quirky-flat/04.png",
      "/style-library/quirky-flat/05.png",
      "/style-library/quirky-flat/06.png"
    ],
    referenceNote: "只取几何脸部、大色块、图形五官、非对称和插画头像态度，不复制素材里的角色内容",
    promptHint: "怪趣扁平几何插画头像，不要萌宠表情包；把角色重构成平面图形脸：大块头型、几何耳朵、巨大鼻块或眼块、歪斜五官、少量硬边色块，像小众头像/海报图形/独立插画；不画完整身体，不画可爱小爪子，不用豆豆眼，不用软糯圆团质感",
    prompt:
      "STRICT quirky flat geometric illustration avatar style inspired by the preset style baseline only: make it feel like a small independent illustration, niche profile icon, editorial graphic, poster-style character mark, or geometric animal-face logo, not a cute pet reaction sticker and not a children's drawing. Transform the user's character into a flat graphic face design. Use only 3 to 5 large matte flat color shapes: one dominant head shape, one or two ear/silhouette blocks, one oversized nose block or eye block, and one small mouth mark if needed. Prefer head-only, face-only, cropped bust, or abstract mascot-symbol composition. Do not draw a complete body, arms, legs, paws, jumping poses, hugging props, or ordinary sticker acting. Eyes should be geometric blocks, slits, offset ovals, almond shapes, or mismatched marks; do not use cute dot eyes. Nose should be a bold graphic block when the species allows it. Mouth should be crooked, tiny, flat, or abstract. Use blunt geometry, hard shape language, off-center balance, odd proportions, asymmetry, and bold negative space. The mood should feel stylish, weird, adult, dry-humored, unimpressed, suspicious, deadpan, low-key rebellious, or ugly-cute, rather than sweet, healing, soft, or childish. Preserve identity only through broad cream color, floppy ear silhouette, large nose cue, face outline, and one key marking. The reference images define graphic rhythm, palette, geometric face construction, flatness, imperfection, and attitude only; never copy their character species, identity, pose, clothing, props, or composition",
    negativePrompt:
      "Do not use soft fuzzy plush style, cute chibi pet proportions, mochi dumpling body, soft rounded healing sticker style, generic dog emoji face, cute dot eyes, symmetrical face, matching oval eyes, blush spots, freckles, eyebrow pairs, cute commercial puppy sticker, realistic puppy illustration, full-body pet illustration, seated pet body, running pet body, visible paws, paw pads, detailed fur, fur strokes, realistic ears, realistic muzzle detail, clothing, scarf, bandana, props, complex shadows, glossy gradients, watercolor, crayon texture, semi-realistic anatomy, polished commercial mascot style, minimal black line-only style, or sticker sheet layouts."
  }
];

export const defaultStylePresetId = "wechat-cute";

export function getStylePresetById(id: string) {
  return stylePresets.find((preset) => preset.id === id) ?? stylePresets[0];
}

export function getExactStylePresetById(id: string) {
  return stylePresets.find((preset) => preset.id === id) ?? null;
}
