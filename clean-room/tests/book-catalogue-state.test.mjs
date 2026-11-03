import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('book reconciliation keeps approved artwork intact and separates production, publication and revision holds for every title',async()=>{
 const migrations=new URL('../../supabase/migrations/',import.meta.url);
 const path=process.env.BOOK_STATE_MIGRATION ?? new URL((await readdir(migrations)).find(f=>f.endsWith('_book_catalogue_state_reconciliation.sql')),migrations);
 const sql=await readFile(path,'utf8');const rows=JSON.parse(sql.match(/\$books\$([\s\S]*?)\$books\$/)[1]);assert.equal(rows.length,43);assert.equal(new Set(rows.map(r=>r.bookId)).size,43);
 const db=new PGlite();try{
 await db.exec(`create table command_center_book_catalogue(owner_id uuid,book_id text,catalogue_order integer constraint command_center_book_catalogue_catalogue_order_check check(catalogue_order between 1 and 41),title text,author_name text,cover_slot integer not null,cover_asset_ref text not null,cover_blob_sha text not null,cover_approved boolean default false,source_ref text,primary key(owner_id,book_id));
 insert into command_center_book_catalogue select '00000000-0000-4000-8000-000000000001','book:catalogue:'||lpad(n::text,3,'0'),n,'Saved title '||n,'James Morgan',n-1,'approved-art','original-hash',true,'cover-evidence' from generate_series(1,41) n;`);
 await db.exec(sql);
 const books=(await db.query('select * from command_center_book_catalogue order by catalogue_order')).rows;
 assert.equal(books.length,43);assert.ok(books.slice(0,41).every(b=>b.cover_approved&&b.cover_blob_sha==='original-hash'));assert.ok(books.slice(41).every(b=>!b.cover_approved&&b.cover_slot===null));
 assert.match(books[42].production_state,/On hold/);assert.equal(books[42].production_percent,null);assert.match(books[41].production_state,/publication not confirmed/);
 assert.equal(books[23].publication.Paperback,'Published (owner confirmed)');assert.equal(books[25].publication.Paperback,'Pending print rollout');assert.equal(books[27].publication.Paperback,'Not scheduled for Book 5');
 assert.equal(books[34].publication.Kindle,'Not scheduled: print-only cookbook');assert.equal(books[34].publication.Hardcover,'Published (owner confirmed)');
 assert.equal(books[35].production_percent,null);assert.equal(books[35].production_state,'No production checkpoint recovered');assert.equal(books[2].production_percent,null);assert.match(books[2].production_state,/prior completion superseded/);
 await assert.rejects(db.exec("update command_center_book_catalogue set cover_approved=true where book_id='book:catalogue:043'"),/approved_cover_requires_asset/);
 }finally{await db.close();}
});
