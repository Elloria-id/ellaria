/* Community JS - dummy threads */
const Community = (function(){
  const THREADS = [{id:1,title:'Perkenalan',posts:12},{id:2,title:'Rekomendasi Isekai',posts:45}];
  function render(){const el=document.getElementById('community-list');el.innerHTML=THREADS.map(t=>`<div class="thread"><h3>${t.title}</h3><p>${t.posts} posts</p></div>`).join('');}
  return {init(){render();}};
})();
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>Community.init()); else Community.init();
