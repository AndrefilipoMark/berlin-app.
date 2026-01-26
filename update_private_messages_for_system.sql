-- =====================================================
-- UPDATE PRIVATE_MESSAGES TABLE FOR SYSTEM MESSAGES
-- =====================================================

-- Додаємо поле message_type для розрізнення типів повідомлень
ALTER TABLE private_messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'user';

-- Додаємо поле metadata для зберігання додаткової інформації (JSON)
ALTER TABLE private_messages 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Створюємо індекс для швидкого пошуку системних повідомлень
CREATE INDEX IF NOT EXISTS idx_private_messages_type ON private_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_private_messages_metadata ON private_messages USING GIN(metadata);

-- Коментарі для полів
COMMENT ON COLUMN private_messages.message_type IS 'Тип повідомлення: user - звичайне, friend_request - запит на дружбу';
COMMENT ON COLUMN private_messages.metadata IS 'Додаткова інформація у форматі JSON (наприклад, friend_request_id)';
