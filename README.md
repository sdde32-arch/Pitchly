<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/0688dcea-d208-4c74-ad54-0673a9629c87

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure your API keys for the AI integration:
   Create a `.env` file from `.env.example` and add your Gemini API key:
   `GEMINI_API_KEY="your_api_key_here"`
   *Note: You can also use `GOOGLE_API_KEY` instead. Do not prefix these with `VITE_`.*
3. Run the app:
   `npm run dev`

## Firebase Storage CORS Setup
To allow image uploads from the browser, apply the CORS configuration:
`gsutil cors set cors.json gs://YOUR_BUCKET_NAME`
