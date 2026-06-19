# Local Emulator Bridge

The bridge now supports two channels:

- WhatsApp message relay
- vendor-agnostic USSD screen relay

It keeps the UI contract simple so the emulator can render a stable local experience while your backend stays free to use richer native payloads.

## Endpoints

- `POST /send-to-emulator`
  Accepts WhatsApp-style outbound payloads and translates them to the emulator UI contract.
- `POST /send-ussd-to-emulator`
  Accepts a normalized USSD screen, or a `jussd`-like outbound screen shape, and pushes it to the USSD emulator tab.

## Environment variables

- `BOT_WEBHOOK_URL`
  Target webhook used for WhatsApp replies from the emulator.
- `BOT_USSD_WEBHOOK_URL`
  Target webhook used for synchronous USSD requests from the emulator.

## USSD normalized request shape

When the user interacts with the USSD emulator, the bridge posts a request like:

```json
{
  "channel": "ussd-emulator",
  "action": "dial",
  "sessionId": "ussd-123",
  "msisdn": "263771234567",
  "shortCode": "*151#",
  "userInput": "",
  "metadata": {
    "emulator": true
  }
}
```

`action` can be `dial`, `reply`, `end`, or `reset`.

## USSD normalized screen shape

Your backend can respond with a simple payload like:

```json
{
  "sessionId": "ussd-123",
  "title": "SME Services",
  "stage": "HOME",
  "body": "1. Airtime\n2. ZESA\n3. Bundles",
  "prompt": "Reply with menu option",
  "terminal": false,
  "shortCode": "*151#",
  "msisdn": "263771234567",
  "options": [
    { "key": "1", "label": "Airtime" },
    { "key": "2", "label": "ZESA" },
    { "key": "3", "label": "Bundles" }
  ]
}
```

It can also respond with a `jussd`-style object using `body`, `menuItems`, `terminal`, `stage`, and `vendorHints`; the bridge will normalize that automatically.

## Manual USSD screen test

```bash
curl -X POST http://localhost:3001/send-ussd-to-emulator \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "demo-ussd-1",
    "title": "SME Services",
    "stage": "HOME",
    "body": "1. Airtime\n2. ZESA\n3. Bundles\n*. Next",
    "prompt": "Reply with menu option",
    "terminal": false,
    "shortCode": "*151#",
    "msisdn": "263771234567",
    "options": [
      { "key": "1", "label": "Airtime" },
      { "key": "2", "label": "ZESA" },
      { "key": "3", "label": "Bundles" },
      { "key": "*", "label": "Next page", "kind": "navigation" }
    ],
    "pagination": {
      "page": 1,
      "totalPages": 2,
      "nextToken": "*"
    }
  }'
```

## Manual WhatsApp test

```bash
curl -X POST http://localhost:3001/send-to-emulator \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "text": {
      "body": "Hello from the bot!"
    }
  }'
```
