const replaceStringGroupRegex = /(\$[\d\&])/;
const regexGroupMatcher = /(\((?:\?\<\w+\>)?([^\)]+)\)\??)/g;
const navigationKeys = [
  'Backspace',
  'Delete',
  'Shift',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Tab'
];

// TODO fix cursor position (check ssn mask example)

export default class Formatter {
  #textfield;
  #input;
  #rawValue = '';
  #displayValue = '';
  #format;
  #formattedValue = '';
  #formatParts;
  #formatSplitter;
  #maskedValue = '';
  #pattern;
  #patternRegex;
  #mask;
  #parser;
  #partialParser;
  #patternRestrict = false;
  #maskParts;
  #inputCallback;
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #keyDown_bound = this.#keyDown.bind(this);
  #paste_bound = this.#paste.bind(this);


  constructor(textfield) {
    this.#textfield = textfield;
    this.#input = this.#textfield.shadowRoot.querySelector('input');
    this.#pattern = this.#textfield.pattern;
    this.#format = this.#textfield.format;
    this.#mask = this.#textfield.mask;
    this.#patternRestrict = this.#textfield.patternRestrict;

    this.#buildFormat();
    this.#buildMask();
    this.#setPattern();

    this.#input.value = this.#valueSetter(this.#textfield.value);

    // intercept the value property on the input
    const that = this;
    const inputDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    Object.defineProperty(this.#input, 'value', {
      get: function () {
        return that.#rawValue;
      },
      set: function (value) {
        value = that.#valueSetter(value);
        return inputDescriptor.set.call(this, value);
      }
    });


