'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AppstoreOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  TableOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
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

const STAGES = [
  { key: 'NEW', title: '🆕 Новый', color: '#1677ff', bg: '#e6f4ff' },
  { key: 'IN_PROGRESS', title: '⚡ В работе', color: '#faad14', bg: '#fffbe6' },
  { key: 'NEGOTIATION', title: '💬 Переговоры', color: '#722ed1', bg: '#f9f0ff' },
  { key: 'WON', title: '🎉 Успешно (WON)', color: '#52c41a', bg: '#f6ffed' },
  { key: 'LOST', title: '❌ Отказ (LOST)', color: '#ff4d4f', bg: '#fff2f0' },
];

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads-list', search],
    queryFn: async () => {
      const res = await apiClient.get('/leads', { params: { search } });
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
      const cleanValues: any = {};
      Object.keys(values).forEach((key) => {
        if (values[key] !== '' && values[key] !== null && values[key] !== undefined) {
          cleanValues[key] = values[key];
        }
      });
      return apiClient.post('/leads', cleanValues);
    },
    onSuccess: () => {
      message.success('Лид успешно создан');
      setIsCreateOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['leads-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка при создании лида');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      return apiClient.patch(`/leads/${id}`, values);
    },
    onSuccess: () => {
      message.success('Лид обновлен');
      setEditingLead(null);
      queryClient.invalidateQueries({ queryKey: ['leads-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка при сохранении лида');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiClient.patch(`/leads/${id}`, { status });
    },
    onSuccess: () => {
      message.success('Статус лида изменен');
      queryClient.invalidateQueries({ queryKey: ['leads-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка изменения статуса');
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (leadId: string) => {
      return apiClient.post(`/leads/${leadId}/convert`);
    },
    onSuccess: () => {
      message.success('Лид переведен в Клиенты и создана Сделка (WON)!');
      queryClient.invalidateQueries({ queryKey: ['leads-list'] });
      queryClient.invalidateQueries({ queryKey: ['clients-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка конвертации лида');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/leads/${id}`);
    },
    onSuccess: () => {
      message.success('Лид удален');
      queryClient.invalidateQueries({ queryKey: ['leads-list'] });
    },
    onError: (err: any) => {
      showApiError(err, 'Ошибка удаления лида');
    },
  });

  const handleExport = () => {
    if (!leads || leads.length === 0) return;
    exportToCSV(
      'leads_export',
      leads,
      [
        { key: 'name', title: 'Имя лида' },
        { key: 'phone', title: 'Телефон' },
        { key: 'company', title: 'Компания' },
        { key: 'status', title: 'Этап' },
        { key: 'potentialAmount', title: 'Сумма потенциала' },
        { key: 'source', title: 'Источник' },
        { key: 'interestedIn', title: 'Интерес' },
        { key: 'comment', title: 'Комментарий' },
      ],
    );
  };

  const columns = [
    {
      title: 'Лид / Контакт',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, r: any) => (
        <div>
          <Text strong>{name}</Text>
          {r.company && <div style={{ fontSize: 12, color: '#8c8c8c' }}>🏢 {r.company}</div>}
        </div>
      ),
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '—',
    },
    {
      title: 'Этап воронки',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, r: any) => {
        const stage = STAGES.find((s) => s.key === status);
        return (
          <Select
            value={status}
            size="small"
            style={{ width: 140 }}
            onChange={(newStatus) => updateStatusMutation.mutate({ id: r.id, status: newStatus })}
          >
            {STAGES.map((s) => (
              <Select.Option key={s.key} value={s.key}>
                <span style={{ color: s.color }}>{s.title}</span>
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: 'Потенциал',
      dataIndex: 'potentialAmount',
      key: 'potentialAmount',
      render: (val: any) =>
        val ? (
          <Text strong style={{ color: '#52c41a' }}>
            {Number(val).toLocaleString()} сум
          </Text>
        ) : (
          '—'
        ),
      sorter: (a: any, b: any) => Number(a.potentialAmount || 0) - Number(b.potentialAmount || 0),
    },
    {
      title: 'Источник / Интерес',
      key: 'interest',
      render: (_: any, r: any) => (
        <div>
          {r.source && <Tag color="blue">{r.source}</Tag>}
          {r.interestedIn && <Tag color="purple">{r.interestedIn}</Tag>}
        </div>
      ),
    },
    {
      title: 'Менеджер',
      key: 'assignedTo',
      render: (_: any, r: any) => r.assignedTo?.name || '—',
    },
    {
      title: 'Действия',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          {record.status !== 'WON' && (
            <Popconfirm
              title="Перевести лида в Клиента?"
              onConfirm={() => convertMutation.mutate(record.id)}
              okText="Да, перевести"
              cancelText="Отмена"
            >
              <Button size="small" type="primary" style={{ backgroundColor: '#52c41a' }} icon={<UserAddOutlined />}>
                В Клиенты
              </Button>
            </Popconfirm>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingLead(record);
              editForm.setFieldsValue(record);
            }}
          />
          <Popconfirm
            title="Удалить лида?"
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
            🎯 Воронка Лидов
          </Title>
          <Text type="secondary">Отслеживание потенциальных клиентов и конверсия в сделки</Text>
        </div>
        <Space>
          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as any)}
            options={[
              { value: 'kanban', icon: <AppstoreOutlined />, label: 'Канбан' },
              { value: 'table', icon: <TableOutlined />, label: 'Таблица' },
            ]}
          />
          <Button icon={<DownloadOutlined />} size="large" onClick={handleExport}>
            Экспорт
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            style={{ borderRadius: 8 }}
            onClick={() => setIsCreateOpen(true)}
          >
            Добавить лида
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 20 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="Поиск лидов по имени, телефону, компании или товару..."
          size="large"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 450 }}
        />
      </Card>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" tip="Загрузка воронки лидов..." />
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Pipeline Columns */
        <Row gutter={[16, 16]}>
          {STAGES.map((stage) => {
            const stageLeads = leads?.filter((l: any) => l.status === stage.key) || [];
            return (
              <Col xs={24} sm={12} md={4} key={stage.key} style={{ minWidth: 230 }}>
                <div
                  style={{
                    background: stage.bg,
                    borderRadius: 12,
                    padding: 12,
                    minHeight: 520,
                    border: `1px solid ${stage.color}30`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, color: stage.color }}>{stage.title}</span>
                    <Tag color={stage.color}>{stageLeads.length}</Tag>
                  </div>

                  {stageLeads.map((lead: any) => (
                    <Card
                      key={lead.id}
                      size="small"
                      style={{
                        marginBottom: 10,
                        borderRadius: 8,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        border: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.name}</div>
                        <Space size={2}>
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined style={{ fontSize: 12 }} />}
                            onClick={() => {
                              setEditingLead(lead);
                              editForm.setFieldsValue(lead);
                            }}
                          />
                        </Space>
                      </div>

                      {lead.phone && <div style={{ fontSize: 12, color: '#8c8c8c' }}>📞 {lead.phone}</div>}
                      {lead.company && <div style={{ fontSize: 12, color: '#595959' }}>🏢 {lead.company}</div>}

                      {lead.interestedIn && (
                        <Tag color="blue" style={{ marginTop: 6, fontSize: 11 }}>
                          {lead.interestedIn}
                        </Tag>
                      )}
                      {lead.potentialAmount && (
                        <div style={{ fontWeight: 700, color: '#52c41a', marginTop: 6 }}>
                          {Number(lead.potentialAmount).toLocaleString()} сум
                        </div>
                      )}

                      {/* Stage Selector Dropdown */}
                      <div style={{ marginTop: 8 }}>
                        <Select
                          size="small"
                          value={lead.status}
                          style={{ width: '100%', fontSize: 12 }}
                          onChange={(newStatus) => updateStatusMutation.mutate({ id: lead.id, status: newStatus })}
                        >
                          {STAGES.map((s) => (
                            <Select.Option key={s.key} value={s.key}>
                              {s.title}
                            </Select.Option>
                          ))}
                        </Select>
                      </div>

                      {stage.key !== 'WON' && (
                        <div style={{ marginTop: 8 }}>
                          <Popconfirm
                            title="Конвертировать лида?"
                            description="Перевести в Клиенты и создать Сделку?"
                            okText="Да, перевести"
                            cancelText="Отмена"
                            onConfirm={() => convertMutation.mutate(lead.id)}
                          >
                            <Button
                              type="primary"
                              icon={<UserAddOutlined />}
                              size="small"
                              block
                              style={{
                                borderRadius: 6,
                                background: '#52c41a',
                                fontSize: 12,
                                height: 28,
                              }}
                              loading={convertMutation.isPending}
                            >
                              В Клиенты
                            </Button>
                          </Popconfirm>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </Col>
            );
          })}
        </Row>
      ) : (
        /* Table View */
        <Card style={{ borderRadius: 12 }}>
          <Table dataSource={leads} rowKey="id" columns={columns} pagination={{ pageSize: 15 }} />
        </Card>
      )}

      {/* Create Lead Modal */}
      <Modal title="🎯 Новый лид" open={isCreateOpen} onCancel={() => setIsCreateOpen(false)} footer={null}>
        <Form layout="vertical" form={form} onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item label="Имя / Контактное лицо" name="name" rules={[{ required: true, message: 'Введите имя' }]}>
            <Input placeholder="Анвар Алиев" size="large" />
          </Form.Item>

          <Form.Item label="Телефон" name="phone">
            <Input placeholder="+998901234567" size="large" />
          </Form.Item>

          <Form.Item label="Компания" name="company">
            <Input placeholder="ООО Инновация" size="large" />
          </Form.Item>

          <Form.Item label="Ответственный менеджер" name="assignedToId">
            <Select placeholder="Выберите менеджера" allowClear>
              {(users || []).map((u: any) => (
                <Select.Option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Интересующий товар / услуга" name="interestedIn">
            <Input placeholder="Внедрение CRM / Обслуживание" size="large" />
          </Form.Item>

          <Form.Item label="Потенциальная сумма (сум)" name="potentialAmount">
            <InputNumber style={{ width: '100%' }} size="large" placeholder="1500000" />
          </Form.Item>

          <Form.Item label="Источник" name="source" initialValue="Telegram">
            <Input placeholder="Telegram / Instagram / Звонок" size="large" />
          </Form.Item>

          <Form.Item label="Комментарий" name="comment">
            <Input.TextArea rows={2} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => setIsCreateOpen(false)} style={{ marginRight: 8 }}>
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Создать лида
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Lead Modal */}
      <Modal title="✏️ Редактировать лида" open={!!editingLead} onCancel={() => setEditingLead(null)} footer={null}>
        <Form
          layout="vertical"
          form={editForm}
          onFinish={(values) => updateMutation.mutate({ id: editingLead.id, values })}
        >
          <Form.Item label="Имя / Контактное лицо" name="name" rules={[{ required: true, message: 'Введите имя' }]}>
            <Input size="large" />
          </Form.Item>

          <Form.Item label="Телефон" name="phone">
            <Input size="large" />
          </Form.Item>

          <Form.Item label="Компания" name="company">
            <Input size="large" />
          </Form.Item>

          <Form.Item label="Этап воронки" name="status">
            <Select size="large">
              {STAGES.map((s) => (
                <Select.Option key={s.key} value={s.key}>
                  {s.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Ответственный менеджер" name="assignedToId">
            <Select placeholder="Выберите менеджера" allowClear>
              {(users || []).map((u: any) => (
                <Select.Option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Интересующий товар / услуга" name="interestedIn">
            <Input size="large" />
          </Form.Item>

          <Form.Item label="Потенциальная сумма (сум)" name="potentialAmount">
            <InputNumber style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Form.Item label="Источник" name="source">
            <Input size="large" />
          </Form.Item>

          <Form.Item label="Комментарий" name="comment">
            <Input.TextArea rows={2} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => setEditingLead(null)} style={{ marginRight: 8 }}>
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
