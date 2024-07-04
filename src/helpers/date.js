const mcDate = new class MCDate {
  #intlFormatter;
  #intlFormatterLong;
  #locale;
  #timeZone;
  #yearMonthDayRegex = /([12]\d{3})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?!\S)/;
  #yearMonthRegex = /([12]\d{3})-(0[1-9]|1[0-2])(?!\S)/;
  #formatPatternRegex = /[YMDdAaHhms]+/g;

  get locale() {
    if (!this.#locale) {
      const intlOptions = Intl.DateTimeFormat().resolvedOptions();
      this.#locale = intlOptions.locale;
    }
    return this.#locale;
  }
  set locale(value) {
    try {
      Intl.DateTimeFormat(value);
    } catch {
      throw Error('invalid locale value');
    }

    this.#locale = value;
    this.#setFormatters();
  }

  get timeZone() {
    if (!this.#timeZone) {
      const intlOptions = Intl.DateTimeFormat().resolvedOptions();
      this.#timeZone = intlOptions.timeZone;
    }
    return this.#timeZone;
  }
  set timeZone(value) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: value });
    } catch {
      throw Error('invalid timeZone value');
    }

    this.#timeZone = value;
    this.#setFormatters();
  }

  parse(value) {
    if (value === undefined) return undefined;

    // this will return an invalid date abject
    if (['null', 'undefined', 'Invalid Date'].includes(value)) return new Date('');

    if (typeof value === 'number') return new Date(value);

    // format used for inputs yyyy-mm-dd
    if (typeof value === 'string') {
      const inputDateMatch = value.match(this.#yearMonthDayRegex);
      if (inputDateMatch) {
        const [_, year, month, day] = inputDateMatch;
        return this.buildFromParts({
          year,
          month,
          day
        });
      }

      const inputYearMonthMatch = value.match(this.#yearMonthRegex);
      if (inputYearMonthMatch) {
        const [_, year, month] = inputYearMonthMatch;
        return this.buildFromParts({
          year,
          month,
          day: '01'
        });
      }
    }

    return new Date(Date.parse(value));
  }


  // format dates
  //   date: js date object
  //   formatPattern:
  //      ddd, MMM DD = Thu, Dec 12
  //      YYYY-MMMM-dddd = 2019-month-wednesday
  //      YY/MMM/ddd = 19/10/22
  format(date, pattern) {
    if (!this.isValid(date)) return;

    if (!this.#intlFormatter) this.#setFormatters();
    const tokens = this.#intlFormatter.formatToParts(date).filter(token => token.type !== 'literal');
    const tokensLong = this.#intlFormatterLong.formatToParts(date)
      .filter(token => token.type !== 'literal')
      .map(token => ({
        type: `l${token.type}`,
        value: token.value
      }));
    const parts = [...tokens, ...tokensLong].reduce((parts, token) => {
      parts[token.type] = token.value;
      return parts;
    }, {});
    const formatters = {
      YYYY: parts => parts.year, // 2019
      YY: parts => parts.year.slice(-2), // 19
      MMMM: parts => parts.lmonth, // December
      MMM: parts => parts.lmonth.slice(0, 3), // Dec
      MM: parts => parts.month, // 12
      DD: parts => parts.day, // 21
      dd: parts => parts.day, // 21
      dddd: parts => parts.weekday, // Saturday
      ddd: parts => parts.weekday.slice(0, 3), // Sat
      A: parts => parts.dayPeriod, // AM / PM
      a: parts => parts.dayPeriod.toLowerCase(), // am / pm
      HH: parts => parts.lhour, // 00
      hh: parts => parts.hour, // 12
      mm: parts => parts.minute, // 23
      ss: parts => parts.second // 54
    };

    return pattern.replace(this.#formatPatternRegex, mask => {
      return (formatters[mask] || this.#defaultFormatter)(parts, date)
    });
  }

  buildFromParts({ year, month, day }) {
    return new Date(year, month - 1, day);
  }

  isValid(date) {
    if (date === undefined) return false;
    if (date.constructor.name !== 'Date') return false;
    return !isNaN(date.getTime());
  }

  today() {
    return new Date();
  }

  getYear(date) {
    return date.getFullYear();
  }

  getMonth(date) {
    return date.getMonth() + 1;
  }

  getWeekDay(date) {
    return date.getDay();
  }

  getMonthDay(date) {
    return date.getDate();
  }

  getFirstDateOfMonth(date) {
    return new Date(this.getYear(date), this.getMonth(date) - 1, 1);
  }

  getMonthNames() {
    const formatter = new Intl.DateTimeFormat(this.locale, { month: 'long', timeZone: this.timeZone });
    return [...Array(12).keys()].map((m) => formatter.format(new Date(Date.UTC(2021, (m + 1) % 12))));
  }

  getMonthNamesShort() {
    const formatter = new Intl.DateTimeFormat(this.locale, { month: 'short', timeZone: this.timeZone });
    return [...Array(12).keys()].map((m) => formatter.format(new Date(Date.UTC(2021, (m + 1) % 12))));
  }

  getParts(date) {
    return {
      year: this.getYear(date),
      month: this.getMonth(date),
      day: this.getMonthDay(date)
    };
  }

  addToDateByParts(date, { year, month, day }) {
    const parts = this.getParts(date);
    if (year) parts.year += year;
    if (month) parts.month += month;
    if (day) parts.day += day;
    return this.buildFromParts(parts);
  }

  setDateByParts(date, { year, month, day }) {
    const parts = this.getParts(date);
    if (year) parts.year = year;
    if (month) parts.month = month;
    if (day) parts.day = day;
    return this.buildFromParts(parts);
  }

  // style = 'long' | 'short' | 'narrow'
  getDayNames(style) {
    const format = new Intl.DateTimeFormat(this.locale, { weekday: style }).format;
    return [...Array(7).keys()]
      .map(day => format(new Date(Date.UTC(2021, 5, day))));
  }

  // used for generating a array of years for a calendar
  defaultYearRange(startYear = this.getYear(new Date()) - 50, range = 100) {
    return [...new Array(range)].map((_, i) => startYear + i);
  }

  getMonthDays(date, { fillNextMonth = false, fillPreviousMonth = true, minDate, maxDate, extraRow = true }) {
    if (minDate && !this.isValid(minDate)) minDate = undefined;
    if (maxDate && !this.isValid(maxDate)) maxDate = undefined;

    const firstDay = this.getWeekDay(this.getFirstDateOfMonth(date));
    const year = this.getYear(date);
    const month = this.getMonth(date);
    const todayParts = this.getParts(this.today());

    // start on sunday
    let currentDate = this.setDateByParts(date, { day: 1 });
    currentDate = this.addToDateByParts(currentDate, { day: -firstDay });

    const count = extraRow === false ? 5 * 7 : 6 * 7;
    const monthDays = [...Array(count)].map((_, i) => {
      const date = currentDate;
      const parts = this.getParts(date);

      // -1, 0, 1
      let monthOffset = 0;
      if (parts.year < year) monthOffset = -1;
      if (parts.year > year) monthOffset = 1;
      if (parts.year === year && parts.month < month) monthOffset = -1;
      if (parts.year === year && parts.month > month) monthOffset = 1;

      const display = (fillPreviousMonth && monthOffset < 0) || (fillNextMonth && monthOffset > 0) || monthOffset === 0 ? parts.day : '';
      const currentMonth = parts.month === month;
      const beforeMinDate = minDate ? date.getTime() < minDate.getTime() : false;
      const afterMaxDate = maxDate ? date.getTime() > maxDate.getTime() : false;
      const interactive = !beforeMinDate && !afterMaxDate && display !== '';
      const isToday = todayParts.year === parts.year && todayParts.month === parts.month && todayParts.day === parts.day;
      const dayOfWeek = date.getDay();

      currentDate = this.addToDateByParts(date, { day: 1 });

      return {
        date,
        display,
        interactive,
        currentMonth,
        beforeMinDate,
        afterMaxDate,
        isToday,
        dayOfWeek
      };
    });

    // split into week rows
    const weeks = [];
    while (monthDays.length) {
      weeks.push(monthDays.splice(0, 7));
    }
    return weeks;
  }

  #setFormatters() {
    this.#intlFormatter = Intl.DateTimeFormat(this.locale, {
      weekday: 'long', // dddd
      year: 'numeric', // YYYY
      month: '2-digit', // MM
      day: '2-digit', // DD
      hour: '2-digit', // hh
      minute: '2-digit', // mm
      second: '2-digit', // ss
      timeZone: this.timeZone
    });

    this.#intlFormatterLong = Intl.DateTimeFormat(this.locale, {
      month: 'long',
      hour: '2-digit',
      hour12: false,
      timeZone: this.timeZone
    });
  }

  #defaultFormatter(v) {
    return v;
  }
};

window.mcDate = mcDate;
export default mcDate;
