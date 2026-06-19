import { SocketProvider } from "@/context/SocketProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppEmulator } from "@/components/WhatsAppEmulator";
import { UssdEmulator } from "@/components/UssdEmulator";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  return (
    <SocketProvider>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          <Tabs defaultValue="whatsapp" className="w-full">
            <div className="mb-4 rounded-2xl border bg-card px-4 py-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-semibold">Channel Emulator</div>
                  <div className="text-sm text-muted-foreground">
                    Switch between the WhatsApp emulator and the USSD emulator here.
                  </div>
                </div>
                <Badge variant="outline" className="w-fit">
                  USSD is in the top switch
                </Badge>
              </div>
              <div className="flex justify-center mt-4">
                <TabsList className="grid w-full max-w-lg grid-cols-2 h-auto p-1">
                  <TabsTrigger value="whatsapp" className="py-3">
                    WhatsApp Emulator
                  </TabsTrigger>
                  <TabsTrigger value="ussd" className="py-3">
                    USSD Emulator
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            <TabsContent value="whatsapp" className="flex justify-center">
              <WhatsAppEmulator />
            </TabsContent>
            <TabsContent value="ussd" className="flex justify-center">
              <UssdEmulator />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SocketProvider>
  );
};

export default Index;
