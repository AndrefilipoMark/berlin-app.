-- =====================================================
-- ВИПРАВЛЕННЯ RLS ДЛЯ ТАБЛИЦІ public.messages
-- =====================================================
-- Security Advisor: "Policy Exists RLS Disabled" та "RLS Disabled in Public"
-- Проблема: політики RLS налаштовані, але RLS вимкнено на таблиці
-- Рішення: увімкнути Row Level Security
-- =====================================================
-- Виконайте в Supabase: SQL Editor → New query → вставте → Run
-- =====================================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
