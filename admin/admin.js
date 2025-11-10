// RedVelvet Admin Panel - Заготовка

/*
 * ВАЖНО: Это заготовка админ-панели для будущего развития проекта
 *
 * Планируемый функционал:
 * 1. Модерация анкет моделей перед публикацией
 * 2. Управление пользователями (блокировка, удаление)
 * 3. Модерация отзывов
 * 4. Отслеживание всех транзакций
 * 5. Статистика и аналитика
 * 6. Система верификации моделей
 * 7. Управление контентом
 * 8. Логирование действий
 *
 * TODO: В будущем добавить:
 * - Аутентификацию администратора
 * - Backend API для реальной работы с данными
 * - Систему прав доступа (супер-админ, модератор, и т.д.)
 * - Расширенную аналитику
 * - Систему уведомлений
 */

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    updateStatistics();
    // Автоматически загружаем все данные при открытии админ панели
    loadProfiles();
    loadReviews();
});

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

// ==================== МОДАЛЬНЫЕ ОКНА ПОДТВЕРЖДЕНИЯ ====================
function showConfirm(message, title = 'Подтверждение') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');

        titleEl.textContent = title;
        messageEl.innerHTML = message.replace(/\n/g, '<br>');

        modal.classList.add('active');

        const handleOk = () => {
            modal.classList.remove('active');
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleOutsideClick);
            resolve(true);
        };

        const handleCancel = () => {
            modal.classList.remove('active');
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleOutsideClick);
            resolve(false);
        };

        const handleOutsideClick = (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        };

        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleOutsideClick);
    });
}

// ==================== ЗАГРУЗКА ДАННЫХ ====================
function loadFromLocalStorage() {
    const profiles = localStorage.getItem('redvelvet_profiles');
    const reviews = localStorage.getItem('redvelvet_reviews');

    return {
        profiles: profiles ? JSON.parse(profiles) : [],
        reviews: reviews ? JSON.parse(reviews) : {},
        users: [] // TODO: В будущем добавить реестр пользователей
    };
}

// ==================== СТАТИСТИКА ====================
function updateStatistics() {
    const data = loadFromLocalStorage();

    // Общее количество анкет
    document.getElementById('totalProfiles').textContent = data.profiles.length;

    // Общее количество клиентов (пока 0, так как нет реестра)
    document.getElementById('totalClients').textContent = 0;

    // Общее количество отзывов
    let totalReviews = 0;
    Object.keys(data.reviews).forEach(key => {
        totalReviews += data.reviews[key].length;
    });
    document.getElementById('totalReviews').textContent = totalReviews;

    // Общее количество транзакций (пока 0, функционал в разработке)
    document.getElementById('totalTransactions').textContent = 0;
}

// ==================== УПРАВЛЕНИЕ АНКЕТАМИ ====================
function loadProfiles() {
    const data = loadFromLocalStorage();
    const list = document.getElementById('profilesList');

    if (data.profiles.length === 0) {
        list.innerHTML = '<p class="no-data">Анкет не найдено</p>';
        return;
    }

    list.innerHTML = '';

    data.profiles.forEach(profile => {
        const item = document.createElement('div');
        item.className = 'admin-list-item';

        const statusClass = profile.verified ? 'verified' : 'pending';
        const statusText = profile.verified ? 'Проверено' : 'На модерации';

        item.innerHTML = `
            <h3>${profile.name}, ${profile.age} лет</h3>
            <p><strong>ID:</strong> ${profile.id}</p>
            <p><strong>Город:</strong> ${getCityName(profile.city)}</p>
            <p><strong>Цена:</strong> ${profile.price} ₽/час</p>
            <p><strong>Рейтинг:</strong> ${profile.rating ? profile.rating.toFixed(1) : '0.0'} (${profile.reviewCount || 0} отзывов)</p>
            <p><strong>Просмотров:</strong> ${profile.views || 0}</p>
            <p><strong>Статус:</strong> <span class="profile-status ${statusClass}">${statusText}</span></p>
            <p><strong>Создана:</strong> ${new Date(profile.createdAt).toLocaleString('ru-RU')}</p>
            <div class="item-actions">
                ${!profile.verified ? `
                    <button class="btn btn-outline" onclick="approveProfile(${profile.id})">Одобрить</button>
                    <button class="btn btn-outline" onclick="rejectProfile(${profile.id})">Отклонить</button>
                ` : ''}
                <button class="btn btn-outline" onclick="deleteProfile(${profile.id})">Удалить</button>
            </div>
        `;

        list.appendChild(item);
    });
}

