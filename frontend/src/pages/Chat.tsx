import { useEffect, useRef, useState, type ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import Icon from "../components/Icon";
import useGetMe from "../hooks/useGetMe";
import useAuthStore from "../hooks/useAuthStore";
import { useNavigate } from "react-router";
import ROUTES from "../constants/routes";
import { fetchChatRooms, loadChat, sendChatMessage } from "../helpers/chat";
import type { ChatRoom } from "../types/chat";

interface Message {
  id: string | number;
  role: "user" | "ai";
  content: string;
}

const SUGGESTIONS = [
  { title: "Literature Review", subtitle: "Recent advances in CRISPR-Cas9" },
  { title: "Study Guide", subtitle: "Macroeconomics: Fiscal Policy" },
  {
    title: "Quantum Physics",
    subtitle: "Wave-particle duality and double-slit",
  },
  {
    title: "Market Economics",
    subtitle: "Order types, bid-ask spread and liquidity",
  },
];

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

// Markdown component styling for rendered HTML
const markdownComponents = {
  h1: ({ children, ...props }: ComponentProps<"h1">) => (
    <h1
      className="font-headline-lg text-headline-lg font-bold text-on-surface mt-5 mb-3 pb-1 border-b border-outline-variant/20"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: ComponentProps<"h2">) => (
    <h2
      className="font-headline-md text-headline-md font-bold text-on-surface mt-4 mb-2 pb-1 border-b border-outline-variant/15"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentProps<"h3">) => (
    <h3
      className="font-headline-sm text-base font-semibold text-on-surface mt-3 mb-1.5"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: ComponentProps<"h4">) => (
    <h4 className="font-semibold text-sm text-on-surface mt-2 mb-1" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }: ComponentProps<"p">) => (
    <p className="mb-3 leading-relaxed text-on-surface text-body-md" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: ComponentProps<"ul">) => (
    <ul
      className="list-disc list-outside ml-5 mb-3 space-y-1.5 text-on-surface"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: ComponentProps<"ol">) => (
    <ol
      className="list-decimal list-outside ml-5 mb-3 space-y-1.5 text-on-surface"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }: ComponentProps<"li">) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: ComponentProps<"blockquote">) => (
    <blockquote
      className="border-l-4 border-primary/70 bg-surface-container-low px-4 py-2 my-3 rounded-r-xl italic text-on-surface-variant"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, className, ...props }: ComponentProps<"code">) => {
    const isBlock = Boolean(className);
    return isBlock ? (
      <code
        className={`block bg-surface-container-highest text-on-surface font-mono text-xs p-3 rounded-xl overflow-x-auto my-2 border border-outline-variant/20 ${className || ""}`}
        {...props}
      >
        {children}
      </code>
    ) : (
      <code
        className="bg-surface-container-highest text-primary font-mono text-xs px-1.5 py-0.5 rounded font-semibold"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }: ComponentProps<"pre">) => (
    <pre className="my-2 overflow-x-auto rounded-xl" {...props}>
      {children}
    </pre>
  ),
  a: ({ children, href, ...props }: ComponentProps<"a">) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline font-medium break-all"
      {...props}
    >
      {children}
    </a>
  ),
  table: ({ children, ...props }: ComponentProps<"table">) => (
    <div className="overflow-x-auto my-3">
      <table
        className="min-w-full border-collapse border border-outline-variant/20 text-sm"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: ComponentProps<"th">) => (
    <th
      className="border border-outline-variant/20 bg-surface-container px-3 py-2 text-left font-semibold text-on-surface"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: ComponentProps<"td">) => (
    <td
      className="border border-outline-variant/20 px-3 py-2 text-on-surface"
      {...props}
    >
      {children}
    </td>
  ),
  hr: (props: ComponentProps<"hr">) => (
    <hr className="my-4 border-outline-variant/20" {...props} />
  ),
};

