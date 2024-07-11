<!-- src/routes/chat/+page.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { database } from '$lib/firebase';
  import { ref, onChildAdded, push, serverTimestamp, remove, onDisconnect, onValue, set, get } from 'firebase/database';

  let message = '';
  let messages = [];
  let username = '';
  let users = [];
  let roomId = '';

  onMount(async () => {
    username = sessionStorage.getItem('chatUsername') || 'Guest';
    roomId = new URLSearchParams(window.location.search).get('room') || sessionStorage.getItem('chatRoomId');

    const messagesRef = ref(database, `rooms/${roomId}/messages`);
    const usersRef = ref(database, `rooms/${roomId}/users`);
    const roomRef = ref(database, `rooms/${roomId}`);
    const roomCreationRef = ref(database, `rooms/${roomId}/createdAt`);

    try {
      const roomSnapshot = await get(roomRef);
      if (!roomSnapshot.exists()) {
        await set(roomCreationRef, serverTimestamp());
      }

      onDisconnect(roomRef).remove();

      const hasJoined = sessionStorage.getItem('hasJoined');

      if (!hasJoined) {
        await sendJoinMessage();
        sessionStorage.setItem('hasJoined', 'true');
      }

      const userRef = ref(database, `rooms/${roomId}/users/${username}`);
      await set(userRef, { username, online: true });

      onDisconnect(userRef).set({ username, online: false });

      onChildAdded(messagesRef, (snapshot) => {
        const messageData = snapshot.val();
        messages = [...messages, messageData];
      });

      onValue(usersRef, (snapshot) => {
        users = [];
        snapshot.forEach((userSnapshot) => {
          const user = userSnapshot.val();
          if (user.online) {
            users = [...users, user];
          }
        });
      });

    } catch (error) {
      console.error("Error in chat initialization:", error);
    }
  });
  const sendMessage = async () => {
    if (message.trim() !== '') {
      try {
        const messagesRef = ref(database, `rooms/${roomId}/messages`);
        await push(messagesRef, {
          content: message,
          userId: username,
          type: 'message',
          createdAt: serverTimestamp(),
          sent: true
        });
        message = '';
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const sendJoinMessage = async () => {
    try {
      const messagesRef = ref(database, `rooms/${roomId}/messages`);
      await push(messagesRef, {
        content: `${username} has joined the chat`,
        userId: username,
        type: 'join',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending join message:", error);
    }
  };

  const clearMessages = async () => {
    try {
      const messagesRef = ref(database, `rooms/${roomId}/messages`);
      await remove(messagesRef);
      messages = [];
    } catch (error) {
      console.error("Error clearing messages:", error);
    }
  };

  function copyRoomId() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomId)
        .then(() => alert('Room ID copied to clipboard!'))
        .catch(err => console.error('Failed to copy: ', err));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = roomId;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Room ID copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
      document.body.removeChild(textArea);
    }
  }
</script>

<style>
   @import url("https://cdn.jsdelivr.net/npm/@xz/fonts@1/serve/plus-jakarta-display.min.css");
  @import url("https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap");
  @import url("https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap");
  @import url("https://fonts.cdnfonts.com/css/cascadia-code");
  * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    font-family: "Plus Jakarta Display", sans-serif, "Noto Color Emoji";
  } 
  .chat-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #aa0ca5;
    color: white;
  }

  .room-name {
    font-size: 1.5rem;
  }

  .controls {
    display: flex;
    gap: 1rem;
  }

  .room-id-display {
    padding: 1rem;
    background-color: #fff;
    display: flex;
    justify-content: space-between;
  }

  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .messages-area {
    flex: 1;
    padding: 1rem;
  }

  .side-panel {
    width: 200px;
    background-color: #fff;
    padding: 1rem;
  }

  .participants-header {
    font-weight: bold;
    margin-bottom: 1rem;
  }

  .user-list {
    list-style: none;
    padding: 0;
  }

  .user-item {
    padding: 0.5rem 0;
    display: flex;
    align-items: center;
  }

  .online {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: green;
    margin-right: 0.5rem;
  }

  .offline {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: red;
    margin-right: 0.5rem;
  }

  .message-input {
    display: flex;
    padding: 1rem;
    background-color: #fff;
  }
  .message-input input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .send-button {
    padding: 0.5rem 1rem;
    border: none;
    background-color: #1d78ce;
    color: white;
    margin-left: 0.5rem;
    cursor: pointer;
    border-radius: 4px;
  }
  .send-button:hover{
    background-color: #07bbd3;
    scale: 1.2;
  }
</style>

<div class="chat-container">
  <div class="header">
    <div class="room-name">DialogueDen - A Chat Room</div>
    <div class="controls">
      <span class="theme-toggle"><i class="fas fa-sun"></i></span>
      <span class="leave-room"><i class="fas fa-sign-out-alt"></i></span>
      <button on:click={clearMessages}>Clear Messages</button>
    </div>
  </div>
  
  <div class="room-id-display">
    <span>Room ID: {roomId}</span>
    <button on:click={copyRoomId}>Copy ID</button>
  </div>

  <div class="main-content">
    <div class="messages-area">
      <ul>
        {#each messages as msg}
        <li class={msg.type === 'join' ? 'join-message' : msg.userId === username ? 'sent' : 'received'}>
          {msg.userId}: {msg.content}
        </li>
        {/each}
      </ul>
    </div>
    <div class="side-panel">
      <div class="participants-header">Members</div>
      <ul class="user-list">
        {#each users as user}
          <li class="user-item">
            <span class={user.online ? 'online' : 'offline'}></span> {user.username}
          </li>
        {/each}
      </ul>
    </div>
  </div>
  <div class="message-input">
    <input type="text" placeholder="Type your message here" bind:value={message} on:keypress={(e) => e.key === 'Enter' && sendMessage()} />
    <button on:click={sendMessage} class="send-button">Send</button>
  </div>
</div>
