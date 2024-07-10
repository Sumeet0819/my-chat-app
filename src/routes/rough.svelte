<!-- src/routes/chat/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { database } from '$lib/firebase';
  import { ref, onChildAdded, push, serverTimestamp } from 'firebase/database';

  let message = '';
  let messages = [];

  const messagesRef = ref(database, 'messages');

  onMount(() => {
    onChildAdded(messagesRef, (snapshot) => {
      const messageData = snapshot.val();
      messages = [...messages, messageData];
    });
  });

  const sendMessage = async () => {
    if (message.trim() !== '') {
      await push(messagesRef, {
        content: message,
        userId: 'user1', // Replace with actual user ID or username
        createdAt: serverTimestamp()
      });
      message = '';
    }
  };
</script>

<main>
  <h1>Chat Room</h1>
  <ul>
    {#each messages as msg}
      <li>{msg.userId}: {msg.content}</li>
    {/each}
  </ul>
  <input type="text" bind:value={message} />
  <button on:click={sendMessage}>Send</button>
</main>

<style>
  /* Add your styles here */
</style>
