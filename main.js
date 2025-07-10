// 預約規則設定
const BOOKING_RULES = {
    daysAhead: 7,
    excludeDays: [0], // 0 = 星期日
    morningSlots: ['8:00', '8:30', '9:00', '9:30', '10:00', '10:30', '11:00'],
    afternoonSlots: ['1:30', '2:00', '2:30', '3:00', '3:30', '4:00', '4:30'],
    saturdayOnlyMorning: true // 星期六只能預約上午
};

let liffInitialized = false;
let userProfile = null;

// ========== Modal 功能 ==========
function showInfoModal() {
    const modal = document.getElementById('infoModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideInfoModal() {
    const modal = document.getElementById('infoModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

function callPhone(number) {
    window.location.href = `tel:${number}`;
}

function openMap() {
    const address = encodeURIComponent('360苗栗縣苗栗市國華路91號');
    window.open(`https://maps.google.com/maps?q=${address}`, '_blank');
}

// ========== LIFF 功能 ==========
// 初始化 LIFF
async function initializeLiff() {
    try {
        const loadingEl = document.getElementById('loading');
        loadingEl.classList.add('show');

        await liff.init({
            liffId: '2007724265-YJ80zrNX' // 替換為你的 LIFF ID
        });

        liffInitialized = true;

        if (liff.isLoggedIn()) {
            userProfile = await liff.getProfile();
            displayUserInfo();
            initializeForm();
        } else {
            liff.login();
        }

    } catch (error) {
        console.error('LIFF 初始化失敗:', error);
        showError('系統初始化失敗，請重新整理頁面或聯繫客服');
    } finally {
        document.getElementById('loading').classList.remove('show');
    }
}

// 顯示使用者資訊
function displayUserInfo() {
    if (userProfile) {
        document.getElementById('displayName').textContent = `姓名: ${userProfile.displayName}`;
        document.getElementById('userId').textContent = `ID: ${userProfile.userId}`;
        document.getElementById('userInfo').style.display = 'block';
        document.getElementById('name').value = userProfile.displayName;
    }
}

// 初始化表單
function initializeForm() {
    generateDateOptions();
    setupEventListeners();
    document.getElementById('bookingForm').style.display = 'block';
}

// ========== 預約表單功能 ==========
// 生成日期選項
function generateDateOptions() {
    const dateSelect = document.getElementById('date');
    const today = new Date();

    dateSelect.innerHTML = '<option value="">請選擇日期</option>';

    for (let i = 0; i < BOOKING_RULES.daysAhead; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        if (BOOKING_RULES.excludeDays.includes(date.getDay())) continue;

        const dateStr = date.toISOString().split('T')[0];
        const displayStr = formatDateDisplay(date);

        const option = document.createElement('option');
        option.value = dateStr;
        option.textContent = displayStr;
        dateSelect.appendChild(option);
    }
}

// 格式化日期
function formatDateDisplay(date) {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`;
}

// 生成時段選項
function generateTimeOptions(selectedDate) {
    const timeSelect = document.getElementById('time');
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();

    timeSelect.innerHTML = '<option value="">請選擇時段</option>';

    let availableSlots = [];

    if (dayOfWeek === 6 && BOOKING_RULES.saturdayOnlyMorning) {
        availableSlots = [...BOOKING_RULES.morningSlots];
    } else {
        availableSlots = [...BOOKING_RULES.morningSlots, ...BOOKING_RULES.afternoonSlots];
    }

    availableSlots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot;
        option.textContent = slot;
        timeSelect.appendChild(option);
    });
}

// 表單事件
function setupEventListeners() {
    document.getElementById('date').addEventListener('change', function () {
        const selectedDate = this.value;
        if (selectedDate) {
            generateTimeOptions(selectedDate);
        } else {
            document.getElementById('time').innerHTML = '<option value="">請先選擇日期</option>';
        }
    });

    document.getElementById('bookingForm').addEventListener('submit', handleFormSubmit);
}

// 表單提交
async function handleFormSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const bookingData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        plate: formData.get('plate'),
        date: formData.get('date'),
        time: formData.get('time'),
        serviceType: formData.get('serviceType'),
        note: formData.get('note') || '',
        userId: userProfile ? userProfile.userId : '',
        displayName: userProfile ? userProfile.displayName : '',
        createdAt: new Date().toISOString()
    };

    try {
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = '提交中...';

        const response = await fetch('YOUR_GAS_ENDPOINT_URL', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });

        if (response.ok) {
            showSuccess('預約成功！我們將盡快為您安排服務。');
            document.getElementById('bookingForm').reset();
            generateDateOptions();

            setTimeout(() => {
                if (liff.isInClient()) liff.closeWindow();
            }, 3000);
        } else {
            throw new Error('預約失敗');
        }

    } catch (error) {
        console.error('提交失敗:', error);
        showError('預約失敗，請稍後再試或聯繫客服');
    } finally {
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.disabled = false;
        submitBtn.textContent = '📝 確認預約';
    }
}

// ========== 訊息顯示功能 ==========
// 顯示錯誤訊息
function showError(message) {
    const el = document.getElementById('errorMessage');
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
}

// 顯示成功訊息
function showSuccess(message) {
    const el = document.getElementById('successMessage');
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 5000);
}

// ========== 頁面初始化 ==========
// 頁面載入完成時初始化
window.addEventListener('load', function() {
    // 初始化 LIFF
    initializeLiff();
    
    // 設定 Modal 事件監聽器
    setupModalEventListeners();
});

// 設定 Modal 事件監聽器
function setupModalEventListeners() {
    // 點擊遮罩關閉 Modal
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideInfoModal();
            }
        });
    }

    // ESC 鍵關閉 Modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideInfoModal();
        }
    });
}