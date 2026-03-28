import assert from "node:assert";
import { dirname } from "node:path";
import type { NextConfig } from "next";

assert(process.env.BLOB_BASE_URL, "you must have defined BLOB_BASE_URL");

const allowedDevOrigins = [
  "127.0.0.1",
  "localhost",
  "192.168.18.51",
  "192.168.18.54",
];

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  allowedDevOrigins,
  images: {
    remotePatterns: [new URL(`${process.env.BLOB_BASE_URL}/**`)],
  },
  turbopack: {
    root: dirname(__filename),
  },
};

export default nextConfig;
