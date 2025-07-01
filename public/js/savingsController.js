import { ApiService } from './apiService.js';
import { updateDashboard } from './dashboard.js';
import { showError, showSuccess } from './uiHelpers.js';
import { getCurrentUser } from './userState.js';


// export function initSavings() {
//     document.getElementById('add-savings-form').addEventListener('submit', async (e) => {
//       e.preventDefault();
//       const amount = parseInt(document.getElementById('savings-amount-input').value);
//       const result = await ApiService.addSavings(currentUser.id, amount);
//       if (result.success) {
//         updateDashboard(currentUser.id);
//         showSuccess('Savings added successfully');
//       } else {
//         showError('Failed to add savings');
//       }
//     });
// }


export function initSavings() {
    const savingsForm = document.getElementById('savings-form');
    const closeBtn = document.querySelector('#savings-modal .close-btn');
    const addSavingsBtn = document.getElementById('add-savings-btn');

    // Open modal from dashboard button
    addSavingsBtn?.addEventListener('click', () => {
        const user = getCurrentUser();
        if (user) {
            showSavingsModal(user);
        } else {
            showError('Please login to add savings');
        }
    });

    // Close modal
    closeBtn?.addEventListener('click', closeSavingsModal);

    // Form submission
    savingsForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSavingsSubmission();
    });
}

function showSavingsModal(user) {
    document.getElementById('savings-user-name').textContent = user.full_name;
    document.getElementById('savings-user-phone').textContent = user.phone;
    document.getElementById('savings-modal').style.display = 'flex';
    document.getElementById('savings-amount').focus();
}

function closeSavingsModal() {
    document.getElementById('savings-modal').style.display = 'none';
    document.getElementById('savings-form').reset();
    document.getElementById('mpesa-confirmation').style.display = 'none';
}

// async function handleSavingsSubmission() {
//     const user = getCurrentUser();
//     if (!user) {
//         showError('Session expired. Please login again.');
//         return;
//     }
//
//     const amount = parseInt(document.getElementById('savings-amount').value);
//     const submitBtn = document.getElementById('submit-savings');
//
//     try {
//         // Show M-Pesa confirmation UI
//         document.getElementById('confirm-amount').textContent = amount;
//         document.getElementById('mpesa-confirmation').style.display = 'block';
//         submitBtn.disabled = true;
//         submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
//
//         // Simulate M-Pesa payment processing
//         await new Promise(resolve => setTimeout(resolve, 45000));
//
//         // Submit to backend
//         const result = await ApiService.addSavings(user.id, amount);
//
//         // Show success and close after delay
//         showSuccess(`Successfully deposited ${amount} Ksh to your savings`);
//         setTimeout(() => {
//             closeSavingsModal();
//             if (window.updateDashboard) {
//                 window.updateDashboard(user.id);
//             }
//         }, 1500);
//
//     } catch (error) {
//         showError(error.message);
//         document.getElementById('mpesa-confirmation').style.display = 'none';
//     } finally {
//         submitBtn.disabled = false;
//         submitBtn.innerHTML = '<i class="fas fa-money-bill-wave"></i> Deposit via M-Pesa';
//     }
// }

async function handleSavingsSubmission() {
    const user = getCurrentUser();
    if (!user) {
        showError('Session expired. Please login again.');
        return;
    }

    const amountInput = document.getElementById('savings-amount');
    const amountString = amountInput.value.trim();
    const submitBtn = document.getElementById('submit-savings');

    if (amountString === "") {
        showError('Amount cannot be empty. Please enter a valid amount.');
        return;
    }

    const amount = parseInt(amountString);

    if (isNaN(amount)) {
        showError('Invalid amount. Please enter a valid number.');
        return;
    }

    // Assuming a minimum amount of 1 based on "positive number" error.
    // If there's a specific minimum like 100 from an HTML attribute, that could be checked too.
    // For example: const minAmount = parseInt(amountInput.min) || 1;
    if (amount <= 0) {
        showError('Amount must be a positive number.');
        return;
    }

    try {
        // Show M-Pesa confirmation UI
        document.getElementById('confirm-amount').textContent = amount;
        document.getElementById('mpesa-confirmation').style.display = 'block';
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        // Initiate M-Pesa payment
        const response = await fetch('/api/mpesa/initiate-stk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: user.phone,
                amount: amount
            })
        });

        if (!response.ok) {
            throw new Error('Failed to initiate payment');
        }

        const result = await response.json();

        // Poll for payment completion (simplified example)
        await checkPaymentStatus(result.checkoutId);

        // Save to savings if payment successful
        const saveResponse = await ApiService.addSavings(user.id, amount);

        showSuccess(`Successfully deposited ${amount} Ksh to your savings`);
        setTimeout(() => {
            closeSavingsModal();
            if (window.updateDashboard) {
                window.updateDashboard(user.id);
            }
        }, 1500);

    } catch (error) {
        showError(error.message || 'Payment failed');
        document.getElementById('mpesa-confirmation').style.display = 'none';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-money-bill-wave"></i> Deposit via M-Pesa';
    }
}

// Simplified payment status check
async function checkPaymentStatus(checkoutId) {
    return new Promise((resolve) => {
        // In real implementation, you would poll your backend
        // which would check the M-Pesa callback
        setTimeout(resolve, 45000); // Simulate 45 sec wait
    });
}
