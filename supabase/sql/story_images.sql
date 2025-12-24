-- Cache table for generated Story background illustrations.
-- Used by: supabase/functions/story-image

create table if not exists story_images (
  key text primary key,
  phrase text not null,
  sense text not null,
  style text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_story_images_created_at on story_images(created_at desc);

-- Cache table for Recraft-generated Story background illustrations.
-- Used by: supabase/functions/story-image-recraft

create table if not exists story_images_recraft (
  key text primary key,
  phrase text not null,
  sense text not null,
  image_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_story_images_recraft_created_at on story_images_recraft(created_at desc);
