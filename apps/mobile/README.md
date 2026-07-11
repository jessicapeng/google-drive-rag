# Mobile App

This is the Expo + React Native frontend for Milestone 1.

## Screens

- Home screen
- Chat screen

## Run locally

```bash
cd apps/mobile
npm install
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000 npm start
```

The app calls the FastAPI backend through `EXPO_PUBLIC_API_URL` and never touches OpenAI from the client.
