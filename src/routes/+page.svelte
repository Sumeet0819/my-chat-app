<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { nanoid } from 'nanoid';
  import { database } from '$lib/firebase';
  import { ref, get, set, serverTimestamp } from 'firebase/database';

  let username = '';
  let roomId = '';
  let isCreatingRoom = true;
  let errorMessage = '';

  const generateRoomId = () => nanoid(10);

  const toggleMode = () => {
    isCreatingRoom = !isCreatingRoom;
    roomId = isCreatingRoom ? generateRoomId() : '';
    errorMessage = '';
  };

  const storeUserInDatabase = async (roomId, username) => {
    const userRef = ref(database, `rooms/${roomId}/users/${username}`);
    await set(userRef, { joinedAt: serverTimestamp() });
  };

  const joinOrCreateChat = async (event) => {
    event.preventDefault();
    errorMessage = '';

    if (!username.trim() || (!isCreatingRoom && !roomId.trim())) {
      errorMessage = 'Please fill in all fields.';
      return;
    }

    try {
      if (!isCreatingRoom) {
        const isValidRoom = await checkRoomId(roomId);
        if (!isValidRoom) {
          errorMessage = 'Invalid room ID. Please check and try again.';
          return;
        }
      } else {
        const roomExists = await checkRoomId(roomId);
        if (roomExists) {
          errorMessage = 'Room already exists. Please try a different room ID.';
          return;
        }
      }

      await storeUserInDatabase(roomId, username);

      // Use sessionStorage instead of localStorage for better security
      sessionStorage.setItem('chatUsername', username);
      sessionStorage.setItem('chatRoomId', roomId);

      goto(`/chat?room=${encodeURIComponent(roomId)}&username=${encodeURIComponent(username)}`);
    } catch (error) {
      console.error("Error joining/creating chat:", error);
      errorMessage = 'An error occurred. Please try again.';
    }
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
   @import url("https://cdn.jsdelivr.net/npm/@xz/fonts@1/serve/plus-jakarta-display.min.css");
  @import url("https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap");
  @import url("https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap");
  @import url("https://fonts.cdnfonts.com/css/cascadia-code");
  * {
    margin: 0;
    padding: 0;
    font-family: "Plus Jakarta Display", sans-serif, "Noto Color Emoji";
  } 
  :global(body){
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  main {
      display: block;
      align-items: center;
      padding: 50px 20px;
  }
  
  .intro {
      text-align: center;
      max-width: 100%;
  }
  
  .intro h1 {
      font-size: 3em;
      color: #aa0ca5;
  }
  
  .intro p {
      margin: 10px 0;
  }
  .join-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: centerax;
    padding: 2rem;
    border-radius: 10px;
    background-color: #fff;
    width: 100%;
    max-width: 500px;
  }

  h1 {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
  }

  form {
    width: 100%;
  }

  input {
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid #dc6ad9;
    border-radius: 5px;
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;
  }

  button {
    padding: 0.75rem;
    border: none;
    background-color: #aa0ca5;
    color: #fff;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s ease;
    width: 100%;
    margin-bottom: 1rem;
  }

  button:hover {
    background-color: #0056b3;
  }

  .toggle-mode {
    margin-top: 1rem;
    padding: 0.75rem;
    border: none;
    background-color: #aa0ca5;
    color: #fff;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
    text-align: center;
    width: 100%;
    margin-bottom: 1rem;
  }

  .error-message {
    color: #d32f2f;
    margin-top: 0.75rem;
    font-size: 0.875rem;
  } 
</style>
<section class="intro">
  <h1>Disposable Chatroom</h1>
  <p>Chat private. Chat free.</p>
  <p>
      Create your own Disposable Chatroom. It disposes after the last person
      leaves.
  </p>
</section>
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
<div class="instructions">
  <p><strong>Remember:</strong></p>
  <ol>
      <li>
          This is a Disposable Chatroom. Nothing is saved and it's encrypted
          too.
      </li>
      <li>
          Invite anyone to this chatroom by sharing the Unique Code provided.        
      </li>
      <li>Enjoy!</li>
  </ol>
</div>