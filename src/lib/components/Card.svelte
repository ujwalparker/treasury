<script lang="ts">
  export let variant: 'elevated' | 'filled' | 'outlined' | 'glass' = 'elevated';
  export let padding: 'none' | 'small' | 'medium' | 'large' = 'medium';
  export let clickable = false;

  $: cardClass = [
    'rounded-xl transition-all duration-200',
    // Variant classes
    variant === 'elevated' ? 'bg-surface-50 shadow-md' :
    variant === 'filled' ? 'bg-gray-100' :
    variant === 'outlined' ? 'bg-surface-50 border border-gray-300' :
    variant === 'glass' ? 'backdrop-blur-md bg-white/20 border border-white/30 shadow-lg' : '',
    // Padding classes
    padding === 'small' ? 'p-4' :
    padding === 'large' ? 'p-8' :
    padding === 'medium' ? 'p-6' : '',
    // Clickable state
    clickable ? 'cursor-pointer hover:shadow-lg' : ''
  ].filter(Boolean).join(' ');
</script>

<div 
  class={cardClass}
  on:click
  {...$$restProps}
>
  <slot />
</div>