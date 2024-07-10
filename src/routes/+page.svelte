<!-- src/routes/join/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { nanoid } from 'nanoid';
  import { database } from '$lib/firebase';
  import { ref, get } from 'firebase/database';

  let username = '';
  let roomId = '';
  let isCreatingRoom = true;
  let errorMessage = '';

  const generateRoomId = () => nanoid(10);

  const toggleMode = () => {
    isCreatingRoom = !isCreatingRoom;
    if (isCreatingRoom) {
      roomId = generateRoomId();
    } else {
      roomId = '';
    }
    errorMessage = ''; // Clear any previous error messages
  };

  const joinOrCreateChat = async (event) => {
    event.preventDefault();
    errorMessage = '';

    if (username.trim() === '' || (!isCreatingRoom && roomId.trim() === '')) {
      return;
    }

    if (!isCreatingRoom) {
      const isValidRoom = await checkRoomId(roomId);
      if (!isValidRoom) {
        errorMessage = 'Invalid room ID. Please check the room ID and try again.';
        return;
      }
    }

    localStorage.setItem('chatUsername', username);
    localStorage.setItem('chatRoomId', roomId);
    goto(`/chat?room=${roomId}`);
  };

  const checkRoomId = async (roomId) => {
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    return snapshot.exists();
  };

  onMount(() => {
    if (isCreatingRoom) {
      roomId = generateRoomId();
    }
  });
</script>

<style>
  @import url('https://cdn.jsdelivr.net/npm/@xz/fonts@1/serve/plus-jakarta-display.min.css');

  body {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    margin: 0;
    font-family: 'Plus Jakarta Display', sans-serif;
    background-color: #f0f0f0;
  }
  .join-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 10px;
    background-color: #fff;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    width: 300px;
  }
  .join-container h1 {
    margin-bottom: 20px;
    font-size: 1.5em;
  }
  .join-container input {
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 1em;
    width: 100%;
  }
  .join-container button {
    padding: 10px 20px;
    border: none;
    background-color: #007bff;
    color: #fff;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    transition: 0.3s;
    width: 100%;
    margin-bottom: 10px;
  }
  .join-container button:hover {
    background-color: #0056b3;
  }
  .toggle-mode {
    margin-top: 15px;
    color: #007bff;
    cursor: pointer;
    text-decoration: underline;
  }
  .error-message {
    color: red;
    margin-top: 10px;
    font-size: 0.9em;
  }
</style>

<div class="join-container">
  <h1>{isCreatingRoom ? 'Create' : 'Join'} Chat Room</h1>
  <form on:submit={joinOrCreateChat}>
    <input
      type="text"
      placeholder="Enter your username"
      bind:value={username}
      required
    />
    <input
      type="text"
      placeholder={isCreatingRoom ? 'New room ID will be generated' : 'Enter room ID'}
      bind:value={roomId}
      required={!isCreatingRoom}
      readonly={isCreatingRoom}
    />
    <button type="submit">
      {isCreatingRoom ? 'Create and Join Room' : 'Join Room'}
    </button>
  </form>
  {#if errorMessage}
    <div class="error-message">{errorMessage}</div>
  {/if}
  <div class="toggle-mode" on:click={toggleMode}>
    {isCreatingRoom ? 'Join an existing room' : 'Create a new room'}
  </div>
</div>
