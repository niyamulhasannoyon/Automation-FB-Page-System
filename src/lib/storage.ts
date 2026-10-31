import fs from "fs";
import path from "path";
import connectToDatabase from "./db";
import ConnectedPage from "@/models/ConnectedPage";
import ScheduledPost from "@/models/ScheduledPost";
import { IConnectedPage, IScheduledPost } from "@/types";

interface LocalStoreData {
  pages: IConnectedPage[];
  posts: IScheduledPost[];
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
  return {
    ...(obj as unknown as IConnectedPage),
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

function ensureLocalStore(): LocalStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("[Storage] Error reading local store:", err);
  }

  // Initial seed data for offline / local evaluation
  const seedData: LocalStoreData = {
    pages: [
      {
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
  } catch (err) {
    console.warn(
      "[Storage] MongoDB offline or unreachable. Using persistent local development store (.data/db.json)."
    );
    isMongoAvailable = false;
    return false;
  }
}

export class AppStorage {
  // ==================== PAGES ====================

  static async getAllPages(): Promise<IConnectedPage[]> {
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const pages = await ConnectedPage.find({}).sort({ updatedAt: -1 });
        return pages.map(toPage);
      } catch (err) {
        console.error("[Storage] Mongo getAllPages error, using fallback:", err);
      }
    }

    const store = ensureLocalStore();
    return [...store.pages].sort((a, b) => {
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
    const hasMongo = await checkMongoConnection();
    if (hasMongo) {
      try {
        const updated = await ConnectedPage.findOneAndUpdate(
          { pageId: pageData.pageId },
          {
            $set: {
              pageName: pageData.pageName,
              pagePicture: pageData.pagePicture,
              pageAccessToken: pageData.pageAccessToken,
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

  static isFallbackActive(): boolean {
    return isMongoAvailable === false;
  }
}
