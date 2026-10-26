import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EvidenceBackedBookRegistry } from "../dist/books/index.js";

function registry(){
  const books=new EvidenceBackedBookRegistry();
  books.registerAuthor({id:"author-1",ownerId:"owner-1",displayName:"James Morgan",aliases:[],sourceRefs:["owner:author"],observedAt:"2026-10-26T16:00:00Z",version:1});
  books.registerBookType({key:"fiction",label:"Fiction",rendererKey:"generic-book",allowedRelationshipKinds:["standalone","series","trilogy","collection","umbrella"],sourceRefs:["type:fiction"],version:1});
  return books;
}

test("P11.1 registry preserves author project hierarchy title order and formats",()=>{
  const books=registry();
  books.registerBook({id:"trilogy-1",ownerId:"owner-1",projectId:"project-1",authorId:"author-1",canonicalTitle:"The Drowned Crown Trilogy",relationshipKind:"trilogy",nodeRole:"container",parentBookId:null,sequence:null,formats:[],bookType:"fiction",sourceRefs:["project:1"],observedAt:"2026-10-26T16:01:00Z",version:1});
  for(const [id,title,sequence] of [["book-1","The Map Beneath the Tide",1],["book-2","The Kingdom Under Black Water",2],["book-3","The Crown of the Drowned",3]]) books.registerBook({id,ownerId:"owner-1",projectId:"project-1",authorId:"author-1",canonicalTitle:title,relationshipKind:"standalone",nodeRole:"work",parentBookId:"trilogy-1",sequence,formats:["kindle","paperback","hardcover"],bookType:"fiction",sourceRefs:[`project:${id}`],observedAt:"2026-10-26T16:02:00Z",version:1});
  assert.deepEqual(books.hierarchy("trilogy-1").map((book)=>book.id),["trilogy-1","book-1","book-2","book-3"]);
  assert.deepEqual(books.requireExact("book-2","owner-1","project-1",1).formats,["kindle","paperback","hardcover"]);
});

test("P11.1 future book types register and render through renderer key without core renderer edits",()=>{
  const books=registry();
  books.registerBookType({key:"interactive-journal",label:"Interactive Journal",rendererKey:"generic-book",allowedRelationshipKinds:["standalone","collection"],sourceRefs:["type:new"],version:1});
  books.registerBook({id:"journal-1",ownerId:"owner-1",projectId:"project-j",authorId:"author-1",canonicalTitle:"Future Journal",relationshipKind:"standalone",nodeRole:"work",parentBookId:null,sequence:null,formats:["paperback"],bookType:"interactive-journal",sourceRefs:["project:j"],observedAt:"2026-10-26T16:02:00Z",version:1});
  assert.equal(books.renderHierarchy("journal-1")[0].rendererKey,"generic-book");
});

test("P11.1 hierarchy rejects invalid parent roles duplicate ordering and trilogy overflow",()=>{
  const books=registry();
  books.registerBook({id:"tri",ownerId:"owner-1",projectId:"p",authorId:"author-1",canonicalTitle:"Tri",relationshipKind:"trilogy",nodeRole:"container",parentBookId:null,sequence:null,formats:[],bookType:"fiction",sourceRefs:["tri"],observedAt:"2026-10-26T16:01:00Z",version:1});
  for(let i=1;i<=3;i++) books.registerBook({id:`b${i}`,ownerId:"owner-1",projectId:"p",authorId:"author-1",canonicalTitle:`Book ${i}`,relationshipKind:"standalone",nodeRole:"work",parentBookId:"tri",sequence:i,formats:["kindle"],bookType:"fiction",sourceRefs:[`b${i}`],observedAt:"2026-10-26T16:02:00Z",version:1});
  assert.throws(()=>books.registerBook({id:"b4",ownerId:"owner-1",projectId:"p",authorId:"author-1",canonicalTitle:"Book 4",relationshipKind:"standalone",nodeRole:"work",parentBookId:"tri",sequence:4,formats:["kindle"],bookType:"fiction",sourceRefs:["b4"],observedAt:"2026-10-26T16:02:00Z",version:1}),/trilogy/i);
  assert.throws(()=>books.registerBook({id:"dup",ownerId:"owner-1",projectId:"p",authorId:"author-1",canonicalTitle:"Duplicate",relationshipKind:"standalone",nodeRole:"work",parentBookId:"tri",sequence:2,formats:["kindle"],bookType:"fiction",sourceRefs:["dup"],observedAt:"2026-10-26T16:02:00Z",version:1}),/sequence/i);
  assert.throws(()=>books.registerBook({id:"child",ownerId:"owner-1",projectId:"p",authorId:"author-1",canonicalTitle:"Child",relationshipKind:"standalone",nodeRole:"work",parentBookId:"b1",sequence:1,formats:["kindle"],bookType:"fiction",sourceRefs:["child"],observedAt:"2026-10-26T16:03:00Z",version:1}),/container/i);
});

test("P11.1 canonical book lineage cannot silently substitute owner project author type hierarchy or role",()=>{
  const books=registry();
  const base={id:"book-1",ownerId:"owner-1",projectId:"p",authorId:"author-1",canonicalTitle:"One",relationshipKind:"standalone",nodeRole:"work",parentBookId:null,sequence:null,formats:["kindle"],bookType:"fiction",sourceRefs:["one"],observedAt:"2026-10-26T16:01:00Z",version:1};
  books.registerBook(base);
  assert.doesNotThrow(()=>books.registerBook({...base,canonicalTitle:"One Revised",formats:["kindle","paperback"],sourceRefs:["two"],observedAt:"2026-10-26T17:00:00Z",version:2}));
  assert.throws(()=>books.registerBook({...base,projectId:"other",version:3}),/cannot be silently substituted/i);
  assert.throws(()=>books.registerBook({...base,version:2}),/version must advance/i);
});

test("P11.1 durable book registry hierarchy is immutable owner-scoped and extensible",()=>{
  const sql=readFileSync(new URL("../../supabase/migrations/20261026116000_p11_1_books_registry.sql",import.meta.url),"utf8");
  assert.match(sql,/command_center_book_author_identity_history/i);assert.match(sql,/command_center_book_type_history/i);assert.match(sql,/command_center_book_registry_history/i);
  assert.match(sql,/renderer_key text not null/i);assert.match(sql,/relationship_kind text not null/i);assert.match(sql,/parent_book_id text/i);assert.match(sql,/sequence integer/i);assert.match(sql,/formats text\[\]/i);assert.match(sql,/project_id text not null/i);
  assert.match(sql,/book registry evidence is immutable/i);assert.match(sql,/is_command_center_authorized/i);
});
