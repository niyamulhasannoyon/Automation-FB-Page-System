import { AppStorage } from "./storage";
import { IProduct } from "@/types";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
    code?: number;
  };
}

/**
 * Checks if Gemini API Key is available
 */
export function hasGeminiApiKey(): boolean {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY;
  return Boolean(key && key.trim().length > 5);
}

/**
 * Helper to get the active Gemini key
 */
function getGeminiApiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    null
  );
}

/**
 * Smart Contextual Bengali Salesman Simulator (Used when Gemini API key is absent or offline)
 */
function generateContextualSimulationReply(
  userMessage: string,
  products: IProduct[],
  pageName: string = "আমাদের স্টোর"
): string {
  const lower = userMessage.toLowerCase().trim();

  // 1. Delivery Charge / Shipping Inquiry
  if (
    /(ডেলিভারি\s*চার্জ|শিপিং\s*চার্জ|delivery\s*charge|shipping\s*cost|khoroch\s*koto|charge\s*koto)/i.test(
      lower
    )
  ) {
    return `আমাদের ডেলিভারি চার্জ ঢাকার সিটির মধ্যে মাত্র ৳৭০ এবং ঢাকা সিটির বাইরে ৳১৩০। সম্পূর্ণ ক্যাশ অন ডেলিভারি সুবিধা রয়েছে! 🚚\n\nঅর্ডার করতে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা লিখে মেসেজ দিন।`;
  }

  // 2. Delivery Time / Speed Inquiry
  if (
    /(কতদিন\s*লাগবে|কবে\s*পাবো|ডেলিভারি\s*সময়|কখন\s*আসবে|delivery\s*time|kotodin\s*lagbe|kobe\s*ashbe)/i.test(
      lower
    )
  ) {
    return `ঢাকার ভেতরে সাধারণত ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ২-৩ কার্যদিবসের মধ্যে ডেলিভারি পেয়ে যাবেন ইনশাআল্লাহ! 📦\n\nদ্রুততম ডেলিভারি পেতে আপনার নাম, মোবাইল নম্বর ও ঠিকানা এখনই পাঠান।`;
  }

  // 3. Cash on Delivery / Payment Methods Inquiry
  if (
    /(ক্যাশ\s*অন\s*ডেলিভারি|cod|পেমেন্ট\s*কিভাবে|payment\s*method|bkash\s*ache|টাকা\s*কিভাবে\s*দিব|অগ্রিম\s*টাকা)/i.test(
      lower
    )
  ) {
    return `জি, সারা বাংলাদেশে আমাদের ক্যাশ অন ডেলিভারি (Cash on Delivery) সুবিধা রয়েছে! পণ্য হাতে পেয়ে ভালোভাবে দেখে মূল্য পরিশোধ করতে পারবেন। এছাড়া বিকাশ ও নগদেও পেমেন্ট করা যায়। ✅\n\nঅর্ডার করতে আপনার নাম, মোবাইল নম্বর ও ডেলিভারি ঠিকানা জানান।`;
  }

  // 4. Shop / Showroom / Location Inquiry
  if (
    /(দোকান\s*কোথায়|শোরুম\s*আছে|লোকেশন\s*কোথায়|shop\s*location|showroom\s*ase|kothay\s*apnader\s*dokon)/i.test(
      lower
    )
  ) {
    return `আমাদের হাব ঢাকাতেই অবস্থিত, তবে আমরা সম্পূর্ণ অনলাইন ডেলিভারির মাধ্যমে সারা বাংলাদেশে দ্রুত হোম ডেলিভারি সেবা দিচ্ছি! 🏢\n\nআপনার কাঙ্ক্ষিত পণ্যটি অর্ডার করতে শুধু নাম, ঠিকানা ও ফোন নম্বর পাঠিয়ে দিন।`;
  }

  // 5. Return / Warranty / Quality Policy Inquiry
  if (
    /(রিটার্ন\s*পলিসি|খারাপ\s*হলে|রিপ্লেসমেন্ট|change\s*kora\s*jabe|warrenty|guarantee|ফেরত\s*দেওয়া\s*যাবে)/i.test(
      lower
    )
  ) {
    return `আমাদের রয়েছে সহজ ৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি! ডেলিভারির সময় কোনো সমস্যা পেলে সাথে সাথে রাইডারের সামনে চেক করে চেঞ্জ করে নিতে পারবেন। আমরা ১০০% অথেনটিক পণ্যের নিশ্চয়তা দিই। 🛡️`;
  }

  // 6. How to Order / Intent to Order
  if (
    /(অর্ডার\s*করব|অর্ডার\s*করতে\s*চাই|কিভাবে\s*নিব|order\s*korte\s*chai|kivabe\s*nibo|nibo)/i.test(
      lower
    )
  ) {
    const topProd = products.find((p) => p.stock > 0);
    const prodSuggestion = topProd
      ? ` যেমন আমাদের "${topProd.name}" (৳${topProd.price}) খুব দ্রুত ডেলিভারি দেওয়া সম্ভব!`
      : "";
    return `অর্ডার কনফার্ম করা একদম সহজ!${prodSuggestion}\n\nঅনুগ্রহ করে আপনার:\n১. পুরো নাম\n২. মোবাইল নম্বর (১১ ডিজিট)\n৩. সম্পূর্ণ ডেলিভারি ঠিকানা\n\nলিখে মেসেজ দিন, আমাদের টিম সাথে সাথে কনফার্মেশন পাঠিয়ে দেবে! ✨`;
  }

  // 7. Greetings (Salam, Hi, Hello)
  if (
    /(আসসালামু\s*আলাইকুম|salam|hi|hello|হ্যালো|হাই|hey|good\s*morning|good\s*evening)/i.test(
      lower
    )
  ) {
    const inStockList = products
      .filter((p) => p.stock > 0)
      .slice(0, 3)
      .map((p) => `• ${p.name} - ৳${p.price.toLocaleString()}`)
      .join("\n");

    return `আসসালামু আলাইকুম! ${pageName}-এ আপনাকে স্বাগতম! 😊\n\nআমাদের স্টকের জনপ্রিয় কয়েকটি পণ্য:\n${inStockList || "• প্রিমিয়াম কোয়ালিটি লাইফস্টাইল পণ্য"}\n\nকোন পণ্যটি সম্পর্কে জানতে চাচ্ছেন বলুন, অথবা অর্ডার করতে আপনার নাম, মোবাইল নম্বর ও ঠিকানা দিন!`;
  }

  // 8. General fallback sales assistant response
  const inStockProds = products.filter((p) => p.stock > 0);
  const sampleItems = inStockProds.slice(0, 2).map((p) => `"${p.name}" (৳${p.price})`).join(" এবং ");

  return `ধন্যবাদ আপনার মেসেজের জন্য! আমাদের বর্তমান স্টকের জনপ্রিয় আইটেম ${sampleItems || "সকল পণ্য"} রেডি আছে। সারা বাংলাদেশে ক্যাশ অন ডেলিভারিতে দ্রুত পেতে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা লিখে মেসেজ দিন! 🛍️`;
}

