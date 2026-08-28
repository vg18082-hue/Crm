'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { apiClient } from '@/lib/api-client';

const { Title, Text } = Typography;
const { Option } = Select;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiClient.post('/users', values);
    },
    onSuccess: () => {
      message.success('Сотрудник успешно добавлен');
      setIsCreateOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка создания сотрудника');
    },
  });

  const columns = [
    {
      title: 'Сотрудник',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />}>
            {text?.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Роль и права доступа',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const rolesMap: any = {
          ADMIN: { color: 'gold', label: '👑 Администратор (Полный доступ)' },
          MANAGER_HEAD: { color: 'purple', label: '💼 Руководитель отдела' },
          MANAGER: { color: 'blue', label: '👨‍💼 Менеджер по продажам' },
          CASHIER: { color: 'green', label: '💵 Кассир (Продажи и чеки)' },
        };
        const conf = rolesMap[role] || { color: 'default', label: role };
        return <Tag color={conf.color}>{conf.label}</Tag>;
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            👥 Управление Сотрудниками
          </Title>
          <Text type="secondary">Кадры компании и назначение ролей доступа (RBAC)</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ borderRadius: 8 }}
          onClick={() => setIsCreateOpen(true)}
        >
          Добавить сотрудника
        </Button>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={users} rowKey="id" columns={columns} loading={isLoading} pagination={false} />
      </Card>

      {/* Create Staff Modal */}
      <Modal title="👤 Добавить сотрудника" open={isCreateOpen} onCancel={() => setIsCreateOpen(false)} footer={null}>
        <Form layout="vertical" form={form} onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item label="ФИО сотрудника" name="name" rules={[{ required: true, message: 'Введите имя' }]}>
            <Input placeholder="Иван Иванов" size="large" />
          </Form.Item>

          <Form.Item
            label="Email для входа"
            name="email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Некорректный email' },
            ]}
          >
            <Input placeholder="manager@company.com" size="large" />
          </Form.Item>

          <Form.Item
            label="Пароль"
            name="password"
            rules={[
              { required: true, message: 'Введите пароль' },
              { min: 6, message: 'Минимум 6 символов' },
            ]}
          >
            <Input.Password placeholder="Минимум 6 символов" size="large" />
          </Form.Item>

          <Form.Item label="Роль сотрудника" name="role" initialValue="MANAGER">
            <Select size="large">
              <Option value="ADMIN">👑 Администратор (Полный доступ)</Option>
              <Option value="MANAGER_HEAD">💼 Руководитель отдела</Option>
              <Option value="MANAGER">👨‍💼 Менеджер (Свои клиенты и лиды)</Option>
              <Option value="CASHIER">💵 Кассир (Касса, продажи и чеки)</Option>
            </Select>
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => setIsCreateOpen(false)} style={{ marginRight: 8 }}>
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Создать сотрудника
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
