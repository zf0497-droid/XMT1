import { NextResponse } from "next/server";

/**
 * 将工程保存到你们自己的后端（服务端代理，密钥不出浏览器）。
 *
 * 环境变量（.env.local）：
 * - PROJECTS_SAVE_API_URL：保存接口完整 URL（POST）。未配置时返回 503。
 * - PROJECTS_API_KEY：与 GET /api/projects 相同的鉴权头（如 x-api-key）。
 *
 * 请求体示例：
 * {
 *   "id": "项目 id",
 *   "overlays": [ ... ],
 *   "aspect_ratio": "16:9",
 *   "background_color": "#ffffff"
 * }
 */
export async function POST(request: Request) {
  try {
    const saveUrl = process.env.PROJECTS_SAVE_API_URL?.trim();
    const apiKey = process.env.PROJECTS_API_KEY;

    if (!saveUrl) {
      console.error(
        "[Projects Save API] PROJECTS_SAVE_API_URL is not configured"
      );
      return NextResponse.json(
        {
          error:
            "Save API not configured. Set PROJECTS_SAVE_API_URL in .env.local",
        },
        { status: 503 }
      );
    }

    if (!apiKey) {
      console.error("[Projects Save API] PROJECTS_API_KEY is not set");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const response = await fetch(saveUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const rateLimitHeaders: Record<string, string> = {};
    const rateLimitLimit = response.headers.get("X-RateLimit-Limit");
    const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
    const rateLimitReset = response.headers.get("X-RateLimit-Reset");
    if (rateLimitLimit)
      rateLimitHeaders["X-RateLimit-Limit"] = rateLimitLimit;
    if (rateLimitRemaining)
      rateLimitHeaders["X-RateLimit-Remaining"] = rateLimitRemaining;
    if (rateLimitReset)
      rateLimitHeaders["X-RateLimit-Reset"] = rateLimitReset;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Projects Save API] Upstream returned ${response.status}: ${errorText}`
      );
      return NextResponse.json(
        { error: `Upstream save failed: ${response.statusText}` },
        { status: response.status, headers: rateLimitHeaders }
      );
    }

    const data = response.headers.get("content-type")?.includes("json")
      ? await response.json()
      : { ok: true };

    return NextResponse.json(data, { headers: rateLimitHeaders });
  } catch (error) {
    console.error("[Projects Save API] Error:", error);
    return NextResponse.json(
      { error: "Failed to save project" },
      { status: 500 }
    );
  }
}
