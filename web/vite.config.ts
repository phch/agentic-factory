import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Touched to trigger the Pages deploy. VITE_BASE is set by the Pages workflow to "/<repo>/".
export default defineConfig({ base: process.env.VITE_BASE ?? "/", plugins: [react()] });
