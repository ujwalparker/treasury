<script lang="ts">
  import { toast } from '$lib/stores/toast';
</script>

{#if $toast.length > 0}
  <div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
    {#each $toast as item (item.id)}
      <div class="px-6 py-4 rounded-xl shadow-lg animate-slide-down {item.type === 'success' ? 'bg-green-600' : item.type === 'error' ? 'bg-red-600' : 'bg-blue-600'} text-white">
        {item.message}
      </div>
    {/each}
  </div>
{/if}

<style>
  @keyframes slide-down {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .animate-slide-down {
    animation: slide-down 0.3s ease-out;
  }
</style>
