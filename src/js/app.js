// RedVelvet Platform - Главный файл приложения

// ==================== СОСТОЯНИЕ ПРИЛОЖЕНИЯ ====================
const AppState = {
    currentUser: null, // { email, type: 'client'|'model', wallet: null }
    currentProfile: null, // Профиль модели (если type === 'model')
    profiles: [], // Все анкеты моделей
    reviews: {}, // Отзывы по анкетам { profileId: [reviews] }
    currentProfileView: null, // ID текущего просматриваемого профиля
    selectedReviewRating: 0,
    mediaFiles: [], // Загруженные медиа файлы
    inModelCreationMode: false, // Флаг для отслеживания режима создания/редактирования анкеты
    profilePaymentStatus: null // Статус оплаты анкеты: null, 'basic', 'premium', 'vip'
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    initializeSampleProfiles(); // Включено для тестирования
    updateNavigation();
    showHomeInterface(); // Показываем главную страницу при загрузке
    updateServiceFilter();

    // Инициализация фильтров
    const headerWrapper = document.querySelector('.filters-header-wrapper');
    if (headerWrapper) {
        headerWrapper.classList.add('expanded'); // Изначально фильтры развернуты
    }

    // Обработчик клика по логотипу
    document.querySelector('.logo').addEventListener('click', () => {
        showHomeInterface();
    });
});

// ==================== ЗАГРУЗКА И СОХРАНЕНИЕ ДАННЫХ ====================
function loadFromLocalStorage() {
    const savedUser = localStorage.getItem('redvelvet_user');
    const savedProfile = localStorage.getItem('redvelvet_profile');
    const savedProfiles = localStorage.getItem('redvelvet_profiles');
    const savedReviews = localStorage.getItem('redvelvet_reviews');
    const savedPaymentStatus = localStorage.getItem('redvelvet_payment_status');

    if (savedUser) AppState.currentUser = JSON.parse(savedUser);
    if (savedProfile) AppState.currentProfile = JSON.parse(savedProfile);
    if (savedProfiles) AppState.profiles = JSON.parse(savedProfiles);
    if (savedReviews) AppState.reviews = JSON.parse(savedReviews);
    if (savedPaymentStatus) AppState.profilePaymentStatus = savedPaymentStatus;
}

function saveToLocalStorage() {
    if (AppState.currentUser) {
        localStorage.setItem('redvelvet_user', JSON.stringify(AppState.currentUser));
    }
    if (AppState.currentProfile) {
        localStorage.setItem('redvelvet_profile', JSON.stringify(AppState.currentProfile));
    }
    localStorage.setItem('redvelvet_profiles', JSON.stringify(AppState.profiles));
    localStorage.setItem('redvelvet_reviews', JSON.stringify(AppState.reviews));
    if (AppState.profilePaymentStatus) {
        localStorage.setItem('redvelvet_payment_status', AppState.profilePaymentStatus);
    }
}

