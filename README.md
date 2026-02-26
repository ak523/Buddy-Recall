# Buddy Recall 🧠

An AI-powered flashcard study app that transforms your documents into smart flashcards and uses spaced repetition for optimal memory retention.

## Features

### 📤 Document Upload & AI Flashcard Generation
- Upload **PDF**, **DOCX**, or **TXT** files via drag-and-drop or file picker
- AI-powered flashcard generation using **Google Gemini** with multiple prompt modes:
  - **Exam Mode** — key facts and definitions for exam prep
  - **Concept Mastery** — deep understanding with explanations and examples
  - **Speed Recall** — concise quick-fire cards
  - **Visual Memory** — cards with visual reference cues
  - **Language Learning** — pronunciation, usage, and context
  - **Custom** — provide your own prompt instructions
- Preview and edit generated cards before saving

### 📋 Manual Bulk Import
- Paste delimited text to create flashcards instantly — no AI required
- Supports **tab**, **comma**, **semicolon**, or a **custom delimiter**
- Preview, edit, and delete individual parsed cards before saving
- Save imported cards to a new or existing deck

### 📚 Deck Management
- Create, browse, and delete decks
- View cards per deck with due-card counts
- Save generated flashcards to new or existing decks

### 🧠 Spaced Repetition Study Sessions
- Study due cards with the **SM-2 algorithm** for optimal review scheduling
- Rate recall quality (Again / Hard / Good / Easy) after each card
- Tracks response time per review
- Study all due cards or filter by deck

### 📊 Analytics Dashboard
- **Study activity heatmap** showing reviews over the last 52 weeks
- Per-deck performance stats: total cards, mastered cards, retention rate, and recent reviews
- Summary metrics: total reviews, cards mastered, and average retention

### ⚙️ Settings
- Configure your **Google Gemini API key** via the settings page or the `GEMINI_API_KEY` environment variable
- Test API connection from the UI

### 💾 Local-First Architecture
- Data stored locally in **SQLite** (via better-sqlite3 + Drizzle ORM)
- Only AI flashcard generation requires an internet connection
- Database auto-initializes on first run

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) 16 (App Router)
- **Language:** TypeScript
- **Database:** SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) with [Drizzle ORM](https://orm.drizzle.team/)
- **AI:** [Google Gemini](https://ai.google.dev/) (gemini-2.0-flash)
- **Document Parsing:** [pdf-parse](https://www.npmjs.com/package/pdf-parse), [mammoth](https://www.npmjs.com/package/mammoth)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) 4

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- A **Google Gemini API key** — get one free at [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ak523/Buddy-Recall.git
   cd Buddy-Recall
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure your Gemini API key** (choose one option):

   - **Option A — Environment variable:**

     ```bash
     export GEMINI_API_KEY=your_api_key_here
     ```

   - **Option B — Settings page:** Start the app and navigate to the **Settings** page to enter your key through the UI.

### Running the App

#### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Production

```bash
npm run build
npm run start
```

### Other Commands

| Command          | Description                |
| ---------------- | -------------------------- |
| `npm run dev`    | Start development server   |
| `npm run build`  | Build for production        |
| `npm run start`  | Start production server     |
| `npm run lint`   | Run ESLint                  |

## Project Structure

```
src/
├── app/                  # Next.js App Router pages & API routes
│   ├── page.tsx          # Dashboard
│   ├── upload/           # Document upload & flashcard generation
│   ├── import/           # Manual bulk import from delimited text
│   ├── decks/            # Deck listing & detail views
│   ├── study/            # Spaced repetition study session
│   ├── analytics/        # Study analytics & heatmap
│   ├── settings/         # API key configuration
│   └── api/              # Backend API routes
├── components/           # Shared UI components
├── db/                   # Database schema & initialization
└── lib/                  # Utilities (Gemini AI, SM-2 algorithm, document parser)
```

## License

This project is private.
