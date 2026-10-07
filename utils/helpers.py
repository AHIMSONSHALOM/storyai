from flask import jsonify

def json_response(success=True, data=None, error=None, message=None, status_code=200):
    """
    Standardized JSON API response structure.
    Success format: {"success": true, ...data}
    Error format:   {"success": false, "error": "Error message"}
    """
    response_body = {"success": success}
    if success:
        if isinstance(data, dict):
            response_body.update(data)
        elif data is not None:
            response_body["data"] = data
        if message:
            response_body["message"] = message
    else:
        response_body["error"] = error or "An unexpected error occurred."
        if message:
            response_body["message"] = message

    return jsonify(response_body), status_code

def validate_story_input(story_idea, genre, mood, language, length):
    """Validates parameters sent to story generation API."""
    if not story_idea or not story_idea.strip():
        return False, "Story idea cannot be empty."

    valid_genres = ["Adventure", "Fantasy", "Mystery", "Romance", "Horror", "Comedy", "Science Fiction", "Drama"]
    valid_moods = ["Happy", "Emotional", "Suspenseful", "Dark", "Inspirational", "Funny", "Peaceful", "Mysterious"]
    valid_languages = ["English", "Tamil"]
    valid_lengths = ["Short", "Medium", "Long"]

    if genre and genre not in valid_genres:
        return False, f"Invalid genre. Allowed: {', '.join(valid_genres)}"
    if mood and mood not in valid_moods:
        return False, f"Invalid mood. Allowed: {', '.join(valid_moods)}"
    if language and language not in valid_languages:
        return False, f"Invalid language. Allowed: {', '.join(valid_languages)}"
    if length and length not in valid_lengths:
        return False, f"Invalid length. Allowed: {', '.join(valid_lengths)}"

    return True, None
