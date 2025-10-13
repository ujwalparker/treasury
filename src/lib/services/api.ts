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

  // Auth
  async login(name: string, role: string, pin: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ name, role, pin })
    });
  }

  // Transactions
  async getTransactions(userId?: string) {
    return this.request(userId ? `/transactions?userId=${userId}` : '/transactions');
  }

  async createTransaction(type: string, amount: number, activity: string, category: string, userId?: string) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify({ type, amount, activity, category, userId })
    });
  }

  // Wallet
  async getWallet() {
    return this.request('/wallet');
  }

  // Activities
  async getActivities() {
    return this.request('/activities');
  }

  // Users
  async getChildren() {
    return this.request('/users/children');
  }

  // Config
  async getConfig() {
    return this.request('/family/config');
  }

  async updateConfig(configData: any) {
    return this.request('/family/config', {
      method: 'PUT',
      body: JSON.stringify(configData)
    });
  }

  // WebAuthn (Biometric Authentication)
  async getCredentialOptions(username: string) {
    return this.request('/auth/webauthn/generate-options', {
      method: 'POST',
      body: JSON.stringify({ username })
    });
  }

  async verifyCredential(credentialData: any) {
    return this.request('/auth/webauthn/verify', {
      method: 'POST',
      body: JSON.stringify(credentialData)
    });
  }

  // Interest Calculation
  async calculateSavingsInterest(userId: string) {
    return this.request('/interest/calculate', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }
}

export const api = new ApiClient();