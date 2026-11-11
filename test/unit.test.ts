import { describe, expect, it } from "vitest";
import { parseCannedReplies, renderCannedReply } from "../src/canned.js";
import { loadConfig, normalizeHost } from "../src/config.js";
import { formatTranscript, parseTime, templatePlaceholders, windowFromEvents } from "../src/format.js";

describe("config", () => {
  it("normalises hosts pasted with tenant IDs", () => {
    expect(normalizeHost("live-mt-server.wati.io/123456/")).toBe("https://live-mt-server.wati.io");
    expect(normalizeHost("https://eu-api.wati.io/api/v1")).toBe("https://eu-api.wati.io");
  });

  it("requires a token and host, supports regions and strips 'Bearer '", () => {
    expect(() => loadConfig({})).toThrow(/WATI_API_TOKEN/);
    expect(() => loadConfig({ WATI_API_TOKEN: "t" })).toThrow(/WATI_API_HOST/);
    const c = loadConfig({ WATI_API_TOKEN: "Bearer abc", WATI_REGION: "eu", WATI_READ_ONLY: "true" });
    expect(c.apiToken).toBe("abc");
    expect(c.apiHost).toBe("https://eu-api.wati.io");
    expect(c.readOnly).toBe(true);
    expect(c.requireConfirm).toBe(true);
  });
});

describe("24h window", () => {
  const now = new Date("2026-11-11T12:00:00Z");
  it("is open within 24h of the last customer message", () => {
    const w = windowFromEvents(
      [
        { event_type: "message", owner: false, created: "2026-11-10T20:00:00Z" },
        { event_type: "message", owner: true, created: "2026-11-11T11:00:00Z" },
      ],
      now,
    );
    expect(w.state).toBe("open");
    expect(w.expires_at).toBe("2026-11-11T20:00:00.000Z");
  });

  it("is expired after 24h and unknown without customer messages", () => {
    expect(windowFromEvents([{ event_type: "message", owner: false, created: "2026-11-10T11:00:00Z" }], now).state).toBe("expired");
    expect(windowFromEvents([{ event_type: "ticket", owner: false, created: "2026-11-11T11:00:00Z" }], now).state).toBe("unknown");
  });

  it("parses unix timestamps in seconds and ms", () => {
    expect(parseTime("1762862400")?.toISOString()).toBe("2025-11-11T12:00:00.000Z");
    expect(parseTime(1762862400000)?.toISOString()).toBe("2025-11-11T12:00:00.000Z");
    expect(parseTime("garbage")).toBeUndefined();
  });
});

describe("formatting", () => {
  it("formats media, failures and non-message events", () => {
    const out = formatTranscript([
      { event_type: "message", owner: false, type: "image", text: "data/images/x.jpg", created: "2026-11-11T10:00:00Z" },
      { event_type: "ticket", text: "", event_description: "The chat has been closed by Bot", created: "2026-11-11T10:01:00Z" },
      { event_type: "message", owner: true, text: "hi", failed_detail: "Re-engagement message", created: "2026-11-11T10:02:00Z" },
      { event_type: "message", owner: true, text: "Ola", operator_name: "Bot ", bot_type: "regular", timestamp: "1794439121", created: "2026-11-11T23:18:43Z" },
      { event_type: "ticket", text: "", created: "2026-11-11T10:03:00Z" },
    ]);
    expect(out.split("\n")).toEqual([
      "[2026-11-11 10:00Z] Customer: [image] data/images/x.jpg",
      "[2026-11-11 10:01Z] · The chat has been closed by Bot",
      "[2026-11-11 10:02Z] Business: hi [FAILED: Re-engagement message]",
      "[2026-11-11 10:03Z] · ticket",
      "[2026-11-11 23:18Z] Bot: Ola",
    ]);
  });

  it("finds template placeholders", () => {
    expect(templatePlaceholders("Hi {{name}}, {{ 1 }} {{name}}")).toEqual(["name", "1"]);
  });
});

describe("canned replies", () => {
  it("parses objects and plain strings, and renders variables", () => {
    const [a, b] = parseCannedReplies(JSON.stringify({ a: { title: "A", text: "Hi {{name}}" }, b: "Plain" }));
    expect(a!.variables).toEqual(["name"]);
    expect(renderCannedReply(a!, { name: "Ana" })).toBe("Hi Ana");
    expect(b!.title).toBe("b");
    expect(() => renderCannedReply(a!)).toThrow(/name/);
    expect(() => parseCannedReplies("[]")).toThrow();
  });
});
