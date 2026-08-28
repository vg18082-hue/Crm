'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightOutlined, PlusOutlined, UserAddOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/api-client';

const { Title, Text } = Typography;
const { Option } = Select;

const STAGES = [
  { key: 'NEW', title: '🆕 Новый', color: '#1677ff', bg: '#e6f4ff' },
  { key: 'IN_PROGRESS', title: '⚡ В работе', color: '#faad14', bg: '#fffbe6' },
  { key: 'NEGOTIATION', title: '💬 Переговоры', color: '#722ed1', bg: '#f9f0ff' },
  { key: 'WON', title: '🎉 Успешно (WON)', color: '#52c41a', bg: '#f6ffed' },
  { key: 'LOST', title: '❌ Отказ (LOST)', color: '#ff4d4f', bg: '#fff2f0' },
];

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads-list'],
    queryFn: async () => {
      const res = await apiClient.get('/leads');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      // Clean up empty string fields so backend validators don't fail
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
      const msg = err.response?.data?.message;
      const detail = Array.isArray(msg) ? msg.join(', ') : msg;
      message.error(detail || 'Ошибка создания лида');
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (leadId: string) => {
      return apiClient.post(`/leads/${leadId}/convert`);
    },
    onSuccess: () => {
      message.success('Лид переведен в Клиенты и создана Сделка (WON)!');
      queryClient.invalidateQueries({ queryKey: ['leads-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка конвертации');
    },
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" tip="Загрузка воронки лидов..." />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            🎯 Воронка Лидов
          </Title>
          <Text type="secondary">Отслеживание потенциальных клиентов и конверсия в сделки</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ borderRadius: 8 }}
          onClick={() => setIsCreateOpen(true)}
        >
          Добавить лида
        </Button>
      </div>

      {/* Kanban Pipeline Columns */}
      <Row gutter={[16, 16]}>
        {STAGES.map((stage) => {
          const stageLeads = leads?.filter((l: any) => l.status === stage.key) || [];
          return (
            <Col xs={24} sm={12} md={4} key={stage.key} style={{ minWidth: 220 }}>
              <div
                style={{
                  background: stage.bg,
                  borderRadius: 12,
                  padding: 12,
                  minHeight: 500,
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
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.name}</div>
                    {lead.phone && <div style={{ fontSize: 12, color: '#8c8c8c' }}>{lead.phone}</div>}
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

                    {stage.key !== 'WON' && (
                      <div style={{ marginTop: 10 }}>
                        <Popconfirm
                          title="Конвертировать лида?"
                          description="Перевести лида в Клиенты и создать Сделку?"
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
                              height: 32,
                              whiteSpace: 'normal',
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

      {/* Create Lead Modal */}
      <Modal title="🎯 Новый лид" open={isCreateOpen} onCancel={() => setIsCreateOpen(false)} footer={null}>
        <Form layout="vertical" form={form} onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item label="Имя / Контактное лицо" name="name" rules={[{ required: true, message: 'Введите имя' }]}>
            <Input placeholder="Анвар Алиев" size="large" />
          </Form.Item>

          <Form.Item
            label="Телефон"
            name="phone"
            rules={[
              {
                pattern: /^\+?[0-9\s\-\(\)]{7,20}$/,
                message: 'Вы ввели неправильный номер телефона',
              },
            ]}
          >
            <Input placeholder="+998901234567" size="large" />
          </Form.Item>

          <Form.Item label="Компания" name="company">
            <Input placeholder="ООО Инновация" size="large" />
          </Form.Item>

          <Form.Item label="Интересующий товар / услуга" name="interestedIn">
            <Input placeholder="Внедрение CRM / Обслуживание" size="large" />
          </Form.Item>

          <Form.Item
            label="Потенциальная сумма (сум)"
            name="potentialAmount"
            rules={[
              {
                type: 'number',
                min: 0,
                message: 'Потенциальная сумма должна быть числом',
              },
            ]}
          >
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
    </div>
  );
}
