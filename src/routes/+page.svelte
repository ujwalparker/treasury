<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth';
  import { api } from '$lib/services/api';
  import Layout from '$lib/components/Layout.svelte';
  import BalanceCard from '$lib/components/BalanceCard.svelte';

  interface Transaction {
    id: string;
    type: string;
    amount: number;
    activity: string;
    category: string;
    createdAt: string;
  }

  let transactions: Transaction[] = [];
  let recentTransactions: Transaction[] = [];
  let loading = true;

  onMount(async () => {
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
        return 'text-green-600';
      case 'FINE':
        return 'text-red-600';
      case 'DEBIT':
      case 'SPEND':
        return 'text-blue-600';
      default:
        return '';
    }
  }
</script>

<Layout title="Treasury">
  <div class="space-y-6">
    <BalanceCard balance={$user?.currentBalance ?? 0} />
    
    <!-- Recent Transactions -->
    <div class="bg-white shadow-md rounded-lg p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Recent Transactions</h3>
      </div>
      
      {#if loading}
        <div class="flex justify-center py-8">
          <p>Loading transactions...</p>
        </div>
      {:else if recentTransactions.length > 0}
        <ul class="divide-y divide-gray-200">
          {#each recentTransactions as transaction}
            <li class="py-4">
              <div class="flex items-center space-x-4">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {transaction.activity}
                  </p>
                  <p class="text-sm text-gray-500 truncate">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div class="text-sm font-semibold {getTransactionColor(transaction.type)}">
                  {formatAmount(transaction)} points
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <div class="text-center py-8 text-gray-500">
          <p>No transactions yet</p>
        </div>
      {/if}
    </div>
  </div>
</Layout>