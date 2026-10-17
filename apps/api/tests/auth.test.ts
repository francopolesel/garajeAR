import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

describe("auth & isolation", () => {
  const app = createApp();
  let cookieA = "";
  let cookieB = "";
  let vehicleId = "";

  function mergeCookie(res: any) {
    const sc = res.headers["set-cookie"];
    if (sc) {
      for (const c of sc) {
        const kv = c.split(";")[0];
        const name = kv.split("=")[0];
        // replace existing
        const re = new RegExp(name + "=[^;]*");
        if (re.test(cookieA)) cookieA = cookieA.replace(re, kv);
        else cookieA += (cookieA ? "; " : "") + kv;
      }
    }
  }

  it("registers user A", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({ name: "A", email: `a${Date.now()}@test.local`, password: "Password123!" });
    expect(res.status).toBe(201);
    cookieA = (res.headers["set-cookie"] || []).map((c: string) => c.split(";")[0]).join("; ");
  });

  it("user A creates vehicle", async () => {
    const res = await request(app).post("/api/v1/vehicles").set("Cookie", cookieA).set("X-CSRF-Token", cookieA.match(/csrf=([^;]+)/)?.[1] || "").send({ type: "CAR", name: "Acar", make: "Ford", model: "Focus", modelYear: 2021, currentOdometer: 100, odometerUnit: "KM" });
    expect(res.status).toBe(201);
    vehicleId = res.body.data.id;
  });

  it("registers user B", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({ name: "B", email: `b${Date.now()}@test.local`, password: "Password123!" });
    expect(res.status).toBe(201);
    cookieB = (res.headers["set-cookie"] || []).map((c: string) => c.split(";")[0]).join("; ");
  });

  it("user B cannot access user A vehicle", async () => {
    const res = await request(app).get(`/api/v1/vehicles/${vehicleId}`).set("Cookie", cookieB);
    expect(res.status).toBe(404);
  });
});
