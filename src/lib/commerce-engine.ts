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
 * Extracts and standardizes a Bangladeshi 11-digit mobile number: /(?:\+?88)?01[3-9]\d{8}/
 */
export function extractBdPhoneNumber(text: string): string | null {
  if (!text) return null;
  const converted = convertBengaliDigits(text);

  // Match BD phone number with optional +88 / 88 prefix and optional dashes/spaces
  const phoneRegex = /(?:\+?88\s*?)?(01[3-9][0-9\s-]{8,11})/g;
  const match = phoneRegex.exec(converted);

  if (!match) return null;

  const cleanNumber = match[0].replace(/\D/g, "");

  if (cleanNumber.startsWith("8801") && cleanNumber.length === 13) {
    return cleanNumber.substring(2);
  }

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

  const labelMatch =
    text.match(/(?:নাম|name)\s*[:=ঃ-]\s*([^\n,।]+)/i) ||
    text.match(/আমার নাম\s+([^\n,।,]+)/i) ||
    text.match(/আমি\s+([^\n,।,]+)/i);

  if (labelMatch && labelMatch[1]) {
    const raw = labelMatch[1].trim();
    const cleaned = raw.replace(/(?:ফোন|phone|ঠিকানা|address|মোবাইল|mobile).*$/i, "").trim();
    if (cleaned.length >= 2) {
      return cleaned;
    }
  }

  return fallbackName && fallbackName.trim().length > 1
    ? fallbackName.trim()
    : "সম্মানিত গ্রাহক";
}

/**
 * Extracts Delivery Address from Bengali or English order text
 */
export function extractCustomerAddress(text: string): string {
  if (!text) return "ঠিকানা উল্লেখ করা হয়নি";

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

  return "ঢাকা";
}

/**
 * Parses Quantity from text (supports Bengali and English digits)
 */
export function extractQuantity(text: string): number {
  const converted = convertBengaliDigits(text);

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
 * Layer 1: Detects and extracts complete order data from customer text
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

  const products = await AppStorage.getProducts(pageId);
  let matchedProduct: IProduct | null = null;

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

  const defaultProd = products.find((p) => p.stock > 0) || products[0];
  const finalProduct = matchedProduct || defaultProd;

  const customerName = extractCustomerName(text, fallbackSenderName);
  const customerAddress = extractCustomerAddress(text);
  const quantity = extractQuantity(text);

  const pricePerUnit = finalProduct ? finalProduct.price : 1850;
  const totalAmount = pricePerUnit * quantity;

  return {
    isValid: true,
    customerName,
    customerPhone: phone,
    customerAddress,
    product: finalProduct || null,
    productName: finalProduct ? finalProduct.name : "প্রিমিয়াম প্রোডাক্ট",
    quantity,
    totalAmount,
    rawText: text,
  };
}

/**
 * Formats standard Messenger Order Confirmation Reply
 * Fulfills: "ধন্যবাদ! আপনার অর্ডার (#ORD-XXXX) কনফার্ম করা হয়েছে!"
 */
export function formatOrderConfirmationReply(
  customerName: string,
  orderNumber: string,
  customerPhone: string,
  productName: string,
  totalAmount: number
): string {
  const ordFormatted = orderNumber.startsWith("#") ? orderNumber : `#${orderNumber}`;
  return `ধন্যবাদ! আপনার অর্ডার (${ordFormatted}) কনফার্ম করা হয়েছে!\n\n👤 গ্রাহক: ${customerName}\n📦 পণ্য: ${productName}\n💰 সর্বমোট: ৳${totalAmount.toLocaleString()} (ক্যাশ অন ডেলিভারি)\n📱 মোবাইল: ${customerPhone}\n\nশীঘ্রই আমাদের প্রতিনিধি ডেলিভারির জন্য যোগাযোগ করবেন।`;
}

/**
 * Layer 2: Real-Time Stock & Price Inquiry Checker ("স্টক আছে?", "stock", "দাম কত?", "price")
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
    /(স্টক\s*আছে|স্টকে\s*আছে|stock|stok|available|স্টক|পাওয়া\s*যাবে|পাওয়া\s*যাবে|আছে\s*কি|ইন\s*স্টক)/i.test(
      normalized
    );

  const isPrice =
    /(দাম\s*কত|price|dam|কত\s*দাম|rate|কত\s*টাকা|টাকা\s*কত|দাম)/i.test(
      normalized
    );

  if (!isStock && !isPrice) {
    return { isInquiry: false, type: "stock", product: null, replyText: "" };
  }

  const inquiryType = isStock && isPrice ? "both" : isStock ? "stock" : "price";

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

  if (!matchedProduct && products.length > 0) {
    matchedProduct = products[0];
  }

  if (!matchedProduct) {
    return {
      isInquiry: true,
      type: inquiryType,
      product: null,
      replyText:
        "আমাদের সকল পণ্যের তালিকা এবং মূল্য দেখতে অনুগ্রহ করে ইনবক্স করুন অথবা আমাদের শপ ভিজিট করুন!",
    };
  }

  let replyText = "";
  const isAvailable = matchedProduct.stock > 0;

  if (inquiryType === "both") {
    if (isAvailable) {
      replyText = `আমাদের "${matchedProduct.name}" বর্তমানে স্টকে এভেইলেবল আছে (${matchedProduct.stock} পিস অবশিষ্ট) এবং এর অফার মূল্য ৳${matchedProduct.price.toLocaleString()} ✅\n\nঅর্ডার করতে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা পাঠিয়ে দিন!`;
    } else {
      replyText = `আমাদের "${matchedProduct.name}" এর রেগুলার মূল্য ৳${matchedProduct.price.toLocaleString()}, তবে এটি বর্তমানে আউট অব স্টক রয়েছে ❌\n\nনতুন স্টক আসলে সবার আগে জানতে আপনার নম্বর দিয়ে রাখতে পারেন!`;
    }
  } else if (inquiryType === "stock") {
    if (isAvailable) {
      replyText = `জি! আমাদের "${matchedProduct.name}" স্টকে রয়েছে (${matchedProduct.stock} পিস এভেইলেবল) ✅\n\nমূল্য ৳${matchedProduct.price.toLocaleString()}। এখনই অর্ডার কনফার্ম করতে আপনার নাম, ফোন নম্বর ও ঠিকানা দিন!`;
    } else {
      replyText = `দুঃখিত, "${matchedProduct.name}" সাময়িকভাবে স্টক আউট রয়েছে ❌। খুব শীঘ্রই নতুন স্টক যুক্ত হবে!`;
    }
  } else {
    // Price inquiry
    replyText = `আমাদের "${matchedProduct.name}" এর মূল্য ৳${matchedProduct.price.toLocaleString()} (${isAvailable ? "স্টকে এভেইলেবল আছে ✅" : "স্টক আউট ❌"})\n\nসরাসরি ক্যাশ অন ডেলিভারিতে অর্ডার করতে নাম, ঠিকানা এবং ফোন নম্বর পাঠান!`;
  }

  return {
    isInquiry: true,
    type: inquiryType,
    product: matchedProduct,
    replyText,
  };
}
