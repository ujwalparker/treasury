<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { toaster } from '$lib/stores/toaster';
  import { createTagsInput, createSelect } from '@melt-ui/svelte';
  
  let config = null;
  let loading = true;
  let saving = false;
  let currentUser = null;
  let groqModels = [];
  let geminiModels = [];
  let defaultGroqModel = '';
  let defaultGeminiModel = '';
  let keywordTags = [];
  
  const {
    elements: { root: tagsRoot, input: tagsInput, tag, deleteTrigger, edit },
    states: { tags }
  } = createTagsInput({
    defaultTags: [],
    unique: true,
    addOnPaste: true
  });
  
  const {
    elements: { trigger: providerTrigger, menu: providerMenu, option: providerOption, label: providerLabel },
    states: { selectedLabel: selectedProvider, open: providerOpen },
    helpers: { isSelected: isProviderSelected }
  } = createSelect({
    forceVisible: true,
    positioning: {
      placement: 'bottom',
      fitViewport: true,
      sameWidth: true
    }
  });
  
  const {
    elements: { trigger: groqTrigger, menu: groqMenu, option: groqOption, label: groqLabel },
    states: { open: groqOpen },
    helpers: { isSelected: isGroqSelected }
  } = createSelect({
    forceVisible: true,
    positioning: {
      placement: 'bottom',
      fitViewport: true,
      sameWidth: true
    }
  });
  
  const {
    elements: { trigger: geminiTrigger, menu: geminiMenu, option: geminiOption, label: geminiLabel },
    states: { open: geminiOpen },
    helpers: { isSelected: isGeminiSelected }
  } = createSelect({
    forceVisible: true,
    positioning: {
      placement: 'bottom',
      fitViewport: true,
      sameWidth: true
    }
  });
  
  $: keywordTags = $tags.map(tag => typeof tag === 'string' ? tag : tag.value || tag);
  $: if (config && keywordTags.length > 0) {
    config.verificationKeywords = keywordTags.join(', ');
  }
  
  onMount(async () => {
    // Check Auth.js session
    const res = await fetch('/auth/session');
    if (!res.ok) {
      goto('/login');
      return;
    }
    const session = await res.json();
    if (!session?.user) {
      goto('/login');
      return;
    }
    
    currentUser = session.user;
    
    // Check if user has ADMIN role
    const userRes = await fetch('/api/user/profile');
    if (userRes.ok) {
      const userData = await userRes.json();
      if (!userData.user?.roles?.includes('ADMIN')) {
        goto('/');
        return;
      }
    }
    
    // Load config and models
    try {
      const [configRes, modelsRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/config/models')
      ]);
      
      if (configRes.ok) {
        config = await configRes.json();
        // Initialize tags from config
        if (config.verificationKeywords) {
          const initialTags = config.verificationKeywords.split(',').map(tag => tag.trim()).filter(Boolean);
          tags.set(initialTags);
        }
      }
      
      if (modelsRes.ok) {
        const models = await modelsRes.json();
        groqModels = models.groqModels;
        geminiModels = models.geminiModels;
        defaultGroqModel = models.defaultGroqModel;
        defaultGeminiModel = models.defaultGeminiModel;
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      loading = false;
    }
  });
  
  async function saveConfig() {
    saving = true;
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        toaster.add('Configuration saved successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toaster.add('Failed to save configuration', 'error');
    } finally {
      saving = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <nav class="bg-white shadow-sm">
    <div class="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
      <div class="flex items-center space-x-3">
        <img src="/logo.svg" alt="Treasury" class="h-8" />
        <span class="text-lg font-semibold">Admin Panel</span>
      </div>
      <a href="/" class="text-blue-600 hover:text-blue-700">← Back to Dashboard</a>
    </div>
  </nav>
  
  <div class="max-w-4xl mx-auto p-6">
    {#if loading}
      <div class="text-center py-12">
        <p class="text-gray-500">Loading configuration...</p>
      </div>
    {:else if config}
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-8">System Configuration</h1>
        
        <!-- LLM Provider Selection -->
        <div class="p-6 bg-blue-50 rounded-2xl border border-blue-200">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">AI Model Configuration</h2>
          <div class="space-y-4">
            <div>
              <label use:providerLabel for="provider-select" class="block text-sm font-medium text-gray-700 mb-2">Default LLM Provider</label>
              <div class="relative">
                <button
                  id="provider-select"
                  use:providerTrigger
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-left flex items-center justify-between"
                >
                  <span>{config.defaultLlmProvider === 'groq' ? 'Groq' : 'Google Gemini'}</span>
                  <svg class="w-4 h-4 transition-transform {$providerOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                {#if $providerOpen}
                  <div use:providerMenu class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg">
                    <button
                      use:providerOption={{ value: 'groq', label: 'Groq' }}
                      class="w-full text-left px-4 py-3 hover:bg-blue-50 cursor-pointer {$isProviderSelected('groq') ? 'bg-blue-100' : ''}"
                      on:click={() => config.defaultLlmProvider = 'groq'}
                    >
                      Groq
                    </button>
                    <button
                      use:providerOption={{ value: 'gemini', label: 'Google Gemini' }}
                      class="w-full text-left px-4 py-3 hover:bg-blue-50 cursor-pointer {$isProviderSelected('gemini') ? 'bg-blue-100' : ''}"
                      on:click={() => config.defaultLlmProvider = 'gemini'}
                    >
                      Google Gemini
                    </button>
                  </div>
                {/if}
              </div>
            </div>
            
            {#if config.defaultLlmProvider === 'groq' && groqModels.length > 0}
              <div>
                <label use:groqLabel for="groq-model-select" class="block text-sm font-medium text-gray-700 mb-2">Groq Model</label>
                <div class="relative">
                  <button
                    id="groq-model-select"
                    use:groqTrigger
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-left flex items-center justify-between"
                  >
                    <span>{config.groqModel || defaultGroqModel}{config.groqModel === defaultGroqModel ? ' (default)' : ''}</span>
                    <svg class="w-4 h-4 transition-transform {$groqOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  {#if $groqOpen}
                    <div use:groqMenu class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {#each groqModels as model}
                        <button
                          use:groqOption={{ value: model, label: model }}
                          class="w-full text-left px-4 py-3 hover:bg-blue-50 cursor-pointer {$isGroqSelected(model) ? 'bg-blue-100' : ''}"
                          on:click={() => config.groqModel = model}
                        >
                          {model}{model === defaultGroqModel ? ' (default)' : ''}
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            {:else if config.defaultLlmProvider === 'gemini' && geminiModels.length > 0}
              <div>
                <label use:geminiLabel for="gemini-model-select" class="block text-sm font-medium text-gray-700 mb-2">Gemini Model</label>
                <div class="relative">
                  <button
                    id="gemini-model-select"
                    use:geminiTrigger
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-left flex items-center justify-between"
                  >
                    <span>{config.geminiModel || defaultGeminiModel}{config.geminiModel === defaultGeminiModel ? ' (default)' : ''}</span>
                    <svg class="w-4 h-4 transition-transform {$geminiOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  {#if $geminiOpen}
                    <div use:geminiMenu class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {#each geminiModels as model}
                        <button
                          use:geminiOption={{ value: model, label: model }}
                          class="w-full text-left px-4 py-3 hover:bg-blue-50 cursor-pointer {$isGeminiSelected(model) ? 'bg-blue-100' : ''}"
                          on:click={() => config.geminiModel = model}
                        >
                          {model}{model === defaultGeminiModel ? ' (default)' : ''}
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
            
            <p class="text-xs text-gray-500">This model will be used for generating family word clouds and other AI features</p>
          </div>
        </div>
        
        <!-- Parent Verification Keywords -->
        <div class="mt-8 p-6 bg-green-50 rounded-2xl border border-green-200">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Parent Verification Keywords</h2>
          <div class="space-y-4">
            <div>
              <label for="tags-input" class="block text-sm font-medium text-gray-700 mb-2">Question Topics</label>
              <div use:tagsRoot class="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent bg-white min-h-[3rem]">
                {#each $tags as t}
                  <div use:tag={{ value: t, disabled: false }} class="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    <span use:edit>{typeof t === 'string' ? t : t.value || t}</span>
                    <button use:deleteTrigger={{ value: t }} class="text-green-600 hover:text-green-800 ml-1" aria-label="Remove {typeof t === 'string' ? t : t.value || t}">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                {/each}
                <input
                  id="tags-input"
                  use:tagsInput
                  class="flex-1 outline-none bg-transparent min-w-[120px]"
                  placeholder="Type and press Enter to add topics..."
                />
              </div>
            </div>
            <p class="text-xs text-gray-500">These keywords will be used to generate parent verification questions. Topics should be adult knowledge that children typically wouldn't know. Press Enter to add each topic.</p>
          </div>
        </div>
        
        <button 
          on:click={saveConfig}
          disabled={saving}
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl transition-colors"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    {/if}
  </div>
</div>