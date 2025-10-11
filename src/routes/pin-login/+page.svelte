<script lang="ts">
  import { goto } from '$app/navigation';
  import { login } from '$lib/stores/auth';
  import { api } from '$lib/services/api';
  import PinInput from '$lib/components/PinInput.svelte';
  import UserTile from '$lib/components/UserTile.svelte';
  import { onMount } from 'svelte';

  let pin = $state('');
  let error = $state('');
  let loading = $state(false);
  let socialSession = $state(null);
  let selectedUser = $state(null);
  let availableUsers = $state([]);

  onMount(() => {
    const session = localStorage.getItem('socialSession');
    if (!session) {
      goto('/social-login');
      return;
    }
    
    socialSession = JSON.parse(session);
    if (new Date(socialSession.expires) <= new Date()) {
      localStorage.removeItem('socialSession');
      goto('/social-login');
      return;
    }

    // Load available users based on social login
    loadAvailableUsers();
  });

  async function loadAvailableUsers() {
    try {
      // Check if family setup is complete first
      const familyResponse = await fetch('/api/family');
      if (familyResponse.ok) {
        const { user, family } = await familyResponse.json();
        
        // If no family setup, redirect to setup
        if (!family?.name || !user?.pinHash || !family?.users?.some(u => u.roles.includes('CHILD'))) {
          goto('/setup');
          return;
        }
        
        // If family setup but config not reviewed, redirect to config
        if (!family?.setupComplete) {
          goto('/config');
          return;
        }
      }
      
      // Get users associated with this social account
      const response = await fetch('/api/auth/social-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: socialSession.email })
      });
      
      if (response.ok) {
        availableUsers = await response.json();
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }

  async function handlePinLogin() {
    if (!/^\d{4}$/.test(pin)) {
      error = 'PIN must be exactly 4 digits';
      return;
    }

    if (!selectedUser) {
      error = 'Please select a user';
      return;
    }

    loading = true;
    error = '';

    try {
      const data = await api.login(selectedUser.name, selectedUser.role, pin);
      
      login(data.token, {
        id: data.userId,
        name: data.name,
        role: data.role,
        currentBalance: data.currentBalance
      });

      goto('/');
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function selectUser(user: any) {
    selectedUser = user;
    error = '';
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-surface-300 p-4">
  <div class="w-full max-w-md backdrop-blur-md bg-white/20 border border-white/30 shadow-lg rounded-xl p-8">
    <div class="flex justify-center mb-8">
      <img src="/logo.svg" alt="Treasury" class="h-12" />
    </div>
    
    <div class="text-center mb-6">
      <h1 class="text-xl font-bold text-gray-900 mb-2">Welcome</h1>
      <p class="text-gray-600">Select your profile and enter your PIN</p>
    </div>
    
    {#if error}
      <div class="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-6">
        {error}
      </div>
    {/if}
    
    <!-- User Selection -->
    {#if availableUsers.length > 0}
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-900 mb-3">Select Profile</label>
        <div class="grid grid-cols-2 gap-3">
          {#each availableUsers as user}
            <button
              type="button"
              on:click={() => selectUser(user)}
              class="p-4 border-2 rounded-xl transition-all duration-200 {selectedUser?.id === user.id 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-300 hover:border-gray-400'}"
            >
              <div class="text-center">
                <div class="w-12 h-12 mx-auto mb-2 bg-primary-100 rounded-full flex items-center justify-center">
                  <span class="text-lg">
                    {user.role === 'PARENT' ? '👨‍💼' : '👶'}
                  </span>
                </div>
                <div class="text-sm font-medium text-gray-900">{user.name}</div>
                <div class="text-xs text-gray-600 capitalize">{user.role.toLowerCase()}</div>
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/if}
    
    <form on:submit|preventDefault={handlePinLogin} class="space-y-6">
      <div>
        <label for="pin-input" class="block text-sm font-medium text-gray-900 mb-4">4-Digit PIN</label>
        <PinInput id="pin-input" bind:pin />
      </div>
      
      <button 
        type="submit" 
        disabled={loading || pin.length !== 4 || !selectedUser}
        class="w-full {loading || pin.length !== 4 || !selectedUser ? 'bg-gray-600 cursor-not-allowed' : 'bg-primary-500 text-white shadow-md hover:shadow-lg hover:bg-primary-600'} inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none px-6 py-3 text-sm rounded-xl"
      >
        {loading ? 'Logging in...' : 'Login with PIN'}
      </button>
    </form>
    
    <div class="mt-6 text-center">
      <button
        type="button"
        on:click={() => {
          localStorage.removeItem('socialSession');
          goto('/social-login');
        }}
        class="text-sm text-gray-600 hover:text-gray-800"
      >
        Use different account
      </button>
    </div>
  </div>
</div>