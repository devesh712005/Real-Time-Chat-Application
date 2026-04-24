import axios from "axios";
import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Chat } from "../models/Chat.js";
import { Messages } from "../models/Messages.js";
import { getReceiverSocketId, io } from "../config/socket.js";
import { analyzeMessage } from "../services/moderationClient.js";
// export con
export const createNewChat = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      res.status(400).json({
        message: "Other user id is required",
      });
      return;
    }

    const existingChat = await Chat.findOne({
      users: { $all: [userId, otherUserId], $size: 2 },
    });
    if (existingChat) {
      res.json({
        message: "Chat already exist",
        chatId: existingChat._id,
      });
    }

    const newChat = await Chat.create({
      users: [userId, otherUserId],
    });
    res.status(201).json({
      message: "New Chat Created",
      chatId: newChat._id,
    });
  },
);

export const getAllChats = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;
  if (!userId) {
    res.status(400).json({
      message: "UserId missing",
    });
    return;
  }

  const chats = await Chat.find({ users: userId }).sort({ updatedAt: -1 });

  const chatWithUserData = await Promise.all(
    chats.map(async (chat) => {
      const otherUserId = chat.users.find((id) => id !== userId);
      const unseenCount = await Messages.countDocuments({
        chatId: chat._id,
        sender: { $ne: userId },
        seen: false,
      });

      try {
        const { data } = await axios.get(
          `${process.env.USER_SERVICE}/api/user/user/${otherUserId}`,
        );
        return {
          user: data,
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unseenCount,
          },
        };
      } catch (error) {
        console.log(error);
        return {
          user: { _id: otherUserId, name: "Unknown User" },
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unseenCount,
          },
        };
      }
    }),
  );

  res.json({
    chats: chatWithUserData,
  });
});
export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
  const senderId = req.user?._id;
  const { chatId, text } = req.body;
  const imageFile = req.file;

  if (!senderId) return res.status(401).json({ message: "Unauthorized" });
  if (!chatId) return res.status(400).json({ message: "ChatId required" });
  if (!text && !imageFile)
    return res.status(400).json({ message: "Text or image required" });

  // 🔍 MODERATION
  let warning: string | null = null;

  if (text) {
    const result = await analyzeMessage(text);

    if (result.action === "BLOCK") {
      return res.status(400).json({ message: result.message });
    }

    if (result.action === "ALLOW_WITH_WARNING") {
      warning = result.message;
    }
  }

  // 💬 CHAT VALIDATION
  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: "Chat not found" });

  const otherUserId = chat.users.find(
    (u) => u.toString() !== senderId.toString(),
  );
  if (!otherUserId) {
    return res.status(400).json({ message: "Other user not found" });
  }
  const receiverSocketId = getReceiverSocketId(otherUserId.toString());
  console.log("Receiver...", receiverSocketId);

  // 🧾 CREATE MESSAGE
  const messageData: any = {
    chatId,
    sender: senderId,
    seen: false,
    text: text || "",
    messageType: imageFile ? "image" : "text",
  };

  if (imageFile) {
    messageData.image = {
      url: imageFile.path,
      publicId: imageFile.filename,
    };
  }

  const savedMessage = await Messages.create(messageData);

  // 🔄 UPDATE CHAT
  await Chat.findByIdAndUpdate(chatId, {
    latestMessage: {
      text: imageFile ? "📷 Image" : text,
      sender: senderId,
    },
    updatedAt: new Date(),
  });

  // ⚠️ WARNING POPUP
  if (warning && receiverSocketId) {
    io.to(receiverSocketId).emit("warningPopup", {
      text: warning,
      chatId,
    });
  }

  // 📩 SEND MESSAGE
  io.to(chatId).emit("newMessage", savedMessage);

  // 🔥 UNREAD COUNT (ONLY BACKEND CONTROLS THIS)
  if (receiverSocketId) {
    const unreadCount = await Messages.countDocuments({
      chatId,
      sender: otherUserId,
      seen: false,
    });

    io.to(receiverSocketId).emit("updateUnread", {
      chatId,
      unreadCount,
    });
  }

  res.status(201).json({
    message: savedMessage,
    sender: senderId,
  });
});

export const getMessagesByChat = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { chatId } = req.params;
    if (!chatId) {
      res.status(400).json({
        message: "ChatId Required",
      });
      return;
    }
    if (!userId) {
      res.status(401).json({
        message: "unauthorized",
      });
      return;
    }
    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404).json({
        message: "Chat not found",
      });
      return;
    }
    const isUserInChat = chat.users.some(
      (u) => u.toString() === userId.toString(),
    );
    if (!isUserInChat) {
      res.status(403).json({
        message: "You are not a participant of this chat",
      });
      return;
    }

    const messagesToMarkSeen = await Messages.find({
      chatId: chatId,
      sender: { $ne: userId },
      seen: false,
    });
    await Messages.updateMany(
      {
        chatId: chatId,
        sender: { $ne: userId },
        seen: false,
      },
      {
        seen: true,
        seenAt: new Date(),
      },
    );

    const messages = await Messages.find({ chatId }).sort({ createdAt: 1 });
    const otherUserId = chat.users.find((id) => id !== userId);
    try {
      const { data } = await axios.get(
        `${process.env.USER_SERVICE}/api/user/user/${otherUserId}`,
      );
      if (!otherUserId) {
        res.status(400).json({
          message: "No other user",
        });
        return;
      }
      //socket work
      if (messagesToMarkSeen.length > 0) {
        const otherUserSocketId = getReceiverSocketId(otherUserId.toString());
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit("messageSeen", {
            chatId: chatId,
            seenBy: userId,
            messageIds: messagesToMarkSeen.map((msg) => msg._id),
            unreadCount: 0,
          });
        }
      }
      res.json({
        messages,
        user: data,
      });
    } catch (error) {
      console.log(error);
      res.json({
        messages,
        user: { _id: otherUserId, name: "Unknown user" },
      });
    }
  },
);
