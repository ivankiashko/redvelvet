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
    profilePaymentStatus: null, // Статус оплаты анкеты: null, 'basic', 'premium', 'vip'
    selectedRole: null, // Выбранная роль пользователя: 'client' или 'model'
    ageVerified: false, // Подтверждение возраста 18+
    favorites: [], // ID избранных анкет (только для залогиненных клиентов)
    anonymousMode: false, // Анонимный режим (отключает возможность оставлять отзывы)
    registeredEmails: [] // Список всех зарегистрированных email-адресов
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();

    // Автоматическое удаление сохраненной анкеты (одноразово)
    // Проверяем флаг для удаления анкеты
    const shouldDeleteProfile = localStorage.getItem('redvelvet_delete_profile_flag');
    if (shouldDeleteProfile === 'true') {
        // Удаляем анкету без подтверждения
        if (AppState.currentProfile) {
            const index = AppState.profiles.findIndex(p => p.id === AppState.currentProfile.id);
            if (index !== -1) {
                AppState.profiles.splice(index, 1);
            }
            if (AppState.reviews[AppState.currentProfile.id]) {
                delete AppState.reviews[AppState.currentProfile.id];
            }
            AppState.currentProfile = null;
            AppState.mediaFiles = [];
            AppState.profilePaymentStatus = null;
            localStorage.removeItem('redvelvet_profile');
            localStorage.removeItem('redvelvet_payment_status');
            saveToLocalStorage();
            showToast('Сохраненная анкета была удалена', 'success', 3000);
        }
        // Удаляем флаг после выполнения
        localStorage.removeItem('redvelvet_delete_profile_flag');
    }

    // Проверяем, подтвердил ли пользователь возраст и выбрал роль
    if (!AppState.ageVerified || !AppState.selectedRole) {
        // Показываем модальное окно предупреждения
        showModal('ageVerificationModal');
    } else {
        // Скрываем модальное окно если уже подтвердили
        closeModal('ageVerificationModal');
    }

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

    // Запускаем искусственную накрутку просмотров
    startViewsBoost();
});

// ==================== ИСКУССТВЕННАЯ НАКРУТКА ПРОСМОТРОВ ====================
function startViewsBoost() {
    // Увеличиваем просмотры каждые 10-30 секунд случайным образом
    setInterval(() => {
        if (AppState.profiles.length === 0) return;

        // Выбираем случайную анкету
        const randomIndex = Math.floor(Math.random() * AppState.profiles.length);
        const profile = AppState.profiles[randomIndex];

        // Увеличиваем просмотры на случайное число от 1 до 5
        const viewsIncrease = Math.floor(Math.random() * 5) + 1;
        profile.views = (profile.views || 0) + viewsIncrease;

        saveToLocalStorage();

        // Обновляем статистику если это профиль текущей модели
        if (AppState.currentProfile && AppState.currentProfile.id === profile.id) {
            updateModelStats();
        }
    }, Math.random() * 20000 + 10000); // Каждые 10-30 секунд
}

