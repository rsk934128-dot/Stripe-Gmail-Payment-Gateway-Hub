import React, { useState, useRef, useEffect } from 'react';
import { type FunctionDeclaration, Type } from '@google/genai';
import {
  Bot,
  Send,
  Sparkles,
  Zap,
  Code2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Layers,
  ArrowRight,
  CreditCard,
  Radio,
  FileCode,
  Smartphone,
  X,
  Play,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';

// ============================================================================
// 1. Gemini AI SDK Tool Registration Pattern (@google/genai)
// ============================================================================

/**
 * Function Declaration Schema for 'generate_checkout_link'.
 * Defines parameters and descriptions so Gemini 3 / Gemini 2.5 models
 * accurately map natural language buying intent to Stripe checkout generation.
 */
export const generateCheckoutLinkDeclaration: FunctionDeclaration = {
  name: 'generate_checkout_link',
  description:
    'Creates a secure Stripe Checkout Session or 1-Click Stripe Link payment URL when a customer intends or requests to buy, purchase, order, pay for, or subscribe to any product, package, or plan. Call this tool immediately whenever user expresses purchase intent (e.g., "I want to buy Pro Plan", "Generate link for $29", "আমি কিনতে চাই"). Never ask for credit card numbers directly.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      item_id: {
        type: Type.STRING,
        description:
          "The exact product name, subscription package, or service identifier requested by the user (e.g., 'Pro Plan', 'Starter Kit', '10,000 AI Credits', 'Enterprise Tier'). Maps to the Stripe Checkout line item name.",
      },
      amount: {
        type: Type.NUMBER,
        description:
          'The numeric purchase price in USD (e.g., 29.99, 9.99, 15.0, 49.0). Must be a positive decimal number representing the unit price.',
      },
      customer_email: {
        type: Type.STRING,
        description:
          "The customer's email address for receipt delivery, Stripe customer linking, and 1-Click SMS authentication with Stripe Link.",
      },
      currency: {
        type: Type.STRING,
        description: "The 3-letter ISO currency code. Defaults to 'usd'.",
      },
    },
    required: ['item_id', 'amount'],
  },
};

/**
 * Standard Gemini AI SDK Tool Registration Array.
 * Pass this into ai.models.generateContent({ config: { tools: geminiCheckoutTools } })
 */
export const geminiCheckoutTools = [
  {
    functionDeclarations: [generateCheckoutLinkDeclaration],
  },
];

// Alias for backwards compatibility
export const GENERATE_CHECKOUT_LINK_TOOL = generateCheckoutLinkDeclaration;

/**
 * 2. Explicit JSON Schema for 'generate_checkout_link' Tool
 * Defines the parameters schema including item_id and amount as required properties.
 */
export const GENERATE_CHECKOUT_LINK_JSON_SCHEMA = {
  type: 'object',
  title: 'generate_checkout_link',
  description:
    'Generates a secure Stripe Checkout Session URL with 1-Click Stripe Link enabled whenever a customer expresses intent to buy, order, pay for, or purchase any package, product, or subscription.',
  properties: {
    item_id: {
      type: 'string',
      description: 'The specific product or package name requested by the user (e.g., Pro Plan, Starter Kit, AI Credits Pack)',
    },
    amount: {
      type: 'number',
      description: 'The numeric price in USD (e.g., 29.99, 9.99, 49.0)',
    },
    customer_email: {
      type: 'string',
      description: 'The customer email address for receipt delivery and 1-Click Stripe Link authentication',
    },
  },
  required: ['item_id', 'amount'],
} as const;

export const generateCheckoutLinkJSONSchema = GENERATE_CHECKOUT_LINK_JSON_SCHEMA;

// Parameter Parser Utility for 'generate_checkout_link' Tool
export interface GenerateCheckoutLinkArgs {
  item_id: string;
  amount: number;
  customer_email: string;
}

export const parseCheckoutLinkParameters = (
  rawArgs: any,
  defaultEmail: string = 'customer@example.com'
): GenerateCheckoutLinkArgs => {
  let item_id = 'Pro Package';
  if (typeof rawArgs?.item_id === 'string' && rawArgs.item_id.trim()) {
    item_id = rawArgs.item_id.trim();
  } else if (typeof rawArgs?.itemId === 'string' && rawArgs.itemId.trim()) {
    item_id = rawArgs.itemId.trim();
  }

  let amount = 29.0;
  if (typeof rawArgs?.amount === 'number' && !isNaN(rawArgs.amount) && rawArgs.amount > 0) {
    amount = rawArgs.amount;
  } else if (typeof rawArgs?.amount === 'string') {
    const parsed = parseFloat(rawArgs.amount.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
    }
  }

  let customer_email = defaultEmail;
  if (typeof rawArgs?.customer_email === 'string' && rawArgs.customer_email.trim()) {
    customer_email = rawArgs.customer_email.trim();
  } else if (typeof rawArgs?.customerEmail === 'string' && rawArgs.customerEmail.trim()) {
    customer_email = rawArgs.customerEmail.trim();
  }

  return { item_id, amount, customer_email };
};

export interface ActivePaymentSession {
  sessionId: string;
  itemId: string;
  amount: number;
  checkoutUrl: string;
  isSimulation: boolean;
  timestamp: string;
}

