<script>
  import '../styles/globals.css';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import LockScreen from '$lib/components/LockScreen.svelte';
  import Toaster from '$lib/components/Toaster.svelte';
  
  let isLocked = false;
  let inactivityTimer;
  
  function resetTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      isLocked = true;
    }, 5 * 60 * 1000); // 5 minutes
  }
  
  function handleActivity() {
    if (!isLocked) resetTimer();
  }
  
  function unlock() {
    isLocked = false;
    resetTimer();
  }
  
  onMount(() => {
    // Skip lock screen for auth pages
    const isAuthPage = $page.url.pathname.startsWith('/login') || 
                      $page.url.pathname.startsWith('/auth') ||
                      $page.url.pathname.startsWith('/switch');
    
    if (!isAuthPage) {
      resetTimer();
      
      // Listen for user activity
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });
      
      return () => {
        clearTimeout(inactivityTimer);
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
      };
    }
  });
</script>

{#if isLocked}
  <LockScreen on:unlock={unlock} />
{:else}
  <slot />
{/if}

<Toaster />