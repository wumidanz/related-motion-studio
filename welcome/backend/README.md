# Welcome kiosk — guest list setup (5 minutes)

The kiosk saves every check-in to a Google Sheet and emails you each time. Returning guests type their WhatsApp number, get recognised, and only add the new booking date. Their booking count and every date they've booked stay in the sheet — the guest never sees them.

1. In the RMS Google account, create a new Google Sheet called **RMS Guests**.
2. **Extensions → Apps Script**. Delete what's there, paste everything from `Code.gs`, click **Save**.
3. **Deploy → New deployment** → type **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**, approve the Google permission prompts, and copy the **Web app URL** (ends in `/exec`).
5. Put that URL in `welcome/index.html` → `const SHEET_URL = '...'` (or send it to Claude).

The sheet gets two tabs the first time someone checks in:

- **Guests** — one row per person: name, email, brand, Instagram, interests, number of bookings, first/last visit, every booking date and space.
- **Visits** — one row per check-in, never overwritten.

Emails go to the Google account that deployed the script. To send them somewhere else, set `NOTIFY_EMAIL` at the top of `Code.gs` and deploy again (**Deploy → Manage deployments → edit → New version**).

Until `SHEET_URL` is filled in, the kiosk still works but only emails each check-in via Web3Forms and can't recognise returning guests.
