// types.ts
import React from 'react';

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}

export interface DirectDepositData {
  bankName: string;
  routingNumber: string;
  accountNumber: string;
}

export interface Message {
  id: string;
  text?: string;
  sender: 'user' | 'agent';
  groundingChunks?: GroundingChunk[];
  document?: {
    title: string;
    content: string;
  };
  uploadState?: {
    status: 'uploading' | 'processing' | 'success' | 'error';
    fileName: string;
    progress?: number;
    message?: string;
  };
  options?: {
    type: 'avatar';
    items: AgentAvatar[];
    onSelect: (id: string) => void;
  } | {
    type: 'tone';
    items: AgentTone[];
    onSelect: (id: string) => void;
  } | {
    type: 'task';
    items: Task[];
    onSelect: (id: string) => void;
  } | {
    type: 'task_completion';
    taskId: string;
    label: string;
    onSelect: (id:string) => void;
  } | {
    type: 'interactive_map';
    locations: MapLocation[];
    onComplete: (taskId: string) => void;
  } | {
    type: 'request_location';
    label: string;
    onAllow: () => void;
  } | {
    type: 'document_actions';
    actions: { id: string; label: string; }[];
    onSelect: (actionId: string) => void;
  } | {
    type: 'direct_deposit';
    data: DirectDepositData;
    onFieldChange: (field: keyof DirectDepositData, value: string) => void;
    onSubmit: () => void;
  } | {
    type: 'document_upload';
    label: string;
    onUpload: (file: File) => void;
  } | {
    type: 'priority_selection';
    taskId: string;
    onSelect: (priority: 'high' | 'normal') => void;
  }
}

export interface Task {
  id:string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'normal' | 'high';
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface AgentTone {
  id: string;
  label: string;
  description: string;
  promptValue: string;
}

export interface AgentAvatar {
  id: string;
  component: React.FC<React.SVGProps<SVGSVGElement>>;
}
export interface AgentConfig {
  name: string;
  persona: string;
  avatarId: string;
  toneId: string;
}

export interface MapLocation {
  id: string;
  label: string;
  description: string;
  coords: { x: number; y: number };
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}