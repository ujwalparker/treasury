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
  $: if ($user && !$user.roles?.includes('PARENT')) {
    goto('/');
  }

  onMount(async () => {
    try {
      const configData = await api.getConfig();
      config = configData;

      console.log($user)
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
    {#if !$user?.roles?.includes('PARENT')}
      <div class="text-center py-12">
        <p class="text-lg text-red-600">This page is only accessible to parents</p>
      </div>
    {:else}
      <h2 class="headline-small text-on-surface">Bank Points Configuration</h2>
      
      {#if loading}
        <div class="flex justify-center py-12">
          <p class="body-large text-on-surface-variant">Loading...</p>
        </div>
      {:else}
        {#if errorMessage}
          <div class="bg-error-100 border border-error-300 text-error-700 px-4 py-3 rounded-xl mb-6">
            {errorMessage}
          </div>
        {/if}
        
        {#if successMessage}
          <div class="bg-primary-100 border border-primary-300 text-primary-700 px-4 py-3 rounded-xl mb-6">
            {successMessage}
          </div>
        {/if}

        <div class="card-elevated p-6">
          <form on:submit|preventDefault={handleSubmit} class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 class="title-large text-on-surface mb-6">Coin Values</h3>
                
                <div class="space-y-6">
                  <div>
                    <label for="rupeeCoinValue" class="block label-large text-on-surface mb-2">1 Rupee Coin Value (points)</label>
                    <input
                      id="rupeeCoinValue"
                      type="number"
                      bind:value={config.rupeeCoinValue}
                      class="input-outlined w-full"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label for="twoRupeeCoinValue" class="block label-large text-on-surface mb-2">2 Rupee Coin Value (points)</label>
                    <input
                      id="twoRupeeCoinValue"
                      type="number"
                      bind:value={config.twoRupeeCoinValue}
                      class="input-outlined w-full"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label for="paisa50Value" class="block label-large text-on-surface mb-2">50 Paisa Coin Value (points)</label>
                    <input
                      id="paisa50Value"
                      type="number"
                      bind:value={config.paisa50Value}
                      class="input-outlined w-full"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label for="paisa25Value" class="block label-large text-on-surface mb-2">25 Paisa Coin Value (points)</label>
                    <input
                      id="paisa25Value"
                      type="number"
                      bind:value={config.paisa25Value}
                      class="input-outlined w-full"
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 class="title-large text-on-surface mb-6">System Settings</h3>
                
                <div class="space-y-6">
                  <div>
                    <label for="interestRate" class="block label-large text-on-surface mb-2">Weekly Interest Rate (%)</label>
                    <input
                      id="interestRate"
                      type="number"
                      bind:value={config.interestRate}
                      class="input-outlined w-full"
                      min="1"
                      max="100"
                      required
                    />
                    <p class="body-small text-on-surface-variant mt-2">Percentage of savings that will be added as bonus each week</p>
                  </div>
                  
                  <div>
                    <label for="startingCapital" class="block label-large text-on-surface mb-2">Starting Capital (points)</label>
                    <input
                      id="startingCapital"
                      type="number"
                      bind:value={config.startingCapital}
                      class="input-outlined w-full"
                      min="0"
                      required
                    />
                    <p class="body-small text-on-surface-variant mt-2">Initial points for new users</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="pt-6">
              <button
                type="submit"
                class="btn-filled w-full disabled:opacity-50"
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