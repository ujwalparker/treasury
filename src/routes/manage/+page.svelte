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

  let children: Child[] = [];
  let activities: Activity[] = [];
  let selectedChild: Child | null = null;
  let selectedActivity: Activity | null = null;
  let customAmount: number | null = null;
  let loading = true;
  let submitLoading = false;
  let errorMessage = '';
  let successMessage = '';
  let readOnlyMode = true; // Default to read-only mode for safety

  // Redirect if not parent
  $: if ($user && $user.role !== 'PARENT') {
    goto('/');
  }

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
        return 'bg-green-100 text-green-800';
      case 'FINE':
        return 'bg-red-100 text-red-800';
      case 'DEBIT':
      case 'SPEND':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <h2 class="text-xl font-semibold">Transaction Management</h2>
        <div class="flex items-center">
          <span class="text-sm mr-2">{readOnlyMode ? 'Read-Only Mode' : 'Edit Mode'}</span>
          <button 
            class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${readOnlyMode ? 'bg-gray-300' : 'bg-green-500'}`}
            on:click={toggleMode}
          >
            <span 
              class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${readOnlyMode ? 'translate-x-1' : 'translate-x-6'}`}
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
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errorMessage}
          </div>
        {/if}
        
        {#if successMessage}
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        {/if}

        <!-- Child Selection -->
        <div class="bg-white shadow-md rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">Select Child</h3>
          
          {#if children.length === 0}
            <p class="text-gray-500">No children found</p>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each children as child}
                <div 
                  class={`border rounded-md p-4 cursor-pointer transition-colors duration-200 ${selectedChild?.id === child.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                  on:click={() => selectedChild = child}
                >
                  <p class="font-medium">{child.name}</p>
                  <p class="text-lg font-bold mt-2">{child.currentBalance} Points</p>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Transaction Form (only shown in edit mode) -->
        {#if !readOnlyMode}
          <div class="bg-white shadow-md rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4">Record Transaction</h3>
            
            {#if !selectedChild}
              <p class="text-yellow-600">Please select a child first</p>
            {:else}
              <form on:submit|preventDefault={handleSubmit} class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Activity</label>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {#each activities as activity}
                      <div
                        class={`border rounded-md p-3 cursor-pointer transition-colors duration-200 ${selectedActivity?.id === activity.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                        on:click={() => {
                          selectedActivity = activity;
                          customAmount = activity.amount;
                        }}
                      >
                        <div class="flex justify-between items-center">
                          <span class="font-medium">{activity.name}</span>
                          <span class={`inline-block px-2 py-1 text-xs font-semibold rounded ${getActivityTypeClass(activity.type)}`}>
                            {activity.type}
                          </span>
                        </div>
                        <p class="text-sm text-gray-500 mt-1">{getCategoryDisplayName(activity.category)}</p>
                        <p class="font-semibold mt-1">{activity.type === 'FINE' || activity.type === 'DEBIT' || activity.type === 'SPEND' ? '-' : '+'}{activity.amount} Points</p>
                      </div>
                    {/each}
                  </div>
                </div>
                
                {#if selectedActivity}
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Points (Custom Amount)</label>
                    <input
                      type="number"
                      bind:value={customAmount}
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                {/if}
                
                <div class="flex justify-between pt-4">
                  <button
                    type="button"
                    on:click={handleCalculateInterest}
                    class="py-2 px-4 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                    disabled={!selectedChild || submitLoading}
                  >
                    Calculate Weekly Interest
                  </button>
                  
                  <button
                    type="submit"
                    class="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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