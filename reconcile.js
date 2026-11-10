// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n").filter((l) => l.length > 0);

const latestByTxn = new Map();

for (const line of lines) {
  let event;
  try {
    event = JSON.parse(line);
  } catch (e) {
    continue;
  }

  if (!event || typeof event !== "object" || !event.txn_id) {
    continue;
  }

  const id = String(event.txn_id).trim();
  if (!id) continue;

  const currentTs = Date.parse(event.ts);
  const existing = latestByTxn.get(id);

  if (!existing) {
    latestByTxn.set(id, event);
  } else {
    const existingTs = Date.parse(existing.ts);
    if (!Number.isNaN(currentTs) && (Number.isNaN(existingTs) || currentTs >= existingTs)) {
      latestByTxn.set(id, event);
    }
  }
}

let total = 0;
let count = 0;

for (const event of latestByTxn.values()) {
  if (event.status === "success") {
    total += Number(event.amount);
    count += 1;
    console.log("ok")
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
