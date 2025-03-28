# fmt: off
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import git
import tempfile
import shutil
import google.generativeai as genai
import requests
from bs4 import BeautifulSoup
import json
import re
from dotenv import load_dotenv
import time
import stat # Added for robust deletion
import sys # Added for robust deletion

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set")

genai.configure(api_key=GEMINI_API_KEY)

# --- Use a current and valid model name ---
# Options: "gemini-1.5-flash-latest", "gemini-1.5-pro-latest"
# Using flash as it's generally faster and cheaper for many tasks.
# Adjust if you need the pro model's capabilities.
GEMINI_MODEL_NAME = "gemini-1.5-flash-latest"
# GEMINI_MODEL_NAME = "gemini-1.5-pro-latest" 


# Initialize FastAPI app
app = FastAPI(title="LLMRepo API", description="API for interacting with GitHub repositories using Gemini LLM")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class RepoRequest(BaseModel):
    repo_url: str
    branch: Optional[str] = "master" # Changed default branch to main
    access_token: Optional[str] = None

class QueryRequest(BaseModel):
    repo_url: str
    query: str
    branch: Optional[str] = "master" # Added branch consistency
    context: Optional[Dict[str, Any]] = None
    access_token: Optional[str] = None

class FileRequest(BaseModel):
    repo_url: str
    file_path: str
    branch: Optional[str] = "main" # Added branch consistency
    access_token: Optional[str] = None

# Temporary directory to store cloned repositories
TEMP_DIR = tempfile.gettempdir()

# --- Robust Directory Deletion Function (Handles Windows PermissionError) ---
def onerror(func, path, exc_info):
    """
    Error handler for ``shutil.rmtree``.

    If the error is due to an access error (read only file)
    it attempts to add write permission and then retries.

    If the error is for another reason it re-raises the error.

    Usage : ``shutil.rmtree(path, onerror=onerror)``
    """
    # Check if file access issue
    if not os.access(path, os.W_OK):
        # Try to change the perm to allow write
        os.chmod(path, stat.S_IWUSR)
        # Re-attempt the function (e.g., os.remove)
        try:
            func(path)
        except Exception as e:
            print(f"Failed to remove {path} even after chmod: {e}")
            # Optionally re-raise or log more details
            # raise # Re-raise the original exception if chmod didn't help
    else:
         # Re-raise the exception if it's not a permissions issue we can handle
         # Extract original exception type, value, and traceback
        exc_type, exc_value, _ = exc_info
        print(f"Error deleting {path}: {exc_value} (Type: {exc_type})")
        # Consider adding a small delay before potentially retrying or just raising
        # time.sleep(0.1)
        # raise # Re-raise the original exception


def force_delete_directory(dir_path, max_retries=3, delay=0.5):
    """Attempt to forcefully delete a directory, retrying on PermissionError."""
    for attempt in range(max_retries):
        try:
            if os.path.exists(dir_path):
                shutil.rmtree(dir_path, onerror=onerror)
                # Double check if it's really gone
                if not os.path.exists(dir_path):
                    print(f"Successfully deleted {dir_path}")
                    return True
                else:
                     # If it still exists after rmtree, something is weird
                     print(f"WARN: shutil.rmtree completed but {dir_path} still exists.")
                     # Fall through to retry might help if files are slow to release
        except PermissionError as e:
            print(f"Attempt {attempt + 1}/{max_retries}: PermissionError deleting {dir_path}: {e}. Retrying in {delay}s...")
            time.sleep(delay)
        except Exception as e:
            # Catch other potential errors during deletion
            print(f"Attempt {attempt + 1}/{max_retries}: Unexpected error deleting {dir_path}: {e}")
            time.sleep(delay) # Also wait before retry on unexpected errors

    # If deletion failed after all retries
    if os.path.exists(dir_path):
        print(f"ERROR: Failed to delete directory {dir_path} after {max_retries} attempts.")
        return False
    return True # Should technically not be reached if deletion fails, but good practice