    this.#textfield.addEventListener('focus', this.#focus_bound);
  }

  get value() { return this.#rawValue; }
  get displayValue() { return this.#displayValue; }
  get formattedValue() { return this.#formattedValue; }
  get maskedValue() { return this.#maskedValue; }

  set onInput(callback = () => { }) {
    if (typeof callback !== 'function') this.#inputCallback = undefined;
    else this.#inputCallback = callback;
  }

  destroy() {
    this.#blur();
    this.#textfield.removeEventListener('focus', this.#focus_bound);
  }


  // Convert format into parts to allow for partial formatting
  #buildFormat() {
    if (!this.#format) return;
    this.#formatParts = this.#convertFormatStringToParts(this.#format);
    // new format string with a unique separator to make it easy to partially format.
    this.#formatSplitter = this.#formatParts.filter(v => v.match(replaceStringGroupRegex)).join('_:_');
  }

  #buildMask() {
    if (!this.#mask) return;
    this.#maskParts = this.#convertFormatStringToParts(this.#mask);
  }

  #convertFormatStringToParts(str) {
    const parts = str.split(replaceStringGroupRegex);
    // for some reason splitting with regex will inset spaces. This will remove them if not already existing
    if (parts[0] === '' && str[0] !== parts[0]) parts.splice(0, 1);
    if (str[str.length - 1] !== parts[parts.length - 1]) parts.splice(-1);
    return parts;
  }


  // add regex slashes and begin and end operators (/^ $/)
  #setPattern() {
    if (!this.#pattern) return;

    // do not use pattern for masking because it will not be valid.
    if (!this.#mask) this.#input.pattern = this.#pattern;
    else this.#input.removeAttribute('pattern');

    this.#patternRegex = new RegExp(this.#pattern);
    let i = 0;
    // make all groups after first optional. This enables partial formatting
    const modified = this.#pattern.replace(regexGroupMatcher, (_match, value) => {
      if (i > 0 && value.slice(-1) !== '?') value += '?';
      i += 1;
      return value;
    });

    // remove regex slashes
    // remove $ from end so we can parse portions
    // add ^ at beginning if non existing
    this.#parser = new RegExp(`^${modified.replace(/^\//, '').replace(/^\^/, '').replace(/(?<!\\)\$$/, '').replace(/\/$/, '')}`);
    this.#partialParser = partialMatchRegex(this.#pattern);
  }


  #valueSetter(value) {
    value = value || '';
    if (!this.#parser || !this.#input) {
      this.#rawValue = value;
      return value;
    }

    // remove characters that do not match
    if (this.#patternRestrict) {
      const stripped = this.#stripInvalidCharacters(value);
      value = stripped;
    }

    const parsed = value.match(this.#parser);

    // if value was set with the mask do not re-mask. This could be value on render or from server
    if (!parsed && this.#mask && this.#checkIfValueIsMask(value)) {
      this.#rawValue = value;
      this.#formattedValue = value;
      this.#displayValue = value;
      return this.#displayValue;
    }

    // no formatting
    if (!parsed || !this.#format) {
      this.#rawValue = value;
      this.#formattedValue = value;
      if (this.#mask) this.#maskedValue = this.#maskValue(value, false);
      this.#displayValue = this.#maskValue(value, false);
      return this.#displayValue;
    }

    this.#formattedValue = this.#formatValue(value);
    if (this.#mask) this.#maskedValue = this.#maskValue(this.#formattedValue);
    this.#displayValue = this.#maskedValue || this.#formattedValue;
    this.#rawValue = value;
    return this.#displayValue;
  }

  // remove characters that do not match
  //  This uses a modified version of the pattern regex that can check per character
  #stripInvalidCharacters(value, chars = '') {
    if (value.length === 0) return value;
    const valid = value.match(this.#partialParser);
    if (valid === null) return this.#stripInvalidCharacters(value.slice(0, value.length - 1), chars += value.slice(-1));
    return value;
  }

  #checkIfValueIsMask(value) {
    if (!this.#mask) return false;
    if (value.length < this.#mask.length) return false;

    // check if all non group matchers exist in value
    const nonGroupMatches = this.#maskParts
      .filter(v => v.match(replaceStringGroupRegex) === null)
      .filter(v => !value.includes(v)).length;
    return nonGroupMatches === 0;
  }

  #maskValue(value, parsed = true) {
    if (!this.#mask) return value;
    // if value is not parsable then return the mask with the value length
    if (!parsed) return this.#mask.slice(0, value.length);
    // mask value and restrain its length
    const masked = value.replace(this.#parser, this.#mask);
    if (masked.length > value.length) return masked.slice(0, value.length);
    return masked;
  }

  #formatValue(value) {
    const parsed = value.match(this.#parser);
    // return raw value if it does not match
    if (!parsed) return value;

    const matchedValue = parsed[0];
    let endMatches = false;
    let matchIndex = 0;
    // characters that do not parse
    const leftOvers = value.replace(matchedValue, '');

    /* match part by part until no more groups matches found. This is how we partially match
     * Example:
     *   Regular: '1234'.replace(this.#parser, '$1-$2-$3') = '123--4'
     *   Parts: = '123-4'
     */
    const formatGroupMatches = matchedValue.replace(this.#parser, this.#formatSplitter).split('_:_');
    const formatted = this.#formatParts.map(v => {
      if (endMatches) return;
      if (v.match(replaceStringGroupRegex)) {
        v = formatGroupMatches[matchIndex];
        matchIndex += 1;
        if (v === '') endMatches = true;
      }
      return v;
    }).join('');

    return `${formatted}${leftOvers}`;
  }


  #focus() {
    if (!this.#format) return;
    if (!this.#pattern) throw Error('Must set pattern before enabling');

    this.#textfield.addEventListener('blur', this.#blur_bound);
    this.#input.addEventListener('keydown', this.#keyDown_bound);
    this.#input.addEventListener('paste', this.#paste_bound);
  }

  #blur() {
    this.#textfield.removeEventListener('blur', this.#blur_bound);
    this.#input.removeEventListener('keydown', this.#keyDown_bound);
    this.#input.removeEventListener('paste', this.#paste_bound);
    this.#input.setAttribute('pattern', this.#pattern);
  }

  // adjust cursor so it skips past formatting
  #adjustCursor(backward = false) {
    const selectCheckValue = this.#mask ? this.#formatValue(this.#rawValue) : this.#displayValue;
    let displayStart = Math.max(0, this.#input.selectionStart + (backward ? -2 : 1));
    let rawIndex = this.#getRawSelection(selectCheckValue, displayStart);
    let nextDisplayChar = selectCheckValue[displayStart];
    let nextRawChar = this.#rawValue[rawIndex];

    let adjustedIndex = displayStart;
    while (nextDisplayChar !== nextRawChar && rawIndex > 0) {
      adjustedIndex = this.#selectionAdjustment(adjustedIndex, backward);
      nextDisplayChar = selectCheckValue[adjustedIndex];
      rawIndex = this.#getRawSelection(selectCheckValue, adjustedIndex);
      nextRawChar = this.#rawValue[rawIndex];
    }

    if (adjustedIndex !== displayStart) {
      adjustedIndex += (backward ? 2 : -1);
      this.#input.setSelectionRange(adjustedIndex, adjustedIndex)
    }
  }

  #getRawSelection(str, index) {
    let rawIndex = 0;
    str.slice(0, index).split('').filter(c => {
      if (c === this.#rawValue[rawIndex]) rawIndex += 1;
    });
    return rawIndex;
  }

  #selectionAdjustment(selection, backward = false) {
    if (backward) return selection - 1;
    return selection + 1;
  }

  #calculateCursorForValueChange(backwards, rawStart, displayStart) {
    const selectCheckValue = this.#mask ? this.#formatValue(this.#rawValue) : this.#displayValue;
    const change = backwards ? -2 : 1;
    const rc = this.#rawValue[rawStart + change];
    let index = displayStart + change;
    let dc = selectCheckValue[index];
    let count = 1;
    while (rc !== dc && index < selectCheckValue.length) {
      index += backwards ? -1 : 1;
      count += 1;
      dc = selectCheckValue[index];
    }

    return count;
  }

  #keyDown(event) {
    // Firefox does not consider the windows key to be a metaKey
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/metaKey    
    if (event.metaKey || event.getModifierState('OS') || event.getModifierState('Win')) return;

    // do not do anything on enter
    if (event.key === 'Enter') return;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      this.#adjustCursor(event.key === 'ArrowLeft');
      return;
    }

    const selection = this.#getSelection();

    if (!navigationKeys.includes(event.key)) {
      // inset input into correct position
      const arr = this.#rawValue.split('');
      const start = arr.slice(0, selection.rawStart).join('');
      const end = arr.slice(selection.rawEnd).join('');
      this.#rawValue = `${start}${event.key}${end}`;

      event.target.value = this.#rawValue;
      event.preventDefault();
      
      // if range selected move 1 forward from start
      if (selection.displayStart !== selection.displayEnd) {
        event.target.selectionStart = selection.displayStart + 1;
        event.target.selectionEnd = selection.displayStart + 1;

        // move cursor to end
      } else if (!selection.isAtEnd) {
        const count = this.#calculateCursorForValueChange(false, selection.rawStart, selection.displayStart);
        event.target.selectionStart = selection.displayEnd + count;
        event.target.selectionEnd = selection.displayEnd + count;
      }

      this.#updateValidity();
      this.#onInput();

    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      if (selection.rawStart !== selection.rawEnd) {
        const arr = this.#rawValue.split('');
        const start = arr.slice(0, selection.rawStart).join('');
        const end = arr.slice(selection.rawEnd).join('');
        this.#rawValue = `${start}${end}`;
      } else {
        this.#rawValue = `${this.#rawValue.slice(0, selection.rawStart - 1)}${this.#rawValue.slice(selection.rawEnd)}`;
      }

      event.target.value = this.#rawValue;
      event.preventDefault(); 

      if (selection.rawStart !== selection.rawEnd) {
        event.target.selectionStart = selection.displayStart;
        event.target.selectionEnd = selection.displayStart;
      } else if (selection.isAtEnd) {
        event.target.selectionStart = selection.displayStart - 1;
        event.target.selectionEnd = selection.displayStart - 1;
      } else {
        const count = this.#calculateCursorForValueChange(true, selection.rawStart, selection.displayStart);
        event.target.selectionStart = selection.displayStart - count;
        event.target.selectionEnd = selection.displayStart - count;
      }

      this.#updateValidity();
      this.#onInput();
    }
  }

  // return selection for display and raw values
  // the raw values length may not be the same as the display because of formatting
  #getSelection() {
    const displayStart = this.#input.selectionStart;
    const displayEnd = this.#input.selectionEnd;
    const selectCheckValue = this.#mask ? this.#formatValue(this.#rawValue) : this.#displayValue;
    let rawStart = this.#getRawSelection(selectCheckValue, displayStart);
    let rawEnd = this.#getRawSelection(selectCheckValue, displayEnd);
    const isSelectionAtEnd = displayEnd === this.#displayValue.length;

    return {
      displayStart,
      displayEnd,
      rawStart: rawStart,
      rawEnd: rawEnd,
      isAtEnd: isSelectionAtEnd
    };
  }

  #paste(event) {
    event.preventDefault();

    const selection = this.#getSelection();

    // inset pasted ito correct section
    if (!(event.clipboardData || window.clipboardData)) return;
    const paste = (event.clipboardData || window.clipboardData).getData('text');
    const arr = this.#rawValue.split('');
    const start = arr.slice(0, selection.rawStart).join('');
    const end = arr.slice(selection.rawEnd).join('');
    this.#rawValue = `${start}${paste}${end}`;
    event.target.value = this.#rawValue;

    // offset cursor based on formatting changes
    const previousLength = start.length + end.length + paste.length;
    const lengthDifference = this.#displayValue.length - previousLength;

    // move selection to end of pasted content
    event.target.selectionStart = selection.displayStart + paste.length + lengthDifference;
    event.target.selectionEnd = selection.displayStart + paste.length + lengthDifference;


    this.#updateValidity();
    this.#onInput();
  }

  #updateValidity() {
    const valid = this.#rawValue.match(this.#patternRegex) !== null;
    const hasPatternAttr = this.#input.hasAttribute('pattern');

    // Set pattern attribute on blur if the rawValue is invalid so validity is correct
    // We remove this while typing because the displayValue(mask) will not match the regex
    if (
      this.#mask
      && !hasPatternAttr
      && !this.#checkIfValueIsMask(this.#rawValue)
      && !valid
    ) {
      this.#input.setAttribute('pattern', this.#pattern);
    } else if (valid && hasPatternAttr) {
      this.#input.removeAttribute('pattern');
    }
  }

  #onInput() {
    if (this.#inputCallback) this.#inputCallback();
  }
}


