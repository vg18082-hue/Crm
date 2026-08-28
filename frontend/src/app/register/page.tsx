'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BankOutlined, LockOutlined, MailOutlined, RocketOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const onFinish = async (values: any) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.post('/auth/register', values);
      login(res.data.accessToken, res.data.user);
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Ошибка регистрации компании.');
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
          width: 460,
          borderRadius: 16,
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
          border: 'none',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
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
            Регистрация компании
          </Title>
          <Text type="secondary">Создайте бесплатный аккаунт компании в CRM</Text>
        </div>

        {errorMsg && (
          <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 20, borderRadius: 8 }} />
        )}

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            label="Название вашей компании (Tenant)"
            name="companyName"
            rules={[{ required: true, message: 'Введите название компании' }]}
          >
            <Input prefix={<BankOutlined style={{ color: '#bfbfbf' }} />} placeholder="Например: Qave Tech" />
          </Form.Item>

          <Form.Item
            label="ФИО Администратора"
            name="name"
            rules={[{ required: true, message: 'Введите ваше имя' }]}
          >
            <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Владислав Петров" />
          </Form.Item>

          <Form.Item
            label="Рабочий Email"
            name="email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Некорректный формат email' },
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="admin@company.com" />
          </Form.Item>

          <Form.Item
            label="Пароль"
            name="password"
            rules={[
              { required: true, message: 'Введите пароль' },
              { min: 6, message: 'Минимум 6 символов' },
            ]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Минимум 6 символов" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ borderRadius: 8, height: 44 }}>
              Зарегистрировать компанию
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Text type="secondary">Уже есть аккаунт? </Text>
            <Link href="/login" style={{ color: '#1677ff', fontWeight: 600 }}>
              Войти в систему
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