# Helper functions
def clone_repository(repo_url: str, branch: str = "master", access_token: Optional[str] = None) -> Optional[str]:
    """Clone a GitHub repository to a temporary directory and return the path. Returns None if cloning fails."""
    repo_name_match = re.search(r"/([^/]+?)(\.git)?$", repo_url)
    if not repo_name_match:
         raise HTTPException(status_code=400, detail="Could not determine repository name from URL.")
    repo_name = repo_name_match.group(1)
    
    # Create a unique directory path
    # Using a timestamp or UUID might be safer for concurrency, but repo name is often sufficient
    repo_dir = os.path.join(TEMP_DIR, f"llmrepo_{repo_name}_{int(time.time())}")

    # --- Use robust deletion before cloning ---
    if os.path.exists(repo_dir):
         print(f"Directory {repo_dir} exists, attempting to remove before cloning.")
         if not force_delete_directory(repo_dir):
              # If cleanup fails, we might not be able to clone into it
              raise HTTPException(status_code=500, detail=f"Failed to clean up existing directory: {repo_dir}")


    # If access token is provided, use it for authentication
    auth_url = repo_url
    if access_token:
        # Format: https://{token}@github.com/username/repo.git
        if "github.com" in repo_url:
            if repo_url.startswith("https://"):
                auth_url = f"https://{access_token}@{repo_url[8:]}"
            elif repo_url.startswith("http://"):
                 # Although unlikely for github, handle just in case
                 auth_url = f"http://{access_token}@{repo_url[7:]}"
            # else: handle potential git@github.com:user/repo.git format if needed (requires SSH setup)
        # else: Assume other git providers might use different auth methods or URLs

    # Clone the repository
    try:
        print(f"Cloning {repo_url} (branch: {branch}) into {repo_dir}")
        git.Repo.clone_from(auth_url, repo_dir, branch=branch, depth=1) # Added depth=1 for faster clones
        print(f"Successfully cloned repository.")
        return repo_dir
    except git.GitCommandError as e:
        # Improved error message
        error_detail = f"Failed to clone repository: {str(e)}. "
        if "Authentication failed" in str(e):
            error_detail += "Please check your access token and repository URL."
        elif "could not find remote branch" in str(e):
            error_detail += f"Please ensure the branch '{branch}' exists."
        else:
            error_detail += "Check repository URL, branch name, and permissions."

        # Clean up potentially partially cloned directory on failure
        force_delete_directory(repo_dir)
        raise HTTPException(status_code=400, detail=error_detail)
    except Exception as e:
         # Catch any other unexpected errors during cloning
         print(f"Unexpected error during cloning: {e}")
         force_delete_directory(repo_dir)
         raise HTTPException(status_code=500, detail=f"An unexpected error occurred during repository cloning: {str(e)}")


def get_file_content(repo_dir: str, file_path: str) -> Optional[str]:
    """Get the content of a file in the repository. Returns None if not found or unreadable."""
    full_path = os.path.join(repo_dir, file_path)
    if not os.path.exists(full_path) or not os.path.isfile(full_path):
        # Don't raise HTTPException here, let caller decide. Log instead.
        print(f"File not found or is not a file: {full_path}")
        return None

    try:
        with open(full_path, "r", encoding="utf-8", errors='ignore') as f: # Added errors='ignore'
            return f.read()
    except Exception as e:
        print(f"Failed to read file {full_path}: {str(e)}")
        return None # Return None instead of raising HTTP 500 directly

def get_repo_structure(repo_dir: str) -> Dict[str, Any]:
    """Get the structure of the repository (files only)"""
    structure = {}
    if not os.path.isdir(repo_dir):
        return structure # Return empty if repo_dir doesn't exist

    for root, dirs, files in os.walk(repo_dir):
        # Skip .git directory
        if ".git" in dirs:
            dirs.remove(".git")

        # Get relative path
        rel_path = os.path.relpath(root, repo_dir)
        if rel_path == ".":
            rel_path = ""

        # Add files to structure
        for file in files:
            # Skip common lock files or potentially problematic files if needed
            # if file.endswith(".lock") or file == ".DS_Store":
            #     continue
            file_path = os.path.join(rel_path, file).replace("\\", "/") # Normalize path separators
            structure[file_path] = {
                "type": "file",
                "path": file_path,
            }

    return structure

