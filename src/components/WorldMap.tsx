/* Interactive world map: d3-geo Equal-Earth projection + topojson world atlas. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { geoEqualEarth, geoPath, geoGraticule } from 'd3-geo';
import { select } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';
import 'd3-transition';
import * as topojson from 'topojson-client';
import worldAtlas from 'world-atlas/countries-110m.json';

import { countries as ALL_COUNTRIES, monthsFull, type Country } from '../data/countries';
import { scoreHex } from '../lib/utils';
import { Score } from './atoms';

interface Props {
  monthIdx: number;
  continent: string;
  query: string;
  selectedIso: string | null;
  onSelect: (iso: string) => void;
  compareSet?: string[];
}

type GeoFeature = { id?: string | number; type: 'Feature'; geometry: any; properties: any };
interface FeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

export function WorldMap({ monthIdx, continent, query, selectedIso, onSelect, compareSet = [] }: Props) {
  const compareLookup = useMemo(() => new Set(compareSet), [compareSet]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ReturnType<typeof zoom<SVGSVGElement, unknown>> | null>(null);
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [hover, setHover] = useState<{ iso: string; name: string; city: string; score: number; x: number; y: number } | null>(null);
  const [dims, setDims] = useState({ w: 1200, h: 600 });
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });

  // Resize observer (rAF-wrapped to avoid the harmless
  // "ResizeObserver loop completed with undelivered notifications" warning).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let rafId = 0;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setDims({ w: width, h: height }));
    });
    ro.observe(el);
    return () => { cancelAnimationFrame(rafId); ro.disconnect(); };
  }, []);

  // Convert topojson → geojson once (atlas is bundled, no network call needed)
  useEffect(() => {
    const topo = worldAtlas as any;
    const fc = topojson.feature(topo, topo.objects.countries) as unknown as FeatureCollection;
    fc.features = fc.features.filter(f => String(f.id) !== '010'); // drop Antarctica
    setGeo(fc);
  }, []);

  const projection = useMemo(() => {
    if (!geo) return null;
    return geoEqualEarth().fitSize([dims.w, dims.h], geo as any).scale(dims.w / 6.3);
  }, [geo, dims.w, dims.h]);

  const pathFn = useMemo(() => projection ? geoPath(projection) : null, [projection]);

  const dataByNumeric = useMemo(() => {
    const m = new Map<string, Country>();
    ALL_COUNTRIES.forEach(c => m.set(c.id, c));
    return m;
  }, []);

  // ISO-2 → atlas feature, for fly-to lookups.
  const featureByIso = useMemo(() => {
    const m = new Map<string, GeoFeature>();
    if (!geo) return m;
    for (const f of geo.features) {
      const data = dataByNumeric.get(String(f.id).padStart(3, '0'));
      if (data) m.set(data.iso, f);
    }
    return m;
  }, [geo, dataByNumeric]);

  // d3-zoom pan/zoom — behavior stored in a ref so buttons + fly-to reuse it.
  useEffect(() => {
    if (!svgRef.current) return;
    const sv = select(svgRef.current);
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .translateExtent([[-200, -100], [dims.w + 200, dims.h + 100]])
      .on('zoom', (ev) => {
        const { x, y, k } = ev.transform;
        setTransform({ x, y, k });
      });
    zoomRef.current = z;
    sv.call(z);
    return () => { sv.on('.zoom', null); };
  }, [dims.w, dims.h]);

  // Fit the viewport to a set of features (animated). Used by select + continent focus.
  const flyToFeatures = useCallback((features: GeoFeature[], maxK = 8, dur = 720) => {
    if (!pathFn || !svgRef.current || !zoomRef.current || features.length === 0) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const f of features) {
      const b = pathFn.bounds(f as any);
      x0 = Math.min(x0, b[0][0]); y0 = Math.min(y0, b[0][1]);
      x1 = Math.max(x1, b[1][0]); y1 = Math.max(y1, b[1][1]);
    }
    if (!isFinite(x0)) return;
    const dx = x1 - x0, dy = y1 - y0;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const k = Math.max(1, Math.min(maxK, 0.55 / Math.max(dx / dims.w, dy / dims.h)));
    const tx = dims.w / 2 - k * cx;
    const ty = dims.h / 2 - k * cy;
    select(svgRef.current).transition().duration(dur)
      .call(zoomRef.current.transform as any, zoomIdentity.translate(tx, ty).scale(k));
  }, [pathFn, dims.w, dims.h]);

  const resetZoom = useCallback((dur = 600) => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current).transition().duration(dur)
      .call(zoomRef.current.transform as any, zoomIdentity);
  }, []);

  // Fly to the selected country (also makes small countries tappable — issue #22).
  useEffect(() => {
    if (!selectedIso) return;
    const f = featureByIso.get(selectedIso);
    if (f) flyToFeatures([f], 6);
  }, [selectedIso, featureByIso, flyToFeatures]);

  // Fly to a continent when its chip is chosen; reset when back to "all".
  useEffect(() => {
    if (selectedIso) return; // don't fight an active selection
    if (continent === 'all') { resetZoom(); return; }
    const feats: GeoFeature[] = [];
    if (geo) for (const f of geo.features) {
      const data = dataByNumeric.get(String(f.id).padStart(3, '0'));
      if (data && data.cont === continent) feats.push(f);
    }
    flyToFeatures(feats, 5);
  }, [continent, geo, dataByNumeric, flyToFeatures, resetZoom, selectedIso]);

  const handleEnter = (f: any, e: React.MouseEvent) => {
    const data = dataByNumeric.get(String(f.id).padStart(3, '0'));
    if (!data || !svgRef.current) { setHover(null); return; }
    const rect = svgRef.current.getBoundingClientRect();
    setHover({
      iso: data.iso, name: data.name, city: data.city,
      score: data.scores[monthIdx],
      x: e.clientX - rect.left, y: e.clientY - rect.top,
    });
  };
  const handleMove = (e: React.MouseEvent) => {
    if (!hover || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setHover(h => h && ({ ...h, x: e.clientX - rect.left, y: e.clientY - rect.top }));
  };
  const handleLeave = () => setHover(null);

  if (!pathFn || !geo) {
    return (
      <div className="map-wrap" ref={wrapRef}>
        <div className="map-loading">
          <div className="t-eyebrow">Chargement de l'atlas…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-wrap" ref={wrapRef}>
      <svg ref={svgRef} className="world-svg" viewBox={`0 0 ${dims.w} ${dims.h}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="oceanGlow" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#1c130f" stopOpacity="0.55"/>
            <stop offset="100%" stopColor="#0e0907" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width={dims.w} height={dims.h} fill="url(#oceanGlow)"/>
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          <path d={pathFn(geoGraticule().step([20, 20])() as any) || undefined}
                fill="none" stroke="rgba(245,237,224,0.04)" strokeWidth={0.5 / transform.k}/>
          {geo.features.map((f, fi) => {
            const data = dataByNumeric.get(String(f.id).padStart(3, '0'));
            const continentFilter = continent !== 'all' && data && data.cont !== continent;
            const q = (query || '').toLowerCase().trim();
            const queryFilter = q && data && !data.name.toLowerCase().includes(q) && !data.city.toLowerCase().includes(q);
            const isSel = !!data && selectedIso === data.iso;
            const isCompare = !!data && compareLookup.has(data.iso);
            const isMatch = !!data && !continentFilter && !queryFilter;

            let fill = '#1a110d';
            let strokeC = 'rgba(245,237,224,0.06)';
            if (data && isMatch) {
              fill = scoreHex(data.scores[monthIdx]);
              strokeC = 'rgba(14,9,7,0.55)';
            } else if (data) {
              fill = 'rgba(50,35,28,0.55)';
              strokeC = 'rgba(245,237,224,0.04)';
            }
            const opacity = (continent === 'all' && !q) ? 1 : (isMatch ? 1 : 0.42);
            const stroke = isSel ? '#f5ede0' : isCompare ? '#d97757' : strokeC;
            const sw = (isCompare ? 2.2 : isSel ? 1.6 : 0.6) / transform.k;
            return (
              <path
                key={f.id ?? `f-${fi}`}
                d={pathFn(f as any) || undefined}
                fill={fill} fillOpacity={opacity}
                stroke={stroke}
                strokeWidth={sw}
                className={isSel ? 'country is-sel' : isCompare ? 'country is-cmp' : 'country'}
                onMouseEnter={(e) => handleEnter(f, e)}
                onMouseMove={handleMove}
                onMouseLeave={handleLeave}
                onClick={() => data && onSelect(data.iso)}
                style={{ cursor: data ? 'pointer' : 'default' }}
              />
            );
          })}
        </g>
      </svg>

      {hover && (
        <div className="map-tip" style={{ left: hover.x + 14, top: hover.y - 14 }}>
          <div className="t-mono map-tip-iso">{hover.iso}</div>
          <div className="map-tip-name">{hover.name} <span className="map-tip-city">· {hover.city}</span></div>
          <div className="map-tip-row">
            <Score value={hover.score} size={22}/>
            <span className="t-mono map-tip-month">{monthsFull[monthIdx]}</span>
          </div>
        </div>
      )}

      <div className="map-legend">
        <span className="t-eyebrow">Score climatique</span>
        <div className="legend-bar">
          <span><i style={{ background: '#6b6055' }}/>&lt;50</span>
          <span><i style={{ background: '#e08543' }}/>50</span>
          <span><i style={{ background: '#e7b54b' }}/>65</span>
          <span><i style={{ background: '#22b07a' }}/>80+</span>
        </div>
      </div>

      <div className="map-zoom">
        <button className="zbtn" aria-label="Zoomer" onClick={() => svgRef.current && zoomRef.current && select(svgRef.current).transition().duration(280).call(zoomRef.current.scaleBy as any, 1.5)}>+</button>
        <button className="zbtn" aria-label="Dézoomer" onClick={() => svgRef.current && zoomRef.current && select(svgRef.current).transition().duration(280).call(zoomRef.current.scaleBy as any, 0.67)}>−</button>
        <button className="zbtn" aria-label="Réinitialiser la vue" onClick={() => resetZoom(380)}>⊙</button>
      </div>
    </div>
  );
}
