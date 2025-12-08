-- Cache table for news feed
create table if not exists news_feed (
  id uuid primary key default gen_random_uuid(),
  fetched_at timestamptz not null,
  status text not null check (status in ('ok','stale','error')),
  payload jsonb not null,
  source_error text null
);

create index if not exists idx_news_feed_fetched_at on news_feed(fetched_at desc);
