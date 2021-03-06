import { differenceInSeconds } from 'date-fns';
import convertDateTime from './convert';
import get from './get';
import round from './round';

function sum(list, key) {
  let result = 0;
  list.forEach((l) => {
    if (l.metadata) result += l.metadata[key];
  });
  return result;
}

export function counter(list, key, metaKey) {
  let result = [];
  list.forEach((l) => {
    if (key && !l.metadata) return;
    const index = result.findIndex(
      (r) => r.name === get(l, `metadata.${key}`, l.message)
    );

    if (index >= 0) {
      let item = result[index];
      item.count++;
      item.values = item.values + get(l, `metadata.${metaKey}`, 0);
    } else if (key && l.metadata[key]) {
      result.push({
        name: l.metadata[key],
        count: 1,
        values: get(l, `metadata.${metaKey}`, 0)
      });
    } else {
      result.push({
        name: l.message,
        count: 1,
        values: get(l, `metadata.${metaKey}`, 0)
      });
    }
  });

  return result.sort((a, b) => b.count - a.count);
}

export function createTimeLineData(
  data = [],
  type = 'amount',
  metaKey,
  steps = 50
) {
  if (!data || data.length === 0) return [];

  const firstDate = new Date(data[data.length - 1]['timestamp']);
  const lastDate = new Date(data[0]['timestamp']);
  const interval = Math.round(
    differenceInSeconds(lastDate, firstDate) / (steps - 1)
  );
  const groups = [];

  for (let i = 0; i < steps; i++) {
    const start = firstDate.toISOString();
    const end = new Date(
      firstDate.setSeconds(firstDate.getSeconds() + interval)
    ).toISOString();
    const timebox = convertDateTime(start);
    const filteredData = data.filter(
      (d) => d['timestamp'] <= end && d['timestamp'] >= start
    );

    let value;
    if (type === 'amount') value = filteredData.length;
    else if (type === 'total') value = sum(filteredData, metaKey);
    else if (type === 'average') {
      value = sum(filteredData, metaKey);
      if (value !== 0) value = value / filteredData.length;
    }

    groups.push({ timebox, [type]: round(value), count: filteredData.length });
  }

  return groups;
}

export function highest(list, key, nameKey) {
  const result = [...list]
    .sort((a, b) => get(b, `metadata.${key}`, 0) - get(a, `metadata.${key}`, 0))
    .slice(0, 10);

  return result.map((t) => ({
    name: get(t, `metadata.${nameKey}`, t.message),
    count: `${round(get(t, `metadata.${key}`))}ms`
  }));
}
