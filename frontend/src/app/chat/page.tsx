"use client";
import { chat_service, useAppData, User } from "@/src/context/AppContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import ChatSidebar from "../components/ChatSidebar";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import axios from "axios";
import ChatHeader from "../components/ChatHeader";
import ChatMessages from "../components/ChatMessages";
import MessageInput from "../components/MessageInput";
import { SocketData } from "@/src/context/SocketContext";
export interface Message {
  _id: string;
  chatId: string;
  sender: string;
  text?: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}

const ChatApp = () => {
  const {
    loading,
    isAuth,
    logoutUser,
    chats,
    user: loggedInUser,
    users,
    fetchChats,
    setChats,
  } = useAppData();

  const { onlineUsers, socket } = SocketData();
  console.log(onlineUsers);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [pendingWarnings, setPendingWarnings] = useState<
    Record<string, string>
  >({});
  const [message, setMessage] = useState("");
  const [sideBarOpen, setSideBarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAllUser, setShowAllUser] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeOut, setTypingTimeOut] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const router = useRouter();
  useEffect(() => {
    if (selectedUser && pendingWarnings[selectedUser]) {
      toast.error(pendingWarnings[selectedUser]);

      // 🔥 REMOVE AFTER SHOWING
      setPendingWarnings((prev) => {
        const updated = { ...prev };
        delete updated[selectedUser];
        return updated;
      });
    }
  }, [selectedUser, pendingWarnings]);
  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, router, loading]);
  const handleLogout = () => logoutUser();

  async function fetchChat() {
    const token = Cookies.get("token");

    try {
      const { data } = await axios.get(
        `${chat_service}/api/v1/message/${selectedUser}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setMessages(data.messages); // ✅ correct
      setUser(data.user);
      await fetchChats();
    } catch (error) {
      console.log(error);
      toast.error("Failed to load messages");
    }
  }
  const moveChatToTop = (
    chatId: string,
    newMessage: any,
    increaseUnseen = false,
  ) => {
    setChats((prev) => {
      if (!prev) return null;

      const updatedChats = [...prev];

      const currentChatId = typeof chatId === "object" ? chatId._id : chatId;

      const chatIndex = updatedChats.findIndex(
        (chat) => chat.chat._id === currentChatId,
      );

      if (chatIndex !== -1) {
        const [movedChat] = updatedChats.splice(chatIndex, 1);

        const updatedChat = {
          ...movedChat,
          chat: {
            ...movedChat.chat,
            latestMessage: {
              text: newMessage.text,
              sender: newMessage.sender,
            },
            updatedAt: new Date().toISOString(),

            // ✅ FIXED LOGIC
            unseenCount:
              increaseUnseen && selectedUser !== currentChatId
                ? (movedChat.chat.unseenCount || 0) + 1
                : movedChat.chat.unseenCount || 0,
          },
        };

        updatedChats.unshift(updatedChat);
      }

      return updatedChats;
    });
  };

  async function createChat(u: User) {
    try {
      const token = Cookies.get("token");
      const { data } = await axios.post(
        `${chat_service}/api/v1/chat/new`,
        { userId: loggedInUser?._id, otherUserId: u._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setSelectedUser(data.chatId);
      setShowAllUser(false);
      await fetchChats();
    } catch (error) {
      toast.error("Failed to start chat");
    }
  }
  const handleMessageSend = async (e: any, imageFile?: File | null) => {
    e.preventDefault();
    if (!message.trim() && !imageFile) return;
    if (!selectedUser) return;
    //socket work
    if (typingTimeOut) {
      clearTimeout(typingTimeOut);
      setTypingTimeOut(null);
    }
    socket?.emit("stopTyping", {
      chatId: selectedUser,
      userId: loggedInUser?._id,
    });

    const token = Cookies.get("token");
    try {
      const formData = new FormData();

      formData.append("chatId", selectedUser);
      if (message.trim()) {
        formData.append("text", message);
      }
      if (imageFile) {
        formData.append("image", imageFile);
      }
      const { data } = await axios.post(
        `${chat_service}/api/v1/message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setMessages((prev) => {
        const currentMessages = prev || [];
        const messageExists = currentMessages.some(
          (msg) => msg._id === data.message._id,
        );
        if (!messageExists) {
          return [...currentMessages, data.message];
        }
        return currentMessages;
      });
      setMessage("");
      const displayText = imageFile ? "📷 image" : message;
      moveChatToTop(
        selectedUser!,
        {
          text: displayText,
          sender: data.sender,
        },
        false,
      );
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  };
  useEffect(() => {
    if (selectedUser && pendingWarnings[selectedUser]) {
      toast.error(pendingWarnings[selectedUser]);
    }
  }, [selectedUser]);
  const handleTyping = (value: string) => {
    setMessage(value);
    if (!selectedUser || !socket) return;

    //socket setup

    if (value.trim()) {
      socket.emit("typing", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });
    }
    if (typingTimeOut) {
      clearTimeout(typingTimeOut);
    }
    const timeout = setTimeout(() => {
      socket.emit("stopTyping", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });
    }, 2000);

    setTypingTimeOut(timeout);
  };
  useEffect(() => {
    socket?.on("newMessage", (message) => {
      console.log("Received new message:", message);

      const isActiveChat =
        selectedUser &&
        message.chatId &&
        selectedUser === (message.chatId._id || message.chatId);

      if (isActiveChat) {
        setMessages((prev) => {
          const currentMessages = prev || [];
          const exists = currentMessages.some((m) => m._id === message._id);

          if (!exists) {
            return [...currentMessages, message];
          }
          return currentMessages;
        });

        moveChatToTop(message.chatId, message, false);
      } else {
        moveChatToTop(message.chatId, message, true);
      }
    });
    // ✅ ADD THIS BLOCK 👇👇👇
    socket?.on("warningPopup", (data) => {
      if (data.chatId === selectedUser) {
        toast.error(data.text);
      } else {
        setPendingWarnings((prev) => ({
          ...prev,
          [data.chatId]: data.text,
        }));
      }
    });
    socket?.on("updateUnread", ({ chatId, unreadCount }) => {
      console.log("📩 Unread update:", chatId, unreadCount);

      setChats((prev) => {
        if (!prev) return null;

        return prev.map((chat) => {
          if (chat.chat._id === chatId) {
            return {
              ...chat,
              chat: {
                ...chat.chat,
                unseenCount: unreadCount, // ✅ real count from backend
              },
            };
          }
          return chat;
        });
      });
    });
    socket?.on("messageSeen", (data) => {
      console.log("Message seen by :", data);

      // ✅ UPDATE MESSAGE UI
      if (selectedUser === data.chatId) {
        setMessages((prev) => {
          if (!prev) return null;
          return prev.map((msg) => {
            if (
              msg.sender === loggedInUser?._id &&
              data.messageIds?.includes(msg._id)
            ) {
              return {
                ...msg,
                seen: true,
                seenAt: new Date().toString(),
              };
            }
            return msg;
          });
        });
      }

      // ✅ 🔥 ADD THIS (VERY IMPORTANT)
      setChats((prev) => {
        if (!prev) return null;
        return prev.map((chat) =>
          chat.chat._id === data.chatId
            ? { ...chat, chat: { ...chat.chat, unseenCount: 0 } }
            : chat,
        );
      });
    });

    socket?.on("userTyping", (data) => {
      console.log("reveived user typing", data);
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setIsTyping(true);
      }
    });

    socket?.on("userStoppedTyping", (data) => {
      console.log("reveived user stopped typing", data);
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setIsTyping(false);
      }
    });

    return () => {
      socket?.off("newMessage");
      socket?.off("warningPopup");
      socket?.off("updateUnread");
      socket?.off("messageSeen");
      socket?.off("userTyping");
      socket?.off("userStoppedTyping");
    };
  }, [socket, selectedUser, setChats, loggedInUser?._id]);
  useEffect(() => {
    if (selectedUser) {
      fetchChat();

      setIsTyping(false);
      // resetUnseenCount(selectedUser);
      socket?.emit("joinChat", selectedUser);
      socket?.emit("markAsSeen", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });

      return () => {
        socket?.emit("leaveChat", selectedUser);
        setMessages(null);
      };
    }
  }, [selectedUser, socket]);
  useEffect(() => {
    return () => {
      if (typingTimeOut) {
        clearTimeout(typingTimeOut);
      }
    };
  }, [typingTimeOut]);
  if (loading) return <Loading />;
  return (
    <div className="min-h-screen flex bg-gray-900 text-white relative overflow-hidden">
      <ChatSidebar
        sidebarOpen={sideBarOpen}
        setSidebarOpen={setSideBarOpen}
        showAllUsers={showAllUser}
        setShowAllUsers={setShowAllUser}
        users={users}
        loggedInUser={loggedInUser}
        chats={chats}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        handleLogout={handleLogout}
        createChat={createChat}
        onlineUsers={onlineUsers}
      />
      <div className="flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border-1 border-white/10 ">
        <ChatHeader
          user={user}
          setSideBarOpen={setSideBarOpen}
          isTyping={isTyping}
          onlineUsers={onlineUsers}
        />
        <ChatMessages
          selectedUser={selectedUser}
          messages={messages}
          loggedInUser={loggedInUser}
        />
        <MessageInput
          selectedUser={selectedUser}
          message={message}
          setMessage={handleTyping}
          handleMessageSend={handleMessageSend}
        />
      </div>
    </div>
  );
};

export default ChatApp;
