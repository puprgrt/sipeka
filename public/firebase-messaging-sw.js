importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Default configs
const firebaseConfig = {
  projectId: "big-outrider-b40ks",
  appId: "1:820728979520:web:6e4508d962b955936d3fa5",
  apiKey: "AIzaSyCwbUaXf1-N6ce8xUN8zF96_Zlgpg1PJUI",
  authDomain: "big-outrider-b40ks.firebaseapp.com",
  messagingSenderId: "820728979520",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
