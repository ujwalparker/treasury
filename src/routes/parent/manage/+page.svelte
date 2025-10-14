<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth';
  import { api } from '$lib/services/api';
  import Layout from '$lib/components/Layout.svelte';
  import { goto } from '$app/navigation';

  interface Child {
    id: string;
    name: string;
    currentBalance: number;
  }

  interface Activity {
    id: string;
    name: string;
    description: string;
    type: string;
    amount: number;
    category: string;
  }

  let children = $state([]);
  let activities = $state([]);
  let selectedChild = $state(null);
  let selectedActivity = $state(null);
  let customAmount = $state(null);
  let loading = $state(true);
  let submitLoading = $state(false);
  let errorMessage = $state('');
  let successMessage = $state('');
  let readOnlyMode = $state(true); // Default to read-only mode for safety

  // Redirect if not parent
  $effect(() => {
    if ($user && $user.role !== 'PARENT') {
      goto('/');
    }
  });

  onMount(async () => {
    try {
      const [childrenData, activitiesData] = await Promise.all([
        api.getChildren(),
        api.getActivities()
      ]);
      
      children = childrenData;
      activities = activitiesData;
      
      if (children.length > 0) {
        selectedChild = children[0];
      }
    } catch (error) {
      errorMessage = 'Error loading data';
      console.error('Error fetching data:', error);
    } finally {
      loading = false;
    }
  });

  function getActivityTypeClass(type: string) {
    switch (type) {
      case 'CREDIT':
      case 'INTEREST':
        return 'bg-primary-100 text-primary-800';
      case 'FINE':
        return 'bg-error-100 text-error-800';
      case 'DEBIT':
      case 'SPEND':
        return 'bg-secondary-100 text-secondary-800';
      default:
        return 'bg-surface-variant text-on-surface-variant';
    }
  }

  function getCategoryDisplayName(category: string) {
    return category.replace(/_/g, ' ');
  }

  async function handleSubmit() {
    if (!selectedChild || !selectedActivity) {
      errorMessage = 'Please select a child and activity';
      return;
    }

    submitLoading = true;
    errorMessage = '';
    successMessage = '';
    
    try {
      const amount = customAmount !== null ? customAmount : selectedActivity.amount;
      await api.createTransaction(
        selectedActivity.type,
        amount,
        selectedActivity.name,
        selectedActivity.category,
        selectedChild.id
      );
      
      successMessage = `Successfully recorded ${selectedActivity.type.toLowerCase()} transaction for ${selectedChild.name}`;
      
      // Update the child's balance
      const updatedChildren = await api.getChildren();
      children = updatedChildren;
      selectedChild = updatedChildren.find(child => child.id === selectedChild?.id) || null;
      
      // Reset custom amount
      customAmount = null;
    } catch (error: any) {
      errorMessage = error.message || 'Failed to create transaction';
    } finally {
      submitLoading = false;
    }
  }

  async function handleCalculateInterest() {
    if (!selectedChild) {
      errorMessage = 'Please select a child';
      return;
    }

    submitLoading = true;
    errorMessage = '';
    successMessage = '';
    
    try {
      const result = await api.calculateSavingsInterest(selectedChild.id);
      
      successMessage = `Weekly savings bonus added: +${result.interestAmount} points (${selectedChild.name} now has ${result.newBalance} points)`;
      
      // Update the child's balance
      const updatedChildren = await api.getChildren();
      children = updatedChildren;
      selectedChild = updatedChildren.find(child => child.id === selectedChild?.id) || null;
    } catch (error: any) {
      errorMessage = error.message || 'Failed to calculate interest';
    } finally {
      submitLoading = false;
    }
  }

  function toggleMode() {
    readOnlyMode = !readOnlyMode;
  }
</script>

