-- Verify SMS is OFF for all non-owner users and ON-allowed for owner.
SELECT
  email,
  reminder_preferences #>> '{ambient,sms}'    AS ambient_sms,
  reminder_preferences #>> '{soft_block,sms}' AS soft_block_sms,
  reminder_preferences #>> '{hard_block,sms}' AS hard_block_sms
FROM public.users
ORDER BY (email = 'realsaraf@gmail.com') DESC, email;
