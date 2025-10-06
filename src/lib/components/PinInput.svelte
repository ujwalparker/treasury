<script lang="ts">
  export let pin = '';
  export let maxLength = 4;

  function handleInput(digit: string) {
    if (pin.length < maxLength) {
      pin += digit;
    }
  }

  function clear() {
    pin = '';
  }

  function backspace() {
    pin = pin.slice(0, -1);
  }
</script>

<div>
  <div class="flex justify-between gap-2 mb-4">
    {#each Array(maxLength) as _, i}
      <div class="w-12 h-12 border-2 rounded-full flex items-center justify-center text-lg">
        {pin[i] ? '•' : ''}
      </div>
    {/each}
  </div>
  
  <div class="grid grid-cols-3 gap-2">
    {#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as num}
      <button
        type="button"
        class="w-full h-12 border rounded-md hover:bg-gray-50"
        on:click={() => handleInput(num.toString())}
      >
        {num}
      </button>
    {/each}
    <button
      type="button"
      class="w-full h-12 border rounded-md hover:bg-gray-50"
      on:click={clear}
    >
      Clear
    </button>
    <button
      type="button"
      class="w-full h-12 border rounded-md hover:bg-gray-50"
      on:click={() => handleInput('0')}
    >
      0
    </button>
    <button
      type="button"
      class="w-full h-12 border rounded-md hover:bg-gray-50"
      on:click={backspace}
    >
      ←
    </button>
  </div>
</div>