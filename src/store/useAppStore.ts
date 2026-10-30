import { create } from "zustand";
import { IConnectedPage, IAutomationRule } from "@/types";

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

interface AppState {
  pages: IConnectedPage[];
  activePage: IConnectedPage | null;
  isLoading: boolean;
  isConnectModalOpen: boolean;
  isRuleModalOpen: boolean;
  editingRule: IAutomationRule | null;
  toast: ToastState | null;

  // Actions
  setConnectModalOpen: (open: boolean) => void;
  setRuleModalOpen: (open: boolean, rule?: IAutomationRule | null) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  clearToast: () => void;
  setActivePage: (page: IConnectedPage | null) => void;
  fetchPages: () => Promise<void>;
  togglePageAutomation: (pageId: string) => Promise<boolean>;
  saveRule: (pageId: string, rule: IAutomationRule) => Promise<boolean>;
  toggleRuleStatus: (pageId: string, ruleId: string) => Promise<boolean>;
  deleteRule: (pageId: string, ruleId: string) => Promise<boolean>;
  updateDefaultInboxReply: (pageId: string, text: string) => Promise<boolean>;
  removePage: (pageId: string) => Promise<boolean>;
}

export const useAppStore = create<AppState>((set, get) => ({
  pages: [],
  activePage: null,
  isLoading: false,
  isConnectModalOpen: false,
  isRuleModalOpen: false,
  editingRule: null,
  toast: null,

  setConnectModalOpen: (open) => set({ isConnectModalOpen: open }),

  setRuleModalOpen: (open, rule = null) =>
    set({ isRuleModalOpen: open, editingRule: rule }),

  showToast: (message, type = "info") => {
    set({ toast: { message, type } });
    setTimeout(() => {
      if (get().toast?.message === message) {
        set({ toast: null });
      }
    }, 4500);
  },

  clearToast: () => set({ toast: null }),

  setActivePage: (page) => set({ activePage: page }),

  fetchPages: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/pages");
      const data = await res.json();
      if (res.ok && Array.isArray(data.pages)) {
        const pages: IConnectedPage[] = data.pages;
        set({ pages });

        // Maintain active page or select the first one
        const currentActive = get().activePage;
        if (!currentActive && pages.length > 0) {
          set({ activePage: pages[0] });
        } else if (currentActive) {
          const updatedActive = pages.find(
            (p) => p.pageId === currentActive.pageId
          );
          set({ activePage: updatedActive || pages[0] || null });
        }
      }
    } catch (err) {
      console.error("Failed to fetch pages:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  togglePageAutomation: async (pageId: string) => {
    const page = get().pages.find((p) => p.pageId === pageId);
    if (!page) return false;

    const newStatus = !page.autoReplyEnabled;

    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoReplyEnabled: newStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        get().showToast(data.error || "Failed to toggle automation.", "error");
        return false;
      }

      set((state) => {
        const updatedPages = state.pages.map((p) =>
          p.pageId === pageId ? { ...p, autoReplyEnabled: newStatus } : p
        );
        return {
          pages: updatedPages,
          activePage:
            state.activePage?.pageId === pageId
              ? { ...state.activePage, autoReplyEnabled: newStatus }
              : state.activePage,
        };
      });

      get().showToast(
        `Automation ${newStatus ? "resumed" : "paused"} for ${page.pageName}`,
        "success"
      );
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      get().showToast(error.message, "error");
      return false;
    }
  },

  saveRule: async (pageId: string, rule: IAutomationRule) => {
    const page = get().pages.find((p) => p.pageId === pageId);
    if (!page) return false;

    const existingIndex = page.rules.findIndex((r) => r.id === rule.id);
    let updatedRules: IAutomationRule[];

    if (existingIndex >= 0) {
      updatedRules = [...page.rules];
      updatedRules[existingIndex] = rule;
    } else {
      updatedRules = [rule, ...page.rules];
    }

    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: updatedRules }),
      });
      const data = await res.json();

      if (!res.ok) {
        get().showToast(data.error || "Failed to save rule.", "error");
        return false;
      }

      set((state) => {
        const updatedPages = state.pages.map((p) =>
          p.pageId === pageId ? { ...p, rules: updatedRules } : p
        );
        return {
          pages: updatedPages,
          activePage:
            state.activePage?.pageId === pageId
              ? { ...state.activePage, rules: updatedRules }
              : state.activePage,
          isRuleModalOpen: false,
          editingRule: null,
        };
      });

      get().showToast("Keyword automation rule saved successfully!", "success");
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      get().showToast(error.message, "error");
      return false;
    }
  },

  toggleRuleStatus: async (pageId: string, ruleId: string) => {
    const page = get().pages.find((p) => p.pageId === pageId);
    if (!page) return false;

    const updatedRules = page.rules.map((r) =>
      r.id === ruleId ? { ...r, isActive: !r.isActive } : r
    );

    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: updatedRules }),
      });
      const data = await res.json();

      if (!res.ok) {
        get().showToast(data.error || "Failed to update rule.", "error");
        return false;
      }

      set((state) => {
        const updatedPages = state.pages.map((p) =>
          p.pageId === pageId ? { ...p, rules: updatedRules } : p
        );
        return {
          pages: updatedPages,
          activePage:
            state.activePage?.pageId === pageId
              ? { ...state.activePage, rules: updatedRules }
              : state.activePage,
        };
      });

      return true;
    } catch (err: unknown) {
      const error = err as Error;
      get().showToast(error.message, "error");
      return false;
    }
  },

  deleteRule: async (pageId: string, ruleId: string) => {
    const page = get().pages.find((p) => p.pageId === pageId);
    if (!page) return false;

    const updatedRules = page.rules.filter((r) => r.id !== ruleId);

    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: updatedRules }),
      });
      const data = await res.json();

      if (!res.ok) {
        get().showToast(data.error || "Failed to delete rule.", "error");
        return false;
      }

      set((state) => {
        const updatedPages = state.pages.map((p) =>
          p.pageId === pageId ? { ...p, rules: updatedRules } : p
        );
        return {
          pages: updatedPages,
          activePage:
            state.activePage?.pageId === pageId
              ? { ...state.activePage, rules: updatedRules }
              : state.activePage,
        };
      });

      get().showToast("Rule removed successfully.", "info");
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      get().showToast(error.message, "error");
      return false;
    }
  },

  updateDefaultInboxReply: async (pageId: string, text: string) => {
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultInboxReply: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        get().showToast(data.error || "Failed to update default reply.", "error");
        return false;
      }

      set((state) => {
        const updatedPages = state.pages.map((p) =>
          p.pageId === pageId ? { ...p, defaultInboxReply: text } : p
        );
        return {
          pages: updatedPages,
          activePage:
            state.activePage?.pageId === pageId
              ? { ...state.activePage, defaultInboxReply: text }
              : state.activePage,
        };
      });

      get().showToast("Default Messenger auto-reply updated!", "success");
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      get().showToast(error.message, "error");
      return false;
    }
  },

  removePage: async (pageId: string) => {
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        get().showToast(data.error || "Failed to disconnect page.", "error");
        return false;
      }

      set((state) => {
        const remaining = state.pages.filter((p) => p.pageId !== pageId);
        return {
          pages: remaining,
          activePage: remaining[0] || null,
        };
      });

      get().showToast("Page disconnected successfully.", "info");
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      get().showToast(error.message, "error");
      return false;
    }
  },
}));
