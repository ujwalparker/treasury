<script lang="ts">
  let { pin = $bindable(''), maxLength = 4, id = '', type = 'password' } = $props();

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
  <!-- Hidden input for accessibility -->
  <input
    {id}
    type="password"
    bind:value={pin}
    maxlength={maxLength}
    class="sr-only"
    aria-label="4-digit PIN"
  />
  <div class="flex justify-center gap-4 mb-6">
    {#each Array(maxLength) as _, i}
      <div class="w-14 h-14 border-2 border-gray-300 rounded-xl flex items-center justify-center text-lg font-medium bg-surface-50 {pin[i] ? 'border-primary-500' : ''}">
        {pin[i] ? (type === 'text' ? pin[i] : '•') : ''}
      </div>
    {/each}
  </div>
  
  <div class="grid grid-cols-3 gap-3">
    {#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as num}
      <button
        type="button"
        class="w-full h-14 bg-surface-50 border border-gray-300 rounded-xl hover:shadow-md transition-all duration-200 text-base font-medium text-gray-900"
        onclick={() => handleInput(num.toString())}
      >
        {num}
      </button>
    {/each}
    <button
      type="button"
      class="w-full h-14 bg-surface-50 border border-gray-300 rounded-xl hover:shadow-md transition-all duration-200 text-sm font-medium text-red-600"
      onclick={clear}
    >
      Clear
    </button>
    <button
      type="button"
      class="w-full h-14 bg-surface-50 border border-gray-300 rounded-xl hover:shadow-md transition-all duration-200 text-base font-medium text-gray-900"
      onclick={() => handleInput('0')}
    >
      0
    </button>
    <button
      type="button"
      class="w-full h-14 bg-surface-50 border border-gray-300 rounded-xl hover:shadow-md transition-all duration-200 text-base font-medium text-gray-900"
      onclick={backspace}
    >
      ←
    </button>
  </div>
</div>