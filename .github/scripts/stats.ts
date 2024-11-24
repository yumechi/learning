import { parse, stringify } from "jsr:@std/yaml";

// YAMLファイルの`.re`ファイルをカウントする関数
function countReFiles(data: unknown): number {
  if (Array.isArray(data)) {
    return data.reduce((count, item) => count + countReFiles(item), 0);
  } else if (typeof data === "object" && data !== null) {
    return Object.values(data).reduce((count, value) => count + countReFiles(value), 0);
  } else if (typeof data === "string" && data.endsWith(".re")) {
    return 1;
  }
  return 0;
}

// Slack通知を送信する関数
async function sendSlackNotification(webhookUrl: string, message: string) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });

  if (!response.ok) {
    console.error("Failed to send Slack notification:", await response.text());
    Deno.exit(1);
  }
}

async function main(statsFile: string, yamlFile: string) {
  // const webhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
  // if (!webhookUrl) {
  //   console.error("SLACK_WEBHOOK_URL is not set.");
  //   Deno.exit(1);
  // }

  // 前回のデータを読み込む
  let previousStats: { chapterCount: number } = { chapterCount: 0 };
  try {
    const statsText = await Deno.readTextFile(statsFile);
    previousStats = JSON.parse(statsText);
  } catch {
    console.warn("No previous stats found, using defaults.");
  }

  // YAMLファイルから現在の`.re`ファイル数を取得
  const yamlText = await Deno.readTextFile(yamlFile);
  const yamlData = parse(yamlText);
  const currentReFileCount = countReFiles(yamlData);

  console.log(`Previous .re file count: ${previousStats.chapterCount}`);
  console.log(`Current .re file count: ${currentReFileCount}`);

  // 比較と通知
  if (currentReFileCount !== previousStats.chapterCount) {
    const message = `.re file count has changed from ${previousStats.chapterCount} to ${currentReFileCount}.`;
    console.log("Change detected. Sending notification...");
    // await sendSlackNotification(webhookUrl, message);
  } else {
    console.log("No changes in .re file count.");
  }

  // 新しいデータを保存
  const newStats = { ...previousStats, chapterCount: currentReFileCount };
  await Deno.writeTextFile(statsFile, JSON.stringify(newStats, null, 2));
  console.log("Updated stats saved.");
}

// スクリプトの引数からファイル名を取得
if (Deno.args.length !== 2) {
  console.error("Usage: deno run --allow-read --allow-env --allow-net stats.ts <statsFile> <yamlFile>");
  Deno.exit(1);
}

const [statsFile, yamlFile] = Deno.args;
await main(statsFile, yamlFile);
