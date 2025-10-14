<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Menu, ChevronDown, Users, Rocket, X, Key, Calendar } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { createProgress } from '@melt-ui/svelte';
  import { PinInput, RadioGroup } from 'melt/builders';
  
  let expandedChild = $state(-1);
  let menuOpen = $state(false);
  let familyInterests = $state(/** @type {string[]} */ ([]));
  let currentInterest = $state('');
  
  function toggleMenu() {
    menuOpen = !menuOpen;
  }
  
  onMount(async () => {
    if (!document.querySelector('link[href*="material-icons"]')) {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    
    // Load existing setup data
    await loadExistingSetup();
  });
  
  async function loadExistingSetup() {
    try {
      const response = await fetch('/api/families');
      if (response.ok) {
        const data = await response.json();
        const { user, family } = data;
        
        // If family is fully setup, redirect to dashboard
        if (family?.setupComplete) {
          goto('/');
          return;
        }
        
        // Step 1: Theme selection
        if (family?.theme) {
          selectedTheme = themes.find(t => t.id === family.theme) || null;
          currentStep = Math.max(currentStep, 2);
        }
        
        // Step 2: Family details
        if (family?.name) {
          familyName = family.name;
          familyInterests = family.interests || [];
          currentStep = Math.max(currentStep, 3);
        }
        
        // Step 3: PIN (skip if already set)
        if (family?.name && user?.pinHash) {
          parentPinAlreadySet = true;
          if (!family?.users?.some(u => u.roles.includes('CHILD'))) {
          currentStep = Math.max(currentStep, 4);
        }
        }
        
        // Step 4: Children
        if (family?.users?.length > 0) {
          const childUsers = family.users.filter(u => u.roles.includes('CHILD'));
          if (childUsers.length > 0) {
            children = childUsers.map(child => ({
              id: child.id,
              name: child.name,
              email: child.email || '',
              pin: '',
              yearOfBirth: child.yearOfBirth || '',
              pinAlreadySet: !!child.pinHash,
              saved: !!child.pinHash
            }));
            
            // If all children are saved and have year of birth, skip to config step
            const allChildrenComplete = children.every(c => c.saved && c.yearOfBirth);
            if (allChildrenComplete) {
              currentStep = Math.max(currentStep, 5);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load existing setup:', error);
    } finally {
      initialLoading = false;
    }
  }
  
  let currentStep = $state(1);
  let selectedTheme = $state(/** @type {any} */ (null));
  let familyName = $state('');
  let suggestedNames = $state(/** @type {string[]} */ ([]));
  let selectedSuggestion = $state(null);
  let customName = $state(false);
  let loadingNames = $state(false);
  let loadingStep = $state(false);
  let initialLoading = $state(true);
  let isOffline = $state(false);
  
  onMount(() => {
    isOffline = !navigator.onLine;
    window.addEventListener('online', () => isOffline = false);
    window.addEventListener('offline', () => isOffline = true);
  });
  let children = $state([{ id: undefined, name: '', email: '', pin: '', yearOfBirth: '', pinAlreadySet: false, saved: false }]);
  let parentPin = $state('');
  let parentPinAlreadySet = $state(false);
  
  let progressValue = $derived((currentStep / 6) * 100);
  
  const parentPinInput = new PinInput();
  
  const nameGroup = new RadioGroup({ value: undefined });
  
  $effect(() => {
    parentPin = Array.isArray(parentPinInput.value) ? parentPinInput.value.join('') : (parentPinInput.value || '');
  });
  
  let isValidParentPin = $derived(parentPinAlreadySet || (parentPin.length === 4 && /^\d{4}$/.test(parentPin)));
  
  let childPinEditing = $state(/** @type {Record<number, boolean>} */ ({}));
  let savingChild = $state(/** @type {Record<number, boolean>} */ ({}));
  
  async function enablePinEdit(/** @type {number} */ index) {
    childPinEditing[index] = true;
    children[index].pin = '';
    children[index].pinAlreadySet = false;
    children[index].saved = false;
    
    // Clear PIN in database if child has an ID
    if (children[index].id) {
      try {
        await fetch(`/api/families/children/${children[index].id}/pin`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Failed to clear PIN:', error);
      }
    }
  }
  
  const themes = [
    { id: 'lion', name: 'Lion Pride', emoji: '🦁', childTerm: 'Cub', colors: { primary: '#D97706', secondary: '#FCD34D' } },
    { id: 'elephant', name: 'Elephant Herd', emoji: '🐘', childTerm: 'Calf', colors: { primary: '#6B7280', secondary: '#D1D5DB' } },
    { id: 'dolphin', name: 'Dolphin Pod', emoji: '🐬', childTerm: 'Pup', colors: { primary: '#0EA5E9', secondary: '#7DD3FC' } },
    { id: 'penguin', name: 'Penguin Colony', emoji: '🐧', childTerm: 'Chick', colors: { primary: '#1F2937', secondary: '#F3F4F6' } },
    { id: 'wolf', name: 'Wolf Pack', emoji: '🐺', childTerm: 'Pup', colors: { primary: '#374151', secondary: '#9CA3AF' } },
    { id: 'eagle', name: 'Eagle Family', emoji: '🦅', childTerm: 'Eaglet', colors: { primary: '#92400E', secondary: '#FDE68A' } }
  ];
  
  function selectTheme(/** @type {any} */ theme) {
    selectedTheme = theme;
    // Only reset suggestions if theme actually changed
    if (selectedTheme?.id !== theme.id) {
      suggestedNames = [];
      selectedSuggestion = null;
      loadingNames = false;
    }
    // Always preserve familyName and customName
  }
  
  async function nextStep() {
    if (currentStep === 1 && selectedTheme) {
      currentStep++;
    } else if (currentStep === 2 && (familyName || selectedSuggestion)) {
      if (selectedSuggestion) familyName = selectedSuggestion;
      loadingStep = true;
      await saveFamilyName();
      loadingStep = false;
      currentStep++;
    } else if (currentStep === 3 && (parentPinAlreadySet || parentPin)) {
      loadingStep = true;
      await saveParentPin();
      if (parentPin) parentPinAlreadySet = true;
      loadingStep = false;
      currentStep++;
    } else if (currentStep === 4 && allChildrenSaved) {
      if (isOffline) return;
      loadingStep = true;
      try {
        await savePendingChildren();
        currentStep++;
      } catch (error) {
        console.error('Failed to save children:', error);
      } finally {
        loadingStep = false;
      }
    } else if (currentStep === 5) {
      if (isOffline) return;
      loadingStep = true;
      await saveConfig();
      loadingStep = false;
      currentStep++;
    }
  }
  
  
  async function saveFamilyName() {
    try {
      await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: familyName,
          theme: selectedTheme,
          interests: familyInterests
        })
      });
    } catch (error) {
      console.error('Failed to save family name:', error);
    }
  }
  
  async function generateFamilyNames() {
    if (!selectedTheme || familyInterests.length === 0) return;
    
    loadingNames = true;
    try {
      const tagsParam = familyInterests.join(',');
      const response = await fetch(`/api/families/names?tags=${encodeURIComponent(tagsParam)}&theme=${encodeURIComponent(selectedTheme.name)}`);
      
      if (response.ok) {
        const data = await response.json();
        suggestedNames = data.names;
        selectedSuggestion = null;
        familyName = '';
      }
    } catch (error) {
      console.error('Name generation failed:', error);
      suggestedNames = [`The ${selectedTheme.name}`, `${selectedTheme.name} Family`];
      selectedSuggestion = null;
      familyName = '';
    } finally {
      loadingNames = false;
    }
  }
  
  
  $effect(() => {
    if (nameGroup.value && suggestedNames.includes(nameGroup.value)) {
      selectedSuggestion = nameGroup.value || null;
      customName = false;
    }
  });
  
  $effect(() => {
    if (suggestedNames.length > 0) {
      nameGroup.value = undefined;
      selectedSuggestion = null;
    }
  });
  
  function enableCustomName() {
    customName = true;
    selectedSuggestion = null;
    suggestedNames = [];
    familyName = '';
  }
  
  function prevStep() {
    if (currentStep > 1) currentStep--;
  }
  

  
  async function saveParentPin() {
    if (parentPin) {
      await fetch('/api/users/me/pin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: parentPin })
      });
    }
  }
  
  async function saveChild(index) {
    const child = children[index];
    if (child.name && child.pin && child.pin.length === 4 && child.yearOfBirth) {
      savingChild[index] = true;
      try {
        const { pinAlreadySet, saved, ...childData } = child;
        await fetch('/api/families/children', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(childData)
        });
        children[index].saved = true;
        childPinEditing[index] = false;
        
        // Find next unsaved child and expand it
        const nextUnsaved = children.findIndex((c, i) => i > index && (!c.saved && !c.pinAlreadySet));
        expandedChild = nextUnsaved !== -1 ? nextUnsaved : -1;
      } catch (error) {
        console.error('Failed to save child:', error);
      } finally {
        savingChild[index] = false;
      }
    }
  }
  
  async function savePendingChildren() {
    try {
      await fetch('/api/families/children', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          children: children.filter(c => c.name).map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            yearOfBirth: c.yearOfBirth
          }))
        })
      });
    } catch (error) {
      console.error('Failed to save family children:', error);
    }
  }
  
  let allChildrenSaved = $derived(
    children.every(c => !c.name || ((c.saved || c.pinAlreadySet) && c.yearOfBirth)) &&
    !Object.values(childPinEditing).some(editing => editing)
  );
  
  let config = $state({
    rupeeCoinValue: 10,
    twoRupeeCoinValue: 20,
    paisa50Value: 5,
    paisa25Value: 2,
    interestRate: 10,
    startingCapital: 480
  });
  
  async function saveConfig() {
    try {
      await fetch('/api/families/me/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }
  
  async function createFamily() {
    loadingStep = true;
    await saveConfig();
    loadingStep = false;
    goto('/auth/pin');
  }
  
  function addChild() {
    if (children.length < 5) {
      children = [...children, { id: undefined, name: '', email: '', pin: '', yearOfBirth: '', pinAlreadySet: false, saved: false }];
      expandedChild = children.length - 1;
    }
  }
  
  $effect(() => {
    if (currentStep === 4) {
      const firstUnsaved = children.findIndex(c => (!c.saved && !c.pinAlreadySet) || !c.yearOfBirth);
      expandedChild = firstUnsaved !== -1 ? firstUnsaved : -1;
    }
  });
  
  async function removeChild(index) {
    if (children.length > 1) {
      const child = children[index];
      
      // Delete from database if child has an ID
      if (child.id) {
        try {
          const response = await fetch(`/api/families/children/${child.id}`, {
            method: 'DELETE'
          });
          if (!response.ok) {
            console.error('Failed to delete child from database');
            return;
          }
        } catch (error) {
          console.error('Failed to delete child:', error);
          return;
        }
      }
      
      children = children.filter((_, i) => i !== index);
      if (expandedChild === index) expandedChild = -1;
    }
  }
  
  function addInterest() {
    if (currentInterest.trim() && familyInterests.length < 5 && !familyInterests.includes(currentInterest.trim())) {
      familyInterests = [...familyInterests, currentInterest.trim()];
      currentInterest = '';
    }
  }
  
  function removeInterest(/** @type {number} */ index) {
    familyInterests = familyInterests.filter((_, i) => i !== index);
  }
  
  function getChildAge(/** @type {string} */ yearOfBirth) {
    if (!yearOfBirth) return null;
    return new Date().getFullYear() - parseInt(yearOfBirth);
  }
  
  const yearOptions = Array.from({length: 13}, (_, i) => new Date().getFullYear() - i);
  

  

  

</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
  {#if initialLoading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p class="text-gray-600">Loading setup...</p>
      </div>
    </div>
  {:else}
  <!-- Header Bar -->
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Brand Logo -->
        <div class="flex items-center">
          <img src="/logo.svg" alt="Treasury" class="h-8 w-auto" />
        </div>
        
        <!-- Primary CTA -->
        <div class="hidden sm:block">
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Get Help
          </button>
        </div>
        
        <!-- Menu -->
        <div class="relative">
          <button 
            onclick={toggleMenu}
            class="flex items-center space-x-1 text-gray-700 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} />
            <ChevronDown size={16} class="{menuOpen ? 'rotate-180' : ''} transition-transform" />
          </button>
          
          {#if menuOpen}
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Help & Support</button>
              <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Contact Us</button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </header>
  
  <div class="max-w-md mx-auto p-4">
    <!-- Welcome Section -->
    <div class="text-center mb-8 pt-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome</h1>
      <p class="text-gray-600">Set up your family's digital banking system to teach financial responsibility</p>
    </div>
    
    <!-- Progress Steps -->
    <div class="flex justify-center mb-8">
      <div class="w-full max-w-xs">
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full" style="width: {progressValue}%"></div>
        </div>
        <div class="flex justify-between mt-2 text-xs text-gray-500">
          <span>Theme</span>
          <span>Name</span>
          <span>PIN</span>
          <span>Children</span>
          <span>Config</span>
          <span>Done</span>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-3xl shadow-xl p-8 space-y-6">
      {#if currentStep === 1}
        <!-- Step 1: Theme Selection -->
        <div class="text-center mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Choose Your Family Theme</h2>
          <p class="text-sm text-gray-600">Pick a theme that represents your family</p>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          {#each themes as theme}
            <button
              onclick={() => selectTheme(theme)}
              class="p-4 rounded-2xl border-2 transition-all text-center hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                {selectedTheme?.id === theme.id 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}"
            >
              <div class="text-3xl mb-2">{theme.emoji}</div>
              <div class="font-medium text-gray-900">{theme.name}</div>
              <div class="text-xs text-gray-500">Children: {theme.childTerm}s</div>
            </button>
          {/each}
        </div>
        
        <button 
          onclick={nextStep}
          disabled={!selectedTheme}
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Continue
        </button>
        
      {:else if currentStep === 2}
        <!-- Step 2: Family Name -->
        <div class="text-center mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Family Name</h2>
          <p class="text-sm text-gray-600">Set a custom name or generate one</p>
        </div>
        
        <div class="{loadingStep ? 'opacity-50 pointer-events-none' : ''}">
          
          {#if customName || familyName}
            <input 
              id="family-name"
              bind:value={familyName} 
              placeholder="Enter your family name (max 4 words)"
              oninput={(e) => {
                const words = e.target.value.split(' ').filter(w => w.length > 0);
                if (words.length > 4) {
                  familyName = words.slice(0, 4).join(' ');
                }
              }}
              class="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:border-gray-400" 
            />
            
            <button
              onclick={() => { customName = false; familyName = ''; suggestedNames = []; }}
              class="w-full py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors mt-3"
            >
              Generate Name Instead
            </button>
          {:else if loadingNames}
            <div class="flex flex-col items-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p class="text-gray-500">Generating family names...</p>
            </div>
          {:else if familyInterests.length >= 2 && suggestedNames.length > 0}
            <div {...nameGroup.root} class="space-y-3 mb-4">
              {#each suggestedNames as name}
                {@const item = nameGroup.getItem(name)}
                <div {...item.attrs} class="flex items-center p-3 border-2 rounded-xl cursor-pointer
                  {item.checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}">
                  <div class="w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center
                    {item.checked ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}">
                    {#if item.checked}●{/if}
                  </div>
                  <span>{name}</span>
                </div>
              {/each}
              <input {...nameGroup.hiddenInput} />
            </div>
            
            <button
              onclick={enableCustomName}
              class="w-full py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Use custom name instead
            </button>
          {:else if !selectedSuggestion && suggestedNames.length === 0}
            <div class="mb-4">
              <div class="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent min-h-[3rem] items-center">
                {#each familyInterests as interest, i}
                  <div class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {interest}
                    <button 
                      type="button"
                      onclick={() => removeInterest(i)}
                      class="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                {/each}
                <input 
                  bind:value={currentInterest}
                  onkeydown={(e) => {
                    if (e.key === 'Enter' && currentInterest.trim()) {
                      addInterest();
                    }
                  }}
                  placeholder="Enter interests and press Enter"
                  class="flex-1 outline-none bg-transparent min-w-[200px]"
                />
              </div>
              <p class="text-xs text-gray-500 mt-2">Add 2-5 interests to generate personalized names</p>
            </div>
            
            {#if familyInterests.length >= 2}
              <button
                onclick={() => generateFamilyNames()}
                disabled={isOffline}
                class="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors mb-3"
              >
                {isOffline ? 'Offline' : 'Generate Names'}
              </button>
            {/if}
            
            <button
              onclick={enableCustomName}
              class="w-full py-3 {familyInterests.length >= 2 ? 'border border-gray-300 hover:bg-gray-50 text-gray-700' : 'bg-blue-600 hover:bg-blue-700 text-white'} font-medium rounded-xl transition-colors"
            >
              Set Custom Name
            </button>
          {/if}
        </div>
        
        <div class="flex space-x-3">
          <button 
            onclick={prevStep}
            disabled={loadingStep}
            class="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-colors"
          >
            Back
          </button>
          <button 
            onclick={nextStep}
            disabled={(!familyName && !selectedSuggestion) || loadingStep || isOffline}
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center"
          >
            {#if loadingStep}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {/if}
            {isOffline ? 'Offline' : 'Continue'}
          </button>
        </div>
        
      {:else if currentStep === 3}
        <!-- Step 3: Set Parent PIN -->
        <div class="text-center mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">{parentPinAlreadySet ? 'Parent PIN Already Set' : 'Set Your Parent PIN'}</h2>
          <p class="text-sm text-gray-600">{parentPinAlreadySet ? 'Your parent PIN is already configured. Click continue to proceed.' : 'Create a secure 4-digit PIN for parent access'}</p>
        </div>
        
        <div class="{loadingStep ? 'opacity-50 pointer-events-none' : ''}">
          {#if parentPinAlreadySet}
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
              <span class="text-sm text-gray-600">PIN is set</span>
              <button
                onclick={() => { parentPinAlreadySet = false; parentPin = ''; parentPinInput.value = ''; }}
                class="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Change PIN
              </button>
            </div>
          {:else}
            <div class="block text-sm font-medium text-gray-700 mb-4">Your Parent PIN</div>
            <div {...parentPinInput.root} class="flex justify-center gap-3 mb-4">
              {#each parentPinInput.inputs as input}
                <input {...input} class="w-14 h-14 text-center text-2xl border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
              {/each}
            </div>
            <p class="text-xs text-gray-500 mt-4">This PIN will be used for parent access and transactions</p>
          {/if}
        </div>
        
        <div class="flex space-x-3">
          <button 
            onclick={prevStep}
            disabled={loadingStep}
            class="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-colors"
          >
            Back
          </button>
          <button 
            onclick={nextStep}
            disabled={!isValidParentPin || loadingStep || isOffline}
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center"
          >
            {#if loadingStep}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {/if}
            {isOffline ? 'Offline' : 'Continue'}
          </button>
        </div>
        
      {:else if currentStep === 4}
        <!-- Step 4: Add Children -->
        <div class="text-center mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Add {selectedTheme?.childTerm}s</h2>
          <p class="text-sm text-gray-600">Add your {selectedTheme?.childTerm?.toLowerCase()}s to the {selectedTheme?.name}</p>
        </div>
        
        <div class="{loadingStep ? 'opacity-50 pointer-events-none' : ''}">
          {#each children as child, i}
            <div class="mb-4 border border-gray-200 rounded-2xl overflow-hidden">
              <div class="w-full p-4 bg-gray-50 flex items-center justify-between">
                <button
                  onclick={() => expandedChild = expandedChild === i ? -1 : i}
                  class="flex-1 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                >
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900">
                      {child.name ? child.name.split(' ')[0] : `${selectedTheme?.childTerm} ${i + 1}`}
                    </span>
                    <div class="flex items-center gap-1">
                      {#if child.saved || child.pinAlreadySet}
                        <span class="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          <Key size={12} />
                        </span>
                      {:else}
                        <span class="flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                          <Key size={12} />
                        </span>
                      {/if}
                      {#if child.yearOfBirth}
                        <span class="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          <Calendar size={12} />
                        </span>
                      {:else}
                        <span class="flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                          <Calendar size={12} />
                        </span>
                      {/if}
                    </div>
                  </div>
                  <ChevronDown size={16} class="{expandedChild === i ? 'rotate-180' : ''} transition-transform" />
                </button>
                {#if children.length > 1}
                  <button
                    onclick={() => removeChild(i)}
                    class="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                  >
                    <X size={16} />
                  </button>
                {/if}
              </div>
              
              {#if expandedChild === i}
                <div class="p-4 bg-white border-t border-gray-200 {savingChild[i] ? 'opacity-50 pointer-events-none' : ''}">
                  <input 
                    bind:value={child.name} 
                    placeholder="{selectedTheme?.childTerm}'s Name" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-xl mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                  />
                  <input 
                    bind:value={child.email} 
                    placeholder="Email (optional - for Google login)" 
                    type="email"
                    class="w-full px-3 py-2 border border-gray-300 rounded-xl mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                  />
                  <select 
                    bind:value={child.yearOfBirth} 
                    class="w-full px-3 py-2 border border-gray-300 rounded-xl mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select Year of Birth</option>
                    {#each yearOptions as year}
                      <option value={year}>{year}</option>
                    {/each}
                  </select>
                  <div class="mb-3">
                    <div class="block text-sm font-medium text-gray-700 mb-2">{selectedTheme?.childTerm}'s 4-digit PIN</div>
                    {#if child.pinAlreadySet && !childPinEditing[i]}
                      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span class="text-sm text-gray-600">PIN is set</span>
                        <button
                          onclick={() => enablePinEdit(i)}
                          class="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Change PIN
                        </button>
                      </div>
                    {:else}
                      <input 
                        bind:value={child.pin}
                        type="text"
                        inputmode="numeric"
                        maxlength="4"
                        placeholder="Enter 4-digit PIN"
                        class="w-full px-4 py-3 text-center text-2xl border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      />
                    {/if}
                  </div>
                  <button
                    onclick={() => saveChild(i)}
                    disabled={!child.name || !child.pin || child.pin.length !== 4 || !child.yearOfBirth || savingChild[i] || isOffline}
                    class="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors mb-3 flex items-center justify-center"
                  >
                    {#if savingChild[i]}
                      <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {/if}
                    {isOffline ? 'Offline' : `${child.saved ? 'Update' : 'Save'} ${selectedTheme?.childTerm}`}
                  </button>
                  <p class="text-xs text-gray-500">If email is provided, {selectedTheme?.childTerm?.toLowerCase()} can use Google login. Otherwise, they'll use the in-app switcher.</p>
                </div>
              {/if}
            </div>
          {/each}
        </div>
        
        {#if children.length < 5}
          <button 
            onclick={addChild} 
            class="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2 mb-6"
          >
<Users size={20} />
            <span>Add Another {selectedTheme?.childTerm}</span>
          </button>
        {/if}
        
        <div class="flex space-x-3">
          <button 
            onclick={prevStep}
            class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-colors"
          >
            Back
          </button>
          <button 
            onclick={nextStep}
            disabled={!allChildrenSaved || loadingStep || isOffline}
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center"
          >
            {#if loadingStep}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {/if}
            {isOffline ? 'Offline' : 'Continue'}
          </button>
        </div>
        

        
      {:else if currentStep === 5}
        <!-- Step 5: Configuration -->
        <div class="text-center mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Treasury Configuration</h2>
          <p class="text-sm text-gray-600">Configure your family's point system</p>
        </div>
        
        <div class="space-y-6">
          <div>
            <h3 class="font-medium text-gray-900 mb-4">Coin Values</h3>
            <div class="space-y-4">
              <div>
                <label for="rupee-coin" class="block text-sm text-gray-700 mb-1">1 Rupee Coin (points)</label>
                <input id="rupee-coin" bind:value={config.rupeeCoinValue} type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label for="two-rupee-coin" class="block text-sm text-gray-700 mb-1">2 Rupee Coin (points)</label>
                <input id="two-rupee-coin" bind:value={config.twoRupeeCoinValue} type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label for="paisa-50" class="block text-sm text-gray-700 mb-1">50 Paisa Coin (points)</label>
                <input id="paisa-50" bind:value={config.paisa50Value} type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label for="paisa-25" class="block text-sm text-gray-700 mb-1">25 Paisa Coin (points)</label>
                <input id="paisa-25" bind:value={config.paisa25Value} type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
            </div>
          </div>
          
          <div>
            <h3 class="font-medium text-gray-900 mb-4">System Settings</h3>
            <div class="space-y-4">
              <div>
                <label for="interest-rate" class="block text-sm text-gray-700 mb-1">Weekly Interest Rate (%)</label>
                <input id="interest-rate" bind:value={config.interestRate} type="number" min="1" max="100" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label for="starting-capital" class="block text-sm text-gray-700 mb-1">Starting Capital (points)</label>
                <input id="starting-capital" bind:value={config.startingCapital} type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex space-x-3">
          <button 
            onclick={prevStep}
            disabled={loadingStep}
            class="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-colors"
          >
            Back
          </button>
          <button 
            onclick={nextStep}
            disabled={loadingStep || isOffline}
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center"
          >
            {#if loadingStep}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {/if}
            {isOffline ? 'Offline' : 'Continue'}
          </button>
        </div>
        
      {:else if currentStep === 6}
        <!-- Step 6: Summary -->
        <div class="text-center mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Summary</h2>
          <p class="text-sm text-gray-600">Review your family setup before proceeding</p>
        </div>
        
        <div class="space-y-4">
          <!-- Theme Summary -->
          <div class="p-4 bg-gray-50 rounded-2xl">
            <h3 class="font-medium text-gray-900 mb-2">Family Theme</h3>
            <div class="flex items-center space-x-3">
              <span class="text-2xl">{selectedTheme?.emoji}</span>
              <div>
                <div class="font-medium">{selectedTheme?.name}</div>
                <div class="text-sm text-gray-600">Children: {selectedTheme?.childTerm}s</div>
              </div>
            </div>
          </div>
          
          <!-- Tags Summary -->
          <div class="p-4 bg-gray-50 rounded-2xl">
            <h3 class="font-medium text-gray-900 mb-2">Family Tags</h3>
            <div class="flex flex-wrap gap-2">
              {#each familyInterests as interest}
                <span class="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">{interest}</span>
              {/each}
            </div>
          </div>
          
          <!-- Family Name Summary -->
          <div class="p-4 bg-gray-50 rounded-2xl">
            <h3 class="font-medium text-gray-900 mb-2">Family Name</h3>
            <div class="font-medium">{familyName}</div>
          </div>
          
          <!-- Children Summary -->
          <div class="p-4 bg-gray-50 rounded-2xl">
            <h3 class="font-medium text-gray-900 mb-2">{selectedTheme?.childTerm}s ({children.filter(c => c.name).length})</h3>
            <div class="space-y-2">
              {#each children.filter(c => c.name) as child}
                <div class="flex items-center justify-between">
                  <span class="font-medium">{child.name}</span>
                  <span class="text-sm text-gray-600">
                    {child.email ? 'Google Login' : 'In-app Switcher'}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        </div>
        
        <div class="flex space-x-3">
          <button 
            onclick={prevStep}
            disabled={loadingStep}
            class="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-colors"
          >
            Back
          </button>
          <button 
            onclick={createFamily}
            disabled={loadingStep || isOffline}
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center space-x-2"
          >
            {#if loadingStep}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {/if}
            <Rocket size={20} />
            <span>{isOffline ? 'Offline' : 'Configure Treasury'}</span>
          </button>
        </div>
      {/if}
    </div>
  </div>
  {/if}
</div>