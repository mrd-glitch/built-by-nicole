# Built By Nicole Marie

Nutrition & fitness coaching website with new client application form and weekly check-in system.

## Files

- `index.html` — Landing page + new client application form
- `checkin.html` — Weekly check-in form for existing clients
- `api/apply.js` — Handles new client application emails via Resend
- `api/checkin.js` — Handles weekly check-in emails + photo attachments via Resend

## Deploy to Netlify

### Step 1 — Install Netlify CLI
```
npm install -g netlify-cli
```

### Step 2 — Login
```
netlify login
```

### Step 3 — Initialize the site
```
cd built-by-nicole
netlify init
```
Choose "Create & configure a new site" and follow the prompts.

### Step 4 — Add your Resend API key
In Netlify dashboard → Site Settings → Environment Variables → Add:
```
RESEND_API_KEY = your_key_here
```

Or via CLI:
```
netlify env:set RESEND_API_KEY your_key_here
```

### Step 5 — Deploy
```
netlify deploy --prod
```

## Connect Custom Domain (championtkd.ca subdomain)

In Netlify dashboard → Domain Management → Add custom domain:
```
coaching.championtkd.ca
```
or
```
nicole.championtkd.ca
```

Then add a CNAME record in your DNS pointing to your Netlify URL.

## Update Nicole's Photo

Replace the photo placeholder in `index.html` — find this section:
```html
<div class="hero-image-placeholder">
```
Replace the entire div with:
```html
<img src="nicole.jpg" alt="Nicole Marie" style="width:100%;height:100%;object-fit:cover;object-position:top;" />
```
And add `nicole.jpg` to the project root.

## Resend Sender Domain

The from address is currently set to `onboarding@resend.dev` (Resend's test domain).
To send from `@championtkd.ca`, verify the domain in your Resend dashboard and update:
```
from: 'Built By Nicole Marie <coaching@championtkd.ca>'
```
