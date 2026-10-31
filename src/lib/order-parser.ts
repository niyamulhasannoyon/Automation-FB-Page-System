import { IProduct, IOrder } from "@/types";
import { AppStorage } from "./storage";

export interface ParsedOrderData {
  isValid: boolean;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  product: IProduct | null;
  productName: string;
  quantity: number;
  totalAmount: number;
  rawText: string;
}

export interface StockInquiryResult {
  isInquiry: boolean;
  type: "stock" | "price" | "both";
  product: IProduct | null;
  replyText: string;
}

/**
 * Normalizes Bengali digits (০-৯) to standard Arabic digits (0-9)
 */
export function convertBengaliDigits(text: string): string {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return text.replace(/[০-৯]/g, (match) => {
    const idx = bengaliDigits.indexOf(match);
    return idx !== -1 ? String(idx) : match;
  });
}

/**
 * Extracts and standardizes a Bangladeshi 11-digit mobile number (01[3-9]XXXXXXXX)
 */
export function extractBdPhoneNumber(text: string): string | null {
  if (!text) return null;
  const converted = convertBengaliDigits(text);

  // Match BD phone number with optional +88 / 88 prefix and optional dashes/spaces
  // e.g., +8801712345678, 8801712345678, 01712-345678, 01812 345678, 01712345678
  const phoneRegex = /(?:\+?88\s*?)?(01[3-9][0-9\s-]{8,11})/g;
  const match = phoneRegex.exec(converted);

  if (!match) return null;

  // Clean non-digits
  const cleanNumber = match[0].replace(/\D/g, "");

  // If starts with 8801, strip 88
  if (cleanNumber.startsWith("8801") && cleanNumber.length === 13) {
    return cleanNumber.substring(2);
  }

  // Exact 11-digit check
  if (cleanNumber.length === 11 && /^01[3-9]\d{8}$/.test(cleanNumber)) {
    return cleanNumber;
  }

  return null;
}

/**
 * Extracts Customer Name from Bengali or English order text
 */
export function extractCustomerName(text: string, fallbackName?: string): string {
  if (!text) return fallbackName || "সম্মানিত গ্রাহক";

  // 1. Explicit labels: "নাম: রাফি", "name: Rafiq", "আমার নাম রাফি"
  const labelMatch =
    text.match(/(?:নাম|name)\s*[:=ঃ-]\s*([^\n,।]+)/i) ||
    text.match(/আমার নাম\s+([^\n,।,]+)/i) ||
    text.match(/আমি\s+([^\n,।,]+)/i);

  if (labelMatch && labelMatch[1]) {
    const raw = labelMatch[1].trim();
    // Clean out subsequent labeled terms if caught on same line
    const cleaned = raw.replace(/(?:ফোন|phone|ঠিকানা|address|মোবাইল|mobile).*$/i, "").trim();
    if (cleaned.length >= 2) {
      return cleaned;
    }
  }

  // 2. Fallback to provided fallbackName or default polite Bengali term
  return fallbackName && fallbackName.trim().length > 1
    ? fallbackName.trim()
    : "সম্মানিত গ্রাহক";
}

/**
 * Extracts Delivery Address from Bengali or English order text
 */
export function extractCustomerAddress(text: string): string {
  if (!text) return "ঠিকানা উল্লেখ করা হয়নি";

  // 1. Explicit labels: "ঠিকানা: ধানমন্ডি ঢাকা", "address: Mirpur 10", "বাসা: ..."
  const labelMatch =
    text.match(/(?:ঠিকানা|address|লোকেশন|location|বাসা|house)\s*[:=ঃ-]\s*([^\n,।]+(?:\n[^\n]+)?)/i) ||
    text.match(/ঠিকানা\s+([^\n,।]+)/i);

  if (labelMatch && labelMatch[1]) {
    const raw = labelMatch[1].trim();
    const cleaned = raw.replace(/(?:ফোন|phone|নাম|name|মোবাইল|mobile).*$/i, "").trim();
    if (cleaned.length >= 4) {
      return cleaned;
    }
  }

  // 2. Search for common location keywords
  const locationKeywords = [
    "ঢাকা", "dhaka", "চট্টগ্রাম", "chittagong", "সিলেট", "sylhet",
    "রাজশাহী", "rajshahi", "খুলনা", "khulna", "বরিশাল", "barisal",
    "রংপুর", "rangpur", "ময়মনসিংহ", "mymensingh", "কুমিল্লা", "comilla",
    "ধানমন্ডি", "dhanmondi", "উত্তরা", "uttara", "মিরপুর", "mirpur",
    "গুলশান", "gulshan", "বনানী", "banani", "মোহাম্মদপুর", "mohammadpur",
    "বাড্ডা", "badda", "বারিধারা", "baridhara", "মতিঝিল", "motijheel",
    "রোড", "road", "সেক্টর", "sector", "ব্লক", "block", "থানা", "জেলা"
  ];

  const lower = text.toLowerCase();
  for (const kw of locationKeywords) {
    if (lower.includes(kw)) {
      // Find the sentence or clause containing the location
      const parts = text.split(/[,।\n]/);
      for (const part of parts) {
        if (part.toLowerCase().includes(kw)) {
          const cleanPart = part.replace(/(?:ফোন|phone|মোবাইল|নাম|name)[^:]*[:=ঃ-]?[^\s]*/gi, "").trim();
          if (cleanPart.length >= 4) {
            return cleanPart;
          }
        }
      }
    }
  }

  return "ঠিকানা ইনবক্সে যাচিত";
}

