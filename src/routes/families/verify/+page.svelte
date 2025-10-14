<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { createRadioGroup } from '@melt-ui/svelte';
  
  let currentQuestion = null;
  let selectedIndex = null;
  let loading = true;
  let verifying = false;
  let error = '';
  
  const {
    elements: { root, item, hiddenInput },
    helpers: { isChecked },
    states: { value }
  } = createRadioGroup({
    defaultValue: null,
    orientation: 'vertical'
  });
  
  $: selectedIndex = $value ? parseInt($value) : null;
  
  onMount(async () => {
    try {
      const res = await fetch('/api/families/verify');
      if (res.ok) {
        currentQuestion = await res.json();
      }
    } catch (err) {
      error = 'Failed to load verification questions';
    } finally {
      loading = false;
    }
  });
  
  async function submitAnswer() {
    if (selectedIndex === null || !currentQuestion) return;
    
    verifying = true;
    try {
      const res = await fetch('/api/families/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIndex: currentQuestion.questionIndex,
          selectedIndex: parseInt(selectedIndex)
        })
      });
      
      const result = await res.json();
      
      if (result.passed) {
        goto('/families/setup');
        return;
      }
      
      if (result.failed) {
        error = 'Verification failed. You have exhausted all questions without getting 3 correct answers.';
        return;
      }
      
      if (result.nextQuestion) {
        currentQuestion = result.nextQuestion;
        value.set(null);
        error = result.correct ? '' : 'Incorrect answer. Try the next question.';
      } else {
        error = 'No more questions available.';
      }
    } catch (err) {
      error = 'Verification failed. Please try again.';
    } finally {
      verifying = false;
    }
  }
  
  function goToChild() {
    goto('/auth/login');
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
  <div class="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
    <div class="text-center mb-8">
      <img src="/logo-vertical.svg" alt="Treasury" class="h-24 mx-auto mb-4" />
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Parent Verification</h1>
      <p class="text-gray-600 text-sm">Answer these questions to verify you're a parent</p>
    </div>
    
    {#if loading}
      <div class="text-center py-8">
        <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-600">Loading verification...</p>
      </div>
    {:else if currentQuestion}
      <div class="space-y-6">
        <div class="bg-gray-50 rounded-2xl p-6">
          <p class="text-gray-900 font-medium mb-6">{currentQuestion.question}</p>
          <div use:root class="space-y-3">
            {#each currentQuestion.options || [] as option, index}
              <button type="button" class="flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-white w-full text-left {$isChecked(index.toString()) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}" onclick={() => value.set(index.toString())}>
                <div
                  use:item={{ value: index.toString() }}
                  class="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center focus:ring-2 focus:ring-blue-500 focus:outline-none {$isChecked(index.toString()) ? 'border-blue-500 bg-blue-500' : 'hover:border-blue-400'}"
                >
                  {#if $isChecked(index.toString())}
                    <div class="w-2 h-2 rounded-full bg-white"></div>
                  {/if}
                </div>
                <span class="ml-3 text-gray-900 font-medium">{option}</span>
              </button>
            {/each}
            <input use:hiddenInput class="sr-only" />
          </div>
        </div>
        
        {#if error}
          <div class="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p class="text-red-700 text-sm">{error}</p>
          </div>
        {/if}
        
        <button
          type="button"
          onclick={submitAnswer}
          disabled={selectedIndex === null || verifying}
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-4 px-6 rounded-2xl transition-colors shadow-lg hover:shadow-xl disabled:shadow-none"
        >
          {#if verifying}
            <div class="flex items-center justify-center">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Verifying...
            </div>
          {:else}
            Submit Answer
          {/if}
        </button>
        
        <div class="text-center pt-4 border-t border-gray-200">
          <p class="text-sm text-gray-600 mb-3">Are you a child trying to access Treasury?</p>
          <button
            type="button"
            onclick={goToChild}
            class="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            I'm a child, take me to login
          </button>
        </div>
      </div>
    {:else}
      <div class="text-center py-8">
        <p class="text-red-600">Failed to load verification questions</p>
        <button
          type="button"
          onclick={() => goto('/auth/login')}
          class="mt-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          Back to Login
        </button>
      </div>
    {/if}
  </div>
</div>