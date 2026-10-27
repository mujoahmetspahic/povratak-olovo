POVRATAK OLOVO — početni paket za administraciju

Ovaj paket je pripremljen kao početni projekat. NIJE još objavljen i ne mijenja postojeću stranicu.
Prije upotrebe treba konfigurirati Cloudflare Worker, D1 bazu, R2 spremište fotografija i tajne
vrijednosti ADMIN_PASSWORD i SESSION_SECRET. Ne stavljati lozinke ni tajne u GitHub.

Datoteke:
- worker.js: početni API za prijavu i upravljanje objavama.
- schema.sql: tabela sadržaja i nekoliko početnih objava.
- wrangler.toml: primjer Cloudflare konfiguracije; potrebno je unijeti D1 ID.
- public/index.html: početna javna stranica.
- public/admin.html: ekran administracije.
- public/app.js i public/style.css: izgled i logika.

Nemoj postavljati ovaj paket preko postojećeg projekta `olovo` dok se testna verzija ne provjeri.
Besplatne kvote i uslovi Cloudflarea mogu se mijenjati. Ne treba kupovati Zero Trust samo zbog CMS-a.
Ovo je početni kostur, a ne certificirana produkcijska aplikacija. Prije javne upotrebe potrebno je
testirati prijavu, zaštitu sesije, upload, pristup fotografijama, sigurnosne kopije i ograničenja zahtjeva.
