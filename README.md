# LLMRepo - Talk to GitHub Repositories

LLMRepo is a tool that allows users to interact with GitHub repositories through natural language. By leveraging Gemini LLM, users can ask questions about code, get explanations, summaries, and insights about repositories.

## How to Run

### Prerequisites

- Python 3.10+ with pip
- Node.js 16+ with npm (must be installed and available in your PATH)
- Gemini API key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**

   ```
   git clone <repository-url>
   cd LLMRepo
   ```

2. **Set up the backend**

   ```
   # Create and activate a virtual environment (optional but recommended)
   python -m venv venv
   # On Windows
   .\venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate

   # Install Python dependencies
   pip install -r requirements.txt
   ```

3. **Set up the frontend**

   ```
   cd frontend
   npm install
   cd ..
   ```

4. **Configure environment variables**
   - Create a `.env` file in the root directory
   - Add your Gemini API key: `GEMINI_API_KEY=your_api_key_here`
   - Optionally, you can add a GitHub access token for accessing private repositories or to avoid rate limits: `GITHUB_TOKEN=your_github_token_here`

### Running the Application

**Option 1: Using the main script (recommended)**
(this is giving errors atm, if you know coding- pls fix)

```
python main.py
```

This script will:

- Check and install dependencies if needed
- Start the backend server
- Start the frontend development server
- Open the application in your default web browser

**Option 2: Manual startup**

1. Start the backend server:

   ```
   # From the project root
   python backend/main.py
   OR
   python -m uvicorn backend.main:app --reload
   ```

   The backend will run at http://localhost:8000

2. Start the frontend server:

   ```
   # From the project root
   cd frontend
   npm run dev
   ```

   The frontend will run at http://localhost:5173

3. Open your browser and navigate to http://localhost:5173

### Stopping the Application

If using the main script, press `Ctrl+C` in the terminal to stop both servers.

If starting manually, press `Ctrl+C` in each terminal window to stop the respective server.

### Troubleshooting

#### Node.js or npm Not Found

If you see an error like `FileNotFoundError: [WinError 2] The system cannot find the file specified` when running the application, it means Node.js or npm is not installed or not in your PATH.

**Solution:**

1. Install Node.js v16+ from [nodejs.org](https://nodejs.org/)
2. Make sure Node.js is added to your PATH during installation
3. Restart your terminal/command prompt after installation
4. Verify installation by running `node -v` and `npm -v`

#### npm Not Found (Node.js is installed)

If you see a message like `❌ npm command not found in PATH` but Node.js is detected, it means npm is not properly installed or not in your PATH.

**Solution:**

1. Reinstall Node.js from [nodejs.org](https://nodejs.org/) and ensure you select the option to install npm during installation
2. Make sure the npm installation directory is in your PATH
3. On Windows, the npm path should be in the same directory as Node.js
4. Restart your terminal/command prompt after making changes
5. Verify npm is available by running `npm -v`

## Features

### Core Features

- **Repo Q&A** – Ask questions about a GitHub repository and get answers based on code, README, and documentation
- **Code Summarization** – Generate concise summaries of files, functions, or entire repositories
- **Code Explanation** – Break down complex code snippets into simple explanations
- **Dependency Analysis** – Identify libraries used and explain their purpose
- **Commit History Insights** – Summarize recent commits and highlight important changes
- **PR & Issue Insights** – Explain the purpose of pull requests or issues in plain English
- **Auto-Generated Documentation** – Convert code comments and function definitions into detailed documentation

### Advanced Features

- **Bug Detection & Fix Suggestions** – Analyze code for potential bugs and suggest fixes
- **Code Refactoring** – Suggest improvements for cleaner, more efficient code
- **Test Case Generation** – Auto-generate test cases based on function definitions
- **Interactive Chat Mode** – Chat with repositories in a conversational manner
- **AI Code Review** – Provide feedback on code quality, security, and best practices
- **Historical Code Evolution** – Track how a function or file evolved over time

## Technology Stack

- Frontend: React.js
- Backend: Python (FastAPI)
- LLM: Google's Gemini API
- GitHub API for repository access