// ==================== TOAST УВЕДОМЛЕНИЯ ====================
function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const titles = {
        'success': '✓ Успешно',
        'error': '✗ Ошибка',
        'info': 'ℹ Информация',
        'warning': '⚠ Внимание'
    };

    toast.innerHTML = `
        <div class="toast-header">${titles[type] || titles['info']}</div>
        <div class="toast-body">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Автоматическое удаление через duration
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showConfirm(message, onConfirm, onCancel) {
    // Создаем кастомный диалог подтверждения
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.zIndex = '10001';

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <h2 style="margin-bottom: 20px;">Подтверждение</h2>
            <p style="color: var(--text-gray); line-height: 1.6; white-space: pre-line; margin-bottom: 30px;">${message}</p>
            <div style="display: flex; gap: 15px; justify-content: flex-end;">
                <button class="btn btn-outline cancel-btn" style="min-width: 120px;">Отмена</button>
                <button class="btn btn-primary confirm-btn" style="min-width: 120px;">ОК</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Привязываем обработчики
    const confirmBtn = modal.querySelector('.confirm-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');

    confirmBtn.onclick = () => {
        modal.remove();
        if (onConfirm) onConfirm();
    };

    cancelBtn.onclick = () => {
        modal.remove();
        if (onCancel) onCancel();
    };

    // Закрытие по клику вне модального окна
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
            if (onCancel) onCancel();
        }
    };
}

// ==================== НАВИГАЦИЯ И ИНТЕРФЕЙС ====================
function updateNavigation() {
    const nav = document.getElementById('mainNav');
    nav.innerHTML = '';

    // Если в режиме создания/редактирования анкеты
    if (AppState.inModelCreationMode) {
        // Проверяем наличие созданной анкеты
        const hasProfile = AppState.currentProfile !== null;

        if (!hasProfile) {
            // Анкета не создана: показываем только "Главное меню"
            nav.innerHTML = `
                <button class="btn btn-outline" onclick="goToMainMenu()">Главное меню</button>
            `;
            return;
        }

        // Проверяем статус оплаты анкеты
        const isPaid = AppState.profilePaymentStatus !== null;

        if (isPaid) {
            // Тариф куплен: показываем "Сменить тариф" + "Главное меню"
            nav.innerHTML = `
                <button class="btn btn-outline" onclick="showPricingModal()">Сменить тариф</button>
                <button class="btn btn-outline" onclick="goToMainMenu()">Главное меню</button>
            `;
        } else {
            // Тариф не куплен: показываем "Оплатить анкету" + "Главное меню"
            nav.innerHTML = `
                <button class="btn btn-outline" onclick="showPricingModal()">Оплатить анкету</button>
                <button class="btn btn-outline" onclick="goToMainMenu()">Главное меню</button>
            `;
        }
        return;
    }

    if (!AppState.currentUser) {
        // Гость: показываем Регистрация для клиентов и Создать/Моя анкету для моделей
        let modelButtonText = 'Создать анкету модели';
        if (AppState.currentProfile) {
            // Если есть профиль, проверяем статус оплаты
            modelButtonText = AppState.profilePaymentStatus ? 'Моя анкета' : 'Оплата анкеты';
        }
        nav.innerHTML = `
            <button class="btn btn-outline" onclick="showRegister()">Регистрация клиента</button>
            <button class="btn btn-outline" onclick="showModelInterface()">${modelButtonText}</button>
        `;
    } else if (AppState.currentUser.type === 'client') {
        // Клиент: показываем Мой профиль и Выход
        nav.innerHTML = `
            <button class="btn btn-outline" onclick="showClientDashboard()">Мой профиль</button>
            <button class="btn btn-outline" onclick="logout()">Выход</button>
        `;
    } else if (AppState.currentUser.type === 'model') {
        // Модель: показываем кнопку в зависимости от статуса оплаты
        const modelButtonText = AppState.profilePaymentStatus ? 'Моя анкета' : 'Оплата анкеты';
        nav.innerHTML = `
            <button class="btn btn-outline" onclick="showModelInterface()">${modelButtonText}</button>
            <button class="btn btn-outline" onclick="logout()">Выход</button>
        `;
    }
}

// Функция возврата в главное меню
function goToMainMenu() {
    AppState.inModelCreationMode = false;
    updateNavigation();
    showHomeInterface();
}

function showHomeInterface() {
    AppState.inModelCreationMode = false;
    document.getElementById('homeInterface').classList.remove('hidden');
    document.getElementById('clientInterface').classList.add('hidden');
    document.getElementById('clientDashboard').classList.add('hidden');
    document.getElementById('modelInterface').classList.add('hidden');
    updateNavigation();
    renderHomeProfiles();
}

function showClientInterface() {
    AppState.inModelCreationMode = false;
    document.getElementById('homeInterface').classList.add('hidden');
    document.getElementById('clientInterface').classList.remove('hidden');
    document.getElementById('clientDashboard').classList.add('hidden');
    document.getElementById('modelInterface').classList.add('hidden');
    updateNavigation();
    renderProfiles();
}

function showClientDashboard() {
    AppState.inModelCreationMode = false;
    document.getElementById('homeInterface').classList.add('hidden');
    document.getElementById('clientInterface').classList.add('hidden');
    document.getElementById('clientDashboard').classList.remove('hidden');
    document.getElementById('modelInterface').classList.add('hidden');
    updateNavigation();
    updateClientDashboard();
}

function showModelInterface() {
    AppState.inModelCreationMode = true;
    document.getElementById('homeInterface').classList.add('hidden');
    document.getElementById('clientInterface').classList.add('hidden');
    document.getElementById('clientDashboard').classList.add('hidden');
    document.getElementById('modelInterface').classList.remove('hidden');

    if (AppState.currentProfile) {
        // Загружаем существующую анкету
        loadProfileToForm();
        document.getElementById('profileFormTitle').textContent = 'Редактировать анкету';
        document.getElementById('modelDashboardTitle').textContent = 'Статистика анкеты';
        updateModelStats();
    } else {
        // Создание новой анкеты
        clearProfileForm();
        document.getElementById('profileFormTitle').textContent = 'Создать анкету модели';
        document.getElementById('modelDashboardTitle').textContent = 'Новая анкета';
    }

    // Показываем кошелек только если пользователь авторизован
    if (AppState.currentUser && AppState.currentUser.type === 'model') {
        updateWalletDisplay('model');
    }

    updateNavigation();
}

function updateClientDashboard() {
    updateWalletDisplay('client');
    // TODO: Обновить избранные анкеты и историю отзывов
}

function updateModelStats() {
    if (!AppState.currentProfile) return;

    const profileIndex = AppState.profiles.findIndex(p => p.id === AppState.currentProfile.id);
    if (profileIndex === -1) return;

    const profile = AppState.profiles[profileIndex];
    const reviews = AppState.reviews[profile.id] || [];

    document.getElementById('viewsCount').textContent = profile.views || 0;
    document.getElementById('ratingValue').textContent = profile.rating ? profile.rating.toFixed(1) : '0.0';
    document.getElementById('reviewsCount').textContent = reviews.length;

    // Позиция в рейтинге
    const sortedProfiles = [...AppState.profiles].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const rank = sortedProfiles.findIndex(p => p.id === profile.id) + 1;
    document.getElementById('rankPosition').textContent = rank > 0 ? rank : '-';
}

// ==================== МОДАЛЬНЫЕ ОКНА ====================
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function showRegister() {
    showModal('registerModal');
}

function showLogin() {
    showModal('loginModal');
}


function showWalletModal() {
    showModal('walletModal');
}

// ==================== РЕГИСТРАЦИЯ И ВХОД ====================
function handleRegister(event) {
    event.preventDefault();

    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

    if (password !== passwordConfirm) {
        alert('Пароли не совпадают');
        return;
    }

    // Регистрация только для клиентов
    AppState.currentUser = {
        email: email,
        type: 'client',
        wallet: null
    };

    saveToLocalStorage();
    closeModal('registerModal');
    updateNavigation();
    showHomeInterface();

    alert('Регистрация клиента успешна!');
}

function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // TODO: Временное решение - просто загружаем сохраненного пользователя
    const savedUser = localStorage.getItem('redvelvet_user');
    if (savedUser) {
        AppState.currentUser = JSON.parse(savedUser);
        closeModal('loginModal');
        updateNavigation();

        if (AppState.currentUser.type === 'model') {
            showModelInterface();
        } else {
            showHomeInterface();
        }

        alert('Вход выполнен успешно!');
    } else {
        alert('Пользователь не найден. Пожалуйста, зарегистрируйтесь.');
    }
}

function logout() {
    // Сохраняем профили и отзывы, но удаляем пользователя
    localStorage.removeItem('redvelvet_user');
    localStorage.removeItem('redvelvet_profile');
    localStorage.removeItem('redvelvet_payment_status');
    AppState.currentUser = null;
    AppState.currentProfile = null;
    AppState.mediaFiles = [];
    AppState.profilePaymentStatus = null;

    updateNavigation();
    showHomeInterface();
}

// ==================== КОШЕЛЕК ====================
function handleWalletLink(event) {
    event.preventDefault();

    const walletType = document.getElementById('walletType').value;
    const walletNetwork = document.getElementById('walletNetwork').value;
    const walletAddress = document.getElementById('walletAddress').value;

    // Если пользователь не авторизован (гость-модель), создаем временного пользователя типа 'model'
    if (!AppState.currentUser) {
        AppState.currentUser = {
            email: `model_${Date.now()}@temporary.local`,
            type: 'model',
            wallet: null
        };
    }

    AppState.currentUser.wallet = {
        type: walletType,
        network: walletNetwork,
        address: walletAddress
    };

    saveToLocalStorage();
    closeModal('walletModal');

    if (AppState.currentUser.type === 'model') {
        updateWalletDisplay('model');
    } else {
        updateWalletDisplay('client');
    }

    showToast('Кошелек успешно привязан!', 'success', 4000);
}

function handleWalletUnlink() {
    showConfirm('Вы уверены, что хотите отвязать кошелек?', () => {
        if (AppState.currentUser) {
            AppState.currentUser.wallet = null;
            saveToLocalStorage();

            if (AppState.currentUser.type === 'model') {
                updateWalletDisplay('model');
            } else {
                updateWalletDisplay('client');
            }

            showToast('Кошелек успешно отвязан', 'success', 3000);
        }
    });
}

function updateWalletDisplay(userType) {
    const walletInfo = document.getElementById(userType === 'model' ? 'modelWalletInfo' : 'clientWalletInfo');

    if (!walletInfo) return;

    if (!AppState.currentUser || !AppState.currentUser.wallet) {
        walletInfo.innerHTML = `
            <div style="text-align: center; padding: 20px; background: rgba(255, 255, 255, 0.03); border-radius: 8px; border: 1px solid var(--border-gray);">
                <div style="font-size: 48px; margin-bottom: 10px; opacity: 0.5;">💳</div>
                <h3 style="color: var(--text-gray); font-size: 16px; margin-bottom: 5px;">Кошелек не привязан</h3>
                <p style="color: var(--text-gray); font-size: 14px; opacity: 0.7;">Привяжите криптокошелек для получения платежей</p>
            </div>
        `;
    } else {
        const wallet = AppState.currentUser.wallet;
        const shortAddress = wallet.address.substring(0, 8) + '...' + wallet.address.substring(wallet.address.length - 6);

        walletInfo.innerHTML = `
            <div style="padding: 20px; background: linear-gradient(135deg, rgba(255, 107, 0, 0.1) 0%, rgba(255, 107, 0, 0.05) 100%); border-radius: 8px; border: 1px solid rgba(255, 107, 0, 0.3);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="font-size: 32px;">✓</div>
                        <div>
                            <h3 style="font-size: 18px; color: var(--primary-orange); margin: 0;">Кошелек привязан</h3>
                            <p style="font-size: 12px; color: var(--text-gray); margin: 5px 0 0 0;">Вы можете получать платежи</p>
                        </div>
                    </div>
                </div>
                <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 6px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--text-gray); font-size: 13px;">Тип:</span>
                        <span style="color: var(--text-white); font-weight: 500;">${wallet.type}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--text-gray); font-size: 13px;">Сеть:</span>
                        <span style="color: var(--text-white); font-weight: 500;">${wallet.network}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--text-gray); font-size: 13px;">Адрес:</span>
                        <span style="color: var(--text-white); font-family: monospace; font-size: 12px;">${shortAddress}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Обновляем кнопки кошелька
    updateWalletButtons(userType);
}

