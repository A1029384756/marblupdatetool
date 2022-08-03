import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, orderBy, query } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBT7s0JVvxqg-yNAV3frb8oW_VBxn72OMY",
    authDomain: "orbitfirmware.firebaseapp.com",
    projectId: "orbitfirmware",
    storageBucket: "orbitfirmware.appspot.com",
    messagingSenderId: "185355802425",
    appId: "1:185355802425:web:3a2ce626f0df41b312fae8"
};

const firebase = initializeApp(firebaseConfig);
const db = getFirestore(firebase);

const firmwareRef = collection(db, 'firmware_links')

export const queryDatabase = async () => {
  var dataArr = []

  const q = query(firmwareRef, orderBy('release_time', 'desc'), limit(6))
  const querySnapshot = await(getDocs(q))

  for (var i = 0; i < querySnapshot.docs.length; i++) {
    dataArr.push({
      name: querySnapshot.docs[i].id,
      data: querySnapshot.docs[i].data()
    })
  }

  return dataArr
}



