import { useState, FormEvent } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ImagingInterpretationPage() {
    const [patientId, setPatientId] = useState<string>("");
    const [imageDescription, setImageDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [model, setModel] = useState("QWEN/QWEN1.5-32B-CHAT");
    const [streamContent, setStreamContent] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStreamContent("");

        const formData = new FormData();
        formData.append("patient_id", patientId);
        formData.append("image_description", imageDescription);
        formData.append("model", model);
        if (file) {
            formData.append("file", file);
        }

        try {
            await fetchEventSource(
                "http://127.0.0.1:8000/inference/imaging-interpretation",
                {
                    method: "POST",
                    body: formData,
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
            <h1 className="text-2xl font-bold mb-4">Imaging Interpretation</h1>
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
                    <label className="block mb-1 font-semibold">Image Description</label>
                    <textarea
                        className="w-full p-2 border rounded"
                        rows={2}
                        value={imageDescription}
                        onChange={(e) => setImageDescription(e.target.value)}
                        placeholder="Briefly describe what the image shows or any important context"
                    />
                </div>
                <div>
                    <label className="block mb-1 font-semibold">Upload Image</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
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
                    className="bg-purple-600 text-white px-4 py-2 rounded"
                >
                    Analyze Image
                </button>
            </form>

            <div className="bg-gray-100 p-4 rounded-md min-h-[150px]">
                {streamContent ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamContent}</ReactMarkdown>
                ) : (
                    <p className="text-gray-400">No interpretation yet...</p>
                )}
            </div>
        </div>
        // </Layout>
    );
}
