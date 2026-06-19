import { useEffect, useState } from "react";
import { UssdScreen, UssdTranscriptEntry } from "@/types/ussd";

const STORAGE_KEY = "wce_ussd_emulator_state";

interface PersistedUssdState {
  currentScreen: UssdScreen | null;
  transcript: UssdTranscriptEntry[];
  msisdn: string;
  shortCode: string;
  sessionId: string;
}

const DEFAULT_STATE: PersistedUssdState = {
  currentScreen: null,
  transcript: [],
  msisdn: "263771234567",
  shortCode: "484",
  sessionId: "ussd-demo-session",
};

export const useUssdPersistence = () => {
  const [state, setState] = useState<PersistedUssdState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_STATE;
    } catch (error) {
      console.error("Failed to load USSD state:", error);
      return DEFAULT_STATE;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(DEFAULT_STATE);
  };

  return { state, setState, reset };
};
