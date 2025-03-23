BEGIN;
SET LOCAL statement_timeout = '43200000'; -- 12 hours in milliseconds

CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx
ON chunks
USING hnsw (embedding vector_l2_ops)
WITH (m = 16, ef_construction = 100);

COMMIT;
