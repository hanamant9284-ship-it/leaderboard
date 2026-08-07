import { format } from 'date-fns';
import tzPkg from 'date-fns-tz';
import { TIMEZONE } from './config.js';

const { utcToZonedTime } = tzPkg;

function getZonedDate(date) {
  return utcToZonedTime(date, TIMEZONE);
}

export function getDailyKey(date) {
  const zoned = getZonedDate(date);
  const day = format(zoned, 'yyyy-MM-dd');
  return `lb:global:daily:${day}`;
}

export function getWeeklyKey(date) {
  const zoned = getZonedDate(date);
  const week = format(zoned, "RRRR-'W'II");
  return `lb:global:weekly:${week}`;
}

export function getMonthlyKey(date) {
  const zoned = getZonedDate(date);
  const month = format(zoned, 'yyyy-MM');
  return `lb:global:monthly:${month}`;
}