function updateWalletButtons(userType) {
    const actionsContainer = userType === 'model'
        ? document.querySelector('#modelInterface .dashboard-actions')
        : document.querySelector('#clientDashboard .dashboard-actions');

    if (!actionsContainer) return;

    const hasWallet = AppState.currentUser && AppState.currentUser.wallet;

    if (hasWallet) {
        // Кошелек привязан: показываем кнопку "Отвязать кошелек"
        actionsContainer.innerHTML = `
            <button class="btn btn-outline" onclick="handleWalletUnlink()">Отвязать кошелек</button>
        `;
    } else {
        // Кошелек не привязан: показываем кнопку "Привязать криптокошелек"
        actionsContainer.innerHTML = `
            <button class="btn btn-outline" onclick="showWalletModal()">Привязать криптокошелек</button>
        `;
    }

    // Для клиентов добавляем кнопку "Выход" если она ранее была
    if (userType === 'client' && AppState.currentUser) {
        const logoutBtn = actionsContainer.querySelector('button[onclick="logout()"]');
        if (!logoutBtn) {
            actionsContainer.innerHTML += `
                <button class="btn btn-outline" onclick="logout()">Выход</button>
            `;
        }
    }
}

// ==================== СОЗДАНИЕ И РЕДАКТИРОВАНИЕ АНКЕТЫ ====================
function standardizeText(text) {
    // Стандартизация: первая буква заглавная
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function saveProfile(event) {
    event.preventDefault();

    // Собираем данные из формы
    const name = standardizeText(document.getElementById('profileName').value);
    const age = parseInt(document.getElementById('profileAge').value);
    const city = document.getElementById('profileCity').value;
    const height = parseInt(document.getElementById('profileHeight').value);
    const weight = parseInt(document.getElementById('profileWeight').value);
    const bustSize = document.getElementById('profileBustSize').value;
    const eyeColor = document.getElementById('profileEyeColor').value;
    const hairColor = document.getElementById('profileHairColor').value;
    const nationality = document.getElementById('profileNationality').value;
    const bodyType = document.getElementById('profileBodyType').value;
    const clothingSize = document.getElementById('profileClothingSize').value;
    const description = document.getElementById('profileDescription').value;
    const price = parseInt(document.getElementById('profilePrice').value);

    // Собираем выбранные услуги из чекбоксов и тумблеров
    const serviceCheckboxes = document.querySelectorAll('input[name="service"]:checked');
    const servicesArray = Array.from(serviceCheckboxes).map(cb => cb.value);

    // Убираем дубликаты с помощью Set
    const services = [...new Set(servicesArray)];

    if (services.length === 0) {
        alert('Выберите хотя бы одну услугу');
        return;
    }

    const profileData = {
        id: AppState.currentProfile ? AppState.currentProfile.id : Date.now(),
        name,
        age,
        city,
        height,
        weight,
        bustSize,
        eyeColor,
        hairColor,
        nationality,
        bodyType,
        clothingSize,
        description,
        services,
        price,
        images: AppState.mediaFiles.filter(f => f.type.startsWith('image')),
        videos: AppState.mediaFiles.filter(f => f.type.startsWith('video')),
        rating: AppState.currentProfile ? AppState.currentProfile.rating : 0,
        reviewCount: AppState.currentProfile ? AppState.currentProfile.reviewCount : 0,
        views: AppState.currentProfile ? AppState.currentProfile.views : 0,
        verified: true, // Автоматическое подтверждение для тестирования
        createdAt: AppState.currentProfile ? AppState.currentProfile.createdAt : new Date().toISOString()
    };

    if (AppState.currentProfile) {
        // Обновляем существующую анкету
        const index = AppState.profiles.findIndex(p => p.id === AppState.currentProfile.id);
        if (index !== -1) {
            AppState.profiles[index] = profileData;
        }
    } else {
        // Создаем новую анкету
        AppState.profiles.push(profileData);
    }

    AppState.currentProfile = profileData;
    saveToLocalStorage();
    updateServiceFilter();
    renderProfiles(); // Обновляем список профилей

    alert('Анкета успешно сохранена! Теперь она отображается на главной странице.');
    updateNavigation();

    // Переключаемся на главную страницу, чтобы показать анкету в списке
    showHomeInterface();
}

function loadProfileToForm() {
    if (!AppState.currentProfile) return;

    const p = AppState.currentProfile;

    document.getElementById('profileName').value = p.name;
    document.getElementById('profileAge').value = p.age;
    document.getElementById('profileCity').value = p.city;
    document.getElementById('profileHeight').value = p.height;
    document.getElementById('profileWeight').value = p.weight;
    document.getElementById('profileBustSize').value = p.bustSize;
    document.getElementById('profileEyeColor').value = p.eyeColor;
    document.getElementById('profileHairColor').value = p.hairColor;
    document.getElementById('profileNationality').value = p.nationality;
    document.getElementById('profileBodyType').value = p.bodyType;
    document.getElementById('profileClothingSize').value = p.clothingSize;
    document.getElementById('profileDescription').value = p.description;
    document.getElementById('profilePrice').value = p.price;

    // Устанавливаем чекбоксы и тумблеры услуг
    const allCheckboxes = document.querySelectorAll('input[name="service"]');
    allCheckboxes.forEach(cb => {
        cb.checked = p.services.includes(cb.value);
    });

    // Также устанавливаем тумблеры
    const allToggles = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
    allToggles.forEach(toggle => {
        toggle.checked = p.services.includes(toggle.value);
    });

    // Загружаем медиа файлы
    AppState.mediaFiles = [...(p.images || []), ...(p.videos || [])];
    renderMediaPreview();
}

function clearProfileForm() {
    // Очищаем все поля формы
    document.getElementById('profileName').value = '';
    document.getElementById('profileAge').value = '';
    document.getElementById('profileCity').value = '';
    document.getElementById('profileHeight').value = '';
    document.getElementById('profileWeight').value = '';
    document.getElementById('profileBustSize').value = '';
    document.getElementById('profileEyeColor').value = '';
    document.getElementById('profileHairColor').value = '';
    document.getElementById('profileNationality').value = '';
    document.getElementById('profileBodyType').value = '';
    document.getElementById('profileClothingSize').value = '';
    document.getElementById('profileDescription').value = '';
    document.getElementById('profilePrice').value = '';

    // Снимаем все чекбоксы и тумблеры
    const allCheckboxes = document.querySelectorAll('input[name="service"]');
    allCheckboxes.forEach(cb => {
        cb.checked = false;
    });

    const allToggles = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
    allToggles.forEach(toggle => {
        toggle.checked = false;
    });

    // Очищаем медиа
    AppState.mediaFiles = [];
    renderMediaPreview();
}

// ==================== МЕДИА ФАЙЛЫ ====================
function handleMediaUpload(event) {
    const files = Array.from(event.target.files);

    files.forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
            alert(`Файл ${file.name} превышает максимальный размер 10 МБ`);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            AppState.mediaFiles.push({
                type: file.type,
                data: e.target.result,
                name: file.name
            });
            renderMediaPreview();
        };
        reader.readAsDataURL(file);
    });
}

