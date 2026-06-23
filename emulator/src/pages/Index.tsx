import { SocketProvider } from "@/context/SocketProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppEmulator } from "@/components/WhatsAppEmulator";
import { UssdEmulator } from "@/components/UssdEmulator";
import { Badge } from "@/components/ui/badge";
import { MessageSquareQuote, Phone } from "lucide-react";

const Index = () => {
  return (
    <SocketProvider>
      <div className="min-h-screen bg-background flex flex-col p-4 md:p-8">
        <div className="mx-auto w-full max-w-7xl">
          <Tabs defaultValue="whatsapp" className="w-full">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Navigation */}
              <aside className="lg:w-64 space-y-6">
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="mb-6">
                    <h1 className="text-xl font-bold tracking-tight">Channel Emulator</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage and test your communication channels.
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

                <div className="hidden lg:block rounded-2xl border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-medium mb-3">System Status</h3>
                  <div className="space-y-3">
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
