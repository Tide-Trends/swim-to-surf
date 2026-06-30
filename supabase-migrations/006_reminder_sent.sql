-- Add reminder_sent for 8-day prep email cron (resets on reschedule).
-- Run in Supabase SQL editor after 005_contact_messages.sql

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;
