<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let familyUsers = [];
  let selectedEmail = '';
  let pin = '';
  
  onMount(async () => {
    const res = await fetch('/api/families');
    const data = await res.json();
    familyUsers = data.family?.users || [];
  });
  
  async function switchUser() {
    const res = await fetch('/api/auth/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: selectedEmail, pin })
    });
    
    if (res.ok) {
      goto('/');
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
  <div class="max-w-sm mx-auto bg-white rounded-3xl shadow-xl p-8">
    <div class="flex justify-center mb-6">
      <img src="/logo.svg" alt="Treasury" class="h-12" />
    </div>
    
    <h1 class="text-2xl font-bold text-center mb-8 text-gray-900">Switch User</h1>
    
    <div class="mb-6">
      <label class="block text-sm font-medium mb-3 text-gray-700">Select User</label>
      <select bind:value={selectedEmail} class="w-full p-4 border border-gray-300 rounded-2xl bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
        <option value="">Choose user...</option>
        {#each familyUsers as user}
          <option value={user.email}>{user.name} ({user.role})</option>
        {/each}
      </select>
    </div>
    
    <div class="mb-8">
      <label class="block text-sm font-medium mb-3 text-gray-700">PIN</label>
      <input bind:value={pin} type="password" maxlength="4" class="w-full p-4 border border-gray-300 rounded-2xl bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg" />
    </div>
    
    <button on:click={switchUser} class="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-medium transition-colors">Switch User</button>
  </div>
</div>