async function deleteAllProfiles() {
    const confirmed1 = await showConfirm(
        'Вы уверены, что хотите удалить ВСЕ анкеты?<br><br><strong style="color: #ff9500;">Это действие нельзя отменить!</strong>',
        '⚠️ Удаление всех анкет'
    );

    if (confirmed1) {
        const confirmed2 = await showConfirm(
            'Подтвердите еще раз: удалить все анкеты и отзывы?',
            '⚠️ Последнее предупреждение'
        );

        if (confirmed2) {
            localStorage.setItem('redvelvet_profiles', JSON.stringify([]));
            localStorage.setItem('redvelvet_reviews', JSON.stringify({}));

            loadProfiles();
            loadReviews();
            updateStatistics();
            showToast('Все анкеты и отзывы успешно удалены!', 'success', 4000);
        }
    }
}

async function clearAllData() {
    const confirmed1 = await showConfirm(
        '<strong style="color: #ff3b30;">ВНИМАНИЕ!</strong><br><br>Это удалит <strong>ВСЕ</strong> данные платформы:<br>• Все анкеты<br>• Все отзывы<br>• Всех пользователей<br>• Все настройки<br><br>Продолжить?',
        '🚨 Опасная операция'
    );

    if (confirmed1) {
        const confirmed2 = await showConfirm(
            'Последнее подтверждение:<br><br><strong style="color: #ff3b30;">Удалить все данные?</strong><br><br>Страница будет перезагружена.',
            '🚨 Последнее предупреждение'
        );

        if (confirmed2) {
            localStorage.clear();
            showToast('Все данные успешно удалены! Перезагрузка...', 'success', 2000);
            setTimeout(() => location.reload(), 2000);
        }
    }
}

function approveProfile(profileId) {
    const data = loadFromLocalStorage();
    const profile = data.profiles.find(p => p.id === profileId);

    if (profile) {
        profile.verified = true;
        localStorage.setItem('redvelvet_profiles', JSON.stringify(data.profiles));
        loadProfiles();
        updateStatistics();
        showToast(`Анкета "${profile.name}" успешно одобрена!`, 'success', 4000);
    }
}

async function rejectProfile(profileId) {
    const confirmed = await showConfirm(
        'Вы уверены, что хотите отклонить эту анкету?<br><br>Анкета будет удалена.',
        '⚠️ Отклонение анкеты'
    );

    if (confirmed) {
        // TODO: В будущем добавить систему уведомлений модели о причине отклонения
        deleteProfile(profileId);
    }
}

async function deleteProfile(profileId) {
    const data = loadFromLocalStorage();
    const profile = data.profiles.find(p => p.id === profileId);

    const confirmed = await showConfirm(
        `Вы уверены, что хотите удалить анкету "<strong>${profile ? profile.name : 'Unknown'}</strong>"?<br><br><strong style="color: #ff9500;">Это действие нельзя отменить.</strong>`,
        '⚠️ Удаление анкеты'
    );

    if (confirmed) {
        const updatedProfiles = data.profiles.filter(p => p.id !== profileId);

        localStorage.setItem('redvelvet_profiles', JSON.stringify(updatedProfiles));

        // Также удаляем связанные отзывы
        if (data.reviews[profileId]) {
            delete data.reviews[profileId];
            localStorage.setItem('redvelvet_reviews', JSON.stringify(data.reviews));
        }

        loadProfiles();
        updateStatistics();
        showToast('Анкета успешно удалена!', 'success', 3000);
    }
}

// ==================== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ====================
function loadUsers() {
    const list = document.getElementById('usersList');

    // TODO: В будущем реализовать полноценный реестр пользователей
    list.innerHTML = '<p class="info-text">Функционал в разработке. В будущем здесь будет список всех зарегистрированных пользователей (клиентов и моделей) с возможностью управления.</p>';
}

