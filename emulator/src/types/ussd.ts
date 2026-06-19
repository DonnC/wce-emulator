export interface UssdOption {
  key: string;
  label: string;
  description?: string;
  selectable?: boolean;
  kind?: "option" | "navigation";
}

export interface UssdPaginationHints {
  page?: number;
  totalPages?: number;
  nextToken?: string;
  previousToken?: string;
}

export interface UssdScreen {
  sessionId: string;
  title?: string;
  body: string;
  prompt?: string;
  stage?: string;
  shortCode?: string;
  msisdn?: string;
  terminal: boolean;
  options: UssdOption[];
  pagination?: UssdPaginationHints;
  metadata?: Record<string, unknown>;
}

export interface UssdSessionRequest {
  channel: "ussd-emulator";
  action: "dial" | "reply" | "end" | "reset";
  sessionId: string;
  msisdn: string;
  shortCode: string;
  userInput?: string;
  metadata?: Record<string, unknown>;
}

export interface UssdTranscriptEntry {
  id: string;
  direction: "user" | "engine" | "system";
  text: string;
  timestamp: string;
  stage?: string;
  terminal?: boolean;
}