/**
 * Parses Quantity from text (supports Bengali and English digits)
 */
export function extractQuantity(text: string): number {
  const converted = convertBengaliDigits(text);

  // Match e.g., "1 ta", "2 pcs", "১টা", "3 piece", "qty 2"
  const qtyMatch =
    converted.match(/(\d+)\s*(?:টা|টি|পিস|জোড়া|piece|pieces|pcs|qty)/i) ||
    converted.match(/(?:qty|quantity)\s*[:=ঃ-]?\s*(\d+)/i);

  if (qtyMatch && qtyMatch[1]) {
    const num = parseInt(qtyMatch[1], 10);
    if (!isNaN(num) && num > 0 && num <= 50) {
      return num;
    }
  }

  return 1;
}

/**
 * Layer 1: Detects and extracts complete order data from customer Messenger text
 */
export async function parseOrderMessage(
  pageId: string,
  text: string,
  fallbackSenderName?: string
): Promise<ParsedOrderData | null> {
  if (!text || text.trim().length < 8) return null;

  const phone = extractBdPhoneNumber(text);
  if (!phone) {
    return null; // A valid BD phone number is mandatory for auto-order detection
  }

  // Find matching product from page catalog
  const products = await AppStorage.getProducts(pageId);
  let matchedProduct: IProduct | null = null;

  // 1. Keyword or product name match
  for (const prod of products) {
    const prodName = prod.name.toLowerCase();
    if (text.toLowerCase().includes(prodName)) {
      matchedProduct = prod;
      break;
    }
    if (Array.isArray(prod.keywords)) {
      for (const kw of prod.keywords) {
        if (kw && text.toLowerCase().includes(kw.trim().toLowerCase())) {
          matchedProduct = prod;
          break;
        }
      }
      if (matchedProduct) break;
    }
  }

  // If no product directly matches, pick the first in-stock product or general order
  const defaultProd = products.find((p) => p.stock > 0) || products[0];
  const finalProduct = matchedProduct || defaultProd;

  const customerName = extractCustomerName(text, fallbackSenderName);
  const customerAddress = extractCustomerAddress(text);
  const quantity = extractQuantity(text);

  const pricePerUnit = finalProduct ? finalProduct.price : 1500;
  const totalAmount = pricePerUnit * quantity;

  return {
    isValid: true,
    customerName,
    customerPhone: phone,
    customerAddress,
    product: finalProduct || null,
    productName: finalProduct ? finalProduct.name : "কাস্টম প্রোডাক্ট",
    quantity,
    totalAmount,
    rawText: text,
  };
}

/**
 * Formats standard Messenger Order Confirmation Reply
 */
export function formatOrderConfirmationReply(
  customerName: string,
  orderNumber: string,
  customerPhone: string,
  productName: string,
  totalAmount: number
): string {
  return `🎉 ধন্যবাদ ${customerName}! আপনার অর্ডারটি (${orderNumber}) সফলভাবে কনফার্ম করা হয়েছে!\n\n📦 পণ্য: ${productName}\n💰 সর্বমোট: ৳${totalAmount.toLocaleString()} (ক্যাশ অন ডেলিভারি)\n\nশীঘ্রই আমাদের প্রতিনিধি আপনার ${customerPhone} নম্বরে যোগাযোগ করবেন।`;
}