// ==================== ЗАГРУЗКА И СОХРАНЕНИЕ ДАННЫХ ====================
function loadFromLocalStorage() {
    const savedUser = localStorage.getItem('redvelvet_user');
    const savedProfile = localStorage.getItem('redvelvet_profile');
    const savedProfiles = localStorage.getItem('redvelvet_profiles');
    const savedReviews = localStorage.getItem('redvelvet_reviews');
    const savedPaymentStatus = localStorage.getItem('redvelvet_payment_status');
    const savedSelectedRole = localStorage.getItem('redvelvet_selected_role');
    const savedAgeVerified = localStorage.getItem('redvelvet_age_verified');
    const savedFavorites = localStorage.getItem('redvelvet_favorites');
    const savedAnonymousMode = localStorage.getItem('redvelvet_anonymous_mode');
    const savedRegisteredEmails = localStorage.getItem('redvelvet_registered_emails');

    if (savedUser) AppState.currentUser = JSON.parse(savedUser);
    if (savedProfile) AppState.currentProfile = JSON.parse(savedProfile);
    if (savedProfiles) AppState.profiles = JSON.parse(savedProfiles);
    if (savedReviews) AppState.reviews = JSON.parse(savedReviews);
    if (savedPaymentStatus) AppState.profilePaymentStatus = savedPaymentStatus;
    if (savedSelectedRole) AppState.selectedRole = savedSelectedRole;
    if (savedAgeVerified) AppState.ageVerified = savedAgeVerified === 'true';
    if (savedFavorites) AppState.favorites = JSON.parse(savedFavorites);
    if (savedAnonymousMode) AppState.anonymousMode = savedAnonymousMode === 'true';
    if (savedRegisteredEmails) AppState.registeredEmails = JSON.parse(savedRegisteredEmails);
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
    if (AppState.selectedRole) {
        localStorage.setItem('redvelvet_selected_role', AppState.selectedRole);
    }
    localStorage.setItem('redvelvet_age_verified', AppState.ageVerified.toString());
    localStorage.setItem('redvelvet_favorites', JSON.stringify(AppState.favorites));
    localStorage.setItem('redvelvet_anonymous_mode', AppState.anonymousMode.toString());
    localStorage.setItem('redvelvet_registered_emails', JSON.stringify(AppState.registeredEmails));
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
        <div class="modal-content" style="max-width: 500px; text-align: center;">
            <h2 style="margin-bottom: 20px; color: var(--primary-orange); text-align: center;">Подтверждение</h2>
            <p style="color: var(--text-gray); line-height: 1.8; white-space: pre-line; margin-bottom: 30px; text-align: center; font-size: 16px;">${message}</p>
            <div style="display: flex; gap: 15px; justify-content: center; align-items: center;">
                <button class="btn btn-outline cancel-btn" style="min-width: 130px; flex: 1; max-width: 180px;">Отмена</button>
                <button class="btn btn-primary confirm-btn" style="min-width: 130px; flex: 1; max-width: 180px;">ОК</button>
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
// Функция для определения активного интерфейса
function getCurrentInterface() {
    if (!document.getElementById('homeInterface').classList.contains('hidden')) {
        return 'home';
    } else if (!document.getElementById('clientDashboard').classList.contains('hidden')) {
        return 'clientDashboard';
    } else if (!document.getElementById('modelInterface').classList.contains('hidden')) {
        return 'modelInterface';
    } else if (!document.getElementById('clientInterface').classList.contains('hidden')) {
        return 'clientInterface';
    }
    return 'home';
}

function updateNavigation() {
    const nav = document.getElementById('mainNav');
    nav.innerHTML = '';

    // Определяем текущий активный интерфейс
    const currentInterface = getCurrentInterface();

    // Если в режиме создания/редактирования анкеты
    if (AppState.inModelCreationMode) {
        // Проверяем наличие созданной анкеты
        const hasProfile = AppState.currentProfile !== null;

        if (!hasProfile) {
            // Анкета не создана: показываем только "Главное меню" и "Выход"
            nav.innerHTML = `
                <button class="btn btn-outline" onclick="goToMainMenu()">Главное меню</button>
                ${AppState.currentUser ? '<button class="btn btn-outline" onclick="logout()">Выход</button>' : ''}
            `;
            return;
        }

        // Проверяем статус оплаты анкеты
        const isPaid = AppState.profilePaymentStatus !== null;

        if (isPaid) {
            // Тариф куплен: показываем "Сменить тариф" + "Главное меню" + "Выход"
            nav.innerHTML = `
                <button class="btn btn-outline" onclick="showPricingModal()">Сменить тариф</button>
                <button class="btn btn-outline" onclick="goToMainMenu()">Главное меню</button>
                <button class="btn btn-outline" onclick="logout()">Выход</button>
            `;
        } else {
            // Тариф не куплен: показываем "Оплатить анкету" + "Главное меню" + "Выход"
            nav.innerHTML = `
                <button class="btn btn-outline" onclick="showPricingModal()">Оплатить анкету</button>
                <button class="btn btn-outline" onclick="goToMainMenu()">Главное меню</button>
                ${AppState.currentUser ? '<button class="btn btn-outline" onclick="logout()">Выход</button>' : ''}
            `;
        }
        return;
    }

    if (!AppState.currentUser) {
        // Гость: показываем единственную кнопку "Авторизация" после выбора роли
        if (AppState.selectedRole && AppState.ageVerified) {
            nav.innerHTML = `
                <button class="btn btn-outline" onclick="showAuthModal()">Авторизация</button>
            `;
        } else {
            // Если роль не выбрана, не показываем кнопки (они откроются после выбора роли)
            nav.innerHTML = '';
        }
    } else if (AppState.currentUser.type === 'client') {
        // Клиент: переключаем между "Мой профиль" и "К анкетам"
        if (currentInterface === 'clientDashboard') {
            // В профиле клиента - показываем "К анкетам"
            nav.innerHTML = `
                <button class="btn btn-outline" onclick="showHomeInterface()">К анкетам</button>
                <button class="btn btn-outline" onclick="logout()">Выход</button>
            `;
        } else {
            // На главной или в анкетах - показываем "Мой профиль"
            nav.innerHTML = `
                <button class="btn btn-outline" onclick="showClientDashboard()">Мой профиль</button>
                <button class="btn btn-outline" onclick="logout()">Выход</button>
            `;
        }
    } else if (AppState.currentUser.type === 'model') {
        // Модель: переключаем между анкетой и просмотром анкет
        if (currentInterface === 'modelInterface') {
            // В интерфейсе модели - показываем "К анкетам"
            nav.innerHTML = `
                <button class="btn btn-outline" onclick="showHomeInterface()">К анкетам</button>
                <button class="btn btn-outline" onclick="logout()">Выход</button>
            `;
        } else {
            // На главной - показываем кнопку в зависимости от статуса анкеты
            const hasProfile = AppState.currentProfile !== null;
            const modelButtonText = hasProfile
                ? (AppState.profilePaymentStatus ? 'Моя анкета' : 'Моя анкета (не оплачена)')
                : 'Создать анкету';
            nav.innerHTML = `
                <button class="btn btn-outline" onclick="showModelInterface()">${modelButtonText}</button>
                <button class="btn btn-outline" onclick="logout()">Выход</button>
            `;
        }
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

    // Обновляем состояние тумблера анонимного режима
    const anonymousModeToggle = document.getElementById('anonymousModeToggle');
    if (anonymousModeToggle) {
        anonymousModeToggle.checked = AppState.anonymousMode;
    }

    // Обновляем избранные анкеты
    const favoritesGrid = document.getElementById('favoritesGrid');
    if (favoritesGrid) {
        favoritesGrid.innerHTML = '';

        if (AppState.favorites.length === 0) {
            favoritesGrid.innerHTML = '<p class="no-data">У вас пока нет избранных анкет</p>';
        } else {
            // Получаем анкеты из избранного
            const favoriteProfiles = AppState.profiles.filter(p => AppState.favorites.includes(p.id));

            if (favoriteProfiles.length === 0) {
                favoritesGrid.innerHTML = '<p class="no-data">Избранные анкеты больше не доступны</p>';
            } else {
                favoriteProfiles.forEach(profile => {
                    const card = createProfileCard(profile);
                    favoritesGrid.appendChild(card);
                });
            }
        }
    }
}

// Функция для переключения анонимного режима
function toggleAnonymousMode() {
    AppState.anonymousMode = !AppState.anonymousMode;
    saveToLocalStorage();

    if (AppState.anonymousMode) {
        showToast('Анонимный режим включен. Вы не сможете оставлять отзывы', 'info', 4000);
    } else {
        showToast('Анонимный режим выключен. Теперь вы можете оставлять отзывы', 'success', 4000);
    }
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

    // Позиция в рейтинге с учетом тарифа
    const sortedProfiles = [...AppState.profiles].sort((a, b) => {
        // Приоритет по тарифу
        const getPlanPriority = (plan) => {
            if (plan === 'vip') return 3;
            if (plan === 'premium') return 2;
            if (plan === 'basic') return 1;
            return 0;
        };
        const planDiff = getPlanPriority(AppState.profilePaymentStatus) - getPlanPriority(b.paymentPlan || AppState.profilePaymentStatus);
        if (planDiff !== 0) return planDiff;

        // Затем по рейтингу
        return (b.rating || 0) - (a.rating || 0);
    });
    const rank = sortedProfiles.findIndex(p => p.id === profile.id) + 1;
    document.getElementById('rankPosition').textContent = rank > 0 ? rank : '-';

    // Расширенная статистика для премиум и эксклюзив тарифов
    const plan = AppState.profilePaymentStatus;
    const dashboardStats = document.querySelector('.dashboard-stats');

    if ((plan === 'premium' || plan === 'vip') && dashboardStats) {
        // Добавляем дополнительные карточки статистики
        const existingExtendedStats = document.querySelectorAll('.extended-stat-card');
        if (existingExtendedStats.length === 0) {
            const extendedStatsHTML = `
                <div class="stat-card extended-stat-card" style="background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 107, 53, 0.05)); border: 1px solid rgba(255, 107, 53, 0.3);">
                    <div class="stat-card-value">${Math.floor((profile.views || 0) * 0.3)}</div>
                    <div class="stat-card-label">Переходы по контактам</div>
                </div>
                ${plan === 'vip' ? `
                <div class="stat-card extended-stat-card" style="background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 107, 53, 0.05)); border: 1px solid rgba(255, 107, 53, 0.3);">
                    <div class="stat-card-value">${Math.floor((profile.views || 0) * 0.15)}</div>
                    <div class="stat-card-label">Запросы бронирования</div>
                </div>
                <div class="stat-card extended-stat-card" style="background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 107, 53, 0.05)); border: 1px solid rgba(255, 107, 53, 0.3);">
                    <div class="stat-card-value">${Math.floor((profile.views || 0) * 0.45)}%</div>
                    <div class="stat-card-label">Конверсия просмотров</div>
                </div>
                ` : ''}
            `;
            dashboardStats.insertAdjacentHTML('beforeend', extendedStatsHTML);
        } else {
            // Обновляем существующую расширенную статистику
            const contactsCard = existingExtendedStats[0]?.querySelector('.stat-card-value');
            if (contactsCard) contactsCard.textContent = Math.floor((profile.views || 0) * 0.3);

            if (plan === 'vip' && existingExtendedStats.length >= 3) {
                const bookingsCard = existingExtendedStats[1]?.querySelector('.stat-card-value');
                if (bookingsCard) bookingsCard.textContent = Math.floor((profile.views || 0) * 0.15);

                const conversionCard = existingExtendedStats[2]?.querySelector('.stat-card-value');
                if (conversionCard) conversionCard.textContent = Math.floor((profile.views || 0) * 0.45) + '%';
            }
        }
    }
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
    // Всегда показываем окно регистрации, если пользователь явно хочет зарегистрироваться
    showModal('registerModal');
}

function showLogin() {
    showModal('loginModal');
}

function showModelRegister() {
    // Всегда показываем окно регистрации, если пользователь явно хочет зарегистрироваться
    showModal('modelRegisterModal');
}

function showModelLogin() {
    showModal('modelLoginModal');
}

function showWalletModal() {
    showModal('walletModal');
}

// ==================== ВЫБОР РОЛИ И ПОДТВЕРЖДЕНИЕ ВОЗРАСТА ====================
function selectUserRole(role) {
    // Проверяем, подтвержден ли возраст
    const ageConfirmed = document.getElementById('confirmAge18').checked;

    if (!ageConfirmed) {
        showToast('Пожалуйста, подтвердите, что вам исполнилось 18 лет', 'warning', 5000);
        return;
    }

    // Сохраняем выбранную роль и подтверждение возраста
    AppState.selectedRole = role;
    AppState.ageVerified = true;
    saveToLocalStorage();

    // Закрываем модальное окно предупреждения
    closeModal('ageVerificationModal');

    // Обновляем навигацию для показа кнопки "Авторизация"
    updateNavigation();

    // Показываем приветственное сообщение
    const roleText = role === 'client' ? 'клиента' : 'модели';
    showToast(`Добро пожаловать! Вы выбрали роль ${roleText}. Теперь вы можете авторизоваться.`, 'success', 5000);
}

function showAuthModal() {
    // Проверяем, залогинен ли пользователь
    if (AppState.currentUser) {
        // Если пользователь залогинен - перенаправляем в личный кабинет
        if (AppState.currentUser.type === 'client') {
            showClientDashboard();
        } else if (AppState.currentUser.type === 'model') {
            showModelInterface();
        }
        return;
    }

    // Если пользователь не залогинен - показываем форму входа или регистрации
    if (AppState.selectedRole === 'client') {
        // Если есть зарегистрированные пользователи - показываем форму входа, иначе регистрацию
        if (AppState.registeredEmails.length > 0) {
            showLogin();
        } else {
            showRegister();
        }
    } else if (AppState.selectedRole === 'model') {
        // Если есть зарегистрированные пользователи - показываем форму входа, иначе регистрацию
        if (AppState.registeredEmails.length > 0) {
            showModelLogin();
        } else {
            showModelRegister();
        }
    }
}

// ==================== РЕГИСТРАЦИЯ И ВХОД ====================
function handleRegister(event) {
    event.preventDefault();

    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

    if (password !== passwordConfirm) {
        showToast('Пароли не совпадают', 'error', 4000);
        return;
    }

    // Регистрация только для клиентов
    AppState.currentUser = {
        email: email,
        password: password,
        type: 'client',
        wallet: null
    };

    // Добавляем email в список зарегистрированных
    if (!AppState.registeredEmails.includes(email)) {
        AppState.registeredEmails.push(email);
    }

    saveToLocalStorage();
    closeModal('registerModal');
    updateNavigation();
    showHomeInterface();

    showToast('Регистрация клиента успешна!', 'success', 4000);
}

function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Проверяем сохраненного пользователя
    const savedUser = localStorage.getItem('redvelvet_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.email === email && user.password === password && user.type === 'client') {
            AppState.currentUser = user;
            closeModal('loginModal');
            updateNavigation();
            showHomeInterface();
            showToast('Вход выполнен успешно!', 'success', 3000);
        } else {
            showToast('Неверный email или пароль', 'error', 4000);
        }
    } else {
        showToast('Пользователь не найден. Пожалуйста, зарегистрируйтесь.', 'error', 4000);
    }
}

