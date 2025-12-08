'use client';

import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { MapPin, Battery, Clock } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { env } from '@/config/env';

interface Caregiver {
  id: number;
  firstName: string;
  lastName: string;
  latestLocation?: {
    latitude: number;
    longitude: number;
    battery: number;
    timestamp: string;
    distance: number;
  };
}

export default function LocationPage() {
  const [loading, setLoading] = useState(true);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: env.NEXT_PUBLIC_LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        // Fetch caregivers and their locations
        const response = await fetch('/api/users/profile');
        const data = await response.json();

        if (data.user) {
          const caregiversResponse = await fetch(`/api/users/${data.user.id}/caregivers`);
          const caregiversData = await caregiversResponse.json();
          
          // Fetch latest location for each caregiver
          const caregiversWithLocation = await Promise.all(
            caregiversData.caregivers.map(async (caregiver: any) => {
              try {
                const locationResponse = await fetch(`/api/caregivers/${caregiver.id}/location`);
                const locationData = await locationResponse.json();
                return {
                  ...caregiver,
                  latestLocation: locationData.location,
                };
              } catch {
                return caregiver;
              }
            })
          );

          setCaregivers(caregiversWithLocation);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load:', err);
        setLoading(false);
      }
    };

    initLiff();
  }, []);

  const openMap = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    liff.openWindow({ url, external: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          📍 ตำแหน่งผู้สูงอายุ
        </h1>

        <div className="space-y-4">
          {caregivers.map((caregiver) => (
            <Card key={caregiver.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {caregiver.firstName} {caregiver.lastName}
                  </span>
                  {caregiver.latestLocation && (
                    <span
                      className={`text-sm px-3 py-1 rounded-full ${
                        caregiver.latestLocation.distance > 500
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {caregiver.latestLocation.distance > 500
                        ? '⚠️ นอกเขต'
                        : '✅ ในเขต'}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {caregiver.latestLocation ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-5 h-5" />
                      <span className="text-sm">
                        {caregiver.latestLocation.latitude.toFixed(6)},{' '}
                        {caregiver.latestLocation.longitude.toFixed(6)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Battery className="w-5 h-5" />
                      <span className="text-sm">
                        แบตเตอรี่: {caregiver.latestLocation.battery}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-5 h-5" />
                      <span className="text-sm">
                        {new Date(caregiver.latestLocation.timestamp).toLocaleString('th-TH')}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        openMap(
                          caregiver.latestLocation!.latitude,
                          caregiver.latestLocation!.longitude,
                          `${caregiver.firstName} ${caregiver.lastName}`
                        )
                      }
                      className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      เปิดดูในแผนที่
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    ยังไม่มีข้อมูลตำแหน่ง
                  </p>
                )}
              </CardContent>
            </Card>
          ))}

          {caregivers.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-gray-500">
                  ยังไม่มีผู้สูงอายุที่ดูแล
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}