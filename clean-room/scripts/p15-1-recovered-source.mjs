import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const sha=b=>createHash('sha256').update(b).digest('hex');
export const RECOVERED_CSV_SHA256='1437d1f88b514008f418c720118786c9ff1b5f3bd1cf8e9ee2b1aca3879169d2';
export function decodeRecoveredLedgerCsv(authority){
 const p=authority?.canonicalCsv?.payload;
 if(authority?.status!=='RECOVERED_ORIGINAL_VERIFIED'||authority.canonicalCsv.sha256!==RECOVERED_CSV_SHA256||!p||p.encoding!=='gzip+base64'||typeof p.base64!=='string')throw Error('Recovered ledger source archive required');
 const compressed=Buffer.from(p.base64,'base64');if(sha(compressed)!==p.gzipSha256)throw Error('Recovered ledger compressed digest mismatch');
 const bytes=gunzipSync(compressed,{maxOutputLength:2*1024*1024});if(bytes.length!==p.decodedSizeBytes||bytes.length!==876893||sha(bytes)!==p.decodedSha256||sha(bytes)!==RECOVERED_CSV_SHA256)throw Error('Recovered ledger source identity mismatch');return bytes;
}
export function loadRecoveredLedgerCsv(authorityPath){return decodeRecoveredLedgerCsv(JSON.parse(readFileSync(authorityPath,'utf8')));}
