<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and Deploy your AI Studio App

This repository contains everything you need to run your app locally and package it as an Android app using Capacitor.

View your app in AI Studio: [https://ai.studio/apps/drive/10Ht_o43gSSC1WevNB7A3Gch2vmU87k5V](https://ai.studio/apps/drive/10Ht_o43gSSC1WevNB7A3Gch2vmU87k5V)

---

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
```bash
npm install
````

2. Set your Gemini API key in `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

3. Run the app locally:

```bash
npm run dev
```

* Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Build for Android with Capacitor

You can package this web app as an Android app using [Capacitor](https://capacitorjs.com/).

**Prerequisites:** Node.js, Android Studio

1. Initialize Capacitor (if not done already):

```bash
npx cap init
```

* App Name: `runic-synthesis`
* Package ID: `io.github.jimmyshian.runic`

2. Add Android platform:

```bash
npx cap add android
```

3. Build the front-end:

```bash
npm run build:devlocal
npx cap copy android
```

* Output will be in the `dist/` folder.

4. Copy build files to Android project:

```bash
npx cap copy android
```

5. Open Android Studio:

```bash
npx cap open android
```

* Run the app on a simulator or real device.
* Use Android Studio to debug native code and Chrome DevTools to debug the front-end WebView.

---

## Workflow Tips
* Do **not** directly edit files in the `android/` folder; changes will be overwritten on sync.
* Optional: enable live reload for faster front-end iteration:

```bash
npm install @capacitor/live-reload
npx cap serve --livereload
```

---

## Project Structure

```
runic-synthesis/
├─ android/        # Generated Android project
├─ components/     # React components
├─ hooks/          # React hooks
├─ dist/           # Build output
├─ node_modules/   # Dependencies
├─ App.tsx         # Main React app
├─ index.tsx       # React entry
├─ vite.config.ts  # Vite config
├─ package.json
├─ package-lock.json
└─ .env.local      # API keys
```

---

## References

* [Capacitor Docs](https://capacitorjs.com/docs)
* [Vite Docs](https://vitejs.dev/)
