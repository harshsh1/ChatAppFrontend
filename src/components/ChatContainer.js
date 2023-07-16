import React, { useEffect, useState } from "react";
import socketIOClient from "socket.io-client";
import ChatBoxReciever, { ChatBoxSender } from "./ChatBox";
import InputText from "./InputText";
import UserLogin from "./UserLogin";
import {
  doc,
  setDoc,
  collection,
  serverTimestamp,
  query,
  onSnapshot,
  orderBy,
  QuerySnapshot,
} from "firebase/firestore";
import db from "../firebaseConfig/firebaseConfig.js"

export default function ChatContainer() {
  let socketio = socketIOClient("https://chatappbackend-wrqj.onrender.com");
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(localStorage.getItem("user"));
  const [avatar] = useState(localStorage.getItem("avatar"));
  const chatsRef=collection(db,"Messages");
  
  useEffect(() => {
    socketio.on("chat", (senderChats) => {
      setChats(senderChats);
    });
  });
 
  useEffect(()=>{

    const q = query(chatsRef , orderBy('createdAt' , 'asc'))
  
    const unsub = onSnapshot(q, (QuerySnapshot) =>{
      const fireChats =[]
      QuerySnapshot.forEach(doc => {
        fireChats.push(doc.data())
      });
     setChats([...fireChats])
    })
    return ()=> {
      unsub()
    }
  
  },[])

  function addToFirebase(chat){
    const newChat={
      avatar,
      createdAt: serverTimestamp(),
      user,
      message: chat.message
    }
    const chatRef=doc(chatsRef)
    setDoc(chatRef,newChat)
    .then(()=> console.log('Chat added successfully'))
    .catch(console.log)
  }

  function sendChatToSocket(chat) {
    socketio.emit("chat", chat);
  }

  function addMessage(chat) {
    const newChat = { ...chat, user, avatar };
    addToFirebase(chat);
    setChats([...chats, newChat]);
    sendChatToSocket([...chats, newChat]);
  }
  function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("avatar");
    setUser("");
  }

  function ChatsList() {
    return chats.map((chat, index) => {
      if (chat.user === user)
        return (
          <ChatBoxSender
            key={index}
            message={chat.message}
            avatar={chat.avatar}
            user={chat.user}
          />
        );
      return (
        <ChatBoxReciever
          key={index}
          message={chat.message}
          avatar={chat.avatar}
          user={chat.user}
        />
      );
    });
  }

  return (
    <div>
      {user ? (
        <div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <h4>Username: {user}</h4>
            <p
              onClick={() => logout()}
              style={{ color: "blue", cursor: "pointer" }}
            >
              Log Out
            </p>
          </div>
          <ChatsList />

          <InputText addMessage={addMessage} />
        </div>
      ) : (
        <UserLogin setUser={setUser} />
      )}
    </div>
  );
}
