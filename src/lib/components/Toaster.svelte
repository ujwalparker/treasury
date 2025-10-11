<script lang="ts">
  import { createToaster } from '@melt-ui/svelte';
  import { flip } from 'svelte/animate';
  import { fly } from 'svelte/transition';
  import { toaster, type ToastData } from '$lib/stores/toaster';
  import { CheckCircle, XCircle, Info, X } from 'lucide-svelte';
  import { onMount } from 'svelte';

  const {
    elements: { content, description, close },
    helpers: { addToast },
    states: { toasts },
    actions: { portal }
  } = createToaster();

  let processedIds = new Set<number>();

  $: {
    $toaster.forEach((item, index) => {
      const id = Date.now() + index;
      if (!processedIds.has(id)) {
        processedIds.add(id);
        addToast({
          data: item,
          closeDelay: 3000
        });
        setTimeout(() => toaster.remove(index), 100);
      }
    });
  }

  function getIcon(type: string) {
    switch (type) {
      case 'success': return CheckCircle;
      case 'error': return XCircle;
      default: return Info;
    }
  }

  function getColor(type: string) {
    switch (type) {
      case 'success': return 'bg-green-600';
      case 'error': return 'bg-red-600';
      default: return 'bg-blue-600';
    }
  }
</script>

<div use:portal class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
  {#each $toasts as { id, data } (id)}
    {@const toastData = data as ToastData}
    <div
      use:melt={$content(id)}
      animate:flip={{ duration: 300 }}
      in:fly={{ duration: 300, y: -20 }}
      out:fly={{ duration: 300, y: -20, opacity: 0 }}
      class="px-6 py-4 rounded-xl shadow-lg {getColor(toastData.type)} text-white flex items-center gap-3 min-w-[300px]"
    >
      <svelte:component this={getIcon(toastData.type)} class="w-5 h-5 flex-shrink-0" />
      <p use:melt={$description(id)} class="flex-1">{toastData.message}</p>
      <button use:melt={$close(id)} class="hover:opacity-80">
        <X class="w-4 h-4" />
      </button>
    </div>
  {/each}
</div>
