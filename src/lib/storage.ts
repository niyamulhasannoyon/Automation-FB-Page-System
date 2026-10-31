import fs from "fs";
import path from "path";
import connectToDatabase, { getMongoUri, maskMongoUri } from "./db";
import ConnectedPage from "@/models/ConnectedPage";
import ScheduledPost from "@/models/ScheduledPost";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";
import AutomationLog from "@/models/AutomationLog";
import {
  IConnectedPage,
  IScheduledPost,
  IProduct,
  IOrder,
  IUser,
  IAutomationLog,
  AutomationEventType,
  AutomationEventStatus,
} from "@/types";
import { encryptToken, decryptToken } from "./crypto";

interface LocalStoreData {
  pages: IConnectedPage[];
  posts: IScheduledPost[];
  products: IProduct[];
  orders: IOrder[];
  users: IUser[];
  logs: IAutomationLog[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "db.json");

let isMongoAvailable: boolean | null = null;
let lastMongoCheckTime = 0;
const MONGO_CHECK_INTERVAL = 30000; // 30 seconds cache for connection state

function toPage(doc: unknown): IConnectedPage {
  const d = doc as {
    toObject?: () => Record<string, unknown>;
    _id?: { toString: () => string };
  };
  const obj =
    d && typeof d.toObject === "function"
      ? d.toObject()
      : (doc as Record<string, unknown>);
  const rawToken = String(obj?.pageAccessToken || "");
  return {
    ...(obj as unknown as IConnectedPage),
    _id: obj?._id ? String(obj._id) : undefined,
    userId: obj?.userId ? String(obj.userId) : "user_demo",
    pageAccessToken: decryptToken(rawToken),
  };
}

function toUser(doc: unknown): IUser {
  const d = doc as {
    toObject?: () => Record<string, unknown>;
    _id?: { toString: () => string };
  };
  const obj =
    d && typeof d.toObject === "function"
      ? d.toObject()
      : (doc as Record<string, unknown>);
  return {
    ...(obj as unknown as IUser),
    _id: obj?._id ? String(obj._id) : undefined,
    id: obj?._id ? String(obj._id) : (obj?.id as string),
  };
}

function toLog(doc: unknown): IAutomationLog {
  const d = doc as {
    toObject?: () => Record<string, unknown>;
    _id?: { toString: () => string };
  };
  const obj =
    d && typeof d.toObject === "function"
      ? d.toObject()
      : (doc as Record<string, unknown>);
  return {
    ...(obj as unknown as IAutomationLog),
    _id: obj?._id ? String(obj._id) : undefined,
  };
}

function toPost(doc: unknown): IScheduledPost {
  const d = doc as {
    toObject?: () => Record<string, unknown>;
    _id?: { toString: () => string };
  };
  const obj =
    d && typeof d.toObject === "function"
      ? d.toObject()
      : (doc as Record<string, unknown>);
  return {
    ...(obj as unknown as IScheduledPost),
    _id: obj?._id ? String(obj._id) : undefined,
  };
}

function toProduct(doc: unknown): IProduct {
  const d = doc as {
    toObject?: () => Record<string, unknown>;
    _id?: { toString: () => string };
  };
  const obj =
    d && typeof d.toObject === "function"
      ? d.toObject()
      : (doc as Record<string, unknown>);
  return {
    ...(obj as unknown as IProduct),
    _id: obj?._id ? String(obj._id) : undefined,
  };
}

function toOrder(doc: unknown): IOrder {
  const d = doc as {
    toObject?: () => Record<string, unknown>;
    _id?: { toString: () => string };
  };
  const obj =
    d && typeof d.toObject === "function"
      ? d.toObject()
      : (doc as Record<string, unknown>);
  return {
    ...(obj as unknown as IOrder),
    _id: obj?._id ? String(obj._id) : undefined,
  };
}

export const SEED_PRODUCTS: IProduct[] = [
  {
    _id: "prod_seed_1",
    pageId: "10928491829384",
    name: "Premium Cotton Panjabi",
    sku: "PAN-001",
    price: 1850,
    stock: 15,
    keywords: ["panjabi", "পাঞ্জাবি", "পাঞ্জাবী", "punjabi", "cotton panjabi", "পাঞ্জাবি কালেকশন"],
    imageUrl:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "prod_seed_2",
    pageId: "10928491829384",
    name: "Wireless Earbuds Pro",
    sku: "EAR-102",
    price: 2450,
    stock: 8,
    keywords: ["earbuds", "earphone", "হেডফোন", "ইয়ারবাডস", "ইয়ারফোন", "airpods", "wireless earbuds"],
    imageUrl:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "prod_seed_3",
    pageId: "10928491829384",
    name: "Smart Fitness Watch",
    sku: "WCH-305",
    price: 3200,
    stock: 0, // Stock Out demo
    keywords: ["watch", "ঘড়ি", "ঘড়ি", "smartwatch", "স্মার্টওয়াচ", "ফিটনেস ওয়াচ"],
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "prod_seed_4",
    pageId: "10928491829384",
    name: "Genuine Leather Wallet",
    sku: "WAL-401",
    price: 950,
    stock: 2, // Low stock demo
    keywords: ["wallet", "মানিব্যাগ", "লেদার মানিব্যাগ", "leather wallet", "ওয়ালেট"],
    imageUrl:
      "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const SEED_ORDERS: IOrder[] = [
  {
    _id: "order_seed_1",
    pageId: "10928491829384",
    orderNumber: "ORD-1001",
    customerPsid: "demo_psid_101",
    customerName: "রাকিব হাসান",
    customerPhone: "01712345678",
    customerAddress: "ধানমন্ডি ৪/এ, রোড ৯, ঢাকা",
    productName: "Premium Cotton Panjabi",
    productId: "prod_seed_1",
    quantity: 1,
    totalAmount: 1850,
    status: "confirmed",
    source: "messenger_auto",
    notes: "কাল বিকেলে ডেলিভারি দিলে ভালো হয়",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: "order_seed_2",
    pageId: "10928491829384",
    orderNumber: "ORD-1002",
    customerPsid: "demo_psid_102",
    customerName: "তানভির আহমেদ",
    customerPhone: "01898765432",
    customerAddress: "হাউস ১২, রোড ৪, সেক্টর ৩, উত্তরা, ঢাকা",
    productName: "Wireless Earbuds Pro",
    productId: "prod_seed_2",
    quantity: 1,
    totalAmount: 2450,
    status: "pending",
    source: "messenger_auto",
    notes: "ক্যাশ অন ডেলিভারি",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: "order_seed_3",
    pageId: "10928491829384",
    orderNumber: "ORD-1003",
    customerPsid: "",
    customerName: "সুমাইয়া রহমান",
    customerPhone: "01911223344",
    customerAddress: "মিরপুর ১০, ব্লক সি, ঢাকা",
    productName: "Genuine Leather Wallet",
    productId: "prod_seed_4",
    quantity: 2,
    totalAmount: 1900,
    status: "shipped",
    source: "manual",
    notes: "রেডেক্স কুরিয়ার ট্র্যাকিং: RDX-88219",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
  },
];

export const SEED_USER: IUser = {
  _id: "user_demo",
  id: "user_demo",
  email: "demo@autopage.io",
  name: "Demo Merchant (Live)",
  password: "demo123456",
  role: "merchant",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const SEED_LOGS: IAutomationLog[] = [
  {
    _id: "log_seed_1",
    pageId: "10928491829384",
    eventId: "mid_demo_1001",
    eventType: "order",
    senderId: "demo_psid_101",
    senderName: "রাকিব হাসান",
    inputMessage: "আমার নাম রাকিব হাসান, ফোন 01712345678, ধানমন্ডি ৪/এ, ১টা পাঞ্জাবি লাগবে",
    replyMessage: "🎉 ধন্যবাদ রাকিব হাসান! আপনার অর্ডারটি (ORD-1001) সফলভাবে কনফার্ম করা হয়েছে!",
    handledBy: "Layer 1: Auto Order Extractor",
    status: "success",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    _id: "log_seed_2",
    pageId: "10928491829384",
    eventId: "mid_demo_1002",
    eventType: "stock_inquiry",
    senderId: "demo_psid_102",
    senderName: "তানভির আহমেদ",
    inputMessage: "ইয়ারবাডস এর দাম কত এবং স্টক আছে?",
    replyMessage: "আমাদের \"Wireless Earbuds Pro\" স্টকে আছে (8 পিস এভেইলেবল) এবং এর মূল্য ৳2,450 ✅",
    handledBy: "Layer 2: Real-Time Stock & Price Checker",
    status: "success",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

function ensureLocalStore(): LocalStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      const parsed = JSON.parse(raw);

      let modified = false;
      if (!Array.isArray(parsed.products) || parsed.products.length === 0) {
        parsed.products = [...SEED_PRODUCTS];
        modified = true;
      }
      if (!Array.isArray(parsed.orders) || parsed.orders.length === 0) {
        parsed.orders = [...SEED_ORDERS];
        modified = true;
      }
      if (!Array.isArray(parsed.pages)) {
        parsed.pages = [];
        modified = true;
      }
      if (!Array.isArray(parsed.posts)) {
        parsed.posts = [];
        modified = true;
      }
      if (!Array.isArray(parsed.users) || parsed.users.length === 0) {
        parsed.users = [SEED_USER];
        modified = true;
      }
      if (!Array.isArray(parsed.logs)) {
        parsed.logs = [...SEED_LOGS];
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(STORE_PATH, JSON.stringify(parsed, null, 2), "utf-8");
      }

      return parsed;
    }
  } catch (err) {
    console.error("[Storage] Error reading local store:", err);
  }

  // Initial seed data for offline / local evaluation
  const seedData: LocalStoreData = {
    pages: [
      {
        userId: "user_demo",
        pageId: "10928491829384",
        pageName: "TechFlow Digital (Live Demo)",
        pagePicture:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
        pageAccessToken: "demo_access_token_techflow_2025",
        isWebhookSubscribed: true,
        autoReplyEnabled: true,
        defaultInboxReply:
          "Hello! Thanks for reaching out to TechFlow Digital. How can our team assist you today?",
        rules: [
          {
            id: "rule_1",
            keyword: "price",
            matchType: "contains",
            commentReply:
              "Thanks for checking out TechFlow! I just sent you our complete pricing breakdown in Messenger 📩",
            sendPrivateInbox: true,
            inboxReply:
              "Hi there! Our platform plans start from $29/mo with unlimited comment replies. Check the live tiers here: https://example.com/pricing",
            isActive: true,
          },
          {
            id: "rule_2",
            keyword: "demo",
            matchType: "contains",
            commentReply:
              "Early demo access is ready! Check your inbox for the direct link 🚀",
            sendPrivateInbox: true,
            inboxReply:
              "Here is your 1-on-1 walkthrough link: https://example.com/schedule-demo. Pick any slot that suits you best!",
            isActive: true,
          },
          {
            id: "rule_3",
            keyword: "support",
            matchType: "exact",
            commentReply:
              "Our support engineers have received your inquiry. Check your private messages.",
            sendPrivateInbox: true,
            inboxReply:
              "Hello! Please reply with your account ID or registered email, and an engineer will assist you right away.",
            isActive: true,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    posts: [
      {
        _id: "post_seed_1",
        pageId: "10928491829384",
        caption:
          "Exciting new automation features are live! Boost your page engagement 10x with zero manual effort 🚀",
        imageUrl:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
        scheduledTime: new Date(Date.now() - 3600000).toISOString(),
        status: "published",
        fbPostId: "fb_post_10928491829384_9921",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        _id: "post_seed_2",
        pageId: "10928491829384",
        caption:
          "Special community spotlight: How creators are saving 15+ hours weekly with AutoPage comment triggers.",
        imageUrl:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80",
        scheduledTime: new Date(Date.now() + 86400000).toISOString(),
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    products: SEED_PRODUCTS,
    orders: SEED_ORDERS,
    users: [SEED_USER],
    logs: [...SEED_LOGS],
  };

  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(seedData, null, 2), "utf-8");
  } catch (err) {
    console.error("[Storage] Error writing seed data:", err);
  }

  return seedData;
}

function writeLocalStore(data: LocalStoreData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[Storage] Error writing local store:", err);
  }
}

/**
 * Checks if MongoDB is reachable, with automatic fallback caching
 */
async function checkMongoConnection(): Promise<boolean> {
  const now = Date.now();
  if (
    isMongoAvailable !== null &&
    now - lastMongoCheckTime < MONGO_CHECK_INTERVAL
  ) {
    return isMongoAvailable;
  }

  lastMongoCheckTime = now;
  try {
    await connectToDatabase();
    isMongoAvailable = true;
    return true;
  } catch {
    isMongoAvailable = false;
    return false;
  }
}

export class AppStorage {
  // ==================== PAGES ====================

  static async getAllPages(userId?: string): Promise<IConnectedPage[]> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const count = await ConnectedPage.countDocuments();
        if (count === 0) {
          const store = ensureLocalStore();
          if (store.pages.length > 0) {
            const toInsert = store.pages.map(({ _id: _unused, ...rest }) => ({
              ...rest,
              pageAccessToken: encryptToken(rest.pageAccessToken),
            }));
            await ConnectedPage.insertMany(toInsert);
          }
        }
        const filter = userId
          ? {
              $or: [
                { userId },
                { userId: "user_demo" },
                { userId: { $exists: false } },
              ],
            }
          : {};
        const pages = await ConnectedPage.find(filter).sort({ updatedAt: -1 });
        return pages.map(toPage);
      } catch (err) {
        console.error("[Storage] Mongo getAllPages error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    return [...store.pages]
      .filter((p) => {
        if (!userId) return true;
        return (
          p.userId === userId ||
          p.userId === "user_demo" ||
          !p.userId
        );
      })
      .sort((a, b) => {
        const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return tB - tA;
      });
  }

  static async getPage(pageId: string): Promise<IConnectedPage | null> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const page = await ConnectedPage.findOne({
          $or: [
            { pageId },
            { _id: pageId.match(/^[0-9a-fA-F]{24}$/) ? pageId : null },
          ],
        });
        if (page) return toPage(page);
      } catch (err) {
        console.error("[Storage] Mongo getPage error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    const found = store.pages.find(
      (p) => p.pageId === pageId || (p._id && p._id === pageId)
    );
    return found || null;
  }

  static async upsertPage(
    pageData: Partial<IConnectedPage> & { pageId: string; pageName: string }
  ): Promise<IConnectedPage> {
    const tokenToStore = pageData.pageAccessToken
      ? encryptToken(pageData.pageAccessToken)
      : undefined;

    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const updated = await ConnectedPage.findOneAndUpdate(
          { pageId: pageData.pageId },
          {
            $set: {
              userId: pageData.userId || "user_demo",
              pageName: pageData.pageName,
              pagePicture: pageData.pagePicture,
              ...(tokenToStore ? { pageAccessToken: tokenToStore } : {}),
              isWebhookSubscribed: Boolean(pageData.isWebhookSubscribed),
            },
            $setOnInsert: {
              autoReplyEnabled: true,
              defaultInboxReply:
                "Hello! Thanks for reaching out. We received your message and will get back to you shortly.",
              rules: [],
            },
          },
          { new: true, upsert: true, runValidators: true }
        );
        return toPage(updated);
      } catch (err) {
        console.error("[Storage] Mongo upsertPage error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    const existingIndex = store.pages.findIndex(
      (p) => p.pageId === pageData.pageId
    );
    const nowIso = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = store.pages[existingIndex];
      const updated: IConnectedPage = {
        ...existing,
        userId: pageData.userId || existing.userId || "user_demo",
        pageName: pageData.pageName,
        pagePicture: pageData.pagePicture ?? existing.pagePicture,
        pageAccessToken: pageData.pageAccessToken ?? existing.pageAccessToken,
        isWebhookSubscribed:
          pageData.isWebhookSubscribed ?? existing.isWebhookSubscribed,
        updatedAt: nowIso,
      };
      store.pages[existingIndex] = updated;
      writeLocalStore(store);
      return updated;
    } else {
      const newPage: IConnectedPage = {
        _id: `page_${Date.now()}`,
        userId: pageData.userId || "user_demo",
        pageId: pageData.pageId,
        pageName: pageData.pageName,
        pagePicture: pageData.pagePicture || "",
        pageAccessToken: pageData.pageAccessToken || "",
        isWebhookSubscribed: Boolean(pageData.isWebhookSubscribed),
        autoReplyEnabled: true,
        defaultInboxReply:
          "Hello! Thanks for reaching out. We received your message and will get back to you shortly.",
        rules: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      store.pages.unshift(newPage);
      writeLocalStore(store);
      return newPage;
    }
  }

  static async updatePage(
    id: string,
    updates: Partial<IConnectedPage>
  ): Promise<IConnectedPage | null> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const updated = await ConnectedPage.findOneAndUpdate(
          {
            $or: [
              { pageId: id },
              { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
            ],
          },
          { $set: updates },
          { new: true, runValidators: true }
        );
        if (updated) return toPage(updated);
      } catch (err) {
        console.error("[Storage] Mongo updatePage error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    const index = store.pages.findIndex(
      (p) => p.pageId === id || (p._id && p._id === id)
    );
    if (index === -1) return null;

    const updated: IConnectedPage = {
      ...store.pages[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.pages[index] = updated;
    writeLocalStore(store);
    return updated;
  }

  static async deletePage(id: string): Promise<boolean> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const deleted = await ConnectedPage.findOneAndDelete({
          $or: [
            { pageId: id },
            { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
          ],
        });
        if (deleted) {
          await ScheduledPost.deleteMany({ pageId: deleted.pageId });
          await Product.deleteMany({ pageId: deleted.pageId });
          await Order.deleteMany({ pageId: deleted.pageId });
          return true;
        }
      } catch (err) {
        console.error("[Storage] Mongo deletePage error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    const target = store.pages.find(
      (p) => p.pageId === id || (p._id && p._id === id)
    );
    if (!target) return false;

    store.pages = store.pages.filter(
      (p) => p.pageId !== target.pageId && p._id !== target._id
    );
    store.posts = store.posts.filter((p) => p.pageId !== target.pageId);
    store.products = store.products.filter((p) => p.pageId !== target.pageId);
    store.orders = store.orders.filter((p) => p.pageId !== target.pageId);
    writeLocalStore(store);
    return true;
  }

  // ==================== POSTS ====================

  static async getPosts(pageId: string): Promise<IScheduledPost[]> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const posts = await ScheduledPost.find({ pageId })
          .sort({ scheduledTime: -1, createdAt: -1 })
          .limit(50);
        return posts.map(toPost);
      } catch (err) {
        console.error("[Storage] Mongo getPosts error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    return store.posts
      .filter((p) => p.pageId === pageId)
      .sort((a, b) => {
        const tA = new Date(a.scheduledTime || a.createdAt || 0).getTime();
        const tB = new Date(b.scheduledTime || b.createdAt || 0).getTime();
        return tB - tA;
      });
  }

  static async createPost(
    postData: Partial<IScheduledPost> & {
      pageId: string;
      caption: string;
      scheduledTime: Date | string;
      status: IScheduledPost["status"];
    }
  ): Promise<IScheduledPost> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const created = await ScheduledPost.create({
          pageId: postData.pageId,
          caption: postData.caption,
          imageUrl: postData.imageUrl || "",
          scheduledTime: new Date(postData.scheduledTime),
          status: postData.status,
          fbPostId: postData.fbPostId || "",
          errorLog: postData.errorLog || "",
        });
        return toPost(created);
      } catch (err) {
        console.error("[Storage] Mongo createPost error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    const newPost: IScheduledPost = {
      _id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      pageId: postData.pageId,
      caption: postData.caption,
      imageUrl: postData.imageUrl || "",
      scheduledTime: new Date(postData.scheduledTime).toISOString(),
      status: postData.status,
      fbPostId: postData.fbPostId || "",
      errorLog: postData.errorLog || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.posts.unshift(newPost);
    writeLocalStore(store);
    return newPost;
  }

  static async getPendingPostsDue(now: Date): Promise<IScheduledPost[]> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const posts = await ScheduledPost.find({
          status: "pending",
          scheduledTime: { $lte: now },
        })
          .sort({ scheduledTime: 1 })
          .limit(30);
        return posts.map(toPost);
      } catch (err) {
        console.error(
          "[Storage] Mongo getPendingPostsDue error, using fallback:",
          err
        );
      }
    }

    const store = ensureLocalStore();
    const targetTime = now.getTime();
    return store.posts.filter((p) => {
      if (p.status !== "pending") return false;
      const postTime = new Date(p.scheduledTime).getTime();
      return postTime <= targetTime;
    });
  }

  static async updatePost(
    postId: string,
    updates: Partial<IScheduledPost>
  ): Promise<IScheduledPost | null> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const updated = await ScheduledPost.findByIdAndUpdate(
          postId,
          { $set: updates },
          { new: true }
        );
        if (updated) return toPost(updated);
      } catch (err) {
        console.error("[Storage] Mongo updatePost error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    const index = store.posts.findIndex((p) => p._id === postId);
    if (index === -1) return null;

    const updated: IScheduledPost = {
      ...store.posts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.posts[index] = updated;
    writeLocalStore(store);
    return updated;
  }

  // ==================== PRODUCTS & INVENTORY ====================

  static async getProducts(pageId: string): Promise<IProduct[]> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const count = await Product.countDocuments({ pageId });
        if (count === 0) {
          const store = ensureLocalStore();
          const pageProds = store.products.filter((p) => p.pageId === pageId);
          if (pageProds.length > 0) {
            const toInsert = pageProds.map(({ _id: _unused, ...rest }) => rest);
            await Product.insertMany(toInsert);
          }
        }
        const products = await Product.find({ pageId }).sort({ createdAt: -1 });
        return products.map(toProduct);
      } catch (err) {
        console.error("[Storage] Mongo getProducts error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    return store.products
      .filter((p) => p.pageId === pageId)
      .sort((a, b) => {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });
  }

  static async getProduct(id: string): Promise<IProduct | null> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const prod = await Product.findById(id);
        if (prod) return toProduct(prod);
      } catch (err) {
        console.error("[Storage] Mongo getProduct error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    return store.products.find((p) => p._id === id) || null;
  }

  static async createProduct(
    productData: Partial<IProduct> & {
      pageId: string;
      name: string;
      price: number;
      stock: number;
    }
  ): Promise<IProduct> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const created = await Product.create({
          pageId: productData.pageId,
          name: productData.name.trim(),
          sku: productData.sku?.trim() || `SKU-${Date.now().toString().slice(-4)}`,
          price: Number(productData.price),
          stock: Number(productData.stock),
          keywords: Array.isArray(productData.keywords)
            ? productData.keywords.map((k) => k.trim().toLowerCase())
            : [productData.name.toLowerCase()],
          imageUrl: productData.imageUrl || "",
        });
        return toProduct(created);
      } catch (err) {
        console.error("[Storage] Mongo createProduct error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    const newProduct: IProduct = {
      _id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      pageId: productData.pageId,
      name: productData.name.trim(),
      sku: productData.sku?.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      price: Number(productData.price),
      stock: Number(productData.stock),
      keywords: Array.isArray(productData.keywords)
        ? productData.keywords.map((k) => k.trim().toLowerCase())
        : [productData.name.toLowerCase()],
      imageUrl: productData.imageUrl || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.products.unshift(newProduct);
    writeLocalStore(store);
    return newProduct;
  }

  static async updateProduct(
    id: string,
    updates: Partial<IProduct>
  ): Promise<IProduct | null> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const updated = await Product.findByIdAndUpdate(
          id,
          { $set: updates },
          { new: true }
        );
        if (updated) return toProduct(updated);
      } catch (err) {
        console.error("[Storage] Mongo updateProduct error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    const index = store.products.findIndex((p) => p._id === id);
    if (index === -1) return null;

    const updated: IProduct = {
      ...store.products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.products[index] = updated;
    writeLocalStore(store);
    return updated;
  }

  static async deleteProduct(id: string): Promise<boolean> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const deleted = await Product.findByIdAndDelete(id);
        if (deleted) return true;
      } catch (err) {
        console.error("[Storage] Mongo deleteProduct error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    const initialLen = store.products.length;
    store.products = store.products.filter((p) => p._id !== id);
    if (store.products.length !== initialLen) {
      writeLocalStore(store);
      return true;
    }
    return false;
  }

  static async decrementProductStock(
    productId: string,
    quantity: number = 1
  ): Promise<IProduct | null> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const updated = await Product.findOneAndUpdate(
          { _id: productId, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } },
          { new: true }
        );
        if (updated) return toProduct(updated);
      } catch (err) {
        console.error("[Storage] Mongo decrementProductStock error:", err);
      }
    }

    const store = ensureLocalStore();
    const index = store.products.findIndex((p) => p._id === productId);
    if (index === -1) return null;

    const currentStock = store.products[index].stock || 0;
    const newStock = Math.max(0, currentStock - quantity);
    const updated: IProduct = {
      ...store.products[index],
      stock: newStock,
      updatedAt: new Date().toISOString(),
    };
    store.products[index] = updated;
    writeLocalStore(store);
    return updated;
  }

  static async findProductByKeywords(
    pageId: string,
    text: string
  ): Promise<IProduct | null> {
    const products = await this.getProducts(pageId);
    if (!products.length || !text) return null;

    const normalizedText = text.toLowerCase();

    // 1. Direct name match
    for (const prod of products) {
      if (normalizedText.includes(prod.name.toLowerCase())) {
        return prod;
      }
    }

    // 2. Keyword match
    for (const prod of products) {
      if (Array.isArray(prod.keywords)) {
        for (const kw of prod.keywords) {
          const cleanKw = kw.trim().toLowerCase();
          if (cleanKw && normalizedText.includes(cleanKw)) {
            return prod;
          }
        }
      }
    }

    return null;
  }

  // ==================== ORDERS ====================

  static async getOrders(pageId: string): Promise<IOrder[]> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const count = await Order.countDocuments({ pageId });
        if (count === 0) {
          const store = ensureLocalStore();
          const pageOrders = store.orders.filter((o) => o.pageId === pageId);
          if (pageOrders.length > 0) {
            const toInsert = pageOrders.map(({ _id: _unused, ...rest }) => rest);
            await Order.insertMany(toInsert);
          }
        }
        const orders = await Order.find({ pageId }).sort({ createdAt: -1 });
        return orders.map(toOrder);
      } catch (err) {
        console.error("[Storage] Mongo getOrders error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    return store.orders
      .filter((o) => o.pageId === pageId)
      .sort((a, b) => {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });
  }

  static async getOrder(id: string): Promise<IOrder | null> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const order = await Order.findById(id);
        if (order) return toOrder(order);
      } catch (err) {
        console.error("[Storage] Mongo getOrder error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    return store.orders.find((o) => o._id === id || o.orderNumber === id) || null;
  }

  static async getNextOrderNumber(pageId: string): Promise<string> {
    const orders = await this.getOrders(pageId);
    const count = orders.length + 1;
    return `ORD-${1000 + count}`;
  }

  static async createOrder(
    orderData: Partial<IOrder> & {
      pageId: string;
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      productName: string;
      totalAmount: number;
    }
  ): Promise<IOrder> {
    const orderNumber =
      orderData.orderNumber || (await this.getNextOrderNumber(orderData.pageId));

    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const created = await Order.create({
          pageId: orderData.pageId,
          orderNumber,
          customerPsid: orderData.customerPsid || "",
          customerName: orderData.customerName.trim(),
          customerPhone: orderData.customerPhone.trim(),
          customerAddress: orderData.customerAddress.trim(),
          productName: orderData.productName.trim(),
          productId: orderData.productId || "",
          quantity: orderData.quantity || 1,
          totalAmount: Number(orderData.totalAmount),
          status: orderData.status || "pending",
          source: orderData.source || "messenger_auto",
          notes: orderData.notes || "",
        });
        return toOrder(created);
      } catch (err) {
        console.error("[Storage] Mongo createOrder error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    const newOrder: IOrder = {
      _id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      pageId: orderData.pageId,
      orderNumber,
      customerPsid: orderData.customerPsid || "",
      customerName: orderData.customerName.trim(),
      customerPhone: orderData.customerPhone.trim(),
      customerAddress: orderData.customerAddress.trim(),
      productName: orderData.productName.trim(),
      productId: orderData.productId || "",
      quantity: orderData.quantity || 1,
      totalAmount: Number(orderData.totalAmount),
      status: orderData.status || "pending",
      source: orderData.source || "messenger_auto",
      notes: orderData.notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.orders.unshift(newOrder);
    writeLocalStore(store);
    return newOrder;
  }

  static async updateOrder(
    id: string,
    updates: Partial<IOrder>
  ): Promise<IOrder | null> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const updated = await Order.findByIdAndUpdate(
          id,
          { $set: updates },
          { new: true }
        );
        if (updated) return toOrder(updated);
      } catch (err) {
        console.error("[Storage] Mongo updateOrder error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    const index = store.orders.findIndex(
      (o) => o._id === id || o.orderNumber === id
    );
    if (index === -1) return null;

    const updated: IOrder = {
      ...store.orders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.orders[index] = updated;
    writeLocalStore(store);
    return updated;
  }

  static async deleteOrder(id: string): Promise<boolean> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const deleted = await Order.findByIdAndDelete(id);
        if (deleted) return true;
      } catch (err) {
        console.error("[Storage] Mongo deleteOrder error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    const initialLen = store.orders.length;
    store.orders = store.orders.filter(
      (o) => o._id !== id && o.orderNumber !== id
    );
    if (store.orders.length !== initialLen) {
      writeLocalStore(store);
      return true;
    }
    return false;
  }

  // ==================== USERS & MULTI-TENANCY ====================

  static async getUserByEmail(email: string): Promise<IUser | null> {
    const cleanEmail = email.toLowerCase().trim();
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const user = await User.findOne({ email: cleanEmail });
        if (user) return toUser(user);
      } catch (err) {
        console.error("[Storage] Mongo getUserByEmail error:", err);
      }
    }

    const store = ensureLocalStore();
    const found = store.users?.find((u) => u.email.toLowerCase() === cleanEmail);
    return found || null;
  }