function renderMediaPreview() {
    const preview = document.getElementById('mediaPreview');
    preview.innerHTML = '';

    AppState.mediaFiles.forEach((file, index) => {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';

        if (file.type.startsWith('image')) {
            mediaItem.innerHTML = `
                <img src="${file.data}" alt="${file.name}">
                <button class="media-remove" onclick="removeMedia(${index})">×</button>
            `;
        } else if (file.type.startsWith('video')) {
            mediaItem.innerHTML = `
                <video src="${file.data}"></video>
                <button class="media-remove" onclick="removeMedia(${index})">×</button>
            `;
        }

        preview.appendChild(mediaItem);
    });
}

function removeMedia(index) {
    AppState.mediaFiles.splice(index, 1);
    renderMediaPreview();
}

// ==================== ОТОБРАЖЕНИЕ ПРОФИЛЕЙ ====================
function renderHomeProfiles() {
    const grid = document.getElementById('homeProfilesGrid');
    grid.innerHTML = '';

    const filteredProfiles = applyHomeFilters();

    if (filteredProfiles.length === 0) {
        grid.innerHTML = '<p class="no-data">Анкеты не найдены</p>';
        return;
    }

    filteredProfiles.forEach(profile => {
        const card = createProfileCard(profile);
        grid.appendChild(card);
    });
}

