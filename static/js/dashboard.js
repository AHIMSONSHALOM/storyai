/**
 * StoryForge AI - Dashboard & Story Generator Controller
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Enforce auth protection
  const session = await Auth.requireAuth();
  if (!session) return;

  const user = session.user;
  const token = session.access_token;

  // Header User Badge
  const userBadge = document.getElementById("userBadge");
  if (userBadge) {
    const fullName = user.user_metadata?.full_name || user.email;
    userBadge.textContent = fullName;
  }

  // Logout Handler
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      Auth.logout();
    });
  }

  // DOM Elements
  const storyForm = document.getElementById("storyForm");
  const generateBtn = document.getElementById("generateBtn");
  const alertBox = document.getElementById("alertBox");
  
  const storyResultCard = document.getElementById("storyResultCard");
  const resultTitle = document.getElementById("resultTitle");
  const resultContent = document.getElementById("resultContent");
  const copyBtn = document.getElementById("copyBtn");

  const storiesContainer = document.getElementById("storiesContainer");
  const emptyState = document.getElementById("emptyState");

  // Modal Elements
  const storyModal = document.getElementById("storyModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const modalCopyBtn = document.getElementById("modalCopyBtn");
  const closeModalBtns = document.querySelectorAll(".close-modal");

  let currentGeneratedContent = "";

  // Load User's Previous Stories
  loadStoryHistory();

  // Handle Story Generation Form Submit
  if (storyForm) {
    storyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();

      const storyIdea = document.getElementById("storyIdea").value.trim();
      const genre = document.getElementById("genre").value;
      const mood = document.getElementById("mood").value;
      const language = document.getElementById("language").value;
      const length = document.getElementById("length").value;

      if (!storyIdea) {
        showAlert("Please enter a story idea.", "danger");
        return;
      }

      setGenerating(true, "✨ Creating your story...");

      try {
        const response = await fetch("/api/generate-story", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            story_idea: storyIdea,
            genre: genre,
            mood: mood,
            language: language,
            length: length
          })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to generate story.");
        }

        const story = result.story;
        displayGeneratedStory(story.title, story.content);
        
        // Clear input and refresh history
        document.getElementById("storyIdea").value = "";
        loadStoryHistory();

      } catch (err) {
        console.error("Story Generation Error:", err);
        showAlert(err.message || "Something went wrong while generating your story. Please try again.", "danger");
      } finally {
        setGenerating(false);
      }
    });
  }

  // Display Generated Story Result
  function displayGeneratedStory(title, content) {
    currentGeneratedContent = content;
    resultTitle.textContent = title;
    resultContent.textContent = content;
    storyResultCard.style.display = "block";
    storyResultCard.scrollIntoView({ behavior: "smooth" });
  }

  // Copy Generated Story to Clipboard
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      if (!currentGeneratedContent) return;
      navigator.clipboard.writeText(currentGeneratedContent).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = "✓ Story copied!";
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 2000);
      });
    });
  }

  // Load User Stories History from Backend
  async function loadStoryHistory() {
    try {
      const response = await fetch("/api/stories", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const result = await response.json();

      if (response.ok && result.success && Array.isArray(result.stories)) {
        renderStoriesGrid(result.stories);
      } else {
        console.warn("Could not load story history:", result.error);
      }
    } catch (e) {
      console.error("Failed to load story history:", e);
    }
  }

  // Render Story Cards Grid
  function renderStoriesGrid(stories) {
    storiesContainer.innerHTML = "";

    if (!stories || stories.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    stories.forEach((story) => {
      const card = document.createElement("div");
      card.className = "story-card";

      const createdDate = story.created_at
        ? new Date(story.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
        : "Recent";

      card.innerHTML = `
        <div>
          <h3 class="story-card-title">${escapeHtml(story.title || "Untitled Story")}</h3>
          <div class="story-tags">
            <span class="tag">${escapeHtml(story.genre || "Adventure")}</span>
            <span class="tag">${escapeHtml(story.mood || "Suspenseful")}</span>
            <span class="tag">${escapeHtml(story.language || "English")}</span>
          </div>
          <p class="story-preview">${escapeHtml(story.content || "")}</p>
        </div>
        <div class="story-footer">
          <span>${createdDate}</span>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-outline btn-sm read-btn">Read</button>
            <button class="btn btn-danger btn-sm delete-btn">Delete</button>
          </div>
        </div>
      `;

      // Read Button
      card.querySelector(".read-btn").addEventListener("click", () => {
        openStoryModal(story.title, story.content);
      });

      // Delete Button
      card.querySelector(".delete-btn").addEventListener("click", () => {
        deleteStory(story.id);
      });

      storiesContainer.appendChild(card);
    });
  }

  // Delete Story with Confirmation
  async function deleteStory(storyId) {
    if (!confirm("Are you sure you want to delete this story?")) {
      return;
    }

    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const result = await response.json();

      if (response.ok && result.success) {
        loadStoryHistory();
      } else {
        alert(result.error || "Failed to delete story.");
      }
    } catch (e) {
      console.error("Delete story error:", e);
      alert("Something went wrong while deleting the story.");
    }
  }

  // Open Story Reader Modal
  function openStoryModal(title, content) {
    modalTitle.textContent = title;
    modalBody.textContent = content;
    storyModal.style.display = "flex";

    if (modalCopyBtn) {
      modalCopyBtn.onclick = () => {
        navigator.clipboard.writeText(content).then(() => {
          modalCopyBtn.textContent = "✓ Story copied!";
          setTimeout(() => {
            modalCopyBtn.textContent = "Copy Story";
          }, 2000);
        });
      };
    }
  }

  // Close Modal Handlers
  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      storyModal.style.display = "none";
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target === storyModal) {
      storyModal.style.display = "none";
    }
  });

  // Helper Utilities
  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = "block";
  }

  function hideAlert() {
    alertBox.style.display = "none";
  }

  function setGenerating(isGenerating, text = "✨ Generate Story") {
    if (isGenerating) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = `<span class="spinner"></span> ${text}`;
    } else {
      generateBtn.disabled = false;
      generateBtn.innerHTML = `✨ Generate Story`;
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
