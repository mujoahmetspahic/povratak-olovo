CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('news','project')),
  title TEXT NOT NULL,
  category TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  body TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_content_kind ON content(kind, created_at DESC);
INSERT OR IGNORE INTO content (id,kind,title,category,summary,body,published) VALUES
('sample-5k','news','Ulična utrka OLOVO 5K','SPORT','Novosti o utrci, prijavama i pratećim sadržajima.','Ovdje objavite najnovije informacije o utrci.',1),
('sample-kriot','project','Krivaja je naše blago','OKOLIŠ','Pratite aktivnosti za očuvanje rijeke i prirode.','Ovdje objavite novosti i aktivnosti projekta KRIOT.',1);
