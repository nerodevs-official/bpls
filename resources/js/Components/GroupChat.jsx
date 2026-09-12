// resources/js/Components/GroupChat.jsx
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  signInWithCustomToken,
  onAuthStateChanged,
  getIdTokenResult,
} from "firebase/auth";
import {
  ref,
  push,
  onValue,
  off,
  serverTimestamp,
  query,
  limitToLast,
} from "firebase/database";

import { auth, database } from "../lib/firebase";
import { LucideX, MessageCircleMore } from "lucide-react";

const getTimeAgo = (timestamp) => {
  if (!timestamp) return "";
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return `${Math.floor(diff / 86400)}d ago`;
};

const roleColors = {
  Admin: "bg-red-500 text-white",
  Reviewer: "bg-green-500 text-white",
  Messenger: "bg-blue-500 text-white",
  Drafter: "bg-purple-500 text-white",
  User: "bg-gray-300 text-gray-800",
};

export default function GroupChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const [lastReadAt, setLastReadAt] = useState(() => {
    const saved = localStorage.getItem("groupChatLastReadAt");
    return saved ? parseInt(saved, 10) : Date.now();
  });

  const messagesRef = useRef(
    query(ref(database, "group_chat/messages"), limitToLast(100)),
  );

  useEffect(() => {
    if (isOpen) {
      const now = Date.now();
      setLastReadAt(now);
      localStorage.setItem("groupChatLastReadAt", now.toString());
    }
  }, [isOpen]);

  const unreadCount = useMemo(() => {
    if (!messages.length || !lastReadAt) return 0;
    return messages.filter(
      (msg) => typeof msg.createdAt === "number" && msg.createdAt > lastReadAt,
    ).length;
  }, [messages, lastReadAt]);

  const getUserFromClaims = useCallback(async (user) => {
    if (!user) return null;
    try {
      const idTokenResult = await getIdTokenResult(user, true);
      const { name = "User", role = "User" } = idTokenResult.claims;
      return { uid: user.uid, name, role };
    } catch (error) {
      console.error("Failed to get token claims:", error);
      return { uid: user.uid, name: "User", role: "User" };
    }
  }, []);

  useEffect(() => {
    let authUnsub = null;
    let dbUnsub = null;

    const initializeChat = async () => {
      if (!isOpen) return;
      setIsLoading(true);

      try {
        if (!auth.currentUser) {
          const res = await fetch("/firebase-token");
          if (!res.ok) throw new Error("Failed to fetch Firebase token");
          const { token } = await res.json();
          const cred = await signInWithCustomToken(auth, token);
          const user = await getUserFromClaims(cred.user);
          setCurrentUser(user);
        } else {
          const user = await getUserFromClaims(auth.currentUser);
          setCurrentUser(user);
        }

        authUnsub = onAuthStateChanged(auth, async (user) => {
          if (user) {
            const userInfo = await getUserFromClaims(user);
            setCurrentUser(userInfo);
          } else {
            setCurrentUser(null);
          }
        });

        dbUnsub = onValue(messagesRef.current, (snapshot) => {
          if (snapshot.exists()) {
            const list = Object.entries(snapshot.val()).map(([id, msg]) => ({
              id,
              ...msg,
            }));
            setMessages(list);
          } else {
            setMessages([]);
          }
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Chat initialization error:", error);
        setIsLoading(false);
      }
    };

    initializeChat();

    return () => {
      if (authUnsub) authUnsub();
      if (dbUnsub) dbUnsub();
    };
  }, [isOpen, getUserFromClaims]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!newMessage.trim() || !currentUser) return;

      push(ref(database, "group_chat/messages"), {
        uid: currentUser.uid,
        name: currentUser.name,
        role: currentUser.role,
        text: newMessage.trim(),
        createdAt: Date.now(),
      });

      setNewMessage("");
    },
    [newMessage, currentUser],
  );

  const renderMessages = () =>
    messages.map((msg) => {
      const isOwn = currentUser && msg.uid === currentUser.uid;
      const avatarInitial = msg.name?.[0]?.toUpperCase() || "?";
      return (
        <div
          key={msg.id}
          className={`flex mb-3 items-end ${
            isOwn ? "justify-end" : "justify-start"
          }`}>
          {!isOwn && (
            <div className="w-8 h-8 flex-shrink-0 bg-gray-300 text-gray-700 font-bold rounded-full flex items-center justify-center mr-2">
              {avatarInitial}
            </div>
          )}

          <div
            className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
              isOwn
                ? "bg-blue-500 text-white rounded-br-none"
                : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
            }`}>
            <div className="flex items-center justify-between mb-1">
              {/* Name and Role */}
              <div className="flex items-center gap-2">
                <span
                  className={`font-semibold text-xs ${
                    isOwn ? "text-blue-100" : "text-blue-700"
                  }`}>
                  {msg.name}
                </span>

                {/* ✅ Role badge */}
                {msg.role && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      roleColors[msg.role] || "bg-gray-200 text-gray-700"
                    }`}>
                    {msg.role}
                  </span>
                )}
              </div>

              <span className="text-[10px] opacity-70 ml-2">
                {getTimeAgo(msg.createdAt)}
              </span>
            </div>

            <div className="text-sm break-words">{msg.text}</div>
          </div>

          {isOwn && (
            <div className="w-8 h-8 flex-shrink-0 bg-blue-400 text-white font-bold rounded-full flex items-center justify-center ml-2">
              {avatarInitial}
            </div>
          )}
        </div>
      );
    });

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-full">
      <div
        className={`bg-white/90 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
          isOpen ? "h-[520px] w-[370px]" : "h-auto w-[64px]"
        }`}>
        {/* Header */}
        <div
          className={`bg-gradient-to-r from-yellow-500 to-amber-400 text-white font-semibold flex justify-between items-center px-4 py-3 cursor-pointer select-none ${
            !isOpen ? "hover:opacity-95 active:opacity-90" : ""
          }`}
          onClick={() => {
            if (!isOpen) setIsOpen(true);
          }}>
          {isOpen ? (
            <>
              <span className="flex items-center gap-2 text-sm font-medium">
                💬 Internal Chat
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // prevent closing from reopening accidentally
                  setIsOpen(false);
                }}
                className="text-white hover:text-gray-200 text-lg font-bold"
                aria-label="Close chat">
                <LucideX size={18} strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <div className="w-full flex justify-center items-center text-3xl relative">
              <MessageCircleMore />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Chat Body */}
        {isOpen && (
          <>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 scroll-smooth">
              {isLoading ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  Loading chat. . .
                </p>
              ) : !currentUser ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  Authentication failed. Please reload.
                </p>
              ) : messages.length === 0 ? (
                <p className="text-gray-500 italic text-sm text-center py-6">
                  No messages yet...
                </p>
              ) : (
                renderMessages()
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-3 border-t bg-white flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2.5 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                disabled={isLoading || !currentUser}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-500 text-white rounded-full px-3 py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-40">
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
