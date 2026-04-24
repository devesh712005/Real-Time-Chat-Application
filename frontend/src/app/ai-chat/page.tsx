"use client";

import { useEffect, useRef, useState } from "react";

export default function AIChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: newMessages }),
      });

      const text = await res.text();

      setMessages((prev) => [...prev, { role: "assistant", content: text }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Error getting response" },
      ]);
    }
  };

  // auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 text-lg font-semibold">
        🤖 AI Chatbot
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[70%] px-4 py-2 rounded-lg ${
              msg.role === "user" ? "bg-blue-600 ml-auto" : "bg-gray-700"
            }`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="p-4 border-t border-gray-700 flex gap-2">
        <input
          className="flex-1 p-2 rounded bg-gray-800 outline-none"
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault(); // stop newline
              sendMessage();
            }
          }}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 px-4 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
