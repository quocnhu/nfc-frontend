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
    const isExpired = error.includes('NFC_EXPIRED');
    
    if (isExpired) {
      return (
        <Flex justify="center" align="center" style={{ height: '100vh', width: '100vw', background: BG, position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1 }} />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: 40, maxWidth: 500 }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>⚠️</div>
              <h1 style={{ color: '#faad14', fontSize: 32, marginBottom: 16, fontWeight: 700 }}>
                Subscription Expired
              </h1>
              <p style={{ color: '#fff', fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>
                This user's NFC service has expired. They need to upgrade their subscription to continue using this service.
              </p>
              <div style={{ 
                padding: 20, 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: 12, 
                border: '1px solid rgba(250,173,20,0.3)' 
              }}>
                <p style={{ color: '#faad14', fontSize: 14, margin: 0 }}>
                  Please contact the user to renew their subscription
                </p>
              </div>
            </div>
          </div>
        </Flex>
      );
    }
    
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

  if (roleName === 'COMPANY') {
    return <UserTemplate user={user} items={items} />;
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
