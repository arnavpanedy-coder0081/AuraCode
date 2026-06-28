/**
 * AuraCode AI Agent Core Logic
 * Handles Gemini API requests, prompt engineering, streaming responses, and file extraction.
 */

const Agent = {
    // Current ongoing fetch controller to support aborting
    activeController: null,

    /**
     * Test the validity of an API Key by sending a tiny request.
     * @param {string} apiKey 
     * @param {string} model 
     * @returns {Promise<boolean>}
     */
    async verifyKey(apiKey, model) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'Hello' }] }],
                        generationConfig: { maxOutputTokens: 5 }
                    })
                }
            );
            return response.ok;
        } catch (e) {
            console.error("API Key Verification failed:", e);
            return false;
        }
    },

    /**
     * Abort the running task.
     */
    abort() {
        if (this.activeController) {
            this.activeController.abort();
            this.activeController = null;
        }
    },

    /**
     * Run the agent cycle.
     * @param {string} userPrompt The instruction from user
     * @param {Array} chatHistory The current chat transcript [{role: 'user'|'model', parts: [{text: ...}]}]
     * @param {Object} virtualFiles Object representing files { 'path/to.js': 'content' }
     * @param {string} apiKey The Gemini API Key
     * @param {string} model The selected Gemini model
     * @param {Function} onProgress Callback for status/step updates: (stepName, type) => {}
     * @param {Function} onChunk Callback for text streaming: (text) => {}
     * @returns {Promise<Object>} Resolves with { text, updatedFiles }
     */
    async executeTask(userPrompt, chatHistory, virtualFiles, apiKey, model, onProgress, onChunk) {
        this.activeController = new AbortController();
        const signal = this.activeController.signal;

        try {
            onProgress("Analyzing request...", "active");

            // Format workspace files for the prompt
            let workspaceDescription = "";
            const filePaths = Object.keys(virtualFiles);
            if (filePaths.length === 0) {
                workspaceDescription = "The virtual workspace is currently empty. No files exist yet.";
            } else {
                workspaceDescription = "Here are the files currently in the virtual workspace:\n\n";
                filePaths.forEach(path => {
                    workspaceDescription += `--- FILE: ${path} ---\n${virtualFiles[path]}\n---------------------\n\n`;
                });
            }

            // Construct System Prompt
            const systemInstruction = `You are AuraCode, a highly skilled autonomous AI coding agent. You run inside a browser-based IDE and help users create, refactor, and explain code for free.
You have the ability to read and write files in a virtual workspace.

## Communication Protocol
1. To write or update files in the workspace, you MUST output the files wrapped in special markers:
   === START_FILE: path/to/file.ext ===
   [complete file contents here]
   === END_FILE: path/to/file.ext ===
   
   IMPORTANT: 
   - Always output the FULL contents of the file when creating or modifying it. Do not use placeholders or ellipsis (e.g. "// rest of code...").
   - You can create multiple files or update multiple existing files in a single response.
   - Use correct file extensions. For web applications, you can write index.html, styles.css, app.js, etc.

2. To help the UI display progress indicators, write logs in your response before writing files:
   [PLANNING] when you are outlining what files you will create/modify.
   [WRITING: path/to/file.ext] right before outputting the START_FILE marker for that file.
   [SUCCESS] when you have completed all file writes.
   Keep these tags on their own lines.

3. Keep your conversational explanations clean and professional.
`;

            // Prepare messages payload for API (re-building history)
            // System instructions are passed separately or as a system_instruction property for Gemini
            const contents = [];

            // Format previous chat history to match Gemini's structure
            chatHistory.forEach(msg => {
                contents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.text }]
                });
            });

            // Append current user message with context
            const userContextText = `[User Request]
${userPrompt}

[Virtual Workspace State]
${workspaceDescription}`;

            contents.push({
                role: 'user',
                parts: [{ text: userContextText }]
            });

            // Send request to Gemini API (non-streaming for reliability of full file retrieval,
            // but we can simulate stream chunking for the user experience, or use Server-Sent Events).
            // Actually, streaming generateContent is fully supported by Gemini! Let's use the stream endpoint:
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

            onProgress("Connecting to Gemini...", "active");

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: contents,
                    systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    },
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 8192
                    }
                }),
                signal: signal
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Gemini API error (${response.status}): ${errText}`);
            }

            // Read the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";
            let fullText = "";

            onProgress("Generating code plan...", "active");

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Gemini SSE returns blocks of JSON objects inside a list, or separate SSE lines.
                // For streamGenerateContent, the browser API returns chunks that look like:
                // [ { "candidates": [ ... ] } ]
                // Or incremental JSON list items. Let's parse them safely:
                let pos;
                while ((pos = buffer.indexOf('\n')) >= 0) {
                    const line = buffer.slice(0, pos).trim();
                    buffer = buffer.slice(pos + 1);

                    if (!line) continue;

                    // Clean line from SSE prefix if it has one (like "data: ")
                    let cleanLine = line;
                    if (cleanLine.startsWith("data:")) {
                        cleanLine = cleanLine.substring(5).trim();
                    }

                    // Remove leading/trailing array braces if Gemini sends them as a stream array
                    if (cleanLine.startsWith("[")) cleanLine = cleanLine.substring(1);
                    if (cleanLine.endsWith("]")) cleanLine = cleanLine.substring(0, cleanLine.length - 1);
                    if (cleanLine.startsWith(",")) cleanLine = cleanLine.substring(1);

                    cleanLine = cleanLine.trim();
                    if (!cleanLine) continue;

                    try {
                        const parsed = JSON.parse(cleanLine);
                        const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (textChunk) {
                            fullText += textChunk;
                            onChunk(textChunk);

                            // Inspect textChunk for status logs to update UI steps
                            if (textChunk.includes("[PLANNING]")) {
                                onProgress("Formulating plan...", "active");
                            }
                            const writingMatch = textChunk.match(/\[WRITING:\s*([^\]]+)\]/);
                            if (writingMatch) {
                                onProgress(`Writing file: ${writingMatch[1]}`, "active");
                            }
                            if (textChunk.includes("[SUCCESS]")) {
                                onProgress("Integrating changes...", "active");
                            }
                        }
                    } catch (e) {
                        // Sometimes chunks cut mid-JSON, so ignore parsing errors and wait for full content
                    }
                }
            }

            onProgress("Parsing files...", "active");

            // Extract files from the final text
            const updatedFiles = { ...virtualFiles };
            const fileBlockRegex = /===\s*START_FILE:\s*([^\s=]+)\s*===([\s\S]*?)===\s*END_FILE:\s*\1\s*===/g;
            let match;
            let fileCount = 0;

            while ((match = fileBlockRegex.exec(fullText)) !== null) {
                const filePath = match[1].trim();
                let fileContent = match[2];

                // Clean leading/trailing newlines in file content
                if (fileContent.startsWith('\n')) fileContent = fileContent.substring(1);
                if (fileContent.endsWith('\n')) fileContent = fileContent.substring(0, fileContent.length - 1);

                // Check if file content was wrapped inside a markdown code block by the AI
                const mdMatch = fileContent.match(/^```[a-zA-Z0-9+#-]*\n([\s\S]*?)\n```$/);
                if (mdMatch) {
                    fileContent = mdMatch[1];
                }

                updatedFiles[filePath] = fileContent;
                fileCount++;
            }

            onProgress(fileCount > 0 ? `Successfully wrote ${fileCount} file(s)` : "Task completed", "success");

            // Clean up any temporary files/markers from conversational text before presenting it
            let cleanResponseText = fullText
                .replace(/===\s*START_FILE:[\s\S]*?===\s*END_FILE:\s*[^\s=]+\s*===/g, "(Updated virtual workspace file)")
                .replace(/\[PLANNING\]/g, "")
                .replace(/\[WRITING:.*?\]/g, "")
                .replace(/\[SUCCESS\]/g, "")
                .trim();

            // Provide fallback text if it was only file blocks
            if (!cleanResponseText || cleanResponseText.length < 10) {
                cleanResponseText = `I have successfully updated the workspace files:\n` +
                    Object.keys(updatedFiles)
                        .filter(f => !virtualFiles[f] || virtualFiles[f] !== updatedFiles[f])
                        .map(f => `- **${f}** (${virtualFiles[f] ? 'Modified' : 'Created'})`)
                        .join("\n");
            }

            return {
                text: cleanResponseText,
                updatedFiles: updatedFiles
            };

        } catch (error) {
            if (error.name === 'AbortError') {
                onProgress("Task cancelled by user", "info");
                throw new Error("Task was aborted.");
            }
            onProgress("Error during code execution", "error");
            throw error;
        } finally {
            this.activeController = null;
        }
    }
};

// Expose agent globally
window.Agent = Agent;
