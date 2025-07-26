# Pulsar ✨

Pulsar is a sleek, modern, and intuitive search engine interface. It provides users with the ability to perform Google searches using either traditional text input or advanced voice commands. Featuring a stylish dark theme and a direct link to Google's Gemini, Pulsar is designed for a fast and seamless search experience.

<img width="1917" height="878" alt="1" src="https://github.com/user-attachments/assets/a09ae226-88d4-4ef4-8367-eeb67536d7bf" />

## 🚀 Features

- **Dual Search Modes**: Search by typing or by speaking.
- **Voice Recognition**: Utilizes the browser's Web Speech API to convert your voice into a search query.
- **Instant Redirect**: Seamlessly redirects to Google's search results page in the same tab.
- **Gemini Integration**: Includes a quick-access link to Google's Gemini AI for more complex queries.
- **Responsive Design**: A clean, mobile-first interface that looks great on any device.
- **Sleek UI/UX**: Features a dark theme, smooth animations, and clear visual feedback for voice commands.
- **Error Handling**: Gracefully informs the user if speech recognition isn't supported or if an error occurs.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript
- **Styling**: Tailwind CSS
- **APIs**:
    - **Web Speech API**: For voice recognition capabilities.
    - **Google GenAI (Gemini)**: For potential future AI-powered features.

## 📁 File Structure

Here is a breakdown of the key files and directories in the Pulsar project:

| File | Description |
| --- | --- |
| `index.html` | The main HTML entry point. It sets up the page structure, loads Tailwind CSS, defines the module import map, and contains the `<div id="root">` where the React app is mounted. |
| `index.tsx` | The entry point for the React application. It renders the main `App` component into the DOM. |
| `App.tsx` | The core component of the application. It manages all state (search query, listening status), handles user input for both text and voice, and renders the main user interface. |
| `components/Icons.tsx` | A collection of reusable SVG icon components (`SearchIcon`, `MicrophoneIcon`, `GeminiIcon`) used throughout the UI to maintain a clean and consistent look. |
| `services/geminiService.ts` | A service module responsible for handling API calls to the Google Gemini model. *Note: This service is included for future enhancements and is not currently used to display results in the UI.* |
| `metadata.json` | Configuration file that defines application metadata, including its name, description, and permissions required by the browser (e.g., `microphone`). |
| `README.md` | This file. It provides comprehensive documentation for the project. |

## ⚙️ How It Works

### Voice Search
1. The user clicks the **microphone icon**.
2. The `handleVoiceSearch` function is triggered, which starts the Web Speech API (`recognition.start()`).
3. The microphone icon pulses with a red color to indicate it's actively listening.
4. Once the user stops speaking, the `onresult` event fires, capturing the transcribed text.
5. The application automatically populates the search bar with the transcript and redirects the user to the Google search results page for that query.

### Text Search
1. The user types their query into the search input field.
2. They can either press `Enter` or click the **search icon**.
3. The `handleTextSearch` function is triggered, which takes the current query text.
4. The user is redirected to the Google search results page for that query.


## ✅ Requirements

To run this application locally and enable all its features, you will need the following:

- **Google API Key**: Required for the underlying Gemini service.
  1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
  2. Create a new API key.
  3. Place the key in the `apiKey` field in `metadata.json`.

- **Google Client ID**: Required for Google Sign-In functionality.
  1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
  2. Create a new project or select an existing one.
  3. Set up an OAuth 2.0 consent screen.
  4. Create OAuth 2.0 client ID credentials for a "Web application".
  5. Add your development origin (e.g., `http://localhost:3000`) to the "Authorized JavaScript origins".
  6. Copy the generated Client ID and paste it into the `googleClientId` field in `metadata.json`.

- **Modern Web Browser**: A browser that supports the Web Speech API (e.g., Chrome, Edge).

- **Local Development Server**: A simple server to host the static files. You can use `npx serve` or any other similar tool to serve the project directory.

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