function renderProfiles() {
    const grid = document.getElementById('profilesGrid');
    grid.innerHTML = '';

    const filteredProfiles = applyFilters();

    if (filteredProfiles.length === 0) {
        grid.innerHTML = '<p class="no-data">Анкеты не найдены</p>';
        return;
    }

    filteredProfiles.forEach(profile => {
        const card = createProfileCard(profile);
        grid.appendChild(card);
    });
}

function createProfileCard(profile) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.onclick = () => openProfileModal(profile.id);

    const imageUrl = profile.images && profile.images.length > 0
        ? profile.images[0].data
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="400"%3E%3Crect fill="%231a1a1a" width="320" height="400"/%3E%3Ctext fill="%23cccccc" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="Arial" font-size="20"%3EФото%3C/text%3E%3C/svg%3E';

    const stars = generateStars(profile.rating || 0);

    card.innerHTML = `
        <div class="profile-image">
            <img src="${imageUrl}" alt="${profile.name}">
            ${profile.verified ? '<div class="profile-badge">✓ Проверено</div>' : ''}
        </div>
        <div class="profile-info">
            <div class="profile-name">${profile.name}, ${profile.age} лет</div>
            <div class="profile-stats">
                <div class="stat">
                    <span class="stat-label">Рост</span>
                    <span class="stat-value">${profile.height} см</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Грудь</span>
                    <span class="stat-value">${profile.bustSize}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Цена</span>
                    <span class="stat-value">${profile.price} ₽/ч</span>
                </div>
            </div>
            <div class="rating">
                ${stars}
                <span class="rating-count">(${profile.reviewCount || 0})</span>
            </div>
            <div class="profile-description">
                ${profile.description.substring(0, 100)}${profile.description.length > 100 ? '...' : ''}
            </div>
            <div class="profile-tags">
                ${profile.services.slice(0, 3).map(s => `<span class="tag">${s}</span>`).join('')}
            </div>
        </div>
    `;

    return card;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    let html = '';

    for (let i = 0; i < fullStars; i++) {
        html += '<span class="star filled">★</span>';
    }
    for (let i = 0; i < emptyStars; i++) {
        html += '<span class="star empty">★</span>';
    }

    return html;
}

