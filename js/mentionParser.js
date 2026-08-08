/* js/mentionParser.js
 * Detect @mentions in a piece of text and invoke a callback for each username.
 * Example usage: MentionParser.findAndNotify(text, { from, refType, refId })
 */

const MentionParser = (function(){
  const MENTION_RE = /@([a-zA-Z0-9_\-\.]{2,30})/g;

  function find(text){ const matches = []; if(!text) return matches; let m; while((m = MENTION_RE.exec(text)) !== null){ matches.push(m[1]); } return matches; }

  function findAndNotify(text, { from='system', refType=null, refId=null } = {}){
    const names = find(text); names.forEach(name => {
      // try to resolve username -> profile id: we'll assume username maps to profile id directly
      const profile = SocialService.getProfile(name) || null;
      const userId = profile ? profile.id : name;
      NotifService.push({ title: 'Mention', body: `@${from} mentioned you`, data: { type:'mention', refType, refId, from } });
    });
    return names;
  }

  return { find, findAndNotify };
})();

window.MentionParser = MentionParser;
