import os
from flask import Flask, render_template, request
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

from utils.helpers import json_response, validate_story_input
from utils.auth_helpers import verify_supabase_user, get_auth_token
from utils.gemini_helpers import generate_story_with_gemini, GeminiBusyException
from utils.supabase_helpers import save_story_to_db, fetch_user_stories, delete_user_story


app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "storyforge-ai-default-dev-secret-key-2026")
CORS(app)

@app.context_processor
def inject_supabase_config():
    """Inject Supabase public configuration into HTML templates safely."""
    return {
        "supabase_url": os.environ.get("SUPABASE_URL", ""),
        "supabase_anon_key": os.environ.get("SUPABASE_ANON_KEY", "")
    }


# ==========================================
# PAGE ROUTES
# ==========================================

@app.route("/")
def index():
    """Serves the landing page."""
    return render_template("index.html")

@app.route("/login")
def login_page():
    """Serves the login page."""
    return render_template("login.html")

@app.route("/register")
def register_page():
    """Serves the register page."""
    return render_template("register.html")

@app.route("/dashboard")
def dashboard_page():
    """Serves the protected dashboard page."""
    return render_template("dashboard.html")

# ==========================================
# REST API ENDPOINTS
# ==========================================

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint for Render monitoring."""
    return json_response(success=True, data={"status": "ok", "app": "StoryForge AI"})

@app.route("/api/generate-story", methods=["POST"])
def generate_story():
    """
    Generates an AI story using Google Gemini API and saves it to Supabase PostgreSQL.
    Requires Supabase authentication token in Authorization header.
    """
    user = verify_supabase_user(request)
    if not user:
        return json_response(success=False, error="Unauthorized. Please log in to generate stories.", status_code=401)

    req_data = request.get_json() or {}
    story_idea = req_data.get("story_idea", "").strip()
    genre = req_data.get("genre", "Adventure")
    mood = req_data.get("mood", "Suspenseful")
    language = req_data.get("language", "English")
    length = req_data.get("length", "Short")

    # Input validation
    is_valid, err_msg = validate_story_input(story_idea, genre, mood, language, length)
    if not is_valid:
        return json_response(success=False, error=err_msg, status_code=400)

    try:
        # Call Gemini API to generate story
        generated = generate_story_with_gemini(story_idea, genre, mood, language, length)
        
        # Save story to Supabase DB using authenticated user's ID and token
        user_id = user["id"]
        token = get_auth_token(request)
        
        saved_story = save_story_to_db(
            user_id=user_id,
            title=generated["title"],
            prompt=story_idea,
            genre=genre,
            mood=mood,
            language=language,
            length=length,
            content=generated["content"],
            access_token=token
        )

        return json_response(success=True, data={"story": saved_story})

    except GeminiBusyException as busy_err:
        print(f"[GEMINI BUSY LOG] 503 Capacity Limit: {busy_err}")
        return json_response(
            success=False,
            error="The AI service is temporarily busy. Please try again shortly.",
            status_code=503
        )

    except Exception as e:
        import traceback
        print(f"[ERROR] Story generation failed: {e}")
        traceback.print_exc()
        return json_response(
            success=False,
            error=f"Story generation error: {str(e)}",
            status_code=500
        )



@app.route("/api/stories", methods=["GET"])
def get_stories():
    """
    Returns saved stories for the authenticated user.
    """
    user = verify_supabase_user(request)
    if not user:
        return json_response(success=False, error="Unauthorized. Please log in.", status_code=401)

    try:
        user_id = user["id"]
        token = get_auth_token(request)
        stories = fetch_user_stories(user_id=user_id, access_token=token)
        return json_response(success=True, data={"stories": stories})
    except Exception as e:
        print(f"[ERROR] Fetching user stories failed: {e}")
        return json_response(success=False, error="Unable to load story history.", status_code=500)

@app.route("/api/stories/<story_id>", methods=["DELETE"])
def delete_story(story_id):
    """
    Deletes a user story by ID.
    Enforces that users can only delete their own stories.
    """
    user = verify_supabase_user(request)
    if not user:
        return json_response(success=False, error="Unauthorized. Please log in.", status_code=401)

    try:
        user_id = user["id"]
        token = get_auth_token(request)
        delete_user_story(story_id=story_id, user_id=user_id, access_token=token)
        return json_response(success=True, message="Story deleted successfully.")
    except Exception as e:
        print(f"[ERROR] Deleting story failed: {e}")
        return json_response(success=False, error="Failed to delete story.", status_code=500)

# ==========================================
# APPLICATION ENTRYPOINT
# ==========================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
