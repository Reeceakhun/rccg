# Church Website: Vercel edition (free, no database server)

A responsive church website with a password-protected admin portal, built to run on **Vercel's free Hobby plan**. Content is stored as one small file in **Vercel Blob** (part of your Vercel account), so you need no other service.

- Public site: `https://your-project.vercel.app`
- Admin portal: `https://your-project.vercel.app/#admin`
- Admin can edit: **Bible verse of the month** (big banner on the home page + strip on every page), service times, contact info and social links, welcome / about / giving text, events, sermons (YouTube or .mp3 links), leaders and ministries.

## Deploy (about 10 minutes)

### 1. Create a free Vercel account
Sign up at vercel.com on the **Hobby** plan (email, or GitHub/GitLab/Bitbucket login).

### 2. Get the project onto Vercel (choose ONE)

**A. With GitHub (easiest, auto-redeploys on every change)**
1. Create a GitHub repository and upload/push this folder.
2. In Vercel: *Add New > Project* > import the repo. Leave all build settings as they are (no framework, no build command).
3. Before clicking Deploy, open *Environment Variables* and add `ADMIN_PASSWORD` = the admin password you want (use a long one). Deploy.

**B. Without GitHub (command line)**
```bash
npm install -g vercel
vercel login
vercel            # answer the prompts, accept defaults
vercel env add ADMIN_PASSWORD     # paste your admin password, select all environments
vercel --prod
```

### 3. Create the storage (this is where content is saved)
1. In your Vercel project open the **Storage** tab > *Create* > **Blob**.
2. Choose **Private** access (recommended). If you pick Public instead, the app still works.
3. **Connect** the store to this project. Vercel automatically adds the `BLOB_READ_WRITE_TOKEN` variable.
4. **Redeploy** (Deployments > ⋯ > Redeploy) so the app picks it up.

> Vercel's dashboard wording changes now and then. What matters: a Blob store exists, it is connected to this project, and the project was redeployed afterwards.

### 4. Log in
Open `https://your-project.vercel.app/#admin`, sign in with `ADMIN_PASSWORD`, edit anything, press **Save changes**. Changes are live straight away.

## Everyday use
- **Monthly verse:** Admin > *Verse of the Month* > edit month, text, reference > Save.
- **Change the admin password:** Vercel > Settings > Environment Variables > edit `ADMIN_PASSWORD` > Redeploy. All sessions are signed out.
- **Custom domain:** Vercel > Settings > Domains (buying a domain name is the only thing that costs money, and it is optional).

## Run locally (optional, no Vercel account needed)
```bash
npm install
ADMIN_PASSWORD=secret123 npm run dev      # Windows PowerShell: $env:ADMIN_PASSWORD='secret123'; npm run dev
```
Open http://localhost:3000. Content is saved to `.data/content.json`. Run `npm test` for the self-check.

## How it works
```
public/            the website + admin UI (static files)
api/content.js     public: returns the site content
api/admin/*.js     login, logout, session check, read/save content (serverless functions)
lib/store.js       reads/writes content.json in Vercel Blob (or a local file in dev)
lib/auth.js        password check + signed 12-hour session cookie
lib/validate.js    server-side validation of everything the admin saves
vercel.json        serves /public and sets security headers (CSP etc.)
```

## Good to know
- **Free plan terms:** Vercel's Hobby plan is for non-commercial, personal use. A church site is usually fine, but read Vercel's fair-use terms, especially since there is a giving page. Free plans also have usage caps (a church site will be nowhere near them).
- **Security:** the password is compared in constant time; sessions are HMAC-signed, HttpOnly, SameSite=Strict, Secure, 12 hours; all input is validated on the server and all output is escaped; strict Content-Security-Policy. Login attempts are slowed down and limited per server instance (best effort on serverless). Use a long, unique `ADMIN_PASSWORD`. Logging out clears the cookie; to invalidate every session at once, change `ADMIN_PASSWORD` (or set `SESSION_SECRET`) and redeploy.
- **Backups:** content is one JSON file. Vercel > Storage > your Blob store lets you download `church/content.json`.
- **No image uploads yet:** leaders show initials, not photos.
- **Last save wins:** if two admins save at the same time, the later save overwrites the earlier one.
