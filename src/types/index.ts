export type MatchType = "exact" | "contains";

export interface IAutomationRule {
  id: string;
  keyword: string;
  matchType: MatchType;
  commentReply: string;
  sendPrivateInbox: boolean;
  inboxReply?: string;
  isActive: boolean;
}

export interface IConnectedPage {
  _id?: string;
  userId?: string;
  pageId: string;
  pageName: string;
  pagePicture?: string;
  pageAccessToken: string;
  isWebhookSubscribed: boolean;
  autoReplyEnabled: boolean;
  defaultInboxReply?: string;
  rules: IAutomationRule[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type PostStatus = "pending" | "published" | "failed";

export interface IScheduledPost {
  _id?: string;
  pageId: string;
  caption: string;
  imageUrl?: string;
  scheduledTime: string | Date;
  status: PostStatus;
  fbPostId?: string;
  errorLog?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Meta Graph API Types
export interface MetaPageProfile {
  id: string;
  name: string;
  picture?: {
    data?: {
      url: string;
      is_silhouette?: boolean;
    };
  };
}

export interface MetaSubscribedAppsResponse {
  success: boolean;
}

export interface MetaGraphError {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

// Webhook Payload Types
export interface MetaWebhookChangeValue {
  item: string; // 'comment' | 'post' | 'reaction' etc.
  verb: string; // 'add' | 'edit' | 'remove'
  comment_id?: string;
  post_id?: string;
  parent_id?: string;
  message?: string;
  created_time?: number;
  sender_id?: string;
  sender_name?: string;
  from?: {
    id: string;
    name: string;
  };
}

export interface MetaWebhookChange {
  field: string; // 'feed'
  value: MetaWebhookChangeValue;
}

export interface MetaWebhookMessagingItem {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    attachments?: Array<{
      type: string;
      payload: { url?: string };
    }>;
  };
  postback?: {
    title: string;
    payload: string;
  };
}

export interface MetaWebhookEntry {
  id: string; // pageId
  time: number;
  changes?: MetaWebhookChange[];
  messaging?: MetaWebhookMessagingItem[];
}

export interface MetaWebhookPayload {
  object: "page";
  entry: MetaWebhookEntry[];
}

// E-Commerce & Inventory Types
export interface IProduct {
  _id?: string;
  pageId: string;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  keywords: string[];
  imageUrl?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type OrderStatus = "pending" | "confirmed" | "shipped" | "cancelled";
export type OrderSource = "messenger_auto" | "manual";

export interface IOrder {
  _id?: string;
  pageId: string;
  orderNumber: string;
  customerPsid?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  productName: string;
  productId?: string;
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  source: OrderSource;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// User & Auth Types
export interface IUser {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  password?: string;
  role: "admin" | "merchant";
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "merchant";
}

// Automation Live Logs & Deduplication Types
export type AutomationEventType =
  | "comment"
  | "message"
  | "order"
  | "stock_inquiry"
  | "ai_reply"
  | "post_publish";

export type AutomationEventStatus = "success" | "failed" | "duplicate";

export interface IAutomationLog {
  _id?: string;
  pageId: string;
  eventId: string; // comment_id or message.mid for deduplication
  eventType: AutomationEventType;
  senderId?: string;
  senderName?: string;
  inputMessage: string;
  replyMessage: string;
  handledBy: string;
  status: AutomationEventStatus;
  error?: string;
  createdAt?: string | Date;
}

// Admin Panel System Types
export interface IAdminStats {
  totalUsers: number;
  totalMerchants: number;
  totalAdmins: number;
  totalPages: number;
  totalActivePages: number;
  totalWebhookSubscribed: number;
  totalOrders: number;
  totalGmv: number;
  totalLogs: number;
  todayLogs: number;
  totalPosts: number;
  publishedPosts: number;
  databaseStatus: {
    connected: boolean;
    mode: "mongodb" | "local_json";
    uriMasked: string;
    pingMs: number;
  };
  metaStatus: {
    webhookConfigured: boolean;
    appSecretConfigured: boolean;
    apiVersion: string;
    verifyToken: string;
  };
  systemUptime: number;
  emergencyPaused: boolean;
}

export interface IAdminUserItem {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: "admin" | "merchant";
  connectedPagesCount: number;
  createdAt?: string | Date;
}

export interface IAdminPageItem extends IConnectedPage {
  ownerName?: string;
  ownerEmail?: string;
  ordersCount?: number;
  logsCount?: number;
}

