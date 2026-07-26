'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flex, Spin, Alert } from 'antd';
import UserTemplate from '@/components/templates/UserTemplate';
import VipTemplate from '@/components/templates/VipTemplate';

const BG = '#0a0a0a';

function PublicUserPageContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('No userId provided');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/backend-api/sharing-content/public/user?userId=${userId}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || 'Failed to fetch profile');
        }

        setData(json.data);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ height: '100vh', width: '100vw', background: BG, position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
        <Spin size="large" style={{ fontSize: 48 }} />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" style={{ height: '100vh', background: BG, padding: 20 }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ maxWidth: 400 }}
        />
      </Flex>
    );
  }

  if (!data) {
    return (
      <Flex justify="center" align="center" style={{ height: '100vh', background: BG }}>
        <Alert message="Not Found" description="User profile not found." type="warning" showIcon />
      </Flex>
    );
  }

  const user = { fullname: data.fullname, avatarUrl: data.avatarUrl, email: data.email, role: data.role };
  const items = data.sharingContent || [];
  const roleName = data.role?.name?.toUpperCase();

  if (roleName === 'VIP') {
    return <VipTemplate user={user} items={items} />;
  }

  return <UserTemplate user={user} items={items} />;
}

export default function PublicUserPage() {
  return (
    <Suspense
      fallback={
        <Flex justify="center" align="center" style={{ height: '100vh', width: '100vw', background: BG, position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
          <Spin size="large" style={{ fontSize: 48 }} />
        </Flex>
      }
    >
      <PublicUserPageContent />
    </Suspense>
  );
}
