// Get DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const statusDiv = document.getElementById('status');
const imageCount = document.getElementById('imageCount');
const pdfNameInput = document.getElementById('pdfName');
const pageSizeSelect = document.getElementById('pageSize');
const orientationSelect = document.getElementById('orientation');
const imageQualitySelect = document.getElementById('imageQuality');
const contentList = document.getElementById('contentList');

let contentItems = [];

// Upload area click event
uploadArea.addEventListener('click', () => fileInput.click());

// Drag and drop events
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    handleFiles(files);
});

// File input change event
fileInput.addEventListener('change', (e) => {
    handleFiles(Array.from(e.target.files));
});

// Handle uploaded files
function handleFiles(files) {
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            contentItems.push({
                type: 'image',
                data: e.target.result,
                name: file.name
            });
            updateContentList();
            updateButtons();
            updateImageCount();
        };
        reader.readAsDataURL(file);
    });
}

// Update content list display
function updateContentList() {
    contentList.innerHTML = '';
    
    contentItems.forEach((item, index) => {
        const contentItem = document.createElement('div');
        contentItem.className = 'content-item';
        
        contentItem.innerHTML = `
            <img src="${item.data}" class="content-image-thumb" alt="Image">
            <div class="content-info">
                <div class="content-name">${item.name}</div>
                <div class="content-order">
                    ${index > 0 ? `<button class="order-btn" onclick="moveContent(${index}, -1)">⬆️ Up</button>` : ''}
                    ${index < contentItems.length - 1 ? `<button class="order-btn" onclick="moveContent(${index}, 1)">⬇️ Down</button>` : ''}
                </div>
            </div>
            <button class="content-remove" onclick="removeContent(${index})">×</button>
        `;
        
        contentList.appendChild(contentItem);
    });
}

// Remove content item
window.removeContent = function(index) {
    contentItems.splice(index, 1);
    updateContentList();
    updateButtons();
    updateImageCount();
};

// Move content item
window.moveContent = function(index, direction) {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < contentItems.length) {
        [contentItems[index], contentItems[newIndex]] = [contentItems[newIndex], contentItems[index]];
        updateContentList();
    }
};

// Update button states
function updateButtons() {
    const hasContent = contentItems.length > 0;
    convertBtn.disabled = !hasContent;
    clearBtn.disabled = !hasContent;
}

// Update image count display
function updateImageCount() {
    const imageCountNum = contentItems.length;
    
    if (imageCountNum > 0) {
        imageCount.textContent = `${imageCountNum} image${imageCountNum > 1 ? 's' : ''} 🎀`;
    } else {
        imageCount.textContent = '';
    }
}

// Clear button event
clearBtn.addEventListener('click', () => {
    contentItems = [];
    updateContentList();
    updateButtons();
    updateImageCount();
    statusDiv.innerHTML = '<div class="status info">✨ All content cleared!</div>';
    setTimeout(() => {
        statusDiv.innerHTML = '';
    }, 2000);
});

// Convert to PDF button event
convertBtn.addEventListener('click', async () => {
    if (contentItems.length === 0) return;

    try {
        statusDiv.innerHTML = '<div class="status info">💫 Converting to PDF...</div>';
        convertBtn.disabled = true;
        clearBtn.disabled = true;

        const { jsPDF } = window.jspdf;
        const pageSize = pageSizeSelect.value;
        const orientation = orientationSelect.value;
        const pdf = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: pageSize
        });
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const usableWidth = pageWidth - (2 * margin);
        let currentY = margin;
        let isFirstPage = true;
        
        for (let i = 0; i < contentItems.length; i++) {
            const item = contentItems[i];
            
            const img = new Image();
            img.src = item.data;
            
            await new Promise((resolve) => {
                img.onload = () => {
                    const imgRatio = img.width / img.height;
                    let imgWidth = usableWidth;
                    let imgHeight = imgWidth / imgRatio;
                    
                    if (imgHeight > pageHeight - (2 * margin)) {
                        imgHeight = pageHeight - (2 * margin);
                        imgWidth = imgHeight * imgRatio;
                    }
                    
                    if (currentY + imgHeight > pageHeight - margin && !isFirstPage) {
                        pdf.addPage();
                        currentY = margin;
                    }
                    
                    pdf.addImage(item.data, 'JPEG', margin, currentY, imgWidth, imgHeight);
                    currentY += imgHeight + 10;
                    isFirstPage = false;
                    resolve();
                };
            });
        }
        
        const pdfName = pdfNameInput.value.trim() || 'my-lovely-pdf';
        pdf.save(`${pdfName}.pdf`);
        statusDiv.innerHTML = '<div class="status success">💖 PDF created successfully! Download started! 💖</div>';
        
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 4000);
        
    } catch (error) {
        console.error(error);
        statusDiv.innerHTML = '<div class="status error">😢 Error creating PDF. Please try again.</div>';
    } finally {
        convertBtn.disabled = false;
        clearBtn.disabled = false;
    }
});