def generate_gemini_response(prompt: str, error_detail: str = "Failed to generate response from LLM") -> str:
    """Helper function to call Gemini API and handle errors."""
    try:
        model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        # Add safety settings if needed, e.g.,
        # safety_settings = [
        #     {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        #     # ... other categories
        # ]
        # response = model.generate_content(prompt, safety_settings=safety_settings)
        response = model.generate_content(prompt)
        # Check if response has text, handle potential blocks
        if response.parts:
             return response.text
        elif response.prompt_feedback.block_reason:
             block_reason = response.prompt_feedback.block_reason
             rating_info = response.prompt_feedback.safety_ratings
             print(f"WARN: Gemini response blocked. Reason: {block_reason}. Ratings: {rating_info}")
             return f"Content generation blocked due to safety settings (Reason: {block_reason}). Please refine your query or check the content."
        else:
             # This case might happen if the response is empty for other reasons
             print("WARN: Gemini response was empty or contained no parts.")
             return "Received an empty response from the language model."

    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        # Check for specific Google API errors if needed
        if hasattr(e, 'message'):
            error_msg = e.message
        else:
            error_msg = str(e)
        # Avoid raising HTTPException directly from helper, let endpoint handle it
        # Or, re-raise a custom exception
        raise HTTPException(status_code=503, detail=f"{error_detail}: {error_msg}")


def get_repo_summary(repo_dir: str) -> str:
    """Generate a summary of the repository"""
    # Get README content if available
    readme_content = "No README file found."
    for readme_name in ["README.md", "readme.md", "README", "README.txt"]:
        content = get_file_content(repo_dir, readme_name)
        if content is not None:
            readme_content = content
            break

    # Get repository structure
    structure = get_repo_structure(repo_dir)
    structure_list = list(structure.keys())

    # Prepare prompt for Gemini
    prompt = f"""Analyze the following information about a GitHub repository and provide a concise summary (under 250 words).

    Repository Structure (Sample of files):
    {json.dumps(structure_list[:50], indent=2)}

    README Content (Partial):
    {readme_content[:3000]}

    Based on this, please summarize:
    1. The main purpose or goal of the repository.
    2. The primary programming languages or technologies used (if apparent).
    3. Key directories or files that seem important.
    4. Potential use cases or target audience.
    """

    # Generate summary using Gemini via helper function
    summary = generate_gemini_response(prompt, "Failed to generate repository summary")
    return summary


