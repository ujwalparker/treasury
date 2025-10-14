<script>
  import '../styles/globals.css';
  import { onMount } from 'svelte';
  import LockScreen from '$lib/components/LockScreen.svelte';
  import Toaster from '$lib/components/Toaster.svelte';
  
  let isLocked = false;
  let shouldEnableLock = false;
  let inactivityTimer;
  
  function resetTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      isLocked = true;
    }, 5 * 60 * 1000);
  }
  
  function handleActivity() {
    if (!isLocked && shouldEnableLock) resetTimer();
  }
  
  function unlock() {
    isLocked = false;
    resetTimer();
  }
  
  onMount(async () => {
    const sessionRes = await fetch('/auth/session');
    const isAuthenticated = sessionRes.ok && (await sessionRes.json())?.user;
    
    if (isAuthenticated) {
      const setupRes = await fetch('/api/families/me/setup');
      const setupData = setupRes.ok ? await setupRes.json() : { setupComplete: true };
      shouldEnableLock = setupData.setupComplete;
      
      if (shouldEnableLock) {
        resetTimer();
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
          document.addEventListener(event, handleActivity, true);
        });
      }
    }
    
    return () => {
      clearTimeout(inactivityTimer);
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  });
</script>

{#if isLocked && shouldEnableLock}
  <LockScreen on:unlock={unlock} />
{:else}
  <slot />
{/if}

<Toaster />