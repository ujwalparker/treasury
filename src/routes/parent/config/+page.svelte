<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth';
  import { api } from '$lib/services/api';
  import Layout from '$lib/components/Layout.svelte';
  import { goto } from '$app/navigation';
  import { createRangeSlider, melt } from '@melt-ui/svelte';
  import { Trash2, Plus } from 'lucide-svelte';

  interface CurrencyModel {
    name: string;
    type: 'COIN' | 'NOTE';
    value: number;
    sortOrder: number;
  }

  interface CurrencyTemplate {
    id: string;
    name: string;
    code: string;
    isDefault: boolean;
    models: CurrencyModel[];
  }

  interface Config {
    interestRate: number;
    currencyModels: CurrencyModel[];
  }

  let config: Config = {
    interestRate: 10,
    currencyModels: []
  };

  let templates: CurrencyTemplate[] = [];
  let selectedTemplateId = '';

  const interestRateSlider = createRangeSlider({ value: [10], min: 1, max: 50, step: 1 });
  const { elements: interestElements, states: interestStates } = interestRateSlider;

  $: config.interestRate = $interestStates.value[0];
  
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
      templates = await api.getCurrencyTemplates();
      const configData = await api.getConfig();
      config = configData;
      interestStates.value.set([configData.interestRate]);
      
      if (configData.currencyModels?.length === 0 && templates.length > 0) {
        const defaultTemplate = templates.find(t => t.isDefault) || templates[0];
        selectedTemplateId = defaultTemplate.id;
        config.currencyModels = defaultTemplate.models.map(m => ({ ...m }));
      }
    } catch (error) {
      errorMessage = 'Error loading configuration';
      console.error('Error fetching configuration:', error);
    } finally {
      loading = false;
    }
  });

  function addCurrency(type: 'COIN' | 'NOTE') {
    config.currencyModels = [...config.currencyModels, {
      name: '',
      type,
      value: 0,
      sortOrder: config.currencyModels.length
    }];
  }

  function removeCurrency(index: number) {
    config.currencyModels = config.currencyModels.filter((_, i) => i !== index);
  }

  function loadTemplate() {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      config.currencyModels = template.models.map(m => ({ ...m }));
    }
  }

  async function handleSubmit() {
    saving = true;
    errorMessage = '';
    successMessage = '';
    
    try {
      await api.updateConfig({ ...config, currencyTemplateId: selectedTemplateId });
      successMessage = 'Configuration updated successfully';
      setTimeout(() => goto('/auth/pin'), 1000);
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
            <div class="space-y-8">
              {#if templates.length > 0}
                <div>
                  <h3 class="title-large text-on-surface mb-4">Currency Template</h3>
                  <div class="flex gap-4">
                    <select bind:value={selectedTemplateId} on:change={loadTemplate} class="input-field flex-1">
                      <option value="">Select a currency template</option>
                      {#each templates as template}
                        <option value={template.id}>{template.name} ({template.code})</option>
                      {/each}
                    </select>
                  </div>
                  <p class="body-small text-on-surface-variant mt-2">Select a currency template to start with, then customize as needed</p>
                </div>
              {/if}

              <div>
                <div class="flex justify-between items-center mb-6">
                  <h3 class="title-large text-on-surface">Coins</h3>
                  <button type="button" on:click={() => addCurrency('COIN')} class="btn-text flex items-center gap-2">
                    <Plus size={20} />
                    Add Coin
                  </button>
                </div>
                
                <div class="space-y-4">
                  {#each config.currencyModels.filter(c => c.type === 'COIN') as currency, index}
                    <div class="flex gap-4 items-center">
                      <input
                        type="text"
                        bind:value={currency.name}
                        placeholder="Coin name"
                        class="input-field flex-1"
                      />
                      <input
                        type="number"
                        bind:value={currency.value}
                        placeholder="Points"
                        min="0"
                        class="input-field w-32"
                      />
                      <button type="button" on:click={() => removeCurrency(config.currencyModels.indexOf(currency))} class="btn-text text-error">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  {/each}
                </div>
              </div>

              <div>
                <div class="flex justify-between items-center mb-6">
                  <h3 class="title-large text-on-surface">Currency Notes</h3>
                  <button type="button" on:click={() => addCurrency('NOTE')} class="btn-text flex items-center gap-2">
                    <Plus size={20} />
                    Add Note
                  </button>
                </div>
                
                <div class="space-y-4">
                  {#each config.currencyModels.filter(c => c.type === 'NOTE') as currency, index}
                    <div class="flex gap-4 items-center">
                      <input
                        type="text"
                        bind:value={currency.name}
                        placeholder="Note name"
                        class="input-field flex-1"
                      />
                      <input
                        type="number"
                        bind:value={currency.value}
                        placeholder="Points"
                        min="0"
                        class="input-field w-32"
                      />
                      <button type="button" on:click={() => removeCurrency(config.currencyModels.indexOf(currency))} class="btn-text text-error">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  {/each}
                </div>
              </div>

              <div>
                <h3 class="title-large text-on-surface mb-6">System Settings</h3>
                
                <div>
                  <div class="flex justify-between items-center mb-3">
                    <label class="label-large text-on-surface">Weekly Interest Rate</label>
                    <span class="title-medium text-primary">{config.interestRate}%</span>
                  </div>
                  <span use:melt={$interestElements.root} class="relative flex items-center w-full h-6">
                    <span use:melt={$interestElements.range} class="h-1 bg-primary rounded-full" />
                    <span class="h-1 w-full bg-surface-variant rounded-full absolute" />
                    <span use:melt={$interestElements.thumbs[0]} class="w-5 h-5 bg-primary rounded-full shadow-md hover:scale-110 transition-transform cursor-pointer relative z-10" />
                  </span>
                  <div class="flex justify-between mt-1">
                    <span class="body-small text-on-surface-variant">1%</span>
                    <span class="body-small text-on-surface-variant">50%</span>
                  </div>
                  <p class="body-small text-on-surface-variant mt-3">Percentage of savings added as bonus each week</p>
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