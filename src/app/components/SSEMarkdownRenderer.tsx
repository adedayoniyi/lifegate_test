import { FC, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SSEMarkdownRendererProps {
    endpoint: string;       // The SSE endpoint to POST to
    requestOptions: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> };  // Additional options (body, headers, etc.)
}

const SSEMarkdownRenderer: FC<SSEMarkdownRendererProps> = ({
    endpoint,
    requestOptions,
}) => {
    const [streamContent, setStreamContent] = useState<string>("");

    const startStreaming = async () => {
        setStreamContent(""); // reset

        await fetchEventSource(endpoint, {
            ...requestOptions,
            onmessage: (event) => {
                // SSE data
                if (event.data.startsWith("Error:")) {
                    // if the chunk is an error
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
    };

    return (
        <div>
            <button
                onClick={startStreaming}
                className="bg-blue-600 text-white px-4 py-2 rounded"
            >
                Start Streaming
            </button>

            <div className="mt-4 p-3 bg-gray-100 rounded-md">
                {streamContent ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamContent}</ReactMarkdown>
                ) : (
                    <p className="text-gray-400">No content yet...</p>
                )}
            </div>
        </div>
    );
};

export default SSEMarkdownRenderer;
