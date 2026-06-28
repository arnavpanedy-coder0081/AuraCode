/**
 * AuraCode App Controller
 * Orchestrates Monaco Editor, Virtual Filesystem, UI components, and the Agent interface.
 */

// Virtual File System State
let virtualFiles = {};
let activeFilePath = null;
let monacoEditor = null;
let chatHistory = [];
let isAgentRunning = false;

const DEFAULT_API_KEY = "AQ.Ab8RN6LBEA5OfFzymGjGN3QGzlMDUkLF5wCiR_Z71lExx4Z1rA";

function getApiKey() {
    return localStorage.getItem('auracode_key') || DEFAULT_API_KEY;
}

// Project templates definition
const TEMPLATES = {
    'html-css': {
        'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SaaS Metrics Dashboard</title>
    <link rel="stylesheet" href="styles.css">
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
    <div class="dashboard">
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
            <div class="logo">
                <i data-lucide="activity"></i>
                <span>PulseMetrics</span>
            </div>
            <nav class="nav">
                <a href="#" class="nav-item active"><i data-lucide="layout-dashboard"></i> Dashboard</a>
                <a href="#" class="nav-item"><i data-lucide="bar-chart-2"></i> Analytics</a>
                <a href="#" class="nav-item"><i data-lucide="users"></i> Customers</a>
                <a href="#" class="nav-item"><i data-lucide="settings"></i> Settings</a>
            </nav>
        </aside>

        <!-- Main Body -->
        <main class="content">
            <header class="header">
                <h1>Overview</h1>
                <button class="btn-refresh" onclick="updateData()">
                    <i data-lucide="rotate-cw"></i> Refresh
                </button>
            </header>

            <!-- KPI Cards Grid -->
            <div class="grid-kpis">
                <div class="card">
                    <span class="card-label">Monthly Recurring Revenue</span>
                    <h2 class="card-value" id="val-mrr">$48,250</h2>
                    <span class="trend up"><i data-lucide="trending-up"></i> +12.4% vs last month</span>
                </div>
                <div class="card">
                    <span class="card-label">Active Customers</span>
                    <h2 class="card-value" id="val-cust">1,248</h2>
                    <span class="trend up"><i data-lucide="trending-up"></i> +8.2% vs last month</span>
                </div>
                <div class="card">
                    <span class="card-label">Churn Rate</span>
                    <h2 class="card-value" id="val-churn">1.84%</h2>
                    <span class="trend down"><i data-lucide="trending-down"></i> -0.15% vs last month</span>
                </div>
            </div>

            <!-- Chart Simulation Card -->
            <div class="card chart-card">
                <h3>Revenue Growth Trend</h3>
                <div class="bar-chart">
                    <div class="bar" style="height: 60%;" title="Jan: $30k"><span>Jan</span></div>
                    <div class="bar" style="height: 70%;" title="Feb: $35k"><span>Feb</span></div>
                    <div class="bar" style="height: 65%;" title="Mar: $32k"><span>Mar</span></div>
                    <div class="bar" style="height: 80%;" title="Apr: $40k"><span>Apr</span></div>
                    <div class="bar" style="height: 90%;" title="May: $45k"><span>May</span></div>
                    <div class="bar" style="height: 100%;" title="Jun: $48k"><span>Jun</span></div>
                </div>
            </div>
        </main>
    </div>
    
    <script src="app.js"></script>
</body>
</html>`,
        'styles.css': `/* Reset & Base */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background-color: #f9fafb;
    color: #111827;
    height: 100vh;
}
/* Layout */
.dashboard {
    display: flex;
    height: 100vh;
}
/* Sidebar */
.sidebar {
    width: 240px;
    background-color: #1f2937;
    color: white;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 32px;
}
.logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.25rem;
    font-weight: 700;
}
.nav {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #9ca3af;
    text-decoration: none;
    padding: 10px 12px;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s;
}
.nav-item:hover, .nav-item.active {
    color: white;
    background-color: #374151;
}
/* Content */
.content {
    flex-grow: 1;
    padding: 40px;
    overflow-y: auto;
}
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
}
.btn-refresh {
    background-color: #6366f1;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s;
}
.btn-refresh:hover {
    background-color: #4f46e5;
}
/* Grid */
.grid-kpis {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
}
.card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.card-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
}
.card-value {
    font-size: 2rem;
    font-weight: 700;
    margin-top: 8px;
    margin-bottom: 8px;
}
.trend {
    font-size: 0.875rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
}
.trend.up { color: #10b981; }
.trend.down { color: #ef4444; }

/* Chart Styling */
.chart-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.bar-chart {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    height: 200px;
    padding-top: 20px;
    border-bottom: 1px solid #e5e7eb;
}
.bar {
    width: 12%;
    background-color: #818cf8;
    border-radius: 4px 4px 0 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    position: relative;
}
.bar:hover {
    background-color: #6366f1;
}
.bar span {
    position: absolute;
    bottom: -24px;
    font-size: 0.75rem;
    color: #6b7280;
}`,
        'app.js': `// Dashboard Logic
console.log("Dashboard loaded!");
lucide.createIcons();

function updateData() {
    console.log("Refreshing metrics...");
    // Simulate updating indicators with random parameters
    const mrrVal = Math.floor(45000 + Math.random() * 5000);
    const activeCustomers = Math.floor(1200 + Math.random() * 80);
    
    document.getElementById('val-mrr').innerText = "$" + mrrVal.toLocaleString();
    document.getElementById('val-cust').innerText = activeCustomers.toLocaleString();
    
    // Highlight the button momentarily
    const btn = document.querySelector('.btn-refresh');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => btn.style.transform = 'scale(1)', 100);
}`
    },
    'react-landing': {
        'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React SPA Boilerplate</title>
    <!-- React and ReactDOM CDNs -->
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <!-- Babel for on-the-fly JSX parsing -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <!-- Tailwind for styling in React -->
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">
    <div id="root"></div>

    <script type="text/babel">
        // React component imported inside single client runner
        const { useState } = React;

        function App() {
            const [count, setCount] = useState(0);
            
            return (
                <div class="flex flex-col items-center justify-center min-h-screen p-6">
                    <div class="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
                        <div class="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-xl mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h1 class="text-2xl font-bold text-white mb-2">React Application</h1>
                        <p class="text-slate-400 text-sm mb-6">Running in sandboxed browser DOM</p>
                        
                        <div class="bg-slate-900 rounded-xl p-4 mb-6 border border-slate-700">
                            <span class="text-3xl font-extrabold text-indigo-400">{count}</span>
                        </div>

                        <div class="flex gap-4 justify-center">
                            <button 
                                onClick={() => setCount(count - 1)} 
                                class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition"
                            >
                                Decrement
                            </button>
                            <button 
                                onClick={() => setCount(count + 1)} 
                                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition"
                            >
                                Increment
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Render target
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>`
    },
    'python-scraper': {
        'scraper.py': `# Beautiful Soup Python Scraper Template
import requests
from bs4 import BeautifulSoup
import json

def scrape_articles():
    url = "https://news.ycombinator.com/"
    print(f"Connecting to {url}...")
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        articles = []
        
        # HN story title tags
        story_tags = soup.select(".titleline > a")
        score_tags = soup.select(".subtext")
        
        for i, tag in enumerate(story_tags[:15]):
            title = tag.get_text()
            link = tag.get('href')
            
            articles.append({
                "rank": i + 1,
                "title": title,
                "link": link
            })
            
        print(f"Successfully scraped {len(articles)} articles!")
        return json.dumps(articles, indent=2)
        
    except Exception as e:
        return f"Scraping error: {str(e)}"

if __name__ == '__main__':
    result = scrape_articles()
    print(result)
`
    },
    'node-express': {
        'server.js': `// Simple Express.js Backend Server API
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Mock database
let tasks = [
    { id: 1, title: "Review implementation plan", completed: true },
    { id: 2, title: "Configure Gemini API connection", completed: false },
    { id: 3, title: "Launch coding agent", completed: false }
];

// GET all items
app.get('/api/tasks', (req, res) => {
    res.json({
        success: true,
        count: tasks.length,
        data: tasks
    });
});

// POST new item
app.post('/api/tasks', (req, res) => {
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ success: false, error: "Title is required" });
    }
    
    const newTask = {
        id: tasks.length + 1,
        title: title,
        completed: false
    };
    tasks.push(newTask);
    res.status(201).json({ success: true, data: newTask });
});

// START
app.listen(PORT, () => {
    console.log(\`Server is running on http://localhost:\${PORT}\`);
});`
    }
};

