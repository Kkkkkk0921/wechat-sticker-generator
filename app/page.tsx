"use client";

import { FormEvent, useMemo, useState } from "react";

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
  const [stickers, setStickers] = useState<GeneratedSticker[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return characterName.trim().length > 0 && characterDescription.trim().length > 0 && !isGenerating;
  }, [characterName, characterDescription, isGenerating]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStickers([]);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          characterName,
          characterDescription
        })
      });

      const payload = (await response.json()) as GenerateResponse;

      if (!response.ok) {
        throw new Error(payload.error || "生成失败，请稍后再试。");
      }

      const images = payload.images ?? [];
      setStickers(images.map((src, index) => ({ id: index + 1, src })));
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
              输入角色名字和角色描述，一次生成 5 张方形表情包图片，可直接预览和下载。
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
                placeholder="例如：打工小熊"
                maxLength={40}
              />
            </div>

            <div className="field">
              <label htmlFor="characterDescription">角色描述</label>
              <textarea
                id="characterDescription"
                value={characterDescription}
                onChange={(event) => setCharacterDescription(event.target.value)}
                placeholder="例如：圆脸、软萌、穿绿色卫衣、表情夸张、适合微信聊天使用"
                maxLength={800}
              />
            </div>

            <button className="primaryButton" disabled={!canSubmit} type="submit">
              {isGenerating ? "生成中..." : "生成 5 张表情包"}
            </button>

            {error ? <p className="error">{error}</p> : null}
          </form>

          <section className="resultsPanel" aria-live="polite">
            <div className="panelHeader">
              <h2>生成结果</h2>
              <span className="status">
                {isGenerating ? "通常需要 1-2 分钟" : stickers.length ? `${stickers.length} 张已生成` : "等待输入"}
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
                        download={`${characterName || "sticker"}-${sticker.id}.png`}
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
