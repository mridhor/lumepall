"use client";

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { MessageCircle, X, ChevronDown, ChevronUp, ArrowUp, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import TradingViewWidget from "./TradingViewWidget";

interface ChartData {
  type: string;
  symbol: string;
  companyName: string;
  period: string;
  currentPrice: string;
  change: string;
  data: Array<{
    date: string;
    price: string;
    high: string;
    low: string;
    volume: number;
  }>;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  thinkingTime?: number;
  suggestions?: string[];
  chartData?: ChartData;
  suggestionsLoading?: boolean;
}

export interface ChatbotPillRef {
  open: () => void;
  close: () => void;
}

const ChatbotPill = forwardRef<ChatbotPillRef>((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "I'm Snobol AI. Ask me about finance, investing, or our crisis investing approach. I believe financial freedom is achievable for everyone, even starting at 10-12 years old.",
      suggestions: [
        "How do I start investing at 12?",
        "What is Snobol's crisis investing approach?",
        "Where is fear greatest right now?"
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasContentStarted, setHasContentStarted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedThinking, setExpandedThinking] = useState<Set<number>>(new Set());
  const [thinkingDuration, setThinkingDuration] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Thinking...");
  const [inputContext, setInputContext] = useState<string>("");
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastRequestTime = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Expose open and close methods
  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: handleClose
  }));


  // Suggestion templates organized by topic (fallback only)
  const suggestionTemplates = {
    general: [
      "How do I start investing at 12?",
      "What is Snobol AI's crisis investing approach?",
      "Where is fear greatest right now?",
      "How do you manage risk during market volatility?",
      "What makes a quality investment during uncertain times?",
      "How should beginners start investing?",
      "What's your view on diversification?",
      "How much money do I need to start investing?",
      "What's the difference between investing and trading?",
      "Should I invest in what I don't understand?",
      "How do I build a long-term investment plan?",
      "What are the biggest mistakes new investors make?",
      "How often should I check my portfolio?",
      "Is it better to invest regularly or wait for dips?",
      "How do I stay calm when everyone else is panicking?",
      "What should I focus on during market uncertainty?",
      "How do I prepare for the next crisis?",
      "What's a safe investing strategy for beginners?",
      "Is this my crisis opportunity?"
    ],
    company: [
      "What financial metrics should I look at?",
      "How do I evaluate if a company is financially healthy?",
      "What are the risks I should consider?",
      "Should I focus on revenue growth or profitability?",
      "How important are dividends when investing?",
      "What does debt-to-equity ratio tell me?",
      "How do I know if a stock is overvalued?",
      "What's more important: earnings or cash flow?",
      "Should I worry about management changes?",
      "How do I research a company before investing?",
      "What red flags should I watch out for?",
      "How does company size affect my investment?",
      "Which companies survive market crashes better?",
      "How do I spot financially stable companies?",
      "What makes a company crisis-resistant?",
      "Should I avoid companies with high debt during crises?",
      "How important is a company's cash reserves?",
      "What industries are safer during downturns?",
    ],
    market: [
      "Should I invest during a market downturn?",
      "How do I protect my portfolio during crashes?",
      "What's the difference between bull and bear markets?",
      "Is now a good time to buy stocks?",
      "How do economic cycles affect investments?",
      "What happens to stocks during a recession?",
      "Should I sell everything when markets crash?",
      "How long do market downturns usually last?",
      "What's the best strategy during high inflation?",
      "How do interest rate changes affect stocks?",
      "Should I time the market or invest consistently?",
      "What causes stock market volatility?",
      "How can I profit from market fear and panic?",
      "What are the signs of a market crisis?",
      "Should I buy when others are fearful?",
      "How do I stay rational during market crashes?",
      "What's the best defense in a bear market?",
      "How do crisis cycles create opportunities?",
      "Analyze current market conditions",
      "Show me historical bear market recoveries",
      "Explain today's market volatility",
      "Compare this downturn to 2008"
    ],
    risk: [
      "How much of my portfolio should be in cash?",
      "What is position sizing and why does it matter?",
      "How do I avoid emotional investing decisions?",
      "What's the role of stop-losses in risk management?",
      "Should I use leverage in my investments?",
      "How much risk should I take at my age?",
      "What's a safe withdrawal rate in retirement?",
      "Should I sell losing positions or hold on?",
      "How do I balance risk and reward?",
      "What's the right asset allocation for me?",
      "How do I protect against market crashes?",
      "Is it risky to invest in just one sector?",
      "How do I build a safety buffer for crises?",
      "What's a conservative portfolio allocation?",
      "Should I reduce risk during uncertain times?",
      "How can I minimize losses in a downturn?",
      "What's the safest way to preserve capital?",
      "How do I prepare my portfolio for a crisis?",
      "Assess my portfolio risk level",
      "Create a conservative allocation plan",
      "Review my current risk exposure",
      "Build me a defensive portfolio"
    ],
    specific: [
      "How do I know when to sell an investment?",
      "What's the role of dividends in investing?",
      "Should I invest in index funds or individual stocks?",
      "How do I balance growth vs value stocks?",
      "What's the best way to track my portfolio performance?",
      "Should I reinvest my dividends automatically?",
      "How do taxes affect my investment returns?",
      "What's the benefit of dollar-cost averaging?",
      "Should I rebalance my portfolio regularly?",
      "How do I choose between stocks and bonds?",
      "What's a reasonable return to expect?",
      "Should I invest in international stocks?",
      "How do I invest safely during a crisis?",
      "What's the best way to buy during market fear?",
      "Should I hold more cash during downturns?",
      "How can I use market crashes to my advantage?",
      "What assets hold value during crises?",
      "Should I focus on value stocks during bear markets?",
      "Show me dividend aristocrats",
      "Compare index funds vs ETFs",
      "Calculate tax-efficient investing strategies",
      "Explain dollar-cost averaging with examples"
    ],
    snobol: [
      "What makes Snobol AI different from other advisors?",
      "How does Snobol AI help during market crises?",
      "What is the philosophy behind crisis investing?",
      "Can you explain Snobol AI's investment strategy?",
      "How does Snobol AI stay calm during market panic?",
      "Why does Snobol AI focus on crisis investing?",
      "What does Snobol AI recommend for beginners?",
      "How can Snobol AI help me build wealth?",
      "What's Snobol AI's approach to risk?",
      "Does Snobol AI work for long-term investing?",
      "How does Snobol AI handle market uncertainty?",
      "What makes crisis investing effective?",
      "How does Snobol AI turn panic into opportunity?",
      "What's Snobol AI's secret to staying calm?",
      "How can I invest like Snobol AI during crises?",
      "What does Snobol AI do when markets crash?"
    ],
    crisis: [
      "How do I invest during a financial crisis?",
      "What should I buy when markets are crashing?",
      "How can I profit from market panic?",
      "What's the best strategy during economic uncertainty?",
      "Should I hold cash during a crisis?",
      "How do I stay calm when my portfolio is down?",
      "What makes a good crisis investment?",
      "How long should I wait before buying the dip?",
      "What are the warning signs of a market crash?",
      "How do I protect my wealth during turbulent times?",
      "Should I sell before a recession hits?",
      "What opportunities emerge during market fear?",
      "How do I build a crisis-proof portfolio?",
      "What assets perform well during downturns?",
      "How can fear create buying opportunities?",
      "What's the safest approach during market chaos?",
      "Show me crisis investing strategies",
      "Analyze market crash patterns",
      "Find undervalued stocks during panic",
      "Build me a crisis-resistant portfolio"
    ],
    valueinvesting: [
      "What is value investing?",
      "How do I find undervalued stocks?",
      "What makes a stock a good value?",
      "Should I focus on value during bear markets?",
      "How do I know if a company is trading below value?",
      "What's the difference between price and value?",
      "How patient should I be with value investments?",
      "What are the best value investing strategies?",
      "How do I spot value during market crashes?",
      "Should I buy quality companies at low prices?",
      "What role does patience play in value investing?",
      "How do crises create value opportunities?",
      "Find undervalued stocks for me",
      "Analyze Warren Buffett's value approach",
      "Show me quality companies trading below value",
      "Teach me value investing fundamentals"
    ],
    psychology: [
      "How do I control fear when investing?",
      "What should I do when I panic about losses?",
      "How do I avoid making emotional decisions?",
      "Why do I want to sell when markets drop?",
      "How can I think long-term during chaos?",
      "What's the psychology behind market panic?",
      "How do I stay disciplined during volatility?",
      "Why is it hard to buy when others are selling?",
      "How can I be greedy when others are fearful?",
      "What mindset do successful crisis investors have?",
      "How do I overcome investment anxiety?",
      "Why does the crowd usually get it wrong?",
      "Help me overcome my fear of losses",
      "Teach me emotional discipline",
      "Show me how Warren Buffett stays calm",
      "Explain the psychology of successful investors"
    ],
    personalfinance: [
      "How much should I save for emergencies?",
      "What's a good budgeting strategy?",
      "Should I pay off debt before investing?",
      "How do I balance saving and investing?",
      "What percentage of income should I invest?",
      "How do I plan for retirement?",
      "Should I prioritize 401k or personal investing?",
      "How much house can I afford?",
      "What's the best way to save for college?",
      "How do I prepare financially for a crisis?",
      "Should I have multiple income streams?",
      "How much cash should I keep liquid?",
      "What's a safe withdrawal strategy?",
      "How do I build long-term financial security?",
      "What insurance do I really need?",
      "How do I protect my family financially?",
      "Create a budget plan for me",
      "Calculate my retirement needs",
      "Review my current financial situation",
      "Build me an emergency fund strategy"
    ]
  };

  // AI-powered suggestion generation with timeout
  const generateAISuggestions = async (userMessage: string, assistantMessage: string): Promise<string[]> => {
    try {
      // Add timeout to fail fast if API is slow
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch("/api/chat/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessage,
          assistantMessage,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to generate suggestions`);
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      throw error; // Re-throw to trigger fallback
    }
  };

  // Fallback: keyword-based suggestions
  const getFallbackSuggestions = (userQuestion: string, aiResponse: string): string[] => {
    const lowerQ = userQuestion.toLowerCase();
    const lowerA = aiResponse.toLowerCase();
    const combined = lowerQ + ' ' + lowerA;
    
    // Detect if asking about Snobol AI specifically
    if (lowerQ.includes('snobol') || lowerA.includes('snobol')) {
      return getRandomSuggestions(suggestionTemplates.snobol);
    }
    
    // Detect crisis/panic/fear topics (HIGH PRIORITY - Snobol's specialty)
    if (combined.match(/\b(crisis|crash|panic|fear|uncertain|turbulent|chaos|market fear|economic crisis|financial crisis|downturn|collapse|blood|carnage|disaster)\b/i)) {
      return getRandomSuggestions(suggestionTemplates.crisis);
    }
    
    // Detect psychology/emotions/behavior
    if (combined.match(/\b(afraid|scared|nervous|worry|anxious|emotion|panic|fear|psychology|mindset|discipline|greed|calm|patient|irrational|rational)\b/i)) {
      return getRandomSuggestions(suggestionTemplates.psychology);
    }
    
    // Detect value investing topics
    if (combined.match(/\b(value|undervalued|cheap|bargain|intrinsic|fair value|discount|margin of safety|quality|fundamental)\b/i)) {
      return getRandomSuggestions(suggestionTemplates.valueinvesting);
    }
    
    // Detect personal finance topics
    if (combined.match(/\b(budget|save|saving|emergency fund|debt|loan|mortgage|retirement|401k|ira|pension|insurance|income|salary|expense|college fund|financial plan|net worth|credit|afford|pay off)\b/i)) {
      return getRandomSuggestions(suggestionTemplates.personalfinance);
    }
    
    // Detect company/stock analysis (expanded keywords) - redirect to market suggestions
    if (combined.match(/\b(apple|tesla|amazon|google|microsoft|meta|netflix|nvidia|stock|company|share|equity|corporation|business|ticker|earnings|revenue|profit|balance sheet|income statement|cash flow|dividend|p\/e|price-to-earnings)\b/i)) {
      return getRandomSuggestions(suggestionTemplates.market);
    }
    
    // Detect market conditions (expanded)
    if (combined.match(/\b(market|bull|bear|recession|depression|recovery|expansion|cycle|boom|bust|economy|economic|gdp|unemployment|inflation|deflation|fed|federal reserve|interest rate|correction|rally)\b/i)) {
      return getRandomSuggestions(suggestionTemplates.market);
    }
    
    // Detect risk management (expanded)
    if (combined.match(/\b(risk|safe|protect|hedge|loss|avoid loss|preservation|capital preservation|buffer|emergency fund|cash reserve|allocation|defensive|conservative|volatility|drawdown|stop loss)\b/i)) {
      return getRandomSuggestions(suggestionTemplates.risk);
    }
    
    // Detect specific how-to questions
    if (lowerQ.match(/\b(how do|how can|how should|when do|when should|should i|what's the best|which is better|help me|teach me|explain|tell me about)\b/i)) {
      return getRandomSuggestions(suggestionTemplates.specific);
    }
    
    // Default to general suggestions
    return getRandomSuggestions(suggestionTemplates.general);
  };
  
  // Get 3 random suggestions from a category
  const getRandomSuggestions = (category: string[]) => {
    const shuffled = [...category].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  // Helper to extract chart data from content
  const extractChartData = (content: string): { cleanContent: string; chartData: ChartData | null } => {
    const chartMatch = content.match(/\[CHART_DATA\]([\s\S]*?)\[\/CHART_DATA\]/);
    if (chartMatch) {
      try {
        const chartData = JSON.parse(chartMatch[1]) as ChartData;
        const cleanContent = content.replace(/\[CHART_DATA\][\s\S]*?\[\/CHART_DATA\]/, '').trim();
        return { cleanContent, chartData };
      } catch (e) {
        console.error('Failed to parse chart data:', e);
      }
    }
    return { cleanContent: content, chartData: null };
  };


  // Helper to get dynamic loading message based on tool being called
  const getLoadingMessage = (toolName?: string): string => {
    if (!toolName) return "Thinking...";
    
    const messages: Record<string, string> = {
      'get_stock_quote': 'Fetching stock price...',
      'analyze_company': 'Analyzing company...',
      'show_stock_chart': 'Loading chart data...',
      'search_web': 'Searching the web...',
    };
    
    return messages[toolName] || 'Processing...';
  };

  // Helper to find the last assistant message index with suggestions
  const getLastAssistantMessageWithSuggestions = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant" && messages[i].suggestions && messages[i].suggestions!.length > 0) {
        return i;
      }
    }
    return -1;
  };

  // Prevent body scroll when overlay is open (Safari-compatible)
  useEffect(() => {
    if (isOpen) {
      // Store original styles and scroll position
      const originalBodyClass = document.body.className;
      const scrollY = window.scrollY;
      
      // Add no-scroll class and prevent scrolling
      document.body.classList.add('no-scroll');
      document.body.style.top = `-${scrollY}px`;
      document.documentElement.style.overflow = "hidden";
      
      // Prevent touch scrolling on Safari
      const preventTouch = (e: TouchEvent) => {
        // Allow scrolling within the chat container
        const chatContainer = document.querySelector('[data-chat-container]');
        if (chatContainer && chatContainer.contains(e.target as Node)) {
          return; // Allow scrolling within chat
        }
        
        // Allow touch events on interactive elements (buttons, inputs, etc.)
        const target = e.target as HTMLElement;
        if (target && (
          target.tagName === 'BUTTON' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.closest('button') ||
          target.closest('input') ||
          target.closest('textarea')
        )) {
          return; // Allow touch events on interactive elements
        }
        
        e.preventDefault();
      };
      
      // Add touch event listeners for Safari
      document.addEventListener('touchmove', preventTouch, { passive: false });
      document.addEventListener('touchstart', preventTouch, { passive: false });
      
      // Store for cleanup
      const cleanup = () => {
        document.body.className = originalBodyClass;
        document.body.style.top = '';
        document.documentElement.style.overflow = '';
        document.removeEventListener('touchmove', preventTouch);
        document.removeEventListener('touchstart', preventTouch);
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
      
      return cleanup;
    }
  }, [isOpen]);

  // Robust scroll function
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    // Try multiple methods to ensure scroll works
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
    
    // Also scroll the container directly
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Scroll to top function for analysis results
  const scrollToTop = (behavior: ScrollBehavior = "smooth") => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: 0, behavior });
    }
  };


  // Handle Escape key to close chatbot
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Auto-focus chat container when overlay opens for keyboard scrolling
  useEffect(() => {
    if (isOpen && messagesContainerRef.current) {
      // Small delay to ensure the overlay is fully rendered
      const timer = setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Auto scroll when new messages arrive or loading state changes
  useEffect(() => {
    // Only scroll if not currently streaming to avoid conflicts
    if (!isStreaming && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Check if the last message contains analysis results (charts, tables, etc.)
      const hasAnalysisContent = lastMessage.content.includes('chart') || 
                                lastMessage.content.includes('table') ||
                                lastMessage.content.includes('analysis') ||
                                lastMessage.content.includes('📊') ||
                                lastMessage.content.includes('📈') ||
                                lastMessage.chartData; // Also check for actual chart data
      
      setTimeout(() => {
        if (hasAnalysisContent) {
          // For analysis results, scroll to show the user's question at the top
          // Find the user's message that triggered this response
          const userMessageIndex = messages.length - 2;
          if (userMessageIndex >= 0 && messages[userMessageIndex].role === 'user') {
            // Scroll to the user's message to keep it visible
            const userMessageElement = document.querySelector(`[data-message-index="${userMessageIndex}"]`);
            if (userMessageElement) {
              userMessageElement.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
              scrollToTop("smooth");
            }
          } else {
            scrollToTop("smooth");
          }
        } else {
          // Scroll to bottom for regular messages
          scrollToBottom("smooth");
        }
      }, 100); // Increased delay to allow TradingView widgets to render
    }
  }, [messages, isLoading, isStreaming]);

  // Ensure scroll to bottom when loading state changes (Thinking... message appears)
  useEffect(() => {
    if (isLoading && !isStreaming) {
      // Small delay to ensure the loading message is rendered
      setTimeout(() => {
        scrollToBottom("smooth");
      }, 50);
    }
  }, [isLoading, isStreaming, messages]);

  // Keep scrolling during streaming to follow the response
  useEffect(() => {
    if (isStreaming) {
      // Scroll immediately to show the start of the response
      scrollToBottom("instant");
      
      // Use a more efficient scroll approach during streaming
      let lastScrollHeight = 0;
      let scrollTimeout: NodeJS.Timeout;
      
      const scrollInterval = setInterval(() => {
        if (messagesContainerRef.current) {
          const currentScrollHeight = messagesContainerRef.current.scrollHeight;
          // Only scroll if content height has actually changed
          if (currentScrollHeight !== lastScrollHeight) {
            // Clear any pending scroll timeout
            if (scrollTimeout) clearTimeout(scrollTimeout);
            
            // Debounce scroll updates to prevent excessive scrolling
            scrollTimeout = setTimeout(() => {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = currentScrollHeight;
              }
            }, 50);
            
            lastScrollHeight = currentScrollHeight;
          }
        }
      }, 150); // Reduced frequency to 150ms for smoother performance
      
      return () => {
        clearInterval(scrollInterval);
        if (scrollTimeout) clearTimeout(scrollTimeout);
      };
    }
  }, [isStreaming]);

  // Handle scroll positioning when TradingView widgets are rendered
  useEffect(() => {
    // Check if any message has chart data and we're not streaming
    const hasChartData = messages.some(msg => msg.chartData && msg.chartData.type === 'stock_chart');
    
    if (hasChartData && !isStreaming && !isLoading) {
      // Wait for TradingView widgets to render, then position scroll
      setTimeout(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.chartData && lastMessage.chartData.type === 'stock_chart') {
          // Find the user's message that triggered this response
          const userMessageIndex = messages.length - 2;
          if (userMessageIndex >= 0 && messages[userMessageIndex]?.role === 'user') {
            const userMessageElement = document.querySelector(`[data-message-index="${userMessageIndex}"]`);
            if (userMessageElement) {
              userMessageElement.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        }
      }, 500); // Wait for TradingView widget to fully load
    }
  }, [messages, isStreaming, isLoading]);

  // Monitor TradingView widget completion to end loading state
  useEffect(() => {
    if (isLoading && !isStreaming && messages.length > 0) {
      // Check if we're waiting for chart rendering
      const lastMessage = messages[messages.length - 1];
      console.log("useEffect triggered - lastMessage chartData:", lastMessage?.chartData);
      
      if (lastMessage?.chartData && lastMessage.chartData.type === 'stock_chart') {
        console.log("Setting chart completion timeout (450ms)");
        // Set up a timeout for chart completion
        const chartTimeout = setTimeout(() => {
          console.log("Chart completion timeout fired - setting isLoading to false");
          setIsLoading(false);
        }, 450); // Increased to keep loading elements visible longer
        
        return () => clearTimeout(chartTimeout);
      } else if (!lastMessage?.chartData) {
        // No chart data but still loading - complete with delay to show "Thinking..."
        console.log("No chart data in useEffect - completing loading with delay");
        setTimeout(() => {
          setIsLoading(false);
        }, 500); // Increased delay to show "Thinking..." text
      }
    }
  }, [messages, isLoading, isStreaming]);

  // Thinking duration counter
  useEffect(() => {
    if (isLoading) {
      // Reset counter and start timer
      setThinkingDuration(0);
      const startTime = Date.now();
      
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setThinkingDuration(elapsed);
      }, 100); // Update every 100ms for smooth counting
      
      return () => clearInterval(timer);
    } else {
      // Reset when not loading
      setThinkingDuration(0);
    }
  }, [isLoading]);

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // Reset history index when user types something new
  useEffect(() => {
    if (historyIndex !== -1 && inputValue !== inputHistory[historyIndex]) {
      setHistoryIndex(-1);
    }
  }, [inputValue, historyIndex, inputHistory]);

  // Auto-focus textarea on mobile when chat opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Small delay to ensure the overlay is fully rendered on mobile
      const timer = setTimeout(() => {
        if (textareaRef.current && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
          textareaRef.current.focus();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);


  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
    setHasContentStarted(false);
    setLoadingMessage("Thinking...");
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    
    if (textToSend && !isLoading && !isStreaming) {
      // Rate limiting: Prevent requests faster than every 2 seconds
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime.current;
      if (timeSinceLastRequest < 2000) {
        setError("Please wait a moment before sending another message.");
        return;
      }

      const userMessage = textToSend;
      setInputValue("");
      setError(null);
      setInputContext("");
      
      // Add to input history (avoid duplicates)
      setInputHistory(prev => {
        const newHistory = [...prev];
        // Remove if already exists to avoid duplicates
        const filteredHistory = newHistory.filter(msg => msg !== userMessage);
        // Add to end
        filteredHistory.push(userMessage);
        // Keep only last 50 messages to prevent memory issues
        return filteredHistory.slice(-50);
      });
      
      // Reset history index
      setHistoryIndex(-1);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Add user message and empty assistant message for streaming
      const newMessages: Message[] = [
        ...messages, 
        { role: "user", content: userMessage },
        { role: "assistant", content: "" }
      ];
      setMessages(newMessages);
      setIsLoading(true);
      setHasContentStarted(false); // Reset content started flag for new message
      // Don't set isStreaming yet - wait for stream to actually start
      lastRequestTime.current = now;
      
      // Immediately scroll to bottom when user sends message
      setTimeout(() => {
        scrollToBottom("smooth");
      }, 100);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      let accumulatedContent = "";

      try {
        // Only send last 10 messages to reduce token usage (excluding the empty assistant message)
        const recentMessages = newMessages.slice(-11, -1).slice(-10);
        
        // Call the streaming chat API
        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: recentMessages,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          throw new Error(`Failed to get response (${response.status}): ${errorText}`);
        }

        // Read the stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let reasoningData: { reasoning: string; thinkingTime: number } | null = null;

        if (reader) {
          // Now set streaming to true and hide loading dots
          setIsLoading(false);
          setIsStreaming(true);
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Streaming is complete, but we need to handle chart rendering
              console.log("Streaming completed, content:", accumulatedContent.substring(0, 100));
              break;
            }

            // Decode the chunk and add to accumulated content
            const chunk = decoder.decode(value, { stream: true });
            
            // Check for tool call metadata
            const toolCallMatch = chunk.match(/\[TOOL_CALL\]([\s\S]*?)\[\/TOOL_CALL\]/);
            if (toolCallMatch) {
              try {
                const toolMetadata = JSON.parse(toolCallMatch[1]);
                const dynamicMessage = getLoadingMessage(toolMetadata.toolName);
                setLoadingMessage(dynamicMessage);
                setIsLoading(true); // Show loading state during tool execution
                setIsStreaming(false);
              } catch (e) {
                console.error("Failed to parse tool call metadata:", e);
              }
              // Remove the tool call tags from content
              accumulatedContent += chunk.replace(/\[TOOL_CALL\][\s\S]*?\[\/TOOL_CALL\]/, "");
              continue; // Skip to next chunk
            }
            
            // Check for reasoning metadata (using [\s\S] instead of 's' flag for wider compatibility)
            const reasoningMatch = chunk.match(/\[REASONING\]([\s\S]*?)\[\/REASONING\]/);
            if (reasoningMatch) {
              try {
                const metadata = JSON.parse(reasoningMatch[1]);
                reasoningData = {
                  reasoning: metadata.reasoning,
                  thinkingTime: metadata.thinkingTime
                };
              } catch (e) {
                console.error("Failed to parse reasoning metadata:", e);
              }
              // Remove the reasoning tags from content
              accumulatedContent += chunk.replace(/\[REASONING\][\s\S]*?\[\/REASONING\]/, "");
            } else {
              accumulatedContent += chunk;
            }
            
            // If we get content, switch back to streaming
            if (accumulatedContent && isLoading) {
              setIsLoading(false);
              setIsStreaming(true);
              setHasContentStarted(true); // Mark that content has started
              setLoadingMessage("Thinking..."); // Reset to default
            }

            // Don't generate suggestions during streaming - wait for complete content

            // Update the last message with accumulated content, chart data, sources, and reasoning
            setMessages(prev => {
              const updated = [...prev];
              // Extract chart data from content
              const chart = extractChartData(accumulatedContent);
              updated[updated.length - 1] = {
                role: "assistant",
                content: chart.cleanContent,
                ...(chart.chartData && { chartData: chart.chartData }),
                ...(reasoningData && {
                  reasoning: reasoningData.reasoning,
                  thinkingTime: reasoningData.thinkingTime
                })
              };
              return updated;
            });
          }
        }
      } catch (err: unknown) {
        console.error("Chat error:", err);
        const error = err as { message?: string; name?: string };
        
        // Don't show error if request was aborted
        if (error.name === 'AbortError') {
          return;
        }
        
        const errorMessage = error.message || "Failed to send message. Please try again.";
        
        // Show user-friendly message for rate limits
        if (errorMessage.includes("Rate limit")) {
          setError("Too many requests. Please wait a moment and try again.");
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: "I am receiving a lot of requests right now. Please wait a moment and try again, or email us at hello@snobol.ai"
            };
            return updated;
          });
        } else {
          setError(errorMessage);
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: "I apologize, but I am having trouble responding right now. Please try again or contact us at hello@snobol.ai for assistance."
            };
            return updated;
          });
        }
      } finally {
        // Always complete streaming immediately when text is done
        setIsStreaming(false);
        setLoadingMessage("Thinking..."); // Reset to default
        abortControllerRef.current = null;
        
        // Check if we have chart data for additional loading state management
        const hasChartData = accumulatedContent && extractChartData(accumulatedContent).chartData;
        
        console.log("Streaming completed - hasChartData:", hasChartData, "isLoading:", true);
        
        if (!hasChartData) {
          // No chart data, complete loading with delay to show "Thinking..." text
          console.log("No chart data - completing loading with delay");
          setTimeout(() => {
            setIsLoading(false);
          }, 500); // Show "Thinking..." text for 500ms
        } else {
          console.log("Chart data detected - letting useEffect handle completion");
        }
        // If we have chart data, let the dedicated useEffect handle completion
        
        // Generate suggestions with AI priority
        if (accumulatedContent) {
          // Clean the content before generating suggestions
          const { cleanContent } = extractChartData(accumulatedContent);
          
          // Show loading state for suggestions
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              suggestions: ["Generating suggestions..."],
              suggestionsLoading: true
            };
            return updated;
          });

          // Try AI suggestions first, fallback only if AI fails
          generateAISuggestions(userMessage, cleanContent)
            .then((aiSuggestions) => {
              // AI suggestions succeeded - use them
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  suggestions: aiSuggestions,
                  suggestionsLoading: false
                };
                return updated;
              });
            })
            .catch((error) => {
              console.error("AI suggestions failed, using fallback:", error);
              // AI suggestions failed - use fallback
              const fallbackSuggestions = getFallbackSuggestions(userMessage, cleanContent);
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  suggestions: fallbackSuggestions,
                  suggestionsLoading: false
                };
                return updated;
              });
            });
        }
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateHistory("up");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateHistory("down");
    }
  };

  const handleChatContainerKeyDown = (e: React.KeyboardEvent) => {
    // Only handle scrolling if the input is not focused
    if (document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
      const chatContainer = e.currentTarget as HTMLElement;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          chatContainer.scrollTop -= 50;
          break;
        case 'ArrowDown':
          e.preventDefault();
          chatContainer.scrollTop += 50;
          break;
        case 'PageUp':
          e.preventDefault();
          chatContainer.scrollTop -= chatContainer.clientHeight * 0.8;
          break;
        case 'PageDown':
          e.preventDefault();
          chatContainer.scrollTop += chatContainer.clientHeight * 0.8;
          break;
        case 'Home':
          e.preventDefault();
          chatContainer.scrollTop = 0;
          break;
        case 'End':
          e.preventDefault();
          chatContainer.scrollTop = chatContainer.scrollHeight;
          break;
      }
    }
  };

  const navigateHistory = (direction: "up" | "down") => {
    if (inputHistory.length === 0) return;

    let newIndex = historyIndex;

    if (direction === "up") {
      // Move up in history (older messages)
      if (historyIndex === -1) {
        // First time pressing up, go to the most recent message
        newIndex = inputHistory.length - 1;
      } else if (historyIndex > 0) {
        // Move to previous message
        newIndex = historyIndex - 1;
      }
    } else if (direction === "down") {
      // Move down in history (newer messages)
      if (historyIndex < inputHistory.length - 1) {
        // Move to next message
        newIndex = historyIndex + 1;
      } else {
        // At the end, clear input
        newIndex = -1;
        setInputValue("");
        setHistoryIndex(-1);
        return;
      }
    }

    if (newIndex >= 0 && newIndex < inputHistory.length) {
      setInputValue(inputHistory[newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    // Wait for exit animation to complete before actually closing
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 250); // Match animation duration
  };

  const handleSuggestionClick = (suggestion: string, messageIndex: number) => {
    // Clear suggestions from the clicked message immediately
    setMessages(prev => {
      const updated = [...prev];
      updated[messageIndex] = {
        ...updated[messageIndex],
        suggestions: [] // Clear suggestions
      };
      return updated;
    });
    
    // Send the suggestion immediately
    handleSendMessage(suggestion);
  };

  const handleToolkitClick = (toolkitText: string) => {
    if (toolkitText === "Do contrarian discovery for " || toolkitText === "Do contrarian discovery for ") {
      setInputContext("Type a company, asset, or commodity to discover hidden opportunities");
      setInputValue("Do contrarian discovery for ");
    } else if (toolkitText === "Find fear opportunities of " || toolkitText === "Find fear opportunities of ") {
      setInputContext("Type a company, sector, or market to find fear-driven opportunities");
      setInputValue("Find fear opportunities of ");
    } else if (toolkitText === "Analyze ") {
      setInputContext("Type a company, stock ticker, asset, or any market commodity to analyze");
      setInputValue("Analyze ");
    }
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const length = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }, 100);
  };

  return (
    <>
      <style jsx>{`
        /* Removed smoothReveal animation to prevent conflicts with typing effect */
        
        @keyframes elegantSlideIn {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }
        
        .message-appear {
          animation: elegantSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        /* Exit animations */
        @keyframes fadeOutZoom {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.96);
          }
        }
        
        @keyframes slideOutTop {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-12px);
          }
        }
        
        @keyframes slideOutBottom {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(12px);
          }
        }
        
        .exit-overlay {
          animation: fadeOutZoom 0.25s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
        
        .exit-top {
          animation: slideOutTop 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
        
        .exit-bottom {
          animation: slideOutBottom 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
        
        /* Thinking text animation */
        @keyframes thinkingPulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes thinkingFadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .thinking-text {
          animation: thinkingPulse 1.5s ease-in-out infinite, thinkingFadeIn 0.4s ease-out forwards;
        }
        
        /* Smooth line-by-line reveal effect for streaming text */
        @keyframes lineReveal {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
            filter: blur(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }
        
        .streaming-text {
          position: relative;
        }
        
        .streaming-text p {
          animation: lineReveal 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }
        
        .streaming-text p:nth-child(1) {
          animation: none;
          opacity: 1;
          transform: none;
          filter: none;
        }
        
        .streaming-text p:nth-child(2) {
          animation-delay: 0.15s;
        }
        
        .streaming-text p:nth-child(3) {
          animation-delay: 0.25s;
        }
        
        .streaming-text p:nth-child(4) {
          animation-delay: 0.35s;
        }
        
        .streaming-text p:nth-child(5) {
          animation-delay: 0.45s;
        }
        
        .streaming-text p:nth-child(6) {
          animation-delay: 0.55s;
        }
        
        .streaming-text p:nth-child(7) {
          animation-delay: 0.65s;
        }
        
        .streaming-text p:nth-child(8) {
          animation-delay: 0.75s;
        }
        
        .streaming-text p:nth-child(9) {
          animation-delay: 0.85s;
        }
        
        .streaming-text p:nth-child(10) {
          animation-delay: 0.95s;
        }
      `}</style>
      
      {/* Chatbot Pill Button */}
      {!isOpen && (
        <div className="hidden fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2 sm:gap-2.5 bg-white hover:bg-gray-900 text-white pl-3 pr-4 sm:pl-4 sm:pr-5 py-2.5 sm:py-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl border border-gray-200 cursor-pointer"
            aria-label="Open chat"
          >
            <MessageCircle className="w-5 h-5 text-black group-hover:text-white transition-colors" />
            <span className="font-normal text-black text-md group-hover:text-white transition-colors">Ask Snobol</span>
          </button>
        </div>
      )}

      {/* Full Page Overlay */}
      {isOpen && (
        <div className={`fixed inset-0 z-[100] bg-white ${
          isClosing ? 'exit-overlay' : 'animate-in fade-in zoom-in-98 duration-600 ease-out'
        }`}>
          {/* Header */}
          <div className={`absolute top-0 py-1 left-2 right-2 z-10 bg-white md:h-20 ${
            isClosing ? 'exit-top' : 'animate-in slide-in-from-top-2 fade-in duration-500 ease-out'
          }`} style={{
            background: 'linear-gradient(to bottom, white 0%, rgba(255,255,255,0.8) 30%, transparent 100%)'
          }}>
            <div className="max-w-full mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image 
                  src="/snobol-ai-logo.png" 
                  alt="Snobol AI" 
                  width={89} 
                  height={24}
                  className="h-5 sm:h-6 w-auto"
                />
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 p-1 sm:p-1.5 rounded-full hover:bg-gray-100 transition-colors -mr-1 cursor-pointer"
                aria-label="Close chat"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            data-chat-container
            tabIndex={0}
            onKeyDown={handleChatContainerKeyDown}
            className={`h-full pt-12 sm:pt-14 pb-28 sm:pb-32 overflow-y-auto focus:outline-none ${
            isClosing ? 'animate-out fade-out duration-200' : 'animate-in fade-in duration-600 delay-150 ease-out'
          }`}>
            <div className="max-w-3xl mx-auto px-3 sm:px-4 space-y-4 sm:space-y-6 py-4 sm:py-6">
              {messages.map((message, index) => {
                // Hide the empty assistant message only during initial loading (before any content starts)
                const isEmptyAssistantMessage = message.role === "assistant" && message.content === "" && index === messages.length - 1;
                // Only hide if it's truly empty AND we're in initial loading state AND content hasn't started yet
                if (isEmptyAssistantMessage && isLoading && !isStreaming && !hasContentStarted) {
                  return null;
                }
                
                // Check if this is the last assistant message with suggestions
                const lastAssistantWithSuggestions = getLastAssistantMessageWithSuggestions();
                const isLatestSuggestion = index === lastAssistantWithSuggestions;
                
                return (
                  <div key={index} data-message-index={index}>
                    <div
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "user" ? (
                        <div 
                          className="bg-gray-100 text-black rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-[14px] sm:text-sm max-w-[85%] sm:max-w-[75%] break-words message-appear"
                          style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }}
                        >
                          {message.content}
                        </div>
                      ) : (
                        <div 
                          className={`bg-transparent rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base text-gray-800 max-w-full break-words relative ${
                            isStreaming && index === messages.length - 1 && message.content !== "" ? '' : 'message-appear'
                          }`}
                          style={{ 
                            animationDelay: isStreaming && index === messages.length - 1 ? '0ms' : `${Math.min(index * 40, 200)}ms`
                          }}
                        >
                        {/* Thinking Process Section */}
                        {message.reasoning && message.thinkingTime && (
                          <div className="mb-3 sm:mb-4 border-b border-gray-200 pb-3">
                            <button
                              onClick={() => {
                                setExpandedThinking(prev => {
                                  const next = new Set(prev);
                                  if (next.has(index)) {
                                    next.delete(index);
                                  } else {
                                    next.add(index);
                                  }
                                  return next;
                                });
                              }}
                              className="flex items-center justify-between w-full text-left hover:opacity-70 transition-opacity"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-medium text-gray-600">
                                  Thinking process
                                </span>
                                <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
                                  {(message.thinkingTime / 1000).toFixed(1)}s
                                </span>
                              </div>
                              {expandedThinking.has(index) ? (
                                <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                              )}
                            </button>
                            
                            {expandedThinking.has(index) && (
                              <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 bg-gray-50 rounded-lg p-2 sm:p-3 whitespace-pre-wrap animate-in slide-in-from-top-2 fade-in duration-200">
                                {message.reasoning}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {isStreaming && index === messages.length - 1 ? (
                          <div className="streaming-text">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => (
                                  <p className="mb-3 sm:mb-4 last:mb-0 leading-relaxed">{children}</p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="space-y-2 sm:space-y-2.5 mb-3 sm:mb-4 last:mb-0 ml-1">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="space-y-2 sm:space-y-2.5 mb-3 sm:mb-4 last:mb-0 ml-1 list-decimal list-inside">{children}</ol>
                                ),
                                li: ({ children }) => (
                                  <li className="flex items-start gap-2 leading-relaxed">
                                    <span className="text-gray-500 mt-1 select-none text-sm">•</span>
                                    <span className="flex-1 break-words">{children}</span>
                                  </li>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-gray-900">{children}</strong>
                                ),
                                em: ({ children }) => (
                                  <em className="italic">{children}</em>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-5 first:mt-0 text-base sm:text-lg">{children}</h3>
                                ),
                                h4: ({ children }) => (
                                  <h4 className="font-semibold text-gray-900 mb-2 sm:mb-2.5 mt-3 sm:mt-4 first:mt-0 text-sm sm:text-base">{children}</h4>
                                ),
                                code: ({ children }) => (
                                  <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono break-all">{children}</code>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-2 border-gray-300 pl-3 italic my-2 sm:my-3 text-sm sm:text-base opacity-90">{children}</blockquote>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <p className="mb-3 sm:mb-4 last:mb-0 leading-relaxed">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="space-y-2 sm:space-y-2.5 mb-3 sm:mb-4 last:mb-0 ml-1">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="space-y-2 sm:space-y-2.5 mb-3 sm:mb-4 last:mb-0 ml-1 list-decimal list-inside">{children}</ol>
                              ),
                              li: ({ children }) => (
                                <li className="flex items-start gap-2 leading-relaxed">
                                  <span className="text-gray-500 mt-1 select-none text-sm">•</span>
                                  <span className="flex-1 break-words">{children}</span>
                                </li>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-gray-900">{children}</strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic">{children}</em>
                              ),
                              h3: ({ children }) => (
                                <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-5 first:mt-0 text-base sm:text-lg">{children}</h3>
                              ),
                              h4: ({ children }) => (
                                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-2.5 mt-3 sm:mt-4 first:mt-0 text-sm sm:text-base">{children}</h4>
                              ),
                              code: ({ children }) => (
                                <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono break-all">{children}</code>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-2 border-gray-300 pl-3 italic my-2 sm:my-3 text-sm sm:text-base opacity-90">{children}</blockquote>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        )}
                        
                        {/* Render TradingView chart RIGHT AFTER the main analysis text for stock analysis */}
                        {message.chartData && message.chartData.type === 'stock_chart' && message.chartData.symbol && (
                          <div className="w-full mt-4 message-appear" style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }}>
                            <TradingViewWidget symbol={message.chartData.symbol} height={420} />
                          </div>
                        )}
                        
                      </div>
                    )}
                  </div>
                  
                  {/* Suggestion Pills Below Message */}
                  {message.role === "assistant" && message.suggestions && message.suggestions.length > 0 && (
                    <div className="flex justify-start mt-3">
                      <div className="max-w-[85%] sm:max-w-full flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300 delay-100">
                        {message.suggestions.map((suggestion, suggestionIndex) => (
                          <button
                            key={suggestionIndex}
                            onClick={() => handleSuggestionClick(suggestion, index)}
                            disabled={isLoading || isStreaming}
                            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full text-xs sm:text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                              isLatestSuggestion
                                ? 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer'
                                : 'bg-gray-white hover:bg-gray-50 text-gray-400 hover:text-gray-700 border border-gray-200 hover:border-gray-300 opacity-60 hover:opacity-100 hover:shadow-sm cursor-pointer'
                            } ${message.suggestionsLoading ? 'opacity-75' : ''}`}
                          >
                            <span className="line-clamp-1">{suggestion}</span>
                            {message.suggestionsLoading && suggestionIndex === 0 && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Toolkit Pills Below Every 3 Suggestions - Only show on latest message */}
                  {message.role === "assistant" && message.suggestions && message.suggestions.length > 0 && index === messages.length - 1 && (
                    <div className="flex justify-start mt-4">
                      <div className="max-w-[85%] sm:max-w-full flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300 delay-200">
                         <button
                           onClick={() => handleToolkitClick("Do contrarian discovery for ")}
                           disabled={isLoading || isStreaming}
                           className="px-2 py-1 rounded-full text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-700 border border-gray-200 hover:border-gray-400 hover:shadow-sm cursor-pointer"
                         >
                           <span className="line-clamp-1">🔍 Do contrarian discovery</span>
                         </button>
                         <button
                           onClick={() => handleToolkitClick("Find fear opportunities of ")}
                           disabled={isLoading || isStreaming}
                           className="px-2 py-1 rounded-full text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-700 border border-gray-200 hover:border-gray-400 hover:shadow-sm cursor-pointer"
                         >
                           <span className="line-clamp-1">⚡ Find fear opportunities</span>
                         </button>
                         <button
                           onClick={() => handleToolkitClick("Analyze ")}
                           disabled={isLoading || isStreaming}
                           className="px-2 py-1 rounded-full text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-700 border border-gray-200 hover:border-gray-400 hover:shadow-sm cursor-pointer"
                         >
                           <span className="line-clamp-1">📈 Analyze</span>
                         </button>
                      </div>
                    </div>
                  )}
                </div>
              );
              })}

              {isLoading && !isStreaming && (
                <div className="flex flex-col items-start gap-2">
                  <div className="flex justify-start">
                    <div className="bg-transparent rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 max-w-full message-appear">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" />
                        <span
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm font-medium ml-3 sm:ml-4 flex items-center gap-1.5">
                    <span className="thinking-text text-gray-500">
                      {loadingMessage}
                    </span>
                    <span className="text-gray-400 tabular-nums">
                      ({thinkingDuration}s)
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-white ${
              isClosing ? 'exit-bottom' : 'animate-in slide-in-from-bottom-2 fade-in duration-600 delay-100 ease-out'
            }`}
            style={{ 
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
            }}
          >
            <div className="max-w-3xl mx-auto px-3 sm:px-4">
              {error && (
                <div className="mb-2 sm:mb-3 px-3 py-2 sm:px-4 bg-red-100 text-red-700 rounded-lg text-xs sm:text-sm">
                  {error}
                </div>
              )}
              
              {/* Context info text above input */}
              {inputContext && (
                <div className="mb-2 px-3 py-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  {inputContext}
                </div>
              )}
              
              
              
              <div 
                className="flex items-end gap-2 sm:gap-2.5 bg-white border border-gray-300 rounded-[1.625em] p-2 sm:p-2.5"
                onTouchStart={() => {
                  // Ensure textarea gets focus when touching the input container
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                  }
                }}
              >
                <div className="flex-1 relative">
                   <textarea
                     ref={textareaRef}
                     value={inputValue}
                     onChange={(e) => {
                       setInputValue(e.target.value);
                       
                       const currentValue = e.target.value;
                       
                       // Show context when user types the template text (case insensitive)
                       const lowerValue = currentValue.toLowerCase();
                       
                       if (lowerValue.includes("do contrarian discovery for ") || lowerValue.includes("do contrarian discovery for")) {
                         setInputContext("Type a company, stock ticker, asset, or any market commodity to discover hidden opportunities");

                       } else if (lowerValue.includes("find fear opportunities of ") || lowerValue.includes("find fear opportunities of")) {
                         setInputContext("Type a company, sector, or market to find fear-driven opportunities");

                       } else if (lowerValue.includes("analyze ") || lowerValue.includes("analyze")) {
                         setInputContext("Type a company, stock ticker, asset, or any market commodity to analyze");

                       } else if (lowerValue.includes("do contrarian discovery")) {
                         setInputContext("Type a company, stock ticker, asset, or any market commodity to discover hidden opportunities");

                       } else if (lowerValue.includes("find fear opportunities")) {
                         setInputContext("Type a company, sector, or market to find fear-driven opportunities");

                       } else if (!lowerValue.includes("do contrarian discovery") && !lowerValue.includes("find fear opportunities")) {
                         setInputContext("");
                       }
                     }}
                     onKeyDown={handleKeyPress}
                     onTouchStart={(e) => {
                       // Force focus on touch for iOS Safari
                       e.currentTarget.focus();
                     }}
                     onTouchEnd={() => {
                       // Only prevent default for specific cases that might interfere with typing
                       // Don't prevent all touch events as it can interfere with other elements
                     }}
                     onClick={(e) => {
                       // Ensure focus on click
                       e.currentTarget.focus();
                     }}
                     placeholder="Message Snobol AI..."
                     rows={1}
                     disabled={isLoading || isStreaming}
                     className={`w-full py-2 sm:py-2 bg-transparent resize-none focus:outline-none text-base sm:text-base leading-relaxed disabled:opacity-50 overflow-y-auto relative z-10 touch-manipulation ${
                       (() => {
                         const lowerValue = inputValue.toLowerCase();
                         return lowerValue.includes("do contrarian discovery for ") || lowerValue.includes("do contrarian discovery for") ||   
                                lowerValue.includes("find fear opportunities of ") || lowerValue.includes("find fear opportunities of") || 
                                lowerValue.includes("analyze ") || lowerValue.includes("analyze");
                       })()
                       ? 'pl-4 pr-2.5 md:pl-5 md:pr-3' : 'px-2.5 sm:px-3'
                     }`}
                     style={{ 
                       minHeight: "40px", 
                       maxHeight: "120px",
                       WebkitTouchCallout: "none",
                       WebkitUserSelect: "text",
                       userSelect: "text",
                       fontSize: "16px",
                       WebkitAppearance: "none",
                       borderRadius: "0"
                     }}
                     autoComplete="off"
                     autoCorrect="off"
                     autoCapitalize="off"
                     spellCheck="false"
                   />
                  
                   {/* Text highlighter overlay */}
                   {inputValue && (
                     <div className="absolute inset-0 pointer-events-none z-20 px-2.5 py-2 sm:px-3 sm:py-2 text-base sm:text-base leading-relaxed whitespace-pre-wrap overflow-hidden" style={{ marginLeft: '-6px' }}>
                      {(() => {
                        const lowerValue = inputValue.toLowerCase();
                        
                        // Highlight "Do contrarian discovery for " (case insensitive)
                        if (lowerValue.includes("do contrarian discovery for ")) {
                          const index = lowerValue.indexOf("do contrarian discovery for ");
                          const before = inputValue.substring(0, index);
                          const highlight = inputValue.substring(index, index + "do contrarian discovery for".length);
                          const after = inputValue.substring(index + "do contrarian discovery for".length);
                          return (
                            <>
                              <span className="text-transparent">{before}</span>
                               <span className="bg-gray-200 rounded pl-1.5 pr-1.5 md:pr-2 py-1 text-gray-800">{highlight}</span>
                              <span className="text-transparent">{after}</span>
                            </>
                          );
                        }
                        
                        // Highlight "Find fear opportunities of " (case insensitive)
                        if (lowerValue.includes("find fear opportunities of ")) {
                          const index = lowerValue.indexOf("find fear opportunities of ");
                          const before = inputValue.substring(0, index);
                          const highlight = inputValue.substring(index, index + "find fear opportunities of".length);
                          const after = inputValue.substring(index + "find fear opportunities of".length);
                          return (
                            <>
                              <span className="text-transparent">{before}</span>
                               <span className="bg-gray-200 rounded pl-1.5 pr-1.5 md:pr-2 py-1 text-gray-800">{highlight}</span>
                              <span className="text-transparent">{after}</span>
                            </>
                          );
                        }

                        // Highlight "Analyze " (case insensitive)
                        if (lowerValue.includes("analyze ")) {
                          const index = lowerValue.indexOf("analyze ");
                          const before = inputValue.substring(0, index);
                          const highlight = inputValue.substring(index, index + "analyze".length);
                          const after = inputValue.substring(index + "analyze".length);
                          return (
                            <>
                              <span className="text-transparent">{before}</span>
                              <span className="bg-gray-200 rounded pl-1.5 pr-1.5 md:pr-2 py-1 text-gray-800">{highlight}</span>
                              <span className="text-transparent">{after}</span>
                            </>
                          );
                        }
                        
                        return <span className="text-transparent">{inputValue}</span>;
                      })()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => (isLoading || isStreaming) ? handleStopStreaming() : handleSendMessage()}
                  onTouchStart={(e) => {
                    // Ensure touch events work properly on mobile
                    e.stopPropagation();
                  }}
                  onTouchEnd={(e) => {
                    // Prevent event bubbling that might interfere with click
                    e.stopPropagation();
                  }}
                  disabled={!isLoading && !isStreaming && !inputValue.trim()}
                  className={`flex justify-center items-center p-2 w-10 h-10 sm:p-2.5 rounded-full transition-colors self-end z-30 touch-manipulation ${
                    isLoading || isStreaming 
                      ? "bg-black text-white hover:bg-gray-900 cursor-pointer" 
                      : "bg-gray-900 text-white hover:bg-gray-700 disabled:bg-gray-200 disabled:cursor-not-allowed"
                  }`}
                  aria-label={isLoading || isStreaming ? "Stop streaming" : "Send message"}
                >
                  {isLoading || isStreaming ? (
                    <Square className="w-3 h-3 sm:w-3 sm:h-3 bg-white rounded-xs" />
                  ) : (
                    <ArrowUp className="w-5 h-5 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
              <p className="text-[10px] sm:text-[11px] text-gray-400 bg-white text-center mt-1.5 sm:mt-2 px-2 pt-2">
                Snobol AI can make mistakes. Always double-check important info.
              </p>
            </div>
          </div>
        </div>

      )}
    </>
  );
});

ChatbotPill.displayName = 'ChatbotPill';

export default ChatbotPill;

