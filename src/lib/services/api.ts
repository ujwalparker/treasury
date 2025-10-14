class ApiClient {
  private getHeaders() {
    return {
      'Content-Type': 'application/json'
    };
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: { ...this.getHeaders(), ...options.headers }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Children
  async getChildren() {
    return this.request('/families/children');
  }

  // Transactions
  async getParentTransactions(userId: string) {
    return this.request(`/users/${userId}/transactions`);
  }

  async createParentTransaction(type: string, amount: number, activity: string, category: string, userId: string) {
    return this.request(`/users/${userId}/transactions`, {
      method: 'POST',
      body: JSON.stringify({ type, amount, activity, category })
    });
  }



  // Wallet
  async getWallet() {
    return this.request('/users/me/wallet');
  }

  // Transactions
  async getTransactions() {
    return this.request('/users/me/transactions');
  }

  // Activities
  async getActivities() {
    return this.request('/families/me/activities');
  }



  // Family Config
  async getConfig() {
    return this.request('/families/me/config');
  }

  async updateConfig(configData: any) {
    return this.request('/families/me/config', {
      method: 'PUT',
      body: JSON.stringify(configData)
    });
  }

  // Currency Templates
  async getCurrencyTemplates() {
    return this.request('/templates');
  }

  // WebAuthn (Biometric Authentication)
  async getCredentialOptions(username: string) {
    return this.request('/auth/web-authn', {
      method: 'POST',
      body: JSON.stringify({ username })
    });
  }

  async verifyCredential(credentialData: any) {
    return this.request('/auth/web-authn', {
      method: 'POST',
      body: JSON.stringify({ ...credentialData, verify: true })
    });
  }




}

export const api = new ApiClient();