def process_code_for_llm(repo_dir: str, query: str, context: Optional[Dict[str, Any]] = None) -> str:
    """Process repository code to create context for the LLM, focusing on relevant files."""
    context_str = "Repository Context:\n"
    files_processed = set() # Keep track of files added

    # 1. Include files specified in the context explicitly
    if context and "files" in context and isinstance(context["files"], list):
        for file_path in context["files"]:
            if file_path not in files_processed:
                content = get_file_content(repo_dir, file_path)
                if content:
                    context_str += f"\n--- File: {file_path} ---\n```\n{content[:5000]}\n```\n"
                    files_processed.add(file_path)
                else:
                    context_str += f"\n--- File: {file_path} (Could not be read or found) ---\n"

    # 2. Always try to include README
    if "README.md" not in files_processed and "readme.md" not in files_processed:
        readme_found = False
        for readme_name in ["README.md", "readme.md", "README", "README.txt"]:
             if readme_name not in files_processed:
                content = get_file_content(repo_dir, readme_name)
                if content is not None:
                    context_str += f"\n--- File: {readme_name} ---\n```\n{content[:3000]}\n```\n"
                    files_processed.add(readme_name)
                    readme_found = True
                    break
        # if not readme_found:
        #      context_str += "\n--- README not found ---\n"


    # 3. Include relevant source files based on common patterns (limit total context)
    structure = get_repo_structure(repo_dir)
    potential_files = []
    # Prioritize common config and entry point files
    priority_files = ["package.json", "requirements.txt", "pom.xml", "build.gradle", "Cargo.toml", "setup.py", "main.py", "index.js", "app.py", "server.js"]
    for pf in priority_files:
        if pf in structure and pf not in files_processed:
            potential_files.append(pf)

    # Add other source files
    source_extensions = {".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".c", ".cpp", ".h", ".go", ".rs", ".php", ".html", ".css", ".scss", ".vue", ".rb"}
    for file_path in structure.keys():
        if file_path not in files_processed and any(file_path.lower().endswith(ext) for ext in source_extensions):
             # Basic relevance check (e.g., does filename relate to query?) - can be enhanced
             # if query.lower() in file_path.lower():
             #     potential_files.insert(0, file_path) # Prioritize potentially relevant files
             # else:
                potential_files.append(file_path)

    # Limit the number of additional files to avoid excessive context
    max_additional_files = 10
    files_to_add = [f for f in potential_files if f not in files_processed][:max_additional_files]

    for file_path in files_to_add:
        content = get_file_content(repo_dir, file_path)
        if content:
            # Slightly smaller limit per file to allow more files
            context_str += f"\n--- File: {file_path} ---\n```\n{content[:2500]}\n```\n"
            files_processed.add(file_path)

    # Add file structure list if not too large
    if len(structure) < 200: # Only add structure if repo isn't huge
         context_str += f"\n--- Repository File Structure (Partial) ---\n"
         context_str += "\n".join(list(structure.keys())[:75]) # Limit listed files
         context_str += "\n(... and possibly more files)\n"

    print(f"Generated context string of length: {len(context_str)}")
    # Add check for excessive context length before sending to LLM if needed
    # max_context_len = 30000 # Adjust based on model limits
    # if len(context_str) > max_context_len:
    #     context_str = context_str[:max_context_len] + "\n... (Context Truncated)"

    return context_str

# API Endpoints
@app.post("/api/repo/info")
async def get_repository_info(repo_request: RepoRequest):
    """Get basic information (summary, structure) about a GitHub repository"""
    repo_dir = None
    try:
        repo_dir = clone_repository(repo_request.repo_url, repo_request.branch, repo_request.access_token)
        if repo_dir is None:
             # clone_repository now raises HTTPException, so this might not be reached, but good practice.
             raise HTTPException(status_code=500, detail="Failed to clone repository, directory path is None.")

        # Get repository structure
        structure = get_repo_structure(repo_dir)

        # Generate repository summary
        summary = get_repo_summary(repo_dir) # This function now uses generate_gemini_response

        return {
            "repo_url": repo_request.repo_url,
            "branch": repo_request.branch,
            "summary": summary,
            "structure": structure,
        }
    except HTTPException as e:
         # Re-raise HTTPExceptions raised by helpers
         raise e
    except Exception as e:
         # Catch any other unexpected errors
         print(f"Unexpected error in get_repository_info: {e}")
         # Log the full traceback if possible: import traceback; traceback.print_exc()
         raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {str(e)}")
    finally:
        # Clean up cloned repository using robust deletion
        if repo_dir:
            print(f"Cleaning up directory: {repo_dir}")
            force_delete_directory(repo_dir)

@app.post("/api/repo/query")
async def query_repository(query_request: QueryRequest):
    """Query a GitHub repository using natural language"""
    repo_dir = None
    try:
        repo_dir = clone_repository(query_request.repo_url, query_request.branch, query_request.access_token)
        if repo_dir is None:
            raise HTTPException(status_code=500, detail="Failed to clone repository, directory path is None.")

        # Process code to create context for LLM
        context_str = process_code_for_llm(repo_dir, query_request.query, query_request.context)

        # Generate response using Gemini
        prompt = f"""You are an AI assistant specialized in analyzing and explaining code repositories.
        You will be given context from a Git repository, including file contents and structure, followed by a user's question.

        Repository Context:
        {context_str}

        User Question:
        {query_request.query}

        Please provide a detailed and accurate answer based *only* on the provided repository context.
        - If the context contains the answer, explain it clearly, referencing specific files if helpful.
        - If the context seems relevant but doesn't definitively answer the question, explain what you found and why it's insufficient.
        - If the provided context doesn't contain information relevant to the question, state that clearly. Do not invent information.
        - Structure your answer clearly. Use Markdown for formatting code snippets or file paths if necessary.
        """

        response_text = generate_gemini_response(prompt, "Failed to get response for repository query")

        return {
            "query": query_request.query,
            "response": response_text,
            "repo_url": query_request.repo_url,
            "branch": query_request.branch,
        }
    except HTTPException as e:
         raise e
    except Exception as e:
         print(f"Unexpected error in query_repository: {e}")
         raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {str(e)}")
    finally:
        if repo_dir:
            print(f"Cleaning up directory: {repo_dir}")
            force_delete_directory(repo_dir)

@app.post("/api/repo/file/summarize")
async def summarize_file(file_request: FileRequest):
    """Summarize a specific file in the repository"""
    repo_dir = None
    try:
        repo_dir = clone_repository(file_request.repo_url, file_request.branch, file_request.access_token)
        if repo_dir is None:
            raise HTTPException(status_code=500, detail="Failed to clone repository, directory path is None.")

        # Get file content
        file_content = get_file_content(repo_dir, file_request.file_path)
        if file_content is None:
             raise HTTPException(status_code=404, detail=f"File not found or could not be read: {file_request.file_path}")

        # Generate summary using Gemini
        # Limit content length reasonably for summarization
        max_content_length = 15000
        truncated = len(file_content) > max_content_length
        content_to_summarize = file_content[:max_content_length]

        prompt = f"""You are an AI assistant specialized in analyzing and explaining code.
        Please provide a detailed summary of the following file from a GitHub repository.

        File Path: {file_request.file_path}
        {'File Content (Truncated):' if truncated else 'File Content:'}
        ```
        {content_to_summarize}
        ```
        {"... (Content Truncated)" if truncated else ""}

        In your summary, please focus on:
        1. The main purpose or role of this file within a larger project.
        2. Key functions, classes, components, or configurations defined in the file and their responsibilities.
        3. How this file might interact with other parts of the codebase (if inferrable).
        4. Any notable patterns, algorithms, important libraries/frameworks used, or complex logic.

        Keep the summary informative and well-structured. Use Markdown for readability.
        """

        summary_text = generate_gemini_response(prompt, f"Failed to generate summary for file {file_request.file_path}")

        return {
            "repo_url": file_request.repo_url,
            "branch": file_request.branch,
            "file_path": file_request.file_path,
            "summary": summary_text,
        }
    except HTTPException as e:
         raise e
    except Exception as e:
         print(f"Unexpected error in summarize_file: {e}")
         raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {str(e)}")
    finally:
        if repo_dir:
            print(f"Cleaning up directory: {repo_dir}")
            force_delete_directory(repo_dir)


@app.post("/api/repo/dependencies")
async def analyze_dependencies(repo_request: RepoRequest):
    """Analyze known dependency files (package.json, requirements.txt) in the repository"""
    repo_dir = None
    dependencies = {}
    explanation = "No supported dependency files found or failed to parse." # Default explanation

    try:
        repo_dir = clone_repository(repo_request.repo_url, repo_request.branch, repo_request.access_token)
        if repo_dir is None:
            raise HTTPException(status_code=500, detail="Failed to clone repository, directory path is None.")

        dependency_files_content = {}

        # Check for package.json (Node.js)
        package_json_path = os.path.join(repo_dir, "package.json")
        if os.path.exists(package_json_path):
            content = get_file_content(repo_dir, "package.json")
            if content:
                try:
                    package_data = json.loads(content)
                    deps = package_data.get("dependencies", {})
                    dev_deps = package_data.get("devDependencies", {})
                    if deps:
                        dependencies["nodejs_runtime"] = deps
                    if dev_deps:
                        dependencies["nodejs_development"] = dev_deps
                    if deps or dev_deps:
                         dependency_files_content["package.json"] = content[:2000] # Add partial content for context
                except json.JSONDecodeError as e:
                    print(f"Failed to parse package.json: {e}")
                    dependencies["nodejs_parse_error"] = str(e)

        # Check for requirements.txt (Python)
        # Also check common variations like requirements/base.txt etc. if needed
        req_files = ["requirements.txt", "requirements/base.txt", "requirements/dev.txt", "pyproject.toml"] # Add pyproject.toml basic check
        found_python_deps = False
        for req_file_name in req_files:
             req_path = os.path.join(repo_dir, req_file_name)
             if os.path.exists(req_path):
                  content = get_file_content(repo_dir, req_file_name)
                  if content:
                      if req_file_name.endswith(".txt"):
                          reqs = {}
                          for line in content.splitlines():
                              line = line.strip()
                              if line and not line.startswith("#"):
                                   # Basic parsing, might fail on complex lines (e.g., git urls, editable installs)
                                   match = re.match(r"^\s*([a-zA-Z0-9_.-]+)\s*([<>=!~]+.*)?", line)
                                   if match:
                                        name = match.group(1)
                                        version = match.group(2).strip() if match.group(2) else "any"
                                        reqs[name] = version
                          if reqs:
                              dependencies[f"python_{req_file_name.replace('/', '_')}"] = reqs
                              dependency_files_content[req_file_name] = content[:2000]
                              found_python_deps = True
                      elif req_file_name == "pyproject.toml":
                           # Very basic check for poetry or standard deps
                           if "[tool.poetry.dependencies]" in content or "[project.dependencies]" in content:
                               dependencies["python_pyproject_toml"] = "Found (Poetry/PEP621 format)"
                               dependency_files_content[req_file_name] = content[:2000]
                               found_python_deps = True


        # Add basic checks for other ecosystems (just existence)
        other_dep_files = {
            "pom.xml": "java_maven",
            "build.gradle": "java_gradle",
            "build.gradle.kts": "java_gradle_kotlin",
            "Cargo.toml": "rust_cargo",
            "go.mod": "go_modules",
            "composer.json": "php_composer",
            "Gemfile": "ruby_bundler",
        }
        for fname, key in other_dep_files.items():
             fpath = os.path.join(repo_dir, fname)
             if os.path.exists(fpath):
                  content = get_file_content(repo_dir, fname)
                  if content:
                    dependencies[key] = "Detected"
                    # Add content snippet for context if file isn't too large
                    dependency_files_content[fname] = content[:1500]

        # Generate explanation using Gemini if dependencies were found
        if dependencies:
            context_for_llm = "Detected Dependencies:\n" + json.dumps(dependencies, indent=2) + "\n\n"
            if dependency_files_content:
                 context_for_llm += "Relevant File Contents (Partial):\n"
                 for fname, content in dependency_files_content.items():
                      context_for_llm += f"--- {fname} ---\n{content}\n\n"

            prompt = f"""Analyze the following dependency information extracted from a code repository.

            {context_for_llm}

            Based on the detected dependencies and their file contents (if provided):
            1. Identify the primary programming languages/ecosystems used in this project.
            2. For the most significant dependencies (especially in Node.js and Python if listed), briefly explain their purpose in the context of a typical web application or software project (e.g., 'React: Frontend UI library', 'Flask: Python web framework', 'Requests: HTTP client library').
            3. Mention any notable development-only dependencies if present.
            4. If multiple ecosystems are detected (e.g., Python backend, Node.js frontend), mention this possibility.

            Provide a concise overview. Focus on giving a general understanding of the project's tech stack based on these dependencies. Do not just list the dependencies back. If parsing errors occurred or detection is basic (like 'Detected' for Java/Rust), acknowledge that the analysis might be incomplete.
            """
            explanation = generate_gemini_response(prompt, "Failed to generate dependency explanation")
        else:
             explanation = "No supported dependency files (like package.json, requirements.txt, etc.) were found in the root directory or common subdirectories."


        return {
            "repo_url": repo_request.repo_url,
            "branch": repo_request.branch,
            "dependencies": dependencies, # The structured data
            "explanation": explanation,  # The LLM-generated explanation
        }
    except HTTPException as e:
         raise e
    except Exception as e:
         print(f"Unexpected error in analyze_dependencies: {e}")
         raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {str(e)}")
    finally:
        if repo_dir:
            print(f"Cleaning up directory: {repo_dir}")
            force_delete_directory(repo_dir)


# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Run the application
if __name__ == "__main__":
    import uvicorn
    # Recommended: Read host/port from environment variables for flexibility
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "true").lower() == "true" # Control reload via env var

    print(f"Starting Uvicorn server on {host}:{port} with reload={'enabled' if reload else 'disabled'}")
    uvicorn.run("main:app", host=host, port=port, reload=reload)

# fmt: on