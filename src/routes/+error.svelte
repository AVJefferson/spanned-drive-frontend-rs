<script>
  // In modern SvelteKit with Svelte 5, we use $app/state instead of $app/stores
  import { page } from "$app/state";
</script>

<div class="error-container">
  <div class="content-wrapper">
    <h1 class="error-code">{page.status}</h1>

    <div class="divider"></div>

    <div class="message-section">
      <h2>Oops! Something went wrong.</h2>
      <p>{page.error?.message || "An unexpected error occurred."}</p>

      <a href="/" class="home-button">Back to Home</a>
    </div>
  </div>
</div>

<style>
  /* Base Styles (Mobile First) */
  .error-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
    background-color: #f9fafb;
    font-family: sans-serif;
    text-align: center;
  }

  .content-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .error-code {
    font-size: 5rem;
    font-weight: 800;
    margin: 0;
    color: #3b82f6; /* Blue */
  }

  .divider {
    width: 50px;
    height: 4px;
    background-color: #e5e7eb;
    border-radius: 2px;
  }

  .message-section h2 {
    font-size: 1.5rem;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .message-section p {
    color: #6b7280;
    margin-bottom: 2rem;
  }

  .home-button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background-color: #111827;
    color: white;
    text-decoration: none;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: opacity 0.2s;
  }

  .home-button:hover {
    opacity: 0.8;
  }

  /* Desktop Styling (Screens larger than 768px) */
  @media (min-width: 768px) {
    .content-wrapper {
      flex-direction: row; /* Horizontal layout */
      text-align: left;
      gap: 3rem;
    }

    .error-code {
      font-size: 8rem;
    }

    .divider {
      width: 2px;
      height: 120px; /* Vertical divider */
    }

    .message-section h2 {
      font-size: 2.25rem;
    }
  }
</style>
