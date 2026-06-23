import { useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "@/context/SocketProvider";
import { useUssdPersistence } from "@/hooks/use-ussd-persistence";
import { UssdScreen, UssdSessionRequest, UssdTranscriptEntry } from "@/types/ussd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CheckCircle2, Grip, ListOrdered, MessageSquareQuote, Phone, PhoneOff, Send } from "lucide-react";

const nowIso = () => new Date().toISOString();

const buildTranscriptText = (screen: UssdScreen) => {
  const optionLines = screen.options.map((option) => `${option.key}. ${option.label}`);
  return [screen.body, ...optionLines].filter(Boolean).join("\n");
};

const bankingDemo: UssdScreen = {
  sessionId: "demo-banking-session",
  title: "Banking",
  body: "Welcome to MobiBank",
  prompt: "Reply with menu option",
  stage: "BANK_HOME",
  shortCode: "*200#",
  msisdn: "263771234567",
  terminal: false,
  options: [
    { key: "1", label: "Balance" },
    { key: "2", label: "Mini statement" },
    { key: "3", label: "Transfer funds" },
    { key: "4", label: "Reset PIN" },
  ],
};

const billsDemo: UssdScreen = {
  sessionId: "demo-bills-session",
  title: "Bills & Prepaid",
  body: "SME Services",
  prompt: "Reply with menu option",
  stage: "HOME",
  shortCode: "*151#",
  msisdn: "263771234567",
  terminal: false,
  options: [
    { key: "1", label: "Airtime" },
    { key: "2", label: "ZESA" },
    { key: "3", label: "School fees" },
    { key: "4", label: "Bundles" },
    { key: "5", label: "Wallet balance" },
    { key: "*", label: "Next page", kind: "navigation" },
  ],
  pagination: {
    page: 1,
    totalPages: 2,
    nextToken: "*",
  },
};

const inputDemo: UssdScreen = {
  sessionId: "demo-input-session",
  title: "Meter Entry",
  body: "Enter your ZESA meter number",
  prompt: "Enter customer input",
  stage: "CAPTURE_METER",
  shortCode: "484",
  msisdn: "263771234567",
  terminal: false,
  options: [],
};

const confirmDemo: UssdScreen = {
  sessionId: "demo-confirm-session",
  title: "Confirm Payment",
  body: "Buy airtime for 0771234567 amount $5.00?",
  prompt: "1 to confirm, 2 to cancel",
  stage: "CONFIRM_PURCHASE",
  shortCode: "484",
  msisdn: "263771234567",
  terminal: false,
  options: [
    { key: "1", label: "Confirm" },
    { key: "2", label: "Cancel" },
  ],
};

const terminalDemo: UssdScreen = {
  sessionId: "demo-terminal-session",
  title: "Session Complete",
  body: "Transaction successful. Reference: TXN-20481",
  prompt: "Session complete",
  stage: "DONE",
  shortCode: "484",
  msisdn: "263771234567",
  terminal: true,
  options: [],
};

export const UssdEmulator = () => {
  const { socket, isConnected } = useSocket();
  const { state, setState, reset } = useUssdPersistence();
  const [inputValue, setInputValue] = useState("");
  const [isRequestPending, setIsRequestPending] = useState(false);
  const [isSessionClosed, setIsSessionClosed] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onMessage = (screen: UssdScreen) => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }

      const transcriptEntry: UssdTranscriptEntry = {
        id: `screen-${Date.now()}-${Math.random()}`,
        direction: "engine",
        text: buildTranscriptText(screen),
        timestamp: nowIso(),
        stage: screen.stage,
        terminal: screen.terminal,
      };

      setState((prev) => ({
        ...prev,
        sessionId: screen.sessionId || prev.sessionId,
        currentScreen: screen,
        shortCode: screen.shortCode || prev.shortCode,
        msisdn: screen.msisdn || prev.msisdn,
        transcript: [...prev.transcript, transcriptEntry],
      }));
      setIsRequestPending(false);
      setIsSessionClosed(false);

      if (screen.terminal) {
        toast.success("USSD session ended");
        closeTimerRef.current = window.setTimeout(() => {
          setIsSessionClosed(true);
          setState((prev) => ({
            ...prev,
            transcript: [
              ...prev.transcript,
              {
                id: `closed-${Date.now()}-${Math.random()}`,
                direction: "system",
                text: "USSD session closed. Dial again to start a new session.",
                timestamp: nowIso(),
              },
            ],
          }));
        }, 2200);
      }
    };

    const onError = (error: { message?: string }) => {
      setIsRequestPending(false);
      toast.error(error?.message || "USSD bridge request failed");
    };

    socket.on("ussd_message", onMessage);
    socket.on("ussd_error", onError);

    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      socket.off("ussd_message", onMessage);
      socket.off("ussd_error", onError);
    };
  }, [socket, setState]);

  const activeScreen = state.currentScreen;

  const sessionStatus = useMemo(() => {
    if (isRequestPending) return "Waiting";
    if (isSessionClosed) return "Session closed";
    if (!activeScreen) return "Ready to dial";
    return activeScreen.terminal ? "Session complete" : "Session active";
  }, [activeScreen, isRequestPending, isSessionClosed]);

  const appendUserEntry = (text: string) => {
    setState((prev) => ({
      ...prev,
      transcript: [
        ...prev.transcript,
        {
          id: `input-${Date.now()}-${Math.random()}`,
          direction: "user",
          text,
          timestamp: nowIso(),
        },
      ],
    }));
  };

  const emitRequest = (request: UssdSessionRequest) => {
    if (!socket) {
      toast.error("Not connected to bridge server");
      return;
    }
    setIsRequestPending(true);
    setIsSessionClosed(false);
    socket.emit("ui_ussd_request", request);
  };

  const handleDial = () => {
    const request: UssdSessionRequest = {
      channel: "ussd-emulator",
      action: "dial",
      sessionId: state.sessionId || `ussd-${Date.now()}`,
      msisdn: state.msisdn,
      shortCode: state.shortCode,
      userInput: "",
      metadata: {
        emulator: true,
      },
    };

    setState((prev) => ({ ...prev, sessionId: request.sessionId }));
    appendUserEntry(`Dial ${state.shortCode}`);
    emitRequest(request);
  };

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    appendUserEntry(trimmed);
    emitRequest({
      channel: "ussd-emulator",
      action: "reply",
      sessionId: state.sessionId,
      msisdn: state.msisdn,
      shortCode: state.shortCode,
      userInput: trimmed,
      metadata: {
        emulator: true,
      },
    });
    setInputValue("");
  };

  const handleEnd = () => {
    appendUserEntry("Cancel session");
    if (!socket) {
      setIsSessionClosed(true);
      setIsRequestPending(false);
      setState((prev) => ({
        ...prev,
        currentScreen: prev.currentScreen
          ? {
              ...prev.currentScreen,
              terminal: true,
              title: "USSD End",
              body: "Session cancelled by user",
              prompt: "Dial again to start a new session",
              options: [],
            }
          : null,
      }));
      return;
    }
    emitRequest({
      channel: "ussd-emulator",
      action: "end",
      sessionId: state.sessionId,
      msisdn: state.msisdn,
      shortCode: state.shortCode,
      userInput: "END",
      metadata: {
        emulator: true,
      },
    });
  };

  const handleLoadDemo = (screen: UssdScreen) => {
    setState((prev) => ({
      ...prev,
      currentScreen: screen,
      sessionId: screen.sessionId,
      msisdn: screen.msisdn || prev.msisdn,
      shortCode: screen.shortCode || prev.shortCode,
      transcript: [
        ...prev.transcript,
        {
          id: `demo-${Date.now()}-${Math.random()}`,
          direction: "system",
          text: `Loaded demo screen: ${screen.title || screen.stage || "USSD"}`,
          timestamp: nowIso(),
        },
        {
          id: `screen-${Date.now()}-${Math.random()}`,
          direction: "engine",
          text: buildTranscriptText(screen),
          timestamp: nowIso(),
          stage: screen.stage,
          terminal: screen.terminal,
        },
      ],
    }));
  };

  const handleClear = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    reset();
    setInputValue("");
    setIsRequestPending(false);
    setIsSessionClosed(false);
    toast.success("USSD session cleared");
  };

  const formattedScreenText = [
    activeScreen?.body || "Dial a shortcode to start a session",
    ...(activeScreen?.options || []).map((option) => `${option.key}. ${option.label}`),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="w-full max-w-md h-[700px] shadow-2xl rounded-2xl overflow-hidden flex flex-col bg-card border">
      <div className="px-4 py-2 bg-muted/50 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">USSD Session Emulator</span>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
            {isConnected ? "Connected" : "Bridge Offline"}
          </Badge>
          <Badge variant={isSessionClosed || activeScreen?.terminal ? "secondary" : "outline"} className="text-xs">
            {sessionStatus}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,_hsl(210_20%_98%),_hsl(220_15%_92%))] p-4">
        <Card className="h-full border-0 shadow-none bg-transparent">
          <CardContent className="p-0 h-full overflow-y-auto pr-1 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">MSISDN</label>
                <Input
                  value={state.msisdn}
                  onChange={(e) => setState((prev) => ({ ...prev, msisdn: e.target.value }))}
                  placeholder="263771234567"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Short code</label>
                <div className="flex gap-2">
                  <Input
                    value={state.shortCode}
                    onChange={(e) => setState((prev) => ({ ...prev, shortCode: e.target.value }))}
                    placeholder="484 or *151#"
                  />
                  <Button variant="outline" size="icon" onClick={handleDial} title="Dial shortcode">
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-slate-900 p-4 shadow-2xl ring-1 ring-slate-700/60">
              <div className="rounded-[1.6rem] bg-slate-950 px-4 py-5 text-emerald-300 font-mono min-h-[320px] flex flex-col">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-emerald-500/70">
                  <span>{activeScreen?.title || "USSD"}</span>
                  <span>{activeScreen?.stage || "Idle"}</span>
                </div>
                <Separator className="my-3 bg-emerald-900/60" />
                <pre className="whitespace-pre-wrap break-words text-[15px] leading-6 flex-1">
                  {formattedScreenText}
                </pre>
                <div className="pt-3 text-[11px] text-emerald-500/80">
                  {isRequestPending
                    ? "Loading..."
                    : isSessionClosed
                      ? "Dial again to start a new session"
                      : activeScreen?.prompt || "Reply and press Send"}
                </div>
                {isRequestPending && (
                  <div className="pt-2 text-[11px] text-emerald-400/70 animate-pulse">
                    Processing request...
                  </div>
                )}
                {activeScreen?.pagination && (
                  <div className="pt-2 text-[11px] text-emerald-400/70">
                    Page {activeScreen.pagination.page || 1}
                    {activeScreen.pagination.totalPages ? ` of ${activeScreen.pagination.totalPages}` : ""}
                    {activeScreen.pagination.previousToken ? ` | Prev: ${activeScreen.pagination.previousToken}` : ""}
                    {activeScreen.pagination.nextToken ? ` | Next: ${activeScreen.pagination.nextToken}` : ""}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Enter USSD reply"
                disabled={Boolean(activeScreen?.terminal) || isRequestPending || isSessionClosed}
              />
              <Button size="icon" onClick={handleSend} disabled={!inputValue.trim() || Boolean(activeScreen?.terminal) || isRequestPending || isSessionClosed} title="Send reply">
                <Send className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="icon" onClick={handleEnd} disabled={isRequestPending} title="Cancel or end session">
                <PhoneOff className="w-4 h-4" />
              </Button>
            </div>

            <div className="rounded-xl border bg-background/80 p-3">
              <div className="text-sm font-medium mb-2">USSD Demo Toolbar</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleLoadDemo(bankingDemo)}>
                  <ListOrdered className="w-4 h-4 mr-2" />
                  Menu
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleLoadDemo(billsDemo)}>
                  <Grip className="w-4 h-4 mr-2" />
                  Paginated
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleLoadDemo(inputDemo)}>
                  <MessageSquareQuote className="w-4 h-4 mr-2" />
                  Input
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleLoadDemo(confirmDemo)}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleLoadDemo(terminalDemo)}>
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Terminal
                </Button>
                <Button variant="outline" size="sm" onClick={handleClear} className="text-destructive">
                  Clear
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Quick offline USSD states for menu, pagination, input, confirm, and session termination.
              </div>
            </div>

            <Tabs defaultValue="history" className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid grid-cols-1">
                <TabsTrigger value="history">Session Trail</TabsTrigger>
              </TabsList>
              <TabsContent value="history" className="flex-1 min-h-0 mt-3">
                <div className="rounded-xl border bg-background/80 h-full overflow-y-auto p-3 space-y-2">
                  {state.transcript.length === 0 ? (
                    <div className="text-sm text-muted-foreground h-full flex items-center justify-center">
                      No session activity yet.
                    </div>
                  ) : (
                    state.transcript.map((entry) => (
                      <div
                        key={entry.id}
                        className={`rounded-lg px-3 py-2 text-sm ${
                          entry.direction === "engine"
                            ? "bg-emerald-50 border border-emerald-100"
                            : entry.direction === "user"
                              ? "bg-sky-50 border border-sky-100"
                              : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                          <span>{entry.direction}</span>
                          <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <pre className="whitespace-pre-wrap break-words font-mono text-xs">{entry.text}</pre>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
