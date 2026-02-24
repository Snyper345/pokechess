import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ChatMessage {
    sender: string;
    text: string;
    isSystem?: boolean;
}

interface ChatProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    className?: string;
}

export function Chat({ messages, onSendMessage, className }: ChatProps) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input.trim());
            setInput("");
        }
    };

    return (
        <div className={cn("flex flex-col bg-neutral-900/80 backdrop-blur-md rounded-xl border border-neutral-700/50 overflow-hidden", className)}>
            <div className="bg-neutral-800/80 p-3 border-b border-neutral-700/50">
                <h3 className="text-white font-bold text-sm tracking-widest text-center uppercase">Room Chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[300px]">
                {messages.length === 0 && (
                    <div className="text-neutral-500 text-sm text-center mt-8 italic">No messages yet.</div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={cn("text-sm", msg.isSystem ? "text-emerald-400 italic text-center" : "text-neutral-300")}>
                        {!msg.isSystem && (
                            <span className={cn("font-bold mr-2", msg.sender === 'System' ? 'text-red-400' : 'text-yellow-400')}>
                                {msg.sender}:</span>
                        )}
                        {msg.text}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-neutral-700/50 bg-neutral-900/50 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-neutral-800 text-white text-sm px-3 py-2 rounded-lg border border-neutral-700 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