<Layout title="Parent Management">
  <div class="space-y-6">
    {#if $user?.role !== 'PARENT'}
      <div class="text-center py-12">
        <p class="text-lg text-red-600">This page is only accessible to parents</p>
      </div>
    {:else}
      <!-- Mode Toggle -->
      <div class="flex justify-between items-center">
        <h2 class="headline-small text-on-surface">Transaction Management</h2>
        <div class="flex items-center">
          <span class="body-medium text-on-surface-variant mr-3">{readOnlyMode ? 'Read-Only Mode' : 'Edit Mode'}</span>
          <button 
            class={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none shadow-elevation-1 ${readOnlyMode ? 'bg-surface-600' : 'bg-primary-500'}`}
            on:click={toggleMode}
          >
            <span 
              class={`inline-block h-6 w-6 transform rounded-full bg-surface-50 transition-transform shadow-elevation-2 ${readOnlyMode ? 'translate-x-1' : 'translate-x-7'}`}
            />
          </button>
        </div>
      </div>

      {#if loading}
        <div class="flex justify-center py-8">
          <p>Loading...</p>
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

        <!-- Child Selection -->
        <div class="card-elevated p-6">
          <h3 class="title-large text-on-surface mb-6">Select Child</h3>
          
          {#if children.length === 0}
            <p class="body-large text-on-surface-variant">No children found</p>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each children as child}
                <div 
                  class={`card-outlined p-4 cursor-pointer transition-all duration-200 ${selectedChild?.id === child.id ? 'border-primary-500 bg-primary-50 shadow-elevation-2' : 'hover:shadow-elevation-1'}`}
                  on:click={() => selectedChild = child}
                >
                  <p class="title-medium text-on-surface">{child.name}</p>
                  <p class="headline-small text-primary-600 mt-2">{child.currentBalance} Points</p>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Transaction Form (only shown in edit mode) -->
        {#if !readOnlyMode}
          <div class="card-elevated p-6">
            <h3 class="title-large text-on-surface mb-6">Record Transaction</h3>
            
            {#if !selectedChild}
              <p class="body-large text-tertiary-600">Please select a child first</p>
            {:else}
              <form on:submit|preventDefault={handleSubmit} class="space-y-4">
                <div>
                  <label class="block label-large text-on-surface mb-4">Activity</label>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each activities as activity}
                      <div
                        class={`card-outlined p-4 cursor-pointer transition-all duration-200 ${selectedActivity?.id === activity.id ? 'border-primary-500 bg-primary-50 shadow-elevation-2' : 'hover:shadow-elevation-1'}`}
                        on:click={() => {
                          selectedActivity = activity;
                          customAmount = activity.amount;
                        }}
                      >
                        <div class="flex justify-between items-center">
                          <span class="title-medium text-on-surface">{activity.name}</span>
                          <span class={`inline-block px-3 py-1 label-small rounded-lg ${getActivityTypeClass(activity.type)}`}>
                            {activity.type}
                          </span>
                        </div>
                        <p class="body-medium text-on-surface-variant mt-2">{getCategoryDisplayName(activity.category)}</p>
                        <p class="title-medium text-primary-600 mt-2">{activity.type === 'FINE' || activity.type === 'DEBIT' || activity.type === 'SPEND' ? '-' : '+'}{activity.amount} Points</p>
                      </div>
                    {/each}
                  </div>
                </div>
                
                {#if selectedActivity}
                  <div>
                    <label class="block label-large text-on-surface mb-2">Points (Custom Amount)</label>
                    <input
                      type="number"
                      bind:value={customAmount}
                      class="input-outlined w-full"
                      min="1"
                    />
                  </div>
                {/if}
                
                <div class="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="button"
                    on:click={handleCalculateInterest}
                    class="btn-tonal disabled:opacity-50"
                    disabled={!selectedChild || submitLoading}
                  >
                    Calculate Weekly Interest
                  </button>
                  
                  <button
                    type="submit"
                    class="btn-filled disabled:opacity-50"
                    disabled={!selectedChild || !selectedActivity || submitLoading}
                  >
                    {submitLoading ? 'Processing...' : 'Record Transaction'}
                  </button>
                </div>
              </form>
            {/if}
          </div>
        {/if}
      {/if}
    {/if}
  </div>
</Layout>