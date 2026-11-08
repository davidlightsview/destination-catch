// Pure scoring helpers. No network, no framework, so they can be unit tested.

export function distanceKm(aLat, aLon, bLat, bLon) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat), dLon = rad(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Smallest angle between two bearings, 0..180
export function angleDiff(a, b) {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

/**
 * Rate a spot for the given conditions.
 * cond: { windKmh, gustKmh, windFromDeg, swellM, swellPeriodS, tidePhase: 'rising'|'falling'|'slack'|null, isLowLight: bool }
 * Returns { rating: 'go'|'marginal'|'no', score, reasons: string[] }
 */
export function rateSpot(spot, cond) {
  let score = 60;
  const reasons = [];
  const hard = []; // safety stops

  const wind = cond.windKmh ?? null;
  const gust = cond.gustKmh ?? wind;
  if (wind != null) {
    if (gust >= 45) { hard.push(`Gusts to ${Math.round(gust)} km/h`); }
    else if (wind >= 30) { score -= 30; reasons.push(`Strong wind, ${Math.round(wind)} km/h`); }
    else if (wind >= 20) { score -= 12; reasons.push(`Fresh wind, ${Math.round(wind)} km/h`); }
    else { score += 8; reasons.push(`Light wind, ${Math.round(wind)} km/h`); }
  }

  const swell = cond.swellM ?? null;
  const fresh = spot.water === 'lake' || spot.water === 'fresh_river';
  if ((spot.water === 'surf' || spot.water === 'beach') && swell != null) {
    if (swell > 2.5) hard.push(`Swell ${swell.toFixed(1)} m is too big for the beach`);
    else if (swell > 1.8) { score -= 20; reasons.push(`Big swell, ${swell.toFixed(1)} m`); }
    else if (swell >= 0.5) { score += 12; reasons.push(`Good swell for gutters, ${swell.toFixed(1)} m`); }
    else { score -= 5; reasons.push(`Flat surf, ${swell.toFixed(1)} m`); }
    if (spot.beachFaces != null && cond.windFromDeg != null && wind != null && wind >= 8) {
      // Offshore wind blows from land to sea: from the opposite of the way the beach faces.
      const offshoreFrom = (spot.beachFaces + 180) % 360;
      const d = angleDiff(cond.windFromDeg, offshoreFrom);
      if (d <= 45) { score += 8; reasons.push('Offshore wind, cleaner surf'); }
      else if (d >= 135) { score -= 10; reasons.push('Onshore wind, messy surf'); }
    }
  }
  if (spot.water === 'entrance' && swell != null) {
    if (swell > 1.2) hard.push(`Swell ${swell.toFixed(1)} m: stay away from the bar`);
    else if (swell > 0.8) { score -= 15; reasons.push(`Swell ${swell.toFixed(1)} m near the bar, take care`); }
  }
  if (spot.water === 'rock' && swell != null) {
    if (swell > 1.5) hard.push(`Swell ${swell.toFixed(1)} m: too dangerous on the rocks`);
    else if (swell > 1.0) { score -= 20; reasons.push(`Swell ${swell.toFixed(1)} m, watch for wash over the wall`); }
    else { score += 6; reasons.push('Small seas, safe on the wall'); }
  }
  if (spot.water === 'ramp' && swell != null && swell > 2) {
    score -= 15; reasons.push(`Swell ${swell.toFixed(1)} m outside, stay in sheltered water`);
  }
  if (spot.access === 'boat' && ((wind != null && wind >= 25) || (gust != null && gust >= 35))) {
    score -= 15; reasons.push(`Rough for a small boat or kayak (gusts to ${Math.round(gust ?? wind)} km/h)`);
  }

  if (cond.tidePhase && !fresh) {
    if (['estuary', 'entrance', 'river', 'jetty', 'rock', 'ramp'].includes(spot.water)) {
      if (cond.tidePhase === 'rising') { score += 10; reasons.push('Run-in tide'); }
      else if (cond.tidePhase === 'falling') { score += 4; reasons.push('Run-out tide'); }
      else { score -= 6; reasons.push('Slack tide'); }
    } else if ((spot.water === 'surf' || spot.water === 'beach') && cond.tidePhase === 'rising') {
      score += 6; reasons.push('Rising tide fills the gutters');
    }
  }
  if (cond.isLowLight) { score += 8; reasons.push('Low light, fish feed more'); }

  score = Math.max(0, Math.min(100, score));
  if (hard.length) return { rating: 'no', score: 0, reasons: [...hard, ...reasons] };
  const rating = score >= 70 ? 'go' : score >= 45 ? 'marginal' : 'no';
  return { rating, score, reasons };
}

/** From a list of {time: ISO, height: m} points, find whether the tide is rising, falling or slack at `atIso`. */
export function tidePhaseAt(points, atIso) {
  if (!points || points.length < 2) return null;
  const t = Date.parse(atIso);
  let i = points.findIndex((p) => Date.parse(p.time) > t);
  if (i <= 0) return null;
  const a = points[i - 1], b = points[i];
  const span = (Date.parse(b.time) - Date.parse(a.time)) / 3.6e6;
  const rate = (b.height - a.height) / (span || 1); // m per hour
  if (Math.abs(rate) < 0.03) return 'slack';
  return rate > 0 ? 'rising' : 'falling';
}

export function inSeason(species, month) {
  return species.bestMonths ? species.bestMonths.includes(month) : true;
}
