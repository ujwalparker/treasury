<script>
  import { page } from '$app/stores';
  
  $: searchParams = $page.url.searchParams;
  $: error = searchParams.get('error');
  $: errorDescription = searchParams.get('error_description');
</script>

<div class="p-8">
  <h1 class="text-2xl font-bold mb-4">Debug Info</h1>
  
  <div class="space-y-4">
    <div>
      <strong>Current URL:</strong> {$page.url.href}
    </div>
    
    <div>
      <strong>Origin:</strong> {$page.url.origin}
    </div>
    
    <div>
      <strong>Expected OAuth Redirect URIs:</strong>
      <ul class="list-disc ml-6 mt-2">
        <li>{$page.url.origin}/auth/callback/google</li>
        <li>{$page.url.origin}/auth/signin/google</li>
      </ul>
    </div>
    
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
        {#if errorDescription}
          <br><strong>Description:</strong> {errorDescription}
        {/if}
      </div>
    {/if}
  </div>
</div>