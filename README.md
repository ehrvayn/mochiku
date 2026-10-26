# Mochiku

**Snap it. Mochiku remembers it.**

<img src="https://res.cloudinary.com/dlvcjwfjm/image/upload/v1792998511/MochikuSample.png" alt="InterviewSpark logo" height="200" align="absmiddle">

Mochiku is an offline-first mobile app that turns a photo of a bill, receipt, or notice into structured, reviewable data. A vision-AI backend extracts the title, category, and deadline from each photo, with per-field confidence scores so you know what to double-check. Items with deadlines go through a quick confirm step before a local reminder is scheduled; everything else is stored automatically in a searchable photo-grid library.

## Why

People photograph important things as a "reminder" and never look at them again. Mochiku turns that photo into something that actually acts on your behalf: it reads the deadline, tells you when it's confident, and nudges you before it's due, without ever requiring you to type anything.

## Features

- **Camera-first capture** — opens straight to the camera, snap and you're done
- **AI extraction with confidence scoring** — every extracted field (title, deadline, amount, etc.) comes with a confidence score, low-confidence fields are flagged for review
- **Offline-first** — photos and data save instantly to on-device SQLite regardless of connectivity; failed uploads retry automatically once back online
- **Review-before-remind** — any item with a deadline must be confirmed before a reminder is scheduled, protecting against a wrong AI reading silently causing a missed payment
- **Local push notifications** — reminders fire without needing an internet connection
- **Expense summary** — a lightweight monthly total for bills and receipts, pulled from the same structured data
- **Dark mode** — full light/dark theming throughout
- **Custom onboarding** — first-run flow that sets up the user's name and preferred reminder time
- **Mascot-driven UI** — Mochiku, an original character, reacts to app state (pending reviews, overdue items, empty library) with contextual messages

## Tech Stack

**Mobile**
- React Native, Expo, Expo Router
- TypeScript
- NativeWind (Tailwind for React Native)
- TanStack Query
- Expo SQLite
- Expo Notifications

**Backend**
- Node.js, Express, TypeScript
- Vision-language model API for extraction (Groq / Gemini)
- Retry logic with exponential backoff for handling rate limits and transient failures

## Architecture
