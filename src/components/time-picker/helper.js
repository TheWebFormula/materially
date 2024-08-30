import device from '../../helpers/device.js';

export function getHourStep(stepValue) {
  return Math.max(1, Math.floor(parseInt(stepValue || 1) / 3600))
}

export function getMinuteStep(stepValue) {
  const step = Math.max(1, Math.floor(parseInt(stepValue || 1) / 60));
  if (step > 30) return -1;
  return step;
}

export function getHourData(stepValue, force24) {
  const hourStep = getHourStep(stepValue);
  const hourCount = 12 / hourStep;

  let data = [...new Array(hourCount)].map((_, i) => {
    const hour = i === 0 ? 12 : i * hourStep;
    const paddedHour = hour < 10 ? `0${hour}` : hour;
    const theta = 30 * (i * hourStep);
    return {
      theta: `${theta}`,
      hour: hour,
      paddedHour: `${paddedHour}`,
      is24: false
    };
  });

  if (force24 || device.hourCycle === 'h24') {
    data[0].hour = 0;
    data[0].paddedHour = '00';
    data = data.concat([...new Array(hourCount)].map((_, i) => {
      const hour = i === 0 ? 12 : (i * hourStep) + 12;
      const paddedHour = hour < 10 ? `0${hour}` : hour;
      const theta = 30 * (i * hourStep);
      return {
        theta: `${theta}`,
        hour: hour,
        paddedHour: `${paddedHour}`,
        is24: true
      };
    }));
  }

  return data;
}


export function getMinuteData(stepValue) {
  const minuteStep = getMinuteStep(stepValue);
  if (minuteStep === -1) return [];

  const minuteCount = 60 / minuteStep;
  return [...new Array(minuteCount)].map((_, i) => {
    const minute = i * minuteStep;
    const paddedMinute = minute < 10 ? `0${minute}` : minute;
    const theta = 6 * (i * minuteStep);
    return {
      theta: `${theta}`,
      minute: minute,
      paddedMinute: `${paddedMinute}`,
      display: minute % 5 === 0
    };
  });
}


export function getHour(value, meridiem) {
  let hour = parseInt(value);
  let hour24 = hour;
  if (device.hourCycle !== 'h24') {
    if (meridiem === 'PM') {
      if (hour > 12) hour -= 12
      if (hour24 < 12) hour24 += 12;
    }
    if (hour === 0) hour = 12;
  } else {
    if (meridiem === 'PM' && hour < 12) hour += 12
  }
  let paddedHour24 = hour24 < 10 ? `0${hour24}` : `${hour24}`;

  return {
    hour,
    hour24,
    paddedHour: hour < 10 ? `0${hour}` : `${hour}`,
    paddedHour24
  };
}

export function getPaddedHour24(hour24, meridiem) {
  hour24 = parseInt(hour24);
  if (device.hourCycle === 'h24') return hour < 10 ? `0${hour24}` : `${hour24}`;

  let paddedHour24 = hour24;
  if (meridiem === 'PM' && hour24 < 12) paddedHour24 = hour24 + 12;
  else if (meridiem === 'AM' && hour24 > 11) paddedHour24 = hour24 - 12;
  if (paddedHour24 < 10) paddedHour24 = `0${paddedHour24}`;
  return paddedHour24;
}

export function parseTime(value) {
  const split = value.split(':');
  let hour = parseInt(split[0]);
  const meridiem = hour > 12 ? 'PM' : 'AM';

  if (device.hourCycle !== 'h24') {
    if (hour > 12) hour = hour - 12;
    if (hour === 0) hour = 12;
  }

  return {
    hour,
    minute: parseInt(split[1]),
    meridiem
  };
}


export function parseTextfieldTime(textfield) {
  let hour;
  let minute;
  const time = textfield.value;

  if (time) {
    const split = time.split(':');
    hour = parseInt(split[0]);
    minute = parseInt(split[1]);
  } else {
    const date = new Date();
    const hourStep = getHourStep(textfield.step);
    hour = Math.round(date.getHours() / hourStep) * hourStep;
    if (hour < 10) hour = `0${hour}`;
    const minuteStep = getMinuteStep(textfield.step);
    minute = minuteStep === -1 ? 0 : Math.round(date.getMinutes() / minuteStep) * minuteStep;
    if (minute < 10) minute = `0${minute}`;
  }

  return {
    hour,
    minute,
    meridiem: hour > 12 ? 'PM' : 'AM'
  };
}