  static async getUserById(id: string): Promise<IUser | null> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const user = await User.findById(id);
        if (user) return toUser(user);
      } catch (err) {
        console.error("[Storage] Mongo getUserById error:", err);
      }
    }

    const store = ensureLocalStore();
    const found = store.users?.find((u) => u._id === id || u.id === id);
    return found || null;
  }

  static async createUser(userData: {
    email: string;
    name: string;
    password: string;
    role?: "admin" | "merchant";
  }): Promise<IUser> {
    const cleanEmail = userData.email.toLowerCase().trim();
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const created = await User.create({
          email: cleanEmail,
          name: userData.name.trim(),
          password: userData.password,
          role: userData.role || "merchant",
        });
        return toUser(created);
      } catch (err) {
        console.error("[Storage] Mongo createUser error:", err);
      }
    }

    const store = ensureLocalStore();
    const newUser: IUser = {
      _id: `user_${Date.now()}`,
      id: `user_${Date.now()}`,
      email: cleanEmail,
      name: userData.name.trim(),
      password: userData.password,
      role: userData.role || "merchant",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!Array.isArray(store.users)) {
      store.users = [];
    }
    store.users.unshift(newUser);
    writeLocalStore(store);
    return newUser;
  }

  // ==================== AUTOMATION LOGS & IDEMPOTENCY ====================

  static async isEventProcessed(eventId: string): Promise<boolean> {
    if (!eventId || typeof eventId !== "string") return false;
    const cleanEventId = eventId.trim();

    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const count = await AutomationLog.countDocuments({ eventId: cleanEventId });
        return count > 0;
      } catch (err) {
        console.error("[Storage] Mongo isEventProcessed error:", err);
      }
    }

    const store = ensureLocalStore();
    return Boolean(store.logs?.some((l) => l.eventId === cleanEventId));
  }

  static async logAutomationEvent(logData: {
    pageId: string;
    eventId: string;
    eventType: AutomationEventType;
    senderId?: string;
    senderName?: string;
    inputMessage: string;
    replyMessage: string;
    handledBy: string;
    status: AutomationEventStatus;
    error?: string;
  }): Promise<IAutomationLog> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const created = await AutomationLog.create({
          pageId: logData.pageId,
          eventId: logData.eventId,
          eventType: logData.eventType,
          senderId: logData.senderId || "",
          senderName: logData.senderName || "Customer",
          inputMessage: logData.inputMessage || "",
          replyMessage: logData.replyMessage || "",
          handledBy: logData.handledBy || "System",
          status: logData.status || "success",
          error: logData.error || "",
        });
        return toLog(created);
      } catch (err) {
        console.error("[Storage] Mongo logAutomationEvent error:", err);
      }
    }

    const store = ensureLocalStore();
    const newLog: IAutomationLog = {
      _id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      pageId: logData.pageId,
      eventId: logData.eventId,
      eventType: logData.eventType,
      senderId: logData.senderId || "",
      senderName: logData.senderName || "Customer",
      inputMessage: logData.inputMessage || "",
      replyMessage: logData.replyMessage || "",
      handledBy: logData.handledBy || "System",
      status: logData.status || "success",
      error: logData.error || "",
      createdAt: new Date().toISOString(),
    };

    if (!Array.isArray(store.logs)) {
      store.logs = [];
    }
    store.logs.unshift(newLog);
    if (store.logs.length > 200) {
      store.logs = store.logs.slice(0, 200);
    }
    writeLocalStore(store);
    return newLog;
  }

  static async getAutomationLogs(
    pageId?: string,
    limit: number = 50
  ): Promise<IAutomationLog[]> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const filter = pageId ? { pageId } : {};
        const logs = await AutomationLog.find(filter)
          .sort({ createdAt: -1 })
          .limit(limit);
        return logs.map(toLog);
      } catch (err) {
        console.error("[Storage] Mongo getAutomationLogs error:", err);
      }
    }

    const store = ensureLocalStore();
    let logs = store.logs || [];
    if (pageId) {
      logs = logs.filter((l) => l.pageId === pageId);
    }
    return [...logs]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, limit);
  }

  // ==================== SYSTEM & DIAGNOSTICS ====================

  static isFallbackActive(): boolean {
    return isMongoAvailable === false;
  }

  static async recheckMongoConnection(): Promise<boolean> {
    isMongoAvailable = null;
    lastMongoCheckTime = 0;
    return await checkMongoConnection();
  }

  static async getConnectionInfo(): Promise<{
    isConnected: boolean;
    mode: "mongodb_active" | "local_persistent_store";
    location: string;
    currentUri: string;
  }> {
    const isConnected = await checkMongoConnection();
    const rawUri = getMongoUri();
    return {
      isConnected,
      mode: isConnected ? "mongodb_active" : "local_persistent_store",
      location: isConnected
        ? "MongoDB Connection Pool (Mongoose v8)"
        : ".data/db.json (Local JSON Store)",
      currentUri: maskMongoUri(rawUri),
    };
  }
}
