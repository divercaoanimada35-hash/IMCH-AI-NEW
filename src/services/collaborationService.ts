import { CollaboratorUser, CollaborationInvite, DirectSMSMessage, UserProfile } from '../types';

type SMSListener = (message: DirectSMSMessage) => void;
type InviteListener = (invite: CollaborationInvite) => void;
type CodeUpdateListener = (data: { filePath: string; code: string; userId?: string }) => void;
type PresenceListener = (users: CollaboratorUser[]) => void;

class CollaborationService {
  private ws: WebSocket | null = null;
  private smsListeners: Set<SMSListener> = new Set();
  private inviteListeners: Set<InviteListener> = new Set();
  private codeListeners: Set<CodeUpdateListener> = new Set();
  private presenceListeners: Set<PresenceListener> = new Set();
  private currentUserInfo: { id: string; name: string; email: string; plan?: string } | null = null;
  private activeRoomId: string | null = null;

  constructor() {
    this.connectWs();
  }

  private connectWs() {
    if (typeof window === 'undefined') return;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/collab`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (this.currentUserInfo) {
          this.ws?.send(JSON.stringify({ type: 'identify', ...this.currentUserInfo }));
        }
        if (this.activeRoomId && this.currentUserInfo) {
          this.ws?.send(
            JSON.stringify({
              type: 'join_room',
              roomId: this.activeRoomId,
              user: this.currentUserInfo,
            })
          );
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'direct_sms') {
            this.smsListeners.forEach((l) => l(data.message));
          } else if (data.type === 'new_invite') {
            this.inviteListeners.forEach((l) => l(data.invite));
          } else if (data.type === 'code_update') {
            this.codeListeners.forEach((l) => l(data));
          } else if (data.type === 'presence_sync') {
            this.presenceListeners.forEach((l) => l(data.users || []));
          }
        } catch {}
      };

      this.ws.onclose = () => {
        setTimeout(() => this.connectWs(), 3000);
      };
    } catch {
      // Offline fallback
    }
  }

  identify(id: string, name: string, email: string, plan?: string) {
    this.currentUserInfo = { id, name, email, plan };
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'identify', id, name, email, plan }));
    }
  }

  joinRoom(roomId: string, user: UserProfile) {
    this.activeRoomId = roomId;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'join_room', roomId, user }));
    }
  }

  sendCodeEdit(filePath: string, code: string) {
    if (this.ws?.readyState === WebSocket.OPEN && this.activeRoomId) {
      this.ws.send(
        JSON.stringify({
          type: 'code_edit',
          roomId: this.activeRoomId,
          filePath,
          code,
        })
      );
    }
  }

  sendFileFocus(filePath: string) {
    if (this.ws?.readyState === WebSocket.OPEN && this.activeRoomId) {
      this.ws.send(
        JSON.stringify({
          type: 'file_focus',
          roomId: this.activeRoomId,
          filePath,
        })
      );
    }
  }

  onDirectSMS(callback: SMSListener): () => void {
    this.smsListeners.add(callback);
    return () => this.smsListeners.delete(callback);
  }

  onInvite(callback: InviteListener): () => void {
    this.inviteListeners.add(callback);
    return () => this.inviteListeners.delete(callback);
  }

  onCodeUpdate(callback: CodeUpdateListener): () => void {
    this.codeListeners.add(callback);
    return () => this.codeListeners.delete(callback);
  }

  onPresence(callback: PresenceListener): () => void {
    this.presenceListeners.add(callback);
    return () => this.presenceListeners.delete(callback);
  }

  async getInvites(email: string): Promise<CollaborationInvite[]> {
    const res = await fetch(`/api/collaboration/invites?email=${encodeURIComponent(email)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.invites || [];
  }

  async sendInvite(payload: {
    fromUserId: string;
    fromUserName: string;
    fromUserEmail: string;
    toUserEmail: string;
    projectId: string;
    projectName: string;
    projectDescription?: string;
    message?: string;
  }): Promise<CollaborationInvite> {
    const res = await fetch('/api/collaboration/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao enviar convite');
    }
    return res.json();
  }

  async acceptInvite(inviteId: string, email: string): Promise<{ success: boolean; room: any }> {
    const res = await fetch(`/api/collaboration/invites/${inviteId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error('Falha ao aceitar convite.');
    return res.json();
  }

  async declineInvite(inviteId: string, email: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/collaboration/invites/${inviteId}/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error('Falha ao recusar convite.');
    return res.json();
  }

  async getRoom(projectId: string): Promise<any> {
    const res = await fetch(`/api/collaboration/rooms/${projectId}`);
    if (!res.ok) throw new Error('Falha ao aceder à sala de colaboração.');
    return res.json();
  }

  async getMessages(fromEmail: string, toEmail: string): Promise<DirectSMSMessage[]> {
    const res = await fetch(
      `/api/collaboration/messages?user1=${encodeURIComponent(fromEmail)}&user2=${encodeURIComponent(toEmail)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  }

  async sendSMS(payload: {
    fromEmail: string;
    fromName: string;
    toEmail: string;
    toName: string;
    text: string;
    audioData?: string;
    audioDuration?: number;
    projectInvite?: any;
  }): Promise<DirectSMSMessage> {
    const res = await fetch('/api/collaboration/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao enviar mensagem.');
    }
    return res.json();
  }

  async markMessagesRead(fromEmail: string, toEmail: string) {
    await fetch('/api/collaboration/messages/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromEmail, toEmail }),
    }).catch(() => {});
  }

  async getUsers(): Promise<CollaboratorUser[]> {
    const res = await fetch('/api/collaboration/users');
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || [];
  }
}

export const collaborationService = new CollaborationService();
