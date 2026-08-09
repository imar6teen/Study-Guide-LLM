import { useEffect, useRef, useState } from "react"
import Icon from "../components/Icon"

interface GuideModule {
  step: number
  title: string
  description: string
  line: boolean
}

interface Guide {
  tag: string
  time: string
  title: string
  intro: string
  modules: GuideModule[]
}

interface Message {
  id: number
  role: "user" | "ai"
  content?: string
  guide?: Guide
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    role: "user",
    content:
      "Create a structured study guide for Introduction to Quantum Mechanics, focusing on the historical context and foundational principles.",
  },
  {
    id: 2,
    role: "ai",
    guide: {
      tag: "Study Guide Generated",
      time: "0.4s",
      title: "Introduction to Quantum Mechanics",
      intro:
        "This guide structures your learning journey through the foundational concepts of Quantum Mechanics. It begins with the crisis in classical physics and progresses through the key postulates and mathematical formalism.",
      modules: [
        {
          step: 1,
          title: "The Classical Crisis",
          description: "Blackbody radiation, photoelectric effect, and the Bohr model.",
          line: true,
        },
        {
          step: 2,
          title: "Wave-Particle Duality",
          description: "De Broglie hypothesis and the double-slit experiment.",
          line: false,
        },
      ],
    },
  },
]

const SUGGESTIONS = [
  { title: "Literature Review", subtitle: "Recent advances in CRISPR-Cas9" },
  { title: "Study Guide", subtitle: "Macroeconomics: Fiscal Policy" },
]

const NAV_ITEMS = [
  { id: "new-chat", label: "New Chat", icon: "add_circle" },
  // { id: "recent-guides", label: "Recent Guides", icon: "history_edu" },
  // { id: "resources", label: "Resources", icon: "library_books" },
  { id: "settings", label: "Settings", icon: "settings" },
]

function guideToText(guide: Guide): string {
  return [
    `${guide.tag} — ${guide.time}`,
    guide.title,
    "",
    guide.intro,
    "",
    ...guide.modules.map((m) => `${m.step}. ${m.title} — ${m.description}`),
  ].join("\n")
}

function demoReply(topic: string): string {
  return `Here's a structured outline based on your request: "${topic}".

1. Foundations — establish key definitions and context.
2. Core concepts — break down the main principles.
3. Applications — explore worked examples and practice problems.

Would you like me to expand any section into a full study guide?`
}

