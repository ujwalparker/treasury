<script lang="ts">
  let { user, selected = false, onClick } = $props();
</script>

<button
  type="button"
  on:click={onClick}
  class="p-4 border-2 rounded-xl transition-all duration-200 {selected 
    ? 'border-primary-500 bg-primary-50' 
    : 'border-gray-300 hover:border-gray-400'}"
>
  <div class="text-center">
    <div class="w-12 h-12 mx-auto mb-2 bg-primary-100 rounded-full flex items-center justify-center">
      <span class="text-lg">
        {user.role === 'PARENT' ? '👨💼' : '👶'}
      </span>
    </div>
    <div class="text-sm font-medium text-gray-900">{user.name}</div>
    <div class="text-xs text-gray-600 capitalize">{user.role.toLowerCase()}</div>
    <div class="text-xs text-primary-600 mt-1">{user.currentBalance} points</div>
  </div>
</button>