interface ToolCallResult {
  status: string;
  checkoutUrl: string;
  sessionId: string;
  itemId: string;
  amount: number;
  isSimulation: boolean;
  currency?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  toolCall?: {
    name: string;
    args: {
      item_id: string;
      amount: number;
      customer_email?: string;
    };
    result: ToolCallResult;
  };
}

interface AIAgentTabProps {
  serverKeyConfigured: boolean;
  manualSecretKey: string;
  lang?: 'bn' | 'en';
}

export const AIAgentTab: React.FC<AIAgentTabProps> = ({
  serverKeyConfigured,
  manualSecretKey,
  lang = 'bn',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'model',
      content:
        lang === 'bn'
          ? 'স্বাগতম! আমি আপনার ইন্টেলিজেন্ট এআই পেমেন্ট অ্যাসিস্ট্যান্ট (Stripe AI Agent)।\n\nআপনি চ্যাটে যেকোনো প্যাকেজ কিনতে চাইলে (যেমন: "আমি প্রো প্ল্যান $29 কিনতে চাই"), আমি স্বয়ংক্রিয়ভাবে Function Calling (Tool Use) এর মাধ্যমে `generate_checkout_link` টুল ট্রিগার করে সরাসরি একটি ক্লিকেবল পেমেন্ট বাটন তৈরি করে দেব।'
          : 'Welcome! I am your AI Payment Assistant powered by Function Calling.\n\nTell me which package you want to purchase (e.g., "I want to buy the Pro Plan for $29"), and I will trigger the `generate_checkout_link` tool to return a clickable, payment-ready button directly inside the chat.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('rubelbank92@gmail.com');
  const [activeCodeTab, setActiveCodeTab] = useState<'python' | 'node' | 'schema' | 'architecture'>('python');
  const [copiedCode, setCopiedCode] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  // Active Payment Session State for rendering functional Pay Now button
  const [activePaymentSession, setActivePaymentSession] = useState<ActivePaymentSession | null>(null);

  // In-app checkout webview modal state
  const [activeCheckoutSession, setActiveCheckoutSession] = useState<ToolCallResult | null>(null);
  const [isProcessingInAppPayment, setIsProcessingInAppPayment] = useState(false);
  const [smsVerificationCode, setSmsVerificationCode] = useState('424242');

  // Track paid session IDs
  const [paidSessionIds, setPaidSessionIds] = useState<string[]>([]);

  // Manual Tool Trigger Box state
  const [showToolDrawer, setShowToolDrawer] = useState(false);
  const [customItemId, setCustomItemId] = useState('AI Developer Pass');
  const [customAmount, setCustomAmount] = useState('19.99');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || inputMessage).trim();
    if (!promptText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (manualSecretKey) {
        headers['x-stripe-secret-key'] = manualSecretKey.trim();
      }

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: promptText,
          customerEmail,
          tools: [GENERATE_CHECKOUT_LINK_TOOL],
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      // =========================================================================
      // 1. Intercept AI Response: Check for the presence of 'function_calls'
      // =========================================================================
      const interceptedFunctionCalls: any[] = [];

      // Check array variants: 'function_calls' or 'functionCalls'
      if (Array.isArray(data.function_calls)) {
        interceptedFunctionCalls.push(...data.function_calls);
      }
      if (Array.isArray(data.functionCalls)) {
        interceptedFunctionCalls.push(...data.functionCalls);
      }

      // Check singular variants: 'function_call' or 'functionCall'
      if (data.function_call) interceptedFunctionCalls.push(data.function_call);
      if (data.functionCall) interceptedFunctionCalls.push(data.functionCall);

      // Check candidates and parts if directly passed from Gemini API
      if (data.candidates?.[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.function_call) interceptedFunctionCalls.push(part.function_call);
          if (part.functionCall) interceptedFunctionCalls.push(part.functionCall);
        }
      }

      // Check toolCall field
      if (data.toolCall) {
        interceptedFunctionCalls.push(data.toolCall);
      }

      // Check if 'generate_checkout_link' is invoked in any of the function_calls
      const checkoutInvocation = interceptedFunctionCalls.find(
        (call) => call && (call.name === 'generate_checkout_link' || call.name?.includes('checkout'))
      );

      type ChatToolCall = NonNullable<ChatMessage['toolCall']>;
      let toolCallData: ChatToolCall | undefined = data.toolCall || undefined;

      // =========================================================================
      // 2. If 'generate_checkout_link' is invoked, perform the API call to backend
      // =========================================================================
      if (checkoutInvocation) {
        if (data.toolCall?.result?.checkoutUrl) {
          toolCallData = data.toolCall;
        } else {
          const rawArgs = checkoutInvocation.args || checkoutInvocation.arguments || {};
          const parsed = parseCheckoutLinkParameters(rawArgs, customerEmail);

          // Perform the API call to the backend (/api/generate-checkout-link)
          const linkRes = await fetch('/api/generate-checkout-link', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              item_id: parsed.item_id,
              amount: parsed.amount,
              customer_email: parsed.customer_email,
            }),
          });
          const linkPayload = await linkRes.json();

          toolCallData = {
            name: 'generate_checkout_link',
            args: parsed,
            result: {
              status: 'success',
              checkoutUrl: linkPayload.checkout_url || linkPayload.checkoutUrl,
              sessionId: linkPayload.session_id || linkPayload.sessionId,
              itemId: linkPayload.item_id || parsed.item_id,
              amount: linkPayload.amount || parsed.amount,
              isSimulation: linkPayload.isSimulation || false,
            },
          };
        }
      } else if (!toolCallData && data.action === 'payment_link_generated' && data.checkoutUrl) {
        const parsed = parseCheckoutLinkParameters(data.args || {}, customerEmail);
        toolCallData = {
          name: 'generate_checkout_link',
          args: parsed,
          result: {
            status: 'success',
            checkoutUrl: data.checkoutUrl,
            sessionId: data.sessionId || 'cs_sess_' + Date.now(),
            itemId: parsed.item_id,
            amount: parsed.amount,
            isSimulation: false,
          },
        };
      }

      // =========================================================================
      // 3. Update the state to display the resulting payment URL
      // =========================================================================
      if (toolCallData?.result?.checkoutUrl) {
        setActivePaymentSession({
          sessionId: toolCallData.result.sessionId,
          itemId: toolCallData.result.itemId,
          amount: toolCallData.result.amount,
          checkoutUrl: toolCallData.result.checkoutUrl,
          isSimulation: toolCallData.result.isSimulation,
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      // If the Gemini model returned a function_call instead of text, synthesize response
      let messageContent = (data.aiResponse || data.text || '').trim();
      if (!messageContent && toolCallData) {
        messageContent =
          lang === 'bn'
            ? `এআই রেসপন্সে \`function_calls\` ইন্টারসেপ্ট করা হয়েছে: \`${toolCallData.name}\`। "${toolCallData.result.itemId}" ($${toolCallData.result.amount.toFixed(2)}) প্যাকেজের জন্য ব্যাকএন্ড API কল সফল হয়েছে এবং পেমেন্ট URL প্রস্তুত করা হয়েছে:`
            : `Intercepted \`function_calls\` (\`${toolCallData.name}\`). Executed backend API call and retrieved Stripe payment URL for "${toolCallData.result.itemId}" ($${toolCallData.result.amount.toFixed(2)} USD):`;
      }

      const modelMsg: ChatMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        content: messageContent || (lang === 'bn' ? 'পেমেন্ট রিকোয়েস্ট প্রসেস করা হয়েছে।' : 'Payment request processed.'),
        timestamp: new Date().toLocaleTimeString(),
        toolCall: toolCallData,
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'model',
          content:
            lang === 'bn'
              ? 'সার্ভারে সংযোগে কিছুটা সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
              : 'Error communicating with AI Agent server. Please try again.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Direct manual trigger of generate_checkout_link function
  const handleManualToolTrigger = async () => {
    const parsed = parseCheckoutLinkParameters({ item_id: customItemId, amount: customAmount }, customerEmail);
    setShowToolDrawer(false);
    setIsLoading(true);

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: `[Tool Invocation]: generate_checkout_link({ item_id: "${parsed.item_id}", amount: ${parsed.amount} })`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (manualSecretKey) headers['x-stripe-secret-key'] = manualSecretKey.trim();

      const res = await fetch('/api/generate-checkout-link', {
        method: 'POST',
        headers,
        body: JSON.stringify(parsed),
      });
      const linkData = await res.json();

      const toolResult: ToolCallResult = {
        status: 'success',
        checkoutUrl: linkData.checkout_url || linkData.checkoutUrl,
        sessionId: linkData.session_id || linkData.sessionId,
        itemId: parsed.item_id,
        amount: parsed.amount,
        isSimulation: linkData.isSimulation || false,
      };

      // Update state for active payment session
      setActivePaymentSession({
        sessionId: toolResult.sessionId,
        itemId: toolResult.itemId,
        amount: toolResult.amount,
        checkoutUrl: toolResult.checkoutUrl,
        isSimulation: toolResult.isSimulation,
        timestamp: new Date().toLocaleTimeString(),
      });

      const modelMsg: ChatMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        content:
          lang === 'bn'
            ? `এআই এজেন্ট সফলভাবে \`generate_checkout_link\` টুল এক্সিকিউট করেছে। "${parsed.item_id}" ($${parsed.amount}) এর জন্য নিরাপদ পেমেন্ট লিংক তৈরি করা হয়েছে:`
            : `AI Agent successfully invoked \`generate_checkout_link\` tool. Your secure payment link for "${parsed.item_id}" ($${parsed.amount}) is ready:`,
        timestamp: new Date().toLocaleTimeString(),
        toolCall: {
          name: 'generate_checkout_link',
          args: parsed,
          result: toolResult,
        },
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'model',
          content: 'Failed to execute generate_checkout_link tool on backend.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate Webhook confirmation
  const handleSimulateWebhook = async (sessionId: string, itemId: string, amount: number) => {
    setWebhookStatus(lang === 'bn' ? 'ওয়েবহুক ইভেন্ট পাঠানো হচ্ছে...' : 'Simulating Webhook Event...');
    try {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `evt_sim_${Date.now()}`,
          type: 'checkout.session.completed',
          data: {
            object: {
              id: sessionId,
              customer_email: customerEmail,
              amount_total: Math.round(amount * 100),
              currency: 'usd',
              payment_status: 'paid',
              metadata: { item_id: itemId },
            },
          },
        }),
      });

      if (res.ok) {
        setPaidSessionIds((prev) => (prev.includes(sessionId) ? prev : [...prev, sessionId]));
        setWebhookStatus(
          lang === 'bn'
            ? `✅ Webhook Success! ${itemId} এর জন্য পেমেন্ট সফল ও ডাটাবেজ আপডেট হয়েছে।`
            : `✅ Webhook Success! Payment verified for ${itemId}. Customer account updated.`
        );
        // Add notification in chat
        setMessages((prev) => [
          ...prev,
          {
            id: `wh_${Date.now()}`,
            role: 'model',
            content:
              lang === 'bn'
                ? `🎉 [Stripe Webhook Confirmed]: পেমেন্ট সফল হয়েছে! সেশন আইডি \`${sessionId}\` এর জন্য অ্যাকাউন্ট অ্যাক্টিভেশন সম্পন্ন।`
                : `🎉 [Stripe Webhook Confirmed]: Payment confirmed for session \`${sessionId}\`. Account successfully activated.`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } catch (e) {
      setWebhookStatus(lang === 'bn' ? 'ওয়েবহুক পাঠাতে ত্রুটি হয়েছে' : 'Webhook simulation failed');
    }
    setTimeout(() => setWebhookStatus(null), 5000);
  };

  // Complete in-app payment simulation
  const handleConfirmInAppPayment = async () => {
    if (!activeCheckoutSession) return;
    setIsProcessingInAppPayment(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Trigger webhook confirmation for this session
    await handleSimulateWebhook(
      activeCheckoutSession.sessionId,
      activeCheckoutSession.itemId,
      activeCheckoutSession.amount
    );

    setIsProcessingInAppPayment(false);
    setActiveCheckoutSession(null);
  };

  const copyCodeToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const pythonFastAPICode = `# main.py - Complete AI Agent Payment Backend with FastAPI & Gemini Function Calling
import os
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Header
from pydantic import BaseModel
import stripe
from google import genai
from google.genai import types

# 1. API Keys Configuration
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_your_stripe_key")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_your_webhook_secret")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your_gemini_api_key")

ai_client = genai.Client(api_key=GEMINI_API_KEY)
app = FastAPI(title="AI Agent Payment Backend", version="1.0")

# 2. Tool / Function Declaration for Stripe Checkout & Link
def generate_checkout_link(item_id: str, amount: float, customer_email: Optional[str] = None) -> dict:
    """Stripe Checkout Session বা 1-Click Link তৈরি করে"""
    try:
        unit_amount = int(amount * 100) # cents
        session = stripe.checkout.sessions.create(
            payment_method_types=['card', 'link'],  # Stripe Link enabled
            customer_email=customer_email,
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {'name': item_id},
                    'unit_amount': unit_amount,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url='https://yourapp.com/payment-success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='https://yourapp.com/payment-cancel',
        )
        return {"status": "success", "checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 3. AI Chat Endpoint with Function Calling
class ChatRequest(BaseModel):
    message: str
    customer_email: Optional[str] = "customer@example.com"

@app.post("/api/chat")
async def chat_with_agent(req: ChatRequest):
    payment_tool = types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="generate_checkout_link",
                description="পণ্য বা সাবস্ক্রিপশন বিক্রির জন্য Stripe পেমেন্ট লিংক তৈরি করে। ব্যবহারকারী কিনতে চাইলে এটি কল করতে হবে।",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "item_id": types.Schema(type=types.Type.STRING, description="পণ্যের নাম বা প্যাকেজ আইডি"),
                        "amount": types.Schema(type=types.Type.NUMBER, description="মূল্য ডলারে"),
                    },
                    required=["item_id", "amount"],
                ),
            )
        ]
    )

    response = ai_client.models.generate_content(
        model='gemini-2.5-flash',
        contents=req.message,
        config=types.GenerateContentConfig(
            tools=[payment_tool],
            system_instruction="তুমি একজন হেল্পফুল এআই অ্যাসিস্ট্যান্ট। ব্যবহারকারী কিছু কিনতে চাইলে কখনো কার্ড নম্বর চাইবে না, সরাসরি generate_checkout_link টুল কল করবে।"
        )
    )

    if response.function_calls:
        call = response.function_calls[0]
        if call.name == "generate_checkout_link":
            result = generate_checkout_link(
                item_id=call.args.get("item_id"),
                amount=call.args.get("amount"),
                customer_email=req.customer_email
            )
            return {
                "ai_response": f"আপনার পেমেন্ট লিংক প্রস্তুত: {result.get('checkout_url')}",
                "checkout_url": result.get('checkout_url'),
                "action": "payment_link_generated"
            }

    return {"ai_response": response.text, "action": "normal_chat"}

# 4. Stripe Webhook Listener
@app.post("/api/webhook")
async def stripe_webhook(request: Request, stripe_signature: Optional[str] = Header(None)):
    payload = await request.body()
    event = stripe.Webhook.construct_event(payload, stripe_signature, STRIPE_WEBHOOK_SECRET)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        # Grant user access in database
        print(f"Payment verified for {session.get('customer_email')}")

    return {"status": "success"}`;

  const nodeExpressCode = `// server-api.ts - Node.js Express & @google/genai Function Calling
import express from 'express';
import Stripe from 'stripe';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Tool Declaration for Gemini Function Calling
const checkoutTool = {
  name: 'generate_checkout_link',
  description: 'Creates a Stripe Checkout Session with Stripe Link enabled.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      item_id: { type: Type.STRING, description: 'Package name or ID' },
      amount: { type: Type.NUMBER, description: 'Amount in USD' }
    },
    required: ['item_id', 'amount']
  }
};

// 2. Chat Endpoint
app.post('/api/ai-chat', async (req, res) => {
  const { message, customerEmail } = req.body;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: message,
    config: {
      systemInstruction: 'You are an AI payment assistant. Never ask for credit card numbers. Call generate_checkout_link when a user wants to buy.',
      tools: [{ functionDeclarations: [checkoutTool] }]
    }
  });

  if (response.functionCalls && response.functionCalls.length > 0) {
    const call = response.functionCalls[0];
    const { item_id, amount } = call.args;

    // Create Stripe Session with 'link' enabled
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link'],
      customer_email: customerEmail,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: item_id },
          unit_amount: Math.round(amount * 100)
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: 'https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://yourapp.com/cancel'
    });

    return res.json({
      aiResponse: \`Your secure payment link for \${item_id} ($ \${amount}) is ready!\`,
      checkoutUrl: session.url,
      sessionId: session.id
    });
  }

  return res.json({ aiResponse: response.text });
});`;

  const schemaJsonCode = `// Gemini AI SDK Tool Registration Pattern (@google/genai)
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';

// 1. Tool / Function Declaration
export const generateCheckoutLinkDeclaration: FunctionDeclaration = {
  name: 'generate_checkout_link',
  description:
    'Creates a secure Stripe Checkout Session or 1-Click Stripe Link payment URL when a customer intends or requests to buy, order, pay for, or subscribe to any product, package, or plan. Never ask for credit card numbers directly.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      item_id: {
        type: Type.STRING,
        description: 'The exact product name, subscription package, or service identifier (e.g. "Pro Plan", "Starter Kit", "10,000 Credits"). Maps to the Stripe Checkout line item name.'
      },
      amount: {
        type: Type.NUMBER,
        description: 'The unit price in USD (e.g. 29.99, 9.99, 49.0). Positive decimal.'
      },
      customer_email: {
        type: Type.STRING,
        description: 'Customer email address for Stripe receipt and 1-Click Stripe Link authentication.'
      },
      currency: {
        type: Type.STRING,
        description: 'The 3-letter ISO currency code. Defaults to "usd".'
      }
    },
    required: ['item_id', 'amount']
  }
};

// 2. Gemini AI SDK Tool Registration Pattern
export const geminiCheckoutTools = [
  {
    functionDeclarations: [generateCheckoutLinkDeclaration]
  }
];

// 3. Invocation with Gemini 3 / Gemini 2.5
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const response = await ai.models.generateContent({
  model: 'gemini-3.8-flash',
  contents: 'I want to purchase the Pro Plan for $29',
  config: {
    systemInstruction: 'You are an AI payment assistant. Always invoke generate_checkout_link when user wants to purchase. Never ask for credit card digits directly.',
    tools: geminiCheckoutTools
  }
});`;

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>{lang === 'bn' ? 'Gemini Function Calling + Stripe Link' : 'Gemini Function Calling + Stripe Link'}</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {lang === 'bn' ? 'এআই এজেন্ট পেমেন্ট আর্কিটেকচার' : 'AI Agent Payment Architecture & Live Chat'}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? 'এআই এজেন্টের মাধ্যমে চ্যাটের ভেতরে সরাসরি Function Calling (Tool Use) ব্যবহার করে নিরাপদ Stripe Link এবং Checkout তৈরি করুন। ব্যবহারকারীকে চ্যাটেই ক্লিকেবল পেমেন্ট বাটন প্রদান করা হয়।'
                : 'Empower AI Agents to securely create Stripe Checkout & Link sessions via Function Calling, returning clickable payment-ready buttons directly in the chat.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowToolDrawer(!showToolDrawer)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{lang === 'bn' ? 'ম্যানুয়াল Tool ট্রিগার' : 'Trigger Tool Test'}</span>
              {showToolDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Card Leaks</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {lang === 'bn' ? 'কার্ড তথ্য কখনো LLM-এ যায় না' : 'Card details never enter LLM prompt'}
              </p>
            </div>
          </div>
        </div>

        {/* Collapsible Manual Function Trigger Drawer */}
        {showToolDrawer && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-mono">item_id:</label>
              <input
                type="text"
                value={customItemId}
                onChange={(e) => setCustomItemId(e.target.value)}
                placeholder="Product or Plan Name"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-mono">amount ($ USD):</label>
              <input
                type="number"
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="29.99"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-mono">customer_email:</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@email.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleManualToolTrigger}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Trigger generate_checkout_link</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Interactive Live Agent on Left, Architecture & Code on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live AI Agent Chat (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[650px] overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Stripe AI Agent
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-medium">
                      Tool Use Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'bn' ? 'Gemini 3.8 Flash • generate_checkout_link' : 'Gemini 3.8 Flash • generate_checkout_link'}
                  </p>
                </div>
              </div>

              {/* Customer Email Input */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                <span className="text-[10px] text-slate-500 font-mono">Email:</span>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="bg-transparent text-xs text-slate-200 focus:outline-none w-36 font-mono"
                />
              </div>
            </div>

            {/* Chat Message Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg) => {
                const isPaid = msg.toolCall ? paidSessionIds.includes(msg.toolCall.result.sessionId) : false;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                          : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Extract checkout URL from content if toolCall is absent */}
                      {(() => {
                        const directUrl = !msg.toolCall
                          ? msg.content.match(/https:\/\/(?:checkout\.stripe\.com|buy\.stripe\.com)[^\s)"']+/)?.[0]
                          : null;

                        const checkoutUrl = msg.toolCall?.result?.checkoutUrl || directUrl;
                        if (!checkoutUrl) return null;

                        const itemId = msg.toolCall?.result?.itemId || 'Requested Package';
                        const amount = msg.toolCall?.result?.amount || 29.0;
                        const sessionId = msg.toolCall?.result?.sessionId || 'cs_' + msg.id;
                        const isSim = msg.toolCall?.result?.isSimulation ?? true;
                        const isSessionPaid = paidSessionIds.includes(sessionId);

                        return (
                          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3">
                            {/* Function Call Trigger Badge */}
                            {msg.toolCall && (
                              <div className="bg-slate-900/90 rounded-xl p-2.5 border border-indigo-500/30 flex items-center justify-between text-[11px] font-mono text-indigo-300">
                                <div className="flex items-center gap-1.5">
                                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                                  <span className="text-slate-400">Trigger:</span>
                                  <span className="text-white font-bold">{msg.toolCall.name}</span>
                                  <span className="text-slate-500 hidden sm:inline">
                                    ({msg.toolCall.args.item_id}, ${msg.toolCall.args.amount})
                                  </span>
                                </div>
                                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
                                  {isSim ? 'Sandbox Link' : 'Live Stripe Link'}
                                </span>
                              </div>
                            )}

                            {/* Dedicated Stylized Payment Card with Prominent Pay Now CTA */}
                            <div
                              className={`border rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xl transition-all ${
                                isSessionPaid
                                  ? 'bg-emerald-950/30 border-emerald-500/40 shadow-emerald-950/30'
                                  : 'bg-gradient-to-b from-indigo-950/50 via-slate-900 to-slate-950 border-emerald-500/40 shadow-emerald-950/20'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold block flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-emerald-400" />
                                    Stripe Checkout Ready
                                  </span>
                                  <span className="text-base sm:text-lg font-black text-white block mt-0.5">
                                    {itemId}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Session: {sessionId}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                                    Amount Due
                                  </span>
                                  <span className="text-lg sm:text-xl font-black text-emerald-400 block">
                                    ${amount.toFixed(2)} USD
                                  </span>
                                  {isSessionPaid && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mt-1">
                                      <CheckCircle className="w-3 h-3" /> PAID
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Protocol Pipeline Status Indicator */}
                              <div className="flex items-center gap-1.5 py-1 text-[10px] text-slate-400 font-mono overflow-x-auto scrollbar-none">
                                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                  1. Tool Call Triggered
                                </span>
                                <span className="text-slate-600">→</span>
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  2. Stripe Link Generated
                                </span>
                                <span className="text-slate-600">→</span>
                                <span
                                  className={`px-2 py-0.5 rounded border ${
                                    isSessionPaid
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold'
                                      : 'bg-slate-800 text-slate-300 border-slate-700'
                                  }`}
                                >
                                  {isSessionPaid ? '3. Paid & Webhook Verified' : '3. Ready to Pay'}
                                </span>
                              </div>

                              {/* Dedicated, Stylized 'Pay Now' Button */}
                              <div className="space-y-3 pt-1">
                                {!isSessionPaid ? (
                                  <>
                                    <a
                                      href={checkoutUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="group relative w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:via-teal-400 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 ring-2 ring-emerald-300/40 hover:ring-emerald-300/80 cursor-pointer overflow-hidden"
                                      title="Open secure Stripe Checkout in a new tab"
                                    >
                                      {/* Visual Shimmer Bar */}
                                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out pointer-events-none"></div>

                                      <div className="flex items-center gap-3 relative z-10">
                                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-black/20 flex items-center justify-center border border-white/20 shadow-inner">
                                          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-100" />
                                        </div>
                                        <div className="text-left">
                                          <div className="text-white font-black tracking-wide flex items-center gap-1.5 text-sm sm:text-base">
                                            <span>Pay Now</span>
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-black/30 text-emerald-200 font-mono">
                                              ${amount.toFixed(2)} USD
                                            </span>
                                          </div>
                                          <p className="text-[10px] sm:text-[11px] text-emerald-100/90 font-medium font-sans">
                                            Instant 1-Click Checkout with Stripe Link
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 text-white/90 group-hover:text-white relative z-10 font-mono text-xs pr-1">
                                        <span className="hidden sm:inline font-bold">Open Stripe</span>
                                        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                      </div>
                                    </a>

                                    {/* Action Utilities: In-App View, Copy Link, Webhook Simulator */}
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActiveCheckoutSession({
                                            status: 'success',
                                            checkoutUrl,
                                            sessionId,
                                            itemId,
                                            amount,
                                            isSimulation: isSim,
                                          })
                                        }
                                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-indigo-500/30 cursor-pointer shadow-xs"
                                        title="Open interactive in-app mobile simulator"
                                      >
                                        <Smartphone className="w-3.5 h-3.5" />
                                        <span>In-App View</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => copyCodeToClipboard(checkoutUrl)}
                                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700 cursor-pointer shadow-xs"
                                        title="Copy Stripe Checkout URL"
                                      >
                                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Copy Link</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSimulateWebhook(sessionId, itemId, amount)}
                                        className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 text-xs font-medium border border-amber-500/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
                                        title="Simulate Webhook Confirmation"
                                      >
                                        <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                        <span>Simulate Paid</span>
                                      </button>
                                    </div>

                                    {/* Security Guarantee Notice */}
                                    <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-400 border-t border-slate-800/60">
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      <span>
                                        Opens official Stripe hosted payment page in a new secure browser tab • 256-bit SSL encrypted
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                      <span className="font-semibold">
                                        {lang === 'bn' ? 'পেমেন্ট সফল ও ভেরিফাইড হয়েছে' : 'Payment Successfully Verified'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-emerald-400/80">
                                      checkout.session.completed
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono px-1">{msg.timestamp}</span>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 bg-slate-950 p-3 rounded-2xl w-fit border border-slate-800 animate-pulse">
                  <Bot className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>
                    {lang === 'bn'
                      ? 'এআই এজেন্ট ফাংশন কল (generate_checkout_link) ট্রিগার করছে...'
                      : 'AI Agent is triggering generate_checkout_link tool...'}
                  </span>
                </div>
              )}

              {webhookStatus && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                  <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>{webhookStatus}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
              <span className="text-slate-500 shrink-0 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                {lang === 'bn' ? 'টেস্ট প্রম্পট:' : 'Suggestions:'}
              </span>
              <button
                type="button"
                onClick={() => handleSendMessage('আমি প্রো প্ল্যান ($29) কিনতে চাই')}
                className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 shrink-0 transition cursor-pointer"
              >
                ⚡ প্রো প্ল্যান ($29)
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('এআই ক্রেডিট প্যাক ($15) এর লিংক দাও')}
                className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 shrink-0 transition cursor-pointer"
              >
                💎 ক্রেডিট প্যাক ($15)
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('আল্টিমেট এন্টারপ্রাইজ প্যাকেজ ($49) নেব')}
                className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 shrink-0 transition cursor-pointer"
              >
                🚀 আল্টিমেট প্ল্যান ($49)
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Stripe Link এবং Function Calling কীভাবে কাজ করে?')}
                className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 shrink-0 transition cursor-pointer"
              >
                ❓ কীভাবে কাজ করে?
              </button>
            </div>

            {/* Active Checkout Functional Bar */}
            {activePaymentSession && !paidSessionIds.includes(activePaymentSession.sessionId) && (
              <div className="px-4 py-2 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border-t border-emerald-500/30 flex items-center justify-between text-xs animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                  <span className="text-slate-300 truncate text-[11px] sm:text-xs">
                    Payment Ready: <strong className="text-white">{activePaymentSession.itemId}</strong> (${activePaymentSession.amount.toFixed(2)} USD)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={activePaymentSession.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                    title="Execute 1-Click Payment via Stripe Link"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Pay Now</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      handleSimulateWebhook(
                        activePaymentSession.sessionId,
                        activePaymentSession.itemId,
                        activePaymentSession.amount
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white text-[11px] font-medium border border-slate-700 transition cursor-pointer"
                    title="Simulate Webhook Confirmation"
                  >
                    Simulate Paid
                  </button>
                </div>
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  lang === 'bn'
                    ? 'যেমন: "আমি স্টার্টার প্যাক ($9.99) এর জন্য পেমেন্ট লিংক চাই"...'
                    : 'e.g., "I want to purchase the Pro Plan for $29"...'
                }
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-40 transition cursor-pointer shadow-md shadow-indigo-600/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Code & Architecture Hub (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[650px]">
            {/* Tabs for Code */}
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('python')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeCodeTab === 'python'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Python (FastAPI)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('node')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeCodeTab === 'node'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Node.js</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('schema')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeCodeTab === 'schema'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>JSON Schema</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('architecture')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeCodeTab === 'architecture'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Workflow</span>
                </button>
              </div>

              {activeCodeTab !== 'architecture' && (
                <button
                  type="button"
                  onClick={() => {
                    let text = pythonFastAPICode;
                    if (activeCodeTab === 'node') text = nodeExpressCode;
                    if (activeCodeTab === 'schema') text = schemaJsonCode;
                    copyCodeToClipboard(text);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Code / Architecture Viewer Content */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
              {activeCodeTab === 'python' && (
                <div className="space-y-3">
                  <div className="text-[11px] font-sans text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="font-semibold text-emerald-400">FastAPI + Google GenAI + Stripe Python:</span>{' '}
                    ইনস্টল করতে চালান: <code className="text-indigo-300">pip install fastapi uvicorn stripe google-genai</code>
                  </div>
                  <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {pythonFastAPICode}
                  </pre>
                </div>
              )}

              {activeCodeTab === 'node' && (
                <div className="space-y-3">
                  <div className="text-[11px] font-sans text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="font-semibold text-indigo-400">Express + @google/genai TypeScript:</span>{' '}
                    বর্তমানে এই অ্যাপের ব্যাকএন্ডে সচল রয়েছে।
                  </div>
                  <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {nodeExpressCode}
                  </pre>
                </div>
              )}

              {activeCodeTab === 'schema' && (
                <div className="space-y-3">
                  <div className="text-[11px] font-sans text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="font-semibold text-amber-400">Tool / Function Calling JSON Schema:</span>{' '}
                    Gemini ও অন্যান্য LLM-কে এই ডিক্লেয়ারেশন প্রদান করতে হয়।
                  </div>
                  <pre className="text-indigo-200 whitespace-pre-wrap leading-relaxed">
                    {schemaJsonCode}
                  </pre>
                </div>
              )}

              {activeCodeTab === 'architecture' && (
                <div className="space-y-4 font-sans text-xs text-slate-300">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>5-Step AI Agent Payment Lifecycle</span>
                  </h4>

                  {/* Visual Step by Step Cards */}
                  <div className="space-y-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                        ১
                      </div>
                      <div>
                        <span className="font-semibold text-white block">ইউজারের ইনপুট &amp; ইনটেন্ট ডিটেকশন</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          ইউজার যখন চ্যাটে বলে "আমি এই প্যাকেজটি কিনতে চাই", LLM স্বয়ংক্রিয়ভাবে বুঝবে যে পেমেন্ট প্রয়োজন।
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                        ২
                      </div>
                      <div>
                        <span className="font-semibold text-white block">Function Calling (Tool Use) ট্রিগার</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          এআই সরাসরি কার্ড তথ্য না চেয়ে <code className="text-amber-400 font-mono">generate_checkout_link(item_id, amount)</code> ফাংশন কল রিটার্ন করে।
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                        ৩
                      </div>
                      <div>
                        <span className="font-semibold text-white block">Stripe Link &amp; Checkout সেশন তৈরি</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          ব্যাকএন্ড সার্ভার Stripe API দিয়ে সেশন তৈরি করে যেখানে <code className="text-emerald-400 font-mono">payment_method_types: ['card', 'link']</code> অন থাকে।
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                        ৪
                      </div>
                      <div>
                        <span className="font-semibold text-white block">চ্যাটে ক্লিকেবল পেমেন্ট বাটন</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          ইউজার চ্যাটে আসা বাটনে ক্লিক করে মোবাইলে আসা SMS কোড দিয়ে কার্ড টাইপ না করেই ১-ক্লিকে পেমেন্ট সম্পন্ন করে।
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                        ৫
                      </div>
                      <div>
                        <span className="font-semibold text-white block">Stripe Webhook ও চ্যাটে নোটিফিকেশন</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          পেমেন্ট সফল হলে Stripe ব্যাকএন্ডে <code className="text-indigo-400 font-mono">checkout.session.completed</code> পাঠায়, সার্ভার ডাটাবেজ আপডেট করে সার্ভিস চালু করে দেয়।
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Security Highlights */}
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                    <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      সর্বোচ্চ সিকিউরিটি গাইডলাইন:
                    </span>
                    <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-0.5">
                      <li>কখনোই এআই প্রম্পটে ইউজারের কার্ড নাম্বার বা CVV চাইতে দেওয়া যাবে না।</li>
                      <li>পেমেন্টের চূড়ান্ত সত্যতা যাচাইয়ে সর্বদা Stripe Webhook ব্যবহার করতে হবে।</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive In-App Mobile Checkout Modal */}
      {activeCheckoutSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Stripe Link Checkout</h4>
                  <span className="text-[10px] text-slate-400">1-Click Mobile Webview</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCheckoutSession(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-left text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-slate-400 text-xs">
                  <span>Product:</span>
                  <span className="font-semibold text-white">{activeCheckoutSession.itemId}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 text-xs">
                  <span>Customer:</span>
                  <span className="font-mono text-slate-300">{customerEmail}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm">
                  <span className="font-bold text-white">Total Due:</span>
                  <span className="font-black text-emerald-400">
                    ${activeCheckoutSession.amount.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Link by Stripe 1-Click Verification Box */}
              <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-300 text-xs">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Pay with Link</span>
                  </div>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
                    SMS Sent: •••• 92
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  আপনার মোবাইল নম্বরে পাঠানো ৬ সংখ্যার কোড দিয়ে ১-ক্লিকে কার্ড ছাড়াই পেমেন্ট সম্পন্ন করুন:
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={smsVerificationCode}
                    onChange={(e) => setSmsVerificationCode(e.target.value)}
                    className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl px-4 py-2.5 text-center font-mono text-base tracking-widest text-emerald-400 focus:outline-none"
                    placeholder="424242"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmInAppPayment}
                  disabled={isProcessingInAppPayment}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 cursor-pointer"
                >
                  {isProcessingInAppPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing Link Payment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm &amp; Pay ${activeCheckoutSession.amount.toFixed(2)} with Link</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-500">
                  Secured by 256-bit Stripe Link Encryption &amp; Automated Webhook Verification
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
