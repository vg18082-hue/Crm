'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckSquareOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/api-client';

const { Title, Text } = Typography;
const { Option } = Select;

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks-list', overdueOnly],
    queryFn: async () => {
      const res = await apiClient.get('/tasks', { params: { overdueOnly } });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
      };
      return apiClient.post('/tasks', payload);
    },
    onSuccess: () => {
      message.success('Задача создана');
      setIsCreateOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['tasks-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка создания задачи');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiClient.patch(`/tasks/${id}`, { status });
    },
    onSuccess: () => {
      message.success('Статус задачи обновлен');
      queryClient.invalidateQueries({ queryKey: ['tasks-list'] });
    },
  });

  const columns = [
    {
      title: 'Задача',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          {record.comment && <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.comment}</div>}
        </div>
      ),
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typesMap: any = {
          CALL: '📞 Звонок',
          MESSAGE: '💬 Сообщение',
          CALLBACK: '🔄 Перезвонить',
          ORDER_PROCESSING: '🛍 Оформление заказа',
          OTHER: '📌 Другое',
        };
        return <Tag color="blue">{typesMap[type] || type}</Tag>;
      },
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const colors: any = { LOW: 'default', MEDIUM: 'blue', HIGH: 'orange', URGENT: 'red' };
        return <Tag color={colors[priority]}>{priority}</Tag>;
      },
    },
    {
      title: 'Срок (Дедлайн)',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => {
        if (!date) return '—';
        const isOverdue = dayjs(date).isBefore(dayjs());
        return (
          <Tag color={isOverdue ? 'error' : 'processing'}>
            {dayjs(date).format('DD.MM.YYYY HH:mm')}
          </Tag>
        );
      },
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => (
        <Select
          value={status}
          size="small"
          style={{ width: 140 }}
          onChange={(newStatus) => updateStatusMutation.mutate({ id: record.id, status: newStatus })}
        >
          <Option value="TODO">📝 К исполнению</Option>
          <Option value="IN_PROGRESS">⚡ В работе</Option>
          <Option value="COMPLETED">🟢 Завершена</Option>
          <Option value="CANCELLED">🔴 Отменена</Option>
        </Select>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            📋 Задачи и Напоминания
          </Title>
          <Text type="secondary">Звонки, сообщения, перезвоны и контроль выполнения</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ borderRadius: 8 }}
          onClick={() => setIsCreateOpen(true)}
        >
          Новая задача
        </Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 20 }}>
        <Space>
          <span>Только просроченные задачи:</span>
          <Switch checked={overdueOnly} onChange={(checked) => setOverdueOnly(checked)} />
        </Space>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={tasks} rowKey="id" columns={columns} loading={isLoading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Create Task Modal */}
      <Modal title="📋 Новая задача" open={isCreateOpen} onCancel={() => setIsCreateOpen(false)} footer={null}>
        <Form layout="vertical" form={form} onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item label="Заголовок задачи" name="title" rules={[{ required: true, message: 'Введите заголовок' }]}>
            <Input placeholder="Перезвонить клиенту по поводу договора" size="large" />
          </Form.Item>

          <Form.Item label="Тип задачи" name="type" initialValue="CALL">
            <Select size="large">
              <Option value="CALL">📞 Звонок</Option>
              <Option value="MESSAGE">💬 Сообщение</Option>
              <Option value="CALLBACK">🔄 Перезвонить</Option>
              <Option value="ORDER_PROCESSING">🛍 Оформление заказа</Option>
              <Option value="OTHER">📌 Другое</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Приоритет" name="priority" initialValue="MEDIUM">
            <Select size="large">
              <Option value="LOW">Низкий</Option>
              <Option value="MEDIUM">Средний</Option>
              <Option value="HIGH">Высокий</Option>
              <Option value="URGENT">🔥 Срочно</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Срок выполнения (Дедлайн)" name="dueDate">
            <DatePicker style={{ width: '100%' }} size="large" showTime format="DD.MM.YYYY HH:mm" />
          </Form.Item>

          <Form.Item label="Детали / Комментарий" name="comment">
            <Input.TextArea rows={2} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => setIsCreateOpen(false)} style={{ marginRight: 8 }}>
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Создать задачу
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
