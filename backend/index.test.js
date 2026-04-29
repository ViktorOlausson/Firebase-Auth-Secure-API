import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import { createServer } from "node:http";

// We build a tiny version of your Express app right here in the test.
// This is the same verifyToken logic from your middleware/auth.js —
// copy it in exactly as it is in your file.

// Paste your verifyToken function here:
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // In a real test this would call firebase-admin.
    // For now we accept one hard-coded 'test-token' so the
    // test can run without a real Firebase project.
    if (token !== "test-token") throw new Error("bad token");

    req.user = { uid: "user-123", email: "test@test.com" };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// A small test app — same route as your real backend
const app = express();
app.use(express.json());

app.get("/api/secure-data", verifyToken, (req, res) => {
  res.json({ message: "This is protected data!" });
});

// beforeAll starts the server before any test runs
// afterAll shuts it down cleanly afterwards
let server;
let baseUrl;

beforeAll(() => {
  server = createServer(app);
  server.listen(); // port 0 = pick any free port automatically
  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;
});

afterAll(() => server.close());

// Tests
describe("GET /api/secure-data", () => {
  // Test 1: no token at all — should be blocked
  it("returns 401 when there is no token", async () => {
    const res = await fetch(`${baseUrl}/api/secure-data`);
    expect(res.status).toBe(401);
  });

  // Test 2: wrong token — should also be blocked
  it("returns 401 when the token is wrong", async () => {
    const res = await fetch(`${baseUrl}/api/secure-data`, {
      headers: { Authorization: "Bearer wrong-token" },
    });
    expect(res.status).toBe(401);
  });

  // Test 3: correct token — should get the data
  it("returns 200 and data when the token is correct", async () => {
    const res = await fetch(`${baseUrl}/api/secure-data`, {
      headers: { Authorization: "Bearer test-token" },
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toMatch(/protected data/i);
  });
});
