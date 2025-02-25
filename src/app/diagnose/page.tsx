"use client"
import { useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function DiagnosePage() {
    const [symptoms, setSymptoms] = useState("");
    const [history, setHistory] = useState("");
    const [streamContent, setStreamContent] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStreamContent("");

        try {
            console.log("API URL:", `${process.env.NEXT_PUBLIC_SERVER_URL}/inference/diagnose`);
            console.log(JSON.stringify({
                symptoms,
                patient_history: history,
                model: "deepseek-ai/DeepSeek-V3",
            }),)
            await fetchEventSource(`${process.env.NEXT_PUBLIC_SERVER_URL}/inference/diagnose`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    symptoms,
                    patient_history: history,
                    model: "deepseek-ai/DeepSeek-V3",
                }),
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
            console.error("Fetch error:", error);
            setStreamContent((prev) => prev + `\n**Error:** ${String(error)}\n`);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Patient Diagnosis</h1>
            <form onSubmit={handleSubmit} className="mb-4 space-y-4">
                <div>
                    <label className="block mb-2 font-semibold">Symptoms</label>
                    <textarea
                        className="w-full p-2 border rounded"
                        rows={3}
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block mb-2 font-semibold">Patient History</label>
                    <textarea
                        className="w-full p-2 border rounded"
                        rows={3}
                        value={history}
                        onChange={(e) => setHistory(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Diagnose
                </button>
            </form>

            <div className="bg-gray-100 p-4 rounded-md min-h-[200px]">
                {streamContent ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamContent}</ReactMarkdown>
                ) : (
                    <p className="text-gray-400">No diagnosis yet...</p>
                )}
            </div>
        </div>
    );
}
