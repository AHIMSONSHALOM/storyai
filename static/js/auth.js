/**
 * StoryForge AI - Auth Helpers & Session Guard
 */

const Auth = {
  getClient() {
    return window.supabaseClient;
  },

  async getSession() {
    const client = this.getClient();
    if (!client) return null;
    try {
      const { data, error } = await client.auth.getSession();
      if (error || !data.session) return null;
      return data.session;
    } catch (e) {
      console.error("Error retrieving session:", e);
      return null;
    }
  },

  async getToken() {
    const session = await this.getSession();
    return session ? session.access_token : null;
  },

  async getUser() {
    const session = await this.getSession();
    return session ? session.user : null;
  },

  async requireAuth() {
    const session = await this.getSession();
    if (!session) {
      console.warn("Unauthenticated user accessing protected route. Redirecting to /login...");
      window.location.href = "/login";
      return null;
    }
    return session;
  },

  async redirectIfAuthenticated() {
    const session = await this.getSession();
    if (session) {
      window.location.href = "/dashboard";
    }
  },

  async logout() {
    const client = this.getClient();
    if (client) {
      await client.auth.signOut();
    }
    window.location.href = "/login";
  }
};
