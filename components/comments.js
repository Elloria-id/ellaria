/* components/comments.js
 * Simple threaded comments component that looks for elements with data-ref-type & data-ref-id
 * and renders a comment box + list. Uses SocialService for storage. Emits mention notifications.
 */

const CommentsComponent = (function(){
  function renderContainer(container){
    const refType = container.dataset.refType; const refId = container.dataset.refId;
    const elId = `comments-${refType}-${refId}`;
    container.innerHTML = `<div class="comments-area"><div><textarea id="${elId}-input" placeholder="${i18n.t('comments.write_comment','Write a comment...')}" style="width:100%;height:72px;padding:8px;border-radius:8px"></textarea><div style="display:flex;justify-content:flex-end;margin-top:8px"><button class="btn" id="${elId}-post">${i18n.t('comments.post','Post')}</button></div></div><div id="${elId}-list" style="margin-top:12px"></div></div>`;
    const postBtn = document.getElementById(`${elId}-post`);
    postBtn.addEventListener('click', ()=>{
      const txt = document.getElementById(`${elId}-input`).value.trim(); if(!txt) return alert('Empty');
      const user = window.AuthService && AuthService.getUser ? AuthService.getUser() : null; const author = user? (user.displayName || user.email) : 'Guest';
      const comment = SocialService.createComment({ parentId:null, refType, refId, author, content:txt });
      // detect mentions
      MentionParser.findAndNotify(txt, { from: author, refType, refId });
      renderList(refType, refId, document.getElementById(`${elId}-list`));
      document.getElementById(`${elId}-input`).value = '';
    });
    renderList(refType, refId, document.getElementById(`${elId}-list`));
  }

  function renderList(refType, refId, listEl){
    const comments = SocialService.listComments(refType, refId);
    if(comments.length===0) return listEl.innerHTML = '<p class="muted">No comments</p>';
    listEl.innerHTML = comments.map(c=>`<div style="padding:8px;border-radius:8px;background:rgba(255,255,255,0.02);margin-bottom:8px"><strong>${c.author}</strong><div class="muted" style="font-size:12px">${new Date(c.createdAt).toLocaleString()}</div><div style="margin-top:6px">${escapeHtml(c.content)}</div></div>`).join('');
  }

  function escapeHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function init(){ document.querySelectorAll('[data-ref-type][data-ref-id]').forEach(el=> renderContainer(el)); }

  return { init, renderList };
})();

window.CommentsComponent = CommentsComponent;
