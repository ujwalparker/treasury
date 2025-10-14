<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { signOut } from '@auth/sveltekit/client';
  import { user, token } from '$lib/stores/auth';
  import { api } from '$lib/services/api';

  import BalanceCard from '$lib/components/BalanceCard.svelte';

  interface Transaction {
    id: string;
    type: string;
    amount: number;
    activity: string;
    category: string;
    createdAt: string;
  }

  let transactions = $state([]);
  let recentTransactions = $state([]);
  let loading = $state(true);
  let currentUser = $state(null);
  let isLocked = $state(false);
  let sessionLoading = $state(true);
  
  async function handleSignOut() {
    await signOut({ callbackUrl: '/login' });
  }
  
  function switchUser() {
    goto('/auth/switch');
  }

  onMount(async () => {
    // Check Auth.js session
    const res = await fetch('/auth/session');
    if (!res.ok) {
      goto('/auth/login');
      return;
    }
    const session = await res.json();
    if (!session?.user) {
      goto('/auth/login');
      return;
    }
    
    currentUser = session.user;
    sessionLoading = false;
    
    // Check if family setup is complete for parents
    try {
      const setupRes = await fetch('/api/families/me/setup');
      if (setupRes.ok) {
        const setupData = await setupRes.json();
        if (!setupData.setupComplete) {
          goto('/families/verify');
          return;
        }
      } else {
        console.error('Setup status failed:', setupRes.status);
      }
    } catch (error) {
      console.error('Setup check error:', error);
    }
    
    try {
      const [transactionData, walletData] = await Promise.all([
        api.getTransactions(),
        api.getWallet()
      ]);
      
      transactions = transactionData;
      recentTransactions = transactionData.slice(0, 5);
      
      user.update(u => u ? { ...u, currentBalance: walletData.currentBalance } : null);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      loading = false;
    }
  });

  function formatAmount(transaction: Transaction) {
    return transaction.type === 'CREDIT' || transaction.type === 'INTEREST' 
      ? `+${transaction.amount}` 
      : `-${transaction.amount}`;
  }

  function getTransactionColor(type: string) {
    switch (type) {
      case 'CREDIT':
      case 'INTEREST':
        return 'text-primary-600';
      case 'FINE':
        return 'text-error-600';
      case 'DEBIT':
      case 'SPEND':
        return 'text-secondary-600';
      default:
        return 'text-on-surface';
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  {#if sessionLoading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
        <p class="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  {:else}
  <!-- Navigation -->
  <nav class="bg-white shadow-sm">
    <div class="max-w-md mx-auto px-6 py-4 flex justify-between items-center">
      <div class="flex items-center space-x-3">
        <img src="/logo.svg" alt="Treasury" class="h-8" />
      </div>
      <div class="flex items-center space-x-1">
        <button onclick={() => isLocked = true} class="p-2 text-gray-600 hover:bg-gray-100 rounded-full">🔒</button>
        <button onclick={switchUser} class="p-2 text-blue-600 hover:bg-blue-50 rounded-full">🔄</button>
        <button onclick={handleSignOut} class="p-2 text-red-600 hover:bg-red-50 rounded-full">😪</button>
      </div>
    </div>
  </nav>
  
  <div class="max-w-md mx-auto p-6 space-y-6">
    {#if currentUser}
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Signed in as</p>
        <p class="font-semibold text-gray-900">{currentUser.name || currentUser.email}</p>
      </div>
    {/if}
    
    <BalanceCard balance={$user?.currentBalance ?? 0} />
    
    <!-- Recent Transactions -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Recent Transactions</h3>
      </div>
      
      {#if loading}
        <div class="flex justify-center py-12">
          <p class="text-gray-500">Loading transactions...</p>
        </div>
      {:else if recentTransactions.length > 0}
        <ul class="divide-y divide-gray-100">
          {#each recentTransactions as transaction}
            <li class="py-4">
              <div class="flex items-center space-x-4">
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 truncate">
                    {transaction.activity}
                  </p>
                  <p class="text-sm text-gray-500 truncate">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div class="font-semibold {getTransactionColor(transaction.type)}">
                  {formatAmount(transaction)} points
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <div class="text-center py-12">
          <p class="text-gray-500">No transactions yet</p>
        </div>
      {/if}
    </div>
  </div>
  {/if}
</div>