/**
 * Layer 3: Generates AI Smart Salesman response using Google Gemini API or intelligent contextual fallback
 */
export async function generateAiSalesmanReply(
  pageId: string,
  userMessage: string,
  pageName: string = "AutoPage Store"
): Promise<{ reply: string; source: "gemini_api" | "contextual_ai_simulation" }> {
  const products = await AppStorage.getProducts(pageId);
  const apiKey = getGeminiApiKey();

  // If no Gemini API key configured, use our intelligent Bengali Salesman simulation
  if (!apiKey) {
    const reply = generateContextualSimulationReply(userMessage, products, pageName);
    return { reply, source: "contextual_ai_simulation" };
  }

  // Construct catalog prompt for Gemini
  const catalogList = products
    .map(
      (p) =>
        `- ${p.name} | SKU: ${p.sku || "N/A"} | Price: ৳${p.price} | Stock: ${
          p.stock > 0 ? `${p.stock} units (In Stock)` : "Stock Out"
        }`
    )
    .join("\n");

  const systemPrompt = `You are a warm, courteous, and polite Bangladeshi e-commerce sales assistant for the Facebook page "${pageName}".
Current Live Product Catalog:
${catalogList}

Store Policies:
- Cash on Delivery available across Bangladesh.
- Delivery charge: Inside Dhaka ৳70, Outside Dhaka ৳130.
- Delivery time: 1-2 days inside Dhaka, 2-3 business days outside Dhaka.
- 7-day replacement guarantee.

Instructions:
1. Respond in natural, polite Bengali (বাংলা) or conversational Banglish matching the customer's style.
2. Keep answers concise, helpful, and natural for Facebook Messenger chat.
3. If the customer is asking about products, recommend available in-stock items with prices.
4. Guide the customer to complete their order by asking for their:
   - Full Name (নাম)
   - Active 11-digit Bangladeshi Mobile Number (মোবাইল নম্বর)
   - Detailed Delivery Address (সম্পূর্ণ ঠিকানা)
5. Do NOT include markdown code blocks or robotic greetings. Talk like a friendly human merchant.`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\nCustomer Inquiry: "${userMessage}"\n\nAssistant Reply:`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 250,
        },
      }),
    });

    if (!res.ok) {
      console.warn(
        `[Gemini AI] API responded with HTTP ${res.status}, falling back to simulation.`
      );
      const reply = generateContextualSimulationReply(userMessage, products, pageName);
      return { reply, source: "contextual_ai_simulation" };
    }

    const data = (await res.json()) as GeminiResponse;
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (aiText && aiText.length > 5) {
      return { reply: aiText, source: "gemini_api" };
    }

    const fallbackReply = generateContextualSimulationReply(userMessage, products, pageName);
    return { reply: fallbackReply, source: "contextual_ai_simulation" };
  } catch (err) {
    console.warn("[Gemini AI] Error calling Gemini API:", err);
    const fallbackReply = generateContextualSimulationReply(userMessage, products, pageName);
    return { reply: fallbackReply, source: "contextual_ai_simulation" };
  }
}
