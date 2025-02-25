"use client"
import { useState, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchEventSource } from "@microsoft/fetch-event-source";

export default function VisualAnalysisPage() {
    const [prompt, setPrompt] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [streamContent, setStreamContent] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStreamContent("");

        if (!file) {
            alert("Please select an image file first.");
            return;
        }

        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("model", "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo");
        formData.append("file", file);

        try {
            await fetchEventSource(`${process.env.NEXT_PUBLIC_SERVER_URL}/inference/visual-analysis`, {
                method: "POST",
                body: formData,
                onmessage: (event) => {
                    if (event.data.startsWith("Error:")) {
                        setStreamContent((prev) => prev + "\n**" + event.data + "**\n");
                    } else {
                        setStreamContent((prev) => prev + event.data);
                    }
                },
                onerror(err) {
                    console.error("Stream error:", err);
                    setStreamContent((prev) => prev + `\n**Stream error:** ${err}\n`);
                },
                openWhenHidden: true,
            });
        } catch (error) {
            console.error("Error uploading file:", error);
            setStreamContent((prev) => prev + `\n**Error:** ${String(error)}\n`);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Visual Analysis</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-2 font-semibold">Prompt</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block mb-2 font-semibold">Choose an image</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                </div>
                <button
                    type="submit"
                    className="bg-purple-600 text-white px-4 py-2 rounded"
                >
                    Analyze
                </button>
            </form>

            <div className="bg-gray-100 p-4 rounded-md mt-4 min-h-[200px]">
                {streamContent ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamContent}</ReactMarkdown>
                ) : (
                    <p className="text-gray-400">No analysis yet...</p>
                )}
            </div>
        </div>
    );
}
