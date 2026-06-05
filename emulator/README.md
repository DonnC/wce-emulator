# WhatsApp UI Emulator System

A modular WhatsApp chat interface emulator with a bridge server architecture for testing chatbots.

## 🏗️ System Architecture

```
┌─────────────┐      Full WA Payload     ┌──────────────┐      Simple JSON      ┌─────────────┐
│             │  ──────────────────────> │              │  ──────────────────>  │             │
│  Your Bot   │                          │    Bridge    │                       │  React UI   │
│             │  <────────────────────── │    Server    │  <──────────────────  │  Emulator   │
└─────────────┘      Full WA Webhook     └──────────────┘      Simple Reply     └─────────────┘
                                           (Translator)
```

### How It Works

1. **Bot → Bridge → UI**: Your bot sends full WhatsApp API payloads to the bridge server, which translates them into simple JSON and forwards to the React UI via Socket.io
2. **UI → Bridge → Bot**: User interactions in the UI are sent as simple JSON to the bridge, which constructs full WhatsApp webhook payloads and POSTs them to your bot

### Key Design Principle

The React UI is "dumb" - it contains **zero** WhatsApp API parsing logic. The Bridge Server is the "brain" that does 100% of the translation work.

---

## 🚀 Quick Start

### 1. Run the React UI (This Project)

This is a standard React + Vite + TypeScript project.

```bash
npm install
npm run dev
```

The UI will be available at `http://localhost:8080`

**✨ Demo Mode**: You can test the UI immediately without the bridge server using the "Demo Toolbar" at the bottom of the screen.

### 2. Run the Bridge Server (Separate Project)

The bridge server **cannot** run inside this React project. It's a separate Node.js/Express server.

Check out [here](../emulator)

The bridge will run on `http://localhost:3001`

---

## 🧪 Testing

### Testing UI Only (No Bridge Required)

1. Open `http://localhost:8080` in your browser
2. Use the **Demo Toolbar** buttons at the bottom to add test messages:
    - Text
    - Text with Preview
    - Location
    - Interactive Buttons
    - Interactive List
    - CTA URL

This allows you to see and interact with all message types instantly.

### Testing Full System (With Bridge)

1. Make sure both the React UI and Bridge Server are running
2. Look for the connection status badge at the top (should show "🟢 Connected")
3. Use `curl` commands to simulate your bot sending messages

**Example: Send a Button Message**

```bash
curl -X POST http://localhost:3001/send-to-emulator \
  -H "Content-Type: application/json" \
  -d '{
    "type": "interactive",
    "interactive": {
      "type": "button",
      "body": {
        "text": "Choose an option:"
      },
      "action": {
        "buttons": [
          {
            "type": "reply",
            "reply": {
              "id": "btn-1",
              "title": "Option 1"
            }
          },
          {
            "type": "reply",
            "reply": {
              "id": "btn-2",
              "title": "Option 2"
            }
          }
        ]
      }
    }
  }'
```

**See bridge project's `README.md` for complete `curl` examples for all message types.**

### Testing Bot Integration

1. Configure your bot's webhook URL in the bridge server (`index.js`):
   ```javascript
   const YOUR_BOT_WEBHOOK_URL = 'http://your-bot-server:8000/webhook';
   ```

2. When you click buttons or interact with the UI, the bridge will POST full WhatsApp webhook payloads to your bot

---

## 📋 Simple UI Contract

The React UI only understands these simple JSON structures:

### Bot → UI Messages

```json
// Text
{ "id": "wamid-1", "type": "text", "payload": { "body": "Hello" } }

// Buttons
{
  "id": "wamid-2",
  "type": "interactive_button",
  "payload": {
    "body": "Choose:",
    "buttons": [
      { "id": "btn-1", "title": "Yes" }
    ]
  }
}

// List
{
  "id": "wamid-3",
  "type": "interactive_list",
  "payload": {
    "body": "Menu:",
    "buttonText": "View",
    "sections": [
      {
        "rows": [
          { "id": "row-1", "title": "Item 1" }
        ]
      }
    ]
  }
}
```

### UI → Bot Replies

```json
// Text
{ "type": "text", "payload": { "body": "User typed this" } }

// Button click
{
  "type": "button_reply",
  "contextMessageId": "wamid-2",
  "payload": { "id": "btn-1", "title": "Yes" }
}

// List selection
{
  "type": "list_reply",
  "contextMessageId": "wamid-3",
  "payload": { "id": "row-1", "title": "Item 1" }
}
```

---

## 📁 Project Structure

### React UI (This Project)

```
src/
├── components/
│   ├── ChatWindow.tsx           # Main chat interface
│   ├── MessageRenderer.tsx      # Routes messages to type components
│   ├── DemoToolbar.tsx          # Testing toolbar
│   └── MessageTypes/
│       ├── TextMessage.tsx
│       ├── ButtonMessage.tsx
│       ├── ListMessage.tsx
│       ├── CtaMessage.tsx
│       └── xxx.tsx
├── context/
│   └── SocketProvider.tsx       # Socket.io connection management
├── types/
│   └── message.ts               # TypeScript types for contracts
└── pages/
    └── Index.tsx                # Main app page
```

---

## 🎨 Features

- ✅ **WhatsApp-inspired UI** with message bubbles, timestamps, and authentic styling
- ✅ **Message Types**: Text, Text with Preview, Location, Buttons, Lists, CTA URLs and more
- ✅ **Real-time Socket.io** connection with status indicator
- ✅ **Demo Mode** for standalone testing without a bot
- ✅ **TypeScript** with full type safety
- ✅ **Tailwind CSS** with custom WhatsApp theme
- ✅ **Modular Architecture** - easy to extend

---

## 🔧 Configuration

### Change Bridge Server URL

In `src/context/SocketProvider.tsx`:

```typescript
export const SocketProvider = ({ 
  children, 
  url = 'http://localhost:3001' // Change this
}: SocketProviderProps) => {
```

### Change Bot Webhook URL

In the bridge server's `index.js`:

```javascript
const YOUR_BOT_WEBHOOK_URL = 'http://localhost:8000/webhook'; // Change this
```

---

## 💡 Use Cases

- **Bot Development**: Test your WhatsApp bot without needing a real WhatsApp Business account
- **UI Prototyping**: Design and test chat interfaces before backend integration
- **Training & Demos**: Show how your bot works in a controlled environment
- **Debugging**: See exactly what payloads your bot sends and receives

---

## 🛠️ Tech Stack

**React UI:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Socket.io Client
- shadcn/ui components
- Lucide React icons

**Bridge Server:**
- Node.js
- Express
- Socket.io
- Axios
- CORS

---

## 📝 Notes

- The bridge server must run separately from the React app
- The UI works standalone with the demo toolbar even if the bridge is offline
- Connection status is shown in real-time at the top of the UI
- All message interactions are logged to the browser console
- The bridge server logs all translations to help with debugging

---

## 🎯 Next Steps

1. Customize the message type components to match your design
2. Add authentication to the bridge server if needed
3. Connect your actual WhatsApp bot
4. Extend with additional message types (images, videos, etc.)
5. Add message history persistence

---

## 📚 Documentation

- Full contract specification: See `src/types/message.ts`
