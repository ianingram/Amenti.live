/* ============================================================================
   AMENTI :: Shared Configuration
   ----------------------------------------------------------------------------
   This file holds the URLs and settings shared by every page of the
   Sovereign Instrument (Page1.html, Page2.html, page3.html). It is loaded
   BEFORE any page logic runs, via:

       <script src="config.js"></script>

   Edit the three URLs below ONCE. They survive every future update to the
   HTML pages, because the HTML pages no longer carry the config inline.

   None of these URLs are secret. They are visible to anyone viewing the
   site source. The Anthropic API key is what's protected, and it lives
   inside the Cloudflare Worker â€” not here.
   ============================================================================ */

window.AMENTI_CONFIG = {

  // ---- 1. LEDGER (Google Sheet, published as CSV) ----
  // In your Google Sheet:  File > Share > Publish to web
  // Format: "Comma-separated values (.csv)"
  // Paste the resulting URL here. It must end in `output=csv`.
  LEDGER_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSN9sBzULLi1dZrhxuoNISIz8hSniWKyLqeYRnAGZEwfp4SaUXu5mo0SHoQlQYi7M3zDzwbAjLWh1Gs/pub?gid=1225210076&single=true&output=csv",


  // ---- 2. AI PROXY (Cloudflare Worker) ----
  // Holds the Anthropic API key. Until this is deployed, the chat stays
  // inert and Gabriel will say "AI proxy not configured" â€” that's fine
  // for testing the rest of the instrument. See SETUP.md.
  AI_PROXY_URL: "PASTE_YOUR_WORKER_URL_HERE",


  // ---- 3. MANUEL (the glossary) ----
  // Path to MANUEL.md, relative to the HTML page that loads it.
  // Default assumes MANUEL.md sits next to the HTML files in the repo root.
  MANUEL_URL: "MANUEL.md"};
