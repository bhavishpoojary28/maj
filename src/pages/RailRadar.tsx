import { FormEvent, useState } from 'react';
import { AlertCircle, Clock3, LocateFixed, MapPin, Radio, RefreshCw, Route, TrainFront } from 'lucide-react';
import { PageHeader } from '../components/Topbar';
import { LoadingSpinner, StatusBadge } from '../components/ui';

type Stop = {
  sequence: number;
  stationCode: string;
  stationName: string;
  status: string;
  platform: string | null;
  scheduledArrival: string | null;
  scheduledDeparture: string | null;
  actualArrival: string | null;
  actualDeparture: string | null;
  delayArrival: number | null;
  delayDeparture: number | null;
};

type LiveTrain = {
  trainNumber: string;
  trainName: string;
  status: string;
  delayMinutes: number;
  lastUpdatedAt: string;
  isLive: boolean;
  train: { source?: { code: string; name: string }; destination?: { code: string; name: string } };
  currentLocation?: { stationCode: string; status: string; speedKmh: number | null };
  previousHalt?: { stationCode: string; stationName: string };
  nextHalt?: { stationCode: string; stationName: string; platform?: string | null };
  route: Stop[];
};

type RouteTrain = {
  train: { number: string; name: string; type?: string; runDays?: string[] };
  from: { departure?: string };
  to: { arrival?: string };
  distance?: number;
  duration?: number;
  live?: { type?: string; platform?: string | null; delayMinutes?: number | null };
};

type RouteSearch = { from: { code: string; name: string }; to: { code: string; name: string }; count: number; trains: RouteTrain[] };
type Station = { code: string; name: string; city?: string };

function time(value: string | null) {
  return value ? new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
}

function displayStatus(status: string) {
  return status.replace(/(^|[-_ ])\w/g, (letter) => letter.toUpperCase());
}

