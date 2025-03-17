"use client";
import React, { useState, useEffect, useRef, FormEvent } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface ConversationListItem {
    id: string;
    name: string;
    created_at: string;
}

interface Message {
    role: "system" | "user" | "assistant";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any;
}

export default function ChatWithSidebar() {
    const [conversations, setConversations] = useState<ConversationListItem[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    const [inputText, setInputText] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch the list of conversations for the sidebar
    const fetchConversations = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/inference/conversations");
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (err) {
            console.error("Error fetching conversations:", err);
        }
    };

    // When user clicks on a conversation in the sidebar:
    const handleSelectConversation = async (conversationId: string) => {
        setActiveConversationId(conversationId);
        // fetch all messages for that conversation
        try {
            const res = await fetch(
                `http://127.0.0.1:8000/inference/conversations/${conversationId}`
            );
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            } else {
                console.error("Failed to retrieve conversation.");
            }
        } catch (err) {
            console.error("Error retrieving conversation:", err);
        }
    };

    // On first render, load the conversation list
    useEffect(() => {
        fetchConversations();
    }, []);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Render each message's content. 
    // For user messages that might contain a multi-modal array, we show them carefully.
    const renderMessageContent = (msg: Message) => {
        // If the message content is an array, render each part:
        if (Array.isArray(msg.content)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return msg.content.map((part: any, index: number) => {
                if (part.type === "text") {
                    return (
                        <ReactMarkdown
                            className="markdown prose prose-lg max-w-none"
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                            key={index}
                        >
                            {part.text}
                        </ReactMarkdown>
                    );
                } else if (part.type === "image_url") {
                    return (
                        <div key={index} className="my-2">
                            <img
                                src={part.image_url.url}
                                alt="User provided"
                                className="max-h-64 object-contain rounded"
                            />
                        </div>
                    );
                }
                return null;
            });
        }
        // If it's a plain string, render it as markdown.
        else if (typeof msg.content === "string") {
            return (
                <ReactMarkdown
                    className="markdown prose prose-lg max-w-none"
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                >
                    {msg.content}
                </ReactMarkdown>
            );
        }
        // If it's an object (not an array), check for a type field.
        else if (typeof msg.content === "object" && msg.content !== null) {
            if (msg.content.type === "text") {
                return (
                    <ReactMarkdown
                        className="markdown prose prose-lg max-w-none"
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                    >
                        {msg.content.text}
                    </ReactMarkdown>
                );
            } else if (msg.content.type === "image_url") {
                return (
                    <div className="my-2">
                        <img
                            src={msg.content.image_url.url}
                            alt="User provided"
                            className="max-h-64 object-contain rounded"
                        />
                    </div>
                );
            }
        }
        return null;
    };


    // Submit new message
    const handleSend = async (e: FormEvent) => {
        e.preventDefault();
        if (!inputText && !selectedFile) return;

        // We'll store a local version of user message for immediate display
        // but the actual conversation is stored on the server.
        // If no activeConversationId, we pass "new" to create a new conversation
        const convId = activeConversationId || "new";

        // We add a local "user" message first
        const localUserMsg: Message = {
            role: "user",
            content: [{ type: "text", text: inputText }],
        };

        // If there's an image, we add a local preview in the UI
        if (selectedFile) {
            const imagePreviewUrl = URL.createObjectURL(selectedFile);
            localUserMsg.content.push({
                type: "image_url",
                image_url: { url: imagePreviewUrl },
            });
        }

        setMessages((prev) => [...prev, localUserMsg]);
        setInputText("");
        setIsLoading(true);

        // Prepare the form data
        const formData = new FormData();
        formData.append("instruction", inputText);
        formData.append("model", "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo");
        formData.append("conversation_id", convId);
        formData.append("patient_id", "24");



        // Only append a system_prompt if we have no active conversation
        // and we want a custom prompt. Otherwise, the backend uses the default.
        // Example usage:
        // formData.append("system_prompt", "You are a comedic assistant.") 
        // or skip if you don't want to override.

        if (selectedFile) {
            formData.append("file", selectedFile);
        }

        // Add a placeholder assistant message while streaming
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        let assistantBuffer = "";

        try {
            await fetchEventSource("http://127.0.0.1:8000/inference/unified-chat", {
                method: "POST",
                body: formData,
                onmessage: (event) => {
                    // Each SSE chunk is appended to the last assistant message
                    assistantBuffer += event.data;
                    setMessages((prev) => {
                        const updated = [...prev];
                        // The last message in the list should be the assistant placeholder
                        updated[updated.length - 1] = {
                            role: "assistant",
                            content: assistantBuffer,
                        };
                        return updated;
                    });
                },
                onerror: (err) => {
                    console.error("Stream error:", err);
                    setIsLoading(false);
                },
                openWhenHidden: true,
            });
        } catch (err) {
            console.error("Error sending message:", err);
        } finally {
            setIsLoading(false);
            setSelectedFile(null);
        }

        // If we created a new conversation, we must get the actual ID from the server.
        // Our backend returns the streamed response, but not the conversation_id in SSE.
        // So we do a quick re-fetch of the conversation list, then see if there's a new conversation 
        // that wasn't in the old list. For a production environment, you might want the server 
        // to respond with a JSON containing the new conversation_id. 
        if (convId === "new") {
            // Re-fetch conversation list and find the new conversation
            await fetchConversations();
            // We can guess the new conversation is the most recently created (by created_at),
            // or you can store the prior list length and find the difference, etc.
            // For simplicity, let's pick the conversation with the newest "created_at".
            let newest = null;
            for (const c of conversations) {
                if (!newest || c.created_at < c.created_at) {
                    newest = c;
                }
            }
            // But we need the updated list. So let's do a fresh read:
            const res = await fetch("http://127.0.0.1:8000/inference/conversations");
            if (res.ok) {
                const updatedData: ConversationListItem[] = await res.json();
                if (updatedData.length > 0) {
                    const sorted = updatedData.sort(
                        (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
                    );
                    const newestConvo = sorted[0];
                    setActiveConversationId(newestConvo.id);
                }
                setConversations(updatedData);
            }
        }
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-300 flex-shrink-0 flex flex-col">
                <div className="p-4 bg-gray-100 font-bold">Conversations</div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map((c) => (
                        <div
                            key={c.id}
                            className={`p-2 cursor-pointer ${c.id === activeConversationId ? "bg-gray-200" : ""
                                }`}
                            onClick={() => handleSelectConversation(c.id)}
                        >
                            <div className="font-semibold">{c.name || "New AI Chat"}</div>
                            <div className="text-sm text-gray-500">{c.created_at}</div>
                        </div>
                    ))}
                </div>
                <button
                    className="m-4 p-2 bg-blue-500 text-white rounded"
                    onClick={() => {
                        // Force a "new" conversation on next message
                        setActiveConversationId(null);
                        setMessages([]);
                    }}
                >
                    Start New Chat
                </button>
            </div>

            {/* Main chat area */}
            <div className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                                }`}
                        >
                            <div
                                className={`max-w-md p-4 rounded-lg shadow ${msg.role === "user"
                                    ? "bg-blue-500 text-white"
                                    : msg.role === "assistant"
                                        ? "bg-gray-200 text-gray-900"
                                        : "bg-yellow-100 text-gray-800"
                                    }`}
                            >
                                {renderMessageContent(msg)}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
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
                        {/* Image upload */}
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
        </div>
    );
}
