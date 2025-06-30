// apiService.js
class ApiService {
  static async getUser(userId) {
    try {
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("User not found");
        }
        throw new Error("Failed to fetch user data");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }

  static async getActiveLoan(userId) {
    const response = await fetch(`/api/users/${userId}/active-loan`);
    if (!response.ok) {
      if (response.status === 404) {
        return { hasLoan: false };
      }
      throw new Error("Failed to fetch loan data");
    }
    return await response.json();
  }

  static async applyForLoan(userId, amount, term) {
    const response = await fetch(`/api/users/${userId}/apply-loan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, term })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Loan application failed");
    }
    
    return await response.json();
  }

  static async getSavingsBalance(userId) {
    const response = await fetch(`/api/users/${userId}/savings-balance`);
    if (!response.ok) throw new Error("Failed to get balance");
    return await response.json();
  }

  static async addSavings(userId, amount) {
    const response = await fetch(`/api/users/${userId}/savings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to add savings");
    }
    
    return await response.json();
  }

  // Alias for getSavingsBalance for backward compatibility
  static async getSavings(userId) {
    return this.getSavingsBalance(userId);
  }
}

export { ApiService };
