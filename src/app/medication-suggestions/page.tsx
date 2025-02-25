import { useState, FormEvent } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MedicationSuggestionsPage() {
    const [patientId, setPatientId] = useState<string>("");
    const [conditionSummary, setConditionSummary] = useState("");
    const [allergies, setAllergies] = useState("");
    const [contraindications, setContraindications] = useState("");
    const [model, setModel] = useState("QWEN/QWEN1.5-32B-CHAT");
    const [streamContent, setStreamContent] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStreamContent("");

        try {
            await fetchEventSource(
                "http://127.0.0.1:8000/inference/medication-suggestions",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        patient_id: Number(patientId),
                        condition_summary: conditionSummary,
                        allergies,
                        contraindications,
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
                        setStreamContent(
                            (prev) => prev + `\n**Stream error:** ${String(err)}\n`
                        );
                    },
                    openWhenHidden: true,
                }
            );
        } catch (error) {
            console.error("Fetch error:", error);
            setStreamContent(`**Error:** ${String(error)}`);
        }
    };

    return (
        // <Layout>
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Medication Suggestions</h1>
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
                    <label className="block mb-1 font-semibold">Condition Summary</label>
                    <textarea
                        className="w-full p-2 border rounded"
                        rows={2}
                        value={conditionSummary}
                        onChange={(e) => setConditionSummary(e.target.value)}
                        placeholder="Briefly describe the condition"
                    />
                </div>
                <div>
                    <label className="block mb-1 font-semibold">Allergies</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        placeholder="e.g., penicillin, peanuts, etc."
                    />
                </div>
                <div>
                    <label className="block mb-1 font-semibold">Contraindications</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={contraindications}
                        onChange={(e) => setContraindications(e.target.value)}
                        placeholder="e.g., severe liver disease"
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
                    className="bg-teal-600 text-white px-4 py-2 rounded"
                >
                    Suggest Medications
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
