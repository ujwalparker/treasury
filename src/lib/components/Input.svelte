<script lang="ts">
  export let variant: 'outlined' | 'filled' = 'outlined';
  export let type = 'text';
  export let placeholder = '';
  export let value = '';
  export let disabled = false;
  export let required = false;
  export let label = '';
  export let helperText = '';
  export let error = false;

  $: inputClass = [
    'w-full transition-colors duration-200 focus:outline-none',
    variant === 'outlined' ? 
      `border rounded px-4 py-3 bg-surface-50 ${error ? 'border-error-500 focus:border-red-600' : 'border-gray-400 focus:border-primary-500'}` :
      `bg-gray-100 border-b-2 px-4 py-3 rounded-t ${error ? 'border-error-500 focus:border-red-600' : 'border-gray-400 focus:border-primary-500'}`,
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  ].filter(Boolean).join(' ');

  $: labelClass = [
    'block text-sm font-medium mb-2',
    error ? 'text-red-600' : 'text-gray-900'
  ].join(' ');

  $: helperClass = [
    'text-xs mt-2',
    error ? 'text-red-600' : 'text-gray-600'
  ].join(' ');
</script>

<div>
  {#if label}
    <label class={labelClass}>
      {label}
    </label>
  {/if}
  
  <input
    {type}
    {placeholder}
    {disabled}
    {required}
    bind:value
    class={inputClass}
    on:input
    on:change
    on:focus
    on:blur
    {...$$restProps}
  />
  
  {#if helperText}
    <p class={helperClass}>
      {helperText}
    </p>
  {/if}
</div>