/* pages/social/profile.js */

(function(){
  document.addEventListener('DOMContentLoaded', ()=>{
    // init i18n en-only
    fetch('/i18n/en.json').then(r=>r.json()).then(res=>{ i18n.init({ locale:'en', resources: { en: res } }); renderProfile(); });

    function renderProfile(){
      const params = new URLSearchParams(window.location.search); const id = params.get('id') || 'alice';
      SocialService.seedIfEmpty();
      const prof = SocialService.getProfile(id);
      if(!prof) return document.getElementById('profile-area').innerHTML = `<p class="muted">${i18n.t('social.no_profile')}</p>`;
      const user = window.AuthService && AuthService.getUser ? AuthService.getUser() : null; const current = user? user.uid : 'guest';
      const following = SocialService.isFollowing(id, current);
      const html = `<div class="profile-card"><h2>${prof.displayName}</h2><div class="muted">${i18n.t('profile.bio')}: ${prof.bio||''}</div><div class="profile-actions"><button class="btn" id="follow-btn">${following? i18n.t('profile.unfollow') : i18n.t('profile.follow')}</button><div class="muted">${SocialService.followerCount(id)} ${i18n.t('profile.followers')}</div></div></div>`;
      document.getElementById('profile-area').innerHTML = html;
      document.getElementById('follow-btn').addEventListener('click', ()=>{
        if(SocialService.isFollowing(id, current)){ SocialService.unfollow(id, current); } else { SocialService.follow(id, current); }
        NotifService.push({ title: 'Follow update', body: `${current} toggled follow for ${id}`, data:{ type:'follow', userId:id } });
        renderProfile();
      });

      // render comments component
      const commentsArea = document.getElementById('comments-area'); commentsArea.innerHTML = `<div data-ref-type="profile" data-ref-id="${id}"></div>`;
      // Comments component auto-inits on DOMContentLoaded; re-init if needed
      if(window.CommentsComponent && typeof CommentsComponent.init === 'function') CommentsComponent.init();
    }
  });
})();