// Map file extensions to Monaco Editor Languages
function getLanguageFromExtension(path) {
    if (!path) return 'plaintext';
    const ext = path.split('.').pop().toLowerCase();
    switch (ext) {
        case 'html':
        case 'htm':
            return 'html';
        case 'css':
            return 'css';
        case 'js':
        case 'es6':
            return 'javascript';
        case 'jsx':
            return 'javascript'; // or typescript if typed
        case 'ts':
            return 'typescript';
        case 'tsx':
            return 'typescript';
        case 'py':
            return 'python';
        case 'json':
            return 'json';
        case 'md':
            return 'markdown';
        case 'sql':
            return 'sql';
        case 'sh':
            return 'shell';
        default:
            return 'plaintext';
    }
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
    initUI();
    loadApiKeyStatus();
    loadMonacoEditor();
});

// Helper for UI elements selection
const $ = (id) => document.getElementById(id);

/**
 * Configure UI Handlers
 */
function initUI() {
    // API Modal Handlers
    $('api-status-btn').addEventListener('click', () => showModal('api-modal'));
    $('link-setup-key').addEventListener('click', (e) => {
        e.preventDefault();
        showModal('api-modal');
    });
    $('btn-close-api-modal').addEventListener('click', () => hideModal('api-modal'));
    $('btn-save-key').addEventListener('click', saveApiKey);
    $('btn-clear-key').addEventListener('click', clearApiKey);
    
    // Toggle password visibility
    $('btn-toggle-key-visibility').addEventListener('click', () => {
        const input = $('input-api-key');
        const icon = $('btn-toggle-key-visibility').querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            input.type = 'password';
            icon.setAttribute('data-lucide', 'eye');
        }
        lucide.createIcons();
    });

    // Help modal handlers
    $('btn-help-modal').addEventListener('click', (e) => {
        e.preventDefault();
        showModal('help-modal');
    });
    $('btn-close-help-modal').addEventListener('click', () => hideModal('help-modal'));
    $('btn-close-help-ok').addEventListener('click', () => hideModal('help-modal'));

    // File buttons
    $('btn-new-file').addEventListener('click', createNewFilePrompt);
    $('btn-new-folder').addEventListener('click', createNewFolderPrompt);

    // Copy active file action
    $('btn-copy-code').addEventListener('click', copyActiveFileContent);

    // Import operations
    $('btn-import-files').addEventListener('click', () => $('input-import-files').click());
    $('btn-import-folder').addEventListener('click', () => $('input-import-folder').click());

    $('input-import-files').addEventListener('change', handleImportFiles);
    $('input-import-folder').addEventListener('change', handleImportFolder);
    
    // Project operations
    $('btn-download-project').addEventListener('click', downloadProjectAsZip);

    // Chat actions
    $('btn-send-message').addEventListener('click', handleSendMessage);
    $('chat-input').addEventListener('input', (e) => {
        $('btn-send-message').disabled = !e.target.value.trim();
    });
    $('chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !$('btn-send-message').disabled) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    $('btn-clear-chat').addEventListener('click', clearChatHistory);
    $('btn-explain-code').addEventListener('click', requestExplainCode);
    $('btn-optimize-code').addEventListener('click', requestOptimizeCode);
    $('btn-abort-agent').addEventListener('click', abortAgentExecution);

    // Templates loader
    document.querySelectorAll('.template-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const templateKey = btn.getAttribute('data-template');
            loadTemplate(templateKey);
        });
    });

    // Close modal on escape or background click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            hideModal(e.target.id);
        }
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(el => el.classList.add('hidden'));
        }
    });

    lucide.createIcons();
}