// Функция форматирования номера телефона
function formatPhoneNumber(phoneNumber) {
    // Удаляем все нечисловые символы
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Если номер начинается с 8, заменяем на 7
    let formatted = cleaned.startsWith('8') ? '7' + cleaned.slice(1) : cleaned;

    // Форматируем в формат +7 (XXX) XXX-XX-XX
    if (formatted.length >= 11) {
        formatted = formatted.slice(0, 11);
        return `+7 (${formatted.slice(1, 4)}) ${formatted.slice(4, 7)}-${formatted.slice(7, 9)}-${formatted.slice(9, 11)}`;
    } else if (formatted.length >= 7) {
        return `+7 (${formatted.slice(1, 4)}) ${formatted.slice(4, 7)}-${formatted.slice(7)}`;
    } else if (formatted.length >= 4) {
        return `+7 (${formatted.slice(1, 4)}) ${formatted.slice(4)}`;
    } else if (formatted.length >= 1) {
        return `+7 (${formatted.slice(1)}`;
    }

    return '+7';
}

// Автоматическое форматирование номера телефона при вводе
function autoFormatPhoneInput(input) {
    const formatted = formatPhoneNumber(input.value);
    input.value = formatted;
}

function handleModelRegister(event) {
    event.preventDefault();

    const email = document.getElementById('modelRegisterEmail').value;
    const phoneInput = document.getElementById('modelRegisterPhone').value;
    const password = document.getElementById('modelRegisterPassword').value;
    const passwordConfirm = document.getElementById('modelRegisterPasswordConfirm').value;

    if (password !== passwordConfirm) {
        showToast('Пароли не совпадают', 'error', 4000);
        return;
    }

    // Форматируем номер телефона
    const phone = formatPhoneNumber(phoneInput);

    // Создаем аккаунт модели
    AppState.currentUser = {
        email: email,
        phone: phone,
        password: password, // В реальном приложении пароль должен быть захеширован
        type: 'model',
        wallet: null
    };

    // Добавляем email в список зарегистрированных
    if (!AppState.registeredEmails.includes(email)) {
        AppState.registeredEmails.push(email);
    }

    saveToLocalStorage();
    closeModal('modelRegisterModal');
    updateNavigation();
    showModelInterface();

    showToast('Регистрация модели успешна! Теперь создайте свою анкету.', 'success', 5000);
}

