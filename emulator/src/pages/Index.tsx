import { SocketProvider } from "@/context/SocketProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppEmulator } from "@/components/WhatsAppEmulator";
import { UssdEmulator } from "@/components/UssdEmulator";
import { Badge } from "@/components/ui/badge";
import { Github, Linkedin, MessageSquareQuote, Phone, Zap } from "lucide-react";

const Index = () => {
  return (
    <SocketProvider>
      <div className="min-h-screen bg-background flex flex-col p-4 md:p-8">
        <div className="mx-auto w-full max-w-7xl">
          <Tabs defaultValue="whatsapp" className="w-full">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Navigation */}
              <aside className="lg:w-64 space-y-4 shrink-0">
                {/* Brand card */}
                <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                        <Zap className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <h1 className="text-lg font-bold tracking-tight">WCE Emulator</h1>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Open-source WhatsApp &amp; USSD channel emulator for local testing.
                    </p>
                  </div>

                  <TabsList className="flex flex-col w-full h-auto p-1 bg-muted/50 gap-1 overflow-hidden">
                    <TabsTrigger value="whatsapp" className="w-full py-3 justify-start px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <span className="flex items-center gap-2">
                        <MessageSquareQuote className="w-4 h-4" />
                        WhatsApp
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="ussd" className="w-full py-3 justify-start px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <span className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        USSD Emulator
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* System Status */}
                <div className="hidden lg:block rounded-2xl border bg-card p-4 shadow-sm">
                  <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">System</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Bridge Engine</span>
                      <Badge variant="outline" className="text-[10px] py-0 h-5 px-1.5 font-normal">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Emulator Latency</span>
                      <span className="font-mono text-emerald-600">12ms</span>
                    </div>
                  </div>
                </div>

                {/* Author / Open source card */}
                <div className="hidden lg:block rounded-2xl border bg-card p-4 shadow-sm space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Author</p>
                    <p className="text-sm font-bold">DonnC</p>
                    <p className="text-[11px] text-muted-foreground">Donald Chinhuru</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <a
                      href="https://github.com/DonnC"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center group-hover:bg-muted/80">
                        <Github className="w-3.5 h-3.5" />
                      </div>
                      <span>github.com/DonnC</span>
                    </a>
                    <a
                      href="https://www.linkedin.com/in/donchinhuru"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-[11px] text-muted-foreground hover:text-[#0077B5] transition-colors group"
                    >
                      <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center group-hover:bg-[#0077B5]/10">
                        <Linkedin className="w-3.5 h-3.5" />
                      </div>
                      <span>in/donchinhuru</span>
                    </a>
                  </div>
                  <div className="pt-1 border-t">
                    <a
                      href="https://github.com/DonnC/wce-emulator"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Github className="w-3 h-3" />
                      Open source · MIT License
                    </a>
                  </div>
                </div>
              </aside>

              {/* Main Content Area */}
              <main className="flex-1 min-w-0">
                <TabsContent value="whatsapp" className="mt-0">
                  <div className="flex justify-center lg:justify-start">
                    <WhatsAppEmulator />
                  </div>
                </TabsContent>
                <TabsContent value="ussd" className="mt-0">
                  <div className="flex justify-center lg:justify-start">
                    <UssdEmulator />
                  </div>
                </TabsContent>
              </main>
            </div>
          </Tabs>
        </div>
      </div>
    </SocketProvider>
  );
};

export default Index;
