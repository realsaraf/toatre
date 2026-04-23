-- One-off: turn OFF the SMS channel in reminder_preferences for every user
-- except the owner (realsaraf@gmail.com). Keeps push/email flags untouched.
--
-- Rationale: Twilio A2P 10DLC campaign is still Under Review. Until approved,
-- SMS traffic should be restricted to the owner's own verified number only,
-- to avoid any third-party delivery and to satisfy Sole Proprietor scope.

UPDATE public.users
SET reminder_preferences = jsonb_set(
      jsonb_set(
        jsonb_set(
          reminder_preferences,
          '{ambient,sms}',    to_jsonb(false)
        ),
        '{soft_block,sms}',   to_jsonb(false)
      ),
      '{hard_block,sms}',     to_jsonb(false)
    )
WHERE email <> 'realsaraf@gmail.com'
  AND (
       (reminder_preferences #>> '{ambient,sms}')    = 'true'
    OR (reminder_preferences #>> '{soft_block,sms}') = 'true'
    OR (reminder_preferences #>> '{hard_block,sms}') = 'true'
  );
