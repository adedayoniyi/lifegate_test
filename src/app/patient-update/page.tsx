"use client"

import { useState, FormEvent } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
// import Layout from "../components/Layout";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function PatientUpdatePage() {
    const [patientId, setPatientId] = useState<string>("");
    const [currentStatus, setCurrentStatus] = useState("");
    const [recentChanges, setRecentChanges] = useState("");
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [model, setModel] = useState("QWEN/QWEN1.5-32B-CHAT");
    const [streamContent, setStreamContent] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStreamContent("");

        try {
            await fetchEventSource("http://127.0.0.1:8000/inference/patient-update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    patient_id: Number(patientId),
                    current_status: currentStatus,
                    recent_changes: recentChanges,
                    additional_notes: additionalNotes,
                    model,
                }),
                onmessage: (event) => {
                    if (event.data.startsWith("Error:")) {
                        setStreamContent((prev) => prev + `\n**${event.data}**\n`);
                    } else {
                        setStreamContent((prev) => prev + event.data);
                    }
                },
                onerror(err) {
                    console.error("SSE error:", err);
                    setStreamContent((prev) => prev + `\n**Stream error:** ${err}\n`);
                },
                openWhenHidden: true,
            });
        } catch (error) {
            console.error("Fetch error:", error);
            setStreamContent(`**Error:** ${String(error)}`);
        }
    };

    return (
        // <Layout>
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Patient Update Suggestions</h1>
            <form onSubmit={handleSubmit} className="space-y-4 mb-4">
                <div>
                    <label className="block mb-1 font-semibold">Patient ID</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block mb-1 font-semibold">Current Status</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={currentStatus}
                        onChange={(e) => setCurrentStatus(e.target.value)}
                        placeholder="e.g., Stable but showing slight fever..."
                    />
                </div>
                <div>
                    <label className="block mb-1 font-semibold">Recent Changes</label>
                    <textarea
                        className="w-full p-2 border rounded"
                        rows={2}
                        value={recentChanges}
                        onChange={(e) => setRecentChanges(e.target.value)}
                        placeholder="Changes in vitals, medication, etc."
                    />
                </div>
                <div>
                    <label className="block mb-1 font-semibold">Additional Notes</label>
                    <textarea
                        className="w-full p-2 border rounded"
                        rows={2}
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block mb-1 font-semibold">Model</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Get Suggestions
                </button>
            </form>

            <div className="bg-gray-100 p-4 rounded-md min-h-[150px]">
                {streamContent ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamContent}</ReactMarkdown>
                ) : (
                    <p className="text-gray-400">No suggestions yet...</p>
                )}
            </div>
        </div>
        // </Layout>
    );
}
