import os
import requests

def get_supabase_headers(access_token=None):
    """Returns headers required for Supabase REST API calls."""
    supabase_anon_key = os.environ.get("SUPABASE_ANON_KEY", "")
    headers = {
        "apikey": supabase_anon_key,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    return headers

def save_story_to_db(user_id, title, prompt, genre, mood, language, length, content, access_token=None):
    """
    Saves a story into Supabase 'stories' table.
    Enforces RLS by passing the user's access token if provided.
    """
    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    if not supabase_url:
        raise ValueError("SUPABASE_URL not configured in environment")

    endpoint = f"{supabase_url}/rest/v1/stories"
    headers = get_supabase_headers(access_token)

    payload = {
        "user_id": user_id,
        "title": title,
        "prompt": prompt,
        "genre": genre,
        "mood": mood,
        "language": language,
        "length": length,
        "content": content
    }

    response = requests.post(endpoint, json=payload, headers=headers, timeout=15)
    
    if response.status_code in (200, 201):
        data = response.json()
        if isinstance(data, list) and len(data) > 0:
            return data[0]
        return payload
    else:
        print(f"[SUPABASE DB ERROR] Insert failed: {response.status_code} - {response.text}")
        raise Exception(f"Failed to save story to database: {response.text}")

def fetch_user_stories(user_id, access_token=None):
    """
    Fetches all stories for the authenticated user from Supabase.
    """
    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    if not supabase_url:
        raise ValueError("SUPABASE_URL not configured in environment")

    # Filter by user_id and sort by created_at descending
    endpoint = f"{supabase_url}/rest/v1/stories?user_id=eq.{user_id}&order=created_at.desc"
    headers = get_supabase_headers(access_token)

    response = requests.get(endpoint, headers=headers, timeout=15)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"[SUPABASE DB ERROR] Fetch failed: {response.status_code} - {response.text}")
        raise Exception(f"Failed to fetch stories: {response.text}")

def delete_user_story(story_id, user_id, access_token=None):
    """
    Deletes a story by ID ensuring it belongs to the authenticated user.
    """
    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    if not supabase_url:
        raise ValueError("SUPABASE_URL not configured in environment")

    endpoint = f"{supabase_url}/rest/v1/stories?id=eq.{story_id}&user_id=eq.{user_id}"
    headers = get_supabase_headers(access_token)

    response = requests.delete(endpoint, headers=headers, timeout=15)
    
    if response.status_code in (200, 204):
        return True
    else:
        print(f"[SUPABASE DB ERROR] Delete failed: {response.status_code} - {response.text}")
        raise Exception(f"Failed to delete story: {response.text}")
