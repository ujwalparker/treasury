<script lang="ts">
  import { user, logout } from '$lib/stores/auth';
  import { page } from '$app/stores';
  import type { Snippet } from 'svelte';

  let { title = 'Treasury', children }: { title?: string; children: Snippet } = $props();

  const currentUser = $derived($user);

  const isParent = $derived(currentUser?.role === 'PARENT');
</script>

<div class="min-h-screen bg-surface-300">
  <nav class="glass shadow-elevation-2">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center space-x-6">
          <a href="/" class="headline-small text-primary-600">{title}</a>
          
          {#if currentUser}
            <div class="hidden md:flex space-x-2">
              <a 
                href="/" 
                class={`px-4 py-2 rounded-xl label-large transition-all duration-200 ${$page.url.pathname === '/' ? 'bg-primary-100 text-primary-700' : 'text-on-surface-variant hover:bg-surface-variant'}`}
              >
                Dashboard
              </a>
              
              {#if isParent}
                <a 
                  href="/manage" 
                  class={`px-4 py-2 rounded-xl label-large transition-all duration-200 ${$page.url.pathname === '/manage' ? 'bg-primary-100 text-primary-700' : 'text-on-surface-variant hover:bg-surface-variant'}`}
                >
                  Manage
                </a>
                
                <a 
                  href="/config" 
                  class={`px-4 py-2 rounded-xl label-large transition-all duration-200 ${$page.url.pathname === '/config' ? 'bg-primary-100 text-primary-700' : 'text-on-surface-variant hover:bg-surface-variant'}`}
                >
                  Config
                </a>
              {/if}
            </div>
          {/if}
        </div>
        
        {#if currentUser}
          <div class="flex items-center space-x-4">
            <span class="body-medium text-on-surface-variant">
              {currentUser.name} ({currentUser.role})
            </span>
            <button
              onclick={logout}
              class="btn-text text-error-600 hover:bg-error-50"
            >
              Logout
            </button>
          </div>
        {/if}
      </div>
    </div>
  </nav>
  
  <!-- Mobile navigation -->
  {#if currentUser}
    <div class="md:hidden bg-surface-50 shadow-elevation-1">
      <div class="flex justify-around">
        <a 
          href="/" 
          class={`flex-1 text-center py-3 label-large transition-all duration-200 ${$page.url.pathname === '/' ? 'text-primary-700 border-b-2 border-primary-500' : 'text-on-surface-variant'}`}
        >
          Dashboard
        </a>
        
        {#if isParent}
          <a 
            href="/manage" 
            class={`flex-1 text-center py-3 label-large transition-all duration-200 ${$page.url.pathname === '/manage' ? 'text-primary-700 border-b-2 border-primary-500' : 'text-on-surface-variant'}`}
          >
            Manage
          </a>
          
          <a 
            href="/config" 
            class={`flex-1 text-center py-3 label-large transition-all duration-200 ${$page.url.pathname === '/config' ? 'text-primary-700 border-b-2 border-primary-500' : 'text-on-surface-variant'}`}
          >
            Config
          </a>
        {/if}
      </div>
    </div>
  {/if}
  
  <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
    {@render children()}
  </main>
</div>