import React from 'react';
import { MentionsInput, Mention } from 'react-mentions';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  profileImageUrl?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  users: User[];
  disabled?: boolean;
}

// Markup matches backend format @[id:name] - id and name stored, only name shown
const MENTION_MARKUP = '@[__id__:__display__]';

const style = {
  control: {
    fontSize: 14,
    minHeight: 40,
    border: '1px solid rgba(0, 0, 0, 0.23)',
    borderRadius: 4,
  },
  input: {
    padding: '8.5px 14px',
    margin: 0,
    fontSize: 14,
    color: 'transparent',
    caretColor: 'var(--text-primary, #1a1a1a)',
  },
  highlighter: {
    padding: '8.5px 14px',
    margin: 0,
    fontSize: 14,
    substring: {
      visibility: 'visible',
      color: 'var(--text-primary, #1a1a1a)',
    },
  },
  '&multiLine': {
    control: { minHeight: 80 },
    highlighter: { padding: 9 },
    input: { padding: 9 },
  },
  suggestions: {
    list: {
      maxHeight: 280,
      overflow: 'auto',
      fontSize: 14,
    },
    item: {
      padding: '10px 14px',
      '&focused': {
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
        color: '#000',
      },
    },
  },
};

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder = 'Write a comment... (use @ to mention)',
  users,
  disabled = false,
}) => {
  const filterSuggestions = (search: string, callback: (items: { id: string; display: string }[]) => void) => {
    const searchLower = search.toLowerCase();
    const filtered = users
      .map((u) => ({ id: String(u.id), display: `${u.firstName} ${u.lastName}` }))
      .filter((u) => u.display.toLowerCase().includes(searchLower));
    callback(filtered.slice(0, 8));
  };

  return (
    <MentionsInput
      className="mention-input"
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      style={style}
      allowSuggestionsAboveCursor
      disabled={disabled}
    >
      <Mention
        trigger="@"
        data={filterSuggestions}
        markup={MENTION_MARKUP}
        displayTransform={(_, display) => `@${display}`}
        appendSpaceOnAdd
        className="mention-chip"
        style={{
          backgroundColor: 'rgba(241, 78, 30, 0.2)',
          color: '#1a1a1a',
          padding: 0,
          margin: 0,
          borderRadius: 4,
          fontWeight: 500,
        }}
      />
    </MentionsInput>
  );
};

export default MentionInput;
