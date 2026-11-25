# ZeroPoint LTD

A wing of HighGrounds, by projectAdnan. Fabric marketplace with cart, custom colour requests, 4-step checkout, Google sign-in and an admin panel, running free on Cloudflare (Workers + D1).

```
public/        the website (index.html, app.js, images)
src/worker.js  the API (catalog, Google login, orders, admin)
db/            schema.sql, seed.sql, setup.sql (schema + seed together)
wrangler.toml  Cloudflare config (you edit 3 values)
```

## Deploy (about 20 minutes, no command line needed)

**1. Put it on GitHub.** Create a new repo and upload everything in this folder.

**2. Create the database.** Cloudflare dashboard > Storage & Databases > D1 > Create database. Name it `zeropoint-db`. Open it, go to the Console tab, paste the whole of `db/setup.sql`, and run it. (If the console rejects the size, run `db/schema.sql` first, then `db/seed.sql`.) Copy the database ID.

**3. Google sign-in.** Google Cloud Console > APIs & Services > Credentials > Create OAuth client ID > Web application. Under Authorized JavaScript origins, add your site address (e.g. `https://zeropoint.yourname.workers.dev`, and your custom domain later). Copy the Client ID. No secret is needed.

**4. Edit `wrangler.toml` on GitHub:**
- `database_id` = the ID from step 2
- `GOOGLE_CLIENT_ID` = the Client ID from step 3
- `ADMIN_EMAILS` = the Google emails allowed into admin, comma-separated

**5. Connect Cloudflare.** Workers & Pages > Create > Import a repository > pick your repo. Keep the defaults (deploy command `npx wrangler deploy`). Every push to GitHub redeploys.

**6. Check it.** Open your `.workers.dev` address, sign in with Google, place a test order. Then open `/admin` while signed in with an admin email.

If you add a custom domain later, add it to the Google authorized origins too.

## Local testing (optional)
```
npm install
cp .dev.vars.example .dev.vars     # DEV_LOGIN=1 lets you sign in without Google
npm run db:local
npm run dev
```

## Notes
- Prices are recomputed on the server from the database, so a browser cannot change what it pays.
- Admin edits (FX, margins, MOQ, pools, mill prices, corridors, order stages) save automatically to D1.
- Orders store the customer contact, delivery details, colour, dye, finish and quantity.
- No payment is taken online. The confirmation tells buyers payment details follow. Add bKash/Nagad merchant APIs later once approved.
- Free plan: D1 queries stop for the day if daily read/write limits are hit. The $5/month Workers plan lifts this.
- Fabric specs, mill prices and roll lengths are sample data. Replace them with real quotes in the admin panel.
