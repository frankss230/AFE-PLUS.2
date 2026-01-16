'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, Autocomplete } from '@react-google-maps/api';
import { Loader2, Search } from 'lucide-react';

interface MapSelectorProps {
    apiKey: string;
    lat: number;
    lng: number;
    r1: number;
    r2: number;
    isPanelOpen: boolean;
    onChange: (lat: number, lng: number) => void;
}

const containerStyle = { width: '100%', height: '100%' };


type Library = "places" | "drawing" | "geometry" | "visualization";
const libraries: Library[] = ["places"];

export default function MapSelector({ apiKey, lat, lng, r1, r2, isPanelOpen, onChange }: MapSelectorProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
        language: 'th',
        libraries: libraries,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [mapType, setMapType] = useState<google.maps.MapTypeId>('roadmap' as unknown as google.maps.MapTypeId);

    const searchResultRef = useRef<google.maps.places.Autocomplete | null>(null);

    const zone1Options = useMemo(() => ({
        strokeColor: '#10B981', strokeOpacity: 0.8, strokeWeight: 2,
        fillColor: '#10B981', fillOpacity: 0.2,
        clickable: false, draggable: false, editable: false, visible: true, zIndex: 2
    }), []);

    const zone2Options = useMemo(() => ({
        strokeColor: '#EF4444', strokeOpacity: 0.8, strokeWeight: 1,
        fillColor: '#EF4444', fillOpacity: 0.1,
        clickable: false, draggable: false, editable: false, visible: true, zIndex: 1
    }), []);

    const onLoad = useCallback((map: google.maps.Map) => setMap(map), []);
    const onUnmount = useCallback(() => setMap(null), []);

    useEffect(() => {
        if (map) {
            map.panTo({ lat, lng });
            if (isPanelOpen) {
                // Shift map view down so that the center point (marker) appears higher up
                map.panBy(0, 120);
            }
        }
    }, [map, lat, lng, isPanelOpen]);

    const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            onChange(e.latLng.lat(), e.latLng.lng());
        }
    }, [onChange]);


    const onPlaceChanged = () => {
        if (searchResultRef.current) {
            const place = searchResultRef.current.getPlace();


            if (!place || !place.geometry || !place.geometry.location) {
                console.log("สถานที่นี้ไม่มีพิกัด GPS หรือยังไม่ได้เลือกสถานที่");
                return;
            }

            const newLat = place.geometry.location.lat();
            const newLng = place.geometry.location.lng();
            onChange(newLat, newLng);
            // map.panTo({ lat: newLat, lng: newLng }); // Handle by useEffect
            map?.setZoom(17);
        }
    };

    const onLoadAutocomplete = (autocomplete: google.maps.places.Autocomplete) => {
        searchResultRef.current = autocomplete;
    };

    if (!isLoaded) return <div className="w-full h-full flex items-center justify-center bg-slate-100"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="relative w-full h-full">
            <GoogleMap
                mapContainerStyle={containerStyle}
                // center={{ lat, lng }} 
                zoom={17}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={handleMapClick}
                options={{
                    mapTypeId: mapType,
                    disableDefaultUI: true,
                    zoomControl: false,
                    clickableIcons: false,
                }}
            >
                { }
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[20]">
                    <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
                        <div className="relative shadow-xl rounded-full group">
                            <input
                                type="text"
                                placeholder="ค้นหาสถานที่..."
                                className="w-full h-12 pl-12 pr-4 rounded-full border-none outline-none text-gray-700 font-medium bg-white/95 backdrop-blur shadow-sm focus:ring-2 focus:ring-green-500 transition-all text-sm"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        </div>
                    </Autocomplete>
                </div>

                { }
                <div className="absolute top-20 left-4 z-[10] flex flex-row gap-1.5 bg-white backdrop-blur-sm p-1.5 rounded-[50px] shadow-lg">
                    <button
                        onClick={() => setMapType('roadmap' as unknown as google.maps.MapTypeId)}
                        className={`px-3 py-1.5 rounded-[50px] text-xs font-bold transition-all active:scale-95 ${mapType === 'roadmap' as any
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        แผนที่
                    </button>
                    <button
                        onClick={() => setMapType('hybrid' as unknown as google.maps.MapTypeId)}
                        className={`px-3 py-1.5 rounded-[50px] text-xs font-bold transition-all active:scale-95 ${mapType === 'hybrid' as any
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        ดาวเทียม
                    </button>
                </div>

                <Marker position={{ lat, lng }} animation={google.maps.Animation.DROP} />
                <Circle center={{ lat, lng }} radius={r1} options={zone1Options} />
                <Circle center={{ lat, lng }} radius={r2} options={zone2Options} />
            </GoogleMap>
        </div>
    );
}