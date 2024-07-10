<script>
    import { Router, Route } from '@sveltejs/kit/router';
    import ChatPage from './routes/chat/+page.svelte';
    import IndexPage from './routes/chat/index.svelte';
  </script>
  
  <Router>
    <Route path="/" component={IndexPage} />
    <Route path="/chat" component={ChatPage} />
  </Router>
  
  <style>
    /* Add your global styles here */
  </style>
  