/// <reference types="vite/client" />

import { UserConfig } from "vite";

export type HyperstaticConfig = UserConfig & {
  hyperstatic?: {
    root?: string;
    pages?: string;
  };
};


declare global {
  interface Window {
    HYPERSTATIC_DATA?: Record<string, {
      data?: any;
    }>;
  }
}
