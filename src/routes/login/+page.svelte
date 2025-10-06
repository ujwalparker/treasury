<script lang="ts">
  import { goto } from '$app/navigation';
  import { login } from '$lib/stores/auth';
  import { api } from '$lib/services/api';
  import PinInput from '$lib/components/PinInput.svelte';
  import { onMount } from 'svelte';

  let name = '';
  let role = 'CHILD';
  let pin = '';
  let error = '';
  let loading = false;
  let biometricSupported = false;
  let biometricRegistered = false;
  let showBiometricButton = false;

  onMount(() => {
    checkBiometricSupport();
  });

  async function checkBiometricSupport() {
    try {
      // Check if the browser supports WebAuthn
      if (window.PublicKeyCredential && 
          PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        
        // Check if a platform authenticator is available (TouchID, FaceID, Windows Hello)
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        biometricSupported = available;
        showBiometricButton = biometricSupported && name;
      }
    } catch (err) {
      console.error('Error checking WebAuthn support:', err);
      biometricSupported = false;
    }
  }

  async function handlePinLogin() {
    if (!/^\d{4}$/.test(pin)) {
      error = 'PIN must be exactly 4 digits';
      return;
    }

    loading = true;
    error = '';

    try {
      const data = await api.login(name, role, pin);
      
      login(data.token, {
        id: data.userId,
        name: data.name,
        role: data.role,
        currentBalance: data.currentBalance
      });

      goto('/');
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function handleBiometricLogin() {
    if (!name) {
      error = 'Please enter your name';
      return;
    }

    loading = true;
    error = '';

    try {
      // Get credential options from the server
      const credentialOptions = await api.getCredentialOptions(name);
      
      // Convert base64 challenge to ArrayBuffer
      const challenge = Uint8Array.from(atob(credentialOptions.challenge), c => c.charCodeAt(0));
      
      // Create the credential
      const credential = await navigator.credentials.create({
        publicKey: {
          ...credentialOptions,
          challenge,
          user: {
            ...credentialOptions.user,
            id: Uint8Array.from(credentialOptions.user.id, c => c.charCodeAt(0))
          },
          excludeCredentials: credentialOptions.excludeCredentials?.map(cred => ({
            ...cred,
            id: Uint8Array.from(atob(cred.id), c => c.charCodeAt(0))
          }))
        }
      });
      
      if (credential) {
        // Convert the credential to JSON
        const credentialJSON = {
          id: credential.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          type: credential.type,
          response: {
            attestationObject: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject))),
            clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON)))
          },
          username: name
        };
        
        // Verify the credential with the server
        const data = await api.verifyCredential(credentialJSON);
        
        login(data.token, {
          id: data.userId,
          name: data.name,
          role: data.role,
          currentBalance: data.currentBalance
        });

        goto('/');
      }
    } catch (err: any) {
      console.error('Biometric login error:', err);
      error = 'Biometric authentication failed. Please try again or use PIN.';
    } finally {
      loading = false;
    }
  }

  function updateName(event) {
    name = event.target.value;
    showBiometricButton = biometricSupported && name;
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
  <div class="w-full max-w-md bg-white rounded-lg shadow-md p-6">
    <h1 class="text-2xl font-bold text-center mb-6">Family Bank</h1>
    
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    {/if}
    
    <form on:submit|preventDefault={handlePinLogin} class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={name}
          on:input={updateName}
          required
          class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your name"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <select 
          bind:value={role}
          class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="CHILD">Child</option>
          <option value="PARENT">Parent</option>
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">4-Digit PIN</label>
        <PinInput bind:pin />
      </div>
      
      <button 
        type="submit" 
        disabled={loading || pin.length !== 4}
        class="w-full py-2 px-4 rounded-md text-white font-medium {loading || pin.length !== 4 ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}"
      >
        {loading ? 'Logging in...' : 'Login with PIN'}
      </button>

      {#if showBiometricButton}
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>
        
        <button 
          type="button"
          on:click={handleBiometricLogin}
          disabled={loading || !name}
          class="w-full py-2 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex justify-center items-center space-x-2"
        >
          <span class="material-icons text-lg">fingerprint</span>
          <span>Login with Biometrics</span>
        </button>

        <p class="text-xs text-center text-gray-500 mt-2">
          Use your device's fingerprint or face recognition
        </p>
      {/if}
    </form>
  </div>
</div>