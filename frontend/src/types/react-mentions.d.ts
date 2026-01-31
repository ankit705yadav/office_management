declare module 'react-mentions' {
  import { ComponentType, ReactNode } from 'react';

  export interface MentionInputProps {
    value?: string;
    onChange?: (event: unknown, newValue: string, plainText: string, mentions: unknown[]) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    placeholder?: string;
    style?: Record<string, unknown>;
    className?: string;
    allowSuggestionsAboveCursor?: boolean;
    forceSuggestionsAboveCursor?: boolean;
    appendSpaceOnAdd?: boolean;
    disabled?: boolean;
    children?: ReactNode;
  }

  export interface MentionProps {
    trigger?: string;
    data?: { id: string; display: string }[] | ((query: string, callback: (items: { id: string; display: string }[]) => void) => void);
    markup?: string;
    displayTransform?: (id: string, display: string) => string;
    appendSpaceOnAdd?: boolean;
    style?: React.CSSProperties;
    className?: string;
  }

  export const MentionsInput: ComponentType<MentionInputProps>;
  export const Mention: ComponentType<MentionProps>;
}
