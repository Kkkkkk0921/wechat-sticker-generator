# WeChat Sticker Generator

一个最小可运行的微信表情包生成 MVP。

## 功能

- 输入角色名字
- 输入角色描述
- 调用 OpenAI Images API 生成 5 张表情包图片
- 在网页中预览和下载图片

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

然后在 `.env.local` 中设置：

```bash
OPENAI_API_KEY=你的 OpenAI API Key
```

打开 `http://localhost:3000`。

## 说明

MVP 不包含照片上传、数据库、登录或复杂 UI。图片不会存储到服务器，只会在当前页面中展示为 base64 data URL。
