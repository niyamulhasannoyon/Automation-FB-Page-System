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
 * Checks if Gemini API Key is configured in environment
 */
export function hasGeminiApiKey(): boolean {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY;
  return Boolean(key && key.trim().length > 5);
}

function getGeminiApiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    null
  );
}

/**
 * Smart Context-Aware Bengali Sales Response Builder (Used when GEMINI_API_KEY is not configured or fails)
 */
export function generateContextualBengaliReply(
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
    return `আমাদের ডেলিভারি চার্জ ঢাকা সিটির মধ্যে মাত্র ৳৭০ এবং ঢাকা সিটির বাইরে ৳১৩০। সম্পূর্ণ ক্যাশ অন ডেলিভারি (Cash on Delivery) সুবিধা রয়েছে! 🚚\n\nঅর্ডার করতে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা লিখে মেসেজ দিন।`;
  }

  // 2. Delivery Time / Speed Inquiry
  if (
    /(কতদিন\s*লাগবে|কবে\s*পাবো|ডেলিভারি\s*সময়|কখন\s*আসবে|delivery\s*time|kotodin\s*lagbe|kobe\s*ashbe)/i.test(
      lower
    )
  ) {
    return `ঢাকার ভেতরে সাধারণত ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ২-৩ কার্যদিবসের মধ্যে ডেলিভারি পেয়ে যাবেন ইনশাআল্লাহ! 📦\n\nদ্রুততম সময়ে ডেলিভারি পেতে আপনার নাম, মোবাইল নম্বর ও ঠিকানা এখনই পাঠান।`;
  }

  // 3. Cash on Delivery / Payment Methods Inquiry
  if (
    /(ক্যাশ\s*অন\s*ডেলিভারি|cod|পেমেন্ট\s*কিভাবে|payment\s*method|bkash\s*ache|টাকা\s*কিভাবে\s*দিব|অগ্রিম\s*টাকা)/i.test(
      lower
    )
  ) {
    return `জি, সারা বাংলাদেশে আমাদের ক্যাশ অন ডেলিভারি সুবিধা রয়েছে! পণ্য হাতে পেয়ে কোয়ালিটি যাচাই করে মূল্য পরিশোধ করতে পারবেন। এছাড়া বিকাশ ও নগদেও পেমেন্ট করা যাবে। ✅\n\nঅর্ডার করতে আপনার নাম, মোবাইল নম্বর ও ডেলিভারি ঠিকানা জানান।`;
  }

  // 4. Shop / Showroom / Location Inquiry
  if (
    /(দোকান\s*কোথায়|শোরুম\s*আছে|লোকেশন\s*কোথায়|shop\s*location|showroom\s*ase|kothay\s*apnader\s*dokon)/i.test(
      lower
    )
  ) {
    return `আমাদের মূল ওয়্যারহাউস ঢাকাতেই অবস্থিত, তবে আমরা সম্পূর্ণ অনলাইন ডেলিভারির মাধ্যমে সারা বাংলাদেশে দ্রুত হোম ডেলিভারি সেবা প্রদান করছি! 🏢\n\nআপনার কাঙ্ক্ষিত পণ্যটি অর্ডার করতে শুধু নাম, ঠিকানা ও ফোন নম্বর পাঠিয়ে দিন।`;
  }

  // 5. Return / Warranty Policy Inquiry
  if (
    /(রিটার্ন\s*পলিসি|খারাপ\s*হলে|রিপ্লেসমেন্ট|change\s*kora\s*jabe|warrenty|guarantee|ফেরত\s*দেওয়া\s*যাবে)/i.test(
      lower
    )
  ) {
    return `আমাদের রয়েছে সহজ ৭ দিনের রিপ্লেসমেন্ট পলিসি! ডেলিভারির সময় কোনো সমস্যা পেলে সাথে সাথে রাইডারের সামনে চেক করে চেঞ্জ করে নিতে পারবেন। আমরা ১০০% প্রিমিয়াম পণ্যের নিশ্চয়তা দিই। 🛡️`;
  }

  // 6. How to Order / Intent to Order
  if (
    /(অর্ডার\s*করব|অর্ডার\s*করতে\s*চাই|কিভাবে\s*নিব|order\s*korte\s*chai|kivabe\s*nibo|nibo)/i.test(
      lower
    )
  ) {
    const topProd = products.find((p) => p.stock > 0);
    const prodSuggestion = topProd
      ? ` যেমন আমাদের "${topProd.name}" (মূল্য ৳${topProd.price.toLocaleString()}) খুব জনপ্রিয়!`
      : "";
    return `অর্ডার কনফার্ম করা একদম সহজ!${prodSuggestion}\n\nঅনুগ্রহ করে আপনার:\n১. পুরো নাম\n২. সচল মোবাইল নম্বর (১১ ডিজিট)\n৩. সম্পূর্ণ ডেলিভারি ঠিকানা\n\nলিখে পাঠিয়ে দিন, আমাদের সিস্টেম স্বয়ংক্রিয়ভাবে আপনার অর্ডার কনফার্ম করে নেবে! ✨`;
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

    return `আসসালামু আলাইকুম! ${pageName}-এ আপনাকে স্বাগতম! 😊\n\nআমাদের স্টকের জনপ্রিয় কয়েকটি পণ্য:\n${inStockList || "• প্রিমিয়াম কোয়ালিটি লাইফস্টাইল পণ্য"}\n\nকোন পণ্যটি সম্পর্কে জানতে চাচ্ছেন লিখে জানান, অথবা অর্ডার করতে আপনার নাম, মোবাইল নম্বর ও ঠিকানা দিন!`;
  }

  // 8. General fallback sales assistant response
  const inStockProds = products.filter((p) => p.stock > 0);
  const sampleItems = inStockProds.slice(0, 2).map((p) => `"${p.name}" (৳${p.price.toLocaleString()})`).join(" এবং ");

  return `ধন্যবাদ আপনার মেসেজের জন্য! আমাদের বর্তমান স্টকের জনপ্রিয় আইটেম ${sampleItems || "সকল পণ্য"} রেডি আছে। সারা বাংলাদেশে ক্যাশ অন ডেলিভারিতে দ্রুত পেতে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা লিখে মেসেজ দিন! 🛍️`;
}

/**
 * Generates an AI Smart Reply using Gemini 2.5 Flash / 1.5 Flash or Smart Contextual Bengali Builder
 */
export async function generateAiReply(
  pageId: string,
  userMessage: string,
  pageName: string = "AutoPage Store"
): Promise<{ reply: string; source: "gemini_2.5_flash" | "contextual_bengali_sales_builder" }> {
  const products = await AppStorage.getProducts(pageId);
  const apiKey = getGeminiApiKey();

  // If no Gemini API key configured, use our intelligent Bengali Contextual Sales Builder
  if (!apiKey) {
    const reply = generateContextualBengaliReply(userMessage, products, pageName);
    return { reply, source: "contextual_bengali_sales_builder" };
  }

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

  // Try Gemini 2.5 Flash first, then fallback to 1.5 Flash
  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

      if (res.ok) {
        const data = (await res.json()) as GeminiResponse;
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (aiText && aiText.length > 5) {
          return { reply: aiText, source: "gemini_2.5_flash" };
        }
      }
    } catch {
      // Continue to next model or fallback
    }
  }

  // Graceful fallback to smart contextual Bengali response
  const fallbackReply = generateContextualBengaliReply(userMessage, products, pageName);
  return { reply: fallbackReply, source: "contextual_bengali_sales_builder" };
}