export default function RailRadar() {
  const [trainNumber, setTrainNumber] = useState('12919');
  const [data, setData] = useState<LiveTrain | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromStation, setFromStation] = useState('New Delhi');
  const [toStation, setToStation] = useState('Mumbai Central');
  const [fromSelected, setFromSelected] = useState<Station | null>(null);
  const [toSelected, setToSelected] = useState<Station | null>(null);
  const [fromSuggestions, setFromSuggestions] = useState<Station[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Station[]>([]);
  const [routeData, setRouteData] = useState<RouteSearch | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');

  async function findTrain(event?: FormEvent) {
    event?.preventDefault();
    const number = trainNumber.trim();
    if (!/^\d{5}$/.test(number)) {
      setError('Enter a valid 5-digit train number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/railradar-api/v1/trains/${number}/live`);
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) throw new Error(body?.error?.message ?? body?.message ?? `RailRadar could not find train ${number}.`);
      setData(body.data as LiveTrain);
    } catch (reason) {
      setData(null);
      setError(reason instanceof Error ? reason.message : 'Unable to retrieve live train information.');
    } finally {
      setLoading(false);
    }
  }

  async function searchStations(query: string, field: 'from' | 'to') {
    if (query.trim().length < 2) {
      field === 'from' ? setFromSuggestions([]) : setToSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`/railradar-api/v1/lookup/search/stations?q=${encodeURIComponent(query)}&limit=5`);
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) return;
      const results = body.data as Station[];
      field === 'from' ? setFromSuggestions(results) : setToSuggestions(results);
    } catch {
      field === 'from' ? setFromSuggestions([]) : setToSuggestions([]);
    }
  }

  function selectStation(station: Station, field: 'from' | 'to') {
    if (field === 'from') {
      setFromStation(station.name);
      setFromSelected(station);
      setFromSuggestions([]);
    } else {
      setToStation(station.name);
      setToSelected(station);
      setToSuggestions([]);
    }
  }

  async function findTrainsByRoute(event: FormEvent) {
    event.preventDefault();
    if (!fromSelected || !toSelected) {
      setRouteError('Choose both station names from the search suggestions.');
      return;
    }
    setRouteLoading(true);
    setRouteError('');
    try {
      const response = await fetch(`/railradar-api/v1/trains/between/${encodeURIComponent(fromSelected.code)}/${encodeURIComponent(toSelected.code)}?live=true`);
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) throw new Error(body?.error?.message ?? body?.message ?? 'Unable to find trains for this route.');
      setRouteData(body.data as RouteSearch);
    } catch (reason) {
      setRouteData(null);
      setRouteError(reason instanceof Error ? reason.message : 'Unable to find trains for this route.');
    } finally {
      setRouteLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="Live Train Tracker" subtitle="Check real-time running status, delays, next halt, and route via RailRadar." />
      <form onSubmit={findTrain} className="card mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Train number
          <input value={trainNumber} onChange={(event) => setTrainNumber(event.target.value.replace(/\D/g, '').slice(0, 5))} inputMode="numeric" maxLength={5} placeholder="e.g. 12919" className="input mt-1" />
        </label>
        <button type="submit" disabled={loading} className="btn-primary min-w-36">{loading ? <RefreshCw size={16} className="animate-spin" /> : <Radio size={16} />} Track train</button>
      </form>

      <section className="card mb-5 p-4">
        <div className="mb-3"><h2 className="font-semibold text-slate-800 dark:text-slate-100">Which trains run on this route?</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search by station name, then choose the matching station from the suggestions.</p></div>
        <form onSubmit={findTrainsByRoute} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="relative flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">From station<input value={fromStation} onChange={(event) => { setFromStation(event.target.value); setFromSelected(null); void searchStations(event.target.value, 'from'); }} placeholder="e.g. New Delhi" autoComplete="off" className="input mt-1" />{fromSuggestions.length > 0 && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-rail-700 dark:bg-rail-900">{fromSuggestions.map((station) => <button key={station.code} type="button" onClick={() => selectStation(station, 'from')} className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-rail-800"><span className="font-medium text-slate-700 dark:text-slate-200">{station.name}</span><span className="ml-2 text-xs text-slate-400">{station.city ? `${station.city} · ` : ''}{station.code}</span></button>)}</div>}</label>
          <label className="relative flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">To station<input value={toStation} onChange={(event) => { setToStation(event.target.value); setToSelected(null); void searchStations(event.target.value, 'to'); }} placeholder="e.g. Mumbai Central" autoComplete="off" className="input mt-1" />{toSuggestions.length > 0 && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-rail-700 dark:bg-rail-900">{toSuggestions.map((station) => <button key={station.code} type="button" onClick={() => selectStation(station, 'to')} className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-rail-800"><span className="font-medium text-slate-700 dark:text-slate-200">{station.name}</span><span className="ml-2 text-xs text-slate-400">{station.city ? `${station.city} · ` : ''}{station.code}</span></button>)}</div>}</label>
          <button type="submit" disabled={routeLoading} className="btn-secondary min-w-40">{routeLoading ? <RefreshCw size={16} className="animate-spin" /> : <Route size={16} />} Find trains</button>
        </form>
        {routeError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{routeError}</p>}
        {routeData && <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-rail-800"><div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-rail-800 dark:bg-rail-900/60 dark:text-slate-300"><span className="font-semibold text-slate-800 dark:text-slate-100">{routeData.count} train{routeData.count === 1 ? '' : 's'}</span> from {routeData.from.name} to {routeData.to.name}</div>{routeData.trains.length ? <div className="divide-y divide-slate-100 dark:divide-rail-800">{routeData.trains.map((routeTrain) => <div key={routeTrain.train.number} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-800 dark:text-slate-100">{routeTrain.train.number} · {routeTrain.train.name}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{routeTrain.train.type ?? 'Train'} · Departs {routeTrain.from.departure ?? '—'} · Arrives {routeTrain.to.arrival ?? '—'}{routeTrain.distance ? ` · ${Math.round(routeTrain.distance)} km` : ''}</p></div><div className="flex flex-wrap gap-2">{routeTrain.live?.type && <StatusBadge status={displayStatus(routeTrain.live.type)} />}{routeTrain.live?.delayMinutes !== undefined && routeTrain.live.delayMinutes !== null && <span className="badge bg-slate-100 text-slate-600 dark:bg-rail-800 dark:text-slate-300">{routeTrain.live.delayMinutes > 0 ? `${routeTrain.live.delayMinutes} min delayed` : 'On time'}</span>}{routeTrain.live?.platform && <span className="badge bg-rail-100 text-rail-700 dark:bg-rail-500/15 dark:text-rail-300">Platform {routeTrain.live.platform}</span>}</div></div>)}</div> : <p className="p-4 text-sm text-slate-500 dark:text-slate-400">No trains found for this route.</p>}</div>}
      </section>

      {loading && <LoadingSpinner label="Getting the latest running status..." />}
      {error && !loading && <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"><AlertCircle size={18} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
      {!loading && !data && !error && <div className="card py-14 text-center text-sm text-slate-500 dark:text-slate-400"><TrainFront size={34} className="mx-auto mb-3 text-rail-500" />Enter a train number to see its live running status.</div>}

      {!loading && data && <div className="space-y-5">
        <section className="card p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div><p className="text-sm font-medium text-rail-600 dark:text-rail-400">{data.trainNumber}</p><h2 className="mt-1 text-xl font-bold text-slate-800 dark:text-slate-100">{data.trainName}</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{data.train.source?.name ?? 'Origin'} ({data.train.source?.code ?? '—'}) <span className="mx-1">→</span> {data.train.destination?.name ?? 'Destination'} ({data.train.destination?.code ?? '—'})</p></div>
            <div className="flex flex-wrap items-center gap-2"><StatusBadge status={displayStatus(data.status)} /><span className={`badge ${data.delayMinutes > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'}`}>{data.delayMinutes > 0 ? `${data.delayMinutes} min delayed` : 'On time'}</span></div>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-400"><Clock3 size={14} />Updated {new Date(data.lastUpdatedAt).toLocaleString('en-IN')}</p>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card p-5"><div className="mb-3 flex items-center gap-2 text-rail-600 dark:text-rail-400"><LocateFixed size={18} /><span className="text-sm font-semibold">Current position</span></div><p className="text-lg font-bold text-slate-800 dark:text-slate-100">{data.currentLocation?.stationCode ?? 'Location unavailable'}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{data.currentLocation ? `${displayStatus(data.currentLocation.status)}${data.currentLocation.speedKmh ? ` · ${Math.round(data.currentLocation.speedKmh)} km/h` : ''}` : 'Live telemetry is not available.'}</p></div>
          <div className="card p-5"><div className="mb-3 flex items-center gap-2 text-rail-600 dark:text-rail-400"><MapPin size={18} /><span className="text-sm font-semibold">Next halt</span></div><p className="text-lg font-bold text-slate-800 dark:text-slate-100">{data.nextHalt?.stationName ?? 'Not available'}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{data.nextHalt?.stationCode ?? '—'}{data.nextHalt?.platform ? ` · Platform ${data.nextHalt.platform}` : ''}</p></div>
          <div className="card p-5"><div className="mb-3 flex items-center gap-2 text-rail-600 dark:text-rail-400"><Route size={18} /><span className="text-sm font-semibold">Previous halt</span></div><p className="text-lg font-bold text-slate-800 dark:text-slate-100">{data.previousHalt?.stationName ?? 'Not available'}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{data.previousHalt?.stationCode ?? '—'}</p></div>
        </div>

        <section className="card overflow-hidden"><div className="border-b border-slate-200 px-5 py-4 dark:border-rail-800"><h3 className="font-semibold text-slate-800 dark:text-slate-100">Route and station updates</h3></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-rail-900/60 dark:text-slate-400"><tr><th className="px-5 py-3">Station</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Scheduled</th><th className="px-5 py-3">Actual</th><th className="px-5 py-3">Platform</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-rail-800">{data.route.map((stop) => <tr key={`${stop.sequence}-${stop.stationCode}`}><td className="px-5 py-3"><p className="font-medium text-slate-700 dark:text-slate-200">{stop.stationName}</p><p className="text-xs text-slate-400">{stop.stationCode}</p></td><td className="px-5 py-3"><StatusBadge status={displayStatus(stop.status)} /></td><td className="px-5 py-3 text-slate-600 dark:text-slate-300">{time(stop.scheduledArrival ?? stop.scheduledDeparture)}</td><td className="px-5 py-3 text-slate-600 dark:text-slate-300">{time(stop.actualArrival ?? stop.actualDeparture)}</td><td className="px-5 py-3 text-slate-600 dark:text-slate-300">{stop.platform ?? '—'}</td></tr>)}</tbody></table></div></section>
      </div>}
    </>
  );
}
