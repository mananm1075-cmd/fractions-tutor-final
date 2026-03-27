# Fractions Intelligent Tutor (ITS) - Local Full-Stack

This project is a complete local Node/Express + React (Vite) full-stack app for Grade 6 fraction tutoring.

## Folder Structure

- `backend/`
  - `server.js` (Express app)
  - `routes/tutorRoutes.js` (API routes)
  - `services/`
    - `tutorController.js` (API handlers)
    - `decisionEngine.js` (adaptive question selection)
    - `learnerModel.js` (mastery updates)
    - `misconceptionEngine.js` (F001–F004 detection)
    - `db.js` (JSON persistence)
  - `data/`
    - `questions.js` (question bank + hint ladders + misconceptions)
    - `db.json` (student progress storage)

- `frontend/`
  - `src/pages/` (`Home.jsx`, `Dashboard.jsx`, `Tutor.jsx`, `Profile.jsx`)
  - `src/components/` (`QuestionCard.jsx`, `HintBox.jsx`, `FractionVisualizer.jsx`, `ProgressBar.jsx`)
  - `src/store/` (`useTutorStore.js`)

## API Endpoints (Backend)

All endpoints are prefixed with `/api`.

1. `GET /api/start-session`
   - Optional query: `student_id`, `name`
   - Returns:
     - `student_id`
     - `name`
     - `mastery` (KC1, KC2, KC3)

2. `GET /api/next-question?student_id=...`
   - Returns:
     - `question` (prompt, options, KC, difficulty, visuals)
     - `hintLevel` (next hint level to request, 1..3)

3. `POST /api/submit-answer`
   - Body:
     - `student_id`
     - `question_id`
     - `selected_option`
   - Returns:
     - `correct` (boolean)
     - `misconception` (F001–F004 or null)
     - `updated_mastery` (KC1..KC3)
     - `feedback` (message + explanation + misconceptionLabel)
     - `remediation` (triggered when misconception repeats)

4. `GET /api/hint?student_id=...&question_id=...`
   - Returns:
     - `question_id`
     - `hintLevel` (1..3)
     - `hintText`

5. `GET /api/progress?student_id=...`
   - Returns:
     - `student_id`
     - `name`
     - `mastery`
     - `strongAreas`, `weakAreas`
     - `recommendation`
     - `chart` (analytics data per KC)

## How the System Works (High Level)

- `learnerModel.js` updates mastery by KC after each submission using multiple factors:
  - correctness
  - item difficulty
  - hint usage
  - attempts used
  - recent KC accuracy
- `decisionEngine.js` controls learning path and adaptive difficulty:
  - chooses target KC from mastery + recent performance
  - adjusts difficulty from mastery and short-term success trend
  - prioritizes remediation-tagged items when repeated misconceptions occur
- `misconceptionEngine.js` detects misconceptions using the question's option-to-misconception mapping (F001–F004).
- `tutorController.js` wires these into the REST API and stores progress in `backend/data/db.json`.
- `questions.js` includes mixed question types:
  - MCQ
  - Fill in the blank
  - True/False
  - Multi-select

## Run Locally

From the repo root:

```bash
npm run install:all
npm run dev
```

- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:5173`

You can also run services separately:

### Backend only

```bash
cd backend
npm install
node server.js
```

### Frontend only

```bash
cd frontend
npm install
npm run dev
```

