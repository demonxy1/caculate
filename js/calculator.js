class FinanceCalculator {
    constructor(transactions) {
        this.transactions = transactions;
    }

    calculateSummary() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const balance = totalIncome - totalExpense;

        return {
            totalIncome,
            totalExpense,
            balance
        };
    }

    getMonthlySummary() {
        const monthlyData = {};
        
        this.transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    income: 0,
                    expense: 0,
                    balance: 0
                };
            }
            
            if (transaction.type === 'income') {
                monthlyData[monthKey].income += transaction.amount;
            } else {
                monthlyData[monthKey].expense += transaction.amount;
            }
            
            monthlyData[monthKey].balance = monthlyData[monthKey].income - monthlyData[monthKey].expense;
        });
        
        return monthlyData;
    }

    getCategorySummary() {
        const categoryData = {};
        
        this.transactions.forEach(transaction => {
            if (!categoryData[transaction.category]) {
                categoryData[transaction.category] = {
                    income: 0,
                    expense: 0,
                    count: 0
                };
            }
            
            if (transaction.type === 'income') {
                categoryData[transaction.category].income += transaction.amount;
            } else {
                categoryData[transaction.category].expense += transaction.amount;
            }
            
            categoryData[transaction.category].count++;
        });
        
        return categoryData;
    }

    getRecentTransactions(limit = 10) {
        return [...this.transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    getTopExpenses(limit = 5) {
        return this.transactions
            .filter(t => t.type === 'expense')
            .sort((a, b) => b.amount - a.amount)
            .slice(0, limit);
    }
}