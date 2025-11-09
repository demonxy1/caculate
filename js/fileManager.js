class FileManager {
    constructor() {
        this.basePath = 'saves/';
        this.init();
    }

    init() {
        this.loadFileList();
    }

    async loadFileList() {
        try {
            // ใน GitHub Pages เราสามารถใช้ GitHub API เพื่อดึงรายการไฟล์
            // หรือใช้วิธีจำลองไฟล์ระบบผ่าน localStorage
            const fileList = this.getSavedFiles();
            this.updateFileListUI(fileList);
        } catch (error) {
            console.error('Error loading file list:', error);
            this.showError('ไม่สามารถโหลดรายการไฟล์ได้');
        }
    }

    getSavedFiles() {
        // จำลองการดึงรายการไฟล์จาก localStorage
        const files = JSON.parse(localStorage.getItem('financeFiles') || '{}');
        return Object.keys(files).map(filename => ({
            name: filename,
            lastModified: files[filename].lastModified,
            size: files[filename].size
        }));
    }

    updateFileListUI(files) {
        const container = document.getElementById('file-list');
        
        if (files.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 2rem;">📁</div>
                    <p>ยังไม่มีไฟล์ที่บันทึกไว้</p>
                </div>
            `;
            return;
        }

        container.innerHTML = files.map(file => `
            <div class="file-item" data-filename="${file.name}">
                <div class="file-info">
                    <strong>${file.name}</strong>
                    <div class="file-meta">
                        <small>แก้ไขล่าสุด: ${new Date(file.lastModified).toLocaleDateString('th-TH')}</small>
                        <small>ขนาด: ${this.formatFileSize(file.size)}</small>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn-secondary" onclick="fileManager.loadFile('${file.name}')">
                        📂 เปิด
                    </button>
                    <button class="btn-danger" onclick="fileManager.deleteFile('${file.name}')">
                        🗑️ ลบ
                    </button>
                </div>
            </div>
        `).join('');
    }

    newFile() {
        const filename = document.getElementById('filename').value.trim() || 'บันทึกการเงิน';
        
        if (app.transactions.length > 0) {
            app.showConfirmModal(
                'สร้างไฟล์ใหม่',
                `คุณแน่ใจหรือไม่ที่จะสร้างไฟล์ใหม่ "${filename}"? ข้อมูลปัจจุบันจะถูกลบ`,
                () => {
                    app.transactions = [];
                    app.currentFile = filename;
                    app.saveData();
                    app.updateUI();
                    app.showAlert('success', `สร้างไฟล์ใหม่ "${filename}" เรียบร้อยแล้ว`);
                }
            );
        } else {
            app.currentFile = filename;
            app.saveData();
            app.updateUI();
            app.showAlert('success', `สร้างไฟล์ใหม่ "${filename}" เรียบร้อยแล้ว`);
        }
    }

    saveFile() {
        const filename = document.getElementById('filename').value.trim() || 'บันทึกการเงิน';
        app.currentFile = filename;
        app.saveData();

        // บันทึกลงใน "ไฟล์ระบบ" (localStorage)
        this.saveToFileSystem(filename, {
            transactions: app.transactions,
            metadata: {
                created: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                transactionCount: app.transactions.length
            }
        });

        app.showAlert('success', `บันทึกไฟล์ "${filename}.json" เรียบร้อยแล้ว`);
        this.loadFileList();
    }

    saveToFileSystem(filename, data) {
        const files = JSON.parse(localStorage.getItem('financeFiles') || '{}');
        
        files[filename] = {
            data: data,
            lastModified: new Date().toISOString(),
            size: JSON.stringify(data).length
        };
        
        localStorage.setItem('financeFiles', JSON.stringify(files));
    }

    loadFile(filename) {
        const files = JSON.parse(localStorage.getItem('financeFiles') || '{}');
        const fileData = files[filename];
        
        if (fileData) {
            app.transactions = fileData.data.transactions || [];
            app.currentFile = filename;
            document.getElementById('filename').value = filename;
            app.saveData();
            app.updateUI();
            app.showAlert('success', `โหลดไฟล์ "${filename}" เรียบร้อยแล้ว`);
        } else {
            app.showAlert('error', 'ไม่พบไฟล์ที่ต้องการ');
        }
    }

    deleteFile(filename) {
        app.showConfirmModal(
            'ลบไฟล์',
            `คุณแน่ใจหรือไม่ที่จะลบไฟล์ "${filename}"?`,
            () => {
                const files = JSON.parse(localStorage.getItem('financeFiles') || '{}');
                delete files[filename];
                localStorage.setItem('financeFiles', JSON.stringify(files));
                
                this.loadFileList();
                app.showAlert('success', `ลบไฟล์ "${filename}" เรียบร้อยแล้ว`);
            }
        );
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showError(message) {
        app.showAlert('error', message);
    }
}

// สร้าง instance ของ FileManager
const fileManager = new FileManager();