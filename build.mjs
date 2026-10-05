#!/usr/bin/env node
// Encrypts a static HTML page behind a password and writes a self-contained
// index.html that decrypts it in the browser (Web Crypto, AES-256-GCM,
// PBKDF2-SHA256). Nothing readable is stored in the output.
//
// Usage:
//   PAGE_PASSWORD='your password' node build.mjs src/malco-ai-fluency.html index.html
//   node build.mjs src/malco-ai-fluency.html index.html --password 'your password'

import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto } from "node:crypto";

const { subtle } = webcrypto;
const getRandomValues = (u8) => webcrypto.getRandomValues(u8);

const args = process.argv.slice(2);
const pwIdx = args.indexOf("--password");
let password = process.env.PAGE_PASSWORD || "";
if (pwIdx !== -1) {
  password = args[pwIdx + 1] || "";
  args.splice(pwIdx, 2);
}
const [input, output = "index.html"] = args;

if (!input || !password) {
  console.error("usage: PAGE_PASSWORD=... node build.mjs <input.html> [output.html]");
  process.exit(1);
}

const ITERATIONS = 600_000;
const plaintext = readFileSync(input);
const title = (plaintext.toString("utf8").match(/<title>([^<]*)<\/title>/i) || [, "Protected page"])[1];

const salt = getRandomValues(new Uint8Array(16));
const iv = getRandomValues(new Uint8Array(12));

const baseKey = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
  baseKey,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt"],
);
const ciphertext = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext));

const b64 = (u8) => Buffer.from(u8).toString("base64");
const payload = JSON.stringify({ v: 1, it: ITERATIONS, salt: b64(salt), iv: b64(iv), ct: b64(ciphertext) });

const template = readFileSync(new URL("./gate.template.html", import.meta.url), "utf8");
const html = template
  .replaceAll("__TITLE__", title.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c])))
  .replace("__PAYLOAD__", () => payload.replace(/</g, "\\u003c"));

writeFileSync(output, html);
console.log(`wrote ${output} (${html.length} bytes, ${ciphertext.length} encrypted bytes, title: ${title})`);
