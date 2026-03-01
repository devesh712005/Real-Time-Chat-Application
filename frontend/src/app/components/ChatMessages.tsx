import React, { useEffect, useMemo, useRef } from "react";
import { Message } from "../chat/page";
import { User } from "@/src/context/AppContext";
import moment from "moment";
import { Check, CheckCheck } from "lucide-react";
interface ChatMessagesProps {
  selectedUser: string | null;
  messages: Message[] | null;
  loggedInUser: User | null;
}
const ChatMessages = ({
  selectedUser,
  messages,
  loggedInUser,
}: ChatMessagesProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  //seen feature
  const uniqueMessages = useMemo(() => {
    if (!messages) return [];
    const seen = new Set();
    return messages.filter((message) => {
      if (seen.has(message._id)) {
        return false;
      }
      seen.add(message._id);
      return true;
    });
  }, [messages]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser, uniqueMessages]);
  return (
    <div className="flex-1 overflow-hidden ">
      <div className="h-full max-h-[calc(100vh-215px)] overflow-y-auto p-2 space-y-2 custom-scroll">
        {!selectedUser ? (
          <p className="text-gray-400 text-center mt-20">
            Please select a user to start a chatting 📩
          </p>
        ) : (
          <>
            {uniqueMessages.map((e, i) => {
              const isSentByMe = e.sender === loggedInUser?._id;

              return (
                <div
                  key={e._id}
                  className={`flex flex-col gap-1 mt-2 ${
                    isSentByMe ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 max-w-sm ${
                      isSentByMe
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    {e.messageType === "image" && e.image && (
                      <img
                        src={e.image.url}
                        alt="shared image"
                        className="max-w-full h-auto rounded-lg"
                      />
                    )}
                    {e.text && <p className="mt-1">{e.text}</p>}
                  </div>

                  <div className="text-xs text-gray-400">
                    {moment(e.createdAt).format("hh:mm A · MMM D")}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;
