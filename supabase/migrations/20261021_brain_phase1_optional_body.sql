-- Durable Memory follow-up: body text is optional; a title may stand alone.
alter table public.brain_memories alter column body drop not null;
comment on column public.brain_memories.body is 'Optional durable-memory detail text. Title may stand alone when no additional body is needed.';
