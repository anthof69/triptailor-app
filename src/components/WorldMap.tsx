/* Interactive world map: d3-geo Equal-Earth projection + topojson world atlas. */

import { useEffect, useMemo, useRef, useState } from 'react';
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
}

interface FeatureCollection {
  type: 'FeatureCollection';
  features: Array<{ id?: string | number; type: 'Feature'; geometry: any; properties: any }>;
}

export function WorldMap({ monthIdx, continent, query, selectedIso, onSelect }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
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

  // d3-zoom pan/zoom
  useEffect(() => {
    if (!svgRef.current) return;
    const sv = select(svgRef.current);
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([[-200, -100], [dims.w + 200, dims.h + 100]])
      .on('zoom', (ev) => {
        const { x, y, k } = ev.transform;
        setTransform({ x, y, k });
      });
    sv.call(z);
    return () => { sv.on('.zoom', null); };
  }, [dims.w, dims.h]);

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
            return (
              <path
                key={f.id ?? `f-${fi}`}
                d={pathFn(f as any) || undefined}
                fill={fill} fillOpacity={opacity}
                stroke={isSel ? '#f5ede0' : strokeC}
                strokeWidth={(isSel ? 1.6 : 0.6) / transform.k}
                className={isSel ? 'country is-sel' : 'country'}
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
        <button className="zbtn" onClick={() => svgRef.current && select(svgRef.current).transition().duration(280).call(zoom<SVGSVGElement, unknown>().scaleBy as any, 1.5)}>+</button>
        <button className="zbtn" onClick={() => svgRef.current && select(svgRef.current).transition().duration(280).call(zoom<SVGSVGElement, unknown>().scaleBy as any, 0.67)}>−</button>
        <button className="zbtn" onClick={() => svgRef.current && select(svgRef.current).transition().duration(380).call(zoom<SVGSVGElement, unknown>().transform as any, zoomIdentity)}>⊙</button>
      </div>
    </div>
  );
}
