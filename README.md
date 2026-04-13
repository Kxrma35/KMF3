
# KIO3

**AI-Powered Calorie & Nutrition Tracking for Serious Bulkers**

KIO3 is a full-stack web application that allows users to track their daily calorie and protein intake, log meals using a live food search database, monitor weight progress over time, and get real-time nutrition advice from an AI chatbot — all from a clean, responsive interface designed specifically for people on a bulking diet.

---

## Description

This project is built primarily around **React**, using a combination of supporting technologies to deliver a dynamic, real-time nutrition tracking experience.

| Technology | Role |
|---|---|
| **React + Vite** | Component-based frontend UI with fast development server and optimised builds |
| **CSS** | Custom styling, layout, soft pastel dark theme, and responsive design |
| **Firebase Auth** | Email/password user authentication and session management |
| **Firestore** | Real-time NoSQL database for meals, weight logs, and calorie goals |
| **Express.js** | Node.js API proxy server that secures the Anthropic API key |
| **Claude AI (Sonnet)** | AI nutrition chatbot with live web search for real-time macro data |
| **USDA FoodData API** | Food search database with 500k+ foods and per-100g nutritional data |

---

## Pages

| Page | Description |
|---|---|
| `Login` | Email/password sign-in with Firebase Auth |
| `Signup` | New account creation |
| `Dashboard` | Main view — calorie gauge, macro stats, meal logging, and weekly chart |
| `Progress` | Weight history chart and log with total change stats |

---

## Screenshots
![Dashboard1](<Screenshot 2026-04-13 021224.png>) ![Dashboard2](<Screenshot 2026-04-13 021241.png>) ![Dashboard3](<Screenshot 2026-04-13 021134.png>) ![WeightProgress](<Screenshot 2026-04-13 021202.png>)

---

## Features

### Calorie Dashboard
- Live SVG arc gauge showing calories remaining vs. daily goal
- Eaten kcal counter and animated progress bar
- Calorie goal customisable per user via Goals modal

### Macro Stat Cards
- **Protein** — live g tracker with circular ring progress vs. goal
- **Meals** — count of meals logged today
- **Day Streak** — consecutive days hitting calorie goal, with best streak recorded
- **Remaining / Over** — real-time kcal delta from daily goal

### Meal Logging
- Live food search powered by the **USDA FoodData Central API** (500k+ foods)
- Search-as-you-type with 400ms debounce to avoid API rate limits
- Clicking a food auto-fills meal name, calories, and protein fields
- Barcode scanner using device camera and the Open Food Facts API
- Manual entry fallback for custom meals
- Delete meals individually — Firestore updates all stats instantly

### AI Nutrition Chatbot
- Floating chat bubble powered by **Claude Sonnet** via an Express.js proxy
- System prompt dynamically injects today's calorie goal, protein goal, meals eaten, and remaining kcal
- Web search tool enabled — Claude can look up real-time nutrition data on demand
- Auto-retry logic (3 attempts, 5s delay) for when the Render.com server is waking up

### Weight Tracking
- Log daily weight in kg from the dashboard
- Progress page shows a smooth line chart of weight over time
- Stats cards for current weight, starting weight, total change, and number of entries

### Weekly Calorie Chart
- Bar chart of the last 7 days of calorie intake
- Bars turn green on days the goal was hit, purple on days it wasn't

### Responsive Design
- Bottom navigation bar on mobile (Home, Progress, Logout)
- Full-width layout on desktop with max-width centring
- Soft pastel purple theme throughout with rounded cards and smooth animations

### React Features
- **useState / useEffect** — component state and Firestore lifecycle management
- **onSnapshot Listeners** — real-time Firestore updates without page refresh
- **Async / Await** — non-blocking API calls to USDA, Anthropic, and Firebase
- **useRef + Debounce** — efficient food search input handling
- **SVG Arc Gauge** — custom-built calorie ring using polar coordinate math
- **Error Handling** — graceful fallbacks for failed API calls and missing data

---

## Repository

```
https://github.com/Kxrma35/KIO3.git
```

---

## Technologies Used

- React
- Vite
- CSS
- Firebase Auth
- Firestore
- Express.js
- Node.js
- Claude AI (Anthropic API)
- USDA FoodData Central API
- Open Food Facts API
- Git & GitHub
- Render.com (backend hosting)
- GitHub Pages (frontend hosting)

---

## Known Bugs

- The Render.com free tier server sleeps after inactivity — the first chatbot message may take 10–20 seconds while the server wakes up
- Timestamp display issues may occur in Firestore if `createdAt` is written before the server clock syncs

---

## Support & Contact

**Karma Kioko**

- Email: karmanjeruh5@gmail.com
- Phone: 0793960550
