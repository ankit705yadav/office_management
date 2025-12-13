-- Chat Tables Migration
-- Run this SQL to add chat functionality to the database

-- Create enum types for chat
DO $$ BEGIN
    CREATE TYPE conversation_type AS ENUM ('direct', 'group');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'file', 'image', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE device_platform AS ENUM ('ios', 'android', 'web');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Chat Conversations Table
CREATE TABLE IF NOT EXISTS chat_conversations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    type conversation_type NOT NULL DEFAULT 'direct',
    avatar_url TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Participants Table
CREATE TABLE IF NOT EXISTS chat_participants (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_admin BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    message_type message_type NOT NULL DEFAULT 'text',
    reply_to_id INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Attachments Table
CREATE TABLE IF NOT EXISTS chat_attachments (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    file_id INTEGER REFERENCES storage_files(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    thumbnail_key VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat User Status Table
CREATE TABLE IF NOT EXISTS chat_user_status (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    device_token VARCHAR(500),
    platform device_platform,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_participants_conversation ON chat_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_message ON chat_attachments(message_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at
    BEFORE UPDATE ON chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_participants_updated_at ON chat_participants;
CREATE TRIGGER update_chat_participants_updated_at
    BEFORE UPDATE ON chat_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_attachments_updated_at ON chat_attachments;
CREATE TRIGGER update_chat_attachments_updated_at
    BEFORE UPDATE ON chat_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_user_status_updated_at ON chat_user_status;
CREATE TRIGGER update_chat_user_status_updated_at
    BEFORE UPDATE ON chat_user_status
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;
