import { IconGlobe } from './icons';
import { scoreClass, scoreHex } from '../lib/utils';
import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Link className="tt-logo" to="/">
      <IconGlobe size={22}/>
      <span>Trip<i>Tailor</i></span>
    </Link>
  );
}

export function Score({ value, size = 28, label = true }: { value: number; size?: number; label?: boolean }) {
  const cls = scoreClass(value);
  return (
    <span className={"score " + cls} style={{ fontSize: size }}>
      {value}{label && <sup>/100</sup>}
    </span>
  );
}

export function MiniBars({
  scores, monthIdx, width = 240, height = 56, accent = '#d97757',
}: { scores: number[]; monthIdx: number; width?: number; height?: number; accent?: string }) {
  const w = width / scores.length;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" width="100%" height={height} aria-hidden="true">
      {scores.map((s, i) => {
        const h = Math.max(2, (s / 100) * (height - 6));
        const color = i === monthIdx
          ? accent
          : (s >= 80 ? '#22b07a' : s >= 65 ? '#e7b54b' : s >= 50 ? '#e08543' : 'rgba(245,237,224,0.18)');
        return <rect key={i} x={i*w + 1} y={height - h} width={w - 2} height={h} rx="1.5" fill={color}/>;
      })}
    </svg>
  );
}

export function ScoreRing({ value, size = 120, stroke = 8 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  const color = scoreHex(value);
  return (
    <svg width={size} height={size} className="score-ring" aria-hidden="true">
      <circle cx={size/2} cy={size/2} r={r} stroke="rgba(245,237,224,0.08)" strokeWidth={stroke} fill="none"/>
      <circle cx={size/2} cy={size/2} r={r}
              stroke={color} strokeWidth={stroke} fill="none"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={c * 0.25}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray .6s cubic-bezier(.16,1,.3,1)' }}/>
      <text x="50%" y="51%" textAnchor="middle" dominantBaseline="middle"
            fontFamily="Instrument Serif, serif" fontStyle="italic"
            fontSize={size * 0.42} fill={color} letterSpacing="-0.02em">
        {value}
      </text>
    </svg>
  );
}