function Chat() {
  const [activeNav, setActiveNav] = useState("new-chat")
  const [guideMode, setGuideMode] = useState(true)
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [copied, setCopied] = useState(false)
  const [helpful, setHelpful] = useState(false)
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const nextId = useRef(3)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, typing])

  function resizeTextarea() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = ""
    el.style.height = `${el.scrollHeight}px`
  }

  function resetTextarea() {
    const el = textareaRef.current
    if (el) el.style.height = ""
  }

  function handleNav(id: string) {
    setActiveNav(id)
    setSidebarOpen(false)
    if (id === "new-chat") {
      setMessages(INITIAL_MESSAGES)
      setHelpful(false)
      setCopied(false)
    }
  }

  function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || typing) return
    setMessages((m) => [...m, { id: nextId.current++, role: "user", content: trimmed }])
    setInput("")
    resetTextarea()
    setTyping(true)
    setTimeout(() => {
      setMessages((m) => [...m, { id: nextId.current++, role: "ai", content: demoReply(trimmed) }])
      setTyping(false)
    }, 1200)
  }

  async function copyGuide(guide: Guide) {
    try {
      await navigator.clipboard.writeText(guideToText(guide))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

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
        className={`fixed left-0 top-0 h-full w-72 bg-primary z-50 flex flex-col shadow-xl transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-md flex items-center gap-base border-b border-on-primary/10">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
            <Icon name="school" size="18px" filled className="text-on-primary-container" />
          </div>
          <span className="font-headline-md text-on-primary tracking-tight">&nbsp;Study Guide</span>
        </div>
        <nav className="flex-1 px-sm py-md space-y-xs">
          {NAV_ITEMS.filter((item) => item.id !== "settings").map((item) => {
            const active = activeNav === item.id
            return (
              <button
                key={item.id}
                className={`flex items-center w-full px-md py-sm rounded-xl transition-all ${
                  active
                    ? "bg-secondary-container text-on-secondary-container font-bold"
                    : "text-on-primary/80 hover:bg-on-primary/10 hover:text-on-primary"
                }`}
                onClick={() => handleNav(item.id)}
              >
                <Icon name={item.icon} className="mr-sm" />
                {item.label}
              </button>
            )
          })}
          <div className="pt-md mt-md border-t border-on-primary/10">
            {NAV_ITEMS.filter((item) => item.id === "settings").map((item) => (
              <button
                key={item.id}
                className={`flex items-center w-full px-md py-sm rounded-xl transition-all ${
                  activeNav === item.id
                    ? "bg-secondary-container text-on-secondary-container font-bold"
                    : "text-on-primary/80 hover:bg-on-primary/10 hover:text-on-primary"
                }`}
                onClick={() => handleNav(item.id)}
              >
                <Icon name={item.icon} className="mr-sm" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>
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
            <span className="text-label-md uppercase tracking-widest text-outline truncate">Academic Engine</span>
          </div>
          <div className="flex items-center gap-2 md:gap-md shrink-0">
            <button className="flex items-center gap-xs text-secondary hover:text-on-secondary-container transition-colors">
              <Icon name="auto_awesome" />
              <span className="font-label-md hidden md:inline">Smart Refine</span>
            </button>
            <div className="flex items-center gap-sm border-l border-outline-variant pl-md">
              <div className="text-right hidden sm:block">
                <div className="text-body-sm font-bold text-on-surface">Dr. Scholarly</div>
                <div className="text-[10px] text-outline uppercase">Professor Account</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center border border-primary/10">
                <Icon name="person" size="16px" className="text-on-primary-container" />
              </div>
            </div>
          </div>
        </header>

        <main className="relative pt-16 min-h-screen bg-surface">
          <div className="flex flex-col w-full h-[calc(100vh-64px)] supports-[height:100dvh]:h-[calc(100dvh-64px)] overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0 bg-surface">
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-lg py-lg relative">
                  <div className="max-w-4xl mx-auto w-full space-y-lg">
                    <div className="flex justify-center mb-lg mt-md">
                      <div className="text-center max-w-2xl">
                        <div className="w-12 h-12 bg-primary-container rounded-xl mx-auto mb-sm flex items-center justify-center shadow-sm">
                          <Icon name="menu_book" size="24px" className="text-on-primary-container" />
                        </div>
                        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
                          Welcome to Academic Engine
                        </h1>
                        <p className="font-body-md text-body-md text-on-surface-variant max-w-full mx-auto">
                          Ask a question, request a literature review, or generate a structured study guide.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm mt-md max-w-full mx-auto">
                          {SUGGESTIONS.map((s) => (
                            <button
                              key={s.title}
                              className="bg-surface-container-low hover:bg-surface-container-high transition-colors text-left p-sm rounded-xl group relative overflow-hidden"
                              onClick={() => {
                                setInput(`${s.title}: ${s.subtitle}`)
                                textareaRef.current?.focus()
                                setTimeout(resizeTextarea, 0)
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="font-label-md text-label-md text-primary mb-xs">{s.title}</div>
                              <div className="font-body-sm text-body-sm text-on-surface-variant truncate">
                                {s.subtitle}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {messages.map((msg) =>
                      msg.role === "user" ? (
                        <div key={msg.id} className="flex justify-end mb-md">
                          <div className="bg-primary text-on-primary rounded-2xl rounded-br-none px-md py-sm max-w-[85%] md:max-w-2xl shadow-sm relative">
                            <div className="font-body-md text-body-md">{msg.content}</div>
                          </div>
                        </div>
                      ) : msg.guide ? (
                        <div key={msg.id} className="flex justify-start mb-md">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center mr-md mt-sm flex-shrink-0">
                            <Icon name="account_balance" size="18px" className="text-primary" />
                          </div>
                          <div className="bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-2xl rounded-bl-none px-md py-md max-w-3xl shadow-sm w-full relative">
                            <div className="absolute -left-[17px] top-[14px] w-0 h-0 border-t-[8px] border-t-transparent border-r-[16px] border-r-surface-container-lowest border-b-[8px] border-b-transparent z-10" />
                            <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant/20">
                              <span className="font-label-md text-label-md text-primary tracking-widest uppercase">
                                {msg.guide.tag}
                              </span>
                              <span className="ml-auto text-xs font-mono text-outline">{msg.guide.time}</span>
                            </div>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">{msg.guide.title}</h2>
                            <p className="font-body-md text-body-md text-on-surface-variant mb-lg leading-relaxed">
                              {msg.guide.intro}
                            </p>
                            <div className="space-y-sm mt-lg">
                              {msg.guide.modules.map((module) => (
                                <div key={module.step} className="flex items-start gap-md">
                                  <div className="w-8 flex flex-col items-center">
                                    <div
                                      className={`w-8 h-8 rounded-full font-bold flex items-center justify-center font-label-md text-label-md ${
                                        module.line
                                          ? "bg-secondary-container text-on-secondary-container"
                                          : "bg-surface-container-highest text-on-surface-variant"
                                      }`}
                                    >
                                      {module.step}
                                    </div>
                                    {module.line && (
                                      <div className="w-0.5 h-full bg-outline-variant/30 my-xs min-h-[40px]" />
                                    )}
                                  </div>
                                  <div className="flex-1 pb-md">
                                    <h4 className="font-headline-md text-headline-md text-on-surface mb-xs">
                                      {module.title}
                                    </h4>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                                      {module.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-sm mt-lg pt-sm border-t border-outline-variant/20">
                              <button
                                className={`text-xs font-label-md text-label-md transition-colors flex items-center gap-xs ${
                                  helpful ? "text-primary" : "text-on-surface-variant hover:text-primary"
                                }`}
                                onClick={() => setHelpful((v) => !v)}
                              >
                                <Icon name="thumb_up" size="16px" filled={helpful} />
                                {helpful ? "Helpful" : "Helpful"}
                              </button>
                              <button
                                className="text-xs font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors flex items-center gap-xs"
                                onClick={() => msg.guide && copyGuide(msg.guide)}
                              >
                                <Icon name={copied ? "check" : "content_copy"} size="16px" />
                                {copied ? "Copied" : "Copy"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={msg.id} className="flex justify-start mb-md">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center mr-md mt-sm flex-shrink-0">
                            <Icon name="account_balance" size="18px" className="text-primary" />
                          </div>
                          <div className="bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-2xl rounded-bl-none px-md py-md max-w-[85%] md:max-w-3xl shadow-sm relative">
                            <div className="absolute -left-[17px] top-[14px] w-0 h-0 border-t-[8px] border-t-transparent border-r-[16px] border-r-surface-container-lowest border-b-[8px] border-b-transparent z-10" />
                            <div className="font-body-md text-body-md whitespace-pre-line">{msg.content}</div>
                          </div>
                        </div>
                      ),
                    )}

                    {typing && (
                      <div className="flex justify-start mb-md">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center mr-md mt-sm flex-shrink-0">
                          <Icon name="account_balance" size="18px" className="text-primary" />
                        </div>
                        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl rounded-bl-none px-md py-sm flex items-center gap-xs shadow-sm">
                          <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 md:p-md bg-surface border-t border-outline-variant/20 z-10">
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-surface-container-lowest rounded-2xl p-sm shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-outline-variant/30 flex flex-col transition-all focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.1)] focus-within:border-primary/50">
                      <div className="flex items-center justify-between mb-sm px-sm pt-xs">
                        <label className="flex items-center gap-sm cursor-pointer group">
                          <div className="relative">
                            <input
                              checked={guideMode}
                              type="checkbox"
                              className="sr-only peer"
                              onChange={(e) => setGuideMode(e.target.checked)}
                            />
                            <div className="w-10 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                          </div>
                          <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-primary transition-colors">
                            Generate Study Guide Format
                          </span>
                        </label>
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
                            setInput(e.target.value)
                            resizeTextarea()
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              sendMessage(input)
                            }
                          }}
                        />
                        <button
                          className="w-11 h-11 mb-xs rounded-xl bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 hover:shadow-md transition-all active:scale-95 flex-shrink-0"
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
                        Academic Engine can make mistakes. Verify critical information.
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
  )
}

export default Chat
