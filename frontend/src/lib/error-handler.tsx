import React from 'react';
import { notification } from 'antd';

const FIELD_NAMES: Record<string, string> = {
  name: 'Имя / Название',
  phone: 'Номер телефона',
  email: 'Email',
  telegram: 'Telegram',
  address: 'Адрес',
  source: 'Источник',
  debt: 'Задолженность',
  assignedToId: 'Ответственный сотрудник',
  amount: 'Сумма',
  price: 'Цена',
  costPrice: 'Себестоимость',
  stock: 'Остаток на складе',
  unit: 'Единица измерения',
  password: 'Пароль',
  oldPassword: 'Текущий пароль',
  newPassword: 'Новый пароль',
  planName: 'Название тарифа',
  periodMonths: 'Периодичность',
  nextPaymentDate: 'Дата следующего платежа',
  startDate: 'Дата начала',
  clientId: 'Клиент',
  leadId: 'Лид',
  productId: 'Товар/Услуга',
  quantity: 'Количество',
  discount: 'Скидка',
  status: 'Статус',
  title: 'Название задачи',
  dueDate: 'Срок выполнения',
  comment: 'Комментарий',
  paymentMethod: 'Способ оплаты',
  category: 'Категория',
  sku: 'Артикул / SKU',
  botToken: 'Токен Telegram-бота',
  chatId: 'ID Telegram-чата',
};

/**
 * Translates common English validation messages into clear Russian explanations
 */
function translateValidationMessage(msg: string): string {
  if (typeof msg !== 'string') return String(msg);

  // If message is already in Russian, return it
  if (/[а-яА-ЯёЁ]/.test(msg)) {
    return msg;
  }

  // Check for field name at the start
  const firstWord = msg.split(' ')[0] || '';
  const translatedFieldName = FIELD_NAMES[firstWord] || `Поле "${firstWord}"`;

  // Common class-validator patterns
  if (msg.includes('must be an email') || msg.includes('email must be')) {
    return 'Некорректный формат адреса электронной почты (email)';
  }
  if (msg.includes('should not be empty') || msg.includes('must not be empty')) {
    return `Обязательное поле «${translatedFieldName}» не заполнено`;
  }
  if (msg.includes('must be longer than or equal to') || msg.includes('must be a string with a length')) {
    return `Значение в «${translatedFieldName}» слишком короткое (проверьте минимальную длину)`;
  }
  if (msg.includes('must be a number') || msg.includes('must be a positive number') || msg.includes('must be a number conforming')) {
    return `Поле «${translatedFieldName}» должно содержать корректное число`;
  }
  if (msg.includes('must not be less than')) {
    return `Поле «${translatedFieldName}» не может быть меньше минимального значения`;
  }
  if (msg.includes('should not exist') || (msg.includes('property') && msg.includes('should not exist'))) {
    return `Передано недопустимое или неизвестное поле: ${firstWord}`;
  }
  if (msg.includes('must be a valid ISO 8601 date string') || msg.includes('must be a Date instance')) {
    return `Поле «${translatedFieldName}» должно содержать корректную дату`;
  }
  if (msg.includes('must be a string')) {
    return `Поле «${translatedFieldName}» должно быть текстовой строкой`;
  }
  if (msg.includes('must be one of the following values')) {
    return `Выбрано недопустимое значение в поле «${translatedFieldName}»`;
  }

  return msg;
}

/**
 * Extracts list of error messages from Axios / NestJS error response
 */
export function extractErrorMessages(error: any): string[] {
  if (!error) return ['Произошла непредвиденная ошибка'];

  const data = error.response?.data;

  if (data) {
    // Array of validation error messages from NestJS ValidationPipe
    if (Array.isArray(data.message) && data.message.length > 0) {
      return data.message.map((m: string) => translateValidationMessage(m));
    }
    // Single message string
    if (typeof data.message === 'string' && data.message.trim() !== '') {
      if (data.message === 'Internal server error') {
        return ['Ошибка на сервере при сохранении данных. Проверьте правильность заполнения полей и связей (например, ответственного сотрудника)'];
      }
      return [translateValidationMessage(data.message)];
    }
    // General error field
    if (typeof data.error === 'string' && data.error !== 'Bad Request' && data.error !== 'Internal Server Error') {
      return [data.error];
    }
  }

  // Network or timeout errors
  if (error.message) {
    if (error.message.includes('Network Error')) {
      return ['Сервер временно недоступен. Проверьте соединение с интернетом или запущен ли backend'];
    }
    if (error.message.includes('timeout')) {
      return ['Превышено время ожидания ответа от сервера'];
    }
    return [error.message];
  }

  return ['Не удалось выполнить запрос. Проверьте введенные данные и повторите попытку'];
}

/**
 * Pops up a prominent Ant Design notification showing exactly what was entered incorrectly
 */
export function showApiError(error: any, customTitle: string = 'Ошибка при заполнении данных') {
  const errors = extractErrorMessages(error);

  notification.error({
    message: customTitle,
    description: (
      <div style={{ marginTop: 4 }}>
        {errors.length === 1 ? (
          <div style={{ fontSize: 13, color: '#cf1322', fontWeight: 500 }}>
            {errors[0]}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
              Обнаружены следующие ошибки в форме:
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#cf1322' }}>
              {errors.map((errText, idx) => (
                <li key={idx} style={{ marginBottom: 3 }}>
                  {errText}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ),
    duration: 6,
    placement: 'topRight',
    style: {
      borderRadius: 10,
      border: '1px solid #ffa39e',
      backgroundColor: '#fff1f0',
    },
  });
}
