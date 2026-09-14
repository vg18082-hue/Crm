'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export-csv';
import { showApiError } from '@/lib/error-handler';

const { Title, Text } = Typography;
const { Option } = Select;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

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
      showApiError(err, 'Ошибка создания сотрудника');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      return apiClient.patch(`/users/${id}`, values);
    },
    onSuccess: () => {
      message.success('Данные сотрудника обновлены');
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка при сохранении сотрудника');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/users/${id}`);
    },
    onSuccess: () => {
      message.success('Сотрудник удален');
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка удаления сотрудника');
    },
  });

  const handleExport = () => {
    if (!users || users.length === 0) return;
    exportToCSV(
      'users_staff_export',
      users.map((u: any) => ({
        name: u.name,
        email: u.email,
        role: u.role,
        clientsCount: u._count?.assignedClients || 0,
        leadsCount: u._count?.assignedLeads || 0,
        salesCount: u._count?.assignedSales || 0,
        tasksCount: u._count?.tasks || 0,
      })),
      [
        { key: 'name', title: 'ФИО сотрудника' },
        { key: 'email', title: 'Email' },
        { key: 'role', title: 'Роль' },
        { key: 'clientsCount', title: 'Закреплено клиентов' },
        { key: 'leadsCount', title: 'Лидов в работе' },
        { key: 'salesCount', title: 'Оформлено продаж' },
        { key: 'tasksCount', title: 'Задач' },
      ],
    );
  };

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
          CASHIER: { color: 'green', label: '💵 Кассир (Касса и продажи)' },
        };
        const conf = rolesMap[role] || { color: 'default', label: role };
        return <Tag color={conf.color}>{conf.label}</Tag>;
      },
    },
    {
      title: 'Нагрузка / Объекты',
      key: 'stats',
      render: (_: any, record: any) => (
        <Space size={6}>
          <Tag color="cyan">👥 {record._count?.assignedClients || 0} клиентов</Tag>
          <Tag color="blue">🎯 {record._count?.assignedLeads || 0} лидов</Tag>
          <Tag color="green">💰 {record._count?.assignedSales || 0} продаж</Tag>
          <Tag color="orange">📋 {record._count?.tasks || 0} задач</Tag>
        </Space>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingUser(record);
              editForm.setFieldsValue({
                name: record.name,
                role: record.role,
              });
            }}
          />
          <Popconfirm
            title="Удалить сотрудника?"
            description="Сотрудник потеряет доступ к CRM."
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Да, удалить"
            cancelText="Отмена"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            👥 Управление Сотрудниками
          </Title>
          <Text type="secondary">Кадры компании, распределение нагрузки и роли доступа (RBAC)</Text>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />} size="large" onClick={handleExport}>
            Экспорт в CSV
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            style={{ borderRadius: 8 }}
            onClick={() => setIsCreateOpen(true)}
          >
            Добавить сотрудника
          </Button>
        </Space>
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

      {/* Edit Staff Modal */}
      <Modal
        title="✏️ Редактировать сотрудника"
        open={!!editingUser}
        onCancel={() => setEditingUser(null)}
        footer={null}
      >
        <Form
          layout="vertical"
          form={editForm}
          onFinish={(values) => updateMutation.mutate({ id: editingUser.id, values })}
        >
          <Form.Item label="ФИО сотрудника" name="name" rules={[{ required: true, message: 'Введите имя' }]}>
            <Input size="large" />
          </Form.Item>

          <Form.Item label="Роль сотрудника" name="role">
            <Select size="large">
              <Option value="ADMIN">👑 Администратор (Полный доступ)</Option>
              <Option value="MANAGER_HEAD">💼 Руководитель отдела</Option>
              <Option value="MANAGER">👨‍💼 Менеджер (Свои клиенты и лиды)</Option>
              <Option value="CASHIER">💵 Кассир (Касса, продажи и чеки)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Сбросить пароль (оставьте пустым, если не меняете)"
            name="password"
          >
            <Input.Password placeholder="Новый пароль" size="large" />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => setEditingUser(null)} style={{ marginRight: 8 }}>
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
              Сохранить
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
