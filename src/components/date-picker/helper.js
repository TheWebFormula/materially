import dateUtil from '../../helpers/date.js';


const monthDaysTemplateCache = {};
export function monthDaysTemplate(date, minDate, maxDate) {
  const key = `${date.getFullYear()}${date.getMonth()}${minDate ? minDate.getTime() : ''}${maxDate ? maxDate.getTime() : ''}`;
  if (!monthDaysTemplateCache[key]) {
    const lastDayInMonth = dateUtil.setDateByParts(dateUtil.addToDateByParts(date, { month: 1 }), { day: -1 }).getDate() + 1;
    monthDaysTemplateCache[key] = dateUtil.getMonthDays(date, {
      fillPreviousMonth: false,
      fillNextMonth: false,
      minDate,
      maxDate
    })
      .map(week => week.map(({ display, date, currentMonth, beforeMinDate, afterMaxDate, interactive, isToday }, i) => {
        let classes = 'day';
        if (beforeMinDate || afterMaxDate) classes += ' out-of-range';
        if (interactive) classes += ' interactive';
        if (isToday) classes += ' today';
        if (!currentMonth) classes += ' not-current-month';
        if (currentMonth && date.getDate() === 1) classes += ' first-day';
        if (currentMonth && date.getDate() === lastDayInMonth) classes += ' last-day';
        if (i === 0) classes += ' sunday';
        if (i === 6) classes += ' saturday';
        const formattedDate = dateUtil.format(date, 'YYYY-MM-dd');
        return /* html */`<div class="${classes}" date="${formattedDate}" day="${display}">${display}</div>`;
      }).join('\n')).join('\n');
  }
  return monthDaysTemplateCache[key];
}
