'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppstoreOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
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
import { apiClient } from '@/lib/api-client';

const { Title, Text } = Typography;
const { Option } = Select;

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products-list', search],
    queryFn: async () => {
      const res = await apiClient.get('/products', { params: { search } });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiClient.post('/products', values);
    },
    onSuccess: () => {
      message.success('Товар / услуга успешно добавлена');
      setIsCreateOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка создания позиций');
    },
  });

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'PRODUCT' ? 'blue' : 'purple'}>
          {type === 'PRODUCT' ? '📦 Товар' : '⚙️ Услуга'}
        </Tag>
      ),
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => (cat ? <Tag color="cyan">{cat}</Tag> : '—'),
    },
    {
      title: 'Артикул (SKU)',
      dataIndex: 'sku',
      key: 'sku',
      render: (sku: string) => (sku ? <code>{sku}</code> : '—'),
    },
    {
      title: 'Продажная цена',
      dataIndex: 'price',
      key: 'price',
      render: (price: any) => <span style={{ fontWeight: 700, color: '#52c41a' }}>{Number(price).toLocaleString()} сум</span>,
    },
    {
      title: 'Остаток на складе',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record: any) =>
        record.type === 'SERVICE' ? (
          <Text type="secondary">Не ограничено</Text>
        ) : (
          <Tag color={stock > 0 ? 'green' : 'red'}>{stock} {record.unit || 'шт'}</Tag>
        ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            📦 Товары и Услуги
          </Title>
          <Text type="secondary">Каталог товаров, остатки на складе и прайс-лист услуг</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ borderRadius: 8 }}
          onClick={() => setIsCreateOpen(true)}
        >
          Добавить позицию
        </Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 20 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="Поиск по названию, артикулу (SKU), категории..."
          size="large"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 450 }}
        />
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={products} rowKey="id" columns={columns} loading={isLoading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Create Product Modal */}
      <Modal title="✨ Добавить позицию в каталог" open={isCreateOpen} onCancel={() => setIsCreateOpen(false)} footer={null}>
        <Form layout="vertical" form={form} onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item label="Название" name="name" rules={[{ required: true, message: 'Введите название' }]}>
            <Input placeholder="Серверный модуль Pro" size="large" />
          </Form.Item>

          <Form.Item label="Тип" name="type" initialValue="PRODUCT">
            <Select size="large">
              <Option value="PRODUCT">📦 Товар (Физический остаток)</Option>
              <Option value="SERVICE">⚙️ Услуга (Без учета остатка)</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Категория" name="category">
            <Input placeholder="IT-Оборудование / Услуги" size="large" />
          </Form.Item>

          <Form.Item label="Артикул (SKU)" name="sku">
            <Input placeholder="SKU-10029" size="large" />
          </Form.Item>

          <Form.Item label="Продажная цена (сум)" name="price" rules={[{ required: true, message: 'Введите цену' }]}>
            <InputNumber style={{ width: '100%' }} size="large" min={0} placeholder="350000" />
          </Form.Item>

          <Form.Item label="Себестоимость (сум)" name="costPrice">
            <InputNumber style={{ width: '100%' }} size="large" min={0} placeholder="200000" />
          </Form.Item>

          <Form.Item label="Остаток на складе" name="stock" initialValue={10}>
            <InputNumber style={{ width: '100%' }} size="large" min={0} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => setIsCreateOpen(false)} style={{ marginRight: 8 }}>
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Сохранить
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
