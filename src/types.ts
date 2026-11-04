export interface ProjectFile {
  name: string;
  path: string;
  content: string;
  language: 'html' | 'css' | 'javascript' | 'typescript' | 'json' | 'markdown';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  entryFile: string;
  activeFilePath: string;
  createdAt: string;
  updatedAt: string;
  files: Record<string, ProjectFile>;
  isShared?: boolean;
  ownerEmail?: string;
  ownerName?: string;
  sharedWith?: string[];
  role?: 'owner' | 'editor' | 'viewer';
  architecturePlan?: any;
  qualityReport?: any;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  credits: number;
  avatarUrl?: string;
  createdAt: string;
}

export interface CollaboratorUser {
  id: string;
  name: string;
  email: string;
  plan?: string;
  color?: string;
  activeFile?: string;
  cursor?: { line: number; ch: number };
}

export interface CollaborationInvite {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  toUserEmail: string;
  toEmail?: string;
  toUserName?: string;
  projectId: string;
  projectName: string;
  projectDescription?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}

export interface DirectSMSMessage {
  id: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  text: string;
  timestamp: string;
  createdAt: string;
  read: boolean;
  audioData?: string;
  audioDuration?: number;
  projectInvite?: {
    inviteId: string;
    projectId: string;
    projectName: string;
    projectDescription?: string;
    status: 'pending' | 'accepted' | 'declined';
  };
}

export interface ChatMessage {
  id: string;
  role?: 'user' | 'assistant' | 'system';
  sender?: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  provider?: string;
  model?: string;
  fileReference?: string;
  architecturePlan?: any;
  updatedFileInfo?: {
    path?: string;
    filePath?: string;
    name?: string;
    content?: string;
    description?: string;
  };
  projectGenerated?: {
    projectName: string;
    description: string;
    entryFile: string;
    files: Record<string, string>;
    architecturePlan?: any;
  };
  codeBlocks?: {
    language: string;
    code: string;
    path?: string;
  }[];
  applied?: boolean;
  suggestedAction?: {
    type: 'apply_code' | 'create_file' | 'audit' | 'plan';
    label: string;
    data?: any;
  };
}

export interface ArchitecturePlanResult {
  projectName: string;
  recommendedStack: string[];
  structure: { path: string; purpose: string }[];
  keyFeatures: string[];
  designTokens: {
    primaryColor: string;
    typography: string;
  };
}

export interface QualityAuditResult {
  score: number;
  issues: {
    type: 'error' | 'warning' | 'info';
    message: string;
    file?: string;
  }[];
  passedChecks: string[];
}
