<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth';
  import { api } from '$lib/services/api';
  import Layout from '$lib/components/Layout.svelte';
  import { goto } from '$app/navigation';
  import { Slider } from 'melt/builders';

  interface Config {
    rupeeCoinValue: number;
    twoRupeeCoinValue: number;
    paisa50Value: number;
    paisa25Value: number;
    interestRate: number;
  }

  let config: Config = {
    rupeeCoinValue: 10,
    twoRupeeCoinValue: 20,
    paisa50Value: 5,
    paisa25Value: 2,
    interestRate: 10
  };

  const rupeeCoinSlider = new Slider({ value: 10, min: 1, max: 50, step: 1 });
  const twoRupeeCoinSlider = new Slider({ value: 20, min: 1, max: 100, step: 1 });
  const paisa50Slider = new Slider({ value: 5, min: 1, max: 25, step: 1 });
  const paisa25Slider = new Slider({ value: 2, min: 1, max: 10, step: 1 });
  const interestRateSlider = new Slider({ value: 10, min: 1, max: 50, step: 1 });

  $: config.rupeeCoinValue = rupeeCoinSlider.value;
  $: config.twoRupeeCoinValue = twoRupeeCoinSlider.value;
  $: config.paisa50Value = paisa50Slider.value;
  $: config.paisa25Value = paisa25Slider.value;
  $: config.interestRate = interestRateSlider.value;
  
  let loading = true;
  let saving = false;
  let errorMessage = '';
  let successMessage = '';

  // Redirect if not parent
  $: if ($user && !$user.roles?.includes('PARENT')) {
    goto('/');
  }

  onMount(async () => {
    if (!$user?.roles?.includes('PARENT')) {
      loading = false;
      return;
    }
    
    try {
      const configData = await api.getConfig();
      config = configData;
      
      rupeeCoinSlider.value = configData.rupeeCoinValue;
      twoRupeeCoinSlider.value = configData.twoRupeeCoinValue;
      paisa50Slider.value = configData.paisa50Value;
      paisa25Slider.value = configData.paisa25Value;
      interestRateSlider.value = configData.interestRate;
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
      setTimeout(() => goto('/pin-login'), 1000);
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
                
                <div class="space-y-8">
                  <div>
                    <div class="flex justify-between items-center mb-3">
                      <label class="label-large text-on-surface">1 Rupee Coin</label>
                      <span class="title-medium text-primary">{config.rupeeCoinValue} points</span>
                    </div>
                    <div {...rupeeCoinSlider.root} class="relative flex items-center w-full h-6">
                      <div class="h-1 w-full bg-surface-variant rounded-full" />
                      <div {...rupeeCoinSlider.thumb} class="w-5 h-5 bg-primary rounded-full shadow-md hover:scale-110 transition-transform cursor-pointer" />
                    </div>
                    <div class="flex justify-between mt-1">
                      <span class="body-small text-on-surface-variant">1</span>
                      <span class="body-small text-on-surface-variant">50</span>
                    </div>
                  </div>
                  
                  <div>
                    <div class="flex justify-between items-center mb-3">
                      <label class="label-large text-on-surface">2 Rupee Coin</label>
                      <span class="title-medium text-primary">{config.twoRupeeCoinValue} points</span>
                    </div>
                    <div {...twoRupeeCoinSlider.root} class="relative flex items-center w-full h-6">
                      <div class="h-1 w-full bg-surface-variant rounded-full" />
                      <div {...twoRupeeCoinSlider.thumb} class="w-5 h-5 bg-primary rounded-full shadow-md hover:scale-110 transition-transform cursor-pointer" />
                    </div>
                    <div class="flex justify-between mt-1">
                      <span class="body-small text-on-surface-variant">1</span>
                      <span class="body-small text-on-surface-variant">100</span>
                    </div>
                  </div>
                  
                  <div>
                    <div class="flex justify-between items-center mb-3">
                      <label class="label-large text-on-surface">50 Paisa Coin</label>
                      <span class="title-medium text-primary">{config.paisa50Value} points</span>
                    </div>
                    <div {...paisa50Slider.root} class="relative flex items-center w-full h-6">
                      <div class="h-1 w-full bg-surface-variant rounded-full" />
                      <div {...paisa50Slider.thumb} class="w-5 h-5 bg-primary rounded-full shadow-md hover:scale-110 transition-transform cursor-pointer" />
                    </div>
                    <div class="flex justify-between mt-1">
                      <span class="body-small text-on-surface-variant">1</span>
                      <span class="body-small text-on-surface-variant">25</span>
                    </div>
                  </div>
                  
                  <div>
                    <div class="flex justify-between items-center mb-3">
                      <label class="label-large text-on-surface">25 Paisa Coin</label>
                      <span class="title-medium text-primary">{config.paisa25Value} points</span>
                    </div>
                    <div {...paisa25Slider.root} class="relative flex items-center w-full h-6">
                      <div class="h-1 w-full bg-surface-variant rounded-full" />
                      <div {...paisa25Slider.thumb} class="w-5 h-5 bg-primary rounded-full shadow-md hover:scale-110 transition-transform cursor-pointer" />
                    </div>
                    <div class="flex justify-between mt-1">
                      <span class="body-small text-on-surface-variant">1</span>
                      <span class="body-small text-on-surface-variant">10</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 class="title-large text-on-surface mb-6">System Settings</h3>
                
                <div class="space-y-8">
                  <div>
                    <div class="flex justify-between items-center mb-3">
                      <label class="label-large text-on-surface">Weekly Interest Rate</label>
                      <span class="title-medium text-primary">{config.interestRate}%</span>
                    </div>
                    <div {...interestRateSlider.root} class="relative flex items-center w-full h-6">
                      <div class="h-1 w-full bg-surface-variant rounded-full" />
                      <div {...interestRateSlider.thumb} class="w-5 h-5 bg-primary rounded-full shadow-md hover:scale-110 transition-transform cursor-pointer" />
                    </div>
                    <div class="flex justify-between mt-1">
                      <span class="body-small text-on-surface-variant">1%</span>
                      <span class="body-small text-on-surface-variant">50%</span>
                    </div>
                    <p class="body-small text-on-surface-variant mt-3">Percentage of savings added as bonus each week</p>
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