<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let pin = '';
  let error = '';
  
  function addDigit(digit) {
    if (pin.length < 4) {
      pin += digit;
      if (pin.length === 4) {
        verifyPin();
      }
    }
  }
  
  function removeDigit() {
    pin = pin.slice(0, -1);
    error = '';
  }
  
  async function verifyPin() {
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      
      if (res.ok) {
        dispatch('unlock');
      } else {
        error = 'Invalid PIN';
        pin = '';
      }
    } catch (e) {
      error = 'Error verifying PIN';
      pin = '';
    }
  }
</script>

<div class="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-50">
  <div class="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8">
    <div class="flex justify-center mb-8">
      <img src="/logo-vertical.svg" alt="Treasury" class="h-24" />
    </div>
    
    <div class="text-center mb-8">
      <h1 class="text-xl font-bold text-gray-900 mb-2">Enter PIN</h1>
      <p class="text-gray-600 text-sm">App is locked for security</p>
    </div>
    
    <!-- PIN Display -->
    <div class="flex justify-center space-x-3 mb-8">
      {#each Array(4) as _, i}
        <div class="w-3 h-3 rounded-full border-2 border-gray-300 {pin.length > i ? 'bg-blue-600 border-blue-600' : 'bg-transparent'}"></div>
      {/each}
    </div>
    
    {#if error}
      <p class="text-red-600 text-center mb-4">{error}</p>
    {/if}
    
    <!-- Number Pad -->
    <div class="grid grid-cols-3 gap-3 mb-6">
      {#each [1,2,3,4,5,6,7,8,9] as digit}
        <button 
          on:click={() => addDigit(digit.toString())}
          class="h-14 bg-gray-100 hover:bg-gray-200 rounded-2xl text-lg font-medium text-gray-900 transition-colors"
        >
          {digit}
        </button>
      {/each}
      <div></div>
      <button 
        on:click={() => addDigit('0')}
        class="h-14 bg-gray-100 hover:bg-gray-200 rounded-2xl text-lg font-medium text-gray-900 transition-colors"
      >
        0
      </button>
      <button 
        on:click={removeDigit}
        class="h-14 bg-gray-100 hover:bg-gray-200 rounded-2xl text-lg font-medium text-gray-900 transition-colors"
      >
        ⌫
      </button>
    </div>
  </div>
</div>