/**
 * Modal visibility
 */
function showModal(id) {
    $(id).classList.remove('hidden');
    if (id === 'api-modal') {
        $('input-api-key').value = localStorage.getItem('auracode_key') || DEFAULT_API_KEY;
        $('select-model').value = localStorage.getItem('auracode_model') || 'gemini-2.5-flash';
    }
}

function hideModal(id) {
    $(id).classList.add('hidden');
}

/**
 * LocalStorage API Key Management
 */
function loadApiKeyStatus() {
    const key = getApiKey();
    const dot = $('api-dot');
    const label = $('api-status-text');

    if (key) {
        dot.className = "status-indicator-dot online";
        label.innerText = localStorage.getItem('auracode_key') ? "Custom Key Connected" : "Default Key Active";
    } else {
        dot.className = "status-indicator-dot offline";
        label.innerText = "Key Required";
    }
}

async function saveApiKey() {
    const key = $('input-api-key').value.trim();
    const model = $('select-model').value;
    
    if (!key) {
        alert("Please enter a valid API Key.");
        return;
    }

    $('btn-save-key').innerText = "Validating...";
    $('btn-save-key').disabled = true;

    const isValid = await Agent.verifyKey(key, model);
    
    $('btn-save-key').innerText = "Save Connection";
    $('btn-save-key').disabled = false;

    if (isValid) {
        localStorage.setItem('auracode_key', key);
        localStorage.setItem('auracode_model', model);
        loadApiKeyStatus();
        hideModal('api-modal');
        appendSystemChatMessage("Gemini API connection configured successfully. Your workspace agent is ready!");
    } else {
        alert("Verification failed! The key is either invalid, or the network requests were blocked. Verify the key or try another model.");
    }
}

