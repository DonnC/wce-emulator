import { useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "@/context/SocketProvider";
import { useUssdPersistence } from "@/hooks/use-ussd-persistence";
import { UssdScreen, UssdSessionRequest, UssdTranscriptEntry } from "@/types/ussd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  CheckCircle2,
  Grip,
  ListOrdered,
  MessageSquareQuote,
  Phone,
  PhoneOff,
  Send,
  Settings2,
  History,
  Smartphone,
  Trash2,
  Clock,
  CircleOff
} from "lucide-react";

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
  shortCode: "484",
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
  shortCode: "484",
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
  const [timeoutSeconds, setTimeoutSeconds] = useState(30);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [autoEndOnTerminal, setAutoEndOnTerminal] = useState(true);

  const closeTimerRef = useRef<number | null>(null);

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

  const handleEnd = (reason = "Cancel session") => {
    appendUserEntry(reason);
    setTimeLeft(null);
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
            body: reason === "Cancel session" ? "Session cancelled by user" : reason,
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
        reason,
      },
    });
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
    setTimeLeft(null);
    toast.success("USSD session cleared");
  };

  useEffect(() => {
    if (!socket) return;

    const onMessage = (screen: UssdScreen) => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }

      // Reset timeout timer on new message
      if (!screen.terminal) {
        setTimeLeft(timeoutSeconds);
      } else {
        setTimeLeft(null);
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

      if (screen.terminal && autoEndOnTerminal) {
        toast.info("USSD session ending automatically...");
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
        }, 3000);
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
  }, [socket, setState, timeoutSeconds, autoEndOnTerminal]);

  // Timeout countdown effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isSessionClosed || isRequestPending) {
      if (timeLeft === 0 && !isSessionClosed) {
        handleEnd("Session expired due to inactivity");
        setTimeLeft(null);
      }
      return;
    }

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timeLeft, isSessionClosed, isRequestPending]);

  const activeScreen = state.currentScreen;

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
    if (!screen.terminal) {
      setTimeLeft(timeoutSeconds);
    } else {
      setTimeLeft(null);
    }
  };

  const formattedScreenText = [
    activeScreen?.body || "Dial a shortcode to start a session",
    ...(activeScreen?.options || []).map((option) => `${option.key}. ${option.label}`),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-80 flex flex-col gap-4 sticky top-8">
        <Card className="shadow-sm border-muted">
          <CardHeader className="py-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              Simulator Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-5">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">MSISDN</label>
                <div className="relative">
                  <Smartphone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    className="pl-9 h-10"
                    value={state.msisdn}
                    onChange={(e) => setState((prev) => ({ ...prev, msisdn: e.target.value }))}
                    placeholder="263771234567"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Short code</label>
                <div className="flex gap-2">
                  <Input
                    className="h-10"
                    value={state.shortCode}
                    onChange={(e) => setState((prev) => ({ ...prev, shortCode: e.target.value }))}
                    placeholder="*151#"
                  />
                  <Button variant="default" size="icon" onClick={() => handleDial()} className="h-10 w-10 shrink-0 shadow-sm" title="Dial code">
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Session Timeout
                </label>
                <Badge variant="secondary" className="font-mono text-[10px]">{timeoutSeconds}s</Badge>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(parseInt(e.target.value))}
                className="w-full accent-primary h-1.5 bg-muted-foreground/20 rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between pt-1">
                <label className="text-xs font-medium text-muted-foreground">Auto-end Terminal</label>
                <div
                  className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${autoEndOnTerminal ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  onClick={() => setAutoEndOnTerminal(!autoEndOnTerminal)}
                >
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform ${autoEndOnTerminal ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted overflow-hidden">
          <CardHeader className="py-4 px-5 bg-muted/30">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Grip className="w-4 h-4 text-primary" />
              Demo Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => handleLoadDemo(bankingDemo)} className="h-9 text-[11px] justify-start px-2">
                <ListOrdered className="w-3.5 h-3.5 mr-2 text-primary" /> Banking
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleLoadDemo(billsDemo)} className="h-9 text-[11px] justify-start px-2">
                <Grip className="w-3.5 h-3.5 mr-2 text-primary" /> Paginated
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleLoadDemo(inputDemo)} className="h-9 text-[11px] justify-start px-2">
                <MessageSquareQuote className="w-3.5 h-3.5 mr-2 text-primary" /> Input
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleLoadDemo(confirmDemo)} className="h-9 text-[11px] justify-start px-2">
                <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-primary" /> Confirm
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleLoadDemo(terminalDemo)} className="h-9 text-[11px] justify-start px-2">
                <CircleOff className="w-3.5 h-3.5 mr-2 text-primary" /> Terminal
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear} className="h-9 text-[11px] justify-start px-2 text-destructive hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2">
          <h4 className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
            <History className="w-3 h-3" />
            Quick Help
          </h4>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            The working shortcode is <span className="font-bold underline text-amber-900">484</span>.
            The emulator mimics real USSD latency and session state.
            You can force-end a session using the Cancel button.
          </p>
        </div>
      </div>

      {/* Main Emulator View */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Phone Emulator */}
          <div className="w-[360px] mx-auto xl:mx-0 shrink-0">
            <div className="relative">
              {/* Notch/Status Bar mockup */}
              <div className="absolute top-0 left-0 right-0 h-10 px-8 flex justify-between items-center z-10 pointer-events-none">
                <div className="text-[11px] font-semibold text-emerald-500/40">9:41</div>
                <div className="flex gap-1.5 items-center">
                  <div className="w-3 h-3 rounded-full border border-emerald-500/20" />
                  <div className="w-6 h-2.5 rounded-sm border border-emerald-500/20" />
                </div>
              </div>

              <div className="w-[360px] h-[640px] rounded-[3.5rem] bg-slate-900 p-3 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] ring-8 ring-slate-800/40 flex flex-col overflow-hidden relative">
                {/* Emulator Screen */}
                <div className="flex-1 rounded-[2.8rem] bg-slate-950 p-6 pt-12 text-emerald-300 font-mono flex flex-col relative overflow-hidden">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-emerald-500/50 z-10">
                    <span className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500/80 animate-pulse' : 'bg-red-500'}`} />
                      {activeScreen?.title || "USSD"}
                    </span>
                    <span>{activeScreen?.stage || "IDLE"}</span>
                  </div>

                  <Separator className="my-5 bg-emerald-900/30 relative z-10" />

                  <pre className="whitespace-pre-wrap break-words text-[17px] leading-[1.5] flex-1 font-mono tracking-tight text-emerald-300 relative z-10 scrollbar-none overflow-y-auto">
                    {formattedScreenText}
                  </pre>

                  <div className="mt-auto pt-6 space-y-4 relative z-10 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
                    {timeLeft !== null && !isSessionClosed && !activeScreen?.terminal && (
                      <div className="flex items-center gap-2 text-[10px] text-amber-500/60 uppercase font-bold tracking-widest">
                        <Clock className="w-3 h-3" />
                        Expires in {timeLeft}s
                      </div>
                    )}

                    <div className="text-[12px] text-emerald-500/70 italic border-l-2 border-emerald-900/40 pl-3 leading-relaxed">
                      {isRequestPending
                        ? "Gateway processing..."
                        : isSessionClosed
                          ? "Session expired. Re-dial to start."
                          : activeScreen?.prompt || "Reply below"}
                    </div>

                    {activeScreen?.pagination && (
                      <div className="pt-2 text-[10px] text-emerald-700/60 border-t border-emerald-900/10 font-bold tracking-widest">
                        PG {activeScreen.pagination.page || 1} / {activeScreen.pagination.totalPages || "?"}
                      </div>
                    )}
                  </div>

                  {/* USSD Loading Overlay */}
                  {isRequestPending && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-[2px] animate-in fade-in duration-300">
                      <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-6 w-full shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                        <div className="flex gap-1.5 items-center">
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" />
                        </div>
                        <div className="text-[12px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
                          USSD Processing...
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Container */}
                <div className="p-6 bg-slate-900/80 space-y-4 backdrop-blur-md">
                  <div className="flex gap-2.5">
                    <Input
                      className="bg-slate-950 border-slate-800 text-emerald-400 font-mono h-12 rounded-xl focus-visible:ring-emerald-500/20"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Your reply..."
                      disabled={Boolean(activeScreen?.terminal) || isRequestPending || isSessionClosed}
                    />
                    <Button
                      size="icon"
                      onClick={handleSend}
                      className="h-12 w-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow-lg text-white shrink-0"
                      disabled={!inputValue.trim() || Boolean(activeScreen?.terminal) || isRequestPending || isSessionClosed}
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-xl bg-red-950/30 border-red-900/40 text-red-400 hover:bg-red-900/40 hover:text-red-300 hover:border-red-700/50 transition-all text-xs"
                      onClick={() => handleEnd()}
                      disabled={isRequestPending || (!activeScreen && !isSessionClosed)}
                    >
                      <PhoneOff className="w-3.5 h-3.5 mr-2" />
                      End
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 rounded-xl text-slate-600 hover:bg-slate-800/50 hover:text-slate-400"
                      onClick={handleClear}
                      title="Clear session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Session Activity Trail */}
          <div className="flex-1 flex flex-col min-w-0 h-[640px]">
            <Card className="flex-1 flex flex-col overflow-hidden shadow-sm border-muted">
              <CardHeader className="py-3 px-4 border-b bg-muted/10 flex flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trail</span>
                  {state.transcript.length > 0 && (
                    <span className="text-[10px] font-mono bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 leading-none">
                      {state.transcript.length}
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={handleClear} className="w-7 h-7 rounded-lg text-muted-foreground/50 hover:text-destructive" title="Clear trail">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-0 flex flex-col bg-slate-50/30">
                <ScrollArea className="flex-1">
                  <div className="p-5">
                    {state.transcript.length === 0 ? (
                      <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                        <History className="w-12 h-12" />
                        <div className="text-sm font-medium">Activity Log Empty</div>
                        <p className="text-xs max-w-[180px]">Your session history will appear here as you interact.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 relative">
                        {/* Timeline line */}
                        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-muted-foreground/10" />

                        {state.transcript.map((entry) => (
                          <div
                            key={entry.id}
                            className={`relative pl-7 flex flex-col gap-1 ${entry.direction === "system" ? "opacity-60" : ""}`}
                          >
                            {/* Timeline dot */}
                            <div className={`absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full border-[3px] border-background flex items-center justify-center z-10 ${entry.direction === "engine" ? "bg-emerald-500" :
                                entry.direction === "user" ? "bg-sky-500" : "bg-muted-foreground/30"
                              }`}>
                              {entry.direction === "engine" && <Smartphone className="w-2.5 h-2.5 text-white" />}
                              {entry.direction === "user" && <Send className="w-2.5 h-2.5 text-white" />}
                              {entry.direction === "system" && <Clock className="w-2.5 h-2.5 text-white" />}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                {entry.direction === "engine" ? "Engine" : entry.direction === "user" ? "You" : "Sys"}
                              </span>
                              <span className="text-[9px] text-muted-foreground/30 font-mono">
                                {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                              </span>
                            </div>

                            <div className={`rounded-xl px-3 py-2 font-mono border transition-all ${entry.direction === "engine"
                                ? "bg-white border-emerald-100 text-slate-700"
                                : entry.direction === "user"
                                  ? "bg-sky-50 border-sky-100 text-sky-900"
                                  : "bg-muted/40 border-muted text-muted-foreground italic"
                              }`}>
                              <pre className="whitespace-pre-wrap break-words leading-snug text-[10px]">{entry.text}</pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