// ==================== ДЕТАЛЬНЫЙ ПРОСМОТР ПРОФИЛЯ ====================
function openProfileModal(profileId) {
    const profile = AppState.profiles.find(p => p.id === profileId);
    if (!profile) return;

    // Увеличиваем счетчик просмотров
    profile.views = (profile.views || 0) + 1;
    saveToLocalStorage();

    AppState.currentProfileView = profileId;

    const modal = document.getElementById('profileModalContent');
    const reviews = AppState.reviews[profileId] || [];

    // Получаем город название
    const cityNames = {
        'moscow': 'Москва',
        'spb': 'Санкт-Петербург',
        'krasnodar': 'Краснодар',
        'sochi': 'Сочи',
        'ekaterinburg': 'Екатеринбург',
        'kazan': 'Казань'
    };

    modal.innerHTML = `
        <div class="profile-detail-header">
            <h2>${profile.name}, ${profile.age} лет</h2>
            <div class="rating">
                ${generateStars(profile.rating || 0)}
                <span class="rating-count">(${reviews.length} отзывов)</span>
            </div>
        </div>

        ${profile.images && profile.images.length > 0 ? `
            <div class="profile-detail-images">
                ${profile.images.map(img => `<img src="${img.data}" alt="${profile.name}">`).join('')}
            </div>
        ` : ''}

        <div class="profile-detail-info">
            <h3>Информация</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Город</div>
                    <div class="info-value">${cityNames[profile.city] || profile.city}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Рост</div>
                    <div class="info-value">${profile.height} см</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Вес</div>
                    <div class="info-value">${profile.weight} кг</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Размер груди</div>
                    <div class="info-value">${profile.bustSize}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Цвет глаз</div>
                    <div class="info-value">${profile.eyeColor}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Цвет волос</div>
                    <div class="info-value">${profile.hairColor}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Национальность</div>
                    <div class="info-value">${profile.nationality}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Фигура</div>
                    <div class="info-value">${profile.bodyType}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Размер одежды</div>
                    <div class="info-value">${profile.clothingSize}</div>
                </div>
            </div>
        </div>

        <div class="profile-detail-info">
            <h3>Описание</h3>
            <p style="color: var(--text-gray); line-height: 1.8;">${profile.description}</p>
        </div>

        <div class="profile-detail-info">
            <h3>Услуги</h3>
            <ul class="services-list">
                ${profile.services.map(s => `<li>${s}</li>`).join('')}
            </ul>
            <div class="info-item" style="margin-top: 20px;">
                <div class="info-label">Цена</div>
                <div class="info-value" style="font-size: 24px;">${profile.price} ₽/час</div>
            </div>
        </div>

        <div style="margin-top: 30px; display: flex; gap: 10px;">
            <button class="btn btn-outline" onclick="showPaymentModal()" style="flex: 1;">
                Забронировать
            </button>
            <button class="btn btn-outline" onclick="openReviewModal()" style="flex: 1;">
                Оставить отзыв
            </button>
        </div>

        <div class="reviews-section">
            <h3>Отзывы (${reviews.length})</h3>
            ${reviews.length > 0 ? reviews.map(review => `
                <div class="review-item">
                    <div class="review-header">
                        <div>
                            <div class="rating">
                                ${generateStars(review.rating)}
                            </div>
                        </div>
                        <span class="review-date">${new Date(review.date).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div class="review-text">${review.text}</div>
                </div>
            `).join('') : '<p class="no-data">Отзывов пока нет</p>'}
        </div>
    `;

    showModal('profileModal');
}

// ==================== ОПЛАТА ====================
function showPaymentModal() {
    closeModal('profileModal');
    showModal('paymentModal');
}

function selectPaymentMethod(method) {
    closeModal('paymentModal');

    if (method === 'crypto') {
        if (!AppState.currentUser) {
            alert('Для оплаты криптовалютой необходимо войти в аккаунт');
            showLogin();
            return;
        }

        const profile = AppState.profiles.find(p => p.id === AppState.currentProfileView);
        if (!profile) return;

        alert(`Оплата криптовалютой для ${profile.name}\n\nИнструкция:\n1. Перейдите в свой криптокошелек\n2. Отправьте ${profile.price} USDT на адрес модели\n3. Свяжитесь с моделью для подтверждения`);
    } else {
        alert('Свяжитесь с моделью для обсуждения условий оплаты по договоренности');
    }

    showModal('profileModal');
}

// ==================== ТАРИФЫ ОПЛАТЫ АНКЕТЫ ====================
function showPricingModal() {
    // Проверяем, создана ли анкета
    if (!AppState.currentProfile) {
        showToast('Сначала создайте анкету, затем выберите тариф для её размещения', 'warning', 5000);
        return;
    }
    showModal('pricingModal');
}

function selectPricingPlan(plan, price) {
    // Подтверждение выбора тарифа
    const planNames = {
        'basic': 'Стандарт',
        'premium': 'Премиум',
        'vip': 'Эксклюзив'
    };

    // Проверяем наличие привязанного кошелька
    const hasWallet = AppState.currentUser && AppState.currentUser.wallet;

    // Формируем сообщение с доступными способами оплаты
    let paymentMessage = `Вы выбрали тариф "${planNames[plan]}"\nСтоимость: ${price.toLocaleString('ru-RU')} ₽/месяц\n\nДоступные способы оплаты:\n`;

    if (hasWallet) {
        paymentMessage += `1. Криптовалюта (${AppState.currentUser.wallet.type})\n`;
    }
    paymentMessage += `${hasWallet ? '2' : '1'}. Наличные при личной встрече\n\nНажмите ОК для активации тарифа (демо-режим)`;

    showConfirm(paymentMessage, () => {
        // Функция после подтверждения
        const processPayment = (paymentMethod) => {
            // Устанавливаем статус оплаты
            AppState.profilePaymentStatus = plan;
            saveToLocalStorage();

            // Закрываем модальное окно
            closeModal('pricingModal');

            // Обновляем навигацию для отображения новой кнопки
            updateNavigation();

            // Формируем сообщение об успехе с информацией о способе оплаты
            let successMessage = `Тариф "${planNames[plan]}" успешно активирован!\n\n`;

            if (paymentMethod === 'crypto') {
                successMessage += `Способ оплаты: Криптовалюта (${AppState.currentUser.wallet.type})\nКошелек: ${AppState.currentUser.wallet.address}\n\n`;
            } else {
                successMessage += `Способ оплаты: Наличные при личной встрече\n\n`;
            }

            successMessage += `Ваша анкета получит:\n`;
            if (plan === 'basic') {
                successMessage += '- Базовое размещение\n- До 5 фотографий\n- Базовая статистика';
            } else if (plan === 'premium') {
                successMessage += '- Приоритетное размещение\n- До 15 фотографий\n- Расширенная статистика\n- Бейдж "Проверено"';
            } else if (plan === 'vip') {
                successMessage += '- Топ размещение\n- Неограниченно фотографий\n- Полная аналитика\n- Бейдж "VIP Проверено"\n- Продвижение в соцсетях';
            }

            showToast(successMessage, 'success', 7000);
        };

        // Если есть кошелек, спрашиваем способ оплаты
        if (hasWallet) {
            showConfirm(
                `Выберите способ оплаты:\n\nОК - Оплата криптовалютой (${AppState.currentUser.wallet.type})\nОтмена - Оплата наличными при встрече`,
                () => processPayment('crypto'),
                () => processPayment('cash')
            );
        } else {
            processPayment('cash');
        }
    });
}

function showMyProfileView() {
    // Открываем детальный просмотр своей анкеты
    if (AppState.currentProfile && AppState.currentProfile.id) {
        openProfileModal(AppState.currentProfile.id);
    } else {
        // Если анкеты нет, показываем тарифы чтобы мотивировать создать анкету
        showToast('Сначала создайте анкету и выберите тариф для её размещения', 'info', 4000);
        showPricingModal();
    }
}

// ==================== ОТЗЫВЫ ====================
function openReviewModal() {
    if (!AppState.currentUser) {
        alert('Для того чтобы оставить отзыв, необходимо войти в аккаунт');
        closeModal('profileModal');
        showLogin();
        return;
    }

    closeModal('profileModal');
    AppState.selectedReviewRating = 0;
    updateReviewStars();
    document.getElementById('reviewText').value = '';
    showModal('reviewModal');
}

function setReviewRating(rating) {
    AppState.selectedReviewRating = rating;
    updateReviewStars();
}

function updateReviewStars() {
    const stars = document.querySelectorAll('.star-select');
    stars.forEach((star, index) => {
        if (index < AppState.selectedReviewRating) {
            star.classList.remove('empty');
            star.classList.add('filled');
        } else {
            star.classList.remove('filled');
            star.classList.add('empty');
        }
    });
}

function handleReviewSubmit(event) {
    event.preventDefault();

    if (!AppState.currentUser) {
        alert('Необходимо войти в аккаунт');
        return;
    }

    if (AppState.selectedReviewRating === 0) {
        alert('Пожалуйста, выберите оценку');
        return;
    }

    const text = document.getElementById('reviewText').value;

    const review = {
        rating: AppState.selectedReviewRating,
        text: text,
        date: new Date().toISOString(),
        userId: AppState.currentUser.email
    };

    if (!AppState.reviews[AppState.currentProfileView]) {
        AppState.reviews[AppState.currentProfileView] = [];
    }

    AppState.reviews[AppState.currentProfileView].push(review);

    // Обновляем рейтинг профиля
    const profile = AppState.profiles.find(p => p.id === AppState.currentProfileView);
    if (profile) {
        const reviews = AppState.reviews[AppState.currentProfileView];
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        profile.rating = avgRating;
        profile.reviewCount = reviews.length;
    }

    saveToLocalStorage();
    closeModal('reviewModal');

    alert('Отзыв успешно добавлен!');

    openProfileModal(AppState.currentProfileView);
}

// ==================== ФИЛЬТРАЦИЯ И ПОИСК ====================
function toggleFilters() {
    const content = document.querySelector('.filters-content');
    const toggle = document.querySelector('.filters-toggle');
    const headerWrapper = document.querySelector('.filters-header-wrapper');

    const isActive = content.classList.toggle('active');
    toggle.classList.toggle('active');

    if (isActive) {
        headerWrapper.classList.remove('collapsed');
        headerWrapper.classList.add('expanded');
    } else {
        headerWrapper.classList.remove('expanded');
        headerWrapper.classList.add('collapsed');
    }
}

function switchFilterTab(tabName) {
    // Обновляем активные вкладки
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Показываем соответствующую секцию
    document.querySelectorAll('.filter-section').forEach(section => {
        section.classList.remove('active');
    });

    const sectionMap = {
        'basic': 'basicFilters',
        'appearance': 'appearanceFilters',
        'params': 'paramsFilters',
        'services': 'servicesFilters'
    };

    document.getElementById(sectionMap[tabName]).classList.add('active');
}

function applyFilters() {
    let filtered = [...AppState.profiles];

    // Поиск по ключевым словам
    const keywords = document.getElementById('searchKeywords').value.toLowerCase();
    if (keywords) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(keywords) ||
            p.description.toLowerCase().includes(keywords) ||
            p.services.some(s => s.toLowerCase().includes(keywords))
        );
    }

    // Фильтр по возрасту
    const ageFrom = document.getElementById('filterAgeFrom').value;
    const ageTo = document.getElementById('filterAgeTo').value;
    if (ageFrom) filtered = filtered.filter(p => p.age >= parseInt(ageFrom));
    if (ageTo) filtered = filtered.filter(p => p.age <= parseInt(ageTo));

    // Фильтр по городу
    const city = document.getElementById('filterCity').value;
    if (city) filtered = filtered.filter(p => p.city === city);

    // Фильтр по рейтингу
    const rating = document.getElementById('filterRating').value;
    if (rating) filtered = filtered.filter(p => (p.rating || 0) >= parseInt(rating));

    // Фильтр по цвету глаз
    const eyeColor = document.getElementById('filterEyeColor').value;
    if (eyeColor) filtered = filtered.filter(p => p.eyeColor === eyeColor);

    // Фильтр по цвету волос
    const hairColor = document.getElementById('filterHairColor').value;
    if (hairColor) filtered = filtered.filter(p => p.hairColor === hairColor);

    // Фильтр по национальности
    const nationality = document.getElementById('filterNationality').value;
    if (nationality) filtered = filtered.filter(p => p.nationality === nationality);

    // Фильтр по размеру груди
    const bustSize = document.getElementById('filterBustSize').value;
    if (bustSize) filtered = filtered.filter(p => p.bustSize === bustSize);

    // Фильтр по росту
    const heightFrom = document.getElementById('filterHeightFrom').value;
    const heightTo = document.getElementById('filterHeightTo').value;
    if (heightFrom) filtered = filtered.filter(p => p.height >= parseInt(heightFrom));
    if (heightTo) filtered = filtered.filter(p => p.height <= parseInt(heightTo));

    // Фильтр по весу
    const weightFrom = document.getElementById('filterWeightFrom').value;
    const weightTo = document.getElementById('filterWeightTo').value;
    if (weightFrom) filtered = filtered.filter(p => p.weight >= parseInt(weightFrom));
    if (weightTo) filtered = filtered.filter(p => p.weight <= parseInt(weightTo));

    // Фильтр по цене
    const priceFrom = document.getElementById('filterPriceFrom').value;
    const priceTo = document.getElementById('filterPriceTo').value;
    if (priceFrom) filtered = filtered.filter(p => p.price >= parseInt(priceFrom));
    if (priceTo) filtered = filtered.filter(p => p.price <= parseInt(priceTo));

    // Фильтр по услугам
    const serviceType = document.getElementById('filterServiceType').value;
    if (serviceType) {
        filtered = filtered.filter(p =>
            p.services.some(s => s.toLowerCase().includes(serviceType.toLowerCase()))
        );
    }

    renderProfiles();
    return filtered;
}

