DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS skus;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS orders;
CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE skus(id INTEGER PRIMARY KEY,name TEXT,cat TEXT,comp TEXT,gsm INTEGER,w INTEGER,usd REAL,mode TEXT,corr TEXT,bay INTEGER,imp INTEGER,fill INTEGER,tgt INTEGER,yld REAL,y TEXT,roll INTEGER,pal TEXT,dyes TEXT,fins TEXT,frt REAL,duty REAL,lm REAL,step INTEGER);
CREATE TABLE sessions(token TEXT PRIMARY KEY,email TEXT,name TEXT,exp INTEGER);
CREATE TABLE orders(seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT,email TEXT,business TEXT,name TEXT,phone TEXT,contact_email TEXT,tin TEXT,division TEXT,district TEXT,address TEXT,receiver TEXT,win TEXT,pay_method TEXT,sku_id INTEGER,sku_name TEXT,descr TEXT,unit TEXT,qty INTEGER,yards INTEGER,amount INTEGER,note TEXT,stage INTEGER DEFAULT 0,created INTEGER);
CREATE INDEX idx_orders_email ON orders(email);