// build a version of the pattern regex that allows per character partial validation
// Example: SSN
//   ^([0-9]{3})[\\- ]?([0-9]{2})[\\- ]?([0-9]{4})$
//   -> ^((?:[0-9]|$){3}|$)(?:[\- ]|$)?((?:[0-9]|$){2}|$)(?:[\- ]|$)?((?:[0-9]|$){4}|$)$
function partialMatchRegex(source) {
  let results = '';
  let tmp;
  let i = 0;
  let iAdd;
  let sAdd;
  const bracketMatcher = /\[(?:\\.|.)*?\]/g;
  const curlyBracketMatcher = /\{\d+,?\d*\}/g;

  const p2 = performance.now();
  while (i < source.length) {
    switch (source[i]) {
      case '\\':
        switch (source[i + 1]) {
          case 'c':
            iAdd = 3;
            sAdd = `(?:${source.slice(i, i + iAdd)}|$)`;
            break;

          case 'x':
            iAdd = 4;
            sAdd = `(?:${source.slice(i, i + iAdd)}|$)`;
            break;

          case 'u':
            if (source[i + 2] === '{') iAdd = source.indexOf('}', i) - i + 1;
            else iAdd = 6;
            sAdd = `(?:${source.slice(i, i + iAdd)}|$)`;
            break;

          case 'p':
          case 'P':
            iAdd = source.indexOf('}', i) - i + 1;
            sAdd = `(?:${source.slice(i, i + iAdd)}|$)`;
            break;

          case 'k':
            iAdd = source.indexOf('}', i) - i + 1;
            sAdd = `(?:${source.slice(i, i + iAdd)}|$)`;
            break;

          default:
            iAdd = 2;
            sAdd = `(?:${source.slice(i, i + iAdd)}|$)`;
            break;
        }
        break;

      case '[':
        bracketMatcher.lastIndex = i;
        iAdd = bracketMatcher.exec(source)[0].length;
        sAdd = `(?:${source.slice(i, i + iAdd)}|$)`;
        break;

      case '{':
        curlyBracketMatcher.lastIndex = i;
        tmp = curlyBracketMatcher.exec(source);
        if (tmp) {
          iAdd = tmp[0].length;
          sAdd = source.slice(i, i + iAdd);
        } else {
          iAdd = 1;
          sAdd = `(?:${source.slice(i, i + iAdd)}|$)`;
        }
        break;

      case '(':
        if (source[i + 1] === '?') {
          switch (source[i + 2]) {
            case ':':
              sAdd = '(?:';
              iAdd = 3;
              tmp = partialMatchRegex(source.slice(i + iAdd));
              iAdd += tmp.index;
              sAdd += tmp.results + '|$)';
              break;

            case '=':
              sAdd = '(?=';
              iAdd = 3;
              tmp = partialMatchRegex(source.slice(i + iAdd));
              iAdd += tmp.index;
              sAdd += tmp.results + ')';
              break;

            case '!':
              iAdd = 3;
              iAdd += partialMatchRegex(source.slice(i + iAdd)).index;
              sAdd = source.slice(i, i + iAdd); // here
              break;

            case '<':
              switch (source[i + 3]) {
                case '=':
                case '!':
                  iAdd = 4;
                  iAdd += partialMatchRegex(source.slice(i + iAdd)).index;
                  sAdd = source.slice(i, i + iAdd); // here
                  break;

                default:
                  iAdd = source.indexOf('>', i) - i + 1;
                  sAdd = source.slice(i, i + iAdd);
                  tmp = partialMatchRegex(source.slice(i + iAdd));
                  iAdd += tmp.index;
                  sAdd += tmp.results + '|$)';
                  break;
              }
              break;
          }
        } else {
          sAdd = source[i];
          iAdd = 1;
          tmp = partialMatchRegex(source.slice(i + iAdd));
          iAdd += tmp.index;
          sAdd += tmp.results + '|$)';
        }
        break;

      case ')':
        i += 1;
        return {
          results,
          index: i
        };

      default:
        sAdd = source[i];
        iAdd = 1;
        break;
    }

    i += iAdd;
    results += sAdd;
  }

  return new RegExp(results, 'v');
}
