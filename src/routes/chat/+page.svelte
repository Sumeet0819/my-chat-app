<!-- src/routes/chat/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { database } from '$lib/firebase';
  import { ref, onChildAdded, push, serverTimestamp, remove, onDisconnect, onValue, set, get } from 'firebase/database';

  let message = '';
  let messages = [];
  let username = '';
  let users = [];
  let roomId = '';

  onMount(async () => {
    username = localStorage.getItem('chatUsername') || 'Guest';
    roomId = new URLSearchParams(window.location.search).get('room') || localStorage.getItem('chatRoomId');
    
    const messagesRef = ref(database, `rooms/${roomId}/messages`);
    const usersRef = ref(database, `rooms/${roomId}/users`);
    const roomRef = ref(database, `rooms/${roomId}`);
    const roomCreationRef = ref(database, `rooms/${roomId}/createdAt`);

    // Check if the room exists and create it if not
    const roomSnapshot = await get(roomRef);
    if (!roomSnapshot.exists()) {
      await set(roomCreationRef, serverTimestamp());
    }

    // Schedule room deletion after 24 hours
    onDisconnect(roomRef).remove();

    const hasJoined = sessionStorage.getItem('hasJoined');

    if (!hasJoined) {
      sendJoinMessage();
      sessionStorage.setItem('hasJoined', 'true');
    }

    // Add user to the list
    const userRef = ref(database, `rooms/${roomId}/users/${username}`);
    set(userRef, { username, online: true });

    // Handle user disconnect
    onDisconnect(userRef).set({ username, online: false });

    // Listen for new messages
    onChildAdded(messagesRef, (snapshot) => {
      const messageData = snapshot.val();
      messages = [...messages, messageData];
    });

    // Listen for user list updates
    onValue(usersRef, (snapshot) => {
      users = [];
      snapshot.forEach((userSnapshot) => {
        const user = userSnapshot.val();
        if (user.online) {
          users = [...users, user];
        }
      });
    });

    // Check for room deletion every minute
    setInterval(async () => {
      const roomCreationSnapshot = await get(roomCreationRef);
      const creationTime = roomCreationSnapshot.val();
      const currentTime = Date.now();
      if (currentTime - creationTime >= 24 * 60 * 60 * 1000) { // 24 hours in milliseconds
        await remove(roomRef);
      }
    }, 60 * 1000); // Check every minute
  });

  const sendMessage = async () => {
    if (message.trim() !== '') {
      const messagesRef = ref(database, `rooms/${roomId}/messages`);
      await push(messagesRef, {
        content: message,
        userId: username,
        type: 'message',
        createdAt: serverTimestamp(),
        sent: true
      });
      message = '';
    }
  };

  const sendJoinMessage = async () => {
    const messagesRef = ref(database, `rooms/${roomId}/messages`);
    await push(messagesRef, {
      content: `${username} has joined the chat`,
      userId: username,
      type: 'join',
      createdAt: serverTimestamp()
    });
  };

  const clearMessages = async () => {
    const messagesRef = ref(database, `rooms/${roomId}/messages`);
    await remove(messagesRef);
    messages = [];
  };

  function copyRoomId() {
    navigator.clipboard.writeText(roomId)
      .then(() => alert('Room ID copied to clipboard!'))
      .catch(err => console.error('Failed to copy: ', err));
  }
</script>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: Arial, sans-serif;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background-color: #2c3e50;
    color: white;
  }
  
  .room-name {
    font-size: 1.2em;
    font-weight: bold;
  }
  
  .controls {
    display: flex;
    gap: 15px;
  }
  
  .controls span, .controls button {
    cursor: pointer;
  }
  
  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  
  .messages-area {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }
  
  .messages-area ul {
    list-style-type: none;
    padding: 0;
  }
  
  .messages-area li {
    margin-bottom: 10px;
    padding: 8px 12px;
    max-width: 70%;
    border-radius: 8px;
    clear: both;
  }
  
  .messages-area li.sent {
    float: right;
    background-color: #3498db;
    color: white;
    border-bottom-right-radius: 0;
  }
  
  .messages-area li.received {
    float: left;
    background-color: #f1f1f1;
    color: black;
    border-bottom-left-radius: 0;
  }
  
  .join-message {
    font-style: italic;
    color: #666;
    text-align: center;
    clear: both;
    float: none;
    max-width: 100%;
    background-color: transparent;
  }
  
  .side-panel {
    width: 200px;
    background-color: #f8f9fa;
    padding: 20px;
    overflow-y: auto;
  }
  
  .participants-header {
    font-weight: bold;
    margin-bottom: 10px;
  }
  
  .user-list {
    list-style-type: none;
    padding: 0;
  }
  
  .user-item {
    margin-bottom: 5px;
  }
  
  .online, .offline {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 5px;
  }
  
  .online {
    background-color: #2ecc71;
  }
  
  .offline {
    background-color: #95a5a6;
  }
  
  .message-input {
    display: flex;
    padding: 20px;
    background-color: #ecf0f1;
  }
  
  .message-input input {
    flex: 1;
    padding: 10px;
    border: 1px solid #bdc3c7;
    border-radius: 4px;
  }
  
  .send-button {
    padding: 10px 20px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    margin-left: 10px;
    cursor: pointer;
  }
  
  .send-button:hover {
    background-color: #2980b9;
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
    <input type="text" placeholder="Type your message here" bind:value={message} />
    <button on:click={sendMessage} class="send-button">Send</button>
  </div>
</div>
