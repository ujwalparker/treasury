<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth';
  import { api } from '$lib/services/api';
  import Layout from '$lib/components/Layout.svelte';
  import { goto } from '$app/navigation';

  interface Config {
    rupeeCoinValue: number;
    twoRupeeCoinValue: number;
    paisa50Value: number;
    paisa25Value: number;
    interestRate: number;
    startingCapital: number;
  }

  let config: Config = {
    rupeeCoinValue: 10,
    twoRupeeCoinValue: 20,
    paisa50Value: 5,
    paisa25Value: 2,
    interestRate: 10,
    startingCapital: 480
  };
  
  let loading = true;
  let saving = false;
  let errorMessage = '';
  let successMessage = '';

  // Redirect if not parent
  $: if ($user && $user.role !== 'PARENT') {
    goto('/');
  }

  onMount(async () => {
    try {
      const configData = await api.getConfig();
      config = configData;
    } catch (error) {
      errorMessage = 'Error loading configuration';
      console.error('Error fetching configuration:', error);
    } finally {
      loading = false;
    }
  });

  async function handleSubmit() {
    saving = true;
    errorMessage = '';
    successMessage = '';
    
    try {
      await api.updateConfig(config);
      successMessage = 'Configuration updated successfully';
    } catch (error: any) {
      errorMessage = error.message || 'Failed to update configuration';
    } finally {
      saving = false;
    }
  }
</script>

<Layout title="Configuration">
  <div class="space-y-6">
    {#if $user?.role !== 'PARENT'}
      <div class="text-center py-12">
        <p class="text-lg text-red-600">This page is only accessible to parents</p>
      </div>
    {:else}
      <h2 class="text-xl font-semibold">Bank Points Configuration</h2>
      
      {#if loading}
        <div class="flex justify-center py-8">
          <p>Loading...</p>
        </div>
      {:else}
        {#if errorMessage}
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errorMessage}
          </div>
        {/if}
        
        {#if successMessage}
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        {/if}

        <div class="bg-white shadow-md rounded-lg p-6">
          <form on:submit|preventDefault={handleSubmit} class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-semibold mb-4">Coin Values</h3>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">1 Rupee Coin Value (points)</label>
                    <input
                      type="number"
                      bind:value={config.rupeeCoinValue}
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">2 Rupee Coin Value (points)</label>
                    <input
                      type="number"
                      bind:value={config.twoRupeeCoinValue}
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">50 Paisa Coin Value (points)</label>
                    <input
                      type="number"
                      bind:value={config.paisa50Value}
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">25 Paisa Coin Value (points)</label>
                    <input
                      type="number"
                      bind:value={config.paisa25Value}
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 class="text-lg font-semibold mb-4">System Settings</h3>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Weekly Interest Rate (%)</label>
                    <input
                      type="number"
                      bind:value={config.interestRate}
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="100"
                      required
                    />
                    <p class="text-sm text-gray-500 mt-1">Percentage of savings that will be added as bonus each week</p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Starting Capital (points)</label>
                    <input
                      type="number"
                      bind:value={config.startingCapital}
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                    <p class="text-sm text-gray-500 mt-1">Initial points for new users</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="pt-4">
              <button
                type="submit"
                class="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      {/if}
    {/if}
  </div>
</Layout>