import { useEffect } from "react";
import { useSocket } from "@/context/SocketProvider";
import { ChatWindow } from "@/components/ChatWindow";
import { DemoToolbar } from "@/components/DemoToolbar";
import { ChatMessage, SimpleUIMessage, UIReply } from "@/types/message";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useChatPersistence } from "@/hooks/use-chat-persistence";

export const WhatsAppEmulator = () => {
  const { socket, isConnected } = useSocket();
  const { messages, setMessages, clearPersistence } = useChatPersistence();

  useEffect(() => {
    if (!socket) return;

    socket.on("ui_message", (simpleMessage: SimpleUIMessage) => {
      if ("status" in simpleMessage && simpleMessage.status === "read") {
        toast.info("Bot marked message as read");
        return;
      }

      if (simpleMessage.type === "typing_indicator") {
        toast.info("Bot is typing...");
        return;
      }

      if ("type" in simpleMessage && simpleMessage.type === "reaction") {
        const emoji = "👍";
        toast.info(`Bot reacted: ${emoji}`);
        return;
      }

      if ("context" in simpleMessage && simpleMessage.context) {
        toast.info("Bot replied to a message");
      }

      addMessage(simpleMessage, "out");
    });

    return () => {
      socket.off("ui_message");
    };
  }, [socket]);

  const addMessage = (data: SimpleUIMessage, direction: "in" | "out") => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      direction,
      data,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleReply = (reply: UIReply) => {
    if (reply.type === "text") {
      addMessage(
        {
          id: `reply-${Date.now()}`,
          type: "text",
          payload: reply.payload,
        },
        "in"
      );
    } else if (reply.type === "button_reply") {
      addMessage(
        {
          id: `reply-${Date.now()}`,
          type: "text",
          payload: { body: `✓ ${reply.payload.title}` },
        },
        "in"
      );
    } else if (reply.type === "list_reply") {
      addMessage(
        {
          id: `reply-${Date.now()}`,
          type: "text",
          payload: { body: `✓ ${reply.payload.title}` },
        },
        "in"
      );
    } else if (reply.type === "location") {
      addMessage(
        {
          id: `reply-${Date.now()}`,
          type: "location",
          payload: reply.payload,
        },
        "in"
      );
    } else if (reply.type === "image") {
      addMessage(
        {
          id: `reply-${Date.now()}`,
          type: "image",
          payload: reply.payload,
        },
        "in"
      );
    } else if (reply.type === "video") {
      addMessage(
        {
          id: `reply-${Date.now()}`,
          type: "video",
          payload: reply.payload,
        },
        "in"
      );
    } else if (reply.type === "document") {
      addMessage(
        {
          id: `reply-${Date.now()}`,
          type: "document",
          payload: reply.payload,
        },
        "in"
      );
    }

    if (socket) {
      socket.emit("ui_reply", reply);
    } else {
      toast.error("Not connected to bridge server");
    }
  };

  const handleClearMessages = () => {
    if (confirm("Are you sure you want to delete the persistence file and clear chats?")) {
      clearPersistence();
      toast.info("Chat history and persistence file deleted");
    }
  };

  return (
    <div className="w-full max-w-md h-[700px] shadow-2xl rounded-2xl overflow-hidden flex flex-col bg-card border">
      <div className="px-4 py-2 bg-muted/50 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">WhatsApp UI Emulator</span>
        <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
          {isConnected ? "Connected" : "Bridge Offline"}
        </Badge>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatWindow messages={messages} onReply={handleReply} />
      </div>

      <DemoToolbar onAddMessage={(message) => addMessage(message, "out")} onClear={handleClearMessages} />
    </div>
  );
};