function Chat() {
  const [activeNav, setActiveNav] = useState("new-chat");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoaded = useAuthStore((state) => state.isLoaded);

  useGetMe();

  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      navigate(ROUTES.SIGNIN);
    }
    if (isLoaded && isAuthenticated) {
      (() => setLoading(false))();
      refreshChatRooms();
    }
  }, [isAuthenticated, navigate, isLoaded]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  async function refreshChatRooms() {
    try {
      setLoadingRooms(true);
      const rooms = await fetchChatRooms();
      setChatRooms(rooms);
    } catch (err) {
      console.error("Error fetching chat rooms:", err);
    } finally {
      setLoadingRooms(false);
    }
  }

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "";
    el.style.height = `${el.scrollHeight}px`;
  }

  function resetTextarea() {
    const el = textareaRef.current;
    if (el) el.style.height = "";
  }

  function handleNewChat() {
    setActiveNav("new-chat");
    setCurrentThreadId(null);
    setMessages([]);
    setSidebarOpen(false);
  }

  async function handleSelectRoom(threadId: string) {
    if (currentThreadId === threadId) {
      setSidebarOpen(false);
      return;
    }

    setActiveNav(threadId);
    setCurrentThreadId(threadId);
    setSidebarOpen(false);
    setLoadingChat(true);

    try {
      const data = await loadChat(threadId);
      const loadedMessages: Message[] = data.chats.map((c) => ({
        id: c.chats_id || c.id,
        role: c.type === "human" ? "user" : "ai",
        content: c.content,
      }));
      setMessages(loadedMessages);
    } catch (err) {
      console.error("Error loading chat:", err);
      setMessages([
        {
          id: `err-${Date.now()}`,
          role: "ai",
          content: "Failed to load chat history. Please try again.",
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    const userMsgId = `user-${Date.now()}`;
    setMessages((m) => [
      ...m,
      { id: userMsgId, role: "user", content: trimmed },
    ]);
    setInput("");
    resetTextarea();
    setTyping(true);

    try {
      const res = await sendChatMessage(trimmed, currentThreadId);

      if (!currentThreadId && res.thread) {
        setCurrentThreadId(res.thread);
        setActiveNav(res.thread);
      }

      setMessages((m) => [
        ...m,
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: res.message,
        },
      ]);

      refreshChatRooms();
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((m) => [
        ...m,
        {
          id: `err-${Date.now()}`,
          role: "ai",
          content:
            "An error occurred while connecting to the Academic Engine. Please try again.",
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  async function copyGuide(markdownContent: string, messageId: string | number) {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy guide:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-10 h-10 animate-spin rounded-full border-2 border-surface-variant border-t-transparent" />
      </div>
    );
  }

  const displayName = user.name || user.username || "Dr. Scholarly";
  const displayRole = user.email || "Academic Account";
  const userInitial = (user.name || user.username || "U")[0].toUpperCase();

  return (
    <div className="bg-surface font-body-md text-on-surface">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-surface-container-high z-50 flex flex-col shadow-xl transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-md flex items-center gap-base border-b border-on-primary/10">
          <div className="w-8 h-8 rounded-full bg-on-background flex items-center justify-center">
            <Icon
              name="school"
              size="18px"
              filled
              className="text-on-secondary-fixed-variant"
            />
          </div>
          <span className="font-headline-md text-on-background tracking-tight">
            &nbsp;Study Guide
          </span>
        </div>

        <div className="p-sm">
          <button
            className={`flex items-center w-full px-md py-sm rounded-xl transition-all shadow-sm ${
              activeNav === "new-chat"
                ? "bg-primary text-on-primary font-bold shadow-md"
                : "bg-surface-container hover:bg-surface-container-highest text-on-surface font-semibold"
            }`}
            onClick={handleNewChat}
          >
            <Icon name="add_circle" className="mr-sm" filled />
            New Chat
          </button>
        </div>

        <div className="flex-1 px-sm py-xs overflow-y-auto flex flex-col min-h-0">
          <div className="px-md py-xs text-[11px] font-bold text-outline uppercase tracking-wider flex items-center justify-between">
            <span>Recent Guides</span>
            {loadingRooms && (
              <div className="w-3 h-3 animate-spin rounded-full border border-primary border-t-transparent" />
            )}
          </div>

          <div className="space-y-xs mt-xs flex-1 overflow-y-auto">
            {chatRooms.map((room) => {
              const isSelected = currentThreadId === room.thread_id;
              const timeLabel = formatRelativeTime(
                room.timestamp || room.updated_at
              );
              return (
                <button
                  key={room.thread_id}
                  title={room.room_name || "Untitled Chat"}
                  className={`flex flex-col w-full px-md py-sm rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-secondary-container text-on-secondary-container font-bold"
                      : "text-on-background hover:bg-on-primary/30"
                  }`}
                  onClick={() => handleSelectRoom(room.thread_id)}
                >
                  <div className="flex items-center w-full gap-xs">
                    <Icon
                      name="chat_bubble_outline"
                      size="16px"
                      className="flex-shrink-0 text-outline"
                    />
                    <span className="truncate flex-1 text-sm font-medium">
                      {room.room_name || "Untitled Chat"}
                    </span>
                  </div>
                  {timeLabel && (
                    <span className="text-[10px] text-outline pl-6">
                      {timeLabel}
                    </span>
                  )}
                </button>
              );
            })}

            {chatRooms.length === 0 && !loadingRooms && (
              <div className="px-md py-md text-center text-xs text-outline italic">
                No previous study guides yet. Start a new chat!
              </div>
            )}
          </div>

          <div className="pt-sm mt-auto border-t border-on-primary/10">
            <button
              className="flex items-center w-full px-md py-sm rounded-xl text-on-background hover:bg-on-primary/30 transition-all"
              onClick={() => {
                setSidebarOpen(false);
              }}
            >
              <Icon name="settings" className="mr-sm" />
              Settings
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-30 flex items-center justify-between gap-sm px-4 md:px-md">
          <div className="flex items-center gap-2 md:gap-sm min-w-0">
            <button
              type="button"
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors flex-shrink-0"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Icon name="menu" />
            </button>
            <span className="text-label-md uppercase tracking-widest text-outline truncate">
              Academic Engine
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-md shrink-0">
            <button className="flex items-center gap-xs text-secondary hover:text-on-secondary-container transition-colors">
              <Icon name="auto_awesome" />
              <span className="font-label-md hidden md:inline">
                Smart Refine
              </span>
            </button>
            <div className="flex items-center gap-sm border-l border-outline-variant pl-md">
              <div className="text-right hidden sm:block">
                <div className="text-body-sm font-bold text-on-surface truncate max-w-[140px]">
                  {displayName}
                </div>
                <div className="text-[10px] text-outline uppercase truncate max-w-[140px]">
                  {displayRole}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center border border-primary/10 font-bold text-sm text-on-primary-container">
                {userInitial}
              </div>
            </div>
          </div>
        </header>

        <main className="relative pt-16 min-h-screen bg-surface">
          <div className="flex flex-col w-full h-[calc(100vh-64px)] supports-[height:100dvh]:h-[calc(100dvh-64px)] overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0 bg-surface">
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-4 md:px-lg py-lg relative"
                >
                  <div className="max-w-4xl mx-auto w-full space-y-lg">
                    {messages.length === 0 && !loadingChat && (
                      <div className="flex justify-center mb-lg mt-md">
                        <div className="text-center max-w-2xl">
                          <div className="w-12 h-12 bg-primary-container rounded-xl mx-auto mb-sm flex items-center justify-center shadow-sm">
                            <Icon
                              name="menu_book"
                              size="24px"
                              className="text-on-primary-container"
                            />
                          </div>
                          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
                            Welcome to Academic Engine
                          </h1>
                          <p className="font-body-md text-body-md text-on-surface-variant max-w-full mx-auto">
                            Ask a question, request a literature review, or
                            generate a structured study guide.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm mt-md max-w-full mx-auto">
                            {SUGGESTIONS.map((s) => (
                              <button
                                key={s.title}
                                className="bg-surface-container-low hover:bg-surface-container-high transition-colors text-left p-sm rounded-xl group relative overflow-hidden"
                                onClick={() => {
                                  setInput(`${s.title}: ${s.subtitle}`);
                                  textareaRef.current?.focus();
                                  setTimeout(resizeTextarea, 0);
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="font-label-md text-label-md text-primary mb-xs">
                                  {s.title}
                                </div>
                                <div className="font-body-sm text-body-sm text-on-surface-variant truncate">
                                  {s.subtitle}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {loadingChat && (
                      <div className="flex justify-center items-center py-12">
                        <div className="flex flex-col items-center gap-sm text-outline">
                          <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span className="text-sm">
                            Loading study guide...
                          </span>
                        </div>
                      </div>
                    )}

                    {messages.map((msg) =>
                      msg.role === "user" ? (
                        <div key={msg.id} className="flex justify-end mb-md">
                          <div className="bg-primary text-on-primary rounded-2xl rounded-br-none px-md py-sm max-w-[85%] md:max-w-2xl shadow-sm relative">
                            <div className="font-body-md text-body-md whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={msg.id} className="flex justify-start mb-md">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center mr-md mt-sm flex-shrink-0">
                            <Icon
                              name="account_balance"
                              size="18px"
                              className="text-primary"
                            />
                          </div>
                          <div className="bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-2xl rounded-bl-none px-md py-md max-w-[85%] md:max-w-3xl shadow-sm w-full relative">
                            <div className="absolute -left-[17px] top-[14px] w-0 h-0 border-t-[8px] border-t-transparent border-r-[16px] border-r-surface-container-lowest border-b-[8px] border-b-transparent z-10" />
                            
                            {/* Render AI markdown content */}
                            <div className="markdown-content font-body-md text-body-md text-on-surface leading-relaxed">
                              <ReactMarkdown components={markdownComponents}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>

                            {/* Copy Guide Action at the end of AI chat */}
                            <div className="flex items-center gap-sm mt-md pt-sm border-t border-outline-variant/20">
                              <button
                                className="text-xs font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors flex items-center gap-xs px-2.5 py-1.5 rounded-lg hover:bg-surface-container"
                                onClick={() => copyGuide(msg.content, msg.id)}
                                title="Copy raw study guide markdown"
                              >
                                <Icon
                                  name={copiedId === msg.id ? "check" : "content_copy"}
                                  size="16px"
                                />
                                {copiedId === msg.id ? "Copied Guide" : "Copy Guide"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    )}

                    {typing && (
                      <div className="flex justify-start mb-md">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center mr-md mt-sm flex-shrink-0">
                          <Icon
                            name="account_balance"
                            size="18px"
                            className="text-primary"
                          />
                        </div>
                        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl rounded-bl-none px-md py-sm flex items-center gap-xs shadow-sm">
                          <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                          <div
                            className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <div
                            className="w-2 h-2 rounded-full bg-primary/80 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 md:p-md bg-surface border-t border-outline-variant/20 z-10">
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-surface-container-lowest rounded-2xl p-sm shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-outline-variant/30 flex flex-col transition-all focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.1)] focus-within:border-primary/50">
                      <div className="flex items-center justify-end mb-sm px-sm pt-xs">
                        <div className="flex gap-sm">
                          <button
                            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline transition-colors"
                            title="Attach file"
                            type="button"
                          >
                            <Icon name="attach_file" size="20px" />
                          </button>
                          <button
                            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline transition-colors"
                            title="Web search"
                            type="button"
                          >
                            <Icon name="travel_explore" size="20px" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-end gap-sm">
                        <textarea
                          ref={textareaRef}
                          className="flex-1 bg-transparent border-none focus:ring-0 resize-none font-body-md text-body-md text-on-surface placeholder:text-outline-variant min-h-[44px] max-h-[200px] p-sm"
                          placeholder="Ask a question or request a topic breakdown..."
                          rows={1}
                          value={input}
                          onChange={(e) => {
                            setInput(e.target.value);
                            resizeTextarea();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage(input);
                            }
                          }}
                        />
                        <button
                          className="w-11 h-11 mb-xs rounded-xl bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 hover:shadow-md transition-all active:scale-95 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          type="button"
                          onClick={() => sendMessage(input)}
                          disabled={typing || !input.trim()}
                        >
                          <Icon name="send" filled />
                        </button>
                      </div>
                    </div>
                    <div className="text-center mt-sm">
                      <span className="font-body-sm text-body-sm text-outline-variant text-[11px]">
                        Academic Engine can make mistakes. Verify critical
                        information.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Chat;
