'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircleOutlined,
  DollarOutlined,
  LineChartOutlined,
  PercentageOutlined,
  PlusOutlined,
  RocketOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
  UsergroupAddOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Divider,
  Progress,
  Row,
  Segmented,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiClient } from '@/lib/api-client';

const { Title, Text } = Typography;

const PIE_COLORS = ['#1677ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];

export default function DashboardPage() {
  const [period, setPeriod] = useState<string>('7d');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['main-dashboard', period],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/main', { params: { period } });
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Загрузка аналитических данных..." />
      </div>
    );
  }

  const kpi = dashboard?.kpi || {};
  const leadSources = dashboard?.leadSources || [];
  const salesByManager = dashboard?.salesByManager || [];
  const chartData = dashboard?.salesByDate || [];

  const periodLabels: Record<string, string> = {
    today: 'Сегодня',
    '7d': '7 дней',
    '30d': '30 дней',
    month: 'Этот месяц',
    year: 'Весь год',
  };

  return (
    <div>
      {/* Header with Title and Period Filter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
            📊 Аналитический Dashboard
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Сводка по продажам, конверсии лидов, задолженности и эффективности команды
          </Text>
        </div>

        <Space size="middle" wrap>
          <Text style={{ fontWeight: 500 }}>Период:</Text>
          <Segmented
            value={period}
            onChange={(val) => setPeriod(val as string)}
            options={[
              { label: 'Сегодня', value: 'today' },
              { label: '7 дней', value: '7d' },
              { label: '30 дней', value: '30d' },
              { label: 'Этот месяц', value: 'month' },
              { label: 'Весь год', value: 'year' },
            ]}
            size="middle"
          />
        </Space>
      </div>

      {/* Top Main KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} xl={6}>
          <Card
            hoverable
            style={{
              borderRadius: 14,
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              border: '1px solid #e6f4ff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Выручка за {periodLabels[period] || 'период'}
                </Text>
                <Title level={3} style={{ margin: '6px 0 2px 0', color: '#1677ff', fontWeight: 700 }}>
                  {Number(kpi.salesPeriod || kpi.salesToday || 0).toLocaleString()} сум
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Сделок за период: <strong>{kpi.salesPeriodCount || 0}</strong>
                </Text>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(22, 119, 255, 0.3)',
                }}
              >
                <DollarOutlined style={{ fontSize: 24, color: '#fff' }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card
            hoverable
            style={{
              borderRadius: 14,
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              border: '1px solid #f6ffed',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Выручка за текущий месяц
                </Text>
                <Title level={3} style={{ margin: '6px 0 2px 0', color: '#52c41a', fontWeight: 700 }}>
                  {Number(kpi.salesMonth || 0).toLocaleString()} сум
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Сегодня: {Number(kpi.salesToday || 0).toLocaleString()} сум
                </Text>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #52c41a 0%, #95de64 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(82, 196, 26, 0.3)',
                }}
              >
                <LineChartOutlined style={{ fontSize: 24, color: '#fff' }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card
            hoverable
            style={{
              borderRadius: 14,
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              border: '1px solid #f9f0ff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  База клиентов
                </Text>
                <Title level={3} style={{ margin: '6px 0 2px 0', color: '#722ed1', fontWeight: 700 }}>
                  {kpi.clientsCount || 0}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Новых лидов за период: <strong>{kpi.leadsCount || 0}</strong>
                </Text>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #722ed1 0%, #b37feb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(114, 46, 209, 0.3)',
                }}
              >
                <UsergroupAddOutlined style={{ fontSize: 24, color: '#fff' }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card
            hoverable
            style={{
              borderRadius: 14,
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              border: '1px solid #fff2f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Дебиторская задолженность
                </Text>
                <Title
                  level={3}
                  style={{
                    margin: '6px 0 2px 0',
                    color: Number(kpi.totalDebt) > 0 ? '#ff4d4f' : '#52c41a',
                    fontWeight: 700,
                  }}
                >
                  {Number(kpi.totalDebt || 0).toLocaleString()} сум
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Неоплаченных сделок: <strong>{kpi.pendingSalesCount || 0}</strong>
                </Text>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(255, 77, 79, 0.3)',
                }}
              >
                <WarningOutlined style={{ fontSize: 24, color: '#fff' }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Action Shortcuts Banner */}
      <Card
        style={{
          borderRadius: 14,
          marginBottom: 24,
          background: 'linear-gradient(90deg, #1677ff0a 0%, #722ed10a 100%)',
          border: '1px dashed #1677ff40',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Space size="middle">
            <ThunderboltOutlined style={{ fontSize: 20, color: '#1677ff' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Быстрые действия:</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Создавайте записи в один клик без перехода по разделам
              </Text>
            </div>
          </Space>
          <Space wrap>
            <Link href="/sales">
              <Button type="primary" icon={<PlusOutlined />} style={{ borderRadius: 8 }}>
                Новая продажа
              </Button>
            </Link>
            <Link href="/leads">
              <Button icon={<UserAddOutlined />} style={{ borderRadius: 8 }}>
                Добавить лида
              </Button>
            </Link>
            <Link href="/clients">
              <Button icon={<UsergroupAddOutlined />} style={{ borderRadius: 8 }}>
                Новый клиент
              </Button>
            </Link>
            <Link href="/subscriptions">
              <Button icon={<RocketOutlined />} style={{ borderRadius: 8 }}>
                Подписка
              </Button>
            </Link>
            <Link href="/tasks">
              <Button icon={<CheckCircleOutlined />} style={{ borderRadius: 8 }}>
                Задача
              </Button>
            </Link>
          </Space>
        </div>
      </Card>

      {/* Main Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Sales Dynamics Area Chart */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <LineChartOutlined style={{ color: '#1677ff' }} />
                <span>Динамика продаж ({periodLabels[period] || 'за период'})</span>
              </Space>
            }
            style={{ borderRadius: 14, height: '100%' }}
          >
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1677ff" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1677ff" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${val / 1000}k`)}
                  />
                  <RechartsTooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString()} сум`, 'Выручка']}
                    contentStyle={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#1677ff"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Lead Funnel & Conversion Progress */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <PercentageOutlined style={{ color: '#52c41a' }} />
                <span>Конверсия воронки лидов</span>
              </Space>
            }
            style={{ borderRadius: 14, height: '100%' }}
          >
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <Progress
                type="dashboard"
                percent={kpi.conversionRate || 0}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#52c41a',
                }}
                strokeWidth={9}
                width={170}
              />
              <div style={{ marginTop: 12 }}>
                <Text strong style={{ fontSize: 16 }}>
                  {kpi.conversionRate || 0}% успешных сделок
                </Text>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Процент лидов, переведенных в выигранные сделки (WON)
                  </Text>
                </div>
              </div>

              <Divider style={{ margin: '16px 0' }} />

              <Row gutter={12}>
                <Col span={12}>
                  <div style={{ background: '#f5f7fa', padding: '10px 8px', borderRadius: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1677ff' }}>{kpi.leadsCount || 0}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Новых лидов
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ background: '#f6ffed', padding: '10px 8px', borderRadius: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{kpi.newOrdersCount || 0}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Новых заказов
                    </Text>
                  </div>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Second Analytics Row: Sales by Manager BarChart & Lead Sources PieChart */}
      <Row gutter={[16, 16]}>
        {/* Sales by Manager (BarChart & Table) */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <TeamOutlined style={{ color: '#722ed1' }} />
                <span>Эффективность менеджеров ({periodLabels[period] || 'за период'})</span>
              </Space>
            }
            style={{ borderRadius: 14 }}
          >
            {salesByManager.length > 0 ? (
              <div>
                <div style={{ width: '100%', height: 220, marginBottom: 16 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByManager} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="managerName" tickLine={false} axisLine={false} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${val / 1000}k`)}
                      />
                      <RechartsTooltip
                        formatter={(val: any) => [`${Number(val).toLocaleString()} сум`, 'Сумма продаж']}
                        contentStyle={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="totalSalesAmount" fill="#722ed1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <Table
                  dataSource={salesByManager}
                  rowKey="managerId"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Менеджер',
                      dataIndex: 'managerName',
                      key: 'managerName',
                      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>,
                    },
                    {
                      title: 'Сделок',
                      dataIndex: 'salesCount',
                      key: 'salesCount',
                      align: 'center',
                      render: (val) => <Tag color="purple">{val}</Tag>,
                    },
                    {
                      title: 'Сумма продаж',
                      dataIndex: 'totalSalesAmount',
                      key: 'totalSalesAmount',
                      align: 'right',
                      render: (val) => (
                        <span style={{ fontWeight: 700, color: '#52c41a' }}>
                          {Number(val).toLocaleString()} сум
                        </span>
                      ),
                    },
                  ]}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">В выбранном периоде нет зафиксированных продаж по сотрудникам</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Lead Sources (PieChart & Table) */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <UsergroupAddOutlined style={{ color: '#13c2c2' }} />
                <span>Источники привлечения лидов</span>
              </Space>
            }
            style={{ borderRadius: 14 }}
          >
            {leadSources.length > 0 ? (
              <div>
                <div style={{ width: '100%', height: 220, marginBottom: 16 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadSources}
                        dataKey="count"
                        nameKey="source"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={4}
                      >
                        {leadSources.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: any, name: any) => [`${val} лидов`, `Источник: ${name}`]}
                        contentStyle={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <Table
                  dataSource={leadSources}
                  rowKey="source"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Канал / Источник',
                      dataIndex: 'source',
                      key: 'source',
                      render: (text: string, _, idx: number) => (
                        <Tag color={PIE_COLORS[idx % PIE_COLORS.length]}>{text}</Tag>
                      ),
                    },
                    {
                      title: 'Лидов',
                      dataIndex: 'count',
                      key: 'count',
                      align: 'right',
                      render: (val) => <span style={{ fontWeight: 700 }}>{val}</span>,
                    },
                  ]}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">Нет данных об источниках лидов</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