function clearApiKey() {
    localStorage.removeItem('auracode_key');
    localStorage.removeItem('auracode_model');
    $('input-api-key').value = DEFAULT_API_KEY;
    loadApiKeyStatus();
    hideModal('api-modal');
    appendSystemChatMessage("API connection reset to the built-in default key.");
}

/**
 * Monaco Editor loader
 */
function loadMonacoEditor() {
    // Wait for the require script setup in index.html to fetch AMD from CDN
    if (typeof require === 'function') {
        require(['vs/editor/editor.main'], function() {
            monacoEditor = monaco.editor.create($('monaco-container'), {
                value: `// Welcome to AuraCode IDE\n// Create, write, or refactor files here.\n\nconsole.log("Welcome to AuraCode!");\n`,
                language: 'javascript',
                theme: 'vs-dark',
                automaticLayout: true,
                fontSize: 14,
                fontFamily: 'Fira Code',
                tabSize: 4,
                minimap: { enabled: false },
                lineNumbersMinChars: 3,
                roundedSelection: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: "on"
            });

            // Listen for document content changes to save back to state
            monacoEditor.onDidChangeModelContent(() => {
                if (activeFilePath && virtualFiles[activeFilePath] !== undefined) {
                    virtualFiles[activeFilePath] = monacoEditor.getValue();
                }
            });

            // Set default view file
            loadTemplate('html-css');
        });
    } else {
        setTimeout(loadMonacoEditor, 100);
    }
}

/**
 * Load predefined templates
 */
