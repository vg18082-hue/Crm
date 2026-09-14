'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckOutlined,
  CheckSquareOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
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
import { exportToCSV } from '@/lib/export-csv';
import { showApiError } from '@/lib/error-handler';

const { Title, Text } = Typography;
const { Option } = Select;

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks-list', overdueOnly],
    queryFn: async () => {
      const res = await apiClient.get('/tasks', { params: { overdueOnly } });
      return res.data;
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-select'],
    queryFn: async () => {
      const res = await apiClient.get('/clients');
      return res.data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
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
      showApiError(err, 'Ошибка создания задачи');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const payload = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
      };
      return apiClient.patch(`/tasks/${id}`, payload);
    },
    onSuccess: () => {
      message.success('Задача обновлена');
      setEditingTask(null);
      queryClient.invalidateQueries({ queryKey: ['tasks-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка при сохранении задачи');
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
    onError: (err: any) => {
      showApiError(err, 'Ошибка изменения статуса задачи');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      message.success('Задача удалена');
      queryClient.invalidateQueries({ queryKey: ['tasks-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка удаления задачи');
    },
  });

  const handleExport = () => {
    if (!tasks || tasks.length === 0) return;
    exportToCSV(
      'tasks_export',
      tasks.map((t: any) => ({
        title: t.title,
        type: t.type,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate ? dayjs(t.dueDate).format('DD.MM.YYYY HH:mm') : '—',
        assigneeName: t.assignedTo?.name || '—',
        clientName: t.client?.name || '—',
        comment: t.comment || '—',
      })),
      [
        { key: 'title', title: 'Задача' },
        { key: 'type', title: 'Тип' },
        { key: 'priority', title: 'Приоритет' },
        { key: 'status', title: 'Статус' },
        { key: 'dueDate', title: 'Дедлайн' },
        { key: 'assigneeName', title: 'Исполнитель' },
        { key: 'clientName', title: 'Клиент' },
        { key: 'comment', title: 'Комментарий' },
      ],
    );
  };

  const columns = [
    {
      title: 'Задача',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          {record.client && <div style={{ fontSize: 12, color: '#1677ff' }}>👤 Клиент: {record.client.name}</div>}
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
      title: 'Исполнитель',
      key: 'assignee',
      render: (_: any, r: any) => r.assignedTo?.name || '—',
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
    {
      title: 'Действия',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          {record.status !== 'COMPLETED' && (
            <Button
              size="small"
              type="primary"
              style={{ backgroundColor: '#52c41a' }}
              icon={<CheckOutlined />}
              onClick={() => updateStatusMutation.mutate({ id: record.id, status: 'COMPLETED' })}
            >
              Выполнить
            </Button>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingTask(record);
              editForm.setFieldsValue({
                ...record,
                dueDate: record.dueDate ? dayjs(record.dueDate) : undefined,
              });
            }}
          />
          <Popconfirm
            title="Удалить задачу?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Да"
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
            📋 Задачи и Напоминания
          </Title>
          <Text type="secondary">Звонки, сообщения, перезвоны и контроль выполнения</Text>
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
            Новая задача
          </Button>
        </Space>
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Тип задачи" name="type" initialValue="CALL">
                <Select size="large">
                  <Option value="CALL">📞 Звонок</Option>
                  <Option value="MESSAGE">💬 Сообщение</Option>
                  <Option value="CALLBACK">🔄 Перезвонить</Option>
                  <Option value="ORDER_PROCESSING">🛍 Оформление заказа</Option>
                  <Option value="OTHER">📌 Другое</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Приоритет" name="priority" initialValue="MEDIUM">
                <Select size="large">
                  <Option value="LOW">Низкий</Option>
                  <Option value="MEDIUM">Средний</Option>
                  <Option value="HIGH">Высокий</Option>
                  <Option value="URGENT">🔥 Срочно</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Клиент (связать)" name="clientId">
                <Select placeholder="Выберите клиента" size="large" allowClear showSearch optionFilterProp="children">
                  {clients?.map((c: any) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Исполнитель" name="assignedToId">
                <Select placeholder="Сотрудник" size="large" allowClear>
                  {users?.map((u: any) => (
                    <Option key={u.id} value={u.id}>
                      {u.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

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

      {/* Edit Task Modal */}
      <Modal title="✏️ Редактировать задачу" open={!!editingTask} onCancel={() => setEditingTask(null)} footer={null}>
        <Form
          layout="vertical"
          form={editForm}
          onFinish={(values) => updateMutation.mutate({ id: editingTask.id, values })}
        >
          <Form.Item label="Заголовок задачи" name="title" rules={[{ required: true, message: 'Введите заголовок' }]}>
            <Input size="large" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Тип задачи" name="type">
                <Select size="large">
                  <Option value="CALL">📞 Звонок</Option>
                  <Option value="MESSAGE">💬 Сообщение</Option>
                  <Option value="CALLBACK">🔄 Перезвонить</Option>
                  <Option value="ORDER_PROCESSING">🛍 Оформление заказа</Option>
                  <Option value="OTHER">📌 Другое</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Приоритет" name="priority">
                <Select size="large">
                  <Option value="LOW">Низкий</Option>
                  <Option value="MEDIUM">Средний</Option>
                  <Option value="HIGH">Высокий</Option>
                  <Option value="URGENT">🔥 Срочно</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Клиент" name="clientId">
                <Select placeholder="Выберите клиента" size="large" allowClear showSearch optionFilterProp="children">
                  {clients?.map((c: any) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Исполнитель" name="assignedToId">
                <Select placeholder="Сотрудник" size="large" allowClear>
                  {users?.map((u: any) => (
                    <Option key={u.id} value={u.id}>
                      {u.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Срок выполнения" name="dueDate">
            <DatePicker style={{ width: '100%' }} size="large" showTime format="DD.MM.YYYY HH:mm" />
          </Form.Item>

          <Form.Item label="Детали / Комментарий" name="comment">
            <Input.TextArea rows={2} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => setEditingTask(null)} style={{ marginRight: 8 }}>
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
