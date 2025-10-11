<script lang="ts">
  export let variant: 'filled' | 'outlined' | 'text' | 'tonal' = 'filled';
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let disabled = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let fullWidth = false;

  $: buttonClass = [
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none',
    // Size classes
    size === 'small' ? 'px-4 py-2 text-sm rounded-lg' : 
    size === 'large' ? 'px-8 py-4 text-base rounded-2xl' : 
    'px-6 py-3 text-sm rounded-xl',
    // Variant classes
    variant === 'filled' ? 'bg-primary-500 text-white shadow-md hover:shadow-lg hover:bg-primary-600' :
    variant === 'outlined' ? 'border border-gray-400 text-primary-500 hover:bg-primary-50' :
    variant === 'text' ? 'text-primary-500 hover:bg-primary-50' :
    variant === 'tonal' ? 'bg-secondary-100 text-secondary-700 hover:shadow-md hover:bg-secondary-200' : '',
    // Width class
    fullWidth ? 'w-full' : '',
    // Disabled state
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  ].filter(Boolean).join(' ');
</script>

<button 
  {type}
  {disabled}
  class={buttonClass}
  on:click
  {...$$restProps}
>
  <slot />
</button>