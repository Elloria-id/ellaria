/* js/communityService.js
 * Client-side community service for threads & posts. Uses StorageService.
 * Keys: 'community:threads' (array), 'community:posts' (array)
 * Thread structure: { id, title, author, createdAt, updatedAt, views, sticky }
 * Post structure: { id, threadId, author, content, createdAt }
 * TODO: replace with server API; keep method names similar to make switching easier.
 */

const CommunityService = (function(){
  const THREAD_KEY = 'community:threads';
  const POST_KEY = 'community:posts';

  function getThreads(){ return StorageService.get(THREAD_KEY, []); }
  function saveThreads(arr){ StorageService.set(THREAD_KEY, arr); }
  function getPosts(){ return StorageService.get(POST_KEY, []); }
  function savePosts(arr){ StorageService.set(POST_KEY, arr); }

  function generateId(prefix='t'){ return prefix + '_' + Math.random().toString(36).slice(2,9); }

  function listThreads(){
    return getThreads().sort((a,b)=> (b.sticky?1000000000:0) + (b.updatedAt||0) - (a.updatedAt||0));
  }

  function createThread({ title, author='Anon', content='' }){
    const id = generateId('th');
    const now = Date.now();
    const thread = { id, title, author, createdAt: now, updatedAt: now, views:0, sticky:false };
    const threads = getThreads(); threads.unshift(thread); saveThreads(threads);
    if(content){ createPost({ threadId:id, author, content }); }
    return thread;
  }

  function createPost({ threadId, author='Anon', content }){
    const id = generateId('p'); const now = Date.now();
    const post = { id, threadId, author, content, createdAt: now };
    const posts = getPosts(); posts.unshift(post); savePosts(posts);
    // update thread updatedAt
    const threads = getThreads(); const t = threads.find(x=>x.id===threadId); if(t){ t.updatedAt = now; saveThreads(threads); }
    return post;
  }

  function getThreadPosts(threadId){ return getPosts().filter(p => p.threadId === threadId).sort((a,b)=> a.createdAt - b.createdAt); }

  function incrementView(threadId){ const threads = getThreads(); const t = threads.find(x=>x.id===threadId); if(t){ t.views = (t.views||0) + 1; saveThreads(threads); } }

  function toggleSticky(threadId){ const threads = getThreads(); const t = threads.find(x=>x.id===threadId); if(t){ t.sticky = !t.sticky; saveThreads(threads); } }

  function seedIfEmpty(){ if(getThreads().length === 0){
      createThread({ title:'Perkenalan', author:'System', content:'Selamat datang di komunitas Ellaria! Ceritakan tentang dirimu.' });
      createThread({ title:'Rekomendasi Isekai', author:'Editor', content:'Share rekomendasi isekai favoritmu.' });
    }
  }

  return { listThreads, createThread, createPost, getThreadPosts, incrementView, toggleSticky, seedIfEmpty };
})();

window.CommunityService = CommunityService;
