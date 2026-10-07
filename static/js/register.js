/**
 * StoryForge AI - Registration Controller
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Redirect if already logged in
  await Auth.redirectIfAuthenticated();

  const registerForm = document.getElementById("registerForm");
  const alertBox = document.getElementById("alertBox");
  const submitBtn = document.getElementById("submitBtn");

  if (!registerForm) return;

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Frontend Validations
    if (!fullName || !email || !password || !confirmPassword) {
      showAlert("All fields are required.", "danger");
      return;
    }

    if (password.length < 6) {
      showAlert("Password must be at least 6 characters long.", "danger");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Password and Confirm Password do not match.", "danger");
      return;
    }

    setLoading(true, "Creating account...");

    try {
      const client = Auth.getClient();
      if (!client) {
        throw new Error("Supabase client is not properly initialized.");
      }

      // Register user with Supabase Auth (Database Trigger automatically populates public.profiles)
      const { data, error } = await client.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        console.warn("Registration error response:", error);
        let errorMsg = error.message || "Registration failed. Please try again.";
        
        if (errorMsg.toLowerCase().includes("rate limit")) {
          errorMsg = "Email rate limit exceeded. Please turn OFF 'Confirm email' in Supabase Auth settings or try logging in.";
        }
        
        showAlert(errorMsg, "danger");
        setLoading(false);
      } else {
        showAlert("Account created successfully! Redirecting to login...", "success");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1200);
      }
    } catch (err) {
      console.error("Registration Exception:", err);
      showAlert("Network error during registration. Please check connection and try again.", "danger");
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

  function setLoading(isLoading, text = "Create Account") {
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span> ${text}`;
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Create Account`;
    }
  }
});
