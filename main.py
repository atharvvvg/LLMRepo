import os
import subprocess
import webbrowser
import time
import sys
import shutil

def check_dependencies():
    """Check if all required dependencies are installed"""
    try:
        # Check Python dependencies
        import fastapi
        import uvicorn
        import google.generativeai
        print("✅ Backend dependencies are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e.name}")
        print("Installing dependencies...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        return False

def check_nodejs():
    """Check if Node.js and npm are installed and available in PATH"""
    npm_path = shutil.which("npm")
    node_path = shutil.which("node")
    
    # Check Node.js first
    if node_path:
        try:
            # Check Node.js version
            result = subprocess.run(["node", "-v"], capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Node.js is installed: {result.stdout.strip()}")
                # Now check npm separately
                if npm_path:
                    return True, True  # Both Node.js and npm are available
                else:
                    print("❌ npm command not found in PATH")
                    print("Node.js is installed, but npm is not available")
                    return True, False  # Node.js available, npm not available
        except Exception:
            pass
    
    print("❌ Node.js is not installed or not in PATH")
    print("Please install Node.js (v16+) from https://nodejs.org/")
    print("Make sure both 'node' and 'npm' are added to your PATH")
    return False, False  # Neither Node.js nor npm are available

def start_backend():
    """Start the FastAPI backend server"""
    print("Starting backend server...")
    # Start the backend server as a subprocess
    backend_process = subprocess.Popen(
        [sys.executable, "backend/main.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    # Wait a moment to ensure the server starts
    time.sleep(2)
    return backend_process

def start_frontend():
    """Start the React frontend development server"""
    print("Starting frontend server...")
    
    # Check if Node.js and npm are available
    node_available, npm_available = check_nodejs()
    if not node_available:
        print("⚠️ Cannot start frontend server without Node.js")
        print("You can still access the backend API at http://localhost:8000")
        return None
    elif not npm_available:
        print("⚠️ Cannot start frontend server without npm")
        print("You can still access the backend API at http://localhost:8000")
        return None
    
    try:
        # Check if node_modules exists, if not run npm install
        if not os.path.exists("frontend/node_modules"):
            print("Installing frontend dependencies...")
            result = subprocess.run(["npm", "install"], cwd="frontend", 
                                   capture_output=True, text=True, check=True)
            print("✅ Frontend dependencies installed")
        
        # Start the frontend server as a subprocess
        frontend_process = subprocess.Popen(
            ["npm", "run", "dev"], 
            cwd="frontend",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        # Wait a moment to ensure the server starts
        time.sleep(5)
        return frontend_process
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running npm command: {e}")
        print("Error details:")
        print(e.stderr)
        print("⚠️ Cannot start frontend server")
        print("You can still access the backend API at http://localhost:8000")
        return None
    except FileNotFoundError:
        print("❌ npm command not found in PATH")
        print("⚠️ Cannot start frontend server without npm")
        print("You can still access the backend API at http://localhost:8000")
        return None

def open_browser():
    """Open the application in the default web browser"""
    print("Opening application in browser...")
    webbrowser.open("http://localhost:5173")

def main():
    """Main function to run the application"""
    print("Starting LLMRepo application...")
    
    # Check if .env file exists, if not create from example
    if not os.path.exists(".env") and os.path.exists(".env.example"):
        print("⚠️ .env file not found. Creating from .env.example")
        print("⚠️ Please edit the .env file to add your Gemini API key")
        with open(".env.example", "r") as example_file:
            with open(".env", "w") as env_file:
                env_file.write(example_file.read())
    
    # Check dependencies
    check_dependencies()
    
    # Start backend and frontend
    backend_process = start_backend()
    frontend_process = start_frontend()
    
    # Open browser if frontend is running
    if frontend_process:
        open_browser()
        print("\n✨ LLMRepo is running!")
        print("📊 Backend server: http://localhost:8000")
        print("🌐 Frontend application: http://localhost:5173")
    else:
        print("\n⚠️ LLMRepo is running with backend only!")
        print("📊 Backend server: http://localhost:8000")
        print("❌ Frontend application could not be started")
    
    print("\nPress Ctrl+C to stop the application")
    
    try:
        # Keep the script running until interrupted
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping application...")
        backend_process.terminate()
        if frontend_process:
            frontend_process.terminate()
        print("Application stopped")

if __name__ == "__main__":
    main()