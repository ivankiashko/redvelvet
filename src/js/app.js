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
    renderProfiles();
    updateServiceFilter();

    // Инициализация фильтров
    const headerWrapper = document.querySelector('.filters-header-wrapper');
    if (headerWrapper) {
        headerWrapper.classList.add('expanded'); // Изначально фильтры развернуты
    }

    // Обработчик клика по логотипу
    document.querySelector('.logo').addEventListener('click', () => {
        showClientInterface();
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

// ==================== НАВИГАЦИЯ И ИНТЕРФЕЙС ====================
function updateNavigation() {
    const nav = document.getElementById('mainNav');
    nav.innerHTML = '';

    // Если в режиме создания/редактирования анкеты
    if (AppState.inModelCreationMode) {
        // Проверяем статус оплаты анкеты
        const isPaid = AppState.profilePaymentStatus !== null;

        if (isPaid) {
            // Оплаченная анкета: показываем "Моя анкета" слева от "Главное меню"
            nav.innerHTML = `
                <button class="btn btn-outline" onclick="showMyProfileView()">Моя анкета</button>
                <button class="btn btn-outline" onclick="goToMainMenu()">Главное меню</button>
            `;
        } else {
            // Неоплаченная анкета: показываем "Оплатить анкету" слева от "Главное меню"
            nav.innerHTML = `
                <button class="btn btn-outline" onclick="showPricingModal()">Оплатить анкету</button>
                <button class="btn btn-outline" onclick="goToMainMenu()">Главное меню</button>
            `;
        }
        return;
    }

    if (!AppState.currentUser) {
        // Гость: показываем Регистрация для клиентов и Создать/Моя анкету для моделей
        const modelButtonText = AppState.currentProfile ? 'Моя анкета' : 'Создать анкету модели';
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
        // Модель: показываем Моя анкета и Выход
        nav.innerHTML = `
            <button class="btn btn-outline" onclick="showModelInterface()">Моя анкета</button>
            <button class="btn btn-outline" onclick="logout()">Выход</button>
        `;
    }
}

// Функция возврата в главное меню
function goToMainMenu() {
    AppState.inModelCreationMode = false;
    updateNavigation();
    showClientInterface();
}

function showClientInterface() {
    AppState.inModelCreationMode = false;
    document.getElementById('clientInterface').classList.remove('hidden');
    document.getElementById('clientDashboard').classList.add('hidden');
    document.getElementById('modelInterface').classList.add('hidden');
    updateNavigation();
    renderProfiles();
}

function showClientDashboard() {
    AppState.inModelCreationMode = false;
    document.getElementById('clientInterface').classList.add('hidden');
    document.getElementById('clientDashboard').classList.remove('hidden');
    document.getElementById('modelInterface').classList.add('hidden');
    updateNavigation();
    updateClientDashboard();
}

function showModelInterface() {
    AppState.inModelCreationMode = true;
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
    showClientInterface();

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
            showClientInterface();
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
    showClientInterface();
}

// ==================== КОШЕЛЕК ====================
function handleWalletLink(event) {
    event.preventDefault();

    const walletType = document.getElementById('walletType').value;
    const walletAddress = document.getElementById('walletAddress').value;

    if (!AppState.currentUser) {
        alert('Необходимо войти в аккаунт');
        return;
    }

    AppState.currentUser.wallet = {
        type: walletType,
        address: walletAddress
    };

    saveToLocalStorage();
    closeModal('walletModal');

    if (AppState.currentUser.type === 'model') {
        updateWalletDisplay('model');
    } else {
        updateWalletDisplay('client');
    }

    alert('Кошелек успешно привязан!');
}

function updateWalletDisplay(userType) {
    if (!AppState.currentUser || !AppState.currentUser.wallet) {
        const walletInfo = document.getElementById(userType === 'model' ? 'modelWalletInfo' : 'clientWalletInfo');
        if (walletInfo) {
            walletInfo.innerHTML = '<p class="wallet-status">Кошелек не привязан</p>';
        }
        return;
    }

    const wallet = AppState.currentUser.wallet;
    const walletInfo = document.getElementById(userType === 'model' ? 'modelWalletInfo' : 'clientWalletInfo');

    if (walletInfo) {
        walletInfo.innerHTML = `
            <h3>Кошелек</h3>
            <p class="wallet-status">Привязан: ${wallet.type}</p>
            <p class="wallet-address">${wallet.address}</p>
        `;
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
    showClientInterface();
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
            <div class="profile-name">${profile.name}</div>
            <div class="profile-age">${profile.age} лет</div>
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
    let paymentMessage = `Вы выбрали тариф "${planNames[plan]}"\n` +
        `Стоимость: ${price.toLocaleString('ru-RU')} ₽/месяц\n\n` +
        `Доступные способы оплаты:\n`;

    if (hasWallet) {
        paymentMessage += `1. Криптовалюта (${AppState.currentUser.wallet.type})\n`;
    }
    paymentMessage += `${hasWallet ? '2' : '1'}. Наличные при личной встрече\n\n`;
    paymentMessage += `Нажмите ОК для активации тарифа (демо-режим)`;

    const confirmed = confirm(paymentMessage);

    if (confirmed) {
        // Если есть кошелек, спрашиваем способ оплаты
        let paymentMethod = 'cash'; // По умолчанию наличные

        if (hasWallet) {
            const useCrypto = confirm(
                `Выберите способ оплаты:\n\n` +
                `ОК - Оплата криптовалютой (${AppState.currentUser.wallet.type})\n` +
                `Отмена - Оплата наличными при встрече`
            );
            paymentMethod = useCrypto ? 'crypto' : 'cash';
        }

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
            successMessage += `Способ оплаты: Криптовалюта (${AppState.currentUser.wallet.type})\n`;
            successMessage += `Кошелек: ${AppState.currentUser.wallet.address}\n\n`;
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

        alert(successMessage);
    }
}

function showMyProfileView() {
    // Открываем детальный просмотр своей анкеты
    if (AppState.currentProfile && AppState.currentProfile.id) {
        openProfileModal(AppState.currentProfile.id);
    } else {
        alert('Сначала создайте и сохраните анкету');
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

    // Обновляем select с услугами
    const serviceSelect = document.getElementById('filterServiceType');
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

// ==================== ПРИМЕРЫ АНКЕТ ====================
function initializeSampleProfiles() {
    // Проверяем, есть ли уже профили в системе
    // Если есть хотя бы один профиль, не добавляем тестовые
    if (AppState.profiles.length > 0) return;

    // Тестовые анкеты с расширенным списком услуг
    const sampleProfiles = [
        {
            id: 1,
            name: 'Анастасия',
            age: 23,
            city: 'moscow',
            height: 172,
            weight: 54,
            bustSize: '3',
            eyeColor: 'Зеленые',
            hairColor: 'Блондинка',
            nationality: 'Славянка',
            bodyType: 'Модельная',
            clothingSize: 'S',
            description: 'Привет! Я Настя, модель и студентка. Люблю интересные встречи с приятными людьми. Гарантирую отличное времяпрепровождение и полную конфиденциальность. Открыта для различных форматов встреч.',
            services: ['Классический секс', 'Секс в презервативе', 'Минет без презерватива', 'Окончание в рот', 'Куннилингус', 'Эротический массаж', 'Расслабляющий массаж', 'Эскорт', 'VIP сопровождение', 'Выезд в отель', 'Стриптиз'],
            price: 8000,
            images: [],
            videos: [],
            rating: 4.8,
            reviewCount: 12,
            views: 245,
            verified: true,
            createdAt: new Date('2024-10-15').toISOString()
        },
        {
            id: 2,
            name: 'Виктория',
            age: 25,
            city: 'moscow',
            height: 168,
            weight: 56,
            bustSize: '4',
            eyeColor: 'Карие',
            hairColor: 'Брюнетка',
            nationality: 'Славянка',
            bodyType: 'Спортивная',
            clothingSize: 'M',
            description: 'Приветствую! Меня зовут Виктория. Занимаюсь фитнесом и моделингом. Предлагаю приятную компанию для деловых встреч и мероприятий. Открыта к экспериментам.',
            services: ['Классический секс', 'Секс в презервативе', 'Анальный секс', 'Минет глубокий', 'Минет без презерватива', 'Куннилингус', 'Лесби-шоу', 'ЖМЖ', 'Эротический массаж', 'Массаж простаты', 'БДСМ', 'Доминация', 'Эскорт', 'VIP сопровождение', 'Выезд в отель', 'Выезд на дом'],
            price: 10000,
            images: [],
            videos: [],
            rating: 5.0,
            reviewCount: 8,
            views: 189,
            verified: true,
            createdAt: new Date('2024-10-20').toISOString()
        },
        {
            id: 3,
            name: 'Алиса',
            age: 21,
            city: 'spb',
            height: 165,
            weight: 50,
            bustSize: '2',
            eyeColor: 'Голубые',
            hairColor: 'Рыжая',
            nationality: 'Славянка',
            bodyType: 'Стройная',
            clothingSize: 'XS',
            description: 'Милая и нежная девушка. Обожаю романтические встречи и интересные разговоры. Работаю моделью в модельном агентстве. Предпочитаю классику и романтику.',
            services: ['Классический секс', 'Секс в презервативе', 'Минет в презервативе', 'Куннилингус', 'Эротический массаж', 'Расслабляющий массаж', 'Стриптиз', 'Эскорт', 'Выезд в отель'],
            price: 7000,
            images: [],
            videos: [],
            rating: 4.5,
            reviewCount: 6,
            views: 156,
            verified: false,
            createdAt: new Date('2024-10-25').toISOString()
        },
        {
            id: 4,
            name: 'Екатерина',
            age: 27,
            city: 'sochi',
            height: 175,
            weight: 58,
            bustSize: '3',
            eyeColor: 'Серые',
            hairColor: 'Шатенка',
            nationality: 'Славянка',
            bodyType: 'Модельная',
            clothingSize: 'M',
            description: 'Элегантная и образованная девушка. Свободно владею английским языком. Идеально подхожу для деловых встреч и светских мероприятий. Работаю с VIP клиентами.',
            services: ['Классический секс', 'Секс без презерватива', 'Анальный секс', 'Минет без презерватива', 'Окончание в рот', 'Куннилингус', 'Лесби-шоу', 'Групповой секс', 'ЖМЖ', 'Эротический массаж', 'Расслабляющий массаж', 'Массаж простаты', 'Стриптиз', 'Эскорт', 'VIP сопровождение', 'Выезд в отель', 'Выезд на дом', 'Услуги для пар'],
            price: 12000,
            images: [],
            videos: [],
            rating: 4.9,
            reviewCount: 15,
            views: 312,
            verified: true,
            createdAt: new Date('2024-09-10').toISOString()
        },
        {
            id: 5,
            name: 'Мария',
            age: 22,
            city: 'krasnodar',
            height: 170,
            weight: 55,
            bustSize: '3',
            eyeColor: 'Зеленые',
            hairColor: 'Блондинка',
            nationality: 'Славянка',
            bodyType: 'Аппетитная',
            clothingSize: 'M',
            description: 'Яркая и позитивная девушка с отличным чувством юмора. Люблю веселиться и дарить положительные эмоции. Открыта к новым знакомствам и экспериментам.',
            services: ['Классический секс', 'Секс в презервативе', 'Минет без презерватива', 'Минет глубокий', 'Окончание в рот', 'Куннилингус', 'Эротический массаж', 'Лесби-шоу', 'Стриптиз', 'Ролевые игры', 'Эскорт', 'Выезд в отель', 'Услуги для пар'],
            price: 6000,
            images: [],
            videos: [],
            rating: 4.6,
            reviewCount: 10,
            views: 198,
            verified: false,
            createdAt: new Date('2024-10-05').toISOString()
        },
        {
            id: 6,
            name: 'Дарья',
            age: 24,
            city: 'moscow',
            height: 169,
            weight: 52,
            bustSize: '2',
            eyeColor: 'Голубые',
            hairColor: 'Блондинка',
            nationality: 'Славянка',
            bodyType: 'Стройная',
            clothingSize: 'S',
            description: 'Страстная и чувственная девушка. Люблю эксперименты и новые ощущения. Гарантирую незабываемые встречи и полное погружение в атмосферу удовольствия.',
            services: ['Классический секс', 'Секс без презерватива', 'Анальный секс', 'Минет без презерватива', 'Минет глубокий', 'Окончание в рот', 'Куннилингус', 'БДСМ', 'Подчинение', 'Страпон', 'Фетиш', 'Ролевые игры', 'Эротический массаж', 'Золотой дождь', 'Стриптиз', 'Лесби-шоу', 'Эскорт', 'Выезд в отель', 'Выезд на дом'],
            price: 9000,
            images: [],
            videos: [],
            rating: 4.7,
            reviewCount: 14,
            views: 267,
            verified: true,
            createdAt: new Date('2024-10-12').toISOString()
        },
        {
            id: 7,
            name: 'Софья',
            age: 26,
            city: 'spb',
            height: 173,
            weight: 57,
            bustSize: '4',
            eyeColor: 'Карие',
            hairColor: 'Брюнетка',
            nationality: 'Славянка',
            bodyType: 'Модельная',
            clothingSize: 'M',
            description: 'Интеллигентная девушка с модельной внешностью. Работаю в сфере моды. Предлагаю качественный досуг на высшем уровне. Люблю доминировать.',
            services: ['Классический секс', 'Секс в презервативе', 'Анальный секс', 'Минет без презерватива', 'Куннилингус', 'БДСМ', 'Доминация', 'Страпон', 'Фетиш', 'Ролевые игры', 'Эротический массаж', 'Массаж простаты', 'Урологический массаж', 'Лесби-шоу', 'Групповой секс', 'ЖМЖ', 'Стриптиз', 'Эскорт', 'VIP сопровождение', 'Выезд в отель', 'Фото/видео съемка'],
            price: 11000,
            images: [],
            videos: [],
            rating: 4.9,
            reviewCount: 18,
            views: 345,
            verified: true,
            createdAt: new Date('2024-09-25').toISOString()
        },
        {
            id: 8,
            name: 'Кристина',
            age: 20,
            city: 'ekaterinburg',
            height: 166,
            weight: 51,
            bustSize: '3',
            eyeColor: 'Зеленые',
            hairColor: 'Рыжая',
            nationality: 'Славянка',
            bodyType: 'Стройная',
            clothingSize: 'S',
            description: 'Молодая и энергичная девушка. Студентка, подрабатываю моделью. Обожаю новые знакомства и веселые встречи. Без комплексов и табу.',
            services: ['Классический секс', 'Секс в презервативе', 'Минет без презерватива', 'Минет в машине', 'Окончание в рот', 'Куннилингус', 'Анальный секс', 'Лесби-шоу', 'Групповой секс', 'ЖМЖ', 'МЖМ', 'Эротический массаж', 'Ролевые игры', 'Стриптиз', 'Эскорт', 'Выезд в отель', 'Услуги для пар', 'Услуги для женщин'],
            price: 5500,
            images: [],
            videos: [],
            rating: 4.4,
            reviewCount: 9,
            views: 178,
            verified: false,
            createdAt: new Date('2024-10-18').toISOString()
        },
        {
            id: 9,
            name: 'Полина',
            age: 28,
            city: 'moscow',
            height: 171,
            weight: 59,
            bustSize: '4',
            eyeColor: 'Карие',
            hairColor: 'Брюнетка',
            nationality: 'Славянка',
            bodyType: 'Аппетитная',
            clothingSize: 'M',
            description: 'Опытная и темпераментная девушка. Знаю, как довести до экстаза. Предпочитаю активных и раскрепощенных мужчин. Работаю только с проверенными клиентами.',
            services: ['Классический секс', 'Секс без презерватива', 'Анальный секс', 'Минет без презерватива', 'Минет глубокий', 'Окончание в рот', 'Куннилингус', 'БДСМ', 'Подчинение', 'Фетиш', 'Золотой дождь', 'Ролевые игры', 'Эротический массаж', 'Лесби-шоу', 'Групповой секс', 'Стриптиз', 'Эскорт', 'Выезд в отель', 'Услуги для пар'],
            price: 9500,
            images: [],
            videos: [],
            rating: 4.8,
            reviewCount: 22,
            views: 412,
            verified: true,
            createdAt: new Date('2024-09-05').toISOString()
        },
        {
            id: 10,
            name: 'Яна',
            age: 19,
            city: 'spb',
            height: 163,
            weight: 48,
            bustSize: '2',
            eyeColor: 'Голубые',
            hairColor: 'Блондинка',
            nationality: 'Славянка',
            bodyType: 'Стройная',
            clothingSize: 'XS',
            description: 'Юная и милая студентка. Только начинаю работу в этой сфере. Очень стеснительная, но открытая к новому. Предпочитаю нежность и романтику.',
            services: ['Классический секс', 'Секс в презервативе', 'Минет в презервативе', 'Куннилингус', 'Эротический массаж', 'Расслабляющий массаж', 'Стриптиз', 'Эскорт'],
            price: 4500,
            images: [],
            videos: [],
            rating: 4.3,
            reviewCount: 5,
            views: 123,
            verified: false,
            createdAt: new Date('2024-10-28').toISOString()
        },
        {
            id: 11,
            name: 'Карина',
            age: 30,
            city: 'kazan',
            height: 168,
            weight: 55,
            bustSize: '3',
            eyeColor: 'Зеленые',
            hairColor: 'Рыжая',
            nationality: 'Смешанная',
            bodyType: 'Спортивная',
            clothingSize: 'S',
            description: 'Профессиональная госпожа. Опыт в БДСМ более 5 лет. Строгая, но справедливая. Для тех, кто ищет настоящего подчинения и дисциплины.',
            services: ['БДСМ', 'Доминация', 'Страпон', 'Фетиш', 'Золотой дождь', 'Ролевые игры', 'Анальный фистинг', 'Массаж простаты', 'Урологический массаж'],
            price: 13000,
            images: [],
            videos: [],
            rating: 5.0,
            reviewCount: 31,
            views: 567,
            verified: true,
            createdAt: new Date('2024-08-15').toISOString()
        },
        {
            id: 12,
            name: 'Татьяна',
            age: 26,
            city: 'sochi',
            height: 174,
            weight: 60,
            bustSize: '5',
            eyeColor: 'Карие',
            hairColor: 'Брюнетка',
            nationality: 'Славянка',
            bodyType: 'Аппетитная',
            clothingSize: 'L',
            description: 'Пышногрудая красотка с формами. Люблю, когда обращают внимание на мою грудь. Предлагаю незабываемый опыт для ценителей пышных форм.',
            services: ['Классический секс', 'Секс в презервативе', 'Анальный секс', 'Минет без презерватива', 'Окончание в рот', 'Куннилингус', 'Эротический массаж', 'Расслабляющий массаж', 'Лесби-шоу', 'ЖМЖ', 'Стриптиз', 'Эскорт', 'VIP сопровождение', 'Выезд в отель', 'Услуги для пар'],
            price: 7500,
            images: [],
            videos: [],
            rating: 4.7,
            reviewCount: 16,
            views: 289,
            verified: true,
            createdAt: new Date('2024-09-20').toISOString()
        },
        {
            id: 13,
            name: 'Ольга',
            age: 32,
            city: 'moscow',
            height: 170,
            weight: 56,
            bustSize: '3',
            eyeColor: 'Серые',
            hairColor: 'Шатенка',
            nationality: 'Славянка',
            bodyType: 'Модельная',
            clothingSize: 'M',
            description: 'Элегантная бизнес-леди. Высшее образование, владею тремя языками. Идеальна для деловых ужинов и VIP мероприятий. Интеллект и красота в одном флаконе.',
            services: ['Классический секс', 'Секс без презерватива', 'Минет без презерватива', 'Окончание в рот', 'Куннилингус', 'Эротический массаж', 'Расслабляющий массаж', 'Эскорт', 'VIP сопровождение', 'Выезд в отель', 'Выезд на дом', 'Фото/видео съемка'],
            price: 15000,
            images: [],
            videos: [],
            rating: 4.9,
            reviewCount: 27,
            views: 445,
            verified: true,
            createdAt: new Date('2024-07-10').toISOString()
        },
        {
            id: 14,
            name: 'Ирина',
            age: 23,
            city: 'ekaterinburg',
            height: 167,
            weight: 53,
            bustSize: '3',
            eyeColor: 'Голубые',
            hairColor: 'Блондинка',
            nationality: 'Славянка',
            bodyType: 'Стройная',
            clothingSize: 'S',
            description: 'Веселая и позитивная блондинка. Люблю экспериментировать и пробовать новое. Гарантирую, что с вами не будет скучно! Работаю с парами.',
            services: ['Классический секс', 'Секс в презервативе', 'Минет без презерватива', 'Минет глубокий', 'Окончание в рот', 'Куннилингус', 'Лесби-шоу', 'Групповой секс', 'ЖМЖ', 'МЖМ', 'Эротический массаж', 'Ролевые игры', 'Стриптиз', 'Эскорт', 'Выезд в отель', 'Услуги для пар', 'Услуги для женщин'],
            price: 6500,
            images: [],
            videos: [],
            rating: 4.6,
            reviewCount: 13,
            views: 234,
            verified: false,
            createdAt: new Date('2024-10-01').toISOString()
        },
        {
            id: 15,
            name: 'Светлана',
            age: 29,
            city: 'krasnodar',
            height: 172,
            weight: 57,
            bustSize: '4',
            eyeColor: 'Зеленые',
            hairColor: 'Рыжая',
            nationality: 'Славянка',
            bodyType: 'Спортивная',
            clothingSize: 'M',
            description: 'Фитнес-тренер с идеальным телом. Гибкая, выносливая, знаю множество поз. Для тех, кто ценит спортивную фигуру и активный секс.',
            services: ['Классический секс', 'Секс без презерватива', 'Анальный секс', 'Минет без презерватива', 'Минет глубокий', 'Окончание в рот', 'Куннилингус', 'Эротический массаж', 'Массаж простаты', 'Лесби-шоу', 'Групповой секс', 'ЖМЖ', 'Стриптиз', 'Ролевые игры', 'Эскорт', 'Выезд в отель', 'Услуги для пар'],
            price: 8500,
            images: [],
            videos: [],
            rating: 4.8,
            reviewCount: 19,
            views: 356,
            verified: true,
            createdAt: new Date('2024-09-15').toISOString()
        },
        {
            id: 16,
            name: 'Алёна',
            age: 21,
            city: 'moscow',
            height: 169,
            weight: 52,
            bustSize: '3',
            eyeColor: 'Карие',
            hairColor: 'Брюнетка',
            nationality: 'Славянка',
            bodyType: 'Модельная',
            clothingSize: 'S',
            description: 'Модель с подиума. Снималась в рекламе и журналах. Предлагаю эстетическое наслаждение и качественный сервис. Элитная эскорт-услуга.',
            services: ['Классический секс', 'Секс в презервативе', 'Минет без презерватива', 'Куннилингус', 'Эротический массаж', 'Расслабляющий массаж', 'Лесби-шоу', 'Стриптиз', 'Эскорт', 'VIP сопровождение', 'Выезд в отель', 'Фото/видео съемка'],
            price: 11000,
            images: [],
            videos: [],
            rating: 4.9,
            reviewCount: 24,
            views: 478,
            verified: true,
            createdAt: new Date('2024-08-25').toISOString()
        },
        {
            id: 17,
            name: 'Юлия',
            age: 25,
            city: 'spb',
            height: 165,
            weight: 51,
            bustSize: '2',
            eyeColor: 'Голубые',
            hairColor: 'Блондинка',
            nationality: 'Славянка',
            bodyType: 'Стройная',
            clothingSize: 'XS',
            description: 'Нежная и чувственная девушка. Люблю долгие прелюдии и романтику. Создам атмосферу настоящего свидания. Идеально для тех, кто ищет girlfriend experience.',
            services: ['Классический секс', 'Секс в презервативе', 'Минет в презервативе', 'Куннилингус', 'Эротический массаж', 'Расслабляющий массаж', 'Стриптиз', 'Эскорт', 'VIP сопровождение', 'Выезд в отель'],
            price: 7000,
            images: [],
            videos: [],
            rating: 4.7,
            reviewCount: 11,
            views: 198,
            verified: true,
            createdAt: new Date('2024-10-10').toISOString()
        },
        {
            id: 18,
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
            reviewCount: 20,
            views: 367,
            verified: true,
            createdAt: new Date('2024-09-08').toISOString()
        }
    ];

    // Добавляем тестовые профили к существующим (не заменяем)
    AppState.profiles = [...AppState.profiles, ...sampleProfiles];

    // Добавляем примеры отзывов (TODO: удалить на финальной стадии)
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
                text: 'Всё на высшем уровне. Настя - профессионал своего дела.',
                date: new Date('2024-10-26').toISOString(),
                userId: 'client2@example.com'
            },
            {
                rating: 4,
                text: 'Отличная встреча, все понравилось. Спасибо!',
                date: new Date('2024-10-22').toISOString(),
                userId: 'client3@example.com'
            }
        ],
        2: [
            {
                rating: 5,
                text: 'Виктория превзошла все ожидания! Очень красивая и интересная.',
                date: new Date('2024-10-29').toISOString(),
                userId: 'client4@example.com'
            },
            {
                rating: 5,
                text: 'Идеальное сопровождение на деловом ужине. Профессионально и элегантно.',
                date: new Date('2024-10-24').toISOString(),
                userId: 'client5@example.com'
            }
        ],
        3: [
            {
                rating: 5,
                text: 'Милая и нежная девушка, как раз то, что искал.',
                date: new Date('2024-10-27').toISOString(),
                userId: 'client6@example.com'
            },
            {
                rating: 4,
                text: 'Очень приятная встреча, рекомендую.',
                date: new Date('2024-10-25').toISOString(),
                userId: 'client7@example.com'
            }
        ],
        4: [
            {
                rating: 5,
                text: 'Катя - просто восхитительна! Образованная, элегантная, с отличным вкусом.',
                date: new Date('2024-10-30').toISOString(),
                userId: 'client8@example.com'
            },
            {
                rating: 5,
                text: 'Лучшее сопровождение для деловых встреч. Безупречно!',
                date: new Date('2024-10-28').toISOString(),
                userId: 'client9@example.com'
            },
            {
                rating: 5,
                text: 'Всё было великолепно. Катя - настоящий профессионал.',
                date: new Date('2024-10-20').toISOString(),
                userId: 'client10@example.com'
            }
        ],
        5: [
            {
                rating: 5,
                text: 'Маша - огонь! Весело провели время, отличное настроение.',
                date: new Date('2024-10-29').toISOString(),
                userId: 'client11@example.com'
            },
            {
                rating: 4,
                text: 'Позитивная девушка, всё понравилось.',
                date: new Date('2024-10-26').toISOString(),
                userId: 'client12@example.com'
            }
        ]
    };

    saveToLocalStorage();
}
