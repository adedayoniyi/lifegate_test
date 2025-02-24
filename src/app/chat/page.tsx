"use client"
import { useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPage() {
    const [instruction, setInstruction] = useState("");
    const [model, setModel] = useState("mistralai/Mistral-7B-Instruct-v0.2");
    const [streamContent, setStreamContent] = useState("");

    // Helper to parse the text content out of the streamed chunk.
    const parseChunkText = (chunk: string): string => {
        // Look for pattern: text=' ...'
        const match = chunk.match(/text='(.*?)'/);
        return match ? match[1] : "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStreamContent("");

        try {
            await fetchEventSource(`${process.env.baseURL}/inference/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    instruction,
                    model,
                    // image: null,
                }),
                onopen: async (response) => {
                    console.log("Connection opened, status:", response.status);
                    if (response.ok) {
                        // everything is fine
                    } else {
                        // maybe the server returned 4xx or 5xx
                        throw new Error(`Failed to open stream, status code: ${response.status}`);
                    }
                },
                onmessage: (event) => {
                    if (event.data.startsWith("Error:")) {
                        setStreamContent((prev) => prev + "\n**" + event.data + "**\n");
                    } else {
                        // Extract the token text from the full chunk text
                        const tokenText = parseChunkText(event.data);
                        setStreamContent((prev) => prev + tokenText);
                    }
                },
                onerror(err) {
                    console.error("Stream error:", err);
                    setStreamContent((prev) => prev + `\n**Stream error:** ${err}\n`);
                },
                openWhenHidden: true,
            });
        } catch (error) {
            console.error("Fetch error:", error);
            setStreamContent((prev) => prev + `\n**Error:** ${String(error)}\n`);
        }
    };

    return (
        // <Layout>
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">AI Chat</h1>
            <form onSubmit={handleSubmit} className="mb-4 space-y-4">
                <div>
                    <label className="block mb-2 font-semibold">Instruction Prompt</label>
                    <textarea
                        className="w-full p-2 border rounded"
                        rows={3}
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block mb-2 font-semibold">Model</label>
                    <input
                        className="w-full p-2 border rounded"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded"
                >
                    Send to AI
                </button>
            </form>

            <div className="bg-gray-100 p-4 rounded-md min-h-[200px]">
                {streamContent ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamContent}
                    </ReactMarkdown>
                ) : (
                    <p className="text-gray-400">No response yet...</p>
                )}
            </div>
        </div>
        // </Layout>
    );
}
