'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarOutlined,
  LineChartOutlined,
  PercentageOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Card, Col, Progress, Row, Spin, Table, Tag, Typography } from 'antd';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiClient } from '@/lib/api-client';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['main-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/main');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" tip="Загрузка аналитики..." />
      </div>
    );
  }

  const kpi = dashboard?.kpi || {};
  const leadSources = dashboard?.leadSources || [];
  const salesByManager = dashboard?.salesByManager || [];
  const chartData = dashboard?.salesByDate || [];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          📊 Главный Dashboard
        </Title>
        <Text type="secondary">Ключевые показатели продаж, лидов, задолженности и воронки</Text>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary">Продажи сегодня</Text>
                <Title level={3} style={{ margin: '4px 0 0 0', color: '#1677ff' }}>
                  {Number(kpi.salesToday || 0).toLocaleString()} сум
                </Title>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: '#e6f4ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DollarOutlined style={{ fontSize: 22, color: '#1677ff' }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary">Выручка за месяц</Text>
                <Title level={3} style={{ margin: '4px 0 0 0', color: '#52c41a' }}>
                  {Number(kpi.salesMonth || 0).toLocaleString()} сум
                </Title>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: '#f6ffed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LineChartOutlined style={{ fontSize: 22, color: '#52c41a' }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary">Всего Клиентов</Text>
                <Title level={3} style={{ margin: '4px 0 0 0' }}>
                  {kpi.clientsCount || 0}
                </Title>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: '#f9f0ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UsergroupAddOutlined style={{ fontSize: 22, color: '#722ed1' }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary">Задолженность клиентов</Text>
                <Title level={3} style={{ margin: '4px 0 0 0', color: '#ff4d4f' }}>
                  {Number(kpi.totalDebt || 0).toLocaleString()} сум
                </Title>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: '#fff2f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <WarningOutlined style={{ fontSize: 22, color: '#ff4d4f' }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Analytics Charts & Conversion */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="📈 Динамика продаж за последние 7 дней" style={{ borderRadius: 12 }}>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1677ff" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} сум`, 'Выручка']} />
                  <Area type="monotone" dataKey="amount" stroke="#1677ff" fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="🎯 Конверсия воронки лидов" style={{ borderRadius: 12, height: '100%' }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Progress
                type="dashboard"
                percent={kpi.conversionRate || 0}
                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                width={160}
              />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">Успешно конвертировано из лидов в продажи</Text>
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-around' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{kpi.leadsCount || 0}</div>
                  <Text type="secondary">Новых лидов</Text>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{kpi.newOrdersCount || 0}</div>
                  <Text type="secondary">Новых заказов</Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Ratings and Lead Sources */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="🏆 Рейтинг продаж по сотрудникам" style={{ borderRadius: 12 }}>
            <Table
              dataSource={salesByManager}
              rowKey="managerId"
              pagination={false}
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
                  render: (val) => <Tag color="blue">{val}</Tag>,
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
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="🌐 Источники лидов" style={{ borderRadius: 12 }}>
            <Table
              dataSource={leadSources}
              rowKey="source"
              pagination={false}
              columns={[
                {
                  title: 'Источник',
                  dataIndex: 'source',
                  key: 'source',
                  render: (text) => <Tag color="geekblue">{text}</Tag>,
                },
                {
                  title: 'Количество лидов',
                  dataIndex: 'count',
                  key: 'count',
                  align: 'right',
                  render: (val) => <span style={{ fontWeight: 700 }}>{val}</span>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
