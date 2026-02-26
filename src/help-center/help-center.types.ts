/**
 * Help Center Socket.IO event payload types.
 * Use these on the server and mirror in mobile clients for type safety.
 */

export type HelpCenterSender = 'user' | 'support';

export interface HelpCenterMessagePayload {
  id: string;
  conversationId: string;
  sender: HelpCenterSender;
  text: string;
  createdAt: string; // ISO 8601
}

export interface HelpCenterConversationPayload {
  id: string;
  userId: string;
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
}

/** Emitted to client on connection (help_center:connected) */
export interface HelpCenterConnectedPayload {
  conversation: HelpCenterConversationPayload;
  messages: HelpCenterMessagePayload[];
}

/** Client sends (help_center:send); server validates */
export interface HelpCenterSendPayload {
  text: string;
}

/** Server emits (help_center:message) */
export type HelpCenterMessageEventPayload = HelpCenterMessagePayload;

/** Server emits (help_center:error) */
export interface HelpCenterErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Client sends (help_center:typing); server echoes to same user room (optional) */
export interface HelpCenterTypingPayload {
  isTyping: boolean;
}

/** Server emits (help_center:typing) - support typing indicator for future use */
export interface HelpCenterTypingEventPayload {
  isTyping: boolean;
  sender: 'support';
}
