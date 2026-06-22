import { NextResponse } from "next/server";
import { SITE } from "@/lib/constants";

const BING_INDEXNOW_ENDPOINT = "https://www.bing.com/indexnow";
const YANDEX_INDEXNOW_ENDPOINT = "https://yandex.com/indexnow";

function publicUrls() {
  const base = SITE.url;
  return [
    `${base}/`,
    `${base}/book`,
    `${base}/instructors`,
    `${base}/instructors/lukaah`,
    `${base}/instructors/estee`,
    `${base}/about`,
    `${base}/faq`,
    `${base}/contact`,
  ];
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = {
    host: new URL(SITE.url).host,
    key: SITE.indexNowKey,
    keyLocation: `${SITE.url}/${SITE.indexNowKey}.txt`,
    urlList: publicUrls(),
  };

  const endpoints = [BING_INDEXNOW_ENDPOINT, YANDEX_INDEXNOW_ENDPOINT];
  const results = await Promise.all(
    endpoints.map(async (endpoint) => {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const text = await response.text();
        return { endpoint, ok: response.ok, status: response.status, body: text.slice(0, 300) };
      } catch (error) {
        return { endpoint, ok: false, status: 0, body: String(error) };
      }
    })
  );

  return NextResponse.json({ submitted: body.urlList.length, results });
}
