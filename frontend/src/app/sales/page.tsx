'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/api-client';

const { Title, Text } = Typography;
const { Option } = Select;

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form] = Form.useForm();
  const items: any[] = Form.useWatch('items', form) || [];

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales-list'],
    queryFn: async () => {
      const res = await apiClient.get('/sales');
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

  const { data: products } = useQuery({
    queryKey: ['products-select'],
    queryFn: async () => {
      const res = await apiClient.get('/products');
      return res.data;
    },
  });

  // Calc totals from items
  const subtotal = items.reduce((sum: number, item: any) => {
    const qty = Number(item?.quantity) || 0;
    const price = Number(item?.price) || 0;
    const disc = Number(item?.discount) || 0;
    return sum + qty * price - disc;
  }, 0);
  const globalDiscount = Number(form.getFieldValue('discount')) || 0;
  const total = Math.max(0, subtotal - globalDiscount);

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      // Remove amount — it's calculated on the backend from items
      const { amount: _amount, ...rest } = values;
      return apiClient.post('/sales', rest);
    },
    onSuccess: () => {
      message.success('Продажа успешно оформлена');
      setIsCreateOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['sales-list'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      message.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Ошибка оформления продажи');
    },
  });

  const handleProductSelect = (productId: string, fieldName: number) => {
    const product = products?.find((p: any) => p.id === productId);
    if (!product) return;
    const current = form.getFieldValue('items') || [];
    current[fieldName] = {
      ...current[fieldName],
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      discount: 0,
    };
    form.setFieldsValue({ items: current });
  };

  const columns = [
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Клиент',
      dataIndex: ['client', 'name'],
      key: 'client',
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: 'Сумма сделки',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: any) => <span style={{ fontWeight: 700, color: '#52c41a' }}>{Number(amount).toLocaleString()} сум</span>,
    },
    {
      title: 'Способ оплаты',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => <Tag color="blue">{method}</Tag>,
    },
    {
      title: 'Статус оплаты',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'PAID' ? 'success' : 'warning'}>
          {status === 'PAID' ? '🟢 Оплачено' : '🟡 Ожидает оплаты'}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            💰 Модуль Продаж
          </Title>
          <Text type="secondary">Оформление сделок, расчет стоимости и статус платежей</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ borderRadius: 8 }}
          onClick={() => setIsCreateOpen(true)}
        >
          Новая продажа
        </Button>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={sales} rowKey="id" columns={columns} loading={isLoading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Create Sale Modal */}
      <Modal
        title="💰 Оформить продажу"
        open={isCreateOpen}
        onCancel={() => { setIsCreateOpen(false); form.resetFields(); }}
        footer={null}
        width={720}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={(values) => createMutation.mutate(values)}
          initialValues={{ discount: 0, paymentMethod: 'CASH', status: 'PENDING', items: [{ quantity: 1, price: 0, discount: 0 }] }}
        >
          <Form.Item label="Клиент" name="clientId" rules={[{ required: true, message: 'Выберите клиента' }]}>
            <Select placeholder="Выберите клиента из базы" size="large" showSearch optionFilterProp="children">
              {clients?.map((c: any) => (
                <Option key={c.id} value={c.id}>
                  {c.name} ({c.phone || 'Без телефона'})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider orientation="left" style={{ fontSize: 13, marginBottom: 8 }}>
            🛒 Позиции (товары / услуги)
          </Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 10, background: '#fafafa', borderRadius: 8 }}
                    extra={
                      fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        />
                      )
                    }
                    title={<Text style={{ fontSize: 12, color: '#888' }}>Позиция {name + 1}</Text>}
                  >
                    <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
                      <Form.Item
                        {...restField}
                        name={[name, 'productId']}
                        style={{ flex: 1, marginBottom: 0 }}
                        label="Товар из каталога"
                      >
                        <Select
                          placeholder="Выбрать товар (необязательно)"
                          allowClear
                          showSearch
                          optionFilterProp="children"
                          onChange={(val) => handleProductSelect(val, name)}
                        >
                          {products?.map((p: any) => (
                            <Option key={p.id} value={p.id}>
                              {p.name} — {Number(p.price).toLocaleString()} сум
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Space.Compact>

                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      label="Название позиции"
                      rules={[{ required: true, message: 'Введите название' }]}
                      style={{ marginBottom: 8 }}
                    >
                      <Input placeholder="Например: Разработка сайта" />
                    </Form.Item>

                    <Space style={{ width: '100%' }} styles={{ item: { flex: 1 } }}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        label="Кол-во"
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'price']}
                        label="Цена за ед. (сум)"
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber min={0} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'discount']}
                        label="Скидка (сум)"
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Space>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add({ quantity: 1, price: 0, discount: 0 })}
                  block
                  icon={<PlusOutlined />}
                  style={{ marginBottom: 16 }}
                >
                  Добавить позицию
                </Button>
              </>
            )}
          </Form.List>

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Общая скидка (сум)" name="discount" style={{ flex: 1, marginBottom: 8 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Способ оплаты" name="paymentMethod" style={{ flex: 1, marginBottom: 8 }}>
              <Select>
                <Option value="CASH">Наличные</Option>
                <Option value="CARD">Банковская карта</Option>
                <Option value="TRANSFER">Перевод на расчетный счет</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Статус оплаты" name="status" style={{ flex: 1, marginBottom: 8 }}>
              <Select>
                <Option value="PENDING">🟡 Ожидает оплаты</Option>
                <Option value="PAID">🟢 Оплачено полностью</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item label="Комментарий к продаже" name="comment" style={{ marginBottom: 8 }}>
            <Input.TextArea rows={2} />
          </Form.Item>

          {/* Total summary */}
          <Card
            size="small"
            style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, marginBottom: 16 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: 12 }}>Сумма позиций: {subtotal.toLocaleString()} сум</Text>
                {globalDiscount > 0 && (
                  <Text type="secondary" style={{ fontSize: 12 }}>Общая скидка: −{globalDiscount.toLocaleString()} сум</Text>
                )}
              </Space>
              <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Итого к оплате:</Text>
                <div style={{ fontWeight: 800, fontSize: 20, color: '#389e0d' }}>{total.toLocaleString()} сум</div>
              </div>
            </div>
          </Card>

          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => { setIsCreateOpen(false); form.resetFields(); }} style={{ marginRight: 8 }}>
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Оформить продажу
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