// ==================== УПРАВЛЕНИЕ ОТЗЫВАМИ ====================
function loadReviews() {
    const data = loadFromLocalStorage();
    const list = document.getElementById('reviewsList');

    let totalReviews = 0;
    Object.keys(data.reviews).forEach(key => {
        totalReviews += data.reviews[key].length;
    });

    if (totalReviews === 0) {
        list.innerHTML = '<p class="no-data">Отзывов не найдено</p>';
        return;
    }

    list.innerHTML = '';

    Object.keys(data.reviews).forEach(profileId => {
        const profile = data.profiles.find(p => p.id === parseInt(profileId));
        const profileName = profile ? profile.name : 'Неизвестная модель';

        data.reviews[profileId].forEach((review, index) => {
            const item = document.createElement('div');
            item.className = 'admin-list-item';

            item.innerHTML = `
                <h3>Отзыв для: ${profileName}</h3>
                <p><strong>Оценка:</strong> ${review.rating} из 5</p>
                <p><strong>Текст:</strong> ${review.text}</p>
                <p><strong>От пользователя:</strong> ${review.userId}</p>
                <p><strong>Дата:</strong> ${new Date(review.date).toLocaleString('ru-RU')}</p>
                <div class="item-actions">
                    <button class="btn btn-outline" onclick="deleteReview(${profileId}, ${index})">Удалить</button>
                </div>
            `;

            list.appendChild(item);
        });
    });
}

async function deleteReview(profileId, reviewIndex) {
    const confirmed = await showConfirm(
        'Вы уверены, что хотите удалить этот отзыв?<br><br>Рейтинг анкеты будет пересчитан.',
        '⚠️ Удаление отзыва'
    );

    if (confirmed) {
        const data = loadFromLocalStorage();

        if (data.reviews[profileId] && data.reviews[profileId][reviewIndex]) {
            data.reviews[profileId].splice(reviewIndex, 1);

            // Пересчитываем рейтинг профиля
            const profile = data.profiles.find(p => p.id === parseInt(profileId));
            if (profile) {
                const reviews = data.reviews[profileId];
                if (reviews.length > 0) {
                    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                    profile.rating = avgRating;
                    profile.reviewCount = reviews.length;
                } else {
                    profile.rating = 0;
                    profile.reviewCount = 0;
                }

                localStorage.setItem('redvelvet_profiles', JSON.stringify(data.profiles));
            }

            localStorage.setItem('redvelvet_reviews', JSON.stringify(data.reviews));

            loadReviews();
            updateStatistics();
            showToast('Отзыв успешно удален!', 'success', 3000);
        }
    }
}

// ==================== ЭКСПОРТ ДАННЫХ ====================
function exportData(type) {
    const data = loadFromLocalStorage();
    let exportData;
    let filename;

    switch(type) {
        case 'profiles':
            exportData = data.profiles;
            filename = 'profiles_export.json';
            break;
        case 'reviews':
            exportData = data.reviews;
            filename = 'reviews_export.json';
            break;
        case 'users':
            exportData = data.users;
            filename = 'users_export.json';
            break;
        default:
            showToast('Неизвестный тип данных', 'error', 3000);
            return;
    }

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = filename;
    link.click();

    showToast(`Данные успешно экспортированы в файл ${filename}`, 'success', 4000);
}

// ==================== УТИЛИТЫ ====================
function getCityName(cityCode) {
    const cities = {
        'moscow': 'Москва',
        'spb': 'Санкт-Петербург',
        'krasnodar': 'Краснодар',
        'sochi': 'Сочи',
        'ekaterinburg': 'Екатеринбург',
        'kazan': 'Казань'
    };

    return cities[cityCode] || cityCode;
}

async function logout() {
    const confirmed = await showConfirm(
        'Вы уверены, что хотите выйти из админ панели?',
        '👋 Выход'
    );

    if (confirmed) {
        showToast('Выход из админ панели...', 'info', 2000);
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    }
}