function updateServiceFilter() {
    // Собираем все уникальные услуги из анкет
    const allServices = new Set();
    AppState.profiles.forEach(profile => {
        profile.services.forEach(service => {
            allServices.add(service);
        });
    });

    // Обновляем select с услугами для клиентского интерфейса
    const serviceSelect = document.getElementById('filterServiceType');
    if (serviceSelect) {
        const currentValue = serviceSelect.value;
        serviceSelect.innerHTML = '<option value="">Все услуги</option>';
        Array.from(allServices).sort().forEach(service => {
            const option = document.createElement('option');
            option.value = service;
            option.textContent = service;
            serviceSelect.appendChild(option);
        });
        serviceSelect.value = currentValue;
    }

    // Обновляем select с услугами для главной страницы
    const homeServiceSelect = document.getElementById('homeFilterServiceType');
    if (homeServiceSelect) {
        const currentValue = homeServiceSelect.value;
        homeServiceSelect.innerHTML = '<option value="">Все услуги</option>';
        Array.from(allServices).sort().forEach(service => {
            const option = document.createElement('option');
            option.value = service;
            option.textContent = service;
            homeServiceSelect.appendChild(option);
        });
        homeServiceSelect.value = currentValue;
    }
}

// ==================== ФИЛЬТРАЦИЯ ДЛЯ ГЛАВНОЙ СТРАНИЦЫ ====================
function switchHomeFilterTab(tabName) {
    // Обновляем активные вкладки
    const tabs = document.querySelectorAll('#homeInterface .filter-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Показываем соответствующую секцию
    const sections = document.querySelectorAll('#homeInterface .filter-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    const sectionMap = {
        'basic': 'homeBasicFilters',
        'appearance': 'homeAppearanceFilters',
        'params': 'homeParamsFilters',
        'services': 'homeServicesFilters'
    };

    document.getElementById(sectionMap[tabName]).classList.add('active');
}

function applyHomeFilters() {
    let filtered = [...AppState.profiles];

    // Поиск по ключевым словам
    const keywordsInput = document.getElementById('searchKeywordsHome');
    if (keywordsInput) {
        const keywords = keywordsInput.value.toLowerCase();
        if (keywords) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(keywords) ||
                p.description.toLowerCase().includes(keywords) ||
                p.services.some(s => s.toLowerCase().includes(keywords))
            );
        }
    }

    // Фильтр по возрасту
    const ageFrom = document.getElementById('homeFilterAgeFrom').value;
    const ageTo = document.getElementById('homeFilterAgeTo').value;
    if (ageFrom) filtered = filtered.filter(p => p.age >= parseInt(ageFrom));
    if (ageTo) filtered = filtered.filter(p => p.age <= parseInt(ageTo));

    // Фильтр по городу
    const city = document.getElementById('homeFilterCity').value;
    if (city) filtered = filtered.filter(p => p.city === city);

    // Фильтр по рейтингу
    const rating = document.getElementById('homeFilterRating').value;
    if (rating) filtered = filtered.filter(p => (p.rating || 0) >= parseInt(rating));

    // Фильтр по цвету глаз
    const eyeColor = document.getElementById('homeFilterEyeColor').value;
    if (eyeColor) filtered = filtered.filter(p => p.eyeColor === eyeColor);

    // Фильтр по цвету волос
    const hairColor = document.getElementById('homeFilterHairColor').value;
    if (hairColor) filtered = filtered.filter(p => p.hairColor === hairColor);

    // Фильтр по национальности
    const nationality = document.getElementById('homeFilterNationality').value;
    if (nationality) filtered = filtered.filter(p => p.nationality === nationality);

    // Фильтр по размеру груди
    const bustSize = document.getElementById('homeFilterBustSize').value;
    if (bustSize) filtered = filtered.filter(p => p.bustSize === bustSize);

    // Фильтр по росту
    const heightFrom = document.getElementById('homeFilterHeightFrom').value;
    const heightTo = document.getElementById('homeFilterHeightTo').value;
    if (heightFrom) filtered = filtered.filter(p => p.height >= parseInt(heightFrom));
    if (heightTo) filtered = filtered.filter(p => p.height <= parseInt(heightTo));

    // Фильтр по весу
    const weightFrom = document.getElementById('homeFilterWeightFrom').value;
    const weightTo = document.getElementById('homeFilterWeightTo').value;
    if (weightFrom) filtered = filtered.filter(p => p.weight >= parseInt(weightFrom));
    if (weightTo) filtered = filtered.filter(p => p.weight <= parseInt(weightTo));

    // Фильтр по цене
    const priceFrom = document.getElementById('homeFilterPriceFrom').value;
    const priceTo = document.getElementById('homeFilterPriceTo').value;
    if (priceFrom) filtered = filtered.filter(p => p.price >= parseInt(priceFrom));
    if (priceTo) filtered = filtered.filter(p => p.price <= parseInt(priceTo));

    // Фильтр по услугам
    const serviceType = document.getElementById('homeFilterServiceType').value;
    if (serviceType) {
        filtered = filtered.filter(p =>
            p.services.some(s => s.toLowerCase().includes(serviceType.toLowerCase()))
        );
    }

    return filtered;
}

