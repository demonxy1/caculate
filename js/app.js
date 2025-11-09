// ข้อมูลแอปพลิเคชัน
class FinanceApp {
    constructor() {
        this.transactions = [];
        this.currentFile = 'บันทึกการเงิน';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
        this.updateUI();
    }

    setupEventListeners() {
        // ฟอร์มบันทึกรายการ
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // ล้างฟอร์ม
        document.getElementById('clear-form').addEventListener('click', () => {
            this.clearForm();
        });

        // ล้างทั้งหมด
        document.getElementById('clear-all').addEventListener('click', () => {
            this.showConfirmModal(
                'ล้างรายการทั้งหมด',
                'คุณแน่ใจหรือไม่ที่จะล้างรายการทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้',
                () => this.clearAllTransactions()
            );
        });

        // ปุ่มใช้งานด่วน
        document.querySelectorAll('.btn-quick-income, .btn-quick-expense').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                const amount = parseFloat(e.target.dataset.amount);
                this.quickAddTransaction(type, amount);
            });
        });

        // จัดการไฟล์
        document.getElementById('new-file').addEventListener('click', () => {
            this.showConfirmModal(
                'สร้างไฟล์ใหม่',
                'คุณแน่ใจหรือไม่ที่จะสร้างไฟล์ใหม่? ข้อมูลปัจจุบันจะถูกลบ',
                () => fileManager.newFile()
            );
        });

        document.getElementById('save-file').addEventListener('click', () => {
            fileManager.saveFile();
        });

        document.getElementById('refresh-files').addEventListener('click', () => {
            fileManager.loadFileList();
        });

        // Modal
        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.hideModal();
        });

        // อัพเดตชื่อไฟล์
        document.getElementById('filename').addEventListener('change', (e) => {
            this.currentFile = e.target.value.trim() || 'บันทึกการเงิน';
            this.saveData();
        });

        // บันทึกอัตโนมัติเมื่อเปลี่ยนข้อมูล
        document.getElementById('filename').addEventListener('input', this.debounce(() => {
            this.currentFile = document.getElementById('filename').value.trim() || 'บันทึกการเงิน';
            this.saveData();
        }, 1000));
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    loadData() {
        const savedData = localStorage.getItem('financeData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.transactions = data.transactions || [];
                this.currentFile = data.currentFile || 'บันทึกการเงิน';
                document.getElementById('filename').value = this.currentFile;
            } catch (error) {
                console.error('Error loading data:', error);
                this.transactions = [];
                this.currentFile = 'บันทึกการเงิน';
            }
        }
    }

    saveData() {
        const data = {
            transactions: this.transactions,
            currentFile: this.currentFile,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('financeData', JSON.stringify(data));
    }

    addTransaction() {
        const type = document.getElementById('type').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const description = document.getElementById('description').value.trim();
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;

        if (!description || isNaN(amount) || amount <= 0) {
            this.showAlert('error', 'กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
            return;
        }

        const transaction = {
            id: Date.now() + Math.random(),
            type,
            amount,
            description,
            category,
            date,
            createdAt: new Date().toISOString()
        };

        this.transactions.push(transaction);
        this.saveData();
        this.updateUI();
        this.clearForm();
        
        this.showAlert('success', 'บันทึกรายการเรียบร้อยแล้ว!');
    }

    quickAddTransaction(type, amount) {
        const descriptions = {
            income: {
                salary: 'เงินเดือน',
                other: 'รายรับอื่นๆ'
            },
            expense: {
                food: 'ค่าอาหาร',
                transport: 'ค่าขนส่ง',
                shopping: 'ช้อปปิ้ง',
                bills: 'ค่าบิล',
                entertainment: 'บันเทิง',
                other: 'รายจ่ายอื่นๆ'
            }
        };

        const defaultDescription = type === 'income' ? 'รายรับ' : 'รายจ่าย';
        
        // ตั้งค่าฟอร์ม
        document.getElementById('type').value = type;
        document.getElementById('amount').value = amount;
        document.getElementById('description').value = defaultDescription;
        document.getElementById('date').valueAsDate = new Date();
        
        // โฟกัสไปที่ปุ่มบันทึก
        document.querySelector('button[type="submit"]').focus();
    }

    clearForm() {
        document.getElementById('transaction-form').reset();
        document.getElementById('date').valueAsDate = new Date();
        document.getElementById('description').focus();
    }

    clearAllTransactions() {
        this.transactions = [];
        this.saveData();
        this.updateUI();
        this.showAlert('success', 'ล้างรายการทั้งหมดเรียบร้อยแล้ว');
        this.hideModal();
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveData();
        this.updateUI();
        this.showAlert('success', 'ลบรายการเรียบร้อยแล้ว');
    }

    updateUI() {
        this.updateSummary();
        this.updateTransactionList();
        this.updateCurrentFile();
    }

    updateSummary() {
        const calculator = new FinanceCalculator(this.transactions);
        const summary = calculator.calculateSummary();

        document.getElementById('total-income').textContent = 
            this.formatCurrency(summary.totalIncome);
        document.getElementById('total-expense').textContent = 
            this.formatCurrency(summary.totalExpense);
        document.getElementById('balance').textContent = 
            this.formatCurrency(summary.balance);
    }

    updateTransactionList() {
        const container = document.getElementById('transaction-list');
        
        if (this.transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 3rem;">📊</div>
                    <h3>ยังไม่มีรายการ</h3>
                    <p>เริ่มบันทึกรายการแรกของคุณเลย!</p>
                </div>
            `;
            return;
        }

        // เรียงลำดับรายการจากล่าสุดไปเก่าสุด
        const sortedTransactions = [...this.transactions].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        container.innerHTML = sortedTransactions.map(transaction => `
            <div class="transaction-item" data-id="${transaction.id}">
                <div class="transaction-info">
                    <div class="transaction-description">
                        ${transaction.description}
                    </div>
                    <div class="transaction-meta">
                        <span class="transaction-category">
                            ${this.getCategoryIcon(transaction.category)} ${this.getCategoryName(transaction.category)}
                        </span>
                        <span class="transaction-date">
                            ${this.formatDate(transaction.date)}
                        </span>
                    </div>
                </div>
                <div class="transaction-amount ${transaction.type}-text">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </div>
            </div>
        `).join('');

        // เพิ่ม event listeners สำหรับการลบ
        container.querySelectorAll('.transaction-item').forEach(item => {
            item.addEventListener('dblclick', () => {
                const id = parseFloat(item.dataset.id);
                this.showConfirmModal(
                    'ลบรายการ',
                    'คุณแน่ใจหรือไม่ที่จะลบรายการนี้?',
                    () => this.deleteTransaction(id)
                );
            });
        });
    }

    updateCurrentFile() {
        document.getElementById('current-filename').textContent = 
            `${this.currentFile}.json`;
    }

    getCategoryIcon(category) {
        const icons = {
            salary: '💰',
            food: '🍽️',
            transport: '🚗',
            shopping: '🛍️',
            bills: '📄',
            entertainment: '🎮',
            other: '📌'
        };
        return icons[category] || '📌';
    }

    getCategoryName(category) {
        const names = {
            salary: 'เงินเดือน',
            food: 'อาหาร',
            transport: 'การเดินทาง',
            shopping: 'ช้อปปิ้ง',
            bills: 'ค่าบิล',
            entertainment: 'บันเทิง',
            other: 'อื่นๆ'
        };
        return names[category] || 'อื่นๆ';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatCurrency(amount) {
        return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' บาท';
    }

    showConfirmModal(title, message, confirmCallback) {
        document.getElementById('modal-message').textContent = message;
        document.querySelector('.modal-content h3').textContent = title;
        
        const confirmBtn = document.getElementById('modal-confirm');
        confirmBtn.onclick = confirmCallback;
        
        this.showModal();
    }

    showModal() {
        document.getElementById('confirm-modal').classList.add('show');
    }

    hideModal() {
        document.getElementById('confirm-modal').classList.remove('show');
    }

    showAlert(type, message) {
        // สร้าง alert element ชั่วคราว
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;

        if (type === 'success') {
            alert.style.background = 'linear-gradient(135deg, var(--primary), var(--primary-dark))';
        } else {
            alert.style.background = 'linear-gradient(135deg, var(--danger), var(--danger-dark))';
        }

        document.body.appendChild(alert);

        // ลบ alert หลังจาก 3 วินาที
        setTimeout(() => {
            alert.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        }, 3000);
    }
}

// เริ่มต้นแอปพลิเคชัน
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new FinanceApp();
    
    // ตั้งค่าวันที่เป็นวันนี้
    document.getElementById('date').valueAsDate = new Date());
    
    // เพิ่ม CSS สำหรับ animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});