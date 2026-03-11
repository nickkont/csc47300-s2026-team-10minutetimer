/**
 * Eventra — Firebase Auth helpers
 * Load after Firebase SDK and firebase-config.js
 */
(function () {
  "use strict";

  const auth = typeof firebase !== "undefined" ? firebase.auth() : null;

  if (!auth) {
    console.warn("Eventra: Firebase Auth not available. Include Firebase scripts and firebase-config.js first.");
  }

  function getAuth() {
    return auth;
  }

  function getCurrentUser() {
    return auth ? auth.currentUser : null;
  }

  function onAuthStateChanged(callback) {
    if (!auth) return () => {};
    return auth.onAuthStateChanged(callback);
  }

  function signUp(email, password, displayName) {
    if (!auth) return Promise.reject(new Error("Firebase Auth not loaded"));
    return auth
      .createUserWithEmailAndPassword(email, password)
      .then(function (userCredential) {
        const user = userCredential.user;
        if (displayName && user.updateProfile) {
          return user.updateProfile({ displayName: displayName }).then(function () {
            return userCredential;
          });
        }
        return userCredential;
      });
  }

  function signIn(email, password) {
    if (!auth) return Promise.reject(new Error("Firebase Auth not loaded"));
    return auth.signInWithEmailAndPassword(email, password);
  }

  function signOut() {
    if (!auth) return Promise.reject(new Error("Firebase Auth not loaded"));
    return auth.signOut();
  }

  function deleteAccount() {
    const user = auth ? auth.currentUser : null;
    if (!user) return Promise.reject(new Error("No user signed in"));
    return user.delete();
  }

  function reauthenticate(password) {
    const user = auth ? auth.currentUser : null;
    if (!user || !user.email) return Promise.reject(new Error("No user or email"));
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
    return user.reauthenticateWithCredential(credential);
  }

  window.EventraAuth = {
    getAuth: getAuth,
    getCurrentUser: getCurrentUser,
    onAuthStateChanged: onAuthStateChanged,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    deleteAccount: deleteAccount,
    reauthenticate: reauthenticate,
  };
})();
