/* js/authService.js
 * Simple client-side auth simulation using StorageService. Replace with Firebase Auth
 * or NextAuth when integrating backend. Methods are synchronous for simplicity.
 */

const AuthService = (function(){
  const KEY = 'auth:user';

  function getUser(){
    return StorageService.get(KEY, null);
  }

  function setUser(user){
    StorageService.set(KEY, user);
  }

  function clearUser(){
    StorageService.remove(KEY);
  }

  function register({ email, password, displayName }){
    // In real app: create user in auth provider + DB. Here: store minimal user object.
    const user = { id: 'u_' + Math.random().toString(36).slice(2,10), email, displayName: displayName || email.split('@')[0], avatar: '/assets/images/avatar/default.jpg', createdAt: Date.now() };
    setUser(user);
    return user;
  }

  function signIn({ email, password }){
    // Stub: accept any non-empty email/password; TODO: replace with real auth.
    if(!email) throw new Error('Email required');
    const user = { id: 'u_stub', email, displayName: email.split('@')[0], avatar: '/assets/images/avatar/default.jpg', signedInAt: Date.now() };
    setUser(user);
    return user;
  }

  function signInWithProvider(provider){
    // provider: 'google' | 'discord'
    // TODO: implement OAuth flows (Firebase/NextAuth). This is just a stubbed redirect simulation.
    const user = { id: 'u_'+provider+'_'+Math.random().toString(36).slice(2,6), email: provider+'@example.com', displayName: provider.toUpperCase() + ' User', avatar: '/assets/images/avatar/default.jpg', provider };
    setUser(user);
    return user;
  }

  function signOut(){ clearUser(); }

  return { getUser, register, signIn, signOut, signInWithProvider };
})();

window.AuthService = AuthService;
