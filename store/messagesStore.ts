import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  text: string;
  from: 'buyer' | 'farmer';
  at: number;
}

export interface Conversation {
  id: string; // `${buyerId}__${farmerId}`
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  farmerId: string;
  farmerName: string;
  farmerAvatar: string;
  messages: ChatMessage[];
  lastReadByBuyer: number;
  lastReadByFarmer: number;
  /** Was this conversation initiated by the buyer (i.e. farmer is allowed to reply)? */
  initiatedByBuyer: boolean;
}

interface MessagesStore {
  conversations: Record<string, Conversation>;
  /**
   * Buyer starts (or opens an existing) conversation with a farmer.
   * Farmers cannot create conversations — they can only reply to one that already exists.
   */
  startAsBuyer: (
    buyerId: string,
    buyerName: string,
    buyerAvatar: string,
    farmerId: string,
    farmerName: string,
    farmerAvatar: string
  ) => Conversation;
  sendAsBuyer: (conversationId: string, text: string) => void;
  sendAsFarmer: (conversationId: string, text: string) => void;
  markRead: (conversationId: string, role: 'buyer' | 'farmer') => void;
  /** All conversations a given buyer participates in. */
  conversationsForBuyer: (buyerId: string) => Conversation[];
  /** All conversations addressed *to* a given farmer. */
  conversationsForFarmer: (farmerId: string) => Conversation[];
  /** Total unread for the active role / user. */
  unreadCountFor: (role: 'buyer' | 'farmer', userId: string) => number;
}

const FARMER_REPLIES = [
  'مرحبا! كيف ممكن أساعدك؟',
  'البندورة طازة جداً اليوم 🍅',
  'حابب أرسلها متى؟',
  'تمام، طلبك جاهز للتجهيز.',
];

const buildId = (buyerId: string, farmerId: string) => `${buyerId}__${farmerId}`;

export const useMessagesStore = create<MessagesStore>()(
  persist(
    (set, get) => ({
      conversations: {},

      startAsBuyer: (buyerId, buyerName, buyerAvatar, farmerId, farmerName, farmerAvatar) => {
        const id = buildId(buyerId, farmerId);
        const existing = get().conversations[id];
        if (existing) return existing;
        const created: Conversation = {
          id,
          buyerId,
          buyerName,
          buyerAvatar,
          farmerId,
          farmerName,
          farmerAvatar,
          messages: [],
          lastReadByBuyer: Date.now(),
          lastReadByFarmer: 0,
          initiatedByBuyer: true,
        };
        set({ conversations: { ...get().conversations, [id]: created } });
        return created;
      },

      sendAsBuyer: (conversationId, text) => {
        const c = get().conversations[conversationId];
        if (!c) return;
        const msg: ChatMessage = {
          id: `m-${Date.now()}`,
          text,
          from: 'buyer',
          at: Date.now(),
        };
        set({
          conversations: {
            ...get().conversations,
            [conversationId]: { ...c, messages: [...c.messages, msg] },
          },
        });
        // Simulate a farmer reply for the demo if no Supabase realtime is wired.
        setTimeout(() => {
          const conv = get().conversations[conversationId];
          if (!conv) return;
          const reply: ChatMessage = {
            id: `m-${Date.now()}-r`,
            text: FARMER_REPLIES[Math.floor(Math.random() * FARMER_REPLIES.length)],
            from: 'farmer',
            at: Date.now(),
          };
          set({
            conversations: {
              ...get().conversations,
              [conversationId]: { ...conv, messages: [...conv.messages, reply] },
            },
          });
        }, 1200);
      },

      sendAsFarmer: (conversationId, text) => {
        const c = get().conversations[conversationId];
        // Farmer can only reply to a buyer-initiated conversation with at least one buyer message.
        if (!c || !c.initiatedByBuyer) return;
        const hasBuyerMsg = c.messages.some((m) => m.from === 'buyer');
        if (!hasBuyerMsg) return;
        const msg: ChatMessage = {
          id: `m-${Date.now()}-f`,
          text,
          from: 'farmer',
          at: Date.now(),
        };
        set({
          conversations: {
            ...get().conversations,
            [conversationId]: { ...c, messages: [...c.messages, msg] },
          },
        });
      },

      markRead: (conversationId, role) => {
        const c = get().conversations[conversationId];
        if (!c) return;
        const next: Conversation =
          role === 'buyer'
            ? { ...c, lastReadByBuyer: Date.now() }
            : { ...c, lastReadByFarmer: Date.now() };
        set({ conversations: { ...get().conversations, [conversationId]: next } });
      },

      conversationsForBuyer: (buyerId) =>
        Object.values(get().conversations).filter((c) => c.buyerId === buyerId),

      conversationsForFarmer: (farmerId) =>
        Object.values(get().conversations).filter((c) => c.farmerId === farmerId),

      unreadCountFor: (role, userId) => {
        let unread = 0;
        for (const c of Object.values(get().conversations)) {
          if (role === 'buyer' && c.buyerId === userId) {
            unread += c.messages.filter((m) => m.from === 'farmer' && m.at > c.lastReadByBuyer).length;
          } else if (role === 'farmer' && c.farmerId === userId) {
            unread += c.messages.filter((m) => m.from === 'buyer' && m.at > c.lastReadByFarmer).length;
          }
        }
        return unread;
      },
    }),
    {
      name: 'fallahy.messages.v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helpers used by the farmer dashboard / chat seeding to populate a couple
// of demo conversations on first launch so the screen isn't empty.
export function seedFarmerDemoConversations(farmerId: string, farmerName: string, farmerAvatar: string) {
  const state = useMessagesStore.getState();
  const existing = state.conversationsForFarmer(farmerId);
  if (existing.length > 0) return;

  const samples: { buyerId: string; buyerName: string; buyerAvatar: string; first: string }[] = [
    {
      buyerId: 'demo-buyer-1',
      buyerName: 'سارة من رام الله',
      buyerAvatar: 'https://i.pravatar.cc/200?img=47',
      first: 'مرحبا، البندورة بعدها طازة؟',
    },
    {
      buyerId: 'demo-buyer-2',
      buyerName: 'محمد من نابلس',
      buyerAvatar: 'https://i.pravatar.cc/200?img=33',
      first: 'بدي اطلب 5 كيلو بندورة، وقت التوصيل؟',
    },
  ];

  for (const s of samples) {
    const id = buildId(s.buyerId, farmerId);
    const convo: Conversation = {
      id,
      buyerId: s.buyerId,
      buyerName: s.buyerName,
      buyerAvatar: s.buyerAvatar,
      farmerId,
      farmerName,
      farmerAvatar,
      messages: [
        { id: `seed-${id}-1`, text: s.first, from: 'buyer', at: Date.now() - 60_000 * Math.floor(Math.random() * 30 + 5) },
      ],
      lastReadByBuyer: Date.now(),
      lastReadByFarmer: 0,
      initiatedByBuyer: true,
    };
    useMessagesStore.setState((prev) => ({
      conversations: { ...prev.conversations, [id]: convo },
    }));
  }
}
