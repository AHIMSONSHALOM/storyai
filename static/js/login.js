/**
 * StoryForge AI - Login Controller (With Dynamic Supabase Profile Sync)
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Redirect if already logged in
  await Auth.redirectIfAuthenticated();

  const loginForm = document.getElementById("loginForm");
  const alertBox = document.getElementById("alertBox");
  const submitBtn = document.getElementById("submitBtn");

  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      showAlert("Please enter both email and password.", "danger");
      return;
    }

    setLoading(true, "Logging in...");

    try {
      const client = Auth.getClient();
      if (!client) {
        throw new Error("Supabase client is not properly initialized.");
      }

      // Authenticate with Supabase Auth
      const { data, error } = await client.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        console.warn("Login failed:", error);
        let errorMsg = error.message || "Invalid email or password.";
        if (errorMsg.toLowerCase().includes("email not confirmed")) {
          errorMsg = "Email not confirmed. Please run the SQL command or disable 'Confirm email' in Supabase.";
        }
        showAlert(errorMsg, "danger");
        setLoading(false);
      } else if (data && data.session) {
        // Dynamically update last_login_at timestamp in public.profiles table
        const user = data.session.user;
        try {
          await client.from("profiles").upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email,
            last_login_at: new Date().toISOString()
          }, { onConflict: 'id' });
        } catch (profileErr) {
          console.warn("Profile update log:", profileErr);
        }

        showAlert("Login successful! Redirecting to dashboard...", "success");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      } else {
        showAlert("Login failed. Please check your credentials.", "danger");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login Exception:", err);
      showAlert("Something went wrong during login. Please try again.", "danger");
      setLoading(false);
    }
  });

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = "block";
  }

  function hideAlert() {
    alertBox.style.display = "none";
  }

  function setLoading(isLoading, text = "Login") {
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span> ${text}`;
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Login`;
    }
  }
});
