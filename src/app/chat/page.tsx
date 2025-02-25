"use client"
import { useState, useRef, useEffect, FormEvent } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface Message {
    role: "user" | "assistant";
    content: string;
    image?: string; // URL for preview if the user sent an image
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const assistantMessageContentRef = useRef(""); // Ref to store assistant content

    // Developer defined custom prompt; this is only used when sending the very first message
    const developerInitialPrompt = "You are a diagnosis expert";

    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e: FormEvent) => {
        e.preventDefault();
        if (!inputText && !selectedFile) return;

        let imagePreviewUrl: string | undefined = undefined;
        if (selectedFile) {
            imagePreviewUrl = URL.createObjectURL(selectedFile);
        }

        const userMessage: Message = {
            role: "user",
            content: inputText,
            image: imagePreviewUrl,
        };
        // Show only the user message in the UI.
        setMessages((prev) => [...prev, userMessage]);
        setInputText("");
        setIsLoading(true);

        const formData = new FormData();
        // Check if this is the first message in the conversation.
        // If so, prepend the developer's custom prompt to the instruction.
        let instruction = userMessage.content;
        if (messages.length === 0 && developerInitialPrompt) {
            instruction = `${developerInitialPrompt} ${instruction}`;
        }
        formData.append("instruction", instruction);
        formData.append("model", "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo");
        if (selectedFile) {
            formData.append("file", selectedFile);
        }

        // Reset assistant message content for each new request.
        assistantMessageContentRef.current = "";

        // Placeholder: Add the assistant message *immediately*
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        try {
            await fetchEventSource("http://127.0.0.1:8000/inference/unified-chat", {
                method: "POST",
                body: formData,
                onmessage: (event) => {
                    assistantMessageContentRef.current += event.data;
                    // Update the *last* message in the array.
                    setMessages((prevMessages) => {
                        const updatedMessages = [...prevMessages];
                        updatedMessages[updatedMessages.length - 1] = {
                            role: "assistant",
                            content: assistantMessageContentRef.current,
                        };
                        return updatedMessages;
                    });
                },
                onerror: (err) => {
                    console.error("Stream error:", err);
                    setIsLoading(false);
                },
                openWhenHidden: true,
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
        setIsLoading(false);
        setSelectedFile(null);
    };

    return (
        <div className="flex flex-col h-screen max-h-screen">
            {/* Chat messages container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-md p-4 rounded-lg shadow ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"
                                }`}
                        >
                            {msg.image && (
                                <img
                                    src={msg.image}
                                    alt="User provided"
                                    className="mb-2 max-h-64 object-contain rounded"
                                />
                            )}
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                {msg.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Chat input area */}
            <form
                onSubmit={handleSend}
                className="p-4 border-t border-gray-300 flex flex-col items-start space-y-2"
            >
                <div className="flex items-center space-x-2 w-full">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 p-2 border rounded"
                    />
                    {/* Image upload button */}
                    <label htmlFor="fileInput" className="cursor-pointer">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6 text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 7a1 1 0 011-1h3.28a1 1 0 01.95.68l.6 1.78a1 1 0 00.95.68H17a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V7z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    </label>

                    <input
                        id="fileInput"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                setSelectedFile(e.target.files[0]);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                        {isLoading ? "Sending..." : "Send"}
                    </button>
                </div>
                {/* Preview for selected image */}
                {selectedFile && (
                    <div className="flex items-center space-x-2">
                        <img
                            src={URL.createObjectURL(selectedFile)}
                            alt="Preview"
                            className="max-h-24 object-contain rounded"
                        />
                        <span className="text-sm text-gray-700">{selectedFile.name}</span>
                    </div>
                )}
            </form>
        </div>
    );
}