function loadTemplate(key) {
    if (!TEMPLATES[key]) return;
    
    // Clear current workspace files
    virtualFiles = { ...TEMPLATES[key] };
    
    // Set default active file
    const files = Object.keys(virtualFiles);
    activeFilePath = files.includes('index.html') ? 'index.html' : files[0];
    
    // Refresh UI
    renderFileExplorer();
    openFileInEditor(activeFilePath);
    
    appendSystemChatMessage(`Loaded the "${key.replace('-', ' ')}" template. View files in the workspace explorer.`);
}

/**
 * Tree File Explorer Builder
 */
function renderFileExplorer() {
    const container = $('file-explorer');
    container.innerHTML = "";
    
    const filePaths = Object.keys(virtualFiles).sort();
    if (filePaths.length === 0) {
        container.innerHTML = `<div class="empty-state-text">No files created yet.</div>`;
        return;
    }

    // Standard list container (can support multi-level path trees)
    filePaths.forEach(path => {
        const item = document.createElement('div');
        item.className = `tree-item ${path === activeFilePath ? 'active' : ''}`;
        
        // Icon selection based on file types
        let iconType = 'file-code';
        const ext = path.split('.').pop().toLowerCase();
        if (ext === 'html') iconType = 'file-type-2';
        else if (ext === 'css') iconType = 'hash';
        else if (ext === 'js' || ext === 'jsx') iconType = 'code';
        else if (ext === 'py') iconType = 'terminal';
        else if (ext === 'json') iconType = 'braces';
        else if (ext === 'md') iconType = 'file-text';
        
        item.innerHTML = `
            <i data-lucide="${iconType}"></i>
            <span class="file-name" title="${path}">${path}</span>
            <div class="actions">
                <button class="btn-delete-file" data-path="${path}" title="Delete File">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        
        // File click
        item.addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-file')) return; // ignore delete clicks
            openFileInEditor(path);
        });

        // Delete button click
        item.querySelector('.btn-delete-file').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteFile(path);
        });

        container.appendChild(item);
    });

    lucide.createIcons();
}

/**
 * File CRUD Operations
 */
function openFileInEditor(path) {
    if (!monacoEditor || !virtualFiles[path]) return;
    
    // Save current active content before switching
    if (activeFilePath && virtualFiles[activeFilePath] !== undefined) {
        virtualFiles[activeFilePath] = monacoEditor.getValue();
    }
    
    activeFilePath = path;
    
    // Set Monaco Editor content & model language
    const lang = getLanguageFromExtension(path);
    const model = monacoEditor.getModel();
    
    monaco.editor.setModelLanguage(model, lang);
    monacoEditor.setValue(virtualFiles[path]);

    // Update File status indicators
    $('editor-file-info').innerText = path;
    $('editor-syntax-lang').innerText = lang.toUpperCase();

    // Render active tab in header
    renderEditorTabs();
    
    // Highlight file explorer item
    renderFileExplorer();
}

function renderEditorTabs() {
    const tabContainer = $('editor-tabs');
    tabContainer.innerHTML = "";

    if (!activeFilePath) {
        tabContainer.innerHTML = `<div class="tab empty-tab active">No Active File</div>`;
        return;
    }

    // Simple single-tab dashboard representing active workspace file
    const tab = document.createElement('div');
    tab.className = "tab active";
    tab.innerHTML = `
        <i data-lucide="file-code"></i>
        <span>${activeFilePath}</span>
    `;
    tabContainer.appendChild(tab);
    lucide.createIcons();
}

function createNewFilePrompt() {
    const filename = prompt("Enter file name (e.g. style.css or script.js):");
    if (!filename) return;

    const path = filename.trim();
    if (virtualFiles[path] !== undefined) {
        alert("File already exists!");
        return;
    }

    virtualFiles[path] = "";
    renderFileExplorer();
    openFileInEditor(path);
}

function createNewFolderPrompt() {
    const foldername = prompt("Enter folder path prefix (e.g., src/components/):");
    if (!foldername) return;
    
    // Virtual file systems handle paths directly. Just create a dummy placeholder file in that path
    const path = foldername.trim().replace(/\/$/, '') + '/index.js';
    if (virtualFiles[path] !== undefined) {
        alert("Folder structure already contains index.js!");
        return;
    }

    virtualFiles[path] = `// Component placeholder\n`;
    renderFileExplorer();
    openFileInEditor(path);
}

function deleteFile(path) {
    if (!confirm(`Are you sure you want to delete ${path}?`)) return;
    
    delete virtualFiles[path];
    
    if (activeFilePath === path) {
        const remaining = Object.keys(virtualFiles);
        activeFilePath = remaining.length > 0 ? remaining[0] : null;
    }
    
    renderFileExplorer();
    if (activeFilePath) {
        openFileInEditor(activeFilePath);
    } else {
        if (monacoEditor) monacoEditor.setValue("");
        $('editor-file-info').innerText = "Ready";
        $('editor-syntax-lang').innerText = "Plain Text";
        renderEditorTabs();
    }
}



/**
 * Chat Stream & UI Handlers
 */
function appendUserChatMessage(text) {
    const chatBox = $('chat-messages');
    const msg = document.createElement('div');
    msg.className = "message user-message";
    msg.innerHTML = `
        <div class="msg-avatar"><i data-lucide="user"></i></div>
        <div class="msg-content">
            <p>${escapeHtml(text)}</p>
        </div>
    `;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    lucide.createIcons();
}

function appendSystemChatMessage(text) {
    const chatBox = $('chat-messages');
    const msg = document.createElement('div');
    msg.className = "message system-message";
    msg.innerHTML = `
        <div class="msg-avatar"><i data-lucide="bot"></i></div>
        <div class="msg-content">
            <p>${text}</p>
        </div>
    `;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    lucide.createIcons();
}

/**
 * Escape HTML symbols for display inside chat text bubbles
 */
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

/**
 * Parse conversational agent answers to convert basic markdown items
 */
function formatMarkdown(text) {
    // Simple regex replacements for markdown presentation in chat
    let html = text;
    
    // Code blocks matching
    html = html.replace(/```([a-zA-Z0-9+#-]*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    
    // Bold matching
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Inline code tags
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bullet lists
    html = html.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

    // Paragraph structures
    html = html.split('\n\n').map(p => {
        p = p.trim();
        if (p.startsWith('<ul>') || p.startsWith('<li>') || p.startsWith('<pre>')) return p;
        return `<p>${p}</p>`;
    }).join('\n');

    return html;
}

/**
 * Launch API Request
 */
async function handleSendMessage() {
    const key = getApiKey();
    if (!key) {
        showModal('api-modal');
        return;
    }

    const inputField = $('chat-input');
    const userPrompt = inputField.value.trim();
    if (!userPrompt || isAgentRunning) return;

    // Clear input
    inputField.value = "";
    $('btn-send-message').disabled = true;

    // Save active editor file contents to our model state
    if (activeFilePath && virtualFiles[activeFilePath] !== undefined) {
        virtualFiles[activeFilePath] = monacoEditor.getValue();
    }

    // Update UI chat view
    appendUserChatMessage(userPrompt);
    
    // Setup running UI state
    isAgentRunning = true;
    $('agent-monitor').classList.remove('hidden');
    
    // Create assistant typing message placeholder
    const chatBox = $('chat-messages');
    const msg = document.createElement('div');
    msg.className = "message assistant-message";
    msg.innerHTML = `
        <div class="msg-avatar"><i data-lucide="bot"></i></div>
        <div class="msg-content" id="active-agent-stream-bubble">
            <span class="typing-placeholder">Agent preparing code plan...</span>
        </div>
    `;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    lucide.createIcons();

    const streamContainer = $('active-agent-stream-bubble');
    let generatedStreamBuffer = "";

    // Load configurations
    const model = localStorage.getItem('auracode_model') || "gemini-2.5-flash";

    try {
        // Execute Gemini call via agent
        const result = await Agent.executeTask(
            userPrompt,
            chatHistory,
            virtualFiles,
            key,
            model,
            // Progress monitor steps
            (stepName, statusType) => {
                $('monitor-title').innerText = stepName;
                if (statusType === 'success') {
                    setTimeout(() => $('agent-monitor').classList.add('hidden'), 2000);
                }
            },
            // Stream text chunks
            (chunk) => {
                // If this is the first chunk, empty placeholder
                const placeholder = streamContainer.querySelector('.typing-placeholder');
                if (placeholder) {
                    streamContainer.innerHTML = "";
                }
                generatedStreamBuffer += chunk;
                // Basic markdown preview rendering
                streamContainer.innerHTML = formatMarkdown(escapeHtml(generatedStreamBuffer));
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        );

        // Update local file contents
        virtualFiles = result.updatedFiles;

        // Save to conversational log
        chatHistory.push({ role: 'user', text: userPrompt });
        chatHistory.push({ role: 'assistant', text: result.text });

        // Update presentation
        streamContainer.innerHTML = formatMarkdown(escapeHtml(result.text));
        
        // Refresh workspace
        renderFileExplorer();
        
        // If files changed, select and open the first modified file
        const updatedFilesList = Object.keys(virtualFiles);
        if (updatedFilesList.length > 0) {
            if (!activeFilePath || !updatedFilesList.includes(activeFilePath)) {
                openFileInEditor(updatedFilesList[0]);
            } else {
                // Reload current open file in case content changed
                openFileInEditor(activeFilePath);
            }
        }

    } catch (err) {
        console.error("Execution error:", err);
        let userMessage = err.message;
        if (err.message.includes("400") || err.message.includes("403") || err.message.includes("API key")) {
            userMessage += `<br><br><span style="color:var(--text-secondary); font-weight:normal; display:block; margin-top:8px;">💡 <strong>Troubleshooting:</strong> The default API key is a placeholder. To make calls successfully for free, get your own API key from <a href="https://aistudio.google.com/" target="_blank" class="text-link" style="color:var(--color-primary-bright); font-weight:600;">Google AI Studio</a>, click the <strong>Gemini API Connection</strong> card in the sidebar, and paste it.</span>`;
        }
        streamContainer.innerHTML = `<p style="color:var(--color-danger); font-weight:600;">Error: ${userMessage}</p>`;
    } finally {
        isAgentRunning = false;
        streamContainer.removeAttribute('id'); // release placeholder ID
        $('agent-monitor').classList.add('hidden');
        $('btn-send-message').disabled = !inputField.value.trim();
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

/**
 * Ask Agent to explain active file
 */
function requestExplainCode() {
    if (!activeFilePath || !virtualFiles[activeFilePath]) {
        alert("No active file to explain!");
        return;
    }
    const code = virtualFiles[activeFilePath];
    $('chat-input').value = `Explain the following code inside the file "${activeFilePath}":\n\n\`\`\`\n${code}\n\`\`\``;
    $('btn-send-message').disabled = false;
    $('chat-input').focus();
}

/**
 * Ask Agent to optimize active file
 */
function requestOptimizeCode() {
    if (!activeFilePath || !virtualFiles[activeFilePath]) {
        alert("No active file to refactor!");
        return;
    }
    const code = virtualFiles[activeFilePath];
    $('chat-input').value = `Refactor and optimize the following code in "${activeFilePath}". Look for code deduplication, clean formatting, performance, and best practices. Please return the fully refactored file content:\n\n\`\`\`\n${code}\n\`\`\``;
    $('btn-send-message').disabled = false;
    $('chat-input').focus();
}

/**
 * Cancel current running execution
 */
function abortAgentExecution() {
    Agent.abort();
}

/**
 * Clear Chat logs
 */
function clearChatHistory() {
    if (!confirm("Are you sure you want to clear conversation logs?")) return;
    chatHistory = [];
    $('chat-messages').innerHTML = `
        <div class="message system-message">
            <div class="msg-avatar"><i data-lucide="bot"></i></div>
            <div class="msg-content">
                <p>Conversation logs cleared. Ask anything to build your workspace files!</p>
            </div>
        </div>
    `;
    lucide.createIcons();
}

/**
 * ZIP Exporter Integration
 */
function downloadProjectAsZip() {
    const filePaths = Object.keys(virtualFiles);
    if (filePaths.length === 0) {
        alert("No files to download!");
        return;
    }

    $('btn-download-project').disabled = true;
    $('btn-download-project').querySelector('span').innerText = "Zipping...";

    // Save active editor file contents to our model state
    if (activeFilePath && virtualFiles[activeFilePath] !== undefined) {
        virtualFiles[activeFilePath] = monacoEditor.getValue();
    }

    const zip = new JSZip();

    // Add each file to the zip archive
    filePaths.forEach(path => {
        zip.file(path, virtualFiles[path]);
    });

    zip.generateAsync({ type: "blob" })
        .then(content => {
            // Trigger browser download anchor link
            const url = window.URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = "auracode-project.zip";
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                $('btn-download-project').disabled = false;
                $('btn-download-project').querySelector('span').innerText = "Export ZIP";
            }, 100);
        })
        .catch(err => {
            console.error("ZIP Generation error:", err);
            alert("Failed to build ZIP file!");
            $('btn-download-project').disabled = false;
            $('btn-download-project').querySelector('span').innerText = "Export ZIP";
        });
}

/**
 * Copy Active File Content
 */
function copyActiveFileContent() {
    if (!activeFilePath || !virtualFiles[activeFilePath]) {
        alert("No active file to copy!");
        return;
    }
    // Save current editor content to ensure it's up to date
    if (monacoEditor) {
        virtualFiles[activeFilePath] = monacoEditor.getValue();
    }
    
    navigator.clipboard.writeText(virtualFiles[activeFilePath]).then(() => {
        const btn = $('btn-copy-code');
        const originalText = btn.querySelector('span').innerText;
        btn.querySelector('span').innerText = "Copied!";
        setTimeout(() => {
            btn.querySelector('span').innerText = originalText;
        }, 1500);
    }).catch(err => {
        console.error("Copy failed:", err);
        alert("Failed to copy code to clipboard.");
    });
}

/**
 * Import Files Handler
 */
function handleImportFiles(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let loadedCount = 0;
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const content = e.target.result;
            virtualFiles[file.name] = content;
            loadedCount++;
            
            if (loadedCount === totalFiles) {
                renderFileExplorer();
                openFileInEditor(files[0].name);
                appendSystemChatMessage(`Imported ${totalFiles} file(s) from your device.`);
                event.target.value = ""; // clear inputs
            }
        };
        
        reader.readAsText(file);
    }
}

/**
 * Import Folder Handler
 */
function handleImportFolder(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let loadedCount = 0;
    const totalFiles = files.length;
    let firstFilePath = null;

    for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        const path = file.webkitRelativePath || file.name;
        if (i === 0) firstFilePath = path;

        reader.onload = (e) => {
            const content = e.target.result;
            virtualFiles[path] = content;
            loadedCount++;
            
            if (loadedCount === totalFiles) {
                renderFileExplorer();
                if (firstFilePath) {
                    openFileInEditor(firstFilePath);
                }
                appendSystemChatMessage(`Imported folder structure with ${totalFiles} files.`);
                event.target.value = ""; // clear inputs
            }
        };
        
        reader.readAsText(file);
    }
}