// ==================== ПРИМЕРЫ АНКЕТ ====================
function initializeSampleProfiles() {
    // Проверяем, есть ли уже профили в системе
    // Если есть хотя бы один профиль, не добавляем тестовые
    if (AppState.profiles.length > 0) return;

    // Одна тестовая анкета для демонстрации
    const sampleProfiles = [
        {
            id: 1,
            name: 'Вероника',
            age: 27,
            city: 'kazan',
            height: 173,
            weight: 58,
            bustSize: '4',
            eyeColor: 'Зеленые',
            hairColor: 'Шатенка',
            nationality: 'Славянка',
            bodyType: 'Аппетитная',
            clothingSize: 'M',
            description: 'Страстная и раскрепощенная. Обожаю анальный секс и эксперименты. Без табу и ограничений. Для тех, кто ищет по-настоящему горячую встречу.',
            services: ['Классический секс', 'Секс без презерватива', 'Анальный секс', 'Анальный фистинг', 'Минет без презерватива', 'Минет глубокий', 'Окончание в рот', 'Куннилингус', 'БДСМ', 'Подчинение', 'Страпон', 'Фетиш', 'Золотой дождь', 'Ролевые игры', 'Эротический массаж', 'Массаж простаты', 'Лесби-шоу', 'Групповой секс', 'ЖМЖ', 'Стриптиз', 'Эскорт', 'Выезд в отель', 'Услуги для пар'],
            price: 10000,
            images: [],
            videos: [],
            rating: 4.8,
            reviewCount: 3,
            views: 45,
            verified: true,
            createdAt: new Date('2024-09-08').toISOString()
        }
    ];

    // Добавляем тестовую анкету
    AppState.profiles = [...AppState.profiles, ...sampleProfiles];

    // Добавляем примеры отзывов для одной анкеты
    AppState.reviews = {
        1: [
            {
                rating: 5,
                text: 'Прекрасная девушка! Очень приятное общение, красивая и умная. Рекомендую!',
                date: new Date('2024-10-28').toISOString(),
                userId: 'client1@example.com'
            },
            {
                rating: 5,
                text: 'Всё на высшем уровне. Настоящий профессионал своего дела.',
                date: new Date('2024-10-26').toISOString(),
                userId: 'client2@example.com'
            },
            {
                rating: 4,
                text: 'Отличная встреча, все понравилось. Спасибо!',
                date: new Date('2024-10-22').toISOString(),
                userId: 'client3@example.com'
            }
        ]
    };

    saveToLocalStorage();
}
