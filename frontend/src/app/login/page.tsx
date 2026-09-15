'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LockOutlined, MailOutlined, RocketOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Modal, Space, Typography, message } from 'antd';
import { apiClient, getApiBaseUrl } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { showApiError } from '@/lib/error-handler';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiForm] = Form.useForm();
  const router = useRouter();
  const { login } = useAuth();

  const onFinish = async (values: any) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.post('/auth/login', values);
      login(res.data.accessToken, res.data.user);
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Ошибка входа. Проверьте данные.');
      showApiError(err, 'Ошибка входа в систему');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #001529 0%, #003a8c 100%)',
        padding: 20,
      }}
    >
      <Card
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
          border: 'none',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#e6f4ff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <RocketOutlined style={{ fontSize: 28, color: '#1677ff' }} />
          </div>
          <Title level={3} style={{ margin: 0 }}>
            Вход в CRM SaaS
          </Title>
          <Text type="secondary">Управление бизнесом и абонентскими платежами</Text>
        </div>

        {errorMsg && (
          <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 20, borderRadius: 8 }} />
        )}

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Некорректный формат email' },
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="Ваш Email" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: 'Введите пароль' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Пароль" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ borderRadius: 8, height: 44 }}>
              Войти в систему
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Text type="secondary">Еще нет аккаунта компании? </Text>
            <Link href="/register" style={{ color: '#1677ff', fontWeight: 600 }}>
              Зарегистрировать бизнес
            </Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <Button
              type="link"
              size="small"
              onClick={() => {
                apiForm.setFieldsValue({ apiUrl: getApiBaseUrl() });
                setIsApiModalOpen(true);
              }}
              style={{ color: '#8c8c8c', fontSize: 12 }}
            >
              ⚙️ Настроить адрес сервера API
            </Button>
          </div>
        </Form>
      </Card>

      {/* API Server URL Modal */}
      <Modal
        title="⚙️ Настройка адреса сервера API"
        open={isApiModalOpen}
        onCancel={() => setIsApiModalOpen(false)}
        footer={null}
        width={480}
      >
        <Form
          form={apiForm}
          layout="vertical"
          onFinish={(values) => {
            const url = (values.apiUrl || '').trim().replace(/\/+$/, '');
            if (url) {
              localStorage.setItem('custom_api_url', url);
              message.success(`Адрес сервера сохранен: ${url}`);
              setIsApiModalOpen(false);
              setTimeout(() => window.location.reload(), 300);
            }
          }}
        >
          <Alert
            message="URL сервера бэкенда"
            description="Если вы используете Render, вставьте публичный URL бэкенда (например: https://crm-backend-xxxx.onrender.com)."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form.Item
            label="URL бэкенда"
            name="apiUrl"
            rules={[{ required: true, message: 'Укажите URL сервера бэкенда' }]}
          >
            <Input placeholder="https://crm-backend-xxxx.onrender.com" size="large" />
          </Form.Item>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button
              onClick={() => {
                localStorage.removeItem('custom_api_url');
                message.info('Сброшено');
                setIsApiModalOpen(false);
                setTimeout(() => window.location.reload(), 300);
              }}
            >
              Сбросить
            </Button>
            <Button type="primary" htmlType="submit">
              Сохранить и применить
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
