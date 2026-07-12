import { getMessaging, getToken } from "firebase/messaging";
import { getApp } from "firebase/app";
const messaging = getMessaging(getApp());
getToken(messaging).then(console.log).catch(console.error);
