-- User configurations
CREATE TABLE IF NOT EXISTS user_config (
    user_id TEXT PRIMARY KEY,
    twilio_config TEXT,
    llm_config TEXT,
    deepgram_config TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge base metadata
CREATE TABLE IF NOT EXISTS knowledge_base (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    kb_name TEXT,
    file_path TEXT,
    original_filename TEXT,
    created_at TEXT,
    FOREIGN KEY (user_id) REFERENCES user_config(user_id)
);

-- Knowledge chunks
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    kb_name TEXT,
    chunk_index INTEGER,
    chunk_text TEXT,
    file_path TEXT,
    created_at TEXT,
    FOREIGN KEY (user_id) REFERENCES user_config(user_id)
);

-- Script templates
CREATE TABLE IF NOT EXISTS scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    script_name TEXT,
    script_content TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES user_config(user_id)
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    appointment_date TEXT,
    appointment_time TEXT,
    notes TEXT,
    created_at TEXT,
    FOREIGN KEY (user_id) REFERENCES user_config(user_id)
);

-- Active call sessions
CREATE TABLE IF NOT EXISTS active_calls (
    call_sid TEXT PRIMARY KEY,
    user_id TEXT,
    conversation_history TEXT,
    context TEXT,
    started_at TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_config(user_id)
);

-- Call logs
CREATE TABLE IF NOT EXISTS call_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    call_sid TEXT,
    user_id TEXT,
    from_number TEXT,
    to_number TEXT,
    duration INTEGER,
    conversation_history TEXT,
    started_at TEXT,
    ended_at TEXT,
    FOREIGN KEY (user_id) REFERENCES user_config(user_id)
);