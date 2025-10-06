<script lang="ts">
  import '../styles/globals.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { initAuth, user, token } from '$lib/stores/auth';

  let loading = true;

  onMount(() => {
    initAuth();
    loading = false;
  });

  $: if (!loading) {
    const isLoginPage = $page.url.pathname === '/login';
    if (!$token && !isLoginPage) {
      // Redirect to login if not authenticated
      goto('/login');
    } else if ($token && isLoginPage) {
      // Redirect to dashboard if already authenticated
      goto('/');
    }
  }
</script>

{#if loading}
  <div class="min-h-screen flex items-center justify-center">
    <p>Loading...</p>
  </div>
{:else}
  <slot />
{/if}