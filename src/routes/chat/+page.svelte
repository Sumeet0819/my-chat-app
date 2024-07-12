<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { database } from '$lib/firebase';
  import { ref, onChildAdded, push, serverTimestamp, remove, onDisconnect, onValue, set, get } from 'firebase/database';

  let message = '';
  let messages = [];
  let username = '';
  let users = [];
  let roomId = '';
  let timeLeft = '';

  onMount(async () => {
    username = sessionStorage.getItem('chatUsername') || 'Guest';
    roomId = new URLSearchParams(window.location.search).get('room') || sessionStorage.getItem('chatRoomId');

    if (!roomId) {
      roomId = `room-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('chatRoomId', roomId);
    }

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

  const deleteChatRoom = async () => {
    try {
      const roomRef = ref(database, `rooms/${roomId}`);
      await remove(roomRef);
      alert('Chat room has been deleted.');
      goto(`/`); // Redirect to create room page
    } catch (error) {
      console.error("Error deleting chat room:", error);
    }
  };

  const copyRoomId = () => {
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
  };

  const startCountdown = (deletionTime) => {
    const updateCountdown = () => {
      const now = Date.now();
      const distance = deletionTime - now;

      if (distance < 0) {
        timeLeft = 'Expired';
        clearInterval(countdownInterval);
      } else {
        const hours = Math.floor((distance % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((distance % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((distance % (60 * 1000)) / 1000);

        timeLeft = `${hours}h ${minutes}m ${seconds}s`;
      }
    };

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
  };
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
    width: 100%;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #aa0ca5;
    color: white;
  }
  .time-left {
    font-size: 1rem;
    font-weight: bold;
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
  .room-id-display button{
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem;
    background-color: rgba(0, 0, 0, 0.667);
    color: #fff;
    cursor: pointer;
  }
  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  .messages-area {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
  }

  .messages-area ul {
    list-style-type: none;
    padding: 0;
  }

  .messages-area li {
    margin-bottom: 10px;
    max-width: 70%;
    padding: 10px;
    border-radius: 10px;
    clear: both;
  }

  .sent {
    float: right;
    background-color: #dcf8c6;
    text-align: right;
  }

  .received {
    float: left;
    background-color: #f1f0f0;
  }

  .join-message {
    text-align: center;
    background-color: #e1e1e1;
    color: #666;
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 0.9em;
    margin: 10px auto;
    max-width: 60%;
    clear: both;
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
  .send-button:hover {
    background-color: #07bbd3;
    scale: 1.2;
  }
  .delete-button {
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem;
    background-color: rgba(247, 0, 0, 0.667);
    color: #fff;
    cursor: pointer;
  }
</style>

<div class="chat-container">
  <div class="header">
    <div class="room-name">DialogueDen - A Chat Room</div>
    <div class="controls">
      <button on:click={deleteChatRoom} class="delete-button">Delete Room</button>
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
          {#if msg.type === 'join'}
            <li class="join-message">{msg.content}</li>
          {:else}
            <li class={msg.userId === username ? 'sent' : 'received'}>
              <strong>{msg.userId}:</strong> {msg.content}
            </li>
          {/if}
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
