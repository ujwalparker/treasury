<script lang="ts">
  import { user, logout } from '$lib/stores/auth';
  import { page } from '$app/stores';

  export let title = 'Treasury';

  let currentUser: any = null;
  user.subscribe(value => currentUser = value);

  $: isParent = currentUser?.role === 'PARENT';
</script>

<div class="min-h-screen bg-gray-50">
  <nav class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center space-x-6">
          <a href="/" class="text-xl font-semibold">{title}</a>
          
          {#if currentUser}
            <div class="hidden md:flex space-x-4">
              <a 
                href="/" 
                class={`px-3 py-2 rounded-md text-sm font-medium ${$page.url.pathname === '/' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Dashboard
              </a>
              
              {#if isParent}
                <a 
                  href="/manage" 
                  class={`px-3 py-2 rounded-md text-sm font-medium ${$page.url.pathname === '/manage' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Manage Transactions
                </a>
                
                <a 
                  href="/config" 
                  class={`px-3 py-2 rounded-md text-sm font-medium ${$page.url.pathname === '/config' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Configuration
                </a>
              {/if}
            </div>
          {/if}
        </div>
        
        {#if currentUser}
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-700">
              {currentUser.name} ({currentUser.role})
            </span>
            <button
              on:click={logout}
              class="text-sm text-red-600 hover:text-red-800"
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
    <div class="md:hidden bg-white shadow-sm border-b">
      <div class="flex justify-around">
        <a 
          href="/" 
          class={`flex-1 text-center py-3 text-sm font-medium ${$page.url.pathname === '/' ? 'text-blue-800 border-b-2 border-blue-500' : 'text-gray-700'}`}
        >
          Dashboard
        </a>
        
        {#if isParent}
          <a 
            href="/manage" 
            class={`flex-1 text-center py-3 text-sm font-medium ${$page.url.pathname === '/manage' ? 'text-blue-800 border-b-2 border-blue-500' : 'text-gray-700'}`}
          >
            Manage
          </a>
          
          <a 
            href="/config" 
            class={`flex-1 text-center py-3 text-sm font-medium ${$page.url.pathname === '/config' ? 'text-blue-800 border-b-2 border-blue-500' : 'text-gray-700'}`}
          >
            Config
          </a>
        {/if}
      </div>
    </div>
  {/if}
  
  <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <slot />
  </main>
</div>