function handleModelLogin(event) {
    event.preventDefault();

    const email = document.getElementById('modelLoginEmail').value;
    const password = document.getElementById('modelLoginPassword').value;

    // Проверяем сохраненного пользователя
    const savedUser = localStorage.getItem('redvelvet_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.email === email && user.password === password && user.type === 'model') {
            AppState.currentUser = user;
            closeModal('modelLoginModal');
            updateNavigation();
            showModelInterface();
            showToast('Добро пожаловать!', 'success', 3000);
        } else {
            showToast('Неверный email или пароль', 'error', 4000);
        }
    } else {
        showToast('Пользователь не найден. Пожалуйста, зарегистрируйтесь.', 'error', 4000);
    }
}

function logout() {
    showConfirm('Вы уверены, что хотите выйти из аккаунта?', () => {
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
        showToast('Вы вышли из аккаунта', 'info', 3000);
    });
}

// Функция для удаления сохраненной анкеты
function deleteCurrentProfile() {
    showConfirm('Вы уверены, что хотите удалить свою анкету? Это действие необратимо.', () => {
        if (AppState.currentProfile) {
            // Удаляем анкету из списка всех профилей
            const index = AppState.profiles.findIndex(p => p.id === AppState.currentProfile.id);
            if (index !== -1) {
                AppState.profiles.splice(index, 1);
            }

            // Удаляем отзывы к анкете
            if (AppState.reviews[AppState.currentProfile.id]) {
                delete AppState.reviews[AppState.currentProfile.id];
            }

            // Очищаем текущий профиль
            AppState.currentProfile = null;
            AppState.mediaFiles = [];
            AppState.profilePaymentStatus = null;

            // Удаляем из localStorage
            localStorage.removeItem('redvelvet_profile');
            localStorage.removeItem('redvelvet_payment_status');
            saveToLocalStorage();

            // Обновляем интерфейс
            updateNavigation();
            showHomeInterface();
            showToast('Анкета успешно удалена', 'success', 3000);
        } else {
            showToast('Нет анкеты для удаления', 'info', 3000);
        }
    });
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
                <h3 style="color: var(--text-gray); font-size: 16px; margin-bottom: 5px;">Кошелек не привязан</h3>
                <p style="color: var(--text-gray); font-size: 14px; opacity: 0.7;">Привяжите криптокошелек для получения платежей</p>
            </div>
        `;
    } else {
        const wallet = AppState.currentUser.wallet;
        const shortAddress = wallet.address.substring(0, 8) + '...' + wallet.address.substring(wallet.address.length - 6);

        walletInfo.innerHTML = `
            <div style="padding: 20px; background: linear-gradient(135deg, rgba(255, 107, 0, 0.1) 0%, rgba(255, 107, 0, 0.05) 100%); border-radius: 8px; border: 1px solid rgba(255, 107, 0, 0.3);">
                <div style="margin-bottom: 15px;">
                    <h3 style="font-size: 18px; color: var(--primary-orange); margin: 0 0 5px 0;">Кошелек привязан</h3>
                    <p style="font-size: 12px; color: var(--text-gray); margin: 0;">Вы можете получать платежи</p>
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
        showToast('Выберите хотя бы одну услугу', 'warning', 4000);
        return;
    }

    // Проверяем количество загруженных фото
    const imagesCount = AppState.mediaFiles.filter(f => f.type.startsWith('image')).length;
    if (imagesCount !== 3) {
        showToast(`Необходимо загрузить ровно 3 фотографии. Сейчас загружено: ${imagesCount}`, 'warning', 5000);
        return;
    }

    // Получаем номер телефона из аккаунта модели
    const phone = AppState.currentUser && AppState.currentUser.phone ? AppState.currentUser.phone : '';

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
        phone, // Добавляем номер телефона модели
        images: AppState.mediaFiles.filter(f => f.type.startsWith('image')),
        videos: AppState.mediaFiles.filter(f => f.type.startsWith('video')),
        rating: AppState.currentProfile ? AppState.currentProfile.rating : 0,
        reviewCount: AppState.currentProfile ? AppState.currentProfile.reviewCount : 0,
        views: AppState.currentProfile ? AppState.currentProfile.views : 0,
        verified: false, // Теперь требуется модерация админом
        createdAt: AppState.currentProfile ? AppState.currentProfile.createdAt : new Date().toISOString()
    };

    // Сохраняем данные анкеты временно
    AppState.currentProfile = profileData;

    // Проверяем, есть ли уже оплаченный тариф
    if (AppState.profilePaymentStatus) {
        // Тариф уже оплачен, обновляем анкету в списке
        const index = AppState.profiles.findIndex(p => p.id === AppState.currentProfile.id);
        if (index !== -1) {
            AppState.profiles[index] = profileData;
        } else {
            AppState.profiles.push(profileData);
        }
        saveToLocalStorage();
        updateServiceFilter();
        renderProfiles();
        showToast('Анкета успешно обновлена!', 'success', 4000);
        updateNavigation();
    } else {
        // Тариф не оплачен - показываем окно выбора тарифа
        saveToLocalStorage();
        showToast('Анкета сохранена. Выберите тариф для публикации.', 'info', 4000);
        showPricingModal();
    }
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

    // Подсчитываем текущее количество изображений
    const currentImagesCount = AppState.mediaFiles.filter(f => f.type.startsWith('image')).length;

    files.forEach(file => {
        // Проверяем максимальный размер
        if (file.size > 10 * 1024 * 1024) {
            showToast(`Файл ${file.name} превышает максимальный размер 10 МБ`, 'error', 4000);
            return;
        }

        // Проверяем, что файл является изображением
        if (!file.type.startsWith('image')) {
            showToast(`Можно загружать только изображения. Видео не поддерживаются.`, 'warning', 4000);
            return;
        }

        // Проверяем лимит в 3 фото
        const imagesInQueue = AppState.mediaFiles.filter(f => f.type.startsWith('image')).length;
        if (imagesInQueue >= 3) {
            showToast('Максимальное количество фото: 3. Удалите существующие, чтобы загрузить новые.', 'warning', 5000);
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

// ==================== ИЗБРАННОЕ ====================
function toggleFavorite(profileId) {
    // Проверяем, авторизован ли пользователь
    if (!AppState.currentUser || AppState.currentUser.type !== 'client') {
        showToast('Для добавления в избранное необходимо войти как клиент', 'warning', 4000);
        return;
    }

    const index = AppState.favorites.indexOf(profileId);
    if (index === -1) {
        // Добавляем в избранное
        AppState.favorites.push(profileId);
        showToast('Анкета добавлена в избранное', 'success', 3000);
    } else {
        // Удаляем из избранного
        AppState.favorites.splice(index, 1);
        showToast('Анкета удалена из избранного', 'info', 3000);
    }

    saveToLocalStorage();

    // Перерисовываем анкеты для обновления звездочек
    renderHomeProfiles();
    renderProfiles();
    updateClientDashboard();
}

function isFavorite(profileId) {
    return AppState.favorites.includes(profileId);
}

// ==================== ОТОБРАЖЕНИЕ ПРОФИЛЕЙ ====================
function renderHomeProfiles() {
    const grid = document.getElementById('homeProfilesGrid');
    grid.innerHTML = '';

    const filteredProfiles = applyHomeFilters();

    if (filteredProfiles.length === 0) {
        grid.innerHTML = `
            <div class="no-profiles-message">
                <h2 class="no-profiles-title">Анкеты не найдены</h2>
                <p class="no-profiles-text">Попробуйте изменить параметры поиска или сбросить фильтры</p>
            </div>
        `;
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
        grid.innerHTML = `
            <div class="no-profiles-message">
                <h2 class="no-profiles-title">Анкеты не найдены</h2>
                <p class="no-profiles-text">Попробуйте изменить параметры поиска или сбросить фильтры</p>
            </div>
        `;
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
    card.onclick = (e) => {
        // Проверяем, не нажали ли на кнопку избранного
        if (!e.target.closest('.favorite-btn')) {
            openProfileModal(profile.id);
        }
    };

    const imageUrl = profile.images && profile.images.length > 0
        ? profile.images[0].data
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="400"%3E%3Crect fill="%231a1a1a" width="320" height="400"/%3E%3Ctext fill="%23cccccc" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="Arial" font-size="20"%3EФото%3C/text%3E%3C/svg%3E';

    const stars = generateStars(profile.rating || 0);

    // Определяем, показывать ли кнопку избранного
    const showFavoriteBtn = AppState.currentUser && AppState.currentUser.type === 'client';
    const inFavorites = isFavorite(profile.id);

    card.innerHTML = `
        <div class="profile-image">
            <img src="${imageUrl}" alt="${profile.name}">
            ${profile.verified ? '<div class="profile-badge">✓ Проверено</div>' : ''}
            ${showFavoriteBtn ? `
                <button class="favorite-btn ${inFavorites ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${profile.id})">
                    <span class="favorite-icon">★</span>
                </button>
            ` : ''}
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

        ${AppState.currentUser && AppState.currentUser.type === 'client' ? `
            <div style="margin-top: 30px; display: flex; gap: 10px;">
                <button class="btn btn-outline" onclick="showPaymentModal()" style="flex: 1;">
                    Позвонить
                </button>
                <button class="btn btn-outline" onclick="openReviewModal()" style="flex: 1;">
                    Оставить отзыв
                </button>
            </div>

            <div style="margin-top: 15px; text-align: center;">
                <button class="btn btn-outline" onclick="reportProfile(${profileId})" style="background: rgba(255, 107, 53, 0.1); border-color: rgba(255, 107, 53, 0.3); width: 100%;">
                    Пожаловаться на анкету
                </button>
            </div>
        ` : `
            <div style="margin-top: 30px; padding: 20px; background: rgba(255, 149, 0, 0.1); border: 1px solid rgba(255, 149, 0, 0.3); border-radius: 10px; text-align: center;">
                <p style="color: var(--text-gray); margin: 0;">Для доступа к контактам и возможности оставить отзыв войдите как клиент</p>
            </div>
        `}

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
    // Проверка: звонить могут только клиенты
    if (!AppState.currentUser || AppState.currentUser.type !== 'client') {
        showToast('Просматривать контакты могут только зарегистрированные клиенты', 'warning', 5000);
        return;
    }

    closeModal('profileModal');
    showModal('paymentModal');
}

function selectPaymentMethod(method) {
    // Проверка: звонить могут только клиенты
    if (!AppState.currentUser || AppState.currentUser.type !== 'client') {
        showToast('Просматривать контакты могут только зарегистрированные клиенты', 'warning', 5000);
        return;
    }

    closeModal('paymentModal');

    const profile = AppState.profiles.find(p => p.id === AppState.currentProfileView);
    if (!profile) return;

    if (method === 'crypto') {
        // Показываем предупреждение о том, что функция в разработке
        showToast(
            'Функция оплаты криптокошельком находится в разработке.\n\nПожалуйста, выберите оплату по договоренности.',
            'warning',
            6000
        );
        showModal('paymentModal');
        return;
    } else {
        // Оплата по договоренности - показываем номер телефона
        closeModal('profileModal');
        if (profile.phone) {
            document.getElementById('phoneNumberLink').textContent = profile.phone;
            document.getElementById('phoneNumberLink').href = 'tel:' + profile.phone.replace(/\D/g, '');
            document.getElementById('modelNameDisplay').textContent = profile.name;
            showModal('phoneCallModal');
        } else {
            showToast(
                'Номер телефона не указан в анкете.\n\nСвяжитесь с моделью через другие способы связи.',
                'warning',
                5000
            );
            showModal('profileModal');
        }
    }
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
    if (!AppState.currentProfile) {
        showToast('Сначала создайте анкету', 'warning', 4000);
        return;
    }

    AppState.profilePaymentStatus = plan;

    // Публикуем анкету в списке после выбора тарифа
    const index = AppState.profiles.findIndex(p => p.id === AppState.currentProfile.id);
    if (index !== -1) {
        AppState.profiles[index] = AppState.currentProfile;
    } else {
        AppState.profiles.push(AppState.currentProfile);
    }

    saveToLocalStorage();
    updateServiceFilter();
    renderProfiles();

    closeModal('pricingModal');

    // Показываем сообщение о выбранном тарифе
    const planNames = {
        'basic': 'Стандарт',
        'premium': 'Премиум',
        'vip': 'Эксклюзив'
    };

    showToast(
        `Тариф "${planNames[plan]}" выбран!\n\nВаша анкета опубликована и находится на проверке.\n\nДля согласования оплаты свяжитесь с нами в Telegram:\nhttps://t.me/redvelvet_admin\n\nЦена: ${price} ₽/месяц`,
        'success',
        10000
    );

    // Перенаправляем на главную страницу
    showHomeInterface();
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

// ==================== ЖАЛОБЫ ====================
function reportProfile(profileId) {
    // Проверка: жаловаться могут только клиенты
    if (!AppState.currentUser || AppState.currentUser.type !== 'client') {
        showToast('Подавать жалобы могут только зарегистрированные клиенты', 'warning', 5000);
        return;
    }

    const profile = AppState.profiles.find(p => p.id === profileId);
    if (!profile) return;

    showConfirm(
        `Вы хотите пожаловаться на анкету ${profile.name}?\n\nВы будете перенаправлены в Telegram для подачи жалобы.`,
        () => {
            // Открываем телеграм для жалобы
            const telegramUrl = `https://t.me/redvelvet_admin?text=Жалоба на анкету ID: ${profileId}, Имя: ${profile.name}`;
            window.open(telegramUrl, '_blank');
            showToast('Спасибо за обращение. Мы рассмотрим вашу жалобу в течение 24 часов.', 'info', 5000);
        }
    );
}

// ==================== ОТЗЫВЫ ====================
function openReviewModal() {
    if (!AppState.currentUser) {
        showToast('Для того чтобы оставить отзыв, необходимо войти в аккаунт', 'warning', 5000);
        closeModal('profileModal');
        showLogin();
        return;
    }

    if (AppState.anonymousMode) {
        showToast('В анонимном режиме нельзя оставлять отзывы', 'warning', 5000);
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
        showToast('Необходимо войти в аккаунт', 'warning', 4000);
        return;
    }

    if (AppState.anonymousMode) {
        showToast('В анонимном режиме нельзя оставлять отзывы', 'warning', 5000);
        closeModal('reviewModal');
        return;
    }

    if (AppState.selectedReviewRating === 0) {
        showToast('Пожалуйста, выберите оценку', 'warning', 4000);
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

    showToast('Отзыв успешно добавлен!', 'success', 4000);

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

    // ФИЛЬТР ПО СТАТУСУ: показываем только одобренные анкеты
    // ИСКЛЮЧЕНИЕ: если пользователь - модель, показываем её собственную анкету, даже если не одобрена
    filtered = filtered.filter(p => {
        // Если анкета одобрена - показываем всем
        if (p.verified) return true;

        // Если пользователь - модель и это её анкета - показываем
        if (AppState.currentUser &&
            AppState.currentUser.type === 'model' &&
            AppState.currentProfile &&
            p.id === AppState.currentProfile.id) {
            return true;
        }

        // В остальных случаях не показываем неодобренные анкеты
        return false;
    });

    // Сортировка с приоритетом для премиум и эксклюзив тарифов
    const getPlanPriority = (plan) => {
        if (plan === 'vip') return 3;
        if (plan === 'premium') return 2;
        if (plan === 'basic') return 1;
        return 0;
    };

    filtered.sort((a, b) => {
        const planDiff = getPlanPriority(b.paymentPlan || AppState.profilePaymentStatus) - getPlanPriority(a.paymentPlan || AppState.profilePaymentStatus);
        if (planDiff !== 0) return planDiff;
        return (b.rating || 0) - (a.rating || 0);
    });

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

    // Сортировка с приоритетом для премиум и эксклюзив тарифов
    const getPlanPriority = (plan) => {
        if (plan === 'vip') return 3;
        if (plan === 'premium') return 2;
        if (plan === 'basic') return 1;
        return 0;
    };

    filtered.sort((a, b) => {
        const planDiff = getPlanPriority(b.paymentPlan || AppState.profilePaymentStatus) - getPlanPriority(a.paymentPlan || AppState.profilePaymentStatus);
        if (planDiff !== 0) return planDiff;
        return (b.rating || 0) - (a.rating || 0);
    });

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

