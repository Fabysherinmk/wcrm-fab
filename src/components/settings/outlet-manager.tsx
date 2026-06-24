'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, MapPin, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Outlet {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export function OutletManager() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const loadOutlets = useCallback(async () => {
    try {
      const res = await fetch('/api/account/outlets', { cache: 'no-store' });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || 'Failed to load outlets');
        return;
      }
      const data = await res.json();
      setOutlets(data.outlets || []);
    } catch (err) {
      console.error('[OutletManager] load error:', err);
      toast.error('Could not load outlets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOutlets();
  }, [loadOutlets]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Outlet name is required');
      return;
    }

    const latVal = parseFloat(latitude);
    const lngVal = parseFloat(longitude);

    if (isNaN(latVal) || latVal < -90 || latVal > 90) {
      toast.error('Latitude must be a valid number between -90 and 90');
      return;
    }

    if (isNaN(lngVal) || lngVal < -180 || lngVal > 180) {
      toast.error('Longitude must be a valid number between -180 and 180');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/account/outlets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          latitude: latVal,
          longitude: lngVal,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(payload.error || 'Failed to add outlet');
        return;
      }

      toast.success(`Outlet "${payload.outlet.name}" added successfully`);
      setOutlets((prev) => [...prev, payload.outlet].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setLatitude('');
      setLongitude('');
    } catch (err) {
      console.error('[OutletManager] create error:', err);
      toast.error('Could not reach the server');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string, outletName: string) {
    try {
      const res = await fetch(`/api/account/outlets/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || 'Failed to delete outlet');
        return;
      }

      toast.success(`Deleted outlet "${outletName}"`);
      setOutlets((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error('[OutletManager] delete error:', err);
      toast.error('Could not delete outlet');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mt-4">
      {/* Add Outlet Form */}
      <Card className="bg-slate-900 border-slate-700 h-fit">
        <CardContent className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Add New Outlet</h3>
            <p className="text-xs text-slate-400">
              Create an outlet with geographic coordinates for location-based routing.
            </p>
          </div>

          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Outlet Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cochin Outlet"
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Latitude</label>
                <Input
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 9.9312"
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Longitude</label>
                <Input
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 76.2673"
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={adding}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 flex items-center justify-center gap-1.5"
            >
              {adding ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              Add Outlet
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Outlets List */}
      <Card className="bg-slate-900 border-slate-700 md:col-span-2">
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <MapPin className="size-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Configured Outlets</h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
              {outlets.length}
            </span>
          </div>

          {outlets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="size-8 text-slate-600 mb-2" />
              <p className="text-sm text-slate-400 font-medium">No outlets defined</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Add your store locations using the form on the left to start routing customer chats to the nearest outlet.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {outlets.map((outlet) => (
                <li key={outlet.id} className="flex items-center justify-between px-4 py-3 group">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-white">{outlet.name}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      Lat: {outlet.latitude.toFixed(6)} · Lng: {outlet.longitude.toFixed(6)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(outlet.id, outlet.name)}
                    className="border-red-500/20 bg-red-500/5 hover:bg-red-500/20 hover:border-red-500/40 text-red-400 border rounded-md"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
