# StoryForge AI

> **Tagline:** *"Turn Your Ideas Into Stories."*

StoryForge AI is a full-stack AI-powered story generator built with Python Flask, Supabase Authentication, Supabase PostgreSQL, and Google Gemini AI. Users can register accounts, log in securely, generate original stories across multiple genres, moods, lengths, and languages (English and Tamil), save generated stories safely, view their story history, and delete stories.

---

## 🌟 Key Features

- 🔐 **Secure Supabase Authentication**: Email/Password authentication with JWT Bearer token validation on all protected REST endpoints.
- 🤖 **Google Gemini AI Story Generation**: Generates original, engaging stories using structured prompts and returns JSON-formatted titles and stories.
- 🌐 **Bilingual Support**: Full native story title and story content generation in **English** and **Tamil**.
- 🛡️ **PostgreSQL Row Level Security (RLS)**: Enforces database-level isolation so users can strictly access, insert, or delete only their own stories.
- 📱 **Modern Glassmorphic Responsive UI**: Built with HTML5, Vanilla CSS, glassmorphism aesthetics, dark navy AI color theme, dynamic loading states, modal reader, and copy-to-clipboard functionality.
- 🚀 **Deployment-Ready**: Production WSGI server configuration with `gunicorn` for Render deployment.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+), Fetch API, Supabase JS CDN.
- **Backend**: Python 3, Flask, Flask-CORS, `python-dotenv`, `gunicorn`.
- **Authentication**: Supabase Auth (Email & Password).
- **Database**: Supabase PostgreSQL with Row Level Security (RLS).
- **AI Engine**: Google Gemini API (`google-genai` / `google-generativeai`).
- **Deployment**: Render, GitHub.

---

## 🏗️ Project Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                         │
│   (HTML5 / CSS3 Glassmorphic UI / Vanilla JS Client)    │
└──────────────┬──────────────────────────┬───────────────┘
               │ (Supabase Auth Sign-In)  │ (API Request + Bearer JWT)
               ▼                          ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   Supabase Auth Engine   │   │   Flask Python Backend   │
│  (Manages Credentials)   │   │  (app.py / REST API)     │
└──────────────────────────┘   └──────────┬───────────────┘
                                          │
                                ┌─────────┴─────────┐
                                ▼                   ▼
                    ┌───────────────────┐ ┌───────────────────┐
                    │ Google Gemini API │ │ Supabase Postgres │
                    │ (AI Generation)   │ │  (RLS Protected)  │
                    └───────────────────┘ └───────────────────┘
```

---

## 📁 Project Structure

```
storyforge-ai/
│
├── app.py                     # Main Flask web application & REST API routes
├── requirements.txt           # Python dependencies
├── .env.example               # Template for environment variables
├── .gitignore                 # Git ignore rules
├── README.md                  # Complete project documentation
├── SUPABASE_SETUP.md          # Step-by-step database & SQL setup guide
├── GEMINI_SETUP.md            # Step-by-step Gemini API configuration guide
├── render.yaml                # Render deployment configuration
│
├── utils/                     # Backend helper utility packages
│   ├── __init__.py
│   ├── auth_helpers.py        # Supabase JWT token verification
│   ├── gemini_helpers.py      # Google Gemini prompt constructor & API integration
│   ├── supabase_helpers.py    # Supabase PostgreSQL database operations
│   └── helpers.py             # Standardized JSON response & input validators
│
├── templates/                 # Jinja2 HTML5 Page Templates
│   ├── index.html             # Landing page
│   ├── login.html             # Login page
│   ├── register.html          # Registration page
│   └── dashboard.html         # Protected story generator & history dashboard
│
└── static/                    # Static Assets
    ├── css/
    │   └── style.css          # Dark navy glassmorphic CSS stylesheet
    └── js/
        ├── config.js          # Supabase client initialization
        ├── auth.js            # Auth helpers & session guard
        ├── login.js           # Login form controller
        ├── register.js        # Registration form controller
        └── dashboard.js       # Generator & story history controller
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root directory based on `.env.example`:

| Environment Variable | Description | Required |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Your Supabase public anon key | Yes |
| `GEMINI_API_KEY` | Your Google Gemini API key from Google AI Studio | Yes |
| `SECRET_KEY` | Flask session secret key | Yes |
| `PORT` | Application port (default: 5000) | No |
| `FLASK_ENV` | Environment mode (`development` or `production`) | No |

---

## 🗄️ Database Schema & RLS Setup

For detailed SQL setup and policy instructions, see [SUPABASE_SETUP.md](file:///C:/Users/Admin/.gemini/antigravity/scratch/storyforge-ai/SUPABASE_SETUP.md).

### `stories` Table Schema

```sql
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    genre TEXT NOT NULL,
    mood TEXT NOT NULL,
    language TEXT NOT NULL,
    length TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stories" ON public.stories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/` | No | Serves Landing Page |
| `GET` | `/login` | No | Serves Login Page |
| `GET` | `/register` | No | Serves Registration Page |
| `GET` | `/dashboard` | Yes | Serves Authenticated Dashboard |
| `GET` | `/api/health` | No | Health check returning `{"status": "ok"}` |
| `POST` | `/api/generate-story` | Yes | Generates story with Gemini API and saves to Supabase |
| `GET` | `/api/stories` | Yes | Fetches authenticated user's stories |
| `DELETE` | `/api/stories/<story_id>` | Yes | Deletes user story by ID |

---

## 💻 Local Installation & Setup

### Prerequisites
- Python 3.9+
- Pip
- Supabase Account
- Google AI Studio API Key

### Step 1: Clone the repository & Navigate
```bash
git clone https://github.com/your-username/storyforge-ai.git
cd storyforge-ai
```

### Step 2: Create & Activate Virtual Environment
**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Linux / macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase and Gemini credentials:
```bash
cp .env.example .env
```

### Step 5: Run Application Locally

**Option A (Easiest - Double Click):**
Simply double-click `run_server.bat` inside `C:\Users\Admin\.gemini\antigravity\scratch\storyforge-ai\run_server.bat`.

**Option B (Command Line via `py` Launcher):**
```cmd
cd C:\Users\Admin\.gemini\antigravity\scratch\storyforge-ai
py -m pip install -r requirements.txt
py app.py
```
Open your browser and navigate to:
`http://localhost:5000`



---

## 🚀 Deployment to Render

1. Push your code repository to GitHub.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. Set:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
6. Under **Environment Variables**, add:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
   - `SECRET_KEY`
7. Click **Create Web Service**.

---

## 🔒 Security Practices Enforced

1. **Zero Plaintext Passwords**: Passwords are securely hashed and managed exclusively by Supabase Auth.
2. **Backend JWT Token Verification**: Flask backend cryptographically validates the Supabase Bearer token for every protected API request.
3. **No Unauthenticated Data Access**: Backend rejects requests missing or holding invalid Bearer tokens with HTTP 401.
4. **Row Level Security (RLS)**: PostgreSQL policy level enforcement prevents cross-tenant data access.
5. **Key Protection**: Gemini API Key and secret keys remain server-side and are never exposed in HTML or client JavaScript.

---

## 🔮 Future Improvements

- Audio narration support using text-to-speech API.
- PDF and EPUB story export options.
- Collaborative story editing and sharing links.
- Image generation for story cover illustration.

---

© 2026 StoryForge AI. Created for Full-Stack AI Project Demonstration.
