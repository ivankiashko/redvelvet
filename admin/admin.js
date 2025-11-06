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
});

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

function approveProfile(profileId) {
    // TODO: Реализовать верификацию анкеты
    const data = loadFromLocalStorage();
    const profile = data.profiles.find(p => p.id === profileId);

    if (profile) {
        profile.verified = true;
        localStorage.setItem('redvelvet_profiles', JSON.stringify(data.profiles));
        loadProfiles();
        updateStatistics();
        alert('Анкета успешно одобрена!');
    }
}

function rejectProfile(profileId) {
    if (confirm('Вы уверены, что хотите отклонить эту анкету?')) {
        // TODO: В будущем добавить систему уведомлений модели о причине отклонения
        deleteProfile(profileId);
    }
}

function deleteProfile(profileId) {
    if (confirm('Вы уверены, что хотите удалить эту анкету? Это действие нельзя отменить.')) {
        const data = loadFromLocalStorage();
        const updatedProfiles = data.profiles.filter(p => p.id !== profileId);

        localStorage.setItem('redvelvet_profiles', JSON.stringify(updatedProfiles));

        // Также удаляем связанные отзывы
        if (data.reviews[profileId]) {
            delete data.reviews[profileId];
            localStorage.setItem('redvelvet_reviews', JSON.stringify(data.reviews));
        }

        loadProfiles();
        updateStatistics();
        alert('Анкета успешно удалена!');
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

function deleteReview(profileId, reviewIndex) {
    if (confirm('Вы уверены, что хотите удалить этот отзыв?')) {
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
            alert('Отзыв успешно удален!');
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
            alert('Неизвестный тип данных');
            return;
    }

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = filename;
    link.click();

    alert('Данные успешно экспортированы!');
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

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        // TODO: В будущем добавить реальную аутентификацию
        window.location.href = '../index.html';
    }
}
