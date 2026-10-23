const negativePublication=/\b(not[ _-]?published|unpublished|not[ _-]?live|pending|ready for kdp|ready;? not published)\b/i;
const positivePublication=/\b(live|published)\b/i;
const ignoredFormatStates=new Set(['not_planned','not_applicable','n/a','na','']);
const liveFormatStates=new Set(['live','published']);

function normalizeState(value){return String(value??'').trim().toLowerCase().replace(/[\s-]+/g,'_');}
function parsedMetric(metric){
  if(!metric||metric.verified!==true||!String(metric.key||'').startsWith('bookmap.')||!String(metric.key||'').endsWith('.metadata'))return null;
  try{return typeof metric.value_text==='string'?JSON.parse(metric.value_text):metric.value_text||null;}catch{return null;}
}

export function verifiedBooksForProject(projectId,metrics=[]){
  return metrics.filter(metric=>metric.project_id===projectId).map(parsedMetric).filter(book=>book&&book.title);
}

export function bookIsFullyLive(book){
  if(!book)return false;
  const publicationState=normalizeState(book.publication_state);
  const status=String(book.publication_status||'');
  if(negativePublication.test(status))return false;
  if(publicationState!=='published'&&!positivePublication.test(status))return false;
  const formats=Object.values(book.formats||{}).map(normalizeState).filter(state=>!ignoredFormatStates.has(state));
  if(formats.length&&formats.some(state=>!liveFormatStates.has(state)))return false;
  return true;
}

export function bookHasAnyLiveFormat(book){
  if(!book)return false;
  if(normalizeState(book.publication_state)==='published'&&!negativePublication.test(String(book.publication_status||'')))return true;
  return Object.values(book.formats||{}).map(normalizeState).some(state=>liveFormatStates.has(state));
}

export function projectPublicationDisplay(project,metrics=[]){
  const category=String(project?.category||'').toLowerCase();
  const isKdp=category.includes('kdp')||String(project?.id||'').startsWith('kdp-');
  if(!isKdp)return null;

  const rawStatus=String(project?.status||'').trim();
  const lowered=rawStatus.toLowerCase();
  const books=verifiedBooksForProject(project.id,metrics);

  if(books.length){
    const allLive=books.every(bookIsFullyLive);
    if(allLive)return{label:'Live',cls:'live'};

    const anyLive=books.some(bookHasAnyLiveFormat);
    if(/writing|rebuild|revision|qc|interior incomplete|in progress/.test(lowered)&&!lowered.includes('publishing in progress'))return{label:'In Progress',cls:'active-rebuild'};
    if(anyLive||lowered.includes('publishing in progress'))return{label:'Publishing',cls:'publishing'};
    if(/production complete|ready|unpublished|not published/.test(lowered))return{label:'Needs Publishing',cls:'needs-publishing'};
    if(/planning|planned/.test(lowered))return{label:'Planning',cls:'planning'};
    return{label:rawStatus||'Tracked',cls:'queued'};
  }

  if(negativePublication.test(rawStatus)||/production complete|ready.*kdp|unpublished/.test(lowered))return{label:'Needs Publishing',cls:'needs-publishing'};
  if(!negativePublication.test(rawStatus)&&positivePublication.test(rawStatus))return{label:'Live',cls:'live'};
  if(/publishing/.test(lowered))return{label:'Publishing',cls:'publishing'};
  if(/writing|rebuild|revision|qc|in progress/.test(lowered))return{label:'In Progress',cls:'active-rebuild'};
  if(/planning|planned/.test(lowered))return{label:'Planning',cls:'planning'};
  return{label:rawStatus||'Tracked',cls:'queued'};
}
