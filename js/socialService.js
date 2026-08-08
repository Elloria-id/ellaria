/* js/socialService.js
 * Client-side social service: profiles, followers, comments. Uses StorageService.
 * Keys:
 *  - social:profiles  (map id -> profile)
 *  - social:followers (array of { userId, followerId })
 *  - social:comments  (array of { id, parentId, refType, refId, author, content, createdAt })
 */

const SocialService = (function(){
  const PROFILES = 'social:profiles';
  const FOLLOWERS = 'social:followers';
  const COMMENTS = 'social:comments';

  function _getProfiles(){ return StorageService.get(PROFILES, {}); }
  function _saveProfiles(m){ StorageService.set(PROFILES, m); }
  function _getFollowers(){ return StorageService.get(FOLLOWERS, []); }
  function _saveFollowers(a){ StorageService.set(FOLLOWERS, a); }
  function _getComments(){ return StorageService.get(COMMENTS, []); }
  function _saveComments(a){ StorageService.set(COMMENTS, a); }

  function ensureProfile(userId, data = {}){
    const m = _getProfiles(); if(!m[userId]){ m[userId] = Object.assign({ id:userId, displayName: data.displayName || ('User '+userId), bio: data.bio||'', avatar:null, createdAt: Date.now() }, data); _saveProfiles(m); }
    return m[userId];
  }

  function getProfile(userId){ const m = _getProfiles(); return m[userId] || null; }

  function follow(userId, followerId){ // followerId follows userId
    const arr = _getFollowers(); if(arr.find(x=>x.userId===userId && x.followerId===followerId)) return; arr.push({ userId, followerId, ts:Date.now() }); _saveFollowers(arr); }
  function unfollow(userId, followerId){ let arr = _getFollowers(); arr = arr.filter(x=> !(x.userId===userId && x.followerId===followerId)); _saveFollowers(arr); }
  function isFollowing(userId, followerId){ return _getFollowers().some(x=> x.userId===userId && x.followerId===followerId); }
  function followerCount(userId){ return _getFollowers().filter(x=> x.userId===userId).length; }

  // Comments: refType e.g. 'thread' or 'post' with refId
  function listComments(refType, refId){ return _getComments().filter(c=> c.refType===refType && c.refId===refId).sort((a,b)=> a.createdAt - b.createdAt); }
  function createComment({ parentId=null, refType, refId, author='Anon', content }){
    const id = 'c_'+Math.random().toString(36).slice(2,9); const now = Date.now();
    const item = { id, parentId, refType, refId, author, content, createdAt: now };
    const arr = _getComments(); arr.unshift(item); _saveComments(arr);
    return item;
  }
  function editComment(id, content){ const arr = _getComments(); const it = arr.find(x=>x.id===id); if(it){ it.content = content; it.updatedAt = Date.now(); _saveComments(arr); } }
  function deleteComment(id){ let arr = _getComments(); arr = arr.filter(x=> x.id!==id); _saveComments(arr); }

  // seed small profile if empty
  function seedIfEmpty(){ const m = _getProfiles(); if(Object.keys(m).length===0){ ensureProfile('system', { displayName:'System' }); ensureProfile('alice', { displayName:'Alice' }); ensureProfile('bob', { displayName:'Bob' }); follow('alice','bob'); follow('bob','alice'); } }

  return { ensureProfile, getProfile, follow, unfollow, isFollowing, followerCount, listComments, createComment, editComment, deleteComment, seedIfEmpty };
})();

window.SocialService = SocialService;
