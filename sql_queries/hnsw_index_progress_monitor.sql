-- Run this query periodically in the Supabase SQL editor to monitor HNSW index creation progress

SELECT
  i.pid,
  phase,
  tuples_total,
  tuples_done,
  CASE WHEN tuples_total > 0 THEN ROUND((tuples_done::numeric / tuples_total::numeric) * 100, 2) ELSE 0 END AS percent_complete,
  EXTRACT(EPOCH FROM (now() - query_start))::integer AS seconds_elapsed
FROM pg_stat_progress_create_index i
JOIN pg_stat_activity a ON i.pid = a.pid
WHERE a.query ILIKE '%chunks_embedding_hnsw_idx%'; 