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
