export function formatCurrency(amount) {
    return (amount || 0).toLocaleString('en-KE', {
      style: 'currency',
      currency: 'KES'
    });
}

export function calculateDaysRemaining(createdAt, term) {
    const createdDate = new Date(createdAt);
    const dueDate = new Date(createdDate);
    dueDate.setDate(dueDate.getDate() + term);
    const today = new Date();
    return Math.max(0, Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)));
}
