export interface ThaiTambon {
  id: number;
  name: string;
  zipCode: string;
}

export interface ThaiAmphure {
  id: number;
  name: string;
  tambon: ThaiTambon[];
}

export interface ThaiProvince {
  id: number;
  name: string;
  amphure: ThaiAmphure[];
}

export async function getThaiAddressData(): Promise<ThaiProvince[]> {
  try {
    const response = await fetch('/api/thai-address');
    
    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || 'Failed to fetch address data from proxy');
    }

    const rawData = await response.json();

    if (!Array.isArray(rawData)) {
        console.error('❌ บ่แม่น array', rawData);
        return [];
    }

    const provinces: ThaiProvince[] = rawData.map((p: any) => ({
      id: p.id,
      name: p.name_th, 
      amphure: p.districts.map((d: any) => ({
        id: d.id,
        name: d.name_th,
        tambon: d.sub_districts.map((s: any) => ({
          id: s.id,
          name: s.name_th,
          zipCode: s.zip_code ? String(s.zip_code) : '', 
        })),
      })),
    }));

    return provinces;
  } catch (error) {
    console.error('Error fetching Thai address data:', error);
    return [];
  }
}