/**
 * Layer 2: Real-Time Stock & Price Inquiry Checker ("স্টক আছে?", "দাম কত?")
 */
export async function parseStockOrPriceInquiry(
  pageId: string,
  text: string
): Promise<StockInquiryResult> {
  if (!text) {
    return { isInquiry: false, type: "stock", product: null, replyText: "" };
  }

  const normalized = text.toLowerCase();

  const isStock =
    /(স্টক\s*আছে|স্টকে\s*আছে|stock\s*ache|stok\s*ase|stock\s*available|available|স্টক\s*কি\s*আছে|পাওয়া\s*যাবে|পাওয়া\s*যাবে|আছে\s*কি|ইন\s*স্টক)/i.test(
      normalized
    );

  const isPrice =
    /(দাম\s*কত|price\s*koto|dam\s*koto|koto\s*dam|কত\s*দাম|price|দাম|rate|কত\s*টাকা|টাকা\s*কত)/i.test(
      normalized
    );

  if (!isStock && !isPrice) {
    return { isInquiry: false, type: "stock", product: null, replyText: "" };
  }

  const inquiryType = isStock && isPrice ? "both" : isStock ? "stock" : "price";

  // Find product
  const products = await AppStorage.getProducts(pageId);
  let matchedProduct: IProduct | null = null;

  for (const prod of products) {
    if (normalized.includes(prod.name.toLowerCase())) {
      matchedProduct = prod;
      break;
    }
    if (Array.isArray(prod.keywords)) {
      for (const kw of prod.keywords) {
        if (kw && normalized.includes(kw.trim().toLowerCase())) {
          matchedProduct = prod;
          break;
        }
      }
      if (matchedProduct) break;
    }
  }

  // If no product is matched specifically but page has products, use first top product
  if (!matchedProduct && products.length > 0) {
    // If text mentions general inquiry, provide catalog summary
    matchedProduct = products[0];
  }

  if (!matchedProduct) {
    return {
      isInquiry: true,
      type: inquiryType,
      product: null,
      replyText:
        "আমাদের সকল পণ্য স্টকে রয়েছে! কোন পণ্যটি সম্পর্কে জানতে চান দয়া করে নাম লিখে জানান।",
    };
  }

  let replyText = "";
  const inStock = matchedProduct.stock > 0;

  if (inquiryType === "price") {
    replyText = `আমাদের "${matchedProduct.name}"-এর রেগুলার মূল্য ৳${matchedProduct.price.toLocaleString()}। ${
      inStock
        ? `পণ্যটি স্টকে রয়েছে (${matchedProduct.stock} টি এভেইলেবল) ✅ অর্ডার করতে আপনার নাম, ফোন নম্বর ও ঠিকানা ইনবক্স করুন!`
        : "বর্তমানে স্টক শেষ ❌ শীঘ্রই রিস্টক হবে।"
    }`;
  } else if (inquiryType === "stock") {
    if (inStock) {
      replyText = `জি, "${matchedProduct.name}" বর্তমানে আমাদের স্টকে এভেইলেবল আছে (${matchedProduct.stock} পিস বাকি) ✅ মূল্য মাত্র ৳${matchedProduct.price.toLocaleString()}। দ্রুত অর্ডার করতে নাম, ঠিকানা ও ফোন নম্বর পাঠান!`;
    } else {
      replyText = `দুঃখিত, "${matchedProduct.name}" পণ্যটি বর্তমানে স্টক আউট (Stock Out) ❌ নতুন স্টক আসা মাত্রই আমাদের পেজে জানিয়ে দেওয়া হবে!`;
    }
  } else {
    // Both stock and price
    if (inStock) {
      replyText = `আমাদের "${matchedProduct.name}" স্টকে আছে (${matchedProduct.stock} পিস এভেইলেবল) এবং এর মূল্য ৳${matchedProduct.price.toLocaleString()} ✅ ডেলিভারি পেতে আপনার নাম, মোবাইল নম্বর এবং ঠিকানা লিখে পাঠান!`;
    } else {
      replyText = `"${matchedProduct.name}"-এর মূল্য ৳${matchedProduct.price.toLocaleString()}, তবে এটি বর্তমানে স্টক আউট ❌ শীঘ্রই নতুন স্টক আসছে।`;
    }
  }

  return {
    isInquiry: true,
    type: inquiryType,
    product: matchedProduct,
    replyText,
  };
}
