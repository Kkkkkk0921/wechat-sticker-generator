"use client";

import { FormEvent, useMemo, useState } from "react";
import { getStylePresetById, stylePresets, type StylePreset } from "@/lib/stylePresets";

type GeneratedSticker = {
  id: number;
  src: string;
};

type GenerateResponse = {
  images?: string[];
  error?: string;
};

export default function Home() {
  const [characterName, setCharacterName] = useState("");
  const [characterDescription, setCharacterDescription] = useState("");
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [stickers, setStickers] = useState<GeneratedSticker[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState("");
  const selectedStyle = selectedStyleId ? getStylePresetById(selectedStyleId) : null;

  const canSubmit = useMemo(() => {
    return characterName.trim().length > 0 && !isGenerating;
  }, [characterName, isGenerating]);

  function removePresetHint(value: string, preset: StylePreset | null = selectedStyle) {
    return value
      .split("\n")
      .map((line) => {
        const trimmedLine = line.trim();

        if (!trimmedLine.startsWith("风格方向：")) {
          return line;
        }

        const presetHint = [preset, ...stylePresets]
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

  function handleStylePresetClick(preset: StylePreset) {
    if (selectedStyleId === preset.id) {
      setSelectedStyleId(null);
      setCharacterDescription((current) => removePresetHint(current, preset));
      return;
    }

    setSelectedStyleId(preset.id);
    setCharacterDescription((current) => removePresetHint(current));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStickers([]);
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const cleanedDescription = removePresetHint(characterDescription);

      for (let index = 1; index <= 5; index += 1) {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            characterName,
            characterDescription: cleanedDescription,
            styleId: selectedStyle?.id,
            stickerIndex: index,
            singleImage: true
          })
        });

        const contentType = response.headers.get("Content-Type") || "";
        const payload = contentType.includes("application/json")
          ? ((await response.json()) as GenerateResponse)
          : ({ error: `第 ${index} 张生成服务暂时没有返回有效结果，请等待 1 分钟后再试。` } satisfies GenerateResponse);

        if (!response.ok) {
          throw new Error(payload.error || `第 ${index} 张生成失败，请稍后再试。`);
        }

        const image = payload.images?.[0];

        if (!image) {
          throw new Error(`第 ${index} 张没有收到可用图片，请重试。`);
        }

        setStickers((current) => [...current, { id: index, src: image }]);
        setGenerationProgress(index);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请稍后再试。");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div className="titleBlock">
            <p className="kicker">MVP</p>
            <h1>微信表情包生成器</h1>
            <p className="subtitle">
              输入角色名字，选择风格预设，也可以补充角色描述，一次生成 5 张方形表情包图片。
            </p>
          </div>
          <div className="countBadge">5 张 / 次</div>
        </header>

        <section className="workspace">
          <form className="formPanel" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="characterName">角色名字</label>
              <input
                id="characterName"
                value={characterName}
                onChange={(event) => setCharacterName(event.target.value)}
                placeholder="例如：麻薯"
                maxLength={40}
              />
            </div>

            <div className="field">
              <label htmlFor="characterDescription">角色描述</label>
              <textarea
                id="characterDescription"
                value={characterDescription}
                onChange={(event) => setCharacterDescription(event.target.value)}
                placeholder="可选。例如：一只圆滚滚的奶油色比熊犬，头大身子小，短腿，小黑豆眼，小三角鼻，耳朵自然下垂，尾巴像一团棉花。整体像一个软乎乎的麻薯团子，永远保持呆萌、治愈、亲近的气质"
                maxLength={800}
              />
            </div>

            <fieldset className="presetField">
              <legend>图片风格预设</legend>
              <p className="presetHelp">预设图只作为画风基调参考，不会复制里面的角色、物种、姿势或道具。</p>
              <div className="presetGrid">
                {stylePresets.map((preset) => {
                  const isSelected = preset.id === selectedStyleId;

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={`presetCard${isSelected ? " selected" : ""}`}
                      key={preset.id}
                      onClick={() => handleStylePresetClick(preset)}
                      type="button"
                    >
                      <span className="presetImageWrap">
                        <img alt={`${preset.name} 示例图`} src={preset.image} />
                      </span>
                      <span className="presetText">
                        <span className="presetName">{preset.name}</span>
                        <span className="presetMeta">{preset.referenceImages.length} 张画风参考</span>
                        <span className="presetDescription">{preset.description}</span>
                        <span className="presetNote">{preset.referenceNote}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <button className="primaryButton" disabled={!canSubmit} type="submit">
              {isGenerating ? "生成中..." : "生成 5 张表情包"}
            </button>

            {error ? <p className="error">{error}</p> : null}
          </form>

          <section className="resultsPanel" aria-live="polite">
            <div className="panelHeader">
              <h2>生成结果</h2>
              <span className="status">
                {isGenerating
                  ? `正在生成 ${Math.min(generationProgress + 1, 5)} / 5`
                  : stickers.length
                    ? `${stickers.length} 张已生成`
                    : "等待输入"}
              </span>
            </div>

            {stickers.length === 0 ? (
              <div className="emptyState">
                {isGenerating ? "正在生成表情包，请保持页面打开。" : "生成后，5 张表情包会出现在这里。"}
              </div>
            ) : (
              <div className="grid">
                {stickers.map((sticker) => (
                  <article className="sticker" key={sticker.id}>
                    <img alt={`${characterName || "角色"} 表情包 ${sticker.id}`} src={sticker.src} />
                    <div className="stickerFooter">
                      <span>#{sticker.id.toString().padStart(2, "0")}</span>
                      <a
                        className="download"
                        download={`${characterName || "sticker"}-${sticker.id}.jpg`}
                        href={sticker.src}
                      >
                        下载
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
