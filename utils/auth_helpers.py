import os
import requests

def get_auth_token(request):
    """Extracts Bearer token from Request Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split("Bearer ", 1)[1].strip()
    return None

def verify_supabase_user(request):
    """
    Verifies the Supabase JWT access token provided in the Authorization header.
    Returns user payload dict if valid, or None if invalid/missing.
    Never trusts user_id supplied in the request body.
    """
    token = get_auth_token(request)
    if not token:
        return None

    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    supabase_anon_key = os.environ.get("SUPABASE_ANON_KEY", "")

    if not supabase_url or not supabase_anon_key:
        print("[AUTH ERROR] Missing SUPABASE_URL or SUPABASE_ANON_KEY in env")
        return None

    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": supabase_anon_key
    }

    try:
        response = requests.get(f"{supabase_url}/auth/v1/user", headers=headers, timeout=10)
        if response.status_code == 200:
            user_data = response.json()
            if user_data and "id" in user_data:
                return user_data
        else:
            print(f"[AUTH ERROR] Supabase user verification failed: status {response.status_code}")
            return None
    except Exception as e:
        print(f"[AUTH ERROR] Exception verifying Supabase token: {e}")
        return None

    return None
