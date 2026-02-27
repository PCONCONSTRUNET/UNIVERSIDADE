SELECT cron.schedule(
  'expire-subscriptions-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://yqprmygoguauebuttrle.supabase.co/functions/v1/expire-subscriptions',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxcHJteWdvZ3VhdWVidXR0cmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTEwODEsImV4cCI6MjA4NzM4NzA4MX0.IkvlmIVkMybvYx8Sj2Mdq0hTe7kaSpi97fRW9nU5Oy8"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);