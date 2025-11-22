const { query, transaction } = require('../config/database');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

/**
 * SECURITY: Создание профиля модели
 * - Валидация всех входных данных
 * - Защита от SQL injection через prepared statements
 * - Только модели могут создавать профили
 */
const createProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const {
    name, age, city, height, weight, bustSize, eyeColor, hairColor,
    nationality, bodyType, clothingSize, description, price, services, phone
  } = req.body;

  // Проверяем, что пользователь - модель
  if (req.user.userType !== 'model') {
    throw new ApiError(403, 'Only models can create profiles');
  }

  // Проверяем, нет ли уже профиля у этого пользователя
  const existingProfile = await query(
    'SELECT id FROM profiles WHERE user_id = $1',
    [userId]
  );

  if (existingProfile.rows.length > 0) {
    throw new ApiError(409, 'Profile already exists', 'You can only have one profile');
  }

  // Создаем профиль в транзакции
  const result = await transaction(async (client) => {
    // Вставляем профиль
    const profileResult = await client.query(
      `INSERT INTO profiles (
        user_id, name, age, city, height, weight, bust_size, eye_color,
        hair_color, nationality, body_type, clothing_size, description,
        price, services, phone, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        userId, name, age, city, height, weight, bustSize, eyeColor,
        hairColor, nationality, bodyType, clothingSize, description,
        price, services, phone, 'pending'
      ]
    );

    return profileResult.rows[0];
  });

  res.status(201).json({
    message: 'Profile created successfully',
    profile: result
  });
});

/**
 * SECURITY: Получение всех профилей с фильтрацией
 * - Пагинация для защиты от перегрузки
 * - Sanitization фильтров
 */
const getProfiles = asyncHandler(async (req, res) => {
  const {
    city, minAge, maxAge, minPrice, maxPrice, minRating,
    service, page = 1, limit = 20
  } = req.query;

  // Валидация пагинации
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 100); // Максимум 100 результатов
  const offset = (pageNum - 1) * limitNum;

  // Строим WHERE условия
  let whereConditions = ['status = $1']; // Только одобренные профили
  let queryParams = ['approved'];
  let paramIndex = 2;

  if (city) {
    whereConditions.push(`city = $${paramIndex}`);
    queryParams.push(city);
    paramIndex++;
  }

  if (minAge) {
    whereConditions.push(`age >= $${paramIndex}`);
    queryParams.push(parseInt(minAge));
    paramIndex++;
  }

  if (maxAge) {
    whereConditions.push(`age <= $${paramIndex}`);
    queryParams.push(parseInt(maxAge));
    paramIndex++;
  }

  if (minPrice) {
    whereConditions.push(`price >= $${paramIndex}`);
    queryParams.push(parseInt(minPrice));
    paramIndex++;
  }

  if (maxPrice) {
    whereConditions.push(`price <= $${paramIndex}`);
    queryParams.push(parseInt(maxPrice));
    paramIndex++;
  }

  if (minRating) {
    whereConditions.push(`rating >= $${paramIndex}`);
    queryParams.push(parseFloat(minRating));
    paramIndex++;
  }

  if (service) {
    whereConditions.push(`$${paramIndex} = ANY(services)`);
    queryParams.push(service);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // Получаем профили
  const profilesResult = await query(
    `SELECT p.*,
      (SELECT json_agg(json_build_object('id', pi.id, 'url', pi.image_url, 'order', pi.image_order))
       FROM profile_images pi WHERE pi.profile_id = p.id ORDER BY pi.image_order) as images
     FROM profiles p
     WHERE ${whereClause}
     ORDER BY p.rating DESC, p.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...queryParams, limitNum, offset]
  );

  // Получаем общее количество для пагинации
  const countResult = await query(
    `SELECT COUNT(*) FROM profiles WHERE ${whereClause}`,
    queryParams
  );

  const totalCount = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(totalCount / limitNum);

  res.status(200).json({
    profiles: profilesResult.rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages,
      hasMore: pageNum < totalPages
    }
  });
});

/**
 * SECURITY: Получение одного профиля по ID
 * - Увеличение счетчика просмотров
 */
const getProfileById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Получаем профиль с изображениями
  const result = await query(
    `SELECT p.*,
      (SELECT json_agg(json_build_object('id', pi.id, 'url', pi.image_url, 'order', pi.image_order))
       FROM profile_images pi WHERE pi.profile_id = p.id ORDER BY pi.image_order) as images
     FROM profiles p
     WHERE p.id = $1 AND p.status = 'approved'`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Profile not found');
  }

  const profile = result.rows[0];

  // Увеличиваем счетчик просмотров (fire and forget)
  query('UPDATE profiles SET views = views + 1 WHERE id = $1', [id]).catch(err =>
    console.error('Failed to increment views:', err)
  );

  res.status(200).json({
    profile
  });
});

/**
 * SECURITY: Обновление профиля
 * - Только владелец может обновить свой профиль
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  // Проверяем владение профилем
  const profileCheck = await query(
    'SELECT user_id FROM profiles WHERE id = $1',
    [id]
  );

  if (profileCheck.rows.length === 0) {
    throw new ApiError(404, 'Profile not found');
  }

  if (profileCheck.rows[0].user_id !== userId && req.user.userType !== 'admin') {
    throw new ApiError(403, 'You can only update your own profile');
  }

  const {
    name, age, city, height, weight, bustSize, eyeColor, hairColor,
    nationality, bodyType, clothingSize, description, price, services, phone
  } = req.body;

  // Обновляем профиль
  const result = await query(
    `UPDATE profiles SET
      name = COALESCE($1, name),
      age = COALESCE($2, age),
      city = COALESCE($3, city),
      height = COALESCE($4, height),
      weight = COALESCE($5, weight),
      bust_size = COALESCE($6, bust_size),
      eye_color = COALESCE($7, eye_color),
      hair_color = COALESCE($8, hair_color),
      nationality = COALESCE($9, nationality),
      body_type = COALESCE($10, body_type),
      clothing_size = COALESCE($11, clothing_size),
      description = COALESCE($12, description),
      price = COALESCE($13, price),
      services = COALESCE($14, services),
      phone = COALESCE($15, phone),
      status = 'pending'
     WHERE id = $16
     RETURNING *`,
    [
      name, age, city, height, weight, bustSize, eyeColor, hairColor,
      nationality, bodyType, clothingSize, description, price, services, phone, id
    ]
  );

  res.status(200).json({
    message: 'Profile updated successfully. Waiting for moderation.',
    profile: result.rows[0]
  });
});

/**
 * SECURITY: Удаление профиля
 * - Только владелец или админ может удалить профиль
 */
const deleteProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  // Проверяем владение профилем
  const profileCheck = await query(
    'SELECT user_id FROM profiles WHERE id = $1',
    [id]
  );

  if (profileCheck.rows.length === 0) {
    throw new ApiError(404, 'Profile not found');
  }

  if (profileCheck.rows[0].user_id !== userId && req.user.userType !== 'admin') {
    throw new ApiError(403, 'You can only delete your own profile');
  }

  // Удаляем профиль (каскадно удалятся все связанные данные)
  await query('DELETE FROM profiles WHERE id = $1', [id]);

  res.status(200).json({
    message: 'Profile deleted successfully'
  });
});

module.exports = {
  createProfile,
  getProfiles,
  getProfileById,
  updateProfile,
  deleteProfile
};
