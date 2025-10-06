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

<div class="bg-white shadow-md rounded-lg p-6">
  <p class="text-gray-500 text-sm mb-1">Current Balance</p>
  <h2 class="text-3xl font-bold">{balance} Points</h2>
  
  <div class="flex flex-wrap gap-2 mt-4">
    {#each Array(coins.rupee) as _, i}
      <div class="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">
        ₹1
      </div>
    {/each}
    
    {#each Array(coins.paisa50) as _, i}
      <div class="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold">
        50p
      </div>
    {/each}
    
    {#each Array(coins.paisa25) as _, i}
      <div class="w-6 h-6 bg-zinc-200 rounded-full flex items-center justify-center text-xs font-bold">
        25p
      </div>
    {/each}
    
    {#each Array(coins.paisa1) as _, i}
      <div class="w-5 h-5 bg-zinc-100 rounded-full flex items-center justify-center text-xs font-bold">
        1p
      </div>
    {/each}
  </div>
</div>