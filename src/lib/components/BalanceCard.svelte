<script lang="ts">
  export let balance: number;

  function getCoinBreakdown(amount: number) {
    return {
      rupee: Math.floor(amount / 10),
      paisa50: Math.floor((amount % 10) / 5),
      paisa25: Math.floor((amount % 5) / 2),
      paisa1: amount % 2
    };
  }

  $: coins = getCoinBreakdown(balance);
</script>

<div class="backdrop-blur-md bg-white/20 border border-white/30 shadow-lg rounded-xl p-6">
  <p class="text-sm text-gray-600 mb-2">Current Balance</p>
  <h2 class="text-4xl font-normal text-primary-600 mb-6">{balance} Points</h2>
  
  <div class="flex flex-wrap gap-3 mt-4">
    {#each Array(coins.rupee) as _, i}
      <div class="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-md">
        ₹1
      </div>
    {/each}
    
    {#each Array(coins.paisa50) as _, i}
      <div class="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-md">
        50p
      </div>
    {/each}
    
    {#each Array(coins.paisa25) as _, i}
      <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-md">
        25p
      </div>
    {/each}
    
    {#each Array(coins.paisa1) as _, i}
      <div class="w-7 h-7 bg-gray-500 rounded-full flex items-center justify-center text-xs font-medium text-gray-900 shadow-md">
        1p
      </div>
    {/each}
  </div>
</div>