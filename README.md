# TacticalShack

Temporary landing: **This is the future home of TacticalShack.**

---

## Connect to GitHub

**Requires:** [Git](https://git-scm.com/download/win) installed and in your PATH.

1. **Create a new repository on GitHub**
   - Go to [github.com/new](https://github.com/new)
   - Name it `TacticalShack` (or your choice)
   - Do **not** initialize with a README (this repo already has one)

2. **Connect this folder and push**
   From the project folder in a terminal:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: temporary home page"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/TacticalShack.git
   git push -u origin main
   ```

   Replace `YOUR_USERNAME` with your GitHub username. If you use SSH:

   ```bash
   git remote add origin git@github.com:YOUR_USERNAME/TacticalShack.git
   ```

---

## Connect to Railway

1. **Sign in**
   - Go to [railway.app](https://railway.app) and sign in (use “Login with GitHub” so it can see your repos).

2. **New project from GitHub**
   - Click **New Project** → **Deploy from GitHub repo**
   - Select the **TacticalShack** repository
   - Choose the **main** branch (or the branch you use)

3. **Deploy**
   - Railway will detect the Node app (`package.json` + `"start": "node server.js"`) and deploy. No extra config needed.

4. **Domain**
   - In your service → **Settings** → **Networking**, click **Generate Domain**. You’ll get a `*.railway.app` URL.

---

## Summary

| Step | Action |
|------|--------|
| GitHub | Create repo → `git init`, add remote, push |
| Railway | New Project → Deploy from GitHub → select TacticalShack repo |
| Deploy | Every push to the connected branch will deploy on Railway |

Once GitHub and Railway are connected, your temporary home page will be live at the Railway URL.
