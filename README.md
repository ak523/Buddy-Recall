# Buddy Recall 🧠

A flashcard study app that uses spaced repetition for optimal memory retention, with quiz mode, a visual knowledge map, and detailed analytics.

## Features

### 🏠 Dashboard
- At-a-glance stats: total decks, total cards, cards due today, and study streak
- Quick-action buttons to jump straight to Import, Study, or Decks
- Recent decks grid with card counts and due-card badges

### 📥 Manual Bulk Import
- Paste delimited text (e.g. from a spreadsheet) to create flashcards in bulk
- Supports **tab**, **comma**, **semicolon**, or **custom** delimiters
- **3-column format** support: `front | back | topic` — topics are auto-created on save
- Preview, inline-edit, and delete individual cards before saving
- Set difficulty and card type per card
- Save imported cards to a new or existing deck

### 📚 Deck Management
- Create, browse, rename, and delete decks
- Inline deck editing (name and description)
- View cards per deck with due-card counts
- Quick-launch Study or Quiz from any deck card
- **Deck detail view:**
  - Expand / collapse cards to preview content
  - Inline card editing (front, back, difficulty)
  - Move cards between decks
  - Per-card review stats (review count, recall success rate)
  - Topic assignment indicator

### 🧠 Spaced Repetition Study Sessions
- Study due cards with the **SM-2 algorithm** for optimal review scheduling
- Rate recall quality: **Again** / **Hard** / **Good** / **Easy**
- Tracks response time per review
- Filter by **deck** or **topic**
- Progress bar and session completion summary

### 🧪 Quiz Mode
- Multiple-choice quizzes generated from deck cards (30% sample by default)
- Four answer options per question (one correct + three distractors)
- Immediate correct / incorrect feedback per question
- Score summary with pass / fail result
- **Quiz history** — view past attempts with scores and timestamps
- Retake quiz with freshly shuffled questions

### 🗺️ Knowledge Map
- Visual, drag-and-drop topic organization powered by **@dnd-kit**
- Create topics with custom colors
- **Nested subtopics** for hierarchical knowledge structures
- Drag cards between topic regions and an "Unassigned" area
- Card strength indicators based on retention:
  - 🟢 Strong (≥70%) · 🟡 Medium (40–70%) · 🔴 Weak (<40%) · ⚪ Unreviewed
- Rename, delete, and add subtopics inline
- Zoom controls (50%–200%)

### 🔢 Math & LaTeX Rendering
- Renders **LaTeX math** on flashcards using **KaTeX**
- Supports inline math (`$...$`) and block math (`$$...$$`)
- Automatic Unicode-to-LaTeX normalization for pasted content (e.g. `×` → `\times`, `π` → `\pi`)

### 📊 Analytics Dashboard
- **52-week study activity heatmap** (GitHub-style contribution graph)
- Summary metrics: total reviews, cards mastered, and average retention rate
- Per-deck performance stats: total cards, mastered count, recent reviews, and average success rate with visual progress bars

### 💾 Local-First Architecture
- Data stored locally in **SQLite** (via better-sqlite3 + Drizzle ORM)
- No internet connection required — everything runs offline
- Database auto-initializes on first run

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) 16 (App Router)
- **Language:** TypeScript
- **Database:** SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) with [Drizzle ORM](https://orm.drizzle.team/)
- **Math Rendering:** [KaTeX](https://katex.org/)
- **Drag & Drop:** [@dnd-kit](https://dndkit.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) 4

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)

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
│   ├── import/           # Manual bulk import from delimited text
│   ├── decks/            # Deck listing & detail views
│   ├── study/            # Spaced repetition study session
│   ├── quiz/             # Multiple-choice quiz mode
│   ├── map/              # Knowledge map with drag-and-drop topics
│   ├── analytics/        # Study analytics & heatmap
│   └── api/              # Backend API routes
├── components/           # Shared UI components (Navbar, MathText)
├── db/                   # Database schema & initialization
└── lib/                  # Utilities (SM-2 algorithm)
```

## License

This project is private.
