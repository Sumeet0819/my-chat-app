<script>
    import { Router, Route } from '@sveltejs/kit/router';
    import ChatPage from './routes/chat/+page.svelte';
  </script>
  
  <Router>
    <Route path="/chat" component={ChatPage} />
  </Router>
  
  <style>
    /* Add your global styles here */
  </style>
  