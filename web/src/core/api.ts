import { treaty } from '@elysiajs/eden';
import type { App } from '@cuan/core/src/app'; // Make sure this is exported from core/src/app.ts

export const api = treaty<App>(import.meta.env.VITE_API_URL || 'http://localhost:5173');
