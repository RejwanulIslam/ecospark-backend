import dotenv from "dotenv";
dotenv.config();

import app from "./app";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 EcoSpark Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("📴 SIGTERM received — shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("📴 SIGINT received — shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed.");
    process.exit(0);
  });